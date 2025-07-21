// VocabDict Message Handlers

// Error handling wrapper for message handlers
function createHandler(handler) {
    return async (payload, sender) => {
        try {
            return await handler(payload, sender);
        } catch (error) {
            console.error(`Handler error in ${handler.name}:`, error);
            throw error;
        }
    };
}

// Create all handlers with dependencies injected
function createHandlers(db, TOY_DICTIONARY) {
    
    // Dictionary handlers
    /**
     * Looks up a word in the dictionary
     * @param {Object} payload - The request payload
     * @param {string} payload.word - The word to look up
     * @returns {Promise<Object>} Dictionary entry or null if not found
     */
    async function handleLookupWord({ word }) {
    // Input validation
    if (!word || typeof word !== 'string') {
        throw new Error('Word parameter is required and must be a string');
    }
    
    const normalizedWord = word.toLowerCase().trim();
    
    if (normalizedWord.length < CONSTANTS.MIN_WORD_LENGTH || 
        normalizedWord.length > CONSTANTS.MAX_WORD_LENGTH) {
        throw new Error(`Word must be between ${CONSTANTS.MIN_WORD_LENGTH} and ${CONSTANTS.MAX_WORD_LENGTH} characters`);
    }
    
    // Check cache first
    const cached = await db.getCachedDictionaryEntry(normalizedWord);
    if (cached) {
        return cached;
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
    
    return null;
}

// Word handlers
async function handleAddWord({ word }) {
    return await db.addWord(word);
}

async function handleGetWord({ wordId }) {
    return await db.getWord(wordId);
}

async function handleGetAllWords() {
    const words = await db.getAllWords();
    return words.map(w => w.toJSON());
}

async function handleUpdateWord({ word }) {
    const vocabularyWord = new VocabularyWord(word);
    return await db.updateWord(vocabularyWord);
}

async function handleDeleteWord({ wordId }) {
    return await db.deleteWord(wordId);
}

async function handleGetWordsDueForReview() {
    const words = await db.getWordsDueForReview();
    return words.map(w => w.toJSON());
}

// List handlers
async function handleAddList({ list }) {
    return await db.addList(list);
}

async function handleGetList({ listId }) {
    return await db.getList(listId);
}

async function handleGetAllLists() {
    const lists = await db.getAllLists();
    return lists.map(l => l.toJSON());
}

async function handleUpdateList({ list }) {
    const vocabularyList = new VocabularyList(list);
    return await db.updateList(vocabularyList);
}

async function handleDeleteList({ listId }) {
    return await db.deleteList(listId);
}

async function handleGetDefaultList() {
    return await db.getDefaultList();
}

/**
 * Add a word to a vocabulary list
 * @param {Object} payload - The request payload
 * @param {string} [payload.wordId] - ID of existing word
 * @param {string} [payload.listId] - Target list ID
 * @param {Object} [payload.wordData] - New word data to add
 * @returns {Promise<Object>} The word object
 */
async function handleAddWordToList({ wordId, listId, wordData }) {
    // Input validation
    if (!wordId && !wordData) {
        throw new Error('Either wordId or wordData must be provided');
    }
    
    if (wordData) {
        if (!wordData.word || typeof wordData.word !== 'string') {
            throw new Error('Word property is required in wordData');
        }
        if (!wordData.definitions || !Array.isArray(wordData.definitions)) {
            throw new Error('Definitions array is required in wordData');
        }
    }
    
    let word;
    let targetListId = listId;
    
    // If wordData provided, add word to database first
    if (wordData) {
        word = await db.addWord(wordData);
        wordId = word.id;
    } else if (wordId) {
        word = await db.getWord(wordId);
        if (!word) {
            throw new Error(`Word with ID ${wordId} not found`);
        }
    }
    
    // Get target list (use default if not specified)
    if (!targetListId) {
        const defaultList = await db.getDefaultList();
        if (!defaultList) {
            throw new Error('No default list found');
        }
        targetListId = defaultList.id;
    }
    
    const list = await db.getList(targetListId);
    if (!list) {
        throw new Error(`List with ID ${targetListId} not found`);
    }
    
    // Add word to list
    list.addWord(wordId);
    await db.updateList(list);
    
    return word.toJSON();
}

async function handleRemoveWordFromList({ wordId, listId }) {
    const list = await db.getList(listId);
    if (!list) {
        throw new Error(`List with ID ${listId} not found`);
    }
    
    list.removeWord(wordId);
    await db.updateList(list);
    
    return { success: true };
}

// Settings handlers
async function handleGetSettings() {
    const settings = await db.getSettings();
    return settings.toJSON();
}

async function handleUpdateSettings({ settings }) {
    if (!db || !db.db) {
        console.warn('Database not ready, settings update ignored');
        return;
    }
    
    // Ensure we have valid settings data
    if (!settings) {
        throw new Error('Settings data is required');
    }
    
    // Convert plain object to UserSettings instance
    const userSettings = settings instanceof UserSettings ? settings : new UserSettings(settings);
    
    return await db.updateSettings(userSettings);
}

// Stats handlers
async function handleGetStats() {
    const stats = await db.getStats();
    return stats.toJSON();
}

async function handleUpdateStats({ stats }) {
    const learningStats = new LearningStats(stats);
    return await db.updateStats(learningStats);
}

async function handleUpdateReviewStats({ wordId, correct }) {
    const word = await db.getWord(wordId);
    if (!word) {
        throw new Error(`Word with ID ${wordId} not found`);
    }
    
    word.calculateNextReview(correct);
    await db.updateWord(word);
    
    const stats = await db.getStats();
    stats.updateReviewStats(correct);
    await db.updateStats(stats);
    
    return {
        word: word.toJSON(),
        stats: stats.toJSON()
    };
}

    // Return all handlers
    return {
        handleLookupWord,
        handleAddWord,
        handleGetWord,
        handleGetAllWords,
        handleUpdateWord,
        handleDeleteWord,
        handleGetWordsDueForReview,
        handleAddList,
        handleGetList,
        handleGetAllLists,
        handleUpdateList,
        handleDeleteList,
        handleGetDefaultList,
        handleAddWordToList,
        handleRemoveWordFromList,
        handleGetSettings,
        handleUpdateSettings,
        handleGetStats,
        handleUpdateStats,
        handleUpdateReviewStats
    };
}

// Export handlers for use in init.js
// Use globalThis for service worker compatibility
if (typeof globalThis !== 'undefined') {
    globalThis.createHandlers = createHandlers;
    globalThis.handleContextMenuClick = handleContextMenuClick;
} else if (typeof window !== 'undefined') {
    window.createHandlers = createHandlers;
    window.handleContextMenuClick = handleContextMenuClick;
}

// Context menu handler
async function handleContextMenuClick(info, tab) {
    console.log('VocabDict: Context menu clicked:', info.menuItemId, info.selectionText);
    
    if (info.menuItemId === 'vocabdict-lookup' && info.selectionText) {
        const word = info.selectionText.trim();
        
        // Validate word
        if (!word || word.length < CONSTANTS.MIN_WORD_LENGTH || word.length > CONSTANTS.MAX_WORD_LENGTH) {
            console.log('VocabDict: Invalid word selection:', word);
            return;
        }
        
        // Try to send to content script
        try {
            console.log('VocabDict: Sending lookup message for word:', word);
            await browser.tabs.sendMessage(tab.id, {
                type: MessageTypes.SELECTION_LOOKUP,
                payload: { word: word }
            });
            console.log('VocabDict: Successfully sent selection lookup to content script');
        } catch (error) {
            console.error('VocabDict: Failed to send message to content script:', error);
            
            // As a fallback, we could store the word and open the popup
            try {
                // Store the word temporarily for the popup to pick up
                await browser.storage.local.set({
                    pendingLookupWord: word,
                    pendingLookupTimestamp: Date.now()
                });
                
                // Open the popup (Note: This might not work in all contexts)
                console.log('VocabDict: Stored word for popup:', word);
                
                // Alternative: Show a notification
                if (browser.notifications) {
                    browser.notifications.create({
                        type: 'basic',
                        iconUrl: 'images/icon-128.png',
                        title: 'VocabDict',
                        message: `Please open VocabDict popup to look up "${word}"`
                    });
                }
            } catch (fallbackError) {
                console.error('VocabDict: Fallback also failed:', fallbackError);
            }
        }
    }
}