/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 5000, interval = 50) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {Element} container - Container to search in (default: document)
 * @param {number} timeout - Maximum time to wait
 * @returns {Promise<Element>}
 */
async function waitForElement(selector, container = document, timeout = 5000) {
  await waitFor(() => container.querySelector(selector), timeout);
  return container.querySelector(selector);
}

/**
 * Wait for text content to appear
 * @param {Element} element - Element to check
 * @param {string} text - Text to wait for
 * @param {number} timeout - Maximum time to wait
 * @returns {Promise<void>}
 */
async function waitForText(element, text, timeout = 5000) {
  await waitFor(() => element.textContent.includes(text), timeout);
}

module.exports = {
  waitFor,
  waitForElement,
  waitForText
};
