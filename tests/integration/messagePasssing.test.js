/**
 * Integration tests for VocabDict message passing system
 * Tests communication between different extension components
 */

const { 
  MockVocabDictDatabase, 
  MockToyDictionary, 
  createMockHandlers,
  MockConstants,
  MockMessageTypes,
  MockMessageStatus
} = require('../mocks/extensionMocks');

const { MESSAGE_TYPES, TestHelpers } = require('../fixtures/testData');

describe('Message Passing Integration', () => {
  let db;
  let handlers;
  let messageHandlers;

  beforeEach(async () => {
    db = new MockVocabDictDatabase();
    await db.initialize();
    handlers = createMockHandlers(db, MockToyDictionary);
    
    // Mock message handler map similar to init.js
    messageHandlers = new Map();
    
    // Register all handlers
    messageHandlers.set(MockMessageTypes.LOOKUP_WORD, handlers.handleLookupWord);
    messageHandlers.set(MockMessageTypes.ADD_WORD, handlers.handleAddWord);
    messageHandlers.set(MockMessageTypes.GET_WORD, handlers.handleGetWord);
    messageHandlers.set(MockMessageTypes.GET_ALL_WORDS, handlers.handleGetAllWords);
    messageHandlers.set(MockMessageTypes.UPDATE_WORD, handlers.handleUpdateWord);
    messageHandlers.set(MockMessageTypes.DELETE_WORD, handlers.handleDeleteWord);
    messageHandlers.set(MockMessageTypes.GET_WORDS_DUE_FOR_REVIEW, handlers.handleGetWordsDueForReview);
    messageHandlers.set(MockMessageTypes.ADD_LIST, handlers.handleAddList);
    messageHandlers.set(MockMessageTypes.GET_LIST, handlers.handleGetList);
    messageHandlers.set(MockMessageTypes.GET_ALL_LISTS, handlers.handleGetAllLists);
    messageHandlers.set(MockMessageTypes.UPDATE_LIST, handlers.handleUpdateList);
    messageHandlers.set(MockMessageTypes.DELETE_LIST, handlers.handleDeleteList);
    messageHandlers.set(MockMessageTypes.GET_DEFAULT_LIST, handlers.handleGetDefaultList);
    messageHandlers.set(MockMessageTypes.ADD_WORD_TO_LIST, handlers.handleAddWordToList);
    messageHandlers.set(MockMessageTypes.REMOVE_WORD_FROM_LIST, handlers.handleRemoveWordFromList);
    messageHandlers.set(MockMessageTypes.GET_SETTINGS, handlers.handleGetSettings);
    messageHandlers.set(MockMessageTypes.UPDATE_SETTINGS, handlers.handleUpdateSettings);
    messageHandlers.set(MockMessageTypes.GET_STATS, handlers.handleGetStats);
    messageHandlers.set(MockMessageTypes.UPDATE_STATS, handlers.handleUpdateStats);
    messageHandlers.set(MockMessageTypes.UPDATE_REVIEW_STATS, handlers.handleUpdateReviewStats);
  });

  afterEach(() => {
    if (db) {
      db.reset();
    }
    jest.clearAllMocks();
  });

  // Mock message handling system
  const handleMessage = async (request) => {
    const handler = messageHandlers.get(request.type);
    if (!handler) {
      throw new Error(`Unknown message type: ${request.type}`);
    }

    try {
      const result = await handler(request.payload);
      return {
        status: MockMessageStatus.SUCCESS,
        data: result
      };
    } catch (error) {
      return {
        status: MockMessageStatus.ERROR,
        error: error.message
      };
    }
  };

  describe('Dictionary Operations Message Flow', () => {
    test('should handle lookup_word message successfully', async () => {
      const request = {
        type: MockMessageTypes.LOOKUP_WORD,
        payload: { word: 'hello' }
      };

      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.SUCCESS);
      expect(response.data).toBeDefined();
      expect(response.data.word).toBe('hello');
      expect(response.data.definitions).toBeDefined();
      expect(Array.isArray(response.data.definitions)).toBe(true);
    });

    test('should handle unknown word lookup gracefully', async () => {
      const request = {
        type: MockMessageTypes.LOOKUP_WORD,
        payload: { word: 'unknownword' }
      };

      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.SUCCESS);
      expect(response.data).toBeNull();
    });

    test('should handle missing word parameter', async () => {
      const request = {
        type: MockMessageTypes.LOOKUP_WORD,
        payload: {}
      };

      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.ERROR);
      expect(response.error).toBeDefined();
    });
  });

  describe('Word Management Message Flow', () => {
    test('should handle complete word lifecycle', async () => {
      const wordData = {
        word: 'lifecycle',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'The series of changes in the life of an organism',
          examples: ['The lifecycle of a butterfly includes metamorphosis.']
        }]
      };

      // 1. Add word
      const addRequest = {
        type: MockMessageTypes.ADD_WORD,
        payload: { word: wordData }
      };
      const addResponse = await handleMessage(addRequest);

      expect(addResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(addResponse.data.word).toBe('lifecycle');
      const wordId = addResponse.data.id;

      // 2. Get word
      const getRequest = {
        type: MockMessageTypes.GET_WORD,
        payload: { wordId }
      };
      const getResponse = await handleMessage(getRequest);

      expect(getResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getResponse.data.id).toBe(wordId);
      expect(getResponse.data.word).toBe('lifecycle');

      // 3. Update word
      const updateRequest = {
        type: MockMessageTypes.UPDATE_WORD,
        payload: { 
          word: { 
            ...addResponse.data,
            difficulty: 3 
          }
        }
      };
      const updateResponse = await handleMessage(updateRequest);

      expect(updateResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(updateResponse.data.difficulty).toBe(3);

      // 4. Get all words
      const getAllRequest = {
        type: MockMessageTypes.GET_ALL_WORDS,
        payload: {}
      };
      const getAllResponse = await handleMessage(getAllRequest);

      expect(getAllResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getAllResponse.data).toHaveLength(1);
      expect(getAllResponse.data[0].id).toBe(wordId);

      // 5. Delete word
      const deleteRequest = {
        type: MockMessageTypes.DELETE_WORD,
        payload: { wordId }
      };
      const deleteResponse = await handleMessage(deleteRequest);

      expect(deleteResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(deleteResponse.data).toBe(true);

      // 6. Verify deletion
      const verifyRequest = {
        type: MockMessageTypes.GET_WORD,
        payload: { wordId }
      };
      const verifyResponse = await handleMessage(verifyRequest);

      expect(verifyResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(verifyResponse.data).toBeNull();
    });

    test('should handle words due for review', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDate = new Date(Date.now() + 86400000); // 1 day ahead
      
      // Add words with different review dates
      await handleMessage({
        type: MockMessageTypes.ADD_WORD,
        payload: { 
          word: { 
            word: 'due', 
            nextReview: pastDate 
          }
        }
      });

      await handleMessage({
        type: MockMessageTypes.ADD_WORD,
        payload: { 
          word: { 
            word: 'notdue', 
            nextReview: futureDate 
          }
        }
      });

      const request = {
        type: MockMessageTypes.GET_WORDS_DUE_FOR_REVIEW,
        payload: {}
      };
      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.SUCCESS);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].word).toBe('due');
    });
  });

  describe('List Management Message Flow', () => {
    test('should handle complete list lifecycle', async () => {
      // 1. Get default list
      const getDefaultRequest = {
        type: MockMessageTypes.GET_DEFAULT_LIST,
        payload: {}
      };
      const getDefaultResponse = await handleMessage(getDefaultRequest);

      expect(getDefaultResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getDefaultResponse.data.isDefault).toBe(true);
      expect(getDefaultResponse.data.name).toBe('My Vocabulary');

      // 2. Add custom list
      const addListRequest = {
        type: MockMessageTypes.ADD_LIST,
        payload: { 
          list: { 
            name: 'Custom Test List',
            wordIds: []
          }
        }
      };
      const addListResponse = await handleMessage(addListRequest);

      expect(addListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(addListResponse.data.name).toBe('Custom Test List');
      const listId = addListResponse.data.id;

      // 3. Get all lists
      const getAllListsRequest = {
        type: MockMessageTypes.GET_ALL_LISTS,
        payload: {}
      };
      const getAllListsResponse = await handleMessage(getAllListsRequest);

      expect(getAllListsResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getAllListsResponse.data).toHaveLength(2); // Default + custom

      // 4. Update list
      const updateListRequest = {
        type: MockMessageTypes.UPDATE_LIST,
        payload: { 
          list: { 
            ...addListResponse.data,
            name: 'Updated Test List'
          }
        }
      };
      const updateListResponse = await handleMessage(updateListRequest);

      expect(updateListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(updateListResponse.data.name).toBe('Updated Test List');

      // 5. Delete list
      const deleteListRequest = {
        type: MockMessageTypes.DELETE_LIST,
        payload: { listId }
      };
      const deleteListResponse = await handleMessage(deleteListRequest);

      expect(deleteListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(deleteListResponse.data).toBe(true);
    });

    test('should handle word-to-list operations', async () => {
      // 1. Add a word
      const addWordRequest = {
        type: MockMessageTypes.ADD_WORD,
        payload: { 
          word: { 
            word: 'testword',
            definitions: [{ partOfSpeech: 'noun', meaning: 'test' }]
          }
        }
      };
      const addWordResponse = await handleMessage(addWordRequest);
      const wordId = addWordResponse.data.id;

      // 2. Add a list
      const addListRequest = {
        type: MockMessageTypes.ADD_LIST,
        payload: { 
          list: { name: 'Test List' }
        }
      };
      const addListResponse = await handleMessage(addListRequest);
      const listId = addListResponse.data.id;

      // 3. Add word to list
      const addWordToListRequest = {
        type: MockMessageTypes.ADD_WORD_TO_LIST,
        payload: { wordId, listId }
      };
      const addWordToListResponse = await handleMessage(addWordToListRequest);

      expect(addWordToListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(addWordToListResponse.data.id).toBe(wordId);

      // 4. Verify word is in list
      const getListRequest = {
        type: MockMessageTypes.GET_LIST,
        payload: { listId }
      };
      const getListResponse = await handleMessage(getListRequest);

      expect(getListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getListResponse.data.wordIds).toContain(wordId);

      // 5. Remove word from list
      const removeWordRequest = {
        type: MockMessageTypes.REMOVE_WORD_FROM_LIST,
        payload: { wordId, listId }
      };
      const removeWordResponse = await handleMessage(removeWordRequest);

      expect(removeWordResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(removeWordResponse.data.success).toBe(true);

      // 6. Verify word is removed from list
      const verifyListRequest = {
        type: MockMessageTypes.GET_LIST,
        payload: { listId }
      };
      const verifyListResponse = await handleMessage(verifyListRequest);

      expect(verifyListResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(verifyListResponse.data.wordIds).not.toContain(wordId);
    });

    test('should add word to default list when no listId provided', async () => {
      const wordData = {
        word: 'defaulttest',
        definitions: [{ partOfSpeech: 'noun', meaning: 'test for default list' }]
      };

      const request = {
        type: MockMessageTypes.ADD_WORD_TO_LIST,
        payload: { wordData }
      };
      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.SUCCESS);
      expect(response.data.word).toBe('defaulttest');

      // Verify word was added to default list
      const getDefaultRequest = {
        type: MockMessageTypes.GET_DEFAULT_LIST,
        payload: {}
      };
      const getDefaultResponse = await handleMessage(getDefaultRequest);

      expect(getDefaultResponse.data.wordIds).toContain(response.data.id);
    });
  });

  describe('Settings Management Message Flow', () => {
    test('should handle settings operations', async () => {
      // 1. Get default settings
      const getRequest = {
        type: MockMessageTypes.GET_SETTINGS,
        payload: {}
      };
      const getResponse = await handleMessage(getRequest);

      expect(getResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getResponse.data.theme).toBe('light');
      expect(getResponse.data.autoAdd).toBe(true);

      // 2. Update settings
      const updateRequest = {
        type: MockMessageTypes.UPDATE_SETTINGS,
        payload: { 
          settings: {
            theme: 'dark',
            autoAdd: false,
            sessionSize: 10
          }
        }
      };
      const updateResponse = await handleMessage(updateRequest);

      expect(updateResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(updateResponse.data.theme).toBe('dark');
      expect(updateResponse.data.autoAdd).toBe(false);
      expect(updateResponse.data.sessionSize).toBe(10);

      // 3. Verify settings persistence
      const verifyRequest = {
        type: MockMessageTypes.GET_SETTINGS,
        payload: {}
      };
      const verifyResponse = await handleMessage(verifyRequest);

      expect(verifyResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(verifyResponse.data.theme).toBe('dark');
      expect(verifyResponse.data.autoAdd).toBe(false);
    });
  });

  describe('Stats Management Message Flow', () => {
    test('should handle stats operations', async () => {
      // 1. Get default stats
      const getRequest = {
        type: MockMessageTypes.GET_STATS,
        payload: {}
      };
      const getResponse = await handleMessage(getRequest);

      expect(getResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getResponse.data.totalWords).toBe(0);
      expect(getResponse.data.wordsReviewed).toBe(0);

      // 2. Update stats
      const updateRequest = {
        type: MockMessageTypes.UPDATE_STATS,
        payload: { 
          stats: {
            totalWords: 25,
            wordsReviewed: 50,
            correctAnswers: 40,
            currentStreak: 5
          }
        }
      };
      const updateResponse = await handleMessage(updateRequest);

      expect(updateResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(updateResponse.data.totalWords).toBe(25);
      expect(updateResponse.data.wordsReviewed).toBe(50);
      expect(updateResponse.data.currentStreak).toBe(5);
    });

    test('should handle review stats updates', async () => {
      // 1. Add a word
      const addWordRequest = {
        type: MockMessageTypes.ADD_WORD,
        payload: { 
          word: { 
            word: 'review',
            definitions: [{ partOfSpeech: 'verb', meaning: 'to examine' }]
          }
        }
      };
      const addWordResponse = await handleMessage(addWordRequest);
      const wordId = addWordResponse.data.id;

      // 2. Review word correctly
      const reviewRequest = {
        type: MockMessageTypes.UPDATE_REVIEW_STATS,
        payload: { wordId, correct: true }
      };
      const reviewResponse = await handleMessage(reviewRequest);

      expect(reviewResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(reviewResponse.data.word.reviewCount).toBe(1);
      expect(reviewResponse.data.word.correctCount).toBe(1);
      expect(reviewResponse.data.stats.wordsReviewed).toBe(1);
      expect(reviewResponse.data.stats.correctAnswers).toBe(1);
      expect(reviewResponse.data.stats.currentStreak).toBe(1);
    });
  });

  describe('Error Handling in Message Flow', () => {
    test('should handle unknown message types', async () => {
      const request = {
        type: 'unknown_message_type',
        payload: {}
      };

      await expect(handleMessage(request))
        .rejects.toThrow('Unknown message type: unknown_message_type');
    });

    test('should handle handler errors gracefully', async () => {
      const request = {
        type: MockMessageTypes.UPDATE_WORD,
        payload: { 
          word: { 
            id: 'nonexistent',
            word: 'test'
          }
        }
      };

      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.ERROR);
      expect(response.error).toBe('Word not found');
    });

    test('should handle malformed payloads', async () => {
      const request = {
        type: MockMessageTypes.ADD_WORD,
        payload: null
      };

      const response = await handleMessage(request);

      expect(response.status).toBe(MockMessageStatus.ERROR);
      expect(response.error).toBeDefined();
    });
  });

  describe('Complex Workflow Integration', () => {
    test('should handle dictionary lookup to vocabulary management workflow', async () => {
      // 1. Look up a word in dictionary
      const lookupRequest = {
        type: MockMessageTypes.LOOKUP_WORD,
        payload: { word: 'hello' }
      };
      const lookupResponse = await handleMessage(lookupRequest);

      expect(lookupResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(lookupResponse.data.word).toBe('hello');

      // 2. Add the word to vocabulary using dictionary data
      const addWordRequest = {
        type: MockMessageTypes.ADD_WORD_TO_LIST,
        payload: { 
          wordData: {
            word: 'hello',
            definitions: lookupResponse.data.definitions
          }
        }
      };
      const addWordResponse = await handleMessage(addWordRequest);

      expect(addWordResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(addWordResponse.data.word).toBe('hello');
      expect(addWordResponse.data.definitions).toEqual(lookupResponse.data.definitions);

      // 3. Review the word
      const reviewRequest = {
        type: MockMessageTypes.UPDATE_REVIEW_STATS,
        payload: { 
          wordId: addWordResponse.data.id,
          correct: true
        }
      };
      const reviewResponse = await handleMessage(reviewRequest);

      expect(reviewResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(reviewResponse.data.word.reviewCount).toBe(1);
      expect(reviewResponse.data.stats.wordsReviewed).toBe(1);

      // 4. Check if word becomes due for review later
      const dueWordsRequest = {
        type: MockMessageTypes.GET_WORDS_DUE_FOR_REVIEW,
        payload: {}
      };
      const dueWordsResponse = await handleMessage(dueWordsRequest);

      expect(dueWordsResponse.status).toBe(MockMessageStatus.SUCCESS);
      // Word should not be due immediately after correct answer
      expect(dueWordsResponse.data).toHaveLength(0);
    });

    test('should handle batch operations correctly', async () => {
      const words = ['hello', 'world', 'test'];
      const addedWords = [];

      // Add multiple words
      for (const word of words) {
        const request = {
          type: MockMessageTypes.ADD_WORD,
          payload: { 
            word: { 
              word,
              definitions: [{ partOfSpeech: 'noun', meaning: `Definition of ${word}` }]
            }
          }
        };
        const response = await handleMessage(request);
        expect(response.status).toBe(MockMessageStatus.SUCCESS);
        addedWords.push(response.data);
      }

      // Verify all words are stored
      const getAllRequest = {
        type: MockMessageTypes.GET_ALL_WORDS,
        payload: {}
      };
      const getAllResponse = await handleMessage(getAllRequest);

      expect(getAllResponse.status).toBe(MockMessageStatus.SUCCESS);
      expect(getAllResponse.data).toHaveLength(3);
      
      const retrievedWords = getAllResponse.data.map(w => w.word);
      expect(retrievedWords).toEqual(expect.arrayContaining(['hello', 'world', 'test']));
    });
  });

  describe('Message Handler Registration', () => {
    test('should have all required message types registered', () => {
      const requiredTypes = [
        MockMessageTypes.LOOKUP_WORD,
        MockMessageTypes.ADD_WORD,
        MockMessageTypes.GET_WORD,
        MockMessageTypes.GET_ALL_WORDS,
        MockMessageTypes.UPDATE_WORD,
        MockMessageTypes.DELETE_WORD,
        MockMessageTypes.GET_WORDS_DUE_FOR_REVIEW,
        MockMessageTypes.ADD_LIST,
        MockMessageTypes.GET_LIST,
        MockMessageTypes.GET_ALL_LISTS,
        MockMessageTypes.UPDATE_LIST,
        MockMessageTypes.DELETE_LIST,
        MockMessageTypes.GET_DEFAULT_LIST,
        MockMessageTypes.ADD_WORD_TO_LIST,
        MockMessageTypes.REMOVE_WORD_FROM_LIST,
        MockMessageTypes.GET_SETTINGS,
        MockMessageTypes.UPDATE_SETTINGS,
        MockMessageTypes.GET_STATS,
        MockMessageTypes.UPDATE_STATS,
        MockMessageTypes.UPDATE_REVIEW_STATS
      ];

      for (const type of requiredTypes) {
        expect(messageHandlers.has(type)).toBe(true);
      }

      expect(messageHandlers.size).toBe(requiredTypes.length);
    });

    test('should have all handlers be functions', () => {
      for (const [type, handler] of messageHandlers) {
        expect(typeof handler).toBe('function');
      }
    });
  });
});