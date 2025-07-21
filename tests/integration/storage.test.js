/**
 * Integration tests for VocabDict storage system - Real Implementation
 * Tests data persistence with real IndexedDB, data integrity, and complex operations
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

const { SAMPLE_VOCABULARY_WORDS, SAMPLE_VOCABULARY_LISTS, TestHelpers } = require('../fixtures/testData');

describe('Storage Integration - Real Implementation', () => {
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

  describe('Database Initialization and Schema', () => {
    test('should initialize database with correct structure', async () => {
      expect(db.db).toBeDefined();
      expect(db.db.name).toBe('vocabdict_db');
      expect(db.db.version).toBe(1);
      
      const objectStoreNames = Array.from(db.db.objectStoreNames);
      expect(objectStoreNames).toContain('dictionary_cache');
      expect(objectStoreNames).toContain('vocabulary_words');
      expect(objectStoreNames).toContain('vocabulary_lists');
      expect(objectStoreNames).toContain('user_settings');
      expect(objectStoreNames).toContain('learning_stats');
    });

    test('should create default list on initialization', async () => {
      const lists = await db.getAllLists();
      const defaultList = lists.find(list => list.isDefault);
      
      expect(defaultList).toBeDefined();
      expect(defaultList.name).toBe('My Vocabulary');
      expect(defaultList.isDefault).toBe(true);
      expect(defaultList.wordIds).toEqual([]);
    });

    test('should handle multiple initialization calls', async () => {
      const secondDb = new VocabDictDatabase();
      await secondDb.initialize();
      await secondDb.initialize(); // Second call should not fail
      
      expect(secondDb.db).toBeDefined();
      
      secondDb.db.close();
    });

    test('should initialize default settings and stats', async () => {
      const settings = await db.getSettings();
      expect(settings).toBeDefined();
      expect(settings.theme).toBe('light');
      expect(settings.autoAddToList).toBe(true);

      const stats = await db.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalWords).toBe(0);
      expect(stats.wordsLearned).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });
  });

  describe('Data Persistence Across Sessions', () => {
    test('should persist word data across database instances', async () => {
      const wordData = {
        word: 'persistence',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'The continuation of an effect after its cause is removed',
          examples: ['Data persistence is crucial.']
        }]
      };

      // Add word to first instance
      const addedWord = await db.addWord(wordData);
      const wordId = addedWord.id;

      // Close first instance
      db.db.close();

      // Create new instance
      const newDb = new VocabDictDatabase();
      await newDb.initialize();

      // Retrieve word from new instance
      const retrievedWord = await newDb.getWord(wordId);
      
      expect(retrievedWord).toBeDefined();
      expect(retrievedWord.word).toBe('persistence');
      expect(retrievedWord.id).toBe(wordId);

      newDb.db.close();
    });

    test('should persist list data across database instances', async () => {
      const listData = {
        name: 'Persistent List',
        description: 'A list that persists across sessions'
      };

      // Add list to first instance
      const addedList = await db.addList(listData);
      const listId = addedList.id;

      // Close first instance
      db.db.close();

      // Create new instance
      const newDb = new VocabDictDatabase();
      await newDb.initialize();

      // Retrieve list from new instance
      const retrievedList = await newDb.getList(listId);
      
      expect(retrievedList).toBeDefined();
      expect(retrievedList.name).toBe('Persistent List');
      expect(retrievedList.id).toBe(listId);

      newDb.db.close();
    });

    test('should persist settings across database instances', async () => {
      // Update settings in first instance
      const settings = await db.getSettings();
      settings.theme = 'dark';
      settings.autoAddToList = false;
      await db.updateSettings(settings);

      // Close first instance
      db.db.close();

      // Create new instance
      const newDb = new VocabDictDatabase();
      await newDb.initialize();

      // Retrieve settings from new instance
      const retrievedSettings = await newDb.getSettings();
      
      expect(retrievedSettings.theme).toBe('dark');
      expect(retrievedSettings.autoAddToList).toBe(false);

      newDb.db.close();
    });

    test('should persist learning stats across database instances', async () => {
      // Update stats in first instance
      await db.updateReviewStats(true);
      await db.updateReviewStats(true);
      await db.updateReviewStats(false);

      let stats = await db.getStats();
      expect(stats.totalReviews).toBe(3);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(2);

      // Close first instance
      db.db.close();

      // Create new instance
      const newDb = new VocabDictDatabase();
      await newDb.initialize();

      // Retrieve stats from new instance
      const retrievedStats = await newDb.getStats();
      
      expect(retrievedStats.totalReviews).toBe(3);
      expect(retrievedStats.currentStreak).toBe(0);
      expect(retrievedStats.longestStreak).toBe(2);

      newDb.db.close();
    });
  });

  describe('Complex Data Operations', () => {
    test('should handle bulk word operations efficiently', async () => {
      const startTime = Date.now();
      const words = [];

      // Add 50 words
      for (let i = 0; i < 50; i++) {
        const word = await db.addWord({
          word: `bulkword${i}`,
          definitions: [{
            partOfSpeech: 'noun',
            meaning: `Bulk word number ${i}`,
            examples: [`This is bulk word ${i}.`]
          }]
        });
        words.push(word);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(words).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all words exist
      const allWords = await db.getAllWords();
      expect(allWords.length).toBeGreaterThanOrEqual(50);

      words.forEach(word => {
        expect(allWords.some(w => w.id === word.id)).toBe(true);
      });
    });

    test('should handle complex list-word relationships', async () => {
      // Create multiple lists
      const lists = [];
      for (let i = 0; i < 3; i++) {
        const list = await db.addList({
          name: `Complex List ${i}`,
          description: `List for complex operations ${i}`
        });
        lists.push(list);
      }

      // Create multiple words
      const words = [];
      for (let i = 0; i < 5; i++) {
        const word = await db.addWord({
          word: `complexword${i}`,
          definitions: [{
            partOfSpeech: 'noun',
            meaning: `Complex word number ${i}`,
            examples: []
          }]
        });
        words.push(word);
      }

      // Add words to multiple lists in various combinations
      await db.addWordToList(words[0].id, lists[0].id); // Word 0 -> List 0
      await db.addWordToList(words[0].id, lists[1].id); // Word 0 -> List 1
      await db.addWordToList(words[1].id, lists[0].id); // Word 1 -> List 0
      await db.addWordToList(words[2].id, lists[2].id); // Word 2 -> List 2
      await db.addWordToList(words[3].id, lists[0].id); // Word 3 -> List 0
      await db.addWordToList(words[3].id, lists[1].id); // Word 3 -> List 1
      await db.addWordToList(words[3].id, lists[2].id); // Word 3 -> List 2

      // Verify relationships
      const updatedList0 = await db.getList(lists[0].id);
      const updatedList1 = await db.getList(lists[1].id);
      const updatedList2 = await db.getList(lists[2].id);

      expect(updatedList0.wordIds).toContain(words[0].id);
      expect(updatedList0.wordIds).toContain(words[1].id);
      expect(updatedList0.wordIds).toContain(words[3].id);
      expect(updatedList0.wordIds).toHaveLength(3);

      expect(updatedList1.wordIds).toContain(words[0].id);
      expect(updatedList1.wordIds).toContain(words[3].id);
      expect(updatedList1.wordIds).toHaveLength(2);

      expect(updatedList2.wordIds).toContain(words[2].id);
      expect(updatedList2.wordIds).toContain(words[3].id);
      expect(updatedList2.wordIds).toHaveLength(2);

      // Test word removal from specific lists
      await db.removeWordFromList(words[3].id, lists[1].id);
      const updatedList1AfterRemoval = await db.getList(lists[1].id);
      expect(updatedList1AfterRemoval.wordIds).not.toContain(words[3].id);
      expect(updatedList1AfterRemoval.wordIds).toContain(words[0].id);
      expect(updatedList1AfterRemoval.wordIds).toHaveLength(1);

      // Verify other lists still contain the word
      const list0AfterRemoval = await db.getList(lists[0].id);
      const list2AfterRemoval = await db.getList(lists[2].id);
      expect(list0AfterRemoval.wordIds).toContain(words[3].id);
      expect(list2AfterRemoval.wordIds).toContain(words[3].id);
    });

    test('should maintain referential integrity on word deletion', async () => {
      // Create a word and add it to multiple lists
      const word = await db.addWord({
        word: 'integrity',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'The quality of being honest and having strong moral principles',
          examples: []
        }]
      });

      const list1 = await db.addList({ name: 'Integrity List 1' });
      const list2 = await db.addList({ name: 'Integrity List 2' });

      await db.addWordToList(word.id, list1.id);
      await db.addWordToList(word.id, list2.id);

      // Verify word is in both lists
      let updatedList1 = await db.getList(list1.id);
      let updatedList2 = await db.getList(list2.id);
      expect(updatedList1.wordIds).toContain(word.id);
      expect(updatedList2.wordIds).toContain(word.id);

      // Delete the word
      await db.deleteWord(word.id);

      // Verify word is removed from all lists
      updatedList1 = await db.getList(list1.id);
      updatedList2 = await db.getList(list2.id);
      expect(updatedList1.wordIds).not.toContain(word.id);
      expect(updatedList2.wordIds).not.toContain(word.id);

      // Verify word no longer exists
      const deletedWord = await db.getWord(word.id);
      expect(deletedWord).toBeNull();
    });
  });

  describe('Concurrent Operations and Race Conditions', () => {
    test('should handle concurrent word additions correctly', async () => {
      const promises = [];
      const numWords = 10;

      // Create multiple concurrent word additions
      for (let i = 0; i < numWords; i++) {
        promises.push(db.addWord({
          word: `concurrent${i}`,
          definitions: [{
            partOfSpeech: 'noun',
            meaning: `Concurrent word ${i}`,
            examples: []
          }]
        }));
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      expect(results).toHaveLength(numWords);
      results.forEach((word, index) => {
        expect(word).toBeDefined();
        expect(word.word).toBe(`concurrent${index}`);
        expect(word.id).toMatch(/^word_\d+_[a-z0-9]+$/);
      });

      // Verify all words are in the database
      const allWords = await db.getAllWords();
      results.forEach(word => {
        expect(allWords.some(w => w.id === word.id)).toBe(true);
      });
    });

    test('should handle concurrent list operations correctly', async () => {
      const promises = [];
      const numLists = 5;

      // Create multiple concurrent list additions
      for (let i = 0; i < numLists; i++) {
        promises.push(db.addList({
          name: `Concurrent List ${i}`,
          description: `Concurrent list ${i}`
        }));
      }

      const results = await Promise.all(promises);

      // All operations should succeed
      expect(results).toHaveLength(numLists);
      results.forEach((list, index) => {
        expect(list).toBeDefined();
        expect(list.name).toBe(`Concurrent List ${index}`);
        expect(list.id).toMatch(/^list_\d+_[a-z0-9]+$/);
      });

      // Verify all lists are in the database
      const allLists = await db.getAllLists();
      results.forEach(list => {
        expect(allLists.some(l => l.id === list.id)).toBe(true);
      });
    });

    test('should handle concurrent word-to-list additions correctly', async () => {
      // Create a word and a list first
      const word = await db.addWord({
        word: 'concurrenttest',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'A test for concurrency',
          examples: []
        }]
      });

      const lists = [];
      for (let i = 0; i < 5; i++) {
        const list = await db.addList({
          name: `Concurrent Target List ${i}`,
          description: `Target list ${i}`
        });
        lists.push(list);
      }

      // Concurrently add the word to all lists
      const promises = lists.map(list => 
        db.addWordToList(word.id, list.id)
      );

      await Promise.all(promises);

      // Verify word is in all lists
      for (const list of lists) {
        const updatedList = await db.getList(list.id);
        expect(updatedList.wordIds).toContain(word.id);
      }
    });

    test('should handle concurrent settings updates correctly', async () => {
      const promises = [];
      const themes = ['light', 'dark', 'auto'];
      
      // Concurrently update settings with different themes
      for (const theme of themes) {
        promises.push((async () => {
          const settings = await db.getSettings();
          settings.theme = theme;
          await db.updateSettings(settings);
          return theme;
        })());
      }

      const results = await Promise.all(promises);
      expect(results).toEqual(themes);

      // Final settings should have one of the themes
      const finalSettings = await db.getSettings();
      expect(themes).toContain(finalSettings.theme);
    });
  });

  describe('Performance and Stress Testing', () => {
    test('should handle large dataset operations efficiently', async () => {
      const startTime = Date.now();

      // Add 100 words
      const words = [];
      for (let i = 0; i < 100; i++) {
        const word = await db.addWord({
          word: `performance${i}`,
          definitions: [{
            partOfSpeech: 'noun',
            meaning: `Performance test word ${i}`,
            examples: [`Performance example ${i}.`]
          }]
        });
        words.push(word);
      }

      // Create 10 lists
      const lists = [];
      for (let i = 0; i < 10; i++) {
        const list = await db.addList({
          name: `Performance List ${i}`,
          description: `Performance test list ${i}`
        });
        lists.push(list);
      }

      // Add each word to 2-3 random lists
      for (const word of words) {
        const numLists = 2 + Math.floor(Math.random() * 2); // 2 or 3 lists
        const selectedLists = lists
          .sort(() => 0.5 - Math.random())
          .slice(0, numLists);
        
        for (const list of selectedLists) {
          await db.addWordToList(word.id, list.id);
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Should complete within reasonable time (adjust based on performance requirements)
      expect(totalDuration).toBeLessThan(30000); // 30 seconds max

      // Verify data integrity
      const allWords = await db.getAllWords();
      const allLists = await db.getAllLists();

      expect(allWords.length).toBeGreaterThanOrEqual(100);
      expect(allLists.length).toBeGreaterThanOrEqual(10); // Plus default list

      // Verify some random word-list relationships
      const randomWord = words[Math.floor(Math.random() * words.length)];
      const listsContainingWord = allLists.filter(list => 
        list.wordIds.includes(randomWord.id)
      );
      expect(listsContainingWord.length).toBeGreaterThan(0);
      expect(listsContainingWord.length).toBeLessThanOrEqual(3);
    });

    test('should handle rapid sequential operations without corruption', async () => {
      const operations = [];
      let wordCounter = 0;
      let listCounter = 0;

      // Mix of different operations
      for (let i = 0; i < 50; i++) {
        const operation = Math.floor(Math.random() * 4);
        
        switch (operation) {
          case 0: // Add word
            operations.push(async () => {
              const word = await db.addWord({
                word: `rapid${wordCounter++}`,
                definitions: [{
                  partOfSpeech: 'noun',
                  meaning: `Rapid operation word`,
                  examples: []
                }]
              });
              return { type: 'word', data: word };
            });
            break;
            
          case 1: // Add list
            operations.push(async () => {
              const list = await db.addList({
                name: `Rapid List ${listCounter++}`,
                description: 'Rapid operation list'
              });
              return { type: 'list', data: list };
            });
            break;
            
          case 2: // Update stats
            operations.push(async () => {
              await db.updateReviewStats(Math.random() > 0.5);
              return { type: 'stats', data: 'updated' };
            });
            break;
            
          case 3: // Get all words
            operations.push(async () => {
              const words = await db.getAllWords();
              return { type: 'query', data: words.length };
            });
            break;
        }
      }

      // Execute all operations sequentially (not concurrently to test rapid sequential access)
      const results = [];
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }

      expect(results).toHaveLength(50);

      // Verify final state is consistent
      const finalWords = await db.getAllWords();
      const finalLists = await db.getAllLists();
      const finalStats = await db.getStats();

      expect(finalWords.length).toBeGreaterThan(0);
      expect(finalLists.length).toBeGreaterThan(0);
      expect(finalStats.totalReviews).toBeGreaterThan(0);

      // No data should be corrupted
      finalWords.forEach(word => {
        expect(word.id).toMatch(/^word_\d+_[a-z0-9]+$/);
        expect(word.word).toBeDefined();
        expect(word.definitions).toBeInstanceOf(Array);
      });

      finalLists.forEach(list => {
        expect(list.id).toMatch(/^list_\d+_[a-z0-9]+$/);
        expect(list.name).toBeDefined();
        expect(list.wordIds).toBeInstanceOf(Array);
      });
    });
  });

  describe('Error Recovery and Data Integrity', () => {
    test('should handle database corruption gracefully', async () => {
      // Add some data first
      const word = await db.addWord({
        word: 'corruption',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'The process by which something is damaged or altered from its original course',
          examples: []
        }]
      });

      // Force close the database to simulate corruption
      db.db.close();

      // Create new instance and verify it can initialize
      const newDb = new VocabDictDatabase();
      await newDb.initialize();

      // Should be able to operate normally
      const newWord = await newDb.addWord({
        word: 'recovery',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'A return to a normal state of health, mind, or strength',
          examples: []
        }]
      });

      expect(newWord).toBeDefined();
      expect(newWord.word).toBe('recovery');

      newDb.db.close();
    });

    test('should maintain data consistency after failed operations', async () => {
      const initialWordCount = (await db.getAllWords()).length;
      
      try {
        // Attempt invalid operation
        await db.addWord({
          word: null, // Invalid
          definitions: null
        });
      } catch (error) {
        // Expected to fail
      }

      // Verify no partial data was added
      const finalWordCount = (await db.getAllWords()).length;
      expect(finalWordCount).toBe(initialWordCount);

      // Verify database is still functional
      const validWord = await db.addWord({
        word: 'recovery',
        definitions: [{
          partOfSpeech: 'noun',
          meaning: 'Successful recovery after error',
          examples: []
        }]
      });

      expect(validWord).toBeDefined();
      expect(validWord.word).toBe('recovery');
    });
  });
});