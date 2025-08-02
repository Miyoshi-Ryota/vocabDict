/**
 * @jest-environment jsdom
 */

const SpacedRepetition = require('../../src/services/spaced-repetition');

describe('SpacedRepetition Service', () => {
  describe('calculateNextReview', () => {
    test('should return null for mastered words', () => {
      const result = SpacedRepetition.calculateNextReview(7, 'mastered');
      expect(result).toBeNull();
    });

    test('should reset to 1 day for unknown words', () => {
      expect(SpacedRepetition.calculateNextReview(7, 'unknown')).toBe(1);
      expect(SpacedRepetition.calculateNextReview(30, 'unknown')).toBe(1);
      expect(SpacedRepetition.calculateNextReview(1, 'unknown')).toBe(1);
    });

    test('should keep same interval for skipped words', () => {
      expect(SpacedRepetition.calculateNextReview(3, 'skipped')).toBe(3);
      expect(SpacedRepetition.calculateNextReview(14, 'skipped')).toBe(14);
      expect(SpacedRepetition.calculateNextReview(1, 'skipped')).toBe(1);
    });

    test('should advance intervals for known words following SRS pattern', () => {
      // Standard SRS progression: 1 -> 3 -> 7 -> 14 -> 30 -> 60
      expect(SpacedRepetition.calculateNextReview(1, 'known')).toBe(3);
      expect(SpacedRepetition.calculateNextReview(3, 'known')).toBe(7);
      expect(SpacedRepetition.calculateNextReview(7, 'known')).toBe(14);
      expect(SpacedRepetition.calculateNextReview(14, 'known')).toBe(30);
      expect(SpacedRepetition.calculateNextReview(30, 'known')).toBe(60);
    });

    test('should double interval for known words beyond standard progression', () => {
      expect(SpacedRepetition.calculateNextReview(60, 'known')).toBe(120);
      expect(SpacedRepetition.calculateNextReview(90, 'known')).toBe(180);
    });

    test('should handle edge cases and invalid inputs', () => {
      expect(SpacedRepetition.calculateNextReview(0, 'known')).toBe(0); // 0 * 2 = 0
      expect(SpacedRepetition.calculateNextReview(-1, 'known')).toBe(-2); // -1 * 2 = -2
      expect(SpacedRepetition.calculateNextReview(1, 'invalid')).toBe(1); // Should keep same interval
      expect(SpacedRepetition.calculateNextReview(7, '')).toBe(7); // Should keep same interval
    });
  });

  describe('getReviewQueue', () => {
    const now = new Date('2025-08-02T12:00:00Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return empty array for empty word list', () => {
      const result = SpacedRepetition.getReviewQueue([]);
      expect(result).toEqual([]);
    });

    test('should return words due for review today', () => {
      const words = [
        {
          word: 'hello',
          nextReview: '2025-08-02T10:00:00Z' // 2 hours ago - due
        },
        {
          word: 'world',
          nextReview: '2025-08-02T14:00:00Z' // 2 hours from now - not due
        },
        {
          word: 'test',
          nextReview: '2025-08-01T12:00:00Z' // yesterday - overdue
        }
      ];

      const result = SpacedRepetition.getReviewQueue(words);
      
      expect(result).toHaveLength(2);
      expect(result.map(w => w.word)).toEqual(['test', 'hello']); // Sorted by due date
    });

    test('should filter out words with null nextReview', () => {
      const words = [
        {
          word: 'hello',
          nextReview: '2025-08-02T10:00:00Z' // due
        },
        {
          word: 'world',
          nextReview: null // never reviewed
        },
        {
          word: 'test',
          nextReview: undefined // invalid
        }
      ];

      const result = SpacedRepetition.getReviewQueue(words);
      
      expect(result).toHaveLength(1);
      expect(result[0].word).toBe('hello');
    });

    test('should respect maxWords limit', () => {
      const words = Array.from({ length: 50 }, (_, i) => ({
        word: `word${i}`,
        nextReview: new Date(now.getTime() - i * 3600000).toISOString() // Each hour earlier
      }));

      const result = SpacedRepetition.getReviewQueue(words, 10);
      
      expect(result).toHaveLength(10);
      // Should get the 10 most overdue words
      expect(result[0].word).toBe('word49');
      expect(result[9].word).toBe('word40');
    });

    test('should use default maxWords of 30', () => {
      const words = Array.from({ length: 50 }, (_, i) => ({
        word: `word${i}`,
        nextReview: new Date(now.getTime() - i * 3600000).toISOString()
      }));

      const result = SpacedRepetition.getReviewQueue(words);
      
      expect(result).toHaveLength(30);
    });

    test('should sort by nextReview date (oldest first)', () => {
      const words = [
        {
          word: 'recent',
          nextReview: '2025-08-02T11:00:00Z' // 1 hour ago
        },
        {
          word: 'older',
          nextReview: '2025-08-01T12:00:00Z' // 1 day ago
        },
        {
          word: 'oldest',
          nextReview: '2025-07-31T12:00:00Z' // 2 days ago
        }
      ];

      const result = SpacedRepetition.getReviewQueue(words);
      
      expect(result.map(w => w.word)).toEqual(['oldest', 'older', 'recent']);
    });
  });

  describe('getCurrentInterval', () => {
    const now = new Date('2025-08-02T12:00:00Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return 1 for new words (no lastReviewed)', () => {
      expect(SpacedRepetition.getCurrentInterval(null)).toBe(1);
      expect(SpacedRepetition.getCurrentInterval(undefined)).toBe(1);
      expect(SpacedRepetition.getCurrentInterval('')).toBe(1);
    });

    test('should calculate days since last review', () => {
      const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600000).toISOString();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600000).toISOString();

      expect(SpacedRepetition.getCurrentInterval(oneDayAgo)).toBe(1);
      expect(SpacedRepetition.getCurrentInterval(threeDaysAgo)).toBe(3);
      expect(SpacedRepetition.getCurrentInterval(tenDaysAgo)).toBe(10);
    });

    test('should round up partial days', () => {
      const halfDayAgo = new Date(now.getTime() - 12 * 3600000).toISOString();
      const oneAndHalfDaysAgo = new Date(now.getTime() - 36 * 3600000).toISOString();

      expect(SpacedRepetition.getCurrentInterval(halfDayAgo)).toBe(1);
      expect(SpacedRepetition.getCurrentInterval(oneAndHalfDaysAgo)).toBe(2);
    });

    test('should handle same day (return minimum 1)', () => {
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
      const sameTime = now.toISOString();

      expect(SpacedRepetition.getCurrentInterval(oneHourAgo)).toBe(1);
      expect(SpacedRepetition.getCurrentInterval(sameTime)).toBe(1);
    });

    test('should handle future dates gracefully', () => {
      const tomorrow = new Date(now.getTime() + 24 * 3600000).toISOString();
      
      expect(SpacedRepetition.getCurrentInterval(tomorrow)).toBe(1);
    });
  });

  describe('getNextReviewDate', () => {
    const now = new Date('2025-08-02T12:00:00Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should add correct number of days to current date', () => {
      const result1 = SpacedRepetition.getNextReviewDate(1);
      const result3 = SpacedRepetition.getNextReviewDate(3);
      const result7 = SpacedRepetition.getNextReviewDate(7);

      expect(result1).toEqual(new Date('2025-08-03T12:00:00Z'));
      expect(result3).toEqual(new Date('2025-08-05T12:00:00Z'));
      expect(result7).toEqual(new Date('2025-08-09T12:00:00Z'));
    });

    test('should handle zero and negative intervals', () => {
      const result0 = SpacedRepetition.getNextReviewDate(0);
      const resultNeg = SpacedRepetition.getNextReviewDate(-1);

      expect(result0).toEqual(new Date('2025-08-02T12:00:00Z')); // Same day
      expect(resultNeg).toEqual(new Date('2025-08-01T12:00:00Z')); // Yesterday
    });

    test('should handle large intervals', () => {
      const result30 = SpacedRepetition.getNextReviewDate(30);
      const result365 = SpacedRepetition.getNextReviewDate(365);

      expect(result30).toEqual(new Date('2025-09-01T12:00:00Z'));
      expect(result365).toEqual(new Date('2026-08-02T12:00:00Z'));
    });

    test('should return Date object', () => {
      const result = SpacedRepetition.getNextReviewDate(1);
      
      expect(result).toBeInstanceOf(Date);
      expect(typeof result.getTime()).toBe('number');
    });
  });

  describe('Integration tests', () => {
    const now = new Date('2025-08-02T12:00:00Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should handle complete review workflow for new word', () => {
      // Simulate a new word review workflow
      let currentInterval = SpacedRepetition.getCurrentInterval(null); // New word
      expect(currentInterval).toBe(1);

      // First review - user knows the word
      let nextInterval = SpacedRepetition.calculateNextReview(currentInterval, 'known');
      expect(nextInterval).toBe(3);

      let nextReviewDate = SpacedRepetition.getNextReviewDate(nextInterval);
      expect(nextReviewDate).toEqual(new Date('2025-08-05T12:00:00Z'));

      // Second review - user still knows it
      nextInterval = SpacedRepetition.calculateNextReview(nextInterval, 'known');
      expect(nextInterval).toBe(7);

      // Third review - user forgot it
      nextInterval = SpacedRepetition.calculateNextReview(nextInterval, 'unknown');
      expect(nextInterval).toBe(1); // Reset to beginning
    });

    test('should handle review queue with mixed word states', () => {
      const words = [
        {
          word: 'mastered_word',
          nextReview: null, // Mastered words have no next review
          lastReviewed: '2025-07-30T12:00:00Z'
        },
        {
          word: 'due_word',
          nextReview: '2025-08-01T12:00:00Z', // Yesterday - overdue
          lastReviewed: '2025-07-29T12:00:00Z'
        },
        {
          word: 'future_word',
          nextReview: '2025-08-05T12:00:00Z', // Not due yet
          lastReviewed: '2025-08-01T12:00:00Z'
        },
        {
          word: 'new_word',
          nextReview: '2025-08-02T11:00:00Z', // Due now
          lastReviewed: null // First review
        }
      ];

      const reviewQueue = SpacedRepetition.getReviewQueue(words);
      
      expect(reviewQueue).toHaveLength(2);
      expect(reviewQueue.map(w => w.word)).toEqual(['due_word', 'new_word']);
    });
  });
});