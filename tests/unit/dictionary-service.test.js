const DictionaryService = require('../../src/services/dictionary-service');
const StorageManager = require('../../src/services/storage');
const dictionaryData = require('../../src/data/dictionary.json');

describe('DictionaryService', () => {
  let dictionary;
  let storageManager;

  beforeEach(async () => {
    // Clear storage before each test
    await browser.storage.local.clear();
    
    storageManager = StorageManager;
    dictionary = new DictionaryService(dictionaryData, storageManager);
    await dictionary.loadLookupStatistics();
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
      const suggestions = dictionary.fuzzyMatch('xyz123');
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
      const adjectives = dictionary.getWordsByPartOfSpeech('adjective');
      expect(Array.isArray(adjectives)).toBe(true);
      expect(adjectives.length).toBeGreaterThan(0);

      // Check that all returned words have adjective definitions
      for (const word of adjectives) {
        const entry = await dictionary.lookup(word);
        const hasAdjective = entry.definitions.some(def => def.partOfSpeech === 'adjective');
        expect(hasAdjective).toBe(true);
      }
    });

    test('should handle case insensitive part of speech', () => {
      const nouns1 = dictionary.getWordsByPartOfSpeech('noun');
      const nouns2 = dictionary.getWordsByPartOfSpeech('NOUN');
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
      const results = dictionary.searchByDefinition('greeting');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('hello');
    });

    test('should be case insensitive', () => {
      const results1 = dictionary.searchByDefinition('greeting');
      const results2 = dictionary.searchByDefinition('GREETING');
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
    test('should initialize with empty lookup statistics', () => {
      expect(dictionary.lookupStatistics).toBeDefined();
      expect(dictionary.lookupStatistics.size).toBe(0);
    });

    test('should increment lookup count when word is looked up', async () => {
      // Initial count should be 0
      expect(dictionary.getLookupCount('hello')).toBe(0);

      // Look up the word
      const result = await dictionary.lookup('hello');
      expect(result).toBeDefined();

      // Count should now be 1
      expect(dictionary.getLookupCount('hello')).toBe(1);
    });

    test('should increment lookup count on multiple lookups', async () => {
      // Look up word multiple times
      await dictionary.lookup('hello');
      await dictionary.lookup('hello');
      await dictionary.lookup('hello');

      // Count should be 3
      expect(dictionary.getLookupCount('hello')).toBe(3);
    });

    test('should handle case-insensitive lookup counts', async () => {
      await dictionary.lookup('HELLO');
      await dictionary.lookup('hello');
      await dictionary.lookup('Hello');

      // All should count towards the same normalized word
      expect(dictionary.getLookupCount('hello')).toBe(3);
      expect(dictionary.getLookupCount('HELLO')).toBe(3);
    });

    test('should not increment count for failed lookups', async () => {
      // Try to look up non-existent word
      const result = await dictionary.lookup('nonexistentword');
      expect(result).toBeNull();

      // Count should remain 0
      expect(dictionary.getLookupCount('nonexistentword')).toBe(0);
    });

    test('should persist lookup statistics to storage', async () => {
      // Look up a word
      await dictionary.lookup('hello');

      // Check if data was persisted
      const stored = await storageManager.get('dictionary_lookup_stats');
      expect(stored).toBeDefined();
      expect(stored.hello).toBeDefined();
      expect(stored.hello.count).toBe(1);
      expect(stored.hello.firstLookup).toBeDefined();
      expect(stored.hello.lastLookup).toBeDefined();
    });

    test('should load lookup statistics from storage', async () => {
      // Manually set storage data
      await storageManager.set('dictionary_lookup_stats', {
        hello: { count: 5, firstLookup: '2025-01-01T10:00:00Z', lastLookup: '2025-01-03T15:30:00Z' },
        eloquent: { count: 2, firstLookup: '2025-01-02T14:00:00Z', lastLookup: '2025-01-02T16:00:00Z' }
      });

      // Create new dictionary instance and load stats
      const newDictionary = new DictionaryService(dictionaryData, storageManager);
      await newDictionary.loadLookupStatistics();

      // Verify loaded counts
      expect(newDictionary.getLookupCount('hello')).toBe(5);
      expect(newDictionary.getLookupCount('eloquent')).toBe(2);
    });

    test('should track first and last lookup times', async () => {
      const beforeLookup = new Date().toISOString();
      
      // Look up word
      await dictionary.lookup('hello');
      
      const afterLookup = new Date().toISOString();

      // Check stored data
      const stored = await storageManager.get('dictionary_lookup_stats');
      const helloStats = stored.hello;
      
      expect(helloStats.firstLookup).toBeDefined();
      expect(helloStats.lastLookup).toBeDefined();
      expect(helloStats.firstLookup).toEqual(helloStats.lastLookup); // Same for first lookup
      expect(helloStats.firstLookup >= beforeLookup).toBe(true);
      expect(helloStats.lastLookup <= afterLookup).toBe(true);
    });

    test('should update last lookup time on subsequent lookups', async () => {
      // First lookup
      await dictionary.lookup('hello');
      const stored1 = await storageManager.get('dictionary_lookup_stats');
      const firstTime = stored1.hello.lastLookup;

      // Wait a bit and lookup again
      await new Promise(resolve => setTimeout(resolve, 10));
      await dictionary.lookup('hello');
      
      const stored2 = await storageManager.get('dictionary_lookup_stats');
      const secondTime = stored2.hello.lastLookup;

      // Times should be different
      expect(secondTime > firstTime).toBe(true);
      expect(stored2.hello.count).toBe(2);
      expect(stored2.hello.firstLookup).toBe(firstTime); // First time unchanged
    });

    test('should handle trimmed and whitespace words in lookup statistics', async () => {
      await dictionary.lookup('  hello  ');
      expect(dictionary.getLookupCount('hello')).toBe(1);
      expect(dictionary.getLookupCount('  hello  ')).toBe(1);
    });

    test('should return 0 for words never looked up', () => {
      expect(dictionary.getLookupCount('neverlookedup')).toBe(0);
      expect(dictionary.getLookupCount('')).toBe(0);
      expect(dictionary.getLookupCount(null)).toBe(0);
    });
  });
});
