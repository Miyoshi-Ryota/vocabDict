// VocabDict Background Script - All-in-one bundle for Safari compatibility

// Toy Dictionary - 20 Common English Words for VocabDict
const TOY_DICTIONARY = {
  "hello": {
    pronunciations: [
      { type: "US", phonetic: "/həˈloʊ/" },
      { type: "UK", phonetic: "/həˈləʊ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A greeting or expression of goodwill",
        examples: ["She gave him a warm hello."]
      },
      {
        partOfSpeech: "verb", 
        meaning: "To greet with 'hello'",
        examples: ["I helloed him from across the street."]
      }
    ],
    synonyms: ["hi", "greetings", "salutations"],
    antonyms: ["goodbye", "farewell"],
    examples: [
      "Hello! How are you today?",
      "She said hello to everyone in the room."
    ]
  },
  "world": {
    pronunciations: [
      { type: "US", phonetic: "/wɜːrld/" },
      { type: "UK", phonetic: "/wɜːld/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The earth and all the people and things on it",
        examples: ["The world is a beautiful place."]
      },
      {
        partOfSpeech: "noun",
        meaning: "A particular area of activity or experience",
        examples: ["The world of technology is constantly changing."]
      }
    ],
    synonyms: ["earth", "globe", "planet"],
    antonyms: [],
    examples: [
      "Welcome to the world!",
      "The world is your oyster."
    ]
  },
  "good": {
    pronunciations: [
      { type: "US", phonetic: "/ɡʊd/" },
      { type: "UK", phonetic: "/ɡʊd/" }
    ],
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "Of high quality; satisfactory",
        examples: ["This is a good book."]
      },
      {
        partOfSpeech: "noun",
        meaning: "Something that is beneficial or advantageous",
        examples: ["Exercise is good for your health."]
      }
    ],
    synonyms: ["excellent", "fine", "great"],
    antonyms: ["bad", "poor", "terrible"],
    examples: [
      "Have a good day!",
      "That's a good idea."
    ]
  },
  "time": {
    pronunciations: [
      { type: "US", phonetic: "/taɪm/" },
      { type: "UK", phonetic: "/taɪm/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "The indefinite continued progress of existence",
        examples: ["Time flies when you're having fun."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To plan or schedule",
        examples: ["I need to time this correctly."]
      }
    ],
    synonyms: ["duration", "period", "moment"],
    antonyms: [],
    examples: [
      "What time is it?",
      "Time is money."
    ]
  },
  "work": {
    pronunciations: [
      { type: "US", phonetic: "/wɜːrk/" },
      { type: "UK", phonetic: "/wɜːk/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "Activity involving mental or physical effort",
        examples: ["I have a lot of work to do."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To engage in physical or mental activity",
        examples: ["I work from home."]
      }
    ],
    synonyms: ["job", "labor", "employment"],
    antonyms: ["rest", "leisure", "play"],
    examples: [
      "All work and no play makes Jack a dull boy.",
      "Work hard, play hard."
    ]
  }
};

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
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `word_${crypto.randomUUID()}`;
        } else {
            return `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
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
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `list_${crypto.randomUUID()}`;
        } else {
            return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
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

// Database configuration constants
const DB_CONFIG = {
    NAME: 'vocabdict_db',
    VERSION: 1,
    CACHE_EXPIRY_HOURS: 24
};

// Database wrapper
class VocabDictDatabase {
    constructor() {
        this.dbName = DB_CONFIG.NAME;
        this.version = DB_CONFIG.VERSION;
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
            // Check if cache is still valid
            const cachedDate = new Date(data.cachedAt);
            const now = new Date();
            const hoursDiff = (now - cachedDate) / (1000 * 60 * 60);
            
            if (hoursDiff < DB_CONFIG.CACHE_EXPIRY_HOURS) {
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


// Initialize extension
async function initialize() {
    // Prevent double initialization
    if (isInitializing) {
        return initializationPromise;
    }
    
    if (db && db.db) {
        console.log('VocabDict: Already initialized');
        return;
    }
    
    isInitializing = true;
    
    initializationPromise = doInitialize();
    
    try {
        await initializationPromise;
    } finally {
        isInitializing = false;
    }
    
    return initializationPromise;
}

async function doInitialize() {
    console.log('VocabDict: Starting initialization...');
    
    // Register message handlers first to handle early popup messages
    console.log('VocabDict: Registering message handlers...');
    registerMessageHandlers();
    console.log('VocabDict: Registered handlers:', messageHandlers.size, 'handlers');
    
    // Check if IndexedDB is available
    if (!('indexedDB' in self)) {
        console.error('VocabDict: IndexedDB is not available!');
        throw new Error('IndexedDB is not available');
    }
    
    
    try {
        // Initialize database
        console.log('VocabDict: Creating database instance...');
        db = new VocabDictDatabase();
        
        try {
            await db.initialize();
        } catch (dbError) {
            console.error('VocabDict: Database initialization failed:', dbError);
            throw dbError;
        }
        
        // Double-check database is ready
        if (!db.db) {
            console.error('VocabDict: Database not ready after initialize!');
            throw new Error('Database initialization did not complete properly');
        }
        
        console.log('VocabDict: Initializing default data...');
        try {
            await db.initializeDefaultData();
            console.log('VocabDict: Default data initialized');
        } catch (dataError) {
            console.error('VocabDict: Default data initialization failed:', dataError);
            // Continue anyway - the db is at least open
        }
        
        console.log('VocabDict: Database initialized successfully');
        
        // Set up context menu
        console.log('VocabDict: Setting up context menu...');
        try {
            // Remove existing menu first
            await browser.contextMenus.removeAll();
            
            browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            console.log('VocabDict: Context menu created');
        } catch (menuError) {
            console.error('VocabDict: Context menu error:', menuError);
            // Continue anyway
        }
        
        console.log('VocabDict: Extension initialized successfully');
    } catch (error) {
        console.error('VocabDict: Failed to initialize extension:', error);
        console.error('VocabDict: Error stack:', error.stack);
    }
}

// Register all message handlers
function registerMessageHandlers() {
    // Dictionary operations
    messageHandlers.set(MessageTypes.LOOKUP_WORD, handleLookupWord);
    
    // Vocabulary word operations
    messageHandlers.set(MessageTypes.ADD_WORD, handleAddWord);
    messageHandlers.set(MessageTypes.GET_WORD, handleGetWord);
    messageHandlers.set(MessageTypes.GET_ALL_WORDS, handleGetAllWords);
    messageHandlers.set(MessageTypes.UPDATE_WORD, handleUpdateWord);
    messageHandlers.set(MessageTypes.DELETE_WORD, handleDeleteWord);
    messageHandlers.set(MessageTypes.GET_WORDS_DUE_FOR_REVIEW, handleGetWordsDueForReview);
    
    // Vocabulary list operations
    messageHandlers.set(MessageTypes.ADD_LIST, handleAddList);
    messageHandlers.set(MessageTypes.GET_LIST, handleGetList);
    messageHandlers.set(MessageTypes.GET_ALL_LISTS, handleGetAllLists);
    messageHandlers.set(MessageTypes.UPDATE_LIST, handleUpdateList);
    messageHandlers.set(MessageTypes.DELETE_LIST, handleDeleteList);
    messageHandlers.set(MessageTypes.GET_DEFAULT_LIST, handleGetDefaultList);
    messageHandlers.set(MessageTypes.ADD_WORD_TO_LIST, handleAddWordToList);
    messageHandlers.set(MessageTypes.REMOVE_WORD_FROM_LIST, handleRemoveWordFromList);
    
    // Settings operations
    messageHandlers.set(MessageTypes.GET_SETTINGS, handleGetSettings);
    messageHandlers.set(MessageTypes.UPDATE_SETTINGS, handleUpdateSettings);
    
    // Stats operations
    messageHandlers.set(MessageTypes.GET_STATS, handleGetStats);
    messageHandlers.set(MessageTypes.UPDATE_STATS, handleUpdateStats);
}

// Add a simple test handler
messageHandlers.set('ping', async (payload) => {
    return { message: 'pong', timestamp: Date.now() };
});

// Add test handler to check initialization status
messageHandlers.set('check_status', async () => {
    return {
        dbInitialized: db !== null,
        handlersRegistered: messageHandlers.size,
        handlers: Array.from(messageHandlers.keys()),
        dbError: db === null ? 'Database not initialized' : 'Database OK'
    };
});

// Fallback handlers for when database initialization fails
function registerFallbackHandlers() {
    messageHandlers.set('get_all_lists', async () => {
        return [{ 
            id: 'fallback_list', 
            name: 'Fallback List (DB not initialized)', 
            wordIds: [],
            isDefault: true 
        }];
    });
    messageHandlers.set('lookup_word', async ({ word }) => {
        return {
            word: word,
            definitions: [{ 
                partOfSpeech: 'unknown', 
                meaning: 'Database not initialized - cannot lookup words' 
            }],
            error: 'Database initialization failed'
        };
    });
    console.log('VocabDict: Registered fallback handlers');
}

// Message listener
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender)
        .then(response => {
            sendResponse(response);
        })
        .catch(error => {
            console.error('Message handling error:', error);
            sendResponse({
                status: MessageStatus.ERROR,
                error: error.message
            });
        });
    
    // Return true to indicate async response
    return true;
});

async function handleMessage(request, sender) {
    const { type, payload } = request;
    
    if (!type) {
        throw new Error('Message type is required');
    }

    const handler = messageHandlers.get(type);
    
    if (!handler) {
        throw new Error(`No handler registered for message type: ${type}`);
    }

    try {
        const result = await handler(payload, sender);
        return {
            status: MessageStatus.SUCCESS,
            data: result
        };
    } catch (error) {
        console.error(`Error handling message ${type}:`, error);
        return {
            status: MessageStatus.ERROR,
            error: error.message
        };
    }
}

// Dictionary handlers
async function handleLookupWord({ word }) {
    const normalizedWord = word.toLowerCase().trim();
    
    // Check cache first
    const cached = await db.getCachedDictionaryEntry(normalizedWord);
    if (cached) {
        return { ...cached, word: normalizedWord };
    }
    
    // Look up in toy dictionary
    const entry = TOY_DICTIONARY[normalizedWord];
    if (entry) {
        const result = {
            word: normalizedWord,
            ...entry
        };
        
        // Cache the result
        await db.cacheDictionaryEntry(normalizedWord, result);
        return result;
    }
    
    // Word not found in dictionary
    return {
        word: normalizedWord,
        pronunciations: [],
        definitions: [
            {
                partOfSpeech: 'unknown',
                meaning: 'Word not found in dictionary',
                examples: []
            }
        ],
        synonyms: [],
        antonyms: [],
        examples: []
    };
}

// Word handlers
async function handleAddWord({ wordData }) {
    return await db.addWord(wordData);
}

async function handleGetWord({ id }) {
    return await db.getWord(id);
}

async function handleGetAllWords() {
    return await db.getAllWords();
}

async function handleUpdateWord({ word }) {
    return await db.updateWord(word);
}

async function handleDeleteWord({ id }) {
    return await db.deleteWord(id);
}

async function handleGetWordsDueForReview() {
    return await db.getWordsDueForReview();
}

// List handlers
async function handleAddList({ listData }) {
    return await db.addList(listData);
}

async function handleGetList({ id }) {
    return await db.getList(id);
}

async function handleGetAllLists() {
    const lists = await db.getAllLists();
    return lists.map(list => list.toJSON());
}

async function handleUpdateList({ list }) {
    return await db.updateList(list);
}

async function handleDeleteList({ id }) {
    return await db.deleteList(id);
}

async function handleGetDefaultList() {
    return await db.getDefaultList();
}

async function handleAddWordToList({ wordId, listId }) {
    const word = await db.getWord(wordId);
    if (word && !word.listIds.includes(listId)) {
        word.listIds.push(listId);
        await db.updateWord(word);
    }
    return word;
}

async function handleRemoveWordFromList({ wordId, listId }) {
    const word = await db.getWord(wordId);
    if (word) {
        word.listIds = word.listIds.filter(id => id !== listId);
        await db.updateWord(word);
    }
    return word;
}

// Settings handlers
async function handleGetSettings() {
    if (!db || !db.db) {
        // Return default settings if database not ready
        const defaultSettings = new UserSettings();
        return defaultSettings.toJSON();
    }
    const settings = await db.getSettings();
    return settings.toJSON();
}

async function handleUpdateSettings({ settings }) {
    if (!db || !db.db) {
        console.warn('Database not ready, settings update ignored');
        return;
    }
    // Convert plain object to UserSettings instance
    const userSettings = new UserSettings(settings);
    return await db.updateSettings(userSettings);
}

// Stats handlers
async function handleGetStats() {
    const stats = await db.getStats();
    return stats.toJSON();
}

async function handleUpdateStats({ stats }) {
    // Convert plain object to LearningStats instance
    const learningStats = new LearningStats(stats);
    return await db.updateStats(learningStats);
}

// Context menu handler
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'vocabdict-lookup') {
        const selectedText = info.selectionText.trim();
        if (selectedText) {
            // Send message to content script to show floating widget
            try {
                await browser.tabs.sendMessage(tab.id, {
                    type: MessageTypes.SHOW_FLOATING_WIDGET,
                    payload: { word: selectedText }
                });
            } catch (error) {
                // If content script not loaded, open popup instead
                console.log('Opening popup for word lookup:', selectedText);
                await browser.action.openPopup();
            }
        }
    }
});

// Keyboard command handler
browser.commands.onCommand.addListener(async (command) => {
    if (command === 'lookup-selection') {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            // Get selected text from content script
            try {
                await browser.tabs.sendMessage(activeTab.id, {
                    type: MessageTypes.SELECTION_LOOKUP,
                    payload: {}
                });
            } catch (error) {
                console.error('Failed to trigger selection lookup:', error);
            }
        }
    }
});

// Initialize on installation
browser.runtime.onInstalled.addListener(() => {
    console.log('VocabDict: onInstalled event fired');
    initialize().catch(error => {
        console.error('VocabDict: Initialization failed on install:', error);
    });
});

// Initialize on startup (only if not already initialized)
if (!db) {
    initialize().catch(error => {
        console.error('VocabDict: Critical initialization error:', error);
        // Register fallback handlers when DB initialization fails
        registerFallbackHandlers();
    });
}