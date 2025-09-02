const DictionaryService = require('../../src/services/dictionary-service');
const dictionaryData = require('../../src/data/dictionary.json');

describe('DictionaryService', () => {
  let dictionary;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Create new dictionary instance
    dictionary = new DictionaryService(dictionaryData);
  });

  describe('constructor', () => {
    test('should initialize with dictionary data', () => {
      expect(dictionary.data).toBeDefined();
      expect(Object.keys(dictionary.data).length).toBeGreaterThan(0);
    });

    test('should normalize keys to lowercase', () => {
      const testData = {
        HELLO: { word: 'hello' },
        World: { word: 'world' }
      };
      const service = new DictionaryService(testData);
      expect(service.data.hello).toBeDefined();
      expect(service.data.world).toBeDefined();
      expect(service.data.HELLO).toBeUndefined();
    });
  });

  describe('lookup', () => {
    test('should find exact word match', async () => {
      const result = await dictionary.lookup('hello');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
      expect(result.definitions).toBeDefined();
      expect(result.definitions.length).toBeGreaterThan(0);
    });

    test('should handle case-insensitive lookup', async () => {
      const result = await dictionary.lookup('HELLO');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
    });

    test('should trim whitespace', async () => {
      const result = await dictionary.lookup('  hello  ');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
    });

    test('should return null for non-existent word', async () => {
      const result = await dictionary.lookup('nonexistentword');
      expect(result).toBeNull();
    });

    test('should handle empty string', async () => {
      const result = await dictionary.lookup('');
      expect(result).toBeNull();
    });

    test('should handle null input', async () => {
      const result = await dictionary.lookup(null);
      expect(result).toBeNull();
    });

    test('should handle undefined input', async () => {
      const result = await dictionary.lookup(undefined);
      expect(result).toBeNull();
    });
  });

  describe('fuzzyMatch', () => {
    test('should find words with similar spelling', () => {
      const suggestions = dictionary.fuzzyMatch('helo');
      expect(suggestions).toContain('hello');
    });

    test('should limit suggestions to maxSuggestions', () => {
      const suggestions = dictionary.fuzzyMatch('a', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    test('should return empty array for very different words', () => {
      const suggestions = dictionary.fuzzyMatch('xyzabc123notaword');
      expect(suggestions).toEqual([]);
    });

    test('should handle empty string', () => {
      const suggestions = dictionary.fuzzyMatch('');
      expect(suggestions).toEqual([]);
    });

    test('should be case insensitive', () => {
      const suggestions = dictionary.fuzzyMatch('ELOQENT');
      expect(suggestions).toContain('eloquent');
    });
  });

  describe('getAllWords', () => {
    test('should return array of all words', () => {
      const words = dictionary.getAllWords();
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      expect(words).toContain('hello');
      expect(words).toContain('eloquent');
    });

    test('should return sorted array', () => {
      const words = dictionary.getAllWords();
      const sortedWords = [...words].sort();
      expect(words).toEqual(sortedWords);
    });
  });

  describe('getWordsByPartOfSpeech', () => {
    test('should return words with specified part of speech', async () => {
      const adjectives = dictionary.getWordsByPartOfSpeech('形容詞');
      expect(Array.isArray(adjectives)).toBe(true);
      expect(adjectives.length).toBeGreaterThan(0);

      // Check that all returned words have adjective definitions
      for (const word of adjectives) {
        const entry = await dictionary.lookup(word);
        const hasAdjective = entry.definitions.some(def => def.partOfSpeech === '形容詞');
        expect(hasAdjective).toBe(true);
      }
    });

    test('should handle case insensitive part of speech', () => {
      const nouns1 = dictionary.getWordsByPartOfSpeech('名詞');
      const nouns2 = dictionary.getWordsByPartOfSpeech('名詞');
      expect(nouns1).toEqual(nouns2);
    });

    test('should return empty array for invalid part of speech', () => {
      const results = dictionary.getWordsByPartOfSpeech('invalidpos');
      expect(results).toEqual([]);
    });
  });

  describe('getRandomWord', () => {
    test('should return a valid word entry', () => {
      const word = dictionary.getRandomWord();
      expect(word).toBeDefined();
      expect(word.word).toBeDefined();
      expect(word.definitions).toBeDefined();
    });

    test('should return different words on multiple calls', () => {
      const words = new Set();
      for (let i = 0; i < 10; i++) {
        const word = dictionary.getRandomWord();
        words.add(word.word);
      }
      // With 50+ words, we should get at least 2 different words in 10 tries
      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('searchByDefinition', () => {
    test('should find words containing search term in definition', () => {
      const results = dictionary.searchByDefinition('挨拶');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('hello');
    });

    test('should be case insensitive', () => {
      const results1 = dictionary.searchByDefinition('挨拶');
      const results2 = dictionary.searchByDefinition('挨拶');
      expect(results1).toEqual(results2);
    });

    test('should return empty array for no matches', () => {
      const results = dictionary.searchByDefinition('xyz123abc');
      expect(results).toEqual([]);
    });
  });

  describe('validation', () => {
    test('should validate word data structure', async () => {
      const wordEntry = await dictionary.lookup('hello');
      expect(wordEntry).toHaveProperty('word');
      expect(wordEntry).toHaveProperty('pronunciation');
      expect(wordEntry).toHaveProperty('definitions');
      expect(wordEntry).toHaveProperty('synonyms');
      expect(wordEntry).toHaveProperty('antonyms');

      expect(Array.isArray(wordEntry.definitions)).toBe(true);
      expect(Array.isArray(wordEntry.synonyms)).toBe(true);
      expect(Array.isArray(wordEntry.antonyms)).toBe(true);

      wordEntry.definitions.forEach(def => {
        expect(def).toHaveProperty('partOfSpeech');
        expect(def).toHaveProperty('meaning');
        expect(def).toHaveProperty('examples');
        expect(Array.isArray(def.examples)).toBe(true);
      });
    });
  });

  describe('lookup statistics', () => {
    test('should send increment message to native when word is looked up', async () => {
      // Look up the word
      const result = await dictionary.lookup('hello');
      expect(result).toBeDefined();

      // Check that incrementLookupCount was called via sendNativeMessage
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'incrementLookupCount',
        word: 'hello'
      });
    });

    test('should send increment message on multiple lookups', async () => {
      // Look up word multiple times
      await dictionary.lookup('hello');
      await dictionary.lookup('hello');
      await dictionary.lookup('hello');

      // Should have been called 3 times
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledTimes(3);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'incrementLookupCount',
        word: 'hello'
      });
    });

    test('should normalize word before sending to native', async () => {
      await dictionary.lookup('HELLO');
      await dictionary.lookup('hello');
      await dictionary.lookup('Hello');

      // All should send the same normalized word
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledTimes(3);
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'incrementLookupCount',
        word: 'hello'
      });
    });

    test('should not send increment message for failed lookups', async () => {
      // Try to look up non-existent word
      const result = await dictionary.lookup('nonexistentword');
      expect(result).toBeNull();

      // Should not have called sendNativeMessage
      expect(browser.runtime.sendNativeMessage).not.toHaveBeenCalled();
    });

    test('should handle trimmed and whitespace words', async () => {
      await dictionary.lookup('  hello  ');
      
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'incrementLookupCount',
        word: 'hello'
      });
    });

    test('should get lookup count from native', async () => {
      // Mock the response for getLookupCount
      browser.runtime.sendNativeMessage.mockImplementation((message) => {
        if (message.action === 'fetchLookupCount') {
          return Promise.resolve({ count: 5 });
        }
        return Promise.resolve({ success: true });
      });

      const count = await dictionary.getLookupCount('hello');
      expect(count).toBe(5);
      
      expect(browser.runtime.sendNativeMessage).toHaveBeenCalledWith({
        action: 'fetchLookupCount',
        word: 'hello'
      });
    });

    test('should return 0 for words never looked up', async () => {
      // Mock the response for getLookupCount
      browser.runtime.sendNativeMessage.mockImplementation((message) => {
        if (message.action === 'fetchLookupCount') {
          return Promise.resolve({ count: 0 });
        }
        return Promise.resolve({ success: true });
      });

      const count = await dictionary.getLookupCount('neverlookedup');
      expect(count).toBe(0);
    });

    test('should return 0 for invalid input', async () => {
      expect(await dictionary.getLookupCount('')).toBe(0);
      expect(await dictionary.getLookupCount(null)).toBe(0);
      expect(await dictionary.getLookupCount(undefined)).toBe(0);
    });
  });
});
