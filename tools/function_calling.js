import { YoutubeTranscript } from "youtube-transcript";
import { evaluate } from "mathjs";

const function_declarations = [
    {
        name: "get_youtube_transcript",
        parameters: {
            type: "object",
            description:
                "Returns the transcript of a specified YouTube video. Use this to learn about the content of YouTube videos.",
            properties: {
                url: {
                    type: "string",
                    description:
                        "URL of the YouTube video to retrieve the transcript from.",
                },
            },
            required: ["url"],
        },
    },
    {
        name: "calculate",
        parameters: {
            type: "object",
            description:
                "Calculates a given mathematical equation and returns the result. Use this for calculations when writing responses. Exampled: '12 / (2.3 + 0.7)' -> '4', '12.7 cm to inch' -> '5 inch', 'sin(45 deg) ^ 2' -> '0.5', '9 / 3 + 2i' -> '3 + 2i', 'det([-1, 2; 3, 1])' -> '-7'",
            properties: {
                equation: {
                    type: "string",
                    description: "The equation to be calculated.",
                },
            },
            required: ["equation"],
        },
    },
];

/**
 * Gets the transcript of a specified YouTube video.
 * @param {object} args Object with a single property, url, which is the URL of the YouTube video.
 * @param {string} name Name of the function call.
 * @returns {array} An array of objects with a single property, functionResponse, which is an object with two properties: name and response.
 * The name property is the name of the function call, and the response property is an object with two properties: url and content.
 * The url property is the URL of the YouTube video, and the content property is the transcript of the video.
 */
async function getYoutubeTranscript(args, name) {
    const url = args.url;
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        const function_call_result_message = [
            {
                functionResponse: {
                    name: name,
                    response: {
                        url: url,
                        content: transcript,
                    },
                },
            },
        ];
        return function_call_result_message;
    } catch (error) {
        const errorMessage = `Error fetching the transcript: ${error}`;
        console.error(errorMessage);
        const function_call_result_message = [
            {
                functionResponse: {
                    name: name,
                    response: {
                        url: url,
                        content: errorMessage,
                    },
                },
            },
        ];
        return function_call_result_message;
    }
}

/**
 * Calculates a given mathematical equation and returns the result.
 * @param {object} args Object with a single property, equation, which is the equation to be calculated.
 * @param {string} name Name of the function call.
 * @returns {array} An array of objects with a single property, functionResponse, which is an object with two properties: name and response.
 * The name property is the name of the function call, and the response property is an object with two properties: equation and content.
 * The equation property is the equation that was calculated, and the content property is the result of the calculation.
 */
function calculate(args, name) {
    const equation = args.equation;
    try {
        // Evaluate the equation using mathjs
        const result = evaluate(equation).toString();
        // Return an array of objects with the function call name, equation, and content
        const function_call_result_message = [
            {
                functionResponse: {
                    name: name,
                    response: {
                        equation: equation,
                        content: result,
                    },
                },
            },
        ];
        return function_call_result_message;
    } catch (error) {
        // If there is an error, return an array of objects with the function call name, equation, and error message
        const errorMessage = `Error calculating the equation: ${error}`;
        console.error(errorMessage);
        const function_call_result_message = [
            {
                functionResponse: {
                    name: name,
                    response: {
                        equation: equation,
                        content: errorMessage,
                    },
                },
            },
        ];
        return function_call_result_message;
    }
}

/**
 * Manages the tool call by determining the function to call and calling it with the given arguments.
 * If the function does not exist, returns an error message.
 * @param {object} toolCall - an object with the name of the tool call and its arguments
 * @returns {array} an array of objects with the function call name, equation, and content
 */
async function manageToolCall(toolCall) {
    const tool_calls_to_function = {
        /**
         * Gets the transcript of a specified YouTube video.
         * @param {object} args - an object with a single property, url, which is the URL of the YouTube video.
         * @param {string} name - the name of the function call.
         */
        get_youtube_transcript: getYoutubeTranscript,
        /**
         * Calculates a given mathematical equation and returns the result.
         * @param {object} args - an object with a single property, equation, which is the equation to be calculated.
         * @param {string} name - the name of the function call.
         */
        calculate: calculate,
    };
    const functionName = toolCall.name;
    const func = tool_calls_to_function[functionName];
    if (func) {
        const args = toolCall.args;
        const result = await func(args, functionName);
        return result;
    } else {
        const errorMessage = `No function found for ${functionName}`;
        console.error(errorMessage);
        const function_call_result_message = [
            {
                functionResponse: {
                    name: functionName,
                    response: {
                        name: functionName,
                        content: errorMessage,
                    },
                },
            },
        ];
        return function_call_result_message;
    }
}

/**
 * Process an array of function calls and return a string representing the names
 * and arguments of the functions.
 * @param {Array<Object>} functionCalls - an array of objects with a `name` and
 * an `args` property.
 * @returns {string} a string representing the names and arguments of the
 * functions in the format "funcName (arg1, arg2, ...)".
 */
function processFunctionCallsNames(functionCalls) {
    return functionCalls
        .map((tc) => {
            if (!tc.name) return "";

            // convert the snake_case name to camelCase
            const formattedName = tc.name
                .split("_")
                .map((word) => {
                    if (isNaN(word)) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    }
                    return word;
                })
                .join(" ");

            // convert the object of args to a string
            const formattedArgs = tc.args
                ? Object.entries(tc.args)
                      .map(([key, value]) => {
                          // if the value is too long, truncate it with an ellipsis
                          const stringValue = String(value);
                          const truncatedValue =
                              stringValue.length > 500
                                  ? stringValue.slice(0, 500) + "..."
                                  : stringValue;
                          return `${key}: ${truncatedValue}`;
                      })
                      .join(", ")
                : "";

            // if the function has arguments, return the name and arguments
            // otherwise just return the name
            return formattedArgs
                ? `${formattedName} (${formattedArgs})`
                : formattedName;
        })
        .filter((name) => name)
        .join(", ");
}

export { function_declarations, manageToolCall, processFunctionCallsNames };
