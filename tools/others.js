/**
 * Pauses the execution for a specified duration.
 *
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise} A promise that resolves after the specified delay.
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a given function until it succeeds, or reaches a maximum number of attempts.
 *
 * @param {function} fn - The function to retry.
 * @param {number} maxRetries - The maximum number of attempts.
 * @param {number} [delayMs=1000] - The delay between attempts in milliseconds.
 * @return {Promise} A promise that resolves with the result of the function.
 */
async function retryOperation(fn, maxRetries, delayMs = 1000) {
    let error;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Attempt to execute the function.
            return await fn();
        } catch (err) {
            // If the function fails, log the error and keep track of it.
            console.log(`Attempt ${attempt} failed: ${err.message}`);
            error = err;
            if (attempt < maxRetries) {
                // If we haven't reached the maximum number of attempts, wait before the next try.
                console.log(`Waiting ${delayMs}ms before next attempt...`);
                await delay(delayMs);
            } else {
                // If all attempts have failed, log a final message and throw the error.
                console.log(`All ${maxRetries} attempts failed.`);
            }
        }
    }

    // If all attempts have failed, throw the error.
    throw new Error(
        `Operation failed after ${maxRetries} attempts: ${error.message}`
    );
}

export { delay, retryOperation };
