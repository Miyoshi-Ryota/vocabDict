/**
 * Mocks for Safari Extension modules
 * These mocks simulate the behavior of extension components for testing
 */

const { SAMPLE_DICTIONARY_ENTRIES, MESSAGE_TYPES, TestHelpers } = require('../fixtures/testData');

// Mock Constants
const MockConstants = {
  DEBOUNCE_DELAY: 300,
  FEEDBACK_DURATION: 2000,
  CACHE_EXPIRY_HOURS: 24,
  MIN_WORD_LENGTH: 2,
  MAX_WORD_LENGTH: 50,
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.0
};

const MockMessageTypes = MESSAGE_TYPES;

const MockMessageStatus = {
  SUCCESS: 'success',
  ERROR: 'error'
};

const MockDB_CONFIG = {
  DB_NAME: 'vocabdict_db_test',
  DB_VERSION: 1,
  STORES: {
    DICTIONARY_CACHE: 'dictionary_cache',
    VOCABULARY_WORDS: 'vocabulary_words',
    VOCABULARY_LISTS: 'vocabulary_lists',
    USER_SETTINGS: 'user_settings',
    LEARNING_STATS: 'learning_stats'
  }
};

// Mock VocabularyWord class
class MockVocabularyWord {
  constructor(data = {}) {
    this.id = data.id || TestHelpers.generateRandomId('word');
    this.word = data.word || 'test';
    this.definitions = data.definitions || [];
    this.difficulty = data.difficulty || 1;
    this.reviewCount = data.reviewCount || 0;
    this.correctCount = data.correctCount || 0;
    this.lastReviewed = data.lastReviewed || null;
    this.nextReview = data.nextReview || new Date();
    this.interval = data.interval || 1;
    this.easeFactor = data.easeFactor || MockConstants.DEFAULT_EASE_FACTOR;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return TestHelpers.generateRandomId('word');
  }

  calculateNextReview(correct) {
    this.reviewCount++;
    this.updatedAt = new Date();
    
    if (correct) {
      this.correctCount++;
      if (this.interval === 1) {
        this.interval = 6;
      } else {
        this.interval = Math.round(this.interval * this.easeFactor);
      }
      this.easeFactor = Math.min(
        MockConstants.MAX_EASE_FACTOR,
        this.easeFactor + 0.1
      );
    } else {
      this.interval = 1;
      this.easeFactor = Math.max(
        MockConstants.MIN_EASE_FACTOR,
        this.easeFactor - 0.2
      );
    }
    
    this.lastReviewed = new Date();
    this.nextReview = new Date(Date.now() + this.interval * 24 * 60 * 60 * 1000);
  }

  isDue() {
    return new Date() >= this.nextReview;
  }

  toJSON() {
    return {
      id: this.id,
      word: this.word,
      definitions: this.definitions,
      difficulty: this.difficulty,
      reviewCount: this.reviewCount,
      correctCount: this.correctCount,
      lastReviewed: this.lastReviewed,
      nextReview: this.nextReview,
      interval: this.interval,
      easeFactor: this.easeFactor,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Mock VocabularyList class
class MockVocabularyList {
  constructor(data = {}) {
    this.id = data.id || TestHelpers.generateRandomId('list');
    this.name = data.name || 'Test List';
    this.wordIds = data.wordIds || [];
    this.isDefault = data.isDefault || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return TestHelpers.generateRandomId('list');
  }

  addWord(wordId) {
    if (!this.wordIds.includes(wordId)) {
      this.wordIds.push(wordId);
      this.updatedAt = new Date();
    }
  }

  removeWord(wordId) {
    const index = this.wordIds.indexOf(wordId);
    if (index > -1) {
      this.wordIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  containsWord(wordId) {
    return this.wordIds.includes(wordId);
  }

  getWordCount() {
    return this.wordIds.length;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      wordIds: this.wordIds,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Mock UserSettings class
class MockUserSettings {
  constructor(data = {}) {
    this.theme = data.theme || 'light';
    this.autoAdd = data.autoAdd !== undefined ? data.autoAdd : true;
    this.defaultListId = data.defaultListId || null;
    this.reviewReminders = data.reviewReminders !== undefined ? data.reviewReminders : true;
    this.sessionSize = data.sessionSize || 20;
  }

  toJSON() {
    return {
      theme: this.theme,
      autoAdd: this.autoAdd,
      defaultListId: this.defaultListId,
      reviewReminders: this.reviewReminders,
      sessionSize: this.sessionSize
    };
  }
}

// Mock LearningStats class
class MockLearningStats {
  constructor(data = {}) {
    this.totalWords = data.totalWords || 0;
    this.wordsReviewed = data.wordsReviewed || 0;
    this.correctAnswers = data.correctAnswers || 0;
    this.currentStreak = data.currentStreak || 0;
    this.longestStreak = data.longestStreak || 0;
    this.averageEaseFactor = data.averageEaseFactor || MockConstants.DEFAULT_EASE_FACTOR;
    this.timeStudied = data.timeStudied || 0;
    this.lastStudyDate = data.lastStudyDate || null;
  }

  updateReviewStats(correct) {
    this.wordsReviewed++;
    
    if (correct) {
      this.correctAnswers++;
      this.currentStreak++;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    } else {
      this.currentStreak = 0;
    }
    
    this.lastStudyDate = new Date();
  }

  getAccuracy() {
    return this.wordsReviewed > 0 ? this.correctAnswers / this.wordsReviewed : 0;
  }

  toJSON() {
    return {
      totalWords: this.totalWords,
      wordsReviewed: this.wordsReviewed,
      correctAnswers: this.correctAnswers,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      averageEaseFactor: this.averageEaseFactor,
      timeStudied: this.timeStudied,
      lastStudyDate: this.lastStudyDate
    };
  }
}

// Mock Database class
class MockVocabDictDatabase {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.data = {
      words: new Map(),
      lists: new Map(),
      settings: new MockUserSettings(),
      stats: new MockLearningStats(),
      cache: new Map()
    };
  }

  async initialize() {
    this.isInitialized = true;
    this.db = { name: 'mock_db' };
    
    // Initialize with default list
    const defaultList = new MockVocabularyList({
      id: 'default_list',
      name: 'My Vocabulary',
      isDefault: true
    });
    this.data.lists.set(defaultList.id, defaultList);
    
    return Promise.resolve();
  }

  async addWord(wordData) {
    const word = new MockVocabularyWord(wordData);
    this.data.words.set(word.id, word);
    this.data.stats.totalWords = this.data.words.size;
    return word;
  }

  async getWord(wordId) {
    return this.data.words.get(wordId) || null;
  }

  async getAllWords() {
    return Array.from(this.data.words.values());
  }

  async updateWord(word) {
    if (this.data.words.has(word.id)) {
      this.data.words.set(word.id, word);
      return word;
    }
    throw new Error('Word not found');
  }

  async deleteWord(wordId) {
    const deleted = this.data.words.delete(wordId);
    if (deleted) {
      this.data.stats.totalWords = this.data.words.size;
      // Remove from all lists
      this.data.lists.forEach(list => list.removeWord(wordId));
    }
    return deleted;
  }

  async getWordsDueForReview() {
    return Array.from(this.data.words.values()).filter(word => word.isDue());
  }

  async addList(listData) {
    const list = new MockVocabularyList(listData);
    this.data.lists.set(list.id, list);
    return list;
  }

  async getList(listId) {
    return this.data.lists.get(listId) || null;
  }

  async getAllLists() {
    return Array.from(this.data.lists.values());
  }

  async updateList(list) {
    if (this.data.lists.has(list.id)) {
      this.data.lists.set(list.id, list);
      return list;
    }
    throw new Error('List not found');
  }

  async deleteList(listId) {
    const list = this.data.lists.get(listId);
    if (list && !list.isDefault) {
      return this.data.lists.delete(listId);
    }
    throw new Error('Cannot delete default list');
  }

  async getDefaultList() {
    for (const list of this.data.lists.values()) {
      if (list.isDefault) {
        return list;
      }
    }
    return null;
  }

  async getSettings() {
    return this.data.settings;
  }

  async updateSettings(settings) {
    this.data.settings = settings instanceof MockUserSettings ? settings : new MockUserSettings(settings);
    return this.data.settings;
  }

  async getStats() {
    return this.data.stats;
  }

  async updateStats(stats) {
    this.data.stats = stats instanceof MockLearningStats ? stats : new MockLearningStats(stats);
    return this.data.stats;
  }

  async cacheDictionaryEntry(word, entry) {
    this.data.cache.set(word, {
      ...entry,
      cachedAt: new Date()
    });
    return entry;
  }

  async getCachedDictionaryEntry(word) {
    const cached = this.data.cache.get(word);
    if (cached) {
      const hoursSinceCached = (Date.now() - cached.cachedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCached < MockConstants.CACHE_EXPIRY_HOURS) {
        return cached;
      } else {
        this.data.cache.delete(word);
      }
    }
    return null;
  }

  // Test helper methods
  reset() {
    this.data = {
      words: new Map(),
      lists: new Map(),
      settings: new MockUserSettings(),
      stats: new MockLearningStats(),
      cache: new Map()
    };
    
    // Re-add default list
    const defaultList = new MockVocabularyList({
      id: 'default_list',
      name: 'My Vocabulary',
      isDefault: true
    });
    this.data.lists.set(defaultList.id, defaultList);
  }

  seedWithTestData() {
    // Add some test words
    const word1 = new MockVocabularyWord({
      id: 'test_word_1',
      word: 'hello',
      definitions: SAMPLE_DICTIONARY_ENTRIES.hello.definitions
    });
    
    const word2 = new MockVocabularyWord({
      id: 'test_word_2',
      word: 'world',
      definitions: SAMPLE_DICTIONARY_ENTRIES.world.definitions
    });
    
    this.data.words.set(word1.id, word1);
    this.data.words.set(word2.id, word2);
    
    // Add words to default list
    const defaultList = this.data.lists.get('default_list');
    if (defaultList) {
      defaultList.addWord(word1.id);
      defaultList.addWord(word2.id);
    }
    
    this.data.stats.totalWords = this.data.words.size;
  }
}

// Mock Dictionary
const MockToyDictionary = SAMPLE_DICTIONARY_ENTRIES;

// Mock message handlers
const createMockHandlers = (db) => {
  return {
    handleLookupWord: jest.fn(async ({ word }) => {
      const entry = MockToyDictionary[word.toLowerCase()];
      return entry ? { word: word.toLowerCase(), ...entry } : null;
    }),

    handleAddWord: jest.fn(async ({ word }) => {
      return await db.addWord(word);
    }),

    handleGetWord: jest.fn(async ({ wordId }) => {
      return await db.getWord(wordId);
    }),

    handleGetAllWords: jest.fn(async () => {
      const words = await db.getAllWords();
      return words.map(w => w.toJSON());
    }),

    handleUpdateWord: jest.fn(async ({ word }) => {
      const vocabWord = new MockVocabularyWord(word);
      return await db.updateWord(vocabWord);
    }),

    handleDeleteWord: jest.fn(async ({ wordId }) => {
      return await db.deleteWord(wordId);
    }),

    handleGetWordsDueForReview: jest.fn(async () => {
      const words = await db.getWordsDueForReview();
      return words.map(w => w.toJSON());
    }),

    handleAddList: jest.fn(async ({ list }) => {
      return await db.addList(list);
    }),

    handleGetList: jest.fn(async ({ listId }) => {
      return await db.getList(listId);
    }),

    handleGetAllLists: jest.fn(async () => {
      const lists = await db.getAllLists();
      return lists.map(l => l.toJSON());
    }),

    handleUpdateList: jest.fn(async ({ list }) => {
      const vocabList = new MockVocabularyList(list);
      return await db.updateList(vocabList);
    }),

    handleDeleteList: jest.fn(async ({ listId }) => {
      return await db.deleteList(listId);
    }),

    handleGetDefaultList: jest.fn(async () => {
      return await db.getDefaultList();
    }),

    handleAddWordToList: jest.fn(async ({ wordId, listId, wordData }) => {
      let word;
      let targetListId = listId;
      
      if (wordData) {
        word = await db.addWord(wordData);
        wordId = word.id;
      } else if (wordId) {
        word = await db.getWord(wordId);
        if (!word) {
          throw new Error(`Word with ID ${wordId} not found`);
        }
      }
      
      if (!targetListId) {
        const defaultList = await db.getDefaultList();
        if (!defaultList) {
          throw new Error('No default list found');
        }
        targetListId = defaultList.id;
      }
      
      const list = await db.getList(targetListId);
      if (!list) {
        throw new Error(`List with ID ${targetListId} not found`);
      }
      
      list.addWord(wordId);
      await db.updateList(list);
      
      return word.toJSON();
    }),

    handleRemoveWordFromList: jest.fn(async ({ wordId, listId }) => {
      const list = await db.getList(listId);
      if (!list) {
        throw new Error(`List with ID ${listId} not found`);
      }
      
      list.removeWord(wordId);
      await db.updateList(list);
      
      return { success: true };
    }),

    handleGetSettings: jest.fn(async () => {
      const settings = await db.getSettings();
      return settings.toJSON();
    }),

    handleUpdateSettings: jest.fn(async ({ settings }) => {
      const userSettings = settings instanceof MockUserSettings ? settings : new MockUserSettings(settings);
      return await db.updateSettings(userSettings);
    }),

    handleGetStats: jest.fn(async () => {
      const stats = await db.getStats();
      return stats.toJSON();
    }),

    handleUpdateStats: jest.fn(async ({ stats }) => {
      const learningStats = new MockLearningStats(stats);
      return await db.updateStats(learningStats);
    }),

    handleUpdateReviewStats: jest.fn(async ({ wordId, correct }) => {
      const word = await db.getWord(wordId);
      if (!word) {
        throw new Error(`Word with ID ${wordId} not found`);
      }
      
      word.calculateNextReview(correct);
      await db.updateWord(word);
      
      const stats = await db.getStats();
      stats.updateReviewStats(correct);
      await db.updateStats(stats);
      
      return {
        word: word.toJSON(),
        stats: stats.toJSON()
      };
    })
  };
};

module.exports = {
  MockConstants,
  MockMessageTypes,
  MockMessageStatus,
  MockDB_CONFIG,
  MockVocabularyWord,
  MockVocabularyList,
  MockUserSettings,
  MockLearningStats,
  MockVocabDictDatabase,
  MockToyDictionary,
  createMockHandlers
};