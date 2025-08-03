const VocabularyList = require('../../src/services/vocabulary-list');
const DictionaryService = require('../../src/services/dictionary-service');
const StorageManager = require('../../src/services/storage');
const dictionaryData = require('../../src/data/dictionary.json');

describe('VocabularyList', () => {
  let list;
  let dictionary;
  let storageManager;

  beforeEach(async () => {
    // Clear storage before each test
    await browser.storage.local.clear();

    storageManager = StorageManager;
    dictionary = new DictionaryService(dictionaryData, storageManager);
    await dictionary.loadLookupStatistics();
    list = new VocabularyList('Test List', dictionary);
  });

  describe('constructor', () => {
    test('should create list with name and dictionary reference', () => {
      expect(list.name).toBe('Test List');
      expect(list.id).toBeDefined();
      expect(list.created).toBeDefined();
      expect(list.isDefault).toBe(false);
      expect(list.words).toEqual({});
      expect(list.dictionary).toBe(dictionary);
    });

    test('should allow setting isDefault', () => {
      const defaultList = new VocabularyList('My Vocabulary', dictionary, true);
      expect(defaultList.isDefault).toBe(true);
    });

    test('should throw error without dictionary', () => {
      expect(() => new VocabularyList('Test', null)).toThrow('Dictionary is required');
    });
  });

  describe('addWord', () => {
    test('should add word that exists in dictionary', async () => {
      const entry = await list.addWord('hello');

      expect(entry).toBeDefined();
      expect(entry.word).toBe('hello');
      expect(entry.dateAdded).toBeDefined();
      expect(entry.difficulty).toBe('medium');
      expect(entry.lastReviewed).toBeNull();
      expect(entry.nextReview).toBeDefined();
      expect(entry.reviewHistory).toEqual([]);
      expect(entry.customNotes).toBe('');

      expect(list.words.hello).toBe(entry);
    });

    test('should throw error for word not in dictionary', async () => {
      await expect(list.addWord('nonexistentword')).rejects.toThrow('Word not found in dictionary');
    });

    test('should not add duplicate word', async () => {
      await list.addWord('hello');
      await expect(list.addWord('hello')).rejects.toThrow('Word already exists in list');
    });

    test('should handle case-insensitive duplicate detection', async () => {
      await list.addWord('hello');
      await expect(list.addWord('HELLO')).rejects.toThrow('Word already exists in list');
    });

    test('should accept optional metadata', async () => {
      const entry = await list.addWord('hello', {
        difficulty: 'hard',
        customNotes: 'Common greeting'
      });

      expect(entry.difficulty).toBe('hard');
      expect(entry.customNotes).toBe('Common greeting');
    });
  });

  describe('removeWord', () => {
    beforeEach(async () => {
      await list.addWord('hello');
      await list.addWord('eloquent');
    });

    test('should remove word by text', () => {
      const removed = list.removeWord('hello');

      expect(removed).toBeDefined();
      expect(removed.word).toBe('hello');
      expect(list.words.hello).toBeUndefined();
      expect(Object.keys(list.words).length).toBe(1);
    });

    test('should handle case-insensitive removal', () => {
      const removed = list.removeWord('HELLO');
      expect(removed).toBeDefined();
      expect(removed.word).toBe('hello');
    });

    test('should return null for non-existent word', () => {
      const result = list.removeWord('nonexistent');
      expect(result).toBeNull();
      expect(Object.keys(list.words).length).toBe(2);
    });
  });

  describe('updateWord', () => {
    beforeEach(async () => {
      await list.addWord('hello');
    });

    test('should update user-specific properties', () => {
      const updated = list.updateWord('hello', {
        difficulty: 'hard',
        customNotes: 'Updated note'
      });

      expect(updated.difficulty).toBe('hard');
      expect(updated.customNotes).toBe('Updated note');
    });

    test('should update review data', () => {
      const now = new Date().toISOString();
      const updated = list.updateWord('hello', {
        lastReviewed: now,
        nextReview: new Date(Date.now() + 86400000).toISOString(),
        reviewHistory: [{ date: now, result: 'known', timeSpent: 3.5 }]
      });

      expect(updated.lastReviewed).toBe(now);
      expect(updated.reviewHistory.length).toBe(1);
    });

    test('should handle case-insensitive update', () => {
      const updated = list.updateWord('HELLO', { difficulty: 'easy' });
      expect(updated).toBeDefined();
      expect(list.words.hello.difficulty).toBe('easy');
    });

    test('should return null for non-existent word', () => {
      const result = list.updateWord('nonexistent', { difficulty: 'hard' });
      expect(result).toBeNull();
    });
  });

  describe('getWord', () => {
    beforeEach(async () => {
      await list.addWord('hello');
    });

    test('should get word with full data', async () => {
      const word = await list.getWord('hello');

      expect(word).toBeDefined();
      expect(word.word).toBe('hello');
      expect(word.definitions).toBeDefined(); // From dictionary
      expect(word.pronunciation).toBeDefined(); // From dictionary
      expect(word.synonyms).toBeDefined(); // From dictionary
      expect(word.antonyms).toBeDefined(); // From dictionary
      expect(word.dateAdded).toBeDefined(); // From list
      expect(word.difficulty).toBe('medium'); // From list
      expect(word.customNotes).toBe(''); // From list
    });

    test('should handle case-insensitive lookup', async () => {
      const word = await list.getWord('HELLO');
      expect(word).toBeDefined();
      expect(word.word).toBe('hello');
    });

    test('should return null for non-existent word', async () => {
      const result = await list.getWord('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getWords', () => {
    beforeEach(async () => {
      await list.addWord('hello');
      await list.addWord('eloquent');
      await list.addWord('serendipity');
    });

    test('should return all words with full data', async () => {
      const words = await list.getWords();

      expect(words.length).toBe(3);
      words.forEach(word => {
        expect(word.definitions).toBeDefined();
        expect(word.dateAdded).toBeDefined();
      });
    });
  });

  describe('sorting', () => {
    beforeEach(async () => {
      // Add words with different properties
      await list.addWord('zealous', { difficulty: 'hard' });
      await list.addWord('aesthetic', { difficulty: 'easy' });
      await list.addWord('brevity', { difficulty: 'medium' });

      // Set different review dates
      const now = Date.now();
      list.updateWord('zealous', {
        lastReviewed: new Date(now - 3 * 86400000).toISOString() // 3 days ago
      });
      list.updateWord('aesthetic', {
        lastReviewed: new Date(now - 1 * 86400000).toISOString() // 1 day ago
      });
      // brevity has no review date
    });

    test('should sort alphabetically A-Z', async () => {
      const sorted = await list.sortBy('alphabetical', 'asc');
      expect(sorted[0].word).toBe('aesthetic');
      expect(sorted[1].word).toBe('brevity');
      expect(sorted[2].word).toBe('zealous');
    });

    test('should sort alphabetically Z-A', async () => {
      const sorted = await list.sortBy('alphabetical', 'desc');
      expect(sorted[0].word).toBe('zealous');
      expect(sorted[1].word).toBe('brevity');
      expect(sorted[2].word).toBe('aesthetic');
    });

    test('should sort by date added (newest first)', async () => {
      const sorted = await list.sortBy('dateAdded', 'desc');
      expect(sorted[0].word).toBe('brevity'); // Last added
      expect(sorted[2].word).toBe('zealous'); // First added
    });

    test('should sort by last reviewed date', async () => {
      const sorted = await list.sortBy('lastReviewed', 'desc');
      expect(sorted[0].word).toBe('aesthetic'); // Most recent review (1 day ago)
      expect(sorted[1].word).toBe('zealous'); // Older review (3 days ago)
      expect(sorted[2].word).toBe('brevity'); // Never reviewed (at the end)
    });

    test('should sort by difficulty', async () => {
      const sorted = await list.sortBy('difficulty', 'asc');
      expect(sorted[0].difficulty).toBe('easy');
      expect(sorted[1].difficulty).toBe('medium');
      expect(sorted[2].difficulty).toBe('hard');
    });

    test('should sort by lookup count', async () => {
      // Set up lookup counts in dictionary
      await dictionary.lookup('zealous'); // 1 lookup
      await dictionary.lookup('aesthetic'); // 1 lookup
      await dictionary.lookup('aesthetic'); // 2 lookups
      await dictionary.lookup('aesthetic'); // 3 lookups
      await dictionary.lookup('brevity'); // 1 lookup
      await dictionary.lookup('brevity'); // 2 lookups

      const sorted = await list.sortBy('lookupCount', 'desc');
      expect(sorted[0].word).toBe('aesthetic'); // 3 lookups
      expect(sorted[1].word).toBe('brevity'); // 2 lookups
      expect(sorted[2].word).toBe('zealous'); // 1 lookup
    });
  });

  describe('filtering', () => {
    beforeEach(async () => {
      await list.addWord('hello', { difficulty: 'easy' });
      await list.addWord('aesthetic', { difficulty: 'easy' });
      await list.addWord('eloquent', { difficulty: 'medium' });
      await list.addWord('serendipity', { difficulty: 'hard' });

      // Add review dates to some words
      list.updateWord('hello', {
        lastReviewed: new Date().toISOString(),
        nextReview: new Date(Date.now() - 86400000).toISOString() // Yesterday (due)
      });
    });

    test('should filter by difficulty', async () => {
      const easyWords = await list.filterBy('difficulty', 'easy');
      expect(easyWords.length).toBe(2);
      expect(easyWords.every(w => w.difficulty === 'easy')).toBe(true);
    });

    test('should filter by review status - due', async () => {
      const dueWords = await list.filterBy('reviewStatus', 'due');
      expect(dueWords.length).toBe(1);
      expect(dueWords[0].word).toBe('hello');
    });

    test('should filter by review status - new', async () => {
      const newWords = await list.filterBy('reviewStatus', 'new');
      expect(newWords.length).toBe(3); // All except hello
    });

    test('should filter by review status - reviewed', async () => {
      const reviewedWords = await list.filterBy('reviewStatus', 'reviewed');
      expect(reviewedWords.length).toBe(1);
      expect(reviewedWords[0].word).toBe('hello');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await list.addWord('hello', { customNotes: 'A common greeting' });
      await list.addWord('eloquent');
      await list.addWord('aesthetic');
    });

    test('should search in word text', async () => {
      const results = await list.search('hell');
      expect(results.length).toBe(1);
      expect(results[0].word).toBe('hello');
    });

    test('should search in definitions', async () => {
      const results = await list.search('fluent');
      expect(results.length).toBe(1);
      expect(results[0].word).toBe('eloquent');
    });

    test('should search in custom notes', async () => {
      const results = await list.search('common greeting');
      expect(results.length).toBe(1);
      expect(results[0].word).toBe('hello');
    });

    test('should be case insensitive', async () => {
      const results1 = await list.search('HELLO');
      const results2 = await list.search('hello');
      expect(results1.length).toBe(results2.length);
      expect(results1[0].word).toBe(results2[0].word);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await list.addWord('hello', { difficulty: 'easy' });
      await list.addWord('aesthetic', { difficulty: 'easy' });
      await list.addWord('eloquent', { difficulty: 'medium' });
      await list.addWord('serendipity', { difficulty: 'hard' });
    });

    test('should calculate statistics', async () => {
      const stats = await list.getStatistics();

      expect(stats.totalWords).toBe(4);
      expect(stats.byDifficulty.easy).toBe(2);
      expect(stats.byDifficulty.medium).toBe(1);
      expect(stats.byDifficulty.hard).toBe(1);
      expect(stats.totalReviews).toBe(0);
      expect(stats.wordsReviewed).toBe(0);
      expect(stats.wordsDue).toBe(0);
    });

    test('should update statistics after reviews', async () => {
      list.updateWord('hello', {
        lastReviewed: new Date().toISOString(),
        reviewHistory: [{ date: new Date().toISOString(), result: 'known', timeSpent: 3 }]
      });

      const stats = await list.getStatistics();
      expect(stats.totalReviews).toBe(1);
      expect(stats.wordsReviewed).toBe(1);
    });
  });

  describe('serialization', () => {
    test('should convert to JSON', async () => {
      await list.addWord('hello');

      const json = list.toJSON();
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name', 'Test List');
      expect(json).toHaveProperty('created');
      expect(json).toHaveProperty('isDefault', false);
      expect(json).toHaveProperty('words');
      expect(Object.keys(json.words).length).toBe(1);
      expect(json.words.hello).toBeDefined();
    });

    test('should create from JSON', () => {
      const json = {
        id: 'list-123',
        name: 'Imported List',
        created: new Date().toISOString(),
        isDefault: true,
        words: {
          hello: {
            word: 'hello',
            dateAdded: new Date().toISOString(),
            difficulty: 'easy',
            lastReviewed: null,
            nextReview: null,
            reviewHistory: [],
            customNotes: 'Test note'
          }
        }
      };

      const imported = VocabularyList.fromJSON(json, dictionary);
      expect(imported.id).toBe('list-123');
      expect(imported.name).toBe('Imported List');
      expect(imported.isDefault).toBe(true);
      expect(Object.keys(imported.words).length).toBe(1);
      expect(imported.words.hello.difficulty).toBe('easy');
      expect(imported.words.hello.customNotes).toBe('Test note');
    });
  });
});
