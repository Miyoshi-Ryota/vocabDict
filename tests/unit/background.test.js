const { MessageTypes, handleMessage } = require('../../src/background/message-handler');
const DictionaryService = require('../../src/services/dictionary-service');
const VocabularyList = require('../../src/services/vocabulary-list');
const StorageManager = require('../../src/services/storage');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Background Message Handler', () => {
  let dictionary;
  let storage;

  beforeEach(async () => {
    // Use real services
    dictionary = new DictionaryService(dictionaryData);
    storage = StorageManager;

    // Clear storage before each test
    await browser.storage.local.clear();

    // Create default list
    const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
    await storage.set('vocab_lists', [defaultList.toJSON()]);
  });

  afterEach(async () => {
    await browser.storage.local.clear();
  });

  describe('LOOKUP_WORD message', () => {
    test('should return word data for valid word', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'hello'
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.word).toBe('hello');
      expect(result.data.pronunciation).toBe('/həˈloʊ/');
      expect(result.data.definitions).toHaveLength(2);
    });

    test('should return error for invalid word', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'notaword'
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found');
    });

    test('should handle fuzzy matching', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'helo' // misspelled
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('hello');
    });

    test('should handle missing word parameter', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word parameter is required');
    });
  });

  describe('ADD_TO_LIST message', () => {
    test('should add word to specified list', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      expect(result.success).toBe(true);

      // Verify word was added
      const updatedLists = await storage.get('vocab_lists');
      const list = VocabularyList.fromJSON(updatedLists[0], dictionary);
      const wordData = await list.getWord('hello');
      expect(wordData).toBeDefined();
      expect(wordData.word).toBe('hello');
    });

    test('should handle word not in dictionary', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'notaword',
        listId
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found in dictionary');
    });

    test('should handle list not found', async () => {
      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId: 'nonexistent'
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('List not found');
    });

    test('should handle duplicate word', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Add word first time
      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      // Try to add again
      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word already exists in list');
    });
  });

  describe('GET_LISTS message', () => {
    test('should return all vocabulary lists', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('My Vocabulary');
      expect(result.data[0].isDefault).toBe(true);
    });

    test('should return empty array if no lists', async () => {
      await storage.set('vocab_lists', []);

      const result = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('CREATE_LIST message', () => {
    test('should create new list', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST,
        name: 'Business English'
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe('Business English');
      expect(result.data.created).toBeDefined();

      // Verify list was saved
      const lists = await storage.get('vocab_lists');
      expect(lists).toHaveLength(2);
      expect(lists[1].name).toBe('Business English');
    });

    test('should handle missing name parameter', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('List name is required');
    });

    test('should handle empty name', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST,
        name: '   '
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('List name cannot be empty');
    });
  });

  describe('UPDATE_WORD message', () => {
    test('should update word in list', async () => {
      // First add a word
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      // Update the word
      const result = await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId,
        word: 'hello',
        updates: {
          difficulty: 'hard',
          customNotes: 'Common greeting'
        }
      }, { dictionary, storage });

      expect(result.success).toBe(true);

      // Verify update
      const updatedLists = await storage.get('vocab_lists');
      const list = VocabularyList.fromJSON(updatedLists[0], dictionary);
      const wordData = await list.getWord('hello');
      expect(wordData.difficulty).toBe('hard');
      expect(wordData.customNotes).toBe('Common greeting');
    });

    test('should handle word not found', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      const result = await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId,
        word: 'nonexistent',
        updates: { difficulty: 'hard' }
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found in list');
    });
  });

  describe('GET_REVIEW_QUEUE message', () => {
    test('should return words due for review', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Add words with different review times
      const now = new Date();
      const yesterday = new Date(now - 86400000);
      const tomorrow = new Date(now + 86400000);

      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'world',
        listId
      }, { dictionary, storage });

      // Update review times
      await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId,
        word: 'hello',
        updates: { nextReview: yesterday.toISOString() }
      }, { dictionary, storage });

      await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId,
        word: 'world',
        updates: { nextReview: tomorrow.toISOString() }
      }, { dictionary, storage });

      const result = await handleMessage({
        type: MessageTypes.GET_REVIEW_QUEUE
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].word).toBe('hello');
    });

    test('should limit review queue size', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;
      const yesterday = new Date(Date.now() - 86400000);

      // Add many words due for review
      const words = ['hello', 'world', 'aesthetic', 'eloquent', 'serendipity'];
      for (const word of words) {
        await handleMessage({
          type: MessageTypes.ADD_TO_LIST,
          word,
          listId
        }, { dictionary, storage });

        await handleMessage({
          type: MessageTypes.UPDATE_WORD,
          listId,
          word,
          updates: { nextReview: yesterday.toISOString() }
        }, { dictionary, storage });
      }

      const result = await handleMessage({
        type: MessageTypes.GET_REVIEW_QUEUE,
        maxWords: 3
      }, { dictionary, storage });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });
  });

  describe('SUBMIT_REVIEW message', () => {
    test('should update word review data', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Add a word
      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      const result = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 3.5
      }, { dictionary, storage });

      expect(result.success).toBe(true);

      // Verify review was recorded
      const updatedLists = await storage.get('vocab_lists');
      const list = VocabularyList.fromJSON(updatedLists[0], dictionary);
      const wordData = await list.getWord('hello');

      expect(wordData.lastReviewed).toBeDefined();
      expect(wordData.reviewHistory).toHaveLength(1);
      expect(wordData.reviewHistory[0].result).toBe('known');
      expect(wordData.reviewHistory[0].timeSpent).toBe(3.5);
      expect(new Date(wordData.nextReview).getTime()).toBeGreaterThan(new Date().getTime());
    });

    test('should reset interval on unknown', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Add and review word as known first
      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary, storage });

      await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 2.0
      }, { dictionary, storage });

      // Review as unknown
      const result = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId,
        word: 'hello',
        reviewResult: 'unknown',
        timeSpent: 3.0
      }, { dictionary, storage });

      expect(result.success).toBe(true);

      // Check that interval was reset
      const updatedLists = await storage.get('vocab_lists');
      const list = VocabularyList.fromJSON(updatedLists[0], dictionary);
      const wordData = await list.getWord('hello');

      const nextReview = new Date(wordData.nextReview);
      const dayAfter = new Date(Date.now() + 2 * 86400000);

      expect(nextReview.getTime()).toBeGreaterThan(new Date().getTime());
      expect(nextReview.getTime()).toBeLessThan(dayAfter.getTime());
    });
  });

  describe('Unknown message type', () => {
    test('should return error for unknown message type', async () => {
      const result = await handleMessage({
        type: 'UNKNOWN_TYPE'
      }, { dictionary, storage });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown message type: UNKNOWN_TYPE');
    });
  });
});
