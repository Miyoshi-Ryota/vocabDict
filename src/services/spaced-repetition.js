/**
 * Spaced Repetition service for vocabulary learning
 */
class SpacedRepetition {
  /**
   * Calculate next review interval based on current interval and review result
   * @param {number} currentInterval - Current interval in days
   * @param {string} result - Review result: 'known', 'unknown', 'skipped', 'mastered'
   * @returns {number|null} Next interval in days, or null if mastered
   */
  static calculateNextReview(currentInterval, result) {
    const intervals = {
      known: {
        1: 3,
        3: 7,
        7: 14,
        14: 30,
        30: 60
      }
    };
    
    if (result === 'mastered') {
      return null; // Remove from active reviews
    }
    
    if (result === 'unknown') {
      return 1; // Reset to day 1
    }
    
    if (result === 'known') {
      return intervals.known[currentInterval] || currentInterval * 2;
    }
    
    // Skip doesn't change interval
    return currentInterval;
  }
  
  /**
   * Get words due for review from a collection
   * @param {Array} words - Array of word objects with nextReview property
   * @param {number} maxWords - Maximum words to return (default: 30)
   * @returns {Array} Words due for review, sorted by due date
   */
  static getReviewQueue(words, maxWords = 30) {
    const now = new Date();
    
    return words
      .filter(word => {
        // Only include words that have nextReview and it's due
        return word.nextReview && 
               word.nextReview !== null && 
               new Date(word.nextReview) <= now;
      })
      .sort((a, b) => {
        // Sort by nextReview date (oldest first)
        return new Date(a.nextReview) - new Date(b.nextReview);
      })
      .slice(0, maxWords);
  }
  
  /**
   * Calculate the current interval based on last review
   * @param {string|null} lastReviewed - ISO date string of last review
   * @returns {number} Current interval in days (minimum 1)
   */
  static getCurrentInterval(lastReviewed) {
    if (!lastReviewed) {
      return 1; // New word
    }
    
    const daysSinceLastReview = Math.ceil(
      (new Date() - new Date(lastReviewed)) / 86400000
    );
    
    return Math.max(1, daysSinceLastReview);
  }
  
  /**
   * Calculate next review date based on current date and interval
   * @param {number} intervalDays - Interval in days
   * @returns {Date} Next review date
   */
  static getNextReviewDate(intervalDays) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }
}

module.exports = SpacedRepetition;