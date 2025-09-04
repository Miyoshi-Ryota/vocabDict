const validators = require('../generated/validators');

/**
 * Send a validated native message to Swift handler.
 * - Ensures request/response conform to JSON Schema generated types.
 * - Auto-injects the `action` field.
 * @param {string} action
 * @param {Object} payload
 * @returns {Promise<Object>} validated response object
 */
async function sendNative(action, payload = {}) {
  const request = { ...payload, action };

  const vrReq = validators.validateRequest(action, request);
  if (!vrReq.valid) {
    throw new Error(`Invalid request: ${vrReq.error}`);
  }

  const response = await browser.runtime.sendNativeMessage(vrReq.data);
  const vrResp = validators.validateResponse(action, response);
  if (!vrResp.valid) {
    throw new Error(`Invalid response: ${vrResp.error}`);
  }
  return vrResp.data;
}

module.exports = { sendNative };

