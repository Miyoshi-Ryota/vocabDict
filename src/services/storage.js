/**
 * StorageManager - Handles all browser storage operations
 * Uses browser.storage.local for data persistence and native messaging for CloudKit sync
 */
class StorageManager {
  static _useNativeSync = false;
  static _syncInProgress = false;
  static _lastSyncTime = 0;
  static _syncDebounceMs = 1000;

  /**
   * Check if native messaging is available
   * @returns {Promise<boolean>}
   */
  static async isNativeMessagingAvailable() {
    try {
      const response = await browser.runtime.sendNativeMessage({
        action: 'syncData'
      });
      return response && response.success;
    } catch (error) {
      console.log('Native messaging not available:', error);
      return false;
    }
  }

  /**
   * Initialize storage manager and check native sync availability
   * @returns {Promise<void>}
   */
  static async initialize() {
    try {
      this._useNativeSync = await this.isNativeMessagingAvailable();
      if (this._useNativeSync) {
        console.log('Native CloudKit sync enabled');
        await this.syncFromNative();
      } else {
        console.log('Using local storage only');
      }
    } catch (error) {
      console.error('Failed to initialize StorageManager:', error);
      this._useNativeSync = false;
    }
  }

  /**
   * Sync vocabulary lists to native app
   * @param {Array} lists - The vocabulary lists
   * @returns {Promise<Object>}
   */
  static async syncVocabularyListsToNative(lists) {
    if (!this._useNativeSync || !lists) return { success: false };

    try {
      const oldLists = await this.get('vocab_lists_cache') || [];
      
      for (const list of lists) {
        const oldList = oldLists.find(l => l.id === list.id);
        
        if (!oldList || JSON.stringify(oldList) !== JSON.stringify(list)) {
          const words = list.words || {};
          
          for (const [normalizedWord, wordData] of Object.entries(words)) {
            const oldWord = oldList?.words?.[normalizedWord];
            
            if (!oldWord || JSON.stringify(oldWord) !== JSON.stringify(wordData)) {
              await browser.runtime.sendNativeMessage({
                action: 'addWord',
                word: wordData.word,
                listId: list.id,
                metadata: {
                  difficulty: wordData.difficulty,
                  customNotes: wordData.customNotes,
                  dateAdded: wordData.dateAdded,
                  lastReviewed: wordData.lastReviewed,
                  nextReview: wordData.nextReview,
                  reviewHistory: wordData.reviewHistory
                }
              });
            }
          }
        }
      }
      
      await browser.storage.local.set({ vocab_lists_cache: lists });
      return { success: true };
    } catch (error) {
      console.error('Failed to sync to native:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync data from native app to local storage
   * @returns {Promise<void>}
   */
  static async syncFromNative() {
    if (this._syncInProgress || !this._useNativeSync) return;
    
    this._syncInProgress = true;
    try {
      const [listsResponse, settingsResponse] = await Promise.all([
        browser.runtime.sendNativeMessage({ action: 'getVocabularyLists' }),
        browser.runtime.sendNativeMessage({ action: 'getSettings' })
      ]);
      
      if (listsResponse && listsResponse.vocab_lists) {
        await browser.storage.local.set({ 
          vocab_lists: listsResponse.vocab_lists,
          vocab_lists_cache: listsResponse.vocab_lists
        });
      }
      if (settingsResponse && settingsResponse.settings) {
        await browser.storage.local.set({ settings: settingsResponse.settings });
      }
      
      this._lastSyncTime = Date.now();
    } catch (error) {
      console.error('Sync from native failed:', error);
    } finally {
      this._syncInProgress = false;
    }
  }

  /**
   * Debounced sync trigger
   */
  static async triggerDebouncedSync() {
    const now = Date.now();
    if (now - this._lastSyncTime < this._syncDebounceMs) {
      return;
    }
    
    this._lastSyncTime = now;
    setTimeout(() => {
      if (this._useNativeSync) {
        browser.runtime.sendNativeMessage({ action: 'syncData' }).catch(console.error);
      }
    }, this._syncDebounceMs);
  }

  /**
   * Get a value from storage by key
   * @param {string} key - The storage key
   * @returns {Promise<any>} The stored value or undefined
   */
  static async get(key) {
    if (key === 'vocab_lists' && this._useNativeSync) {
      try {
        const response = await browser.runtime.sendNativeMessage({
          action: 'getVocabularyLists'
        });
        if (response && response.vocab_lists) {
          await browser.storage.local.set({ vocab_lists: response.vocab_lists });
          return response.vocab_lists;
        }
      } catch (error) {
        console.error('Failed to fetch from native:', error);
      }
    }
    
    if (key === 'settings' && this._useNativeSync) {
      try {
        const response = await browser.runtime.sendNativeMessage({
          action: 'getSettings'
        });
        if (response && response.settings) {
          await browser.storage.local.set({ settings: response.settings });
          return response.settings;
        }
      } catch (error) {
        console.error('Failed to fetch settings from native:', error);
      }
    }
    
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
    
    if (key === 'vocab_lists' && this._useNativeSync) {
      await this.syncVocabularyListsToNative(value);
      this.triggerDebouncedSync();
    }
    
    if (key === 'settings' && this._useNativeSync) {
      try {
        await browser.runtime.sendNativeMessage({
          action: 'updateSettings',
          settings: value
        });
        this.triggerDebouncedSync();
      } catch (error) {
        console.error('Failed to update settings in native:', error);
      }
    }
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
    if (this._useNativeSync) {
      await this.syncFromNative();
    }
    return await browser.storage.local.get(null);
  }
}

module.exports = StorageManager;
