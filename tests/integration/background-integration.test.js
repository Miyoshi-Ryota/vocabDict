const { MessageTypes, handleMessage } = require('../../src/background/message-handler');
const DictionaryService = require('../../src/services/dictionary-service');
const VocabularyList = require('../../src/services/vocabulary-list');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Background Service Integration Tests', () => {
  let dictionary;
  let services;
  let mockList;
  let mockLists;

  beforeEach(() => {
    jest.clearAllMocks();

    dictionary = new DictionaryService(dictionaryData);
    services = { dictionary };
    mockList = new VocabularyList('My Vocabulary', dictionary, true);
    mockLists = { [mockList.id]: mockList };

    // Mock native message responses
    browser.runtime.sendNativeMessage.mockImplementation((message) => {
      if (message.action === 'fetchAllVocabularyLists') {
        const lists = Object.values(mockLists).map(list => {
          const j = list.toJSON();
          const { created, ...rest } = j;
          return { ...rest, createdAt: created };
        });
        return Promise.resolve({ success: true, vocabularyLists: lists });
      }
      if (message.action === 'addWordToVocabularyList') {
        const targetList = mockLists[message.listId];
        if (!targetList) {
          return Promise.resolve({ error: 'List not found' });
        }
        const word = message.word;
        const metadata = message.metadata || {};

        const wordEntry = {
          word: word,
          dateAdded: new Date().toISOString(),
          difficulty: metadata.difficulty || 5000,
          customNotes: metadata.customNotes || '',
          lastReviewed: null,
          nextReview: new Date(Date.now() + 86400000).toISOString(),
          reviewHistory: []
        };
        targetList.words[word.toLowerCase()] = wordEntry;

        return Promise.resolve({
          success: true,
          data: wordEntry
        });
      }
      if (message.action === 'createVocabularyList') {
        const newList = new VocabularyList(message.name, dictionary, message.isDefault || false);
        mockLists[newList.id] = newList;
        const j = newList.toJSON();
        const { created, ...rest } = j;
        return Promise.resolve({ success: true, vocabularyList: { ...rest, createdAt: created } });
      }
      if (message.action === 'submitReview') {
        const targetList = mockLists[message.listId];
        if (!targetList) {
          return Promise.resolve({ error: 'List not found' });
        }
        const wordData = targetList.words[message.word.toLowerCase()];
        if (!wordData) {
          return Promise.resolve({ error: 'Word not found' });
        }

        const nextInterval = message.reviewResult === 'mastered' ? null :
                             message.reviewResult === 'unknown' ? 1 :
                             message.reviewResult === 'known' ? 3 : 1;
        const nextReview = new Date(Date.now() + nextInterval * 86400000).toISOString();

        wordData.lastReviewed = new Date().toISOString();
        wordData.nextReview = nextReview;

        return Promise.resolve({
          success: true,
          data: {
            word: {
              word: message.word,
              dateAdded: new Date().toISOString(),
              difficulty: wordData.difficulty || 5000,
              customNotes: wordData.customNotes || '',
              lastReviewed: wordData.lastReviewed,
              nextReview: wordData.nextReview,
              reviewHistory: []
            },
            nextReview: nextReview,
            nextInterval: nextInterval
          }
        });
      }
      if (message.action === 'addRecentSearch') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: true });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete word lookup and add flow', () => {
    test('should lookup word and add to vocabulary list', async () => {
      // 1. Lookup a word
      const lookupResponse = await handleMessage({
        action: MessageTypes.LOOKUP_WORD,
        word: 'serendipity'
      }, services);

      expect(lookupResponse.success).toBe(true);
      expect(lookupResponse.data.word).toBe('serendipity');
      expect(lookupResponse.data.pronunciation).toBe('/ˌserənˈdipədē/');

      // 2. Get lists to find where to add
      const listsResponse = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, services);

      expect(listsResponse.success).toBe(true);
      expect(listsResponse.data).toHaveLength(1);
      const listId = listsResponse.data[0].id;

      // 3. Add word to list
      const addResponse = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'serendipity',
        listId,
        metadata: { difficulty: 10000, customNotes: 'Beautiful word!' }
      }, services);

      expect(addResponse.success).toBe(true);
      expect(addResponse.data.word).toBe('serendipity');
      expect(addResponse.data.difficulty).toBe(10000);
      expect(addResponse.data.customNotes).toBe('Beautiful word!');
    });
  });

  describe('Complete learning flow', () => {
    test('should handle full review session workflow', async () => {
      // Setup: Add words to list
      const listsResponse = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, services);
      const listId = listsResponse.data[0].id;

      // Add multiple words
      const words = ['hello', 'eloquent', 'serendipity'];
      for (const word of words) {
        await handleMessage({
          action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
          word,
          listId
        }, services);
      }

      // Ensure words are due for review
      Object.values(mockList.words).forEach(w => {
        w.nextReview = new Date(Date.now() - 86400000).toISOString();
      });

      // Mock getVocabularyLists to return list with words
      browser.runtime.sendNativeMessage.mockImplementationOnce(() => {
        const j = mockList.toJSON();
        const { created, ...rest } = j;
        return Promise.resolve({ success: true, vocabularyLists: [{ ...rest, createdAt: created }] });
      });

      // 1. Get review queue
      const queueResponse = await handleMessage({
        action: MessageTypes.FETCH_REVIEW_QUEUE,
        maxWords: 5
      }, services);

      expect(queueResponse.success).toBe(true);
      expect(queueResponse.data).toHaveLength(words.length);
      queueResponse.data.forEach(item => {
        expect(words).toContain(item.word);
        expect(item.listId).toBe(listId);
        expect(item.nextReview).toBeDefined();
      });

      const wordToReview = queueResponse.data[0];

      const reviewResponse = await handleMessage({
        action: MessageTypes.SUBMIT_REVIEW,
        listId: wordToReview.listId,
        word: wordToReview.word,
        reviewResult: 'known',
        timeSpent: 15
      }, services);

      expect(reviewResponse.success).toBe(true);
      expect(reviewResponse.data.nextReview).toBeDefined();
      expect(reviewResponse.data.lastReviewed).toBeDefined();
    });
  });

  describe('Multiple lists management', () => {
    test('should manage words across multiple lists', async () => {
      // Create additional list
      const createResponse = await handleMessage({
        action: MessageTypes.CREATE_VOCABULARY_LIST,
        name: 'Technical Terms'
      }, services);

      expect(createResponse.success).toBe(true);
      const techListId = createResponse.data.id;

      // Add word to first list
      const listsResponse = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, services);
      const defaultListId = listsResponse.data[0].id;

      await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'algorithm',
        listId: defaultListId
      }, services);

      // Try to add different word to second list (mock would need to handle multiple lists)
      const addToTechResponse = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'recursion',
        listId: techListId
      }, services);

      expect(addToTechResponse.success).toBe(true);

      // Verify words are stored in their respective lists
      const listsAfterAdds = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, services);
      const defaultList = listsAfterAdds.data.find(l => l.id === defaultListId);
      const techList = listsAfterAdds.data.find(l => l.id === techListId);

      expect(defaultList.words).toHaveProperty('algorithm');
      expect(defaultList.words).not.toHaveProperty('recursion');
      expect(techList.words).toHaveProperty('recursion');
      expect(techList.words).not.toHaveProperty('algorithm');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle invalid word lookup gracefully', async () => {
      const response = await handleMessage({
        action: MessageTypes.LOOKUP_WORD,
        word: 'xyzabc123notaword'
      }, services);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Word not found');
    });

    test('should handle adding non-existent word to list', async () => {
      const listsResponse = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, services);
      const listId = listsResponse.data[0].id;

      const response = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'notindictionary',
        listId
      }, services);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Word not found in dictionary');
    });

    test('should handle missing parameters gracefully', async () => {
      const response = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'hello'
        // Missing listId
      }, services);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid request');
    });
  });
});
