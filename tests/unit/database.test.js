/**
 * Unit tests for VocabDict Database operations - Real Implementation
 * Tests the actual VocabDictDatabase class with real IndexedDB via fake-indexeddb
 */

// Setup fake IndexedDB for testing
require('fake-indexeddb/auto');

const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
const fs = require('fs');
const path = require('path');

// Import real implementation
const constantsPath = path.join(__dirname, '../../Shared (Extension)/Resources/constants.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');
eval(constantsCode);

const modelsPath = path.join(__dirname, '../../Shared (Extension)/Resources/models.js');
const modelsCode = fs.readFileSync(modelsPath, 'utf8');
eval(modelsCode);

const databasePath = path.join(__dirname, '../../Shared (Extension)/Resources/database.js');
const databaseCode = fs.readFileSync(databasePath, 'utf8');
eval(databaseCode);

const { SAMPLE_VOCABULARY_WORDS, SAMPLE_VOCABULARY_LISTS, TestHelpers } = require('../fixtures/testData');

describe('VocabDictDatabase - Real Implementation', () => {
  let db;

  beforeEach(async () => {
    // Reset IndexedDB
    global.indexedDB = new FDBFactory();
    
    db = new VocabDictDatabase();
    await db.initialize();
  });

  afterEach(async () => {
    if (db && db.db) {
      db.db.close();
    }
    // Clean up IndexedDB
    global.indexedDB = new FDBFactory();
  });

  describe('Initialization', () => {
    test('should initialize database successfully', async () => {
      const newDb = new VocabDictDatabase();
      await newDb.initialize();
      
      expect(newDb.db).toBeDefined();
      expect(newDb.db.name).toBe('vocabdict_db');
      expect(newDb.db.version).toBe(1);
    });

    test('should create all required object stores', async () => {
      const transaction = db.db.transaction(db.db.objectStoreNames, 'readonly');
      const storeNames = Array.from(db.db.objectStoreNames);
      
      expect(storeNames).toContain('dictionary_cache');
      expect(storeNames).toContain('vocabulary_words');
      expect(storeNames).toContain('vocabulary_lists');
      expect(storeNames).toContain('user_settings');
      expect(storeNames).toContain('learning_stats');
    });

    test('should create default list on initialization', async () => {
      const lists = await db.getAllLists();
      const defaultList = lists.find(list => list.isDefault);
      
      expect(defaultList).toBeDefined();
      expect(defaultList.name).toBe('My Vocabulary');
      expect(defaultList.isDefault).toBe(true);
    });

    test('should initialize default settings', async () => {
      const settings = await db.getSettings();
      expect(settings).toBeDefined();
      expect(settings.theme).toBe('light');
      expect(settings.autoAddToList).toBe(true);
    });

    test('should initialize default learning stats', async () => {
      const stats = await db.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalWords).toBe(0);
      expect(stats.wordsLearned).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });
  });

  describe('Word Operations', () => {
    describe('addWord', () => {
      test('should add new word successfully', async () => {
        const wordData = {
          word: 'test',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'A test word',
            examples: ['This is a test.']
          }]
        };

        const word = await db.addWord(wordData);
        
        expect(word).toBeDefined();
        expect(word.id).toMatch(/^word_\d+_[a-z0-9]+$/);
        expect(word.word).toBe('test');
        expect(word.definitions).toHaveLength(1);
        expect(word.lookupCount).toBe(1);
      });

      test('should handle duplicate words by updating lookup count', async () => {
        const wordData = {
          word: 'duplicate',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'A duplicate word',
            examples: []
          }]
        };

        const word1 = await db.addWord(wordData);
        const word2 = await db.addWord(wordData);
        
        expect(word2.id).toBe(word1.id);
        expect(word2.lookupCount).toBe(2);
      });

      test('should throw error for invalid word data', async () => {
        await expect(db.addWord(null)).rejects.toThrow();
        await expect(db.addWord({})).rejects.toThrow();
        await expect(db.addWord({ word: '' })).rejects.toThrow();
      });
    });

    describe('getWord', () => {
      test('should retrieve word by id', async () => {
        const wordData = {
          word: 'retrieve',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To get back',
            examples: ['Retrieve the data']
          }]
        };

        const addedWord = await db.addWord(wordData);
        const retrievedWord = await db.getWord(addedWord.id);
        
        expect(retrievedWord).toBeDefined();
        expect(retrievedWord.id).toBe(addedWord.id);
        expect(retrievedWord.word).toBe('retrieve');
      });

      test('should return null for non-existent word', async () => {
        const word = await db.getWord('non_existent_id');
        expect(word).toBeNull();
      });
    });

    describe('getAllWords', () => {
      test('should return empty array when no words exist', async () => {
        const words = await db.getAllWords();
        expect(words).toEqual([]);
      });

      test('should return all words when they exist', async () => {
        await db.addWord({ word: 'word1', definitions: [{ partOfSpeech: 'noun', meaning: 'First word', examples: [] }] });
        await db.addWord({ word: 'word2', definitions: [{ partOfSpeech: 'noun', meaning: 'Second word', examples: [] }] });

        const words = await db.getAllWords();
        expect(words).toHaveLength(2);
        expect(words.map(w => w.word)).toContain('word1');
        expect(words.map(w => w.word)).toContain('word2');
      });
    });

    describe('updateWord', () => {
      test('should update existing word', async () => {
        const wordData = {
          word: 'update',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To modify',
            examples: []
          }]
        };

        const addedWord = await db.addWord(wordData);
        addedWord.difficulty = 'hard';
        addedWord.lookupCount = 5;

        const updatedWord = await db.updateWord(addedWord);
        
        expect(updatedWord.difficulty).toBe('hard');
        expect(updatedWord.lookupCount).toBe(5);
      });

      test('should throw error for non-existent word', async () => {
        const nonExistentWord = new VocabularyWord({
          id: 'fake_id',
          word: 'fake',
          definitions: []
        });

        await expect(db.updateWord(nonExistentWord)).rejects.toThrow();
      });
    });

    describe('deleteWord', () => {
      test('should delete existing word', async () => {
        const wordData = {
          word: 'delete',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To remove',
            examples: []
          }]
        };

        const addedWord = await db.addWord(wordData);
        await db.deleteWord(addedWord.id);

        const deletedWord = await db.getWord(addedWord.id);
        expect(deletedWord).toBeNull();
      });

      test('should handle deletion of non-existent word gracefully', async () => {
        await expect(db.deleteWord('non_existent_id')).resolves.not.toThrow();
      });
    });
  });

  describe('List Operations', () => {
    describe('addList', () => {
      test('should add new list successfully', async () => {
        const listData = {
          name: 'Test List',
          description: 'A test vocabulary list'
        };

        const list = await db.addList(listData);
        
        expect(list).toBeDefined();
        expect(list.id).toMatch(/^list_\d+_[a-z0-9]+$/);
        expect(list.name).toBe('Test List');
        expect(list.description).toBe('A test vocabulary list');
        expect(list.isDefault).toBe(false);
        expect(list.wordIds).toEqual([]);
      });

      test('should throw error for duplicate list names', async () => {
        await db.addList({ name: 'Unique List' });
        await expect(db.addList({ name: 'Unique List' })).rejects.toThrow();
      });
    });

    describe('addWordToList', () => {
      test('should add word to list successfully', async () => {
        const word = await db.addWord({
          word: 'listword',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'A word in a list',
            examples: []
          }]
        });

        const list = await db.addList({ name: 'Test List' });
        await db.addWordToList(word.id, list.id);

        const updatedList = await db.getList(list.id);
        expect(updatedList.wordIds).toContain(word.id);
      });

      test('should prevent duplicate words in same list', async () => {
        const word = await db.addWord({
          word: 'duplicate',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'A duplicate word',
            examples: []
          }]
        });

        const list = await db.addList({ name: 'Test List' });
        
        await db.addWordToList(word.id, list.id);
        await db.addWordToList(word.id, list.id); // Should not add twice

        const updatedList = await db.getList(list.id);
        expect(updatedList.wordIds.filter(id => id === word.id)).toHaveLength(1);
      });
    });
  });

  describe('Settings Operations', () => {
    test('should update settings successfully', async () => {
      const settings = await db.getSettings();
      settings.theme = 'dark';
      settings.autoAddToList = false;

      const updatedSettings = await db.updateSettings(settings);
      
      expect(updatedSettings.theme).toBe('dark');
      expect(updatedSettings.autoAddToList).toBe(false);
    });

    test('should persist settings across database instances', async () => {
      const settings = await db.getSettings();
      settings.theme = 'dark';
      await db.updateSettings(settings);

      // Create new database instance
      const newDb = new VocabDictDatabase();
      await newDb.initialize();
      
      const retrievedSettings = await newDb.getSettings();
      expect(retrievedSettings.theme).toBe('dark');
      
      newDb.db.close();
    });
  });

  describe('Learning Stats Operations', () => {
    test('should update learning stats successfully', async () => {
      const stats = await db.getStats();
      stats.totalWords = 10;
      stats.wordsLearned = 5;
      stats.currentStreak = 3;

      const updatedStats = await db.updateStats(stats);
      
      expect(updatedStats.totalWords).toBe(10);
      expect(updatedStats.wordsLearned).toBe(5);
      expect(updatedStats.currentStreak).toBe(3);
    });

    test('should update review stats correctly', async () => {
      await db.updateReviewStats(true); // Correct answer
      let stats = await db.getStats();
      expect(stats.totalReviews).toBe(1);
      expect(stats.currentStreak).toBe(1);

      await db.updateReviewStats(false); // Incorrect answer
      stats = await db.getStats();
      expect(stats.totalReviews).toBe(2);
      expect(stats.currentStreak).toBe(0);
    });
  });

  describe('Database Transactions and Concurrency', () => {
    test('should handle concurrent operations correctly', async () => {
      const promises = [];
      
      // Create multiple words concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(db.addWord({
          word: `concurrent${i}`,
          definitions: [{
            partOfSpeech: 'noun',
            meaning: `Concurrent word ${i}`,
            examples: []
          }]
        }));
      }

      const words = await Promise.all(promises);
      
      expect(words).toHaveLength(5);
      words.forEach((word, index) => {
        expect(word.word).toBe(`concurrent${index}`);
      });

      const allWords = await db.getAllWords();
      expect(allWords).toHaveLength(5);
    });

    test('should rollback on transaction error', async () => {
      const initialWordCount = (await db.getAllWords()).length;
      
      try {
        // Attempt to add invalid data that should cause rollback
        await db.addWord({ word: null, definitions: null });
      } catch (error) {
        // Expected to throw
      }

      const finalWordCount = (await db.getAllWords()).length;
      expect(finalWordCount).toBe(initialWordCount);
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should enforce required fields', async () => {
      await expect(db.addWord({})).rejects.toThrow();
      await expect(db.addWord({ word: '' })).rejects.toThrow();
      await expect(db.addWord({ word: 'test' })).rejects.toThrow(); // No definitions
    });

    test('should validate data types', async () => {
      await expect(db.addWord({
        word: 123, // Should be string
        definitions: []
      })).rejects.toThrow();
    });

    test('should maintain referential integrity for word-list relationships', async () => {
      const word = await db.addWord({
        word: 'integrity',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'Data consistency',
          examples: []
        }]
      });

      const list = await db.addList({ name: 'Integrity List' });
      await db.addWordToList(word.id, list.id);

      // Delete the word
      await db.deleteWord(word.id);

      // List should no longer contain the word
      const updatedList = await db.getList(list.id);
      expect(updatedList.wordIds).not.toContain(word.id);
    });
  });
});