/**
 * Unit tests for VocabDict message handlers - Real Implementation
 * Tests the actual message handler functions from handlers.js
 */

// Setup fake IndexedDB for testing
require('fake-indexeddb/auto');

const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
const fs = require('fs');
const path = require('path');

// Import real implementations
const constantsPath = path.join(__dirname, '../../Shared (Extension)/Resources/constants.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');
eval(constantsCode);

const modelsPath = path.join(__dirname, '../../Shared (Extension)/Resources/models.js');
const modelsCode = fs.readFileSync(modelsPath, 'utf8');
eval(modelsCode);

const databasePath = path.join(__dirname, '../../Shared (Extension)/Resources/database.js');
const databaseCode = fs.readFileSync(databasePath, 'utf8');
eval(databaseCode);

const dictionaryPath = path.join(__dirname, '../../Shared (Extension)/Resources/dictionary.js');
const dictionaryCode = fs.readFileSync(dictionaryPath, 'utf8');
eval(dictionaryCode);

const handlersPath = path.join(__dirname, '../../Shared (Extension)/Resources/handlers.js');
const handlersCode = fs.readFileSync(handlersPath, 'utf8');
eval(handlersCode);

const { MESSAGE_TYPES, TestHelpers } = require('../fixtures/testData');

describe('Message Handlers - Real Implementation', () => {
  let db;

  beforeEach(async () => {
    // Reset IndexedDB
    global.indexedDB = new FDBFactory();
    
    // Initialize real database
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

  describe('Dictionary Handlers', () => {
    describe('handleLookupWord', () => {
      test('should return dictionary entry for valid word', async () => {
        const result = await handleLookupWord({ word: 'hello' });
        
        expect(result).toBeDefined();
        expect(result.word).toBe('hello');
        expect(result.pronunciations).toBeDefined();
        expect(result.definitions).toBeDefined();
        expect(Array.isArray(result.definitions)).toBe(true);
        expect(result.definitions.length).toBeGreaterThan(0);
      });

      test('should return null for unknown word', async () => {
        const result = await handleLookupWord({ word: 'unknownword12345' });
        expect(result).toBeNull();
      });

      test('should handle empty or invalid input', async () => {
        await expect(handleLookupWord({ word: '' })).rejects.toThrow();
        await expect(handleLookupWord({ word: null })).rejects.toThrow();
        await expect(handleLookupWord({})).rejects.toThrow();
      });

      test('should handle case insensitive lookup', async () => {
        const lowerResult = await handleLookupWord({ word: 'hello' });
        const upperResult = await handleLookupWord({ word: 'HELLO' });
        const mixedResult = await handleLookupWord({ word: 'Hello' });
        
        expect(lowerResult).toBeDefined();
        expect(upperResult).toBeDefined();
        expect(mixedResult).toBeDefined();
      });
    });
  });

  describe('Word Management Handlers', () => {
    describe('handleAddWord', () => {
      test('should add new word successfully', async () => {
        const wordData = {
          word: 'test',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'A test word',
            examples: ['This is a test.']
          }]
        };

        const result = await handleAddWord({ wordData });
        
        expect(result).toBeDefined();
        expect(result.id).toMatch(/^word_\d+_[a-z0-9]+$/);
        expect(result.word).toBe('test');
        expect(result.lookupCount).toBe(1);
      });

      test('should increment lookup count for existing word', async () => {
        const wordData = {
          word: 'existing',
          definitions: [{
            partOfSpeech: 'noun',
            meaning: 'An existing word',
            examples: []
          }]
        };

        const firstAdd = await handleAddWord({ wordData });
        const secondAdd = await handleAddWord({ wordData });
        
        expect(secondAdd.id).toBe(firstAdd.id);
        expect(secondAdd.lookupCount).toBe(2);
      });

      test('should validate required fields', async () => {
        await expect(handleAddWord({})).rejects.toThrow();
        await expect(handleAddWord({ wordData: {} })).rejects.toThrow();
        await expect(handleAddWord({ wordData: { word: '' } })).rejects.toThrow();
      });
    });

    describe('handleGetWord', () => {
      test('should retrieve existing word', async () => {
        const wordData = {
          word: 'retrieve',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To get back',
            examples: []
          }]
        };

        const addedWord = await handleAddWord({ wordData });
        const retrievedWord = await handleGetWord({ wordId: addedWord.id });
        
        expect(retrievedWord).toBeDefined();
        expect(retrievedWord.id).toBe(addedWord.id);
        expect(retrievedWord.word).toBe('retrieve');
      });

      test('should return null for non-existent word', async () => {
        const result = await handleGetWord({ wordId: 'non_existent_id' });
        expect(result).toBeNull();
      });

      test('should validate word ID parameter', async () => {
        await expect(handleGetWord({})).rejects.toThrow();
        await expect(handleGetWord({ wordId: '' })).rejects.toThrow();
        await expect(handleGetWord({ wordId: null })).rejects.toThrow();
      });
    });

    describe('handleGetAllWords', () => {
      test('should return empty array when no words exist', async () => {
        const result = await handleGetAllWords({});
        expect(result).toEqual([]);
      });

      test('should return all words when they exist', async () => {
        await handleAddWord({
          wordData: {
            word: 'word1',
            definitions: [{ partOfSpeech: 'noun', meaning: 'First word', examples: [] }]
          }
        });

        await handleAddWord({
          wordData: {
            word: 'word2',
            definitions: [{ partOfSpeech: 'noun', meaning: 'Second word', examples: [] }]
          }
        });

        const result = await handleGetAllWords({});
        expect(result).toHaveLength(2);
        expect(result.map(w => w.word)).toContain('word1');
        expect(result.map(w => w.word)).toContain('word2');
      });
    });

    describe('handleUpdateWord', () => {
      test('should update existing word', async () => {
        const wordData = {
          word: 'update',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To modify',
            examples: []
          }]
        };

        const addedWord = await handleAddWord({ wordData });
        addedWord.difficulty = 'hard';
        addedWord.lookupCount = 5;

        const updatedWord = await handleUpdateWord({ wordData: addedWord });
        
        expect(updatedWord.difficulty).toBe('hard');
        expect(updatedWord.lookupCount).toBe(5);
      });

      test('should validate word data for update', async () => {
        await expect(handleUpdateWord({})).rejects.toThrow();
        await expect(handleUpdateWord({ wordData: null })).rejects.toThrow();
        await expect(handleUpdateWord({ wordData: { id: 'fake_id' } })).rejects.toThrow();
      });
    });

    describe('handleDeleteWord', () => {
      test('should delete existing word', async () => {
        const wordData = {
          word: 'delete',
          definitions: [{
            partOfSpeech: 'verb',
            meaning: 'To remove',
            examples: []
          }]
        };

        const addedWord = await handleAddWord({ wordData });
        await handleDeleteWord({ wordId: addedWord.id });

        const deletedWord = await handleGetWord({ wordId: addedWord.id });
        expect(deletedWord).toBeNull();
      });

      test('should handle deletion of non-existent word gracefully', async () => {
        await expect(handleDeleteWord({ wordId: 'non_existent_id' })).resolves.not.toThrow();
      });
    });
  });

  describe('List Management Handlers', () => {
    describe('handleAddList', () => {
      test('should add new list successfully', async () => {
        const listData = {
          name: 'Test List',
          description: 'A test vocabulary list'
        };

        const result = await handleAddList({ listData });
        
        expect(result).toBeDefined();
        expect(result.id).toMatch(/^list_\d+_[a-z0-9]+$/);
        expect(result.name).toBe('Test List');
        expect(result.description).toBe('A test vocabulary list');
        expect(result.isDefault).toBe(false);
      });

      test('should validate list name', async () => {
        await expect(handleAddList({})).rejects.toThrow();
        await expect(handleAddList({ listData: {} })).rejects.toThrow();
        await expect(handleAddList({ listData: { name: '' } })).rejects.toThrow();
      });
    });

    describe('handleAddWordToList', () => {
      test('should add word to list successfully', async () => {
        const word = await handleAddWord({
          wordData: {
            word: 'listword',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'A word in a list',
              examples: []
            }]
          }
        });

        const list = await handleAddList({ listData: { name: 'Test List' } });
        await handleAddWordToList({ wordData: { word: word.word }, listId: list.id });

        const updatedList = await handleGetList({ listId: list.id });
        expect(updatedList.wordIds).toContain(word.id);
      });

      test('should handle adding word to default list', async () => {
        const word = await handleAddWord({
          wordData: {
            word: 'defaultword',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'A word for default list',
              examples: []
            }]
          }
        });

        // Add to default list (no listId specified)
        await handleAddWordToList({ wordData: { word: word.word } });

        const defaultList = await handleGetDefaultList({});
        expect(defaultList.wordIds).toContain(word.id);
      });

      test('should validate parameters', async () => {
        await expect(handleAddWordToList({})).rejects.toThrow();
        await expect(handleAddWordToList({ wordData: {} })).rejects.toThrow();
        await expect(handleAddWordToList({ wordData: { word: '' } })).rejects.toThrow();
      });
    });

    describe('handleGetDefaultList', () => {
      test('should return default list', async () => {
        const defaultList = await handleGetDefaultList({});
        
        expect(defaultList).toBeDefined();
        expect(defaultList.name).toBe('My Vocabulary');
        expect(defaultList.isDefault).toBe(true);
      });
    });

    describe('handleGetAllLists', () => {
      test('should return all lists including default', async () => {
        await handleAddList({ listData: { name: 'Additional List' } });
        
        const lists = await handleGetAllLists({});
        
        expect(lists.length).toBeGreaterThanOrEqual(2); // Default + added list
        expect(lists.some(list => list.isDefault)).toBe(true);
        expect(lists.some(list => list.name === 'Additional List')).toBe(true);
      });
    });

    describe('handleRemoveWordFromList', () => {
      test('should remove word from list successfully', async () => {
        const word = await handleAddWord({
          wordData: {
            word: 'removeme',
            definitions: [{
              partOfSpeech: 'noun',
              meaning: 'A word to be removed',
              examples: []
            }]
          }
        });

        const list = await handleAddList({ listData: { name: 'Test List' } });
        await handleAddWordToList({ wordData: { word: word.word }, listId: list.id });

        // Remove word from list
        await handleRemoveWordFromList({ wordId: word.id, listId: list.id });

        const updatedList = await handleGetList({ listId: list.id });
        expect(updatedList.wordIds).not.toContain(word.id);
      });

      test('should validate parameters', async () => {
        await expect(handleRemoveWordFromList({})).rejects.toThrow();
        await expect(handleRemoveWordFromList({ wordId: 'valid_id' })).rejects.toThrow();
        await expect(handleRemoveWordFromList({ listId: 'valid_id' })).rejects.toThrow();
      });
    });
  });

  describe('Settings Handlers', () => {
    describe('handleGetSettings', () => {
      test('should return default settings', async () => {
        const settings = await handleGetSettings({});
        
        expect(settings).toBeDefined();
        expect(settings.theme).toBe('light');
        expect(settings.autoAddToList).toBe(true);
        expect(settings.defaultListId).toBeDefined();
      });
    });

    describe('handleUpdateSettings', () => {
      test('should update settings successfully', async () => {
        const currentSettings = await handleGetSettings({});
        currentSettings.theme = 'dark';
        currentSettings.autoAddToList = false;

        const updatedSettings = await handleUpdateSettings({ settings: currentSettings });
        
        expect(updatedSettings.theme).toBe('dark');
        expect(updatedSettings.autoAddToList).toBe(false);
      });

      test('should validate settings data', async () => {
        await expect(handleUpdateSettings({})).rejects.toThrow();
        await expect(handleUpdateSettings({ settings: null })).rejects.toThrow();
      });

      test('should persist settings across handler calls', async () => {
        const settings = await handleGetSettings({});
        settings.theme = 'dark';
        await handleUpdateSettings({ settings });

        const retrievedSettings = await handleGetSettings({});
        expect(retrievedSettings.theme).toBe('dark');
      });
    });
  });

  describe('Learning Stats Handlers', () => {
    describe('handleGetStats', () => {
      test('should return default stats', async () => {
        const stats = await handleGetStats({});
        
        expect(stats).toBeDefined();
        expect(stats.totalWords).toBe(0);
        expect(stats.wordsLearned).toBe(0);
        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(0);
        expect(stats.totalReviews).toBe(0);
        expect(stats.accuracyRate).toBe(0);
      });
    });

    describe('handleUpdateStats', () => {
      test('should update stats successfully', async () => {
        const currentStats = await handleGetStats({});
        currentStats.totalWords = 10;
        currentStats.wordsLearned = 5;
        currentStats.currentStreak = 3;

        const updatedStats = await handleUpdateStats({ stats: currentStats });
        
        expect(updatedStats.totalWords).toBe(10);
        expect(updatedStats.wordsLearned).toBe(5);
        expect(updatedStats.currentStreak).toBe(3);
      });

      test('should validate stats data', async () => {
        await expect(handleUpdateStats({})).rejects.toThrow();
        await expect(handleUpdateStats({ stats: null })).rejects.toThrow();
      });
    });

    describe('handleUpdateReviewStats', () => {
      test('should update review stats for correct answer', async () => {
        await handleUpdateReviewStats({ correct: true });
        
        const stats = await handleGetStats({});
        expect(stats.totalReviews).toBe(1);
        expect(stats.currentStreak).toBe(1);
        expect(stats.longestStreak).toBe(1);
      });

      test('should update review stats for incorrect answer', async () => {
        // First make a correct answer to establish a streak
        await handleUpdateReviewStats({ correct: true });
        let stats = await handleGetStats({});
        expect(stats.currentStreak).toBe(1);

        // Then make an incorrect answer
        await handleUpdateReviewStats({ correct: false });
        stats = await handleGetStats({});
        expect(stats.totalReviews).toBe(2);
        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(1);
      });

      test('should maintain longest streak correctly', async () => {
        // Build up a streak
        for (let i = 0; i < 5; i++) {
          await handleUpdateReviewStats({ correct: true });
        }

        let stats = await handleGetStats({});
        expect(stats.currentStreak).toBe(5);
        expect(stats.longestStreak).toBe(5);

        // Break the streak
        await handleUpdateReviewStats({ correct: false });
        stats = await handleGetStats({});
        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(5); // Should still be 5
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database initialization errors gracefully', async () => {
      // Close the database to simulate initialization failure
      if (db && db.db) {
        db.db.close();
      }

      // Reset global db to null to simulate uninitialized state
      const originalDb = global.db;
      global.db = null;

      await expect(handleGetAllWords({})).rejects.toThrow('Database not initialized');

      // Restore for cleanup
      global.db = originalDb;
    });

    test('should validate payload structure', async () => {
      await expect(handleLookupWord(null)).rejects.toThrow();
      await expect(handleAddWord(null)).rejects.toThrow();
      await expect(handleGetWord(null)).rejects.toThrow();
    });

    test('should handle concurrent operations correctly', async () => {
      const promises = [];
      
      // Create multiple words concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(handleAddWord({
          wordData: {
            word: `concurrent${i}`,
            definitions: [{
              partOfSpeech: 'noun',
              meaning: `Concurrent word ${i}`,
              examples: []
            }]
          }
        }));
      }

      const words = await Promise.all(promises);
      
      expect(words).toHaveLength(5);
      words.forEach((word, index) => {
        expect(word.word).toBe(`concurrent${index}`);
      });
    });
  });
});