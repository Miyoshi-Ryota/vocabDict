/**
 * Unit tests for VocabDict Database operations
 * Tests the VocabDictDatabase class methods and data persistence
 */

const { MockVocabDictDatabase, MockVocabularyWord, MockVocabularyList, MockUserSettings, MockLearningStats } = require('../mocks/extensionMocks');
const { SAMPLE_VOCABULARY_WORDS, SAMPLE_VOCABULARY_LISTS, TestHelpers } = require('../fixtures/testData');

describe('VocabDictDatabase', () => {
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

  describe('Initialization', () => {
    test('should initialize database successfully', async () => {
      const newDb = new MockVocabDictDatabase();
      await newDb.initialize();
      
      expect(newDb.isInitialized).toBe(true);
      expect(newDb.db).toBeDefined();
      expect(newDb.db.name).toBe('mock_db');
    });

    test('should create default list on initialization', async () => {
      const lists = await db.getAllLists();
      const defaultList = lists.find(list => list.isDefault);
      
      expect(defaultList).toBeDefined();
      expect(defaultList.name).toBe('My Vocabulary');
      expect(defaultList.isDefault).toBe(true);
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

        const result = await db.addWord(wordData);
        
        expect(result).toBeInstanceOf(MockVocabularyWord);
        expect(result.word).toBe('test');
        expect(result.definitions).toEqual(wordData.definitions);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
      });

      test('should update total words count', async () => {
        const initialStats = await db.getStats();
        expect(initialStats.totalWords).toBe(0);

        await db.addWord({ word: 'test1' });
        await db.addWord({ word: 'test2' });

        const updatedStats = await db.getStats();
        expect(updatedStats.totalWords).toBe(2);
      });

      test('should generate unique IDs for words', async () => {
        const word1 = await db.addWord({ word: 'test1' });
        const word2 = await db.addWord({ word: 'test2' });
        
        expect(word1.id).not.toBe(word2.id);
        expect(word1.id).toMatch(/^word_\d+_[a-z0-9]+$/);
        expect(word2.id).toMatch(/^word_\d+_[a-z0-9]+$/);
      });
    });

    describe('getWord', () => {
      test('should retrieve existing word', async () => {
        const addedWord = await db.addWord({ word: 'retrieve' });
        const retrievedWord = await db.getWord(addedWord.id);
        
        expect(retrievedWord).toBeDefined();
        expect(retrievedWord.id).toBe(addedWord.id);
        expect(retrievedWord.word).toBe('retrieve');
      });

      test('should return null for non-existent word', async () => {
        const result = await db.getWord('nonexistent_id');
        expect(result).toBeNull();
      });
    });

    describe('getAllWords', () => {
      test('should return empty array initially', async () => {
        const words = await db.getAllWords();
        expect(words).toEqual([]);
      });

      test('should return all words', async () => {
        await db.addWord({ word: 'word1' });
        await db.addWord({ word: 'word2' });
        await db.addWord({ word: 'word3' });

        const words = await db.getAllWords();
        expect(words).toHaveLength(3);
        expect(words.every(word => word instanceof MockVocabularyWord)).toBe(true);
      });
    });

    describe('updateWord', () => {
      test('should update existing word', async () => {
        const addedWord = await db.addWord({ word: 'original' });
        addedWord.word = 'updated';
        addedWord.difficulty = 3;

        const updatedWord = await db.updateWord(addedWord);
        
        expect(updatedWord.word).toBe('updated');
        expect(updatedWord.difficulty).toBe(3);
        expect(updatedWord.id).toBe(addedWord.id);

        // Verify it's actually updated in storage
        const retrievedWord = await db.getWord(addedWord.id);
        expect(retrievedWord.word).toBe('updated');
        expect(retrievedWord.difficulty).toBe(3);
      });

      test('should throw error for non-existent word', async () => {
        const fakeWord = new MockVocabularyWord({ id: 'nonexistent' });
        
        await expect(db.updateWord(fakeWord)).rejects.toThrow('Word not found');
      });
    });

    describe('deleteWord', () => {
      test('should delete existing word', async () => {
        const addedWord = await db.addWord({ word: 'deleteme' });
        
        const result = await db.deleteWord(addedWord.id);
        expect(result).toBe(true);

        const retrievedWord = await db.getWord(addedWord.id);
        expect(retrievedWord).toBeNull();
      });

      test('should return false for non-existent word', async () => {
        const result = await db.deleteWord('nonexistent_id');
        expect(result).toBe(false);
      });

      test('should update total words count after deletion', async () => {
        const word1 = await db.addWord({ word: 'test1' });
        await db.addWord({ word: 'test2' });

        let stats = await db.getStats();
        expect(stats.totalWords).toBe(2);

        await db.deleteWord(word1.id);
        stats = await db.getStats();
        expect(stats.totalWords).toBe(1);
      });

      test('should remove word from all lists when deleted', async () => {
        const word = await db.addWord({ word: 'test' });
        const list = await db.addList({ name: 'Test List' });
        
        // Add word to list
        list.addWord(word.id);
        await db.updateList(list);
        
        expect(list.containsWord(word.id)).toBe(true);
        
        // Delete word
        await db.deleteWord(word.id);
        
        // Verify word is removed from list
        const updatedList = await db.getList(list.id);
        expect(updatedList.containsWord(word.id)).toBe(false);
      });
    });

    describe('getWordsDueForReview', () => {
      test('should return empty array when no words are due', async () => {
        const futureDate = new Date(Date.now() + 86400000); // +1 day
        await db.addWord({ 
          word: 'future',
          nextReview: futureDate
        });

        const dueWords = await db.getWordsDueForReview();
        expect(dueWords).toEqual([]);
      });

      test('should return words that are due for review', async () => {
        const pastDate = new Date(Date.now() - 3600000); // -1 hour
        const futureDate = new Date(Date.now() + 86400000); // +1 day

        const dueWord = await db.addWord({ 
          word: 'due',
          nextReview: pastDate
        });
        
        await db.addWord({ 
          word: 'notdue',
          nextReview: futureDate
        });

        const dueWords = await db.getWordsDueForReview();
        expect(dueWords).toHaveLength(1);
        expect(dueWords[0].id).toBe(dueWord.id);
        expect(dueWords[0].word).toBe('due');
      });
    });
  });

  describe('List Operations', () => {
    describe('addList', () => {
      test('should add new list successfully', async () => {
        const listData = {
          name: 'Custom List',
          wordIds: ['word1', 'word2']
        };

        const result = await db.addList(listData);
        
        expect(result).toBeInstanceOf(MockVocabularyList);
        expect(result.name).toBe('Custom List');
        expect(result.wordIds).toEqual(['word1', 'word2']);
        expect(result.id).toBeDefined();
        expect(result.isDefault).toBe(false);
      });

      test('should generate unique IDs for lists', async () => {
        const list1 = await db.addList({ name: 'List 1' });
        const list2 = await db.addList({ name: 'List 2' });
        
        expect(list1.id).not.toBe(list2.id);
        expect(list1.id).toMatch(/^list_\d+_[a-z0-9]+$/);
        expect(list2.id).toMatch(/^list_\d+_[a-z0-9]+$/);
      });
    });

    describe('getList', () => {
      test('should retrieve existing list', async () => {
        const addedList = await db.addList({ name: 'Retrieve Me' });
        const retrievedList = await db.getList(addedList.id);
        
        expect(retrievedList).toBeDefined();
        expect(retrievedList.id).toBe(addedList.id);
        expect(retrievedList.name).toBe('Retrieve Me');
      });

      test('should return null for non-existent list', async () => {
        const result = await db.getList('nonexistent_id');
        expect(result).toBeNull();
      });
    });

    describe('getAllLists', () => {
      test('should return default list initially', async () => {
        const lists = await db.getAllLists();
        expect(lists).toHaveLength(1);
        expect(lists[0].isDefault).toBe(true);
        expect(lists[0].name).toBe('My Vocabulary');
      });

      test('should return all lists including custom ones', async () => {
        await db.addList({ name: 'List 1' });
        await db.addList({ name: 'List 2' });

        const lists = await db.getAllLists();
        expect(lists).toHaveLength(3); // 1 default + 2 custom
      });
    });

    describe('updateList', () => {
      test('should update existing list', async () => {
        const addedList = await db.addList({ name: 'Original' });
        addedList.name = 'Updated';
        addedList.addWord('new_word_id');

        const updatedList = await db.updateList(addedList);
        
        expect(updatedList.name).toBe('Updated');
        expect(updatedList.wordIds).toContain('new_word_id');

        // Verify it's actually updated in storage
        const retrievedList = await db.getList(addedList.id);
        expect(retrievedList.name).toBe('Updated');
        expect(retrievedList.wordIds).toContain('new_word_id');
      });

      test('should throw error for non-existent list', async () => {
        const fakeList = new MockVocabularyList({ id: 'nonexistent' });
        
        await expect(db.updateList(fakeList)).rejects.toThrow('List not found');
      });
    });

    describe('deleteList', () => {
      test('should delete non-default list', async () => {
        const addedList = await db.addList({ name: 'Delete Me' });
        
        const result = await db.deleteList(addedList.id);
        expect(result).toBe(true);

        const retrievedList = await db.getList(addedList.id);
        expect(retrievedList).toBeNull();
      });

      test('should not delete default list', async () => {
        const defaultList = await db.getDefaultList();
        
        await expect(db.deleteList(defaultList.id)).rejects.toThrow('Cannot delete default list');
      });

      test('should return false for non-existent list', async () => {
        await expect(db.deleteList('nonexistent_id')).rejects.toThrow('Cannot delete default list');
      });
    });

    describe('getDefaultList', () => {
      test('should return the default list', async () => {
        const defaultList = await db.getDefaultList();
        
        expect(defaultList).toBeDefined();
        expect(defaultList.isDefault).toBe(true);
        expect(defaultList.name).toBe('My Vocabulary');
      });

      test('should return null if no default list exists', async () => {
        // Remove default list manually for this test
        const defaultList = await db.getDefaultList();
        defaultList.isDefault = false;
        await db.updateList(defaultList);
        
        const result = await db.getDefaultList();
        expect(result).toBeNull();
      });
    });
  });

  describe('Settings Operations', () => {
    describe('getSettings', () => {
      test('should return default settings initially', async () => {
        const settings = await db.getSettings();
        
        expect(settings).toBeInstanceOf(MockUserSettings);
        expect(settings.theme).toBe('light');
        expect(settings.autoAdd).toBe(true);
        expect(settings.defaultListId).toBeNull();
      });
    });

    describe('updateSettings', () => {
      test('should update settings with UserSettings instance', async () => {
        const newSettings = new MockUserSettings({
          theme: 'dark',
          autoAdd: false,
          defaultListId: 'test_list'
        });

        const result = await db.updateSettings(newSettings);
        
        expect(result).toBeInstanceOf(MockUserSettings);
        expect(result.theme).toBe('dark');
        expect(result.autoAdd).toBe(false);
        expect(result.defaultListId).toBe('test_list');

        // Verify persistence
        const retrievedSettings = await db.getSettings();
        expect(retrievedSettings.theme).toBe('dark');
        expect(retrievedSettings.autoAdd).toBe(false);
      });

      test('should update settings with plain object', async () => {
        const settingsData = {
          theme: 'dark',
          sessionSize: 10
        };

        const result = await db.updateSettings(settingsData);
        
        expect(result).toBeInstanceOf(MockUserSettings);
        expect(result.theme).toBe('dark');
        expect(result.sessionSize).toBe(10);
        expect(result.autoAdd).toBe(true); // Should maintain default
      });
    });
  });

  describe('Stats Operations', () => {
    describe('getStats', () => {
      test('should return default stats initially', async () => {
        const stats = await db.getStats();
        
        expect(stats).toBeInstanceOf(MockLearningStats);
        expect(stats.totalWords).toBe(0);
        expect(stats.wordsReviewed).toBe(0);
        expect(stats.correctAnswers).toBe(0);
        expect(stats.currentStreak).toBe(0);
      });
    });

    describe('updateStats', () => {
      test('should update stats with LearningStats instance', async () => {
        const newStats = new MockLearningStats({
          totalWords: 50,
          wordsReviewed: 100,
          correctAnswers: 75,
          currentStreak: 5
        });

        const result = await db.updateStats(newStats);
        
        expect(result).toBeInstanceOf(MockLearningStats);
        expect(result.totalWords).toBe(50);
        expect(result.wordsReviewed).toBe(100);
        expect(result.correctAnswers).toBe(75);
        expect(result.currentStreak).toBe(5);

        // Verify persistence
        const retrievedStats = await db.getStats();
        expect(retrievedStats.totalWords).toBe(50);
        expect(retrievedStats.currentStreak).toBe(5);
      });

      test('should update stats with plain object', async () => {
        const statsData = {
          totalWords: 25,
          currentStreak: 8
        };

        const result = await db.updateStats(statsData);
        
        expect(result).toBeInstanceOf(MockLearningStats);
        expect(result.totalWords).toBe(25);
        expect(result.currentStreak).toBe(8);
        expect(result.wordsReviewed).toBe(0); // Should maintain default
      });
    });
  });

  describe('Dictionary Cache Operations', () => {
    describe('cacheDictionaryEntry', () => {
      test('should cache dictionary entry', async () => {
        const entry = {
          word: 'test',
          definitions: [{ partOfSpeech: 'noun', meaning: 'test' }]
        };

        const result = await db.cacheDictionaryEntry('test', entry);
        
        expect(result).toEqual(entry);
      });
    });

    describe('getCachedDictionaryEntry', () => {
      test('should retrieve cached entry within expiry time', async () => {
        const entry = {
          word: 'test',
          definitions: [{ partOfSpeech: 'noun', meaning: 'test' }]
        };

        await db.cacheDictionaryEntry('test', entry);
        const cached = await db.getCachedDictionaryEntry('test');
        
        expect(cached).toBeDefined();
        expect(cached.word).toBe('test');
        expect(cached.cachedAt).toBeInstanceOf(Date);
      });

      test('should return null for non-existent cache entry', async () => {
        const cached = await db.getCachedDictionaryEntry('nonexistent');
        expect(cached).toBeNull();
      });

      test('should return null for expired cache entry', async () => {
        const entry = { word: 'expired' };
        
        // Manually set an old cache entry
        const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        db.data.cache.set('expired', {
          ...entry,
          cachedAt: oldDate
        });

        const cached = await db.getCachedDictionaryEntry('expired');
        expect(cached).toBeNull();
        
        // Verify it was removed from cache
        expect(db.data.cache.has('expired')).toBe(false);
      });
    });
  });

  describe('Database Helpers', () => {
    describe('reset', () => {
      test('should reset all data and recreate default list', async () => {
        // Add some data
        await db.addWord({ word: 'test' });
        await db.addList({ name: 'Test List' });
        
        let words = await db.getAllWords();
        let lists = await db.getAllLists();
        expect(words).toHaveLength(1);
        expect(lists).toHaveLength(2); // 1 default + 1 custom
        
        // Reset
        db.reset();
        
        words = await db.getAllWords();
        lists = await db.getAllLists();
        expect(words).toHaveLength(0);
        expect(lists).toHaveLength(1); // Only default list
        expect(lists[0].isDefault).toBe(true);
      });
    });

    describe('seedWithTestData', () => {
      test('should seed database with test data', () => {
        db.seedWithTestData();
        
        expect(db.data.words.size).toBe(2);
        expect(db.data.words.has('test_word_1')).toBe(true);
        expect(db.data.words.has('test_word_2')).toBe(true);
        
        const defaultList = db.data.lists.get('default_list');
        expect(defaultList.wordIds).toContain('test_word_1');
        expect(defaultList.wordIds).toContain('test_word_2');
      });
    });
  });
});