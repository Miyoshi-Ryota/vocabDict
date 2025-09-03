const { MessageTypes, handleMessage } = require('../../src/background/message-handler');
const DictionaryService = require('../../src/services/dictionary-service');
const VocabularyList = require('../../src/services/vocabulary-list');
const dictionaryData = require('../../src/data/dictionary.json');

describe('Background Message Handler', () => {
  let dictionary;
  let mockList;
  let popupWordState;

  beforeEach(() => {
    jest.clearAllMocks();

    dictionary = new DictionaryService(dictionaryData);
    mockList = new VocabularyList('My Vocabulary', dictionary, true);
    popupWordState = {
      getPendingSearch: jest.fn(),
      setPendingSearch: jest.fn()
    };
    
    // Setup comprehensive mock for native messages
    browser.runtime.sendNativeMessage.mockImplementation((message) => {
      if (message.action === 'fetchAllVocabularyLists') {
        const j = mockList.toJSON();
        const { created, ...rest } = j;
        return Promise.resolve({ 
          success: true,
          vocabularyLists: [{ ...rest, createdAt: created }]
        });
      }
      if (message.action === 'addWordToVocabularyList') {
        const word = message.word;
        if (!dictionary.getDictionaryData(word)) {
          return Promise.resolve({ success: false, error: 'Word not found in dictionary' });
        }
        if (mockList.words[word.toLowerCase()]) {
          return Promise.resolve({ success: false, error: 'Word already exists in list' });
        }
        const wordEntry = {
          word: word,
          dateAdded: new Date().toISOString(),
          difficulty: message.metadata?.difficulty || 5000,
          customNotes: message.metadata?.customNotes || '',
          lastReviewed: null,
          nextReview: new Date(Date.now() + 86400000).toISOString(),
          reviewHistory: []
        };
        mockList.words[word.toLowerCase()] = wordEntry;
        return Promise.resolve({ 
          success: true,
          data: wordEntry
        });
      }
      if (message.action === 'createVocabularyList') {
        return Promise.resolve({ 
          success: true,
          vocabularyList: {
            id: 'new-list-id',
            name: message.name,
            createdAt: new Date().toISOString(),
            isDefault: message.isDefault || false,
            words: {}
          }
        });
      }
      if (message.action === 'submitReview') {
        const wordData = mockList.words[message.word.toLowerCase()];
        if (!wordData) {
          return Promise.resolve({ error: 'Word not found' });
        }
        const nextInterval = message.reviewResult === 'mastered' ? null :
                             message.reviewResult === 'unknown' ? 1 :
                             message.reviewResult === 'known' ? 3 : 1;
        const nextReview = nextInterval ? 
          new Date(Date.now() + nextInterval * 86400000).toISOString() : 
          null;
        const last = new Date().toISOString();
        return Promise.resolve({ 
          success: true,
          data: {
            word: {
              word: message.word,
              dateAdded: new Date().toISOString(),
              difficulty: wordData?.difficulty || 5000,
              customNotes: wordData?.customNotes || '',
              lastReviewed: last,
              nextReview,
              reviewHistory: []
            },
            nextReview,
            nextInterval
          }
        });
      }
      if (message.action === 'fetchSettings') {
        return Promise.resolve({ 
          success: true,
          settings: {
            theme: 'dark',  
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }
        });
      }
      if (message.action === 'updateSettings') {
        return Promise.resolve({ success: true, settings: message.settings });
      }
      if (message.action === 'addRecentSearch') {
        return Promise.resolve({ success: true });
      }
      if (message.action === 'fetchRecentSearches') {
        return Promise.resolve({ success: true, recentSearches: [] });
      }
      if (message.action === 'updateWord') {
        if (message.word === 'errorWord') {
          return Promise.resolve({ success: false, error: 'Update failed' });
        }
        return Promise.resolve({ success: true, data: { word: message.word, difficulty: message.updates?.difficulty || 5000, updatedAt: new Date().toISOString() } });
      }
      return Promise.resolve({ success: true });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LOOKUP_WORD message', () => {
    test('should return word data for valid word', async () => {
      const result = await handleMessage({
        action: MessageTypes.LOOKUP_WORD,
        word: 'hello'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.word).toBe('hello');
      expect(result.data.pronunciation).toBe('/həˈloʊ/');
      expect(result.data.definitions).toHaveLength(2);
    });

    test('should return error for invalid word', async () => {
      const result = await handleMessage({
        action: MessageTypes.LOOKUP_WORD,
        word: 'xyznotaword123'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found');
    });

    test('should handle fuzzy search suggestions', async () => {
      const result = await handleMessage({
        action: MessageTypes.LOOKUP_WORD,
        word: 'hllo'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('hello');
    });

    test('should require word parameter', async () => {
      const result = await handleMessage({
        action: MessageTypes.LOOKUP_WORD
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('ADD_WORD_TO_VOCABULARY_LIST message', () => {
    test('should add word to specified list', async () => {
      const listId = mockList.id;

      const result = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'hello',
        listId
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.word).toBe('hello');

      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'addWordToVocabularyList',
        listId: listId,
        word: 'hello',
        metadata: {}
      });
    });

    test('should handle word not in dictionary', async () => {
      const listId = mockList.id;

      const result = await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'notaword',
        listId
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Word not found');
    });

    test('should handle list not found', async () => {
      browser.runtime.sendNativeMessage
        .mockImplementationOnce(() => Promise.resolve({ success: true })) // incrementLookupCount
        .mockImplementationOnce(() => Promise.resolve({ success: false, error: 'List not found' }));

      await expect(handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'hello',
        listId: 'non-existent-id'
      }, { dictionary })).resolves.toEqual({
        success: false,
        error: 'List not found'
      });
    });
  });

  describe('FETCH_ALL_VOCABULARY_LISTS message', () => {
    test('should return all lists', async () => {
      const result = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.vocabularyLists).toHaveLength(1);
      expect(result.vocabularyLists[0].name).toBe('My Vocabulary');
      expect(result.vocabularyLists[0].isDefault).toBe(true);
    });

    test('should return empty array if no lists', async () => {
      browser.runtime.sendNativeMessage.mockImplementationOnce(() => 
        Promise.resolve({ success: true, vocabularyLists: [] })
      );
      
      const result = await handleMessage({
        action: MessageTypes.FETCH_ALL_VOCABULARY_LISTS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.vocabularyLists).toEqual([]);
    });
  });

  describe('CREATE_VOCABULARY_LIST message', () => {
    test('should create new list', async () => {
      const result = await handleMessage({
        action: MessageTypes.CREATE_VOCABULARY_LIST,
        name: 'New List'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.vocabularyList).toBeDefined();
      expect(result.vocabularyList.name).toBe('New List');
      expect(result.vocabularyList.id).toBeDefined();
    });

    test('should require list name', async () => {
      const result = await handleMessage({
        action: MessageTypes.CREATE_VOCABULARY_LIST
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });

    test('should handle empty list name', async () => {
      const result = await handleMessage({
        action: MessageTypes.CREATE_VOCABULARY_LIST,
        name: '   '
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('SUBMIT_REVIEW message', () => {
    test('should submit review for word', async () => {
      // First add the word
      const listId = mockList.id;
      await handleMessage({
        action: MessageTypes.ADD_WORD_TO_VOCABULARY_LIST,
        word: 'hello',
        listId
      }, { dictionary });

      const result = await handleMessage({
        action: MessageTypes.SUBMIT_REVIEW,
        listId: listId,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 10
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.word.lastReviewed).toBeDefined();
      expect(result.data.nextReview).toBeDefined();
    });

    test('should require all parameters', async () => {
      const result = await handleMessage({
        action: MessageTypes.SUBMIT_REVIEW,
        word: 'hello'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('FETCH_SETTINGS message', () => {
    test('should return settings', async () => {
      const result = await handleMessage({
        action: MessageTypes.FETCH_SETTINGS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
      expect(result.settings.theme).toBeDefined();
      expect(result.settings.autoPlayPronunciation).toBeDefined();
    });
  });

  describe('UPDATE_SETTINGS message', () => {
    test('should update settings', async () => {
      const result = await handleMessage({
        action: MessageTypes.UPDATE_SETTINGS,
        settings: { theme: 'light' }
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
      expect(result.settings.theme).toBe('light');
    });

    test('should require settings object', async () => {
      const result = await handleMessage({
        action: MessageTypes.UPDATE_SETTINGS
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('FETCH_VOCABULARY_LIST_WORDS message', () => {
    test('should return filtered and sorted words', async () => {
      await mockList.addWord('hello', { difficulty: 5000 });
      await mockList.addWord('world', { difficulty: 5000 });
      await mockList.addWord('apple', { difficulty: 1000 });

      dictionary.getLookupCount = jest.fn().mockImplementation(word => {
        return word === 'hello' ? 5 : word === 'world' ? 2 : 0;
      });

      const result = await handleMessage({
        action: MessageTypes.FETCH_VOCABULARY_LIST_WORDS,
        listId: mockList.id,
        filterBy: 'medium',
        sortBy: 'lookupCount',
        sortOrder: 'desc'
      }, { dictionary });

      expect(result.success).toBe(true);
      // New response shape: { words: UserWordData[], lookupStats: { [word]: LookupStat } }
      expect(Array.isArray(result.data.words)).toBe(true);
      expect(result.data.words).toHaveLength(2);
      expect(result.data.words[0].word).toBe('hello');
      expect(result.data.words[1].word).toBe('world');
      expect(dictionary.getLookupCount).toHaveBeenCalledWith('hello');
    });

    test('should require listId', async () => {
      const result = await handleMessage({
        action: MessageTypes.FETCH_VOCABULARY_LIST_WORDS
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('UPDATE_WORD message', () => {
    test('should update word in list', async () => {
      const result = await handleMessage({
        action: MessageTypes.UPDATE_WORD,
        listId: mockList.id,
        word: 'hello',
        updates: { difficulty: 10000 }
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data.difficulty).toBe(10000);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'updateWord',
        listId: mockList.id,
        word: 'hello',
        updates: { difficulty: 10000 }
      });
    });

    test('should handle native error', async () => {
      const result = await handleMessage({
        action: MessageTypes.UPDATE_WORD,
        listId: mockList.id,
        word: 'errorWord',
        updates: { difficulty: 1000 }
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('SUBMIT_REVIEW message', () => {
    test('should forward review to native handler', async () => {
      await mockList.addWord('hello', { difficulty: 5000 });

      const result = await handleMessage({
        action: MessageTypes.SUBMIT_REVIEW,
        listId: mockList.id,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 0.0
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'submitReview',
        listId: mockList.id,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 0.0
      });
    });

    test('should require all parameters', async () => {
      const result = await handleMessage({
        action: MessageTypes.SUBMIT_REVIEW,
        listId: mockList.id,
        word: 'hello'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });

  describe('GET_PENDING_CONTEXT_SEARCH message', () => {
    test('should return pending word when available', async () => {
      popupWordState.getPendingSearch.mockReturnValue('queued');
      const result = await handleMessage({
        action: MessageTypes.GET_PENDING_CONTEXT_SEARCH
      }, { dictionary, popupWordState });

      expect(result.success).toBe(true);
      expect(result.data).toBe('queued');
    });

    test('should error when popupWordState missing', async () => {
      const result = await handleMessage({
        action: MessageTypes.GET_PENDING_CONTEXT_SEARCH
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Popup word state not available');
    });
  });

  describe('OPEN_POPUP_WITH_WORD message', () => {
    test('should store word and open popup', async () => {
      browser.action.openPopup.mockResolvedValue();

      const result = await handleMessage({
        action: MessageTypes.OPEN_POPUP_WITH_WORD,
        word: 'hello'
      }, { dictionary, popupWordState });

      expect(result.success).toBe(true);
      expect(popupWordState.setPendingSearch).toHaveBeenCalledWith('hello');
      expect(browser.action.openPopup).toHaveBeenCalled();
    });

    test('should handle popup open failure', async () => {
      browser.action.openPopup.mockRejectedValue(new Error('fail'));

      const result = await handleMessage({
        action: MessageTypes.OPEN_POPUP_WITH_WORD,
        word: 'hello'
      }, { dictionary, popupWordState });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to open popup');
    });
  });

  describe('FETCH_RECENT_SEARCHES message', () => {
    test('should return recent searches', async () => {
      const result = await handleMessage({
        action: MessageTypes.FETCH_RECENT_SEARCHES
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.recentSearches).toBeDefined();
      expect(Array.isArray(result.recentSearches)).toBe(true);
    });
  });

  describe('Unknown message type', () => {
    test('should handle unknown message type', async () => {
      const result = await handleMessage({
        action: 'UNKNOWN_TYPE'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid request');
    });
  });
});
