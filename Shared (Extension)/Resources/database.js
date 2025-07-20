// VocabDict Database Operations

// Database wrapper
class VocabDictDatabase {
    constructor() {
        this.db = null;
    }
    
    async initialize() {
        return new Promise((resolve, reject) => {
            console.log('VocabDict DB: Opening database...');
            const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);
            
            request.onupgradeneeded = (event) => {
                console.log('VocabDict DB: Upgrading database schema...');
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('dictionary_cache')) {
                    console.log('Creating dictionary_cache store');
                    db.createObjectStore('dictionary_cache', { keyPath: 'word' });
                }
                
                if (!db.objectStoreNames.contains('vocabulary_words')) {
                    console.log('Creating vocabulary_words store');
                    const wordStore = db.createObjectStore('vocabulary_words', { keyPath: 'id' });
                    wordStore.createIndex('word', 'word', { unique: false });
                    wordStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                    wordStore.createIndex('nextReview', 'nextReview', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('vocabulary_lists')) {
                    console.log('Creating vocabulary_lists store');
                    const listStore = db.createObjectStore('vocabulary_lists', { keyPath: 'id' });
                    listStore.createIndex('name', 'name', { unique: false });
                    listStore.createIndex('isDefault', 'isDefault', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('user_settings')) {
                    console.log('Creating user_settings store');
                    db.createObjectStore('user_settings');
                }
                
                if (!db.objectStoreNames.contains('learning_stats')) {
                    console.log('Creating learning_stats store');
                    db.createObjectStore('learning_stats');
                }
                
                console.log('VocabDict DB: Schema upgrade complete');
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('VocabDict DB: Database opened successfully');
                
                // Initialize default data
                this.initializeDefaultData()
                    .then(() => {
                        console.log('VocabDict DB: Default data initialized');
                        resolve();
                    })
                    .catch(error => {
                        console.error('VocabDict DB: Error initializing default data:', error);
                        // Don't fail initialization if default data fails
                        resolve();
                    });
            };
            
            request.onerror = (event) => {
                console.error('VocabDict DB: Failed to open database:', event.target.error);
                reject(new Error('Failed to open database'));
            };
        });
    }
    
    // Generic CRUD operations
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to get ${key} from ${storeName}`));
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
    
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to add to ${storeName}`));
        });
    }
    
    async put(storeName, data) {
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
            request.onerror = () => reject(new Error(`Failed to delete ${key} from ${storeName}`));
        });
    }
    
    // Dictionary cache operations
    async cacheDictionaryEntry(word, entry) {
        const cacheData = {
            word: word.toLowerCase(),
            entry: entry,
            cachedAt: new Date().toISOString()
        };
        return await this.put('dictionary_cache', cacheData);
    }
    
    async getCachedDictionaryEntry(word) {
        const cached = await this.get('dictionary_cache', word.toLowerCase());
        if (!cached) return null;
        
        // Check if cache is expired (24 hours)
        const cachedDate = new Date(cached.cachedAt);
        const now = new Date();
        const hoursDiff = (now - cachedDate) / (1000 * 60 * 60);
        
        if (hoursDiff > DB_CONFIG.CACHE_EXPIRY_HOURS) {
            // Cache expired, delete it
            await this.delete('dictionary_cache', word.toLowerCase());
            return null;
        }
        
        return cached.entry;
    }
    
    // Word operations
    async addWord(wordData) {
        const word = new VocabularyWord(wordData);
        await this.add('vocabulary_words', word.toJSON());
        
        // Update stats
        const stats = await this.getStats();
        stats.totalWords++;
        await this.updateStats(stats);
        
        return word;
    }
    
    async getWord(wordId) {
        const data = await this.get('vocabulary_words', wordId);
        return data ? new VocabularyWord(data) : null;
    }
    
    async getAllWords() {
        const data = await this.getAll('vocabulary_words');
        return data.map(d => new VocabularyWord(d));
    }
    
    async updateWord(word) {
        await this.put('vocabulary_words', word.toJSON());
        return word;
    }
    
    async deleteWord(wordId) {
        await this.delete('vocabulary_words', wordId);
        
        // Update stats
        const stats = await this.getStats();
        stats.totalWords = Math.max(0, stats.totalWords - 1);
        await this.updateStats(stats);
    }
    
    async getWordsDueForReview() {
        const words = await this.getAllWords();
        const now = new Date();
        return words.filter(word => {
            if (!word.nextReview) return false;
            return new Date(word.nextReview) <= now;
        });
    }
    
    // List operations
    async addList(listData) {
        const list = new VocabularyList(listData);
        await this.add('vocabulary_lists', list.toJSON());
        return list;
    }
    
    async getList(listId) {
        const data = await this.get('vocabulary_lists', listId);
        return data ? new VocabularyList(data) : null;
    }
    
    async getAllLists() {
        const data = await this.getAll('vocabulary_lists');
        return data.map(d => new VocabularyList(d));
    }
    
    async updateList(list) {
        list.modifiedDate = new Date();
        await this.put('vocabulary_lists', list.toJSON());
        return list;
    }
    
    async deleteList(listId) {
        await this.delete('vocabulary_lists', listId);
    }
    
    async getDefaultList() {
        const lists = await this.getAllLists();
        return lists.find(list => list.isDefault) || null;
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
            
            // Ensure we have a proper settings object with toJSON method
            let settingsData;
            if (settings && typeof settings.toJSON === 'function') {
                settingsData = settings.toJSON();
            } else if (settings instanceof UserSettings) {
                // Fallback: manually create the data object
                settingsData = {
                    theme: settings.theme,
                    autoAddToList: settings.autoAddToList,
                    defaultListId: settings.defaultListId,
                    dailyReviewReminder: settings.dailyReviewReminder,
                    reminderTime: settings.reminderTime,
                    reviewSessionSize: settings.reviewSessionSize,
                    keyboardShortcuts: settings.keyboardShortcuts
                };
            } else {
                // If it's a plain object, use it directly
                settingsData = settings;
            }
            
            const request = store.put(settingsData, 'settings');

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