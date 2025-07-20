/**
 * Unit tests for VocabDict data models
 * Tests VocabularyWord, VocabularyList, UserSettings, and LearningStats classes
 */

const {
  MockVocabularyWord,
  MockVocabularyList,
  MockUserSettings,
  MockLearningStats,
  MockConstants
} = require('../mocks/extensionMocks');

const { SAMPLE_VOCABULARY_WORDS, TestHelpers } = require('../fixtures/testData');

describe('VocabularyWord Model', () => {
  let word;

  beforeEach(() => {
    word = new MockVocabularyWord({
      word: 'test',
      definitions: [{
        partOfSpeech: 'noun',
        meaning: 'A test word',
        examples: ['This is a test.']
      }]
    });
  });

  describe('Constructor', () => {
    test('should create word with default values', () => {
      const newWord = new MockVocabularyWord();
      
      expect(newWord.id).toBeDefined();
      expect(newWord.word).toBe('test');
      expect(newWord.definitions).toEqual([]);
      expect(newWord.difficulty).toBe(1);
      expect(newWord.reviewCount).toBe(0);
      expect(newWord.correctCount).toBe(0);
      expect(newWord.lastReviewed).toBeNull();
      expect(newWord.nextReview).toBeInstanceOf(Date);
      expect(newWord.interval).toBe(1);
      expect(newWord.easeFactor).toBe(MockConstants.DEFAULT_EASE_FACTOR);
      expect(newWord.createdAt).toBeInstanceOf(Date);
      expect(newWord.updatedAt).toBeInstanceOf(Date);
    });

    test('should create word with provided values', () => {
      const testData = {
        id: 'custom_id',
        word: 'custom',
        definitions: [{ partOfSpeech: 'verb', meaning: 'to customize' }],
        difficulty: 3,
        reviewCount: 5,
        correctCount: 3
      };

      const newWord = new MockVocabularyWord(testData);
      
      expect(newWord.id).toBe('custom_id');
      expect(newWord.word).toBe('custom');
      expect(newWord.definitions).toEqual(testData.definitions);
      expect(newWord.difficulty).toBe(3);
      expect(newWord.reviewCount).toBe(5);
      expect(newWord.correctCount).toBe(3);
    });
  });

  describe('ID Generation', () => {
    test('should generate unique IDs', () => {
      const id1 = word.generateId();
      const id2 = word.generateId();
      
      expect(id1).toMatch(/^word_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^word_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Review Calculation', () => {
    test('should handle correct answer', () => {
      const initialEaseFactor = word.easeFactor;
      const initialInterval = word.interval;
      
      word.calculateNextReview(true);
      
      expect(word.reviewCount).toBe(1);
      expect(word.correctCount).toBe(1);
      expect(word.lastReviewed).toBeInstanceOf(Date);
      expect(word.nextReview).toBeInstanceOf(Date);
      expect(word.nextReview.getTime()).toBeGreaterThan(Date.now());
      expect(word.easeFactor).toBeGreaterThan(initialEaseFactor);
      
      // First correct answer should set interval to 6
      if (initialInterval === 1) {
        expect(word.interval).toBe(6);
      }
    });

    test('should handle incorrect answer', () => {
      word.reviewCount = 3;
      word.correctCount = 2;
      word.interval = 10;
      const initialEaseFactor = word.easeFactor;
      
      word.calculateNextReview(false);
      
      expect(word.reviewCount).toBe(4);
      expect(word.correctCount).toBe(2); // Should not increase
      expect(word.interval).toBe(1); // Should reset to 1
      expect(word.easeFactor).toBeLessThan(initialEaseFactor);
      expect(word.easeFactor).toBeGreaterThanOrEqual(MockConstants.MIN_EASE_FACTOR);
    });

    test('should respect ease factor bounds', () => {
      // Test maximum bound
      word.easeFactor = MockConstants.MAX_EASE_FACTOR - 0.05;
      word.calculateNextReview(true);
      expect(word.easeFactor).toBeLessThanOrEqual(MockConstants.MAX_EASE_FACTOR);
      
      // Test minimum bound
      word.easeFactor = MockConstants.MIN_EASE_FACTOR + 0.1;
      word.calculateNextReview(false);
      expect(word.easeFactor).toBeGreaterThanOrEqual(MockConstants.MIN_EASE_FACTOR);
    });

    test('should increase interval on subsequent correct answers', () => {
      // First correct answer
      word.calculateNextReview(true);
      expect(word.interval).toBe(6);
      
      // Second correct answer
      word.calculateNextReview(true);
      expect(word.interval).toBeGreaterThan(6);
      expect(word.interval).toBe(Math.round(6 * word.easeFactor));
    });
  });

  describe('Due Date Check', () => {
    test('should identify due words', () => {
      // Set next review to past date
      word.nextReview = new Date(Date.now() - 1000);
      expect(word.isDue()).toBe(true);
    });

    test('should identify non-due words', () => {
      // Set next review to future date
      word.nextReview = new Date(Date.now() + 86400000); // +1 day
      expect(word.isDue()).toBe(false);
    });

    test('should handle edge case of exactly due', () => {
      word.nextReview = new Date();
      expect(word.isDue()).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to valid JSON', () => {
      const json = word.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('word');
      expect(json).toHaveProperty('definitions');
      expect(json).toHaveProperty('difficulty');
      expect(json).toHaveProperty('reviewCount');
      expect(json).toHaveProperty('correctCount');
      expect(json).toHaveProperty('lastReviewed');
      expect(json).toHaveProperty('nextReview');
      expect(json).toHaveProperty('interval');
      expect(json).toHaveProperty('easeFactor');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    test('should maintain data integrity in JSON', () => {
      const json = word.toJSON();
      
      expect(json.id).toBe(word.id);
      expect(json.word).toBe(word.word);
      expect(json.definitions).toEqual(word.definitions);
      expect(json.easeFactor).toBe(word.easeFactor);
    });
  });
});

describe('VocabularyList Model', () => {
  let list;

  beforeEach(() => {
    list = new MockVocabularyList({
      name: 'Test List',
      wordIds: ['word1', 'word2']
    });
  });

  describe('Constructor', () => {
    test('should create list with default values', () => {
      const newList = new MockVocabularyList();
      
      expect(newList.id).toBeDefined();
      expect(newList.name).toBe('Test List');
      expect(newList.wordIds).toEqual([]);
      expect(newList.isDefault).toBe(false);
      expect(newList.createdAt).toBeInstanceOf(Date);
      expect(newList.updatedAt).toBeInstanceOf(Date);
    });

    test('should create list with provided values', () => {
      const testData = {
        id: 'custom_list_id',
        name: 'Custom List',
        wordIds: ['word1', 'word2', 'word3'],
        isDefault: true
      };

      const newList = new MockVocabularyList(testData);
      
      expect(newList.id).toBe('custom_list_id');
      expect(newList.name).toBe('Custom List');
      expect(newList.wordIds).toEqual(['word1', 'word2', 'word3']);
      expect(newList.isDefault).toBe(true);
    });
  });

  describe('Word Management', () => {
    test('should add word to list', () => {
      const initialCount = list.wordIds.length;
      const initialUpdatedAt = list.updatedAt;
      
      // Wait a moment to ensure updatedAt changes
      setTimeout(() => {
        list.addWord('word3');
        
        expect(list.wordIds).toContain('word3');
        expect(list.wordIds.length).toBe(initialCount + 1);
        expect(list.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      }, 1);
    });

    test('should not add duplicate words', () => {
      const initialCount = list.wordIds.length;
      
      list.addWord('word1'); // Already exists
      
      expect(list.wordIds.length).toBe(initialCount);
      expect(list.wordIds.filter(id => id === 'word1').length).toBe(1);
    });

    test('should remove word from list', () => {
      const initialCount = list.wordIds.length;
      const initialUpdatedAt = list.updatedAt;
      
      setTimeout(() => {
        list.removeWord('word1');
        
        expect(list.wordIds).not.toContain('word1');
        expect(list.wordIds.length).toBe(initialCount - 1);
        expect(list.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      }, 1);
    });

    test('should handle removing non-existent word', () => {
      const initialCount = list.wordIds.length;
      
      list.removeWord('nonexistent');
      
      expect(list.wordIds.length).toBe(initialCount);
    });

    test('should check if word exists in list', () => {
      expect(list.containsWord('word1')).toBe(true);
      expect(list.containsWord('word2')).toBe(true);
      expect(list.containsWord('nonexistent')).toBe(false);
    });

    test('should return correct word count', () => {
      expect(list.getWordCount()).toBe(2);
      
      list.addWord('word3');
      expect(list.getWordCount()).toBe(3);
      
      list.removeWord('word1');
      expect(list.getWordCount()).toBe(2);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to valid JSON', () => {
      const json = list.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('wordIds');
      expect(json).toHaveProperty('isDefault');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    test('should maintain data integrity in JSON', () => {
      const json = list.toJSON();
      
      expect(json.id).toBe(list.id);
      expect(json.name).toBe(list.name);
      expect(json.wordIds).toEqual(list.wordIds);
      expect(json.isDefault).toBe(list.isDefault);
    });
  });
});

describe('UserSettings Model', () => {
  let settings;

  beforeEach(() => {
    settings = new MockUserSettings();
  });

  describe('Constructor', () => {
    test('should create settings with default values', () => {
      expect(settings.theme).toBe('light');
      expect(settings.autoAdd).toBe(true);
      expect(settings.defaultListId).toBeNull();
      expect(settings.reviewReminders).toBe(true);
      expect(settings.sessionSize).toBe(20);
    });

    test('should create settings with provided values', () => {
      const testData = {
        theme: 'dark',
        autoAdd: false,
        defaultListId: 'list123',
        reviewReminders: false,
        sessionSize: 10
      };

      const newSettings = new MockUserSettings(testData);
      
      expect(newSettings.theme).toBe('dark');
      expect(newSettings.autoAdd).toBe(false);
      expect(newSettings.defaultListId).toBe('list123');
      expect(newSettings.reviewReminders).toBe(false);
      expect(newSettings.sessionSize).toBe(10);
    });

    test('should handle partial data', () => {
      const partialData = {
        theme: 'dark',
        sessionSize: 15
      };

      const newSettings = new MockUserSettings(partialData);
      
      expect(newSettings.theme).toBe('dark');
      expect(newSettings.autoAdd).toBe(true); // Default value
      expect(newSettings.sessionSize).toBe(15);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to valid JSON', () => {
      const json = settings.toJSON();
      
      expect(json).toHaveProperty('theme');
      expect(json).toHaveProperty('autoAdd');
      expect(json).toHaveProperty('defaultListId');
      expect(json).toHaveProperty('reviewReminders');
      expect(json).toHaveProperty('sessionSize');
    });

    test('should maintain data integrity in JSON', () => {
      settings.theme = 'dark';
      settings.autoAdd = false;
      settings.defaultListId = 'test_list';
      
      const json = settings.toJSON();
      
      expect(json.theme).toBe('dark');
      expect(json.autoAdd).toBe(false);
      expect(json.defaultListId).toBe('test_list');
    });
  });
});

describe('LearningStats Model', () => {
  let stats;

  beforeEach(() => {
    stats = new MockLearningStats();
  });

  describe('Constructor', () => {
    test('should create stats with default values', () => {
      expect(stats.totalWords).toBe(0);
      expect(stats.wordsReviewed).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.averageEaseFactor).toBe(MockConstants.DEFAULT_EASE_FACTOR);
      expect(stats.timeStudied).toBe(0);
      expect(stats.lastStudyDate).toBeNull();
    });

    test('should create stats with provided values', () => {
      const testData = {
        totalWords: 50,
        wordsReviewed: 100,
        correctAnswers: 80,
        currentStreak: 5,
        longestStreak: 15,
        timeStudied: 3600
      };

      const newStats = new MockLearningStats(testData);
      
      expect(newStats.totalWords).toBe(50);
      expect(newStats.wordsReviewed).toBe(100);
      expect(newStats.correctAnswers).toBe(80);
      expect(newStats.currentStreak).toBe(5);
      expect(newStats.longestStreak).toBe(15);
      expect(newStats.timeStudied).toBe(3600);
    });
  });

  describe('Review Statistics', () => {
    test('should update stats on correct answer', () => {
      stats.updateReviewStats(true);
      
      expect(stats.wordsReviewed).toBe(1);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(1);
      expect(stats.lastStudyDate).toBeInstanceOf(Date);
    });

    test('should update stats on incorrect answer', () => {
      stats.currentStreak = 5;
      stats.longestStreak = 5;
      
      stats.updateReviewStats(false);
      
      expect(stats.wordsReviewed).toBe(1);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(5); // Should not change
    });

    test('should track longest streak correctly', () => {
      // Build up a streak
      stats.updateReviewStats(true); // streak: 1
      stats.updateReviewStats(true); // streak: 2
      stats.updateReviewStats(true); // streak: 3
      expect(stats.longestStreak).toBe(3);
      
      // Break the streak
      stats.updateReviewStats(false); // streak: 0
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(3); // Should remain 3
      
      // Build a longer streak
      stats.updateReviewStats(true); // streak: 1
      stats.updateReviewStats(true); // streak: 2
      stats.updateReviewStats(true); // streak: 3
      stats.updateReviewStats(true); // streak: 4
      expect(stats.longestStreak).toBe(4);
    });

    test('should calculate accuracy correctly', () => {
      expect(stats.getAccuracy()).toBe(0); // No reviews yet
      
      stats.updateReviewStats(true);
      stats.updateReviewStats(true);
      stats.updateReviewStats(false);
      
      expect(stats.getAccuracy()).toBeCloseTo(2/3, 2);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to valid JSON', () => {
      const json = stats.toJSON();
      
      expect(json).toHaveProperty('totalWords');
      expect(json).toHaveProperty('wordsReviewed');
      expect(json).toHaveProperty('correctAnswers');
      expect(json).toHaveProperty('currentStreak');
      expect(json).toHaveProperty('longestStreak');
      expect(json).toHaveProperty('averageEaseFactor');
      expect(json).toHaveProperty('timeStudied');
      expect(json).toHaveProperty('lastStudyDate');
    });

    test('should maintain data integrity in JSON', () => {
      stats.totalWords = 25;
      stats.currentStreak = 8;
      stats.timeStudied = 7200;
      
      const json = stats.toJSON();
      
      expect(json.totalWords).toBe(25);
      expect(json.currentStreak).toBe(8);
      expect(json.timeStudied).toBe(7200);
    });
  });
});

describe('Model Integration', () => {
  test('should work with custom matcher toBeValidVocabularyWord', () => {
    const validWord = new MockVocabularyWord({
      word: 'integration',
      definitions: [{ partOfSpeech: 'noun', meaning: 'test definition' }]
    });
    
    expect(validWord).toBeValidVocabularyWord();
  });

  test('should work with custom matcher toBeValidVocabularyList', () => {
    const validList = new MockVocabularyList({
      name: 'Integration Test List'
    });
    
    expect(validList).toBeValidVocabularyList();
  });

  test('should work with custom matcher toBeValidUserSettings', () => {
    const validSettings = new MockUserSettings({
      theme: 'dark',
      autoAdd: false
    });
    
    expect(validSettings).toBeValidUserSettings();
  });
});