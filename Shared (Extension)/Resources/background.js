// VocabDict Background Script - All-in-one bundle for Safari compatibility

// Message Types
const MessageTypes = {
    // Dictionary operations
    LOOKUP_WORD: 'lookup_word',
    CACHE_DICTIONARY_ENTRY: 'cache_dictionary_entry',
    GET_CACHED_ENTRY: 'get_cached_entry',
    
    // Vocabulary word operations
    ADD_WORD: 'add_word',
    GET_WORD: 'get_word',
    GET_ALL_WORDS: 'get_all_words',
    UPDATE_WORD: 'update_word',
    DELETE_WORD: 'delete_word',
    GET_WORDS_DUE_FOR_REVIEW: 'get_words_due_for_review',
    
    // Vocabulary list operations
    ADD_LIST: 'add_list',
    GET_LIST: 'get_list',
    GET_ALL_LISTS: 'get_all_lists',
    UPDATE_LIST: 'update_list',
    DELETE_LIST: 'delete_list',
    GET_DEFAULT_LIST: 'get_default_list',
    ADD_WORD_TO_LIST: 'add_word_to_list',
    REMOVE_WORD_FROM_LIST: 'remove_word_from_list',
    
    // Settings operations
    GET_SETTINGS: 'get_settings',
    UPDATE_SETTINGS: 'update_settings',
    
    // Stats operations
    GET_STATS: 'get_stats',
    UPDATE_STATS: 'update_stats',
    UPDATE_REVIEW_STATS: 'update_review_stats',
    
    // Learning operations
    GET_REVIEW_SESSION: 'get_review_session',
    SUBMIT_REVIEW_RESULT: 'submit_review_result',
    
    // UI operations
    SHOW_NOTIFICATION: 'show_notification',
    OPEN_POPUP: 'open_popup',
    CONTEXT_MENU_CLICKED: 'context_menu_clicked',
    
    // Content script operations
    SELECTION_LOOKUP: 'selection_lookup',
    SHOW_FLOATING_WIDGET: 'show_floating_widget',
    HIDE_FLOATING_WIDGET: 'hide_floating_widget'
};

const MessageStatus = {
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending'
};

// Data Models
class VocabularyWord {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.word = data.word || '';
        this.definitions = data.definitions || [];
        this.dateAdded = data.dateAdded ? new Date(data.dateAdded) : new Date();
        this.lookupCount = data.lookupCount || 1;
        this.difficulty = data.difficulty || 'medium';
        this.lastReviewed = data.lastReviewed ? new Date(data.lastReviewed) : null;
        this.nextReview = data.nextReview ? new Date(data.nextReview) : null;
        this.reviewHistory = data.reviewHistory || [];
        this.listIds = data.listIds || [];
    }

    generateId() {
        return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            word: this.word,
            definitions: this.definitions,
            dateAdded: this.dateAdded.toISOString(),
            lookupCount: this.lookupCount,
            difficulty: this.difficulty,
            lastReviewed: this.lastReviewed ? this.lastReviewed.toISOString() : null,
            nextReview: this.nextReview ? this.nextReview.toISOString() : null,
            reviewHistory: this.reviewHistory,
            listIds: this.listIds
        };
    }
}

class VocabularyList {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || 'Untitled List';
        this.description = data.description || '';
        this.wordIds = data.wordIds || [];
        this.createdDate = data.createdDate ? new Date(data.createdDate) : new Date();
        this.modifiedDate = data.modifiedDate ? new Date(data.modifiedDate) : new Date();
        this.isDefault = data.isDefault || false;
        this.sortOrder = data.sortOrder || 0;
    }

    generateId() {
        return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            wordIds: this.wordIds,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            isDefault: this.isDefault,
            sortOrder: this.sortOrder
        };
    }
}

class UserSettings {
    constructor(data = {}) {
        this.theme = data.theme || 'auto';
        this.autoAddToList = data.autoAddToList !== undefined ? data.autoAddToList : true;
        this.defaultListId = data.defaultListId || null;
        this.dailyReviewReminder = data.dailyReviewReminder || false;
        this.reminderTime = data.reminderTime || '09:00';
        this.reviewSessionSize = data.reviewSessionSize || 20;
        this.keyboardShortcuts = data.keyboardShortcuts || {
            lookup: 'Command+Shift+L',
            addToList: 'Command+Shift+A'
        };
    }

    toJSON() {
        return {
            theme: this.theme,
            autoAddToList: this.autoAddToList,
            defaultListId: this.defaultListId,
            dailyReviewReminder: this.dailyReviewReminder,
            reminderTime: this.reminderTime,
            reviewSessionSize: this.reviewSessionSize,
            keyboardShortcuts: this.keyboardShortcuts
        };
    }
}

class LearningStats {
    constructor(data = {}) {
        this.totalWords = data.totalWords || 0;
        this.wordsLearned = data.wordsLearned || 0;
        this.currentStreak = data.currentStreak || 0;
        this.longestStreak = data.longestStreak || 0;
        this.lastReviewDate = data.lastReviewDate ? new Date(data.lastReviewDate) : null;
        this.totalReviews = data.totalReviews || 0;
        this.accuracyRate = data.accuracyRate || 0;
    }

    toJSON() {
        return {
            totalWords: this.totalWords,
            wordsLearned: this.wordsLearned,
            currentStreak: this.currentStreak,
            longestStreak: this.longestStreak,
            lastReviewDate: this.lastReviewDate ? this.lastReviewDate.toISOString() : null,
            totalReviews: this.totalReviews,
            accuracyRate: this.accuracyRate
        };
    }
}

// Database wrapper
class VocabDictDatabase {
    constructor() {
        this.dbName = 'vocabdict_db';
        this.version = 1;
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('VocabDict DB: Failed to open database:', event.target.error);
                reject(new Error(`Failed to open database: ${event.target.error}`));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                
                if (!this.db) {
                    reject(new Error('Database is null after successful open'));
                } else {
                    resolve();
                }
            };

            request.onupgradeneeded = (event) => {
                console.log('VocabDict DB: Upgrading database schema...');
                const db = event.target.result;
                this.db = db; // Set db reference early for upgrade

                // Dictionary cache store
                if (!db.objectStoreNames.contains('dictionary_cache')) {
                    console.log('Creating dictionary_cache store');
                    db.createObjectStore('dictionary_cache', { keyPath: 'word' });
                }

                // Vocabulary words store
                if (!db.objectStoreNames.contains('vocabulary_words')) {
                    console.log('Creating vocabulary_words store');
                    const wordStore = db.createObjectStore('vocabulary_words', { keyPath: 'id' });
                    wordStore.createIndex('word', 'word', { unique: false });
                    wordStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                    wordStore.createIndex('nextReview', 'nextReview', { unique: false });
                }

                // Vocabulary lists store
                if (!db.objectStoreNames.contains('vocabulary_lists')) {
                    console.log('Creating vocabulary_lists store');
                    const listStore = db.createObjectStore('vocabulary_lists', { keyPath: 'id' });
                    listStore.createIndex('name', 'name', { unique: false });
                    listStore.createIndex('isDefault', 'isDefault', { unique: false });
                }

                // User settings store (single record)
                if (!db.objectStoreNames.contains('user_settings')) {
                    console.log('Creating user_settings store');
                    db.createObjectStore('user_settings');
                }

                // Learning stats store (single record)
                if (!db.objectStoreNames.contains('learning_stats')) {
                    console.log('Creating learning_stats store');
                    db.createObjectStore('learning_stats');
                }
                
                console.log('VocabDict DB: Schema upgrade complete');
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to add to ${storeName}`));
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to update in ${storeName}`));
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
        });
    }

    // Vocabulary word operations
    async addWord(wordData) {
        const word = new VocabularyWord(wordData);
        
        // Check if word already exists
        const existingWords = await this.getWordsByWord(word.word);
        if (existingWords.length > 0) {
            // Update lookup count instead of adding duplicate
            const existing = existingWords[0];
            existing.lookupCount++;
            await this.updateWord(existing);
            return existing;
        }
        
        await this.add('vocabulary_words', word.toJSON());
        return word;
    }

    async getWord(id) {
        const data = await this.get('vocabulary_words', id);
        return data ? new VocabularyWord(data) : null;
    }

    async getWordsByWord(word) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary_words'], 'readonly');
            const store = transaction.objectStore('vocabulary_words');
            const index = store.index('word');
            const request = index.getAll(word);

            request.onsuccess = () => {
                const words = request.result.map(data => new VocabularyWord(data));
                resolve(words);
            };
            request.onerror = () => reject(new Error('Failed to get words by word'));
        });
    }

    async getAllWords() {
        const data = await this.getAll('vocabulary_words');
        return data.map(wordData => new VocabularyWord(wordData));
    }

    async updateWord(word) {
        await this.update('vocabulary_words', word.toJSON());
    }

    async deleteWord(id) {
        await this.delete('vocabulary_words', id);
    }

    async getWordsDueForReview() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary_words'], 'readonly');
            const store = transaction.objectStore('vocabulary_words');
            const index = store.index('nextReview');
            const now = new Date();
            const range = IDBKeyRange.upperBound(now.toISOString());
            const request = index.getAll(range);

            request.onsuccess = () => {
                const words = request.result
                    .filter(data => data.nextReview !== null)
                    .map(data => new VocabularyWord(data));
                resolve(words);
            };
            request.onerror = () => reject(new Error('Failed to get words due for review'));
        });
    }

    // Vocabulary list operations
    async addList(listData) {
        const list = new VocabularyList(listData);
        await this.add('vocabulary_lists', list.toJSON());
        return list;
    }

    async getList(id) {
        const data = await this.get('vocabulary_lists', id);
        return data ? new VocabularyList(data) : null;
    }

    async getAllLists() {
        const data = await this.getAll('vocabulary_lists');
        return data.map(listData => new VocabularyList(listData));
    }

    async updateList(list) {
        list.modifiedDate = new Date();
        await this.update('vocabulary_lists', list.toJSON());
    }

    async deleteList(id) {
        // Remove list ID from all words
        const allWords = await this.getAllWords();
        for (const word of allWords) {
            if (word.listIds.includes(id)) {
                word.listIds = word.listIds.filter(listId => listId !== id);
                await this.updateWord(word);
            }
        }
        
        await this.delete('vocabulary_lists', id);
    }

    async getDefaultList() {
        if (!this.db) {
            console.error('VocabDict DB: Database not initialized in getDefaultList');
            return null;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['vocabulary_lists'], 'readonly');
            const store = transaction.objectStore('vocabulary_lists');
            const request = store.getAll();

            request.onsuccess = () => {
                // Find the default list from all lists
                const defaultList = request.result.find(list => list.isDefault === true);
                resolve(defaultList ? new VocabularyList(defaultList) : null);
            };
            request.onerror = () => reject(new Error('Failed to get default list'));
        });
    }

    // Settings operations
    async getSettings() {
        const data = await this.get('user_settings', 'settings');
        return new UserSettings(data || {});
    }

    async updateSettings(settings) {
        // For stores without keyPath, use put with explicit key
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['user_settings'], 'readwrite');
            const store = transaction.objectStore('user_settings');
            const request = store.put(settings.toJSON(), 'settings');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to update settings'));
        });
    }

    // Stats operations
    async getStats() {
        const data = await this.get('learning_stats', 'stats');
        return new LearningStats(data || {});
    }

    async updateStats(stats) {
        // For stores without keyPath, use put with explicit key
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['learning_stats'], 'readwrite');
            const store = transaction.objectStore('learning_stats');
            const request = store.put(stats.toJSON(), 'stats');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to update stats'));
        });
    }

    // Dictionary cache operations
    async cacheDictionaryEntry(word, entry) {
        await this.update('dictionary_cache', { word, entry, cachedAt: new Date().toISOString() });
    }

    async getCachedDictionaryEntry(word) {
        const data = await this.get('dictionary_cache', word);
        if (data) {
            // Check if cache is still valid (24 hours)
            const cachedDate = new Date(data.cachedAt);
            const now = new Date();
            const hoursDiff = (now - cachedDate) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return data.entry;
            }
        }
        return null;
    }

    // Utility methods
    async clearAllData() {
        const storeNames = ['vocabulary_words', 'vocabulary_lists', 'dictionary_cache'];
        
        for (const storeName of storeNames) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
            });
        }
    }

    async initializeDefaultData() {
        try {
            // Check if database is initialized
            if (!this.db) {
                console.error('VocabDict DB: Cannot initialize default data - database not ready');
                return;
            }
            
            // Check if default list exists
            let defaultList = await this.getDefaultList();
            if (!defaultList) {
                // Create default list
                defaultList = await this.addList({
                    name: 'My Vocabulary',
                    description: 'Default vocabulary list',
                    isDefault: true,
                    sortOrder: 0
                });
                console.log('Created default list:', defaultList.id);
            }

            // Initialize settings if not exists
            try {
                const settings = await this.getSettings();
                if (!settings.defaultListId && defaultList) {
                    settings.defaultListId = defaultList.id;
                    await this.updateSettings(settings);
                }
            } catch (error) {
                console.error('Error initializing settings:', error);
                // Continue initialization even if settings fail
            }

            // Initialize stats if not exists
            try {
                await this.getStats(); // This creates default stats if none exist
            } catch (error) {
                console.error('Error initializing stats:', error);
                // Continue initialization even if stats fail
            }
        } catch (error) {
            console.error('Error in initializeDefaultData:', error);
            throw error;
        }
    }
}

// Global variables
let db = null;
let isInitializing = false;
let initializationPromise = null;
const messageHandlers = new Map();


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.greeting === "hello")
        return Promise.resolve({ farewell: "goodbye" });
});
