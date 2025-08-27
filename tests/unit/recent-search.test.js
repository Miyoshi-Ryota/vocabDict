const { handleMessage, MessageTypes } = require('../../src/background/message-handler');

describe('Recent Search History', () => {
  let mockDictionary;
  let mockStorage;
  let mockPopupWordState;
  
  beforeEach(() => {
    // Mock browser API
    global.browser = {
      runtime: {
        sendNativeMessage: jest.fn()
      }
    };
    
    // Mock dictionary with lookup method
    mockDictionary = {
      lookup: jest.fn(),
      fuzzyMatch: jest.fn().mockReturnValue([]),
      getLookupCount: jest.fn().mockReturnValue(0)
    };
    
    // Mock storage (still needed for other operations)
    mockStorage = {
      get: jest.fn(),
      set: jest.fn()
    };
    
    // Mock popup word state
    mockPopupWordState = {
      getPendingSearch: jest.fn(),
      setPendingSearch: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('LOOKUP_WORD', () => {
    test('should add word to recent searches when lookup is successful', async () => {
      const word = 'hello';
      const wordData = {
        word: 'hello',
        pronunciation: '/həˈloʊ/',
        definitions: ['A greeting']
      };
      
      mockDictionary.lookup.mockResolvedValue(wordData);
      browser.runtime.sendNativeMessage.mockResolvedValue({ success: true });
      
      const result = await handleMessage(
        { type: MessageTypes.LOOKUP_WORD, word },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(wordData);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: "addRecentSearch",
        word: word
      });
    });
    
    test('should not add word to recent searches when lookup fails', async () => {
      const word = 'nonexistentword';
      
      mockDictionary.lookup.mockResolvedValue(null);
      
      const result = await handleMessage(
        { type: MessageTypes.LOOKUP_WORD, word },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(false);
      expect(browser.runtime.sendNativeMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: "addRecentSearch" })
      );
    });
    
    test('should continue even if adding recent search fails', async () => {
      const word = 'hello';
      const wordData = {
        word: 'hello',
        pronunciation: '/həˈloʊ/',
        definitions: ['A greeting']
      };
      
      mockDictionary.lookup.mockResolvedValue(wordData);
      browser.runtime.sendNativeMessage.mockRejectedValue(new Error('Native message failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await handleMessage(
        { type: MessageTypes.LOOKUP_WORD, word },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(wordData);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add recent search:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('GET_RECENT_SEARCHES', () => {
    test('should get recent searches from native handler', async () => {
      const recentSearches = ['hello', 'world', 'test'];
      browser.runtime.sendNativeMessage.mockResolvedValue({ 
        recentSearches: recentSearches 
      });
      
      const result = await handleMessage(
        { type: MessageTypes.GET_RECENT_SEARCHES },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(recentSearches);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: "getRecentSearches"
      });
    });
    
    test('should return empty array if getting recent searches fails', async () => {
      browser.runtime.sendNativeMessage.mockRejectedValue(new Error('Native message failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await handleMessage(
        { type: MessageTypes.GET_RECENT_SEARCHES },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recent searches:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
    
    test('should return empty array if response has no recentSearches field', async () => {
      browser.runtime.sendNativeMessage.mockResolvedValue({});
      
      const result = await handleMessage(
        { type: MessageTypes.GET_RECENT_SEARCHES },
        { dictionary: mockDictionary, storage: mockStorage, popupWordState: mockPopupWordState }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});