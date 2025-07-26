const DictionaryService = require('../../src/services/dictionary-service');
const dictionaryData = require('../../src/data/dictionary.json');

describe('DictionaryService', () => {
  let dictionary;

  beforeEach(() => {
    dictionary = new DictionaryService(dictionaryData);
  });

  describe('constructor', () => {
    test('should initialize with dictionary data', () => {
      expect(dictionary.data).toBeDefined();
      expect(Object.keys(dictionary.data).length).toBeGreaterThan(0);
    });

    test('should normalize keys to lowercase', () => {
      const testData = {
        'HELLO': { word: 'hello' },
        'World': { word: 'world' }
      };
      const service = new DictionaryService(testData);
      expect(service.data['hello']).toBeDefined();
      expect(service.data['world']).toBeDefined();
      expect(service.data['HELLO']).toBeUndefined();
    });
  });

  describe('lookup', () => {
    test('should find exact word match', () => {
      const result = dictionary.lookup('hello');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
      expect(result.definitions).toBeDefined();
      expect(result.definitions.length).toBeGreaterThan(0);
    });

    test('should handle case-insensitive lookup', () => {
      const result = dictionary.lookup('HELLO');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
    });

    test('should trim whitespace', () => {
      const result = dictionary.lookup('  hello  ');
      expect(result).toBeDefined();
      expect(result.word).toBe('hello');
    });

    test('should return null for non-existent word', () => {
      const result = dictionary.lookup('nonexistentword');
      expect(result).toBeNull();
    });

    test('should handle empty string', () => {
      const result = dictionary.lookup('');
      expect(result).toBeNull();
    });

    test('should handle null input', () => {
      const result = dictionary.lookup(null);
      expect(result).toBeNull();
    });

    test('should handle undefined input', () => {
      const result = dictionary.lookup(undefined);
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
    test('should return words with specified part of speech', () => {
      const adjectives = dictionary.getWordsByPartOfSpeech('adjective');
      expect(Array.isArray(adjectives)).toBe(true);
      expect(adjectives.length).toBeGreaterThan(0);
      
      // Check that all returned words have adjective definitions
      adjectives.forEach(word => {
        const entry = dictionary.lookup(word);
        const hasAdjective = entry.definitions.some(def => def.partOfSpeech === 'adjective');
        expect(hasAdjective).toBe(true);
      });
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
    test('should validate word data structure', () => {
      const wordEntry = dictionary.lookup('hello');
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
});