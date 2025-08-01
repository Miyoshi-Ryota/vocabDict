/**
 * StorageManager - Handles all browser storage operations
 * Uses browser.storage.local for data persistence
 */
class StorageManager {
  /**
   * Get a value from storage by key
   * @param {string} key - The storage key
   * @returns {Promise<any>} The stored value or undefined
   */
  static async get(key) {
    const result = await browser.storage.local.get(key);
    return result[key];
  }

  /**
   * Set a value in storage
   * @param {string} key - The storage key
   * @param {any} value - The value to store
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    await browser.storage.local.set({ [key]: value });
  }

  /**
   * Update a value in storage
   * @param {string} key - The storage key
   * @param {Function} updateFn - Function that receives current value and returns new value
   * @returns {Promise<any>} The updated value
   */
  static async update(key, updateFn) {
    const current = await this.get(key);
    const updated = updateFn(current);
    await this.set(key, updated);
    return updated;
  }

  /**
   * Remove a value from storage
   * @param {string} key - The storage key
   * @returns {Promise<void>}
   */
  static async remove(key) {
    await browser.storage.local.remove(key);
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  static async clear() {
    await browser.storage.local.clear();
  }

  /**
   * Get all stored data
   * @returns {Promise<Object>} All stored data
   */
  static async getAll() {
    return await browser.storage.local.get(null);
  }
}

module.exports = StorageManager;
