const { MessageTypes, handleMessage } = require('../../src/background/message-handler');
const DictionaryService = require('../../src/services/dictionary-service');
const StorageManager = require('../../src/services/storage');
const VocabularyList = require('../../src/services/vocabulary-list');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Background Service Integration Tests', () => {
  let dictionary;
  let storage;
  let services;

  beforeEach(async () => {
    // Use real services
    dictionary = new DictionaryService(dictionaryData);
    storage = StorageManager;
    services = { dictionary, storage };
    
    // Clear storage
    await browser.storage.local.clear();
    
    // Initialize with default list
    const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
    await storage.set('vocab_lists', [defaultList.toJSON()]);
  });

  afterEach(async () => {
    await browser.storage.local.clear();
  });

  describe('Complete word lookup and add flow', () => {
    test('should lookup word and add to vocabulary list', async () => {
      // 1. Lookup a word
      const lookupResponse = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'serendipity'
      }, services);

      expect(lookupResponse.success).toBe(true);
      expect(lookupResponse.data.word).toBe('serendipity');
      expect(lookupResponse.data.pronunciation).toBe('/ˌsɛrənˈdɪpɪti/');
      
      // 2. Get lists to find where to add
      const listsResponse = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, services);

      expect(listsResponse.success).toBe(true);
      expect(listsResponse.data).toHaveLength(1);
      const listId = listsResponse.data[0].id;

      // 3. Add the word to the list
      const addResponse = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'serendipity',
        listId: listId,
        metadata: {
          difficulty: 'hard',
          customNotes: 'Found this while reading'
        }
      }, services);

      expect(addResponse.success).toBe(true);
      expect(addResponse.data.word).toBe('serendipity');
      expect(addResponse.data.difficulty).toBe('hard');

      // 4. Verify the word was actually saved
      const updatedLists = await storage.get('vocab_lists');
      expect(updatedLists[0].words['serendipity']).toBeDefined();
      expect(updatedLists[0].words['serendipity'].customNotes).toBe('Found this while reading');
    });

    test('should handle fuzzy matching for misspelled words', async () => {
      // Try to lookup a misspelled word
      const response = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'asthetic' // misspelled 'aesthetic'
      }, services);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions).toContain('aesthetic');
    });
  });

  describe('Complete learning flow', () => {
    test('should handle full review session workflow', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // 1. Add multiple words with different review times
      const words = ['hello', 'eloquent', 'serendipity'];
      const yesterday = new Date(Date.now() - 86400000);
      
      for (const word of words) {
        await handleMessage({
          type: MessageTypes.ADD_TO_LIST,
          word: word,
          listId: listId
        }, services);

        // Set them as due for review
        await handleMessage({
          type: MessageTypes.UPDATE_WORD,
          listId: listId,
          word: word,
          updates: { nextReview: yesterday.toISOString() }
        }, services);
      }

      // 2. Get review queue
      const queueResponse = await handleMessage({
        type: MessageTypes.GET_REVIEW_QUEUE
      }, services);

      expect(queueResponse.success).toBe(true);
      expect(queueResponse.data).toHaveLength(3);
      expect(queueResponse.data[0].listId).toBe(listId);

      // 3. Submit review for first word (known)
      const reviewResponse1 = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId: listId,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 2.5
      }, services);

      expect(reviewResponse1.success).toBe(true);
      expect(reviewResponse1.data.nextInterval).toBe(3); // Should be 3 days

      // 4. Submit review for second word (unknown)
      const reviewResponse2 = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId: listId,
        word: 'eloquent',
        reviewResult: 'unknown',
        timeSpent: 5.0
      }, services);

      expect(reviewResponse2.success).toBe(true);
      expect(reviewResponse2.data.nextInterval).toBe(1); // Reset to 1 day

      // 5. Get updated review queue
      const updatedQueue = await handleMessage({
        type: MessageTypes.GET_REVIEW_QUEUE
      }, services);

      // Should only have 'serendipity' left (others scheduled for future)
      expect(updatedQueue.data).toHaveLength(1);
      expect(updatedQueue.data[0].word).toBe('serendipity');

      // 6. Verify review history was saved
      const finalLists = await storage.get('vocab_lists');
      const helloWord = finalLists[0].words['hello'];
      expect(helloWord.reviewHistory).toHaveLength(1);
      expect(helloWord.reviewHistory[0].result).toBe('known');
      expect(helloWord.lastReviewed).toBeDefined();
      expect(new Date(helloWord.nextReview).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Multiple lists management', () => {
    test('should manage words across multiple lists', async () => {
      // 1. Create a second list
      const createResponse = await handleMessage({
        type: MessageTypes.CREATE_LIST,
        name: 'Technical Terms'
      }, services);

      expect(createResponse.success).toBe(true);
      const techListId = createResponse.data.id;

      // 2. Get all lists
      const listsResponse = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, services);

      expect(listsResponse.data).toHaveLength(2);
      
      // 3. Add same word to both lists with different metadata
      const defaultListId = listsResponse.data[0].id;

      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'resilient',
        listId: defaultListId,
        metadata: { difficulty: 'medium' }
      }, services);

      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'resilient',
        listId: techListId,
        metadata: { 
          difficulty: 'easy',
          customNotes: 'Important quality in software'
        }
      }, services);

      // 4. Verify both lists have the word with different metadata
      const finalLists = await storage.get('vocab_lists');
      
      const defaultList = finalLists.find(l => l.id === defaultListId);
      const techList = finalLists.find(l => l.id === techListId);
      
      expect(defaultList.words['resilient'].difficulty).toBe('medium');
      expect(techList.words['resilient'].difficulty).toBe('easy');
      expect(techList.words['resilient'].customNotes).toBe('Important quality in software');
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle concurrent operations correctly', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Simulate multiple concurrent add operations
      const promises = [
        handleMessage({
          type: MessageTypes.ADD_TO_LIST,
          word: 'hello',
          listId: listId
        }, services),
        handleMessage({
          type: MessageTypes.ADD_TO_LIST,
          word: 'eloquent',
          listId: listId
        }, services),
        handleMessage({
          type: MessageTypes.ADD_TO_LIST,
          word: 'aesthetic',
          listId: listId
        }, services)
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all words were added
      const finalLists = await storage.get('vocab_lists');
      expect(Object.keys(finalLists[0].words)).toHaveLength(3);
    });

    test('should maintain data integrity across operations', async () => {
      const lists = await storage.get('vocab_lists');
      const listId = lists[0].id;

      // Add a word
      await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'ephemeral',
        listId: listId
      }, services);

      // Update it multiple times
      for (let i = 0; i < 5; i++) {
        await handleMessage({
          type: MessageTypes.UPDATE_WORD,
          listId: listId,
          word: 'ephemeral',
          updates: {
            customNotes: `Update ${i + 1}`
          }
        }, services);
      }

      // Verify final state
      const finalLists = await storage.get('vocab_lists');
      expect(finalLists[0].words['ephemeral'].customNotes).toBe('Update 5');
      
      // Original data should still be intact
      expect(finalLists[0].words['ephemeral'].word).toBe('ephemeral');
      expect(finalLists[0].words['ephemeral'].dateAdded).toBeDefined();
    });
  });
});