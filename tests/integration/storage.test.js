/**
 * Integration tests for VocabDict storage system
 * Tests data persistence, IndexedDB operations, and data integrity
 */

const { MockVocabDictDatabase, MockVocabularyWord, MockVocabularyList } = require('../mocks/extensionMocks');
const { SAMPLE_VOCABULARY_WORDS, SAMPLE_VOCABULARY_LISTS, TestHelpers } = require('../fixtures/testData');

describe('Storage Integration', () => {
  let db;

  beforeEach(async () => {
    db = new MockVocabDictDatabase();
    await db.initialize();
  });

  afterEach(() => {
    if (db) {
      db.reset();
    }
  });

  describe('Database Initialization and Schema', () => {
    test('should initialize database with correct structure', async () => {
      expect(db.isInitialized).toBe(true);
      expect(db.db).toBeDefined();
      expect(db.data).toBeDefined();
      expect(db.data.words).toBeInstanceOf(Map);
      expect(db.data.lists).toBeInstanceOf(Map);
      expect(db.data.settings).toBeDefined();
      expect(db.data.stats).toBeDefined();
      expect(db.data.cache).toBeInstanceOf(Map);
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
      const secondDb = new MockVocabDictDatabase();
      await secondDb.initialize();
      await secondDb.initialize(); // Second call should not fail
      
      expect(secondDb.isInitialized).toBe(true);
    });
  });

  describe('Data Persistence and Integrity', () => {
    test('should maintain data integrity across operations', async () => {
      // Add words
      const word1 = await db.addWord({ 
        word: 'integrity',
        definitions: [{ partOfSpeech: 'noun', meaning: 'quality of being honest' }]
      });
      
      const word2 = await db.addWord({ 
        word: 'persistence',
        definitions: [{ partOfSpeech: 'noun', meaning: 'continuing firmly' }]
      });

      // Add list
      const list = await db.addList({ name: 'Test Persistence' });
      
      // Add words to list
      list.addWord(word1.id);
      list.addWord(word2.id);
      await db.updateList(list);

      // Verify data integrity
      const retrievedList = await db.getList(list.id);
      expect(retrievedList.wordIds).toContain(word1.id);
      expect(retrievedList.wordIds).toContain(word2.id);
      expect(retrievedList.getWordCount()).toBe(2);

      const allWords = await db.getAllWords();
      expect(allWords).toHaveLength(2);
      expect(allWords.map(w => w.word)).toEqual(expect.arrayContaining(['integrity', 'persistence']));
    });

    test('should handle concurrent operations correctly', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          db.addWord({ 
            word: `concurrent${i}`,
            definitions: [{ partOfSpeech: 'noun', meaning: `test word ${i}` }]
          })
        );
      }

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      expect(new Set(results.map(r => r.id)).size).toBe(10); // All unique IDs
      
      const allWords = await db.getAllWords();
      expect(allWords).toHaveLength(10);
    });

    test('should maintain referential integrity', async () => {
      const word = await db.addWord({ word: 'reference' });
      const list1 = await db.addList({ name: 'List 1' });
      const list2 = await db.addList({ name: 'List 2' });
      
      // Add word to both lists
      list1.addWord(word.id);
      list2.addWord(word.id);
      await db.updateList(list1);
      await db.updateList(list2);
      
      // Verify word is in both lists
      const retrievedList1 = await db.getList(list1.id);
      const retrievedList2 = await db.getList(list2.id);
      expect(retrievedList1.containsWord(word.id)).toBe(true);
      expect(retrievedList2.containsWord(word.id)).toBe(true);
      
      // Delete word - should be removed from all lists
      await db.deleteWord(word.id);
      
      const updatedList1 = await db.getList(list1.id);
      const updatedList2 = await db.getList(list2.id);
      expect(updatedList1.containsWord(word.id)).toBe(false);
      expect(updatedList2.containsWord(word.id)).toBe(false);
    });

    test('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      const wordCount = 100;
      
      // Add many words
      const words = [];
      for (let i = 0; i < wordCount; i++) {
        const word = await db.addWord({ 
          word: `word${i}`,
          definitions: [{ partOfSpeech: 'noun', meaning: `definition ${i}` }]
        });
        words.push(word);
      }
      
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Retrieve all words
      const retrievalStartTime = Date.now();
      const allWords = await db.getAllWords();
      const retrievalTime = Date.now() - retrievalStartTime;
      
      expect(allWords).toHaveLength(wordCount);
      expect(retrievalTime).toBeLessThan(1000); // Should retrieve within 1 second
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid data gracefully', async () => {
      // Test with null data
      await expect(db.addWord(null)).rejects.toThrow();
      
      // Test with invalid word data
      await expect(db.updateWord(null)).rejects.toThrow();
      
      // Test with non-existent IDs
      await expect(db.updateWord(new MockVocabularyWord({ id: 'nonexistent' })))
        .rejects.toThrow('Word not found');
      
      await expect(db.updateList(new MockVocabularyList({ id: 'nonexistent' })))
        .rejects.toThrow('List not found');
    });

    test('should maintain consistency during failed operations', async () => {
      const word = await db.addWord({ word: 'consistency' });
      const initialWordCount = (await db.getAllWords()).length;
      
      // Try to update with invalid data
      try {
        await db.updateWord(new MockVocabularyWord({ id: 'nonexistent' }));
      } catch (error) {
        // Expected to fail
      }
      
      // Verify original data is intact
      const retrievedWord = await db.getWord(word.id);
      expect(retrievedWord).toBeDefined();
      expect(retrievedWord.word).toBe('consistency');
      
      const finalWordCount = (await db.getAllWords()).length;
      expect(finalWordCount).toBe(initialWordCount);
    });

    test('should handle database reset correctly', async () => {
      // Add some data
      await db.addWord({ word: 'beforereset' });
      await db.addList({ name: 'Before Reset List' });
      
      let words = await db.getAllWords();
      let lists = await db.getAllLists();
      expect(words).toHaveLength(1);
      expect(lists).toHaveLength(2); // 1 default + 1 custom
      
      // Reset database
      db.reset();
      
      // Verify data is cleared but structure is maintained
      words = await db.getAllWords();
      lists = await db.getAllLists();
      expect(words).toHaveLength(0);
      expect(lists).toHaveLength(1); // Only default list remains
      expect(lists[0].isDefault).toBe(true);
    });
  });

  describe('Cache Management', () => {
    test('should cache and retrieve dictionary entries', async () => {
      const entry = {
        word: 'cache',
        definitions: [{ partOfSpeech: 'noun', meaning: 'temporary storage' }],
        pronunciations: [{ type: 'US', phonetic: '/kæʃ/' }]
      };
      
      // Cache entry
      await db.cacheDictionaryEntry('cache', entry);
      
      // Retrieve cached entry
      const cached = await db.getCachedDictionaryEntry('cache');
      expect(cached).toBeDefined();
      expect(cached.word).toBe('cache');
      expect(cached.definitions).toEqual(entry.definitions);
      expect(cached.cachedAt).toBeInstanceOf(Date);
    });

    test('should handle cache expiry correctly', async () => {
      const entry = { word: 'expired' };
      
      // Manually add expired entry
      db.data.cache.set('expired', {
        ...entry,
        cachedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      });
      
      // Should return null for expired entry
      const cached = await db.getCachedDictionaryEntry('expired');
      expect(cached).toBeNull();
      
      // Should remove expired entry from cache
      expect(db.data.cache.has('expired')).toBe(false);
    });

    test('should handle cache miss correctly', async () => {
      const cached = await db.getCachedDictionaryEntry('nonexistent');
      expect(cached).toBeNull();
    });

    test('should manage cache size', async () => {
      // Add many cache entries
      for (let i = 0; i < 100; i++) {
        await db.cacheDictionaryEntry(`word${i}`, { word: `word${i}` });
      }
      
      expect(db.data.cache.size).toBe(100);
      
      // All entries should be retrievable
      for (let i = 0; i < 100; i++) {
        const cached = await db.getCachedDictionaryEntry(`word${i}`);
        expect(cached).toBeDefined();
        expect(cached.word).toBe(`word${i}`);
      }
    });
  });

  describe('Settings Persistence', () => {
    test('should persist settings across operations', async () => {
      const newSettings = {
        theme: 'dark',
        autoAdd: false,
        defaultListId: 'custom_list',
        reviewReminders: false,
        sessionSize: 15
      };
      
      await db.updateSettings(newSettings);
      
      const retrievedSettings = await db.getSettings();
      expect(retrievedSettings.theme).toBe('dark');
      expect(retrievedSettings.autoAdd).toBe(false);
      expect(retrievedSettings.defaultListId).toBe('custom_list');
      expect(retrievedSettings.reviewReminders).toBe(false);
      expect(retrievedSettings.sessionSize).toBe(15);
    });

    test('should handle partial settings updates', async () => {
      // Get initial settings
      const initialSettings = await db.getSettings();
      
      // Update only some settings
      const partialUpdate = {
        theme: 'dark',
        sessionSize: 25
      };
      
      await db.updateSettings(partialUpdate);
      const updatedSettings = await db.getSettings();
      
      // Updated fields should change
      expect(updatedSettings.theme).toBe('dark');
      expect(updatedSettings.sessionSize).toBe(25);
      
      // Other fields should maintain defaults
      expect(updatedSettings.autoAdd).toBe(initialSettings.autoAdd);
      expect(updatedSettings.reviewReminders).toBe(initialSettings.reviewReminders);
    });
  });

  describe('Statistics Tracking', () => {
    test('should track learning statistics accurately', async () => {
      const word1 = await db.addWord({ word: 'stat1' });
      const word2 = await db.addWord({ word: 'stat2' });
      
      let stats = await db.getStats();
      expect(stats.totalWords).toBe(2);
      
      // Simulate reviews
      stats.updateReviewStats(true);  // Correct
      stats.updateReviewStats(true);  // Correct
      stats.updateReviewStats(false); // Incorrect
      stats.updateReviewStats(true);  // Correct
      
      await db.updateStats(stats);
      
      const updatedStats = await db.getStats();
      expect(updatedStats.wordsReviewed).toBe(4);
      expect(updatedStats.correctAnswers).toBe(3);
      expect(updatedStats.currentStreak).toBe(1); // Reset after incorrect, then 1 correct
      expect(updatedStats.longestStreak).toBe(2); // First two correct answers
    });

    test('should maintain statistics consistency', async () => {
      // Add words and track stats
      for (let i = 0; i < 5; i++) {
        await db.addWord({ word: `consistency${i}` });
      }
      
      let stats = await db.getStats();
      expect(stats.totalWords).toBe(5);
      
      // Delete some words
      const allWords = await db.getAllWords();
      await db.deleteWord(allWords[0].id);
      await db.deleteWord(allWords[1].id);
      
      stats = await db.getStats();
      expect(stats.totalWords).toBe(3);
    });
  });

  describe('Data Migration and Compatibility', () => {
    test('should handle data format evolution', async () => {
      // Simulate old data format
      const oldWordData = {
        id: 'old_word_1',
        word: 'legacy',
        meaning: 'old format definition' // Old format
      };
      
      // Should be able to create new format from old data
      const newWord = new MockVocabularyWord({
        ...oldWordData,
        definitions: oldWordData.meaning ? 
          [{ partOfSpeech: 'unknown', meaning: oldWordData.meaning }] : 
          []
      });
      
      expect(newWord.word).toBe('legacy');
      expect(newWord.definitions).toHaveLength(1);
      expect(newWord.definitions[0].meaning).toBe('old format definition');
    });

    test('should handle missing fields gracefully', async () => {
      const incompleteData = {
        word: 'incomplete'
        // Missing definitions, difficulty, etc.
      };
      
      const word = new MockVocabularyWord(incompleteData);
      
      expect(word.word).toBe('incomplete');
      expect(word.definitions).toEqual([]);
      expect(word.difficulty).toBe(1); // Default value
      expect(word.reviewCount).toBe(0); // Default value
    });
  });

  describe('Backup and Restore Simulation', () => {
    test('should export all data correctly', async () => {
      // Add test data
      const word1 = await db.addWord({ word: 'export1' });
      const word2 = await db.addWord({ word: 'export2' });
      const list = await db.addList({ name: 'Export List' });
      
      list.addWord(word1.id);
      await db.updateList(list);
      
      await db.updateSettings({ theme: 'dark', autoAdd: false });
      
      // Export all data
      const exportData = {
        words: (await db.getAllWords()).map(w => w.toJSON()),
        lists: (await db.getAllLists()).map(l => l.toJSON()),
        settings: (await db.getSettings()).toJSON(),
        stats: (await db.getStats()).toJSON()
      };
      
      expect(exportData.words).toHaveLength(2);
      expect(exportData.lists).toHaveLength(2); // 1 default + 1 custom
      expect(exportData.settings.theme).toBe('dark');
      expect(exportData.stats).toBeDefined();
    });

    test('should import data correctly', async () => {
      const importData = {
        words: [
          {
            id: 'import_word_1',
            word: 'import1',
            definitions: [{ partOfSpeech: 'noun', meaning: 'imported word' }],
            difficulty: 2,
            reviewCount: 3
          }
        ],
        lists: [
          {
            id: 'import_list_1',
            name: 'Imported List',
            wordIds: ['import_word_1'],
            isDefault: false
          }
        ],
        settings: {
          theme: 'dark',
          autoAdd: false
        }
      };
      
      // Clear existing data
      db.reset();
      
      // Import words
      for (const wordData of importData.words) {
        await db.addWord(wordData);
      }
      
      // Import lists
      for (const listData of importData.lists) {
        await db.addList(listData);
      }
      
      // Import settings
      await db.updateSettings(importData.settings);
      
      // Verify imported data
      const words = await db.getAllWords();
      const lists = await db.getAllLists();
      const settings = await db.getSettings();
      
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('import1');
      expect(lists).toHaveLength(2); // 1 default + 1 imported
      expect(settings.theme).toBe('dark');
    });
  });
});