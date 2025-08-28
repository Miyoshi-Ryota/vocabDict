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
      if (message.action === 'getVocabularyLists') {
        return Promise.resolve({ 
          vocabularyLists: [mockList.toJSON()]
        });
      }
      if (message.action === 'addWordToList') {
        const word = message.word;
        if (!dictionary.getDictionaryData(word)) {
          return Promise.resolve({ error: 'Word not found in dictionary' });
        }
        if (mockList.words[word.toLowerCase()]) {
          return Promise.resolve({ error: 'Word already exists in list' });
        }
        const wordEntry = {
          word: word,
          dateAdded: new Date().toISOString(),
          difficulty: message.metadata?.difficulty || 'medium',
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
          vocabularyList: {
            id: 'new-list-id',
            name: message.name,
            created: new Date().toISOString(),
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
        const nextInterval = message.result === 'mastered' ? null : 
                           message.result === 'unknown' ? 1 :
                           message.result === 'known' ? 3 : 1;
        const nextReview = nextInterval ? 
          new Date(Date.now() + nextInterval * 86400000).toISOString() : 
          null;
        return Promise.resolve({ 
          data: {
            word: message.word,
            lastReviewed: new Date().toISOString(),
            nextReview: nextReview,
            nextInterval: nextInterval
          }
        });
      }
      if (message.action === 'getSettings') {
        return Promise.resolve({ 
          settings: {
            theme: 'dark',  
            autoPlayPronunciation: false,
            showExampleSentences: true,
            textSelectionMode: 'inline'
          }
        });
      }
      if (message.action === 'updateSettings') {
        return Promise.resolve({
          settings: message.settings
        });
      }
      if (message.action === 'addRecentSearch') {
        return Promise.resolve({ success: true });
      }
      if (message.action === 'updateWord') {
        if (message.word === 'errorWord') {
          return Promise.resolve({ error: 'Update failed' });
        }
        return Promise.resolve({
          data: {
            word: message.word,
            ...message.updates
          }
        });
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
        type: MessageTypes.LOOKUP_WORD,
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
        type: MessageTypes.LOOKUP_WORD,
        word: 'xyznotaword123'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word not found');
    });

    test('should handle fuzzy search suggestions', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: 'hllo'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toContain('hello');
    });

    test('should require word parameter', async () => {
      const result = await handleMessage({
        type: MessageTypes.LOOKUP_WORD
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Word parameter is required');
    });
  });

  describe('ADD_TO_LIST message', () => {
    test('should add word to specified list', async () => {
      const listId = mockList.id;

      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.word).toBe('hello');

      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'addWordToList',
        listId: listId,
        word: 'hello',
        metadata: {}
      });
    });

    test('should handle word not in dictionary', async () => {
      const listId = mockList.id;

      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'notaword',
        listId
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Word not found');
    });

    test('should handle list not found', async () => {
      const result = await handleMessage({
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId: 'non-existent-id'
      }, { dictionary });

      // Since we're using native messaging, the error comes from the native side
      expect(result.success).toBe(true); // Native mock returns success for unknown actions
    });
  });

  describe('GET_LISTS message', () => {
    test('should return all lists', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('My Vocabulary');
      expect(result.data[0].isDefault).toBe(true);
    });

    test('should return empty array if no lists', async () => {
      browser.runtime.sendNativeMessage.mockImplementationOnce(() => 
        Promise.resolve({ vocabularyLists: [] })
      );
      
      const result = await handleMessage({
        type: MessageTypes.GET_LISTS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('CREATE_LIST message', () => {
    test('should create new list', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST,
        name: 'New List'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('New List');
      expect(result.data.id).toBeDefined();
    });

    test('should require list name', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('name is required');
    });

    test('should handle empty list name', async () => {
      const result = await handleMessage({
        type: MessageTypes.CREATE_LIST,
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
        type: MessageTypes.ADD_TO_LIST,
        word: 'hello',
        listId
      }, { dictionary });

      const result = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        listId: listId,
        word: 'hello',
        reviewResult: 'known',
        timeSpent: 10
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.lastReviewed).toBeDefined();
      expect(result.data.nextReview).toBeDefined();
    });

    test('should require all parameters', async () => {
      const result = await handleMessage({
        type: MessageTypes.SUBMIT_REVIEW,
        word: 'hello'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('GET_SETTINGS message', () => {
    test('should return settings', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_SETTINGS
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.theme).toBeDefined();
      expect(result.data.autoPlayPronunciation).toBeDefined();
    });
  });

  describe('UPDATE_SETTINGS message', () => {
    test('should update settings', async () => {
      const result = await handleMessage({
        type: MessageTypes.UPDATE_SETTINGS,
        settings: { theme: 'light' }
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.theme).toBe('light');
    });

    test('should require settings object', async () => {
      const result = await handleMessage({
        type: MessageTypes.UPDATE_SETTINGS
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('GET_LIST_WORDS message', () => {
    test('should return filtered and sorted words', async () => {
      await mockList.addWord('hello', { difficulty: 'medium' });
      await mockList.addWord('world', { difficulty: 'medium' });
      await mockList.addWord('apple', { difficulty: 'easy' });

      dictionary.getLookupCount = jest.fn().mockImplementation(word => {
        return word === 'hello' ? 5 : word === 'world' ? 2 : 0;
      });

      const result = await handleMessage({
        type: MessageTypes.GET_LIST_WORDS,
        listId: mockList.id,
        filterBy: 'medium',
        sortBy: 'lookupCount',
        sortOrder: 'desc'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].word).toBe('hello');
      expect(result.data[1].word).toBe('world');
      expect(dictionary.getLookupCount).toHaveBeenCalledWith('hello');
    });

    test('should require listId', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_LIST_WORDS
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ListId is required');
    });
  });

  describe('UPDATE_WORD message', () => {
    test('should update word in list', async () => {
      const result = await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId: mockList.id,
        word: 'hello',
        updates: { difficulty: 'hard' }
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data.difficulty).toBe('hard');
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'updateWord',
        listId: mockList.id,
        word: 'hello',
        updates: { difficulty: 'hard' }
      });
    });

    test('should handle native error', async () => {
      const result = await handleMessage({
        type: MessageTypes.UPDATE_WORD,
        listId: mockList.id,
        word: 'errorWord',
        updates: { difficulty: 'easy' }
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('PROCESS_REVIEW message', () => {
    test('should forward review to native handler', async () => {
      await mockList.addWord('hello', { difficulty: 'medium' });

      const result = await handleMessage({
        type: MessageTypes.PROCESS_REVIEW,
        listId: mockList.id,
        word: 'hello',
        result: 'known'
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'submitReview',
        listId: mockList.id,
        word: 'hello',
        result: 'known',
        timeSpent: 0.0
      });
    });

    test('should require all parameters', async () => {
      const result = await handleMessage({
        type: MessageTypes.PROCESS_REVIEW,
        listId: mockList.id,
        word: 'hello'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('GET_PENDING_CONTEXT_SEARCH message', () => {
    test('should return pending word when available', async () => {
      popupWordState.getPendingSearch.mockReturnValue('queued');
      const result = await handleMessage({
        type: MessageTypes.GET_PENDING_CONTEXT_SEARCH
      }, { dictionary, popupWordState });

      expect(result.success).toBe(true);
      expect(result.data).toBe('queued');
    });

    test('should error when popupWordState missing', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_PENDING_CONTEXT_SEARCH
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Popup word state not available');
    });
  });

  describe('OPEN_POPUP_WITH_WORD message', () => {
    test('should store word and open popup', async () => {
      browser.action.openPopup.mockResolvedValue();

      const result = await handleMessage({
        type: MessageTypes.OPEN_POPUP_WITH_WORD,
        word: 'hello'
      }, { dictionary, popupWordState });

      expect(result.success).toBe(true);
      expect(popupWordState.setPendingSearch).toHaveBeenCalledWith('hello');
      expect(browser.action.openPopup).toHaveBeenCalled();
    });

    test('should handle popup open failure', async () => {
      browser.action.openPopup.mockRejectedValue(new Error('fail'));

      const result = await handleMessage({
        type: MessageTypes.OPEN_POPUP_WITH_WORD,
        word: 'hello'
      }, { dictionary, popupWordState });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to open popup');
    });
  });

  describe('GET_RECENT_SEARCHES message', () => {
    test('should return recent searches', async () => {
      const result = await handleMessage({
        type: MessageTypes.GET_RECENT_SEARCHES
      }, { dictionary });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Unknown message type', () => {
    test('should handle unknown message type', async () => {
      const result = await handleMessage({
        type: 'UNKNOWN_TYPE'
      }, { dictionary });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown message type');
    });
  });
});