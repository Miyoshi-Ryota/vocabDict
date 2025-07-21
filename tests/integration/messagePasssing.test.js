/**
 * Integration tests for VocabDict message passing system - Real Implementation
 * Tests actual message flow using real init.js and handlers
 */

// Setup fake IndexedDB for testing
require('fake-indexeddb/auto');

const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
const fs = require('fs');
const path = require('path');

// Import real implementations
const constantsPath = path.join(__dirname, '../../Shared (Extension)/Resources/constants.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');
eval(constantsCode);

const modelsPath = path.join(__dirname, '../../Shared (Extension)/Resources/models.js');
const modelsCode = fs.readFileSync(modelsPath, 'utf8');
eval(modelsCode);

const databasePath = path.join(__dirname, '../../Shared (Extension)/Resources/database.js');
const databaseCode = fs.readFileSync(databasePath, 'utf8');
eval(databaseCode);

const dictionaryPath = path.join(__dirname, '../../Shared (Extension)/Resources/dictionary.js');
const dictionaryCode = fs.readFileSync(dictionaryPath, 'utf8');
eval(dictionaryCode);

const handlersPath = path.join(__dirname, '../../Shared (Extension)/Resources/handlers.js');
const handlersCode = fs.readFileSync(handlersPath, 'utf8');
eval(handlersCode);

// Load init.js but extract just the message handling parts we need
const initPath = path.join(__dirname, '../../Shared (Extension)/Resources/init.js');
const initCode = fs.readFileSync(initPath, 'utf8');

// Mock browser APIs needed for init.js
global.browser = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  }
};

// Extract the message handling function from init.js
const messageHandlerMatch = initCode.match(/browser\.runtime\.onMessage\.addListener\(([^}]+}\s*}\s*);?\);/s);
if (messageHandlerMatch) {
  const messageHandlerCode = messageHandlerMatch[1];
  global.extensionMessageHandler = eval(`(${messageHandlerCode})`);
}

describe('Message Passing Integration - Real Implementation', () => {
  let db;
  let messageHandlers;

  beforeEach(async () => {
    // Reset IndexedDB
    global.indexedDB = new FDBFactory();
    
    // Initialize real database
    db = new VocabDictDatabase();
    await db.initialize();
    
    // Set up message handlers map like in real init.js
    messageHandlers = new Map();
    
    // Register all handlers using real message types
    messageHandlers.set(MessageTypes.LOOKUP_WORD, handleLookupWord);
    messageHandlers.set(MessageTypes.ADD_WORD, handleAddWord);
    messageHandlers.set(MessageTypes.GET_WORD, handleGetWord);
    messageHandlers.set(MessageTypes.GET_ALL_WORDS, handleGetAllWords);
    messageHandlers.set(MessageTypes.UPDATE_WORD, handleUpdateWord);
    messageHandlers.set(MessageTypes.DELETE_WORD, handleDeleteWord);
    messageHandlers.set(MessageTypes.GET_WORDS_DUE_FOR_REVIEW, handleGetWordsDueForReview);
    messageHandlers.set(MessageTypes.ADD_LIST, handleAddList);
    messageHandlers.set(MessageTypes.GET_LIST, handleGetList);
    messageHandlers.set(MessageTypes.GET_ALL_LISTS, handleGetAllLists);
    messageHandlers.set(MessageTypes.UPDATE_LIST, handleUpdateList);
    messageHandlers.set(MessageTypes.DELETE_LIST, handleDeleteList);
    messageHandlers.set(MessageTypes.GET_DEFAULT_LIST, handleGetDefaultList);
    messageHandlers.set(MessageTypes.ADD_WORD_TO_LIST, handleAddWordToList);
    messageHandlers.set(MessageTypes.REMOVE_WORD_FROM_LIST, handleRemoveWordFromList);
    messageHandlers.set(MessageTypes.GET_SETTINGS, handleGetSettings);
    messageHandlers.set(MessageTypes.UPDATE_SETTINGS, handleUpdateSettings);
    messageHandlers.set(MessageTypes.GET_STATS, handleGetStats);
    messageHandlers.set(MessageTypes.UPDATE_STATS, handleUpdateStats);
    messageHandlers.set(MessageTypes.UPDATE_REVIEW_STATS, handleUpdateReviewStats);

    // Make messageHandlers available globally like in init.js
    global.messageHandlers = messageHandlers;
  });

  afterEach(async () => {
    if (db && db.db) {
      db.db.close();
    }
    // Clean up IndexedDB
    global.indexedDB = new FDBFactory();
    jest.clearAllMocks();
  });

  // Simulate browser.runtime.sendMessage
  async function simulateMessage(message) {
    const handler = messageHandlers.get(message.type);
    if (!handler) {
      throw new Error(`No handler registered for message type: ${message.type}`);
    }
    
    try {
      const result = await handler(message.payload || {});
      return { status: 'success', data: result };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  describe('Dictionary Operations Message Flow', () => {
    test('should handle complete word lookup flow', async () => {
      const message = {
        type: MessageTypes.LOOKUP_WORD,
        payload: { word: 'hello' }
      };

      const response = await simulateMessage(message);
      
      expect(response.status).toBe('success');
      expect(response.data).toBeDefined();
      expect(response.data.word).toBe('hello');
      expect(response.data.definitions).toBeDefined();
      expect(Array.isArray(response.data.definitions)).toBe(true);
    });

    test('should handle word lookup error', async () => {
      const message = {
        type: MessageTypes.LOOKUP_WORD,
        payload: { word: '' } // Invalid word
      };

      const response = await simulateMessage(message);
      
      expect(response.status).toBe('error');
      expect(response.error).toContain('word is required');
    });

    test('should handle unknown word gracefully', async () => {
      const message = {
        type: MessageTypes.LOOKUP_WORD,
        payload: { word: 'unknownword12345' }
      };

      const response = await simulateMessage(message);
      
      expect(response.status).toBe('success');
      expect(response.data).toBeNull();
    });
  });

  describe('Word Management Message Flow', () => {
    test('should complete full word lifecycle', async () => {
      // 1. Add a word
      const addResponse = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: {
          wordData: {
            word: 'lifecycle',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'The series of changes in the life of an organism',
              examples: ['The butterfly lifecycle is complex.']
            }]
          }
        }
      });

      expect(addResponse.status).toBe('success');
      const addedWord = addResponse.data;
      expect(addedWord.id).toBeDefined();
      expect(addedWord.word).toBe('lifecycle');

      // 2. Get the word
      const getResponse = await simulateMessage({
        type: MessageTypes.GET_WORD,
        payload: { wordId: addedWord.id }
      });

      expect(getResponse.status).toBe('success');
      expect(getResponse.data.id).toBe(addedWord.id);

      // 3. Update the word
      const updatedWord = { ...getResponse.data };
      updatedWord.difficulty = 'hard';
      updatedWord.lookupCount = 5;

      const updateResponse = await simulateMessage({
        type: MessageTypes.UPDATE_WORD,
        payload: { wordData: updatedWord }
      });

      expect(updateResponse.status).toBe('success');
      expect(updateResponse.data.difficulty).toBe('hard');
      expect(updateResponse.data.lookupCount).toBe(5);

      // 4. Verify all words includes our word
      const getAllResponse = await simulateMessage({
        type: MessageTypes.GET_ALL_WORDS,
        payload: {}
      });

      expect(getAllResponse.status).toBe('success');
      expect(getAllResponse.data.some(w => w.id === addedWord.id)).toBe(true);

      // 5. Delete the word
      const deleteResponse = await simulateMessage({
        type: MessageTypes.DELETE_WORD,
        payload: { wordId: addedWord.id }
      });

      expect(deleteResponse.status).toBe('success');

      // 6. Verify word is deleted
      const getDeletedResponse = await simulateMessage({
        type: MessageTypes.GET_WORD,
        payload: { wordId: addedWord.id }
      });

      expect(getDeletedResponse.status).toBe('success');
      expect(getDeletedResponse.data).toBeNull();
    });

    test('should handle duplicate word addition correctly', async () => {
      const wordData = {
        word: 'duplicate',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'Something that is identical to another',
          examples: []
        }]
      };

      // Add word first time
      const first = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: { wordData }
      });

      expect(first.status).toBe('success');
      expect(first.data.lookupCount).toBe(1);

      // Add same word again
      const second = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: { wordData }
      });

      expect(second.status).toBe('success');
      expect(second.data.id).toBe(first.data.id); // Same ID
      expect(second.data.lookupCount).toBe(2); // Incremented
    });
  });

  describe('List Management Message Flow', () => {
    test('should complete full list and word-to-list workflow', async () => {
      // 1. Get default list
      const defaultListResponse = await simulateMessage({
        type: MessageTypes.GET_DEFAULT_LIST,
        payload: {}
      });

      expect(defaultListResponse.status).toBe('success');
      const defaultList = defaultListResponse.data;
      expect(defaultList.name).toBe('My Vocabulary');
      expect(defaultList.isDefault).toBe(true);

      // 2. Add a new list
      const addListResponse = await simulateMessage({
        type: MessageTypes.ADD_LIST,
        payload: {
          listData: {
            name: 'Technical Terms',
            description: 'Computer science vocabulary'
          }
        }
      });

      expect(addListResponse.status).toBe('success');
      const newList = addListResponse.data;
      expect(newList.name).toBe('Technical Terms');
      expect(newList.isDefault).toBe(false);

      // 3. Add a word
      const addWordResponse = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: {
          wordData: {
            word: 'algorithm',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'A process or set of rules for calculations',
              examples: ['The sorting algorithm is efficient.']
            }]
          }
        }
      });

      expect(addWordResponse.status).toBe('success');
      const word = addWordResponse.data;

      // 4. Add word to the new list
      const addToListResponse = await simulateMessage({
        type: MessageTypes.ADD_WORD_TO_LIST,
        payload: {
          wordData: { word: word.word },
          listId: newList.id
        }
      });

      expect(addToListResponse.status).toBe('success');

      // 5. Verify word is in the list
      const getListResponse = await simulateMessage({
        type: MessageTypes.GET_LIST,
        payload: { listId: newList.id }
      });

      expect(getListResponse.status).toBe('success');
      expect(getListResponse.data.wordIds).toContain(word.id);

      // 6. Get all lists and verify both exist
      const getAllListsResponse = await simulateMessage({
        type: MessageTypes.GET_ALL_LISTS,
        payload: {}
      });

      expect(getAllListsResponse.status).toBe('success');
      const lists = getAllListsResponse.data;
      expect(lists.length).toBeGreaterThanOrEqual(2);
      expect(lists.some(l => l.id === defaultList.id)).toBe(true);
      expect(lists.some(l => l.id === newList.id)).toBe(true);

      // 7. Remove word from list
      const removeFromListResponse = await simulateMessage({
        type: MessageTypes.REMOVE_WORD_FROM_LIST,
        payload: {
          wordId: word.id,
          listId: newList.id
        }
      });

      expect(removeFromListResponse.status).toBe('success');

      // 8. Verify word is removed from list
      const verifyRemovalResponse = await simulateMessage({
        type: MessageTypes.GET_LIST,
        payload: { listId: newList.id }
      });

      expect(verifyRemovalResponse.status).toBe('success');
      expect(verifyRemovalResponse.data.wordIds).not.toContain(word.id);
    });

    test('should handle adding word to default list when no listId specified', async () => {
      // Add a word
      const addWordResponse = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: {
          wordData: {
            word: 'defaulttest',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'A test for default behavior',
              examples: []
            }]
          }
        }
      });

      const word = addWordResponse.data;

      // Add to default list (no listId)
      const addToDefaultResponse = await simulateMessage({
        type: MessageTypes.ADD_WORD_TO_LIST,
        payload: {
          wordData: { word: word.word }
          // No listId specified
        }
      });

      expect(addToDefaultResponse.status).toBe('success');

      // Verify word is in default list
      const defaultListResponse = await simulateMessage({
        type: MessageTypes.GET_DEFAULT_LIST,
        payload: {}
      });

      expect(defaultListResponse.status).toBe('success');
      expect(defaultListResponse.data.wordIds).toContain(word.id);
    });
  });

  describe('Settings Management Message Flow', () => {
    test('should complete settings lifecycle', async () => {
      // 1. Get current settings
      const getResponse = await simulateMessage({
        type: MessageTypes.GET_SETTINGS,
        payload: {}
      });

      expect(getResponse.status).toBe('success');
      const settings = getResponse.data;
      expect(settings.theme).toBeDefined();
      expect(settings.autoAddToList).toBeDefined();

      // 2. Update settings
      settings.theme = 'dark';
      settings.autoAddToList = false;

      const updateResponse = await simulateMessage({
        type: MessageTypes.UPDATE_SETTINGS,
        payload: { settings }
      });

      expect(updateResponse.status).toBe('success');
      expect(updateResponse.data.theme).toBe('dark');
      expect(updateResponse.data.autoAddToList).toBe(false);

      // 3. Verify settings persisted
      const verifyResponse = await simulateMessage({
        type: MessageTypes.GET_SETTINGS,
        payload: {}
      });

      expect(verifyResponse.status).toBe('success');
      expect(verifyResponse.data.theme).toBe('dark');
      expect(verifyResponse.data.autoAddToList).toBe(false);
    });
  });

  describe('Learning Stats Message Flow', () => {
    test('should complete learning stats workflow', async () => {
      // 1. Get initial stats
      const initialStatsResponse = await simulateMessage({
        type: MessageTypes.GET_STATS,
        payload: {}
      });

      expect(initialStatsResponse.status).toBe('success');
      const initialStats = initialStatsResponse.data;
      expect(initialStats.totalReviews).toBe(0);
      expect(initialStats.currentStreak).toBe(0);

      // 2. Update review stats with correct answer
      const correctReviewResponse = await simulateMessage({
        type: MessageTypes.UPDATE_REVIEW_STATS,
        payload: { correct: true }
      });

      expect(correctReviewResponse.status).toBe('success');

      // 3. Verify stats updated
      let statsResponse = await simulateMessage({
        type: MessageTypes.GET_STATS,
        payload: {}
      });

      expect(statsResponse.status).toBe('success');
      expect(statsResponse.data.totalReviews).toBe(1);
      expect(statsResponse.data.currentStreak).toBe(1);
      expect(statsResponse.data.longestStreak).toBe(1);

      // 4. Update with incorrect answer
      const incorrectReviewResponse = await simulateMessage({
        type: MessageTypes.UPDATE_REVIEW_STATS,
        payload: { correct: false }
      });

      expect(incorrectReviewResponse.status).toBe('success');

      // 5. Verify streak reset but longest streak maintained
      statsResponse = await simulateMessage({
        type: MessageTypes.GET_STATS,
        payload: {}
      });

      expect(statsResponse.status).toBe('success');
      expect(statsResponse.data.totalReviews).toBe(2);
      expect(statsResponse.data.currentStreak).toBe(0);
      expect(statsResponse.data.longestStreak).toBe(1);

      // 6. Manual stats update
      const manualStats = statsResponse.data;
      manualStats.totalWords = 50;
      manualStats.wordsLearned = 25;

      const manualUpdateResponse = await simulateMessage({
        type: MessageTypes.UPDATE_STATS,
        payload: { stats: manualStats }
      });

      expect(manualUpdateResponse.status).toBe('success');
      expect(manualUpdateResponse.data.totalWords).toBe(50);
      expect(manualUpdateResponse.data.wordsLearned).toBe(25);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle unknown message types', async () => {
      const message = {
        type: 'UNKNOWN_MESSAGE_TYPE',
        payload: {}
      };

      await expect(simulateMessage(message)).rejects.toThrow('No handler registered for message type: UNKNOWN_MESSAGE_TYPE');
    });

    test('should handle malformed message payloads', async () => {
      const response = await simulateMessage({
        type: MessageTypes.ADD_WORD,
        payload: null
      });

      expect(response.status).toBe('error');
      expect(response.error).toBeDefined();
    });

    test('should handle concurrent message processing', async () => {
      const promises = [];
      
      // Send multiple messages concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(simulateMessage({
          type: MessageTypes.ADD_WORD,
          payload: {
            wordData: {
              word: `concurrent${i}`,
              definitions: [{
                partOfSpeech: 'noun',
                meaning: `Concurrent word ${i}`,
                examples: []
              }]
            }
          }
        }));
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe('success');
        expect(response.data.word).toBe(`concurrent${index}`);
      });

      // Verify all words were added
      const getAllResponse = await simulateMessage({
        type: MessageTypes.GET_ALL_WORDS,
        payload: {}
      });

      expect(getAllResponse.status).toBe('success');
      expect(getAllResponse.data.length).toBeGreaterThanOrEqual(5);
    });

    test('should maintain data consistency across complex workflows', async () => {
      // Complex workflow: Add words, create lists, add words to lists, update stats
      
      // 1. Add multiple words
      const words = [];
      for (let i = 0; i < 3; i++) {
        const response = await simulateMessage({
          type: MessageTypes.ADD_WORD,
          payload: {
            wordData: {
              word: `consistency${i}`,
              definitions: [{
                partOfSpeech: 'noun',
                meaning: `Consistency test word ${i}`,
                examples: []
              }]
            }
          }
        });
        words.push(response.data);
      }

      // 2. Create a list
      const listResponse = await simulateMessage({
        type: MessageTypes.ADD_LIST,
        payload: {
          listData: {
            name: 'Consistency Test List',
            description: 'Testing data consistency'
          }
        }
      });
      const list = listResponse.data;

      // 3. Add all words to the list
      for (const word of words) {
        await simulateMessage({
          type: MessageTypes.ADD_WORD_TO_LIST,
          payload: {
            wordData: { word: word.word },
            listId: list.id
          }
        });
      }

      // 4. Verify list contains all words
      const verifyListResponse = await simulateMessage({
        type: MessageTypes.GET_LIST,
        payload: { listId: list.id }
      });

      expect(verifyListResponse.status).toBe('success');
      expect(verifyListResponse.data.wordIds).toHaveLength(3);
      words.forEach(word => {
        expect(verifyListResponse.data.wordIds).toContain(word.id);
      });

      // 5. Update stats multiple times
      for (let i = 0; i < 3; i++) {
        await simulateMessage({
          type: MessageTypes.UPDATE_REVIEW_STATS,
          payload: { correct: true }
        });
      }

      // 6. Verify final state consistency
      const finalStatsResponse = await simulateMessage({
        type: MessageTypes.GET_STATS,
        payload: {}
      });

      expect(finalStatsResponse.status).toBe('success');
      expect(finalStatsResponse.data.totalReviews).toBe(3);
      expect(finalStatsResponse.data.currentStreak).toBe(3);

      const finalWordsResponse = await simulateMessage({
        type: MessageTypes.GET_ALL_WORDS,
        payload: {}
      });

      expect(finalWordsResponse.status).toBe('success');
      expect(finalWordsResponse.data.length).toBeGreaterThanOrEqual(3);
    });
  });
});