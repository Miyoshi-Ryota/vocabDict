const { v4: uuidv4 } = require('uuid');

class VocabularyList {
  constructor(name, dictionary, isDefault = false) {
    if (!dictionary) {
      throw new Error('Dictionary is required');
    }
    
    this.id = uuidv4();
    this.name = name;
    this.created = new Date().toISOString();
    this.isDefault = isDefault;
    this.words = {}; // Key: word (lowercase), Value: user-specific data
    this.dictionary = dictionary;
  }

  /**
   * Add a word to the vocabulary list
   * @param {string} wordText - The word to add
   * @param {Object} metadata - Optional metadata (difficulty, customNotes)
   * @returns {Object} The word entry with user data
   */
  addWord(wordText, metadata = {}) {
    const normalizedWord = wordText.trim().toLowerCase();
    
    // Check if word exists in dictionary
    const dictionaryEntry = this.dictionary.lookup(wordText);
    if (!dictionaryEntry) {
      throw new Error('Word not found in dictionary');
    }
    
    // Check if word already exists in list
    if (this.words[normalizedWord]) {
      throw new Error('Word already exists in list');
    }
    
    // Create user-specific data for this word
    const userWordData = {
      word: dictionaryEntry.word, // Use the correct case from dictionary
      dateAdded: new Date().toISOString(),
      difficulty: metadata.difficulty || 'medium',
      customNotes: metadata.customNotes || '',
      lastReviewed: null,
      nextReview: new Date(Date.now() + 86400000).toISOString(), // Default: review tomorrow
      reviewHistory: []
    };
    
    this.words[normalizedWord] = userWordData;
    return userWordData;
  }

  /**
   * Remove a word from the vocabulary list
   * @param {string} wordText - The word to remove
   * @returns {Object|null} The removed word data or null
   */
  removeWord(wordText) {
    const normalizedWord = wordText.trim().toLowerCase();
    
    if (!this.words[normalizedWord]) {
      return null;
    }
    
    const removed = this.words[normalizedWord];
    delete this.words[normalizedWord];
    return removed;
  }

  /**
   * Update user-specific properties of a word
   * @param {string} wordText - The word to update
   * @param {Object} updates - Properties to update
   * @returns {Object|null} The updated word data or null
   */
  updateWord(wordText, updates) {
    const normalizedWord = wordText.trim().toLowerCase();
    
    if (!this.words[normalizedWord]) {
      return null;
    }
    
    // Only update allowed properties
    const allowedProps = ['difficulty', 'customNotes', 'lastReviewed', 'nextReview', 'reviewHistory'];
    allowedProps.forEach(prop => {
      if (updates.hasOwnProperty(prop)) {
        this.words[normalizedWord][prop] = updates[prop];
      }
    });
    
    return this.words[normalizedWord];
  }

  /**
   * Get a word with full data (dictionary + user data)
   * @param {string} wordText - The word to get
   * @returns {Object|null} The complete word data or null
   */
  getWord(wordText) {
    const normalizedWord = wordText.trim().toLowerCase();
    
    if (!this.words[normalizedWord]) {
      return null;
    }
    
    // Get dictionary data
    const dictionaryData = this.dictionary.lookup(wordText);
    
    // Merge dictionary data with user data
    return {
      ...dictionaryData,
      ...this.words[normalizedWord]
    };
  }

  /**
   * Get all words with full data
   * @returns {Array} Array of complete word data
   */
  getWords() {
    return Object.values(this.words).map(userWordData => {
      const dictionaryData = this.dictionary.lookup(userWordData.word);
      return {
        ...dictionaryData,
        ...userWordData
      };
    });
  }

  /**
   * Sort words by various criteria
   * @param {string} criteria - Sort criteria (alphabetical, dateAdded, lastReviewed, difficulty)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Array} Sorted array of words
   */
  sortBy(criteria, order = 'asc') {
    const words = this.getWords();
    
    const sortFunctions = {
      alphabetical: (a, b) => a.word.localeCompare(b.word),
      dateAdded: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
      lastReviewed: (a, b) => {
        // Put never-reviewed words at the end
        if (!a.lastReviewed && !b.lastReviewed) return 0;
        if (!a.lastReviewed) return 1;
        if (!b.lastReviewed) return -1;
        return new Date(a.lastReviewed) - new Date(b.lastReviewed);
      },
      difficulty: (a, b) => {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
    };
    
    if (criteria === 'lastReviewed') {
      // Special handling for lastReviewed to keep nulls at the end
      const reviewed = words.filter(w => w.lastReviewed);
      const notReviewed = words.filter(w => !w.lastReviewed);
      
      reviewed.sort((a, b) => {
        const comparison = new Date(a.lastReviewed) - new Date(b.lastReviewed);
        return order === 'desc' ? -comparison : comparison;
      });
      
      return [...reviewed, ...notReviewed];
    } else {
      const sortFn = sortFunctions[criteria] || sortFunctions.alphabetical;
      words.sort(sortFn);
      
      if (order === 'desc') {
        words.reverse();
      }
    }
    
    return words;
  }

  /**
   * Filter words by various criteria
   * @param {string} filterType - Filter type (difficulty, reviewStatus)
   * @param {string} filterValue - Filter value
   * @returns {Array} Filtered array of words
   */
  filterBy(filterType, filterValue) {
    const words = this.getWords();
    
    switch (filterType) {
      case 'difficulty':
        return words.filter(word => word.difficulty === filterValue);
        
      case 'reviewStatus':
        const now = new Date();
        switch (filterValue) {
          case 'due':
            return words.filter(word => 
              word.nextReview && new Date(word.nextReview) <= now
            );
          case 'new':
            return words.filter(word => !word.lastReviewed);
          case 'reviewed':
            return words.filter(word => word.lastReviewed);
          default:
            return words;
        }
        
      default:
        return words;
    }
  }

  /**
   * Search for words in the list
   * @param {string} query - Search query
   * @returns {Array} Array of matching words
   */
  search(query) {
    const normalizedQuery = query.toLowerCase();
    const words = this.getWords();
    
    return words.filter(word => {
      // Search in word text
      if (word.word.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Search in definitions
      if (word.definitions.some(def => 
        def.meaning.toLowerCase().includes(normalizedQuery) ||
        def.examples.some(ex => ex.toLowerCase().includes(normalizedQuery))
      )) {
        return true;
      }
      
      // Search in custom notes
      if (word.customNotes && word.customNotes.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get statistics about the vocabulary list
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const words = this.getWords();
    const now = new Date();
    
    const stats = {
      totalWords: words.length,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      totalReviews: 0,
      wordsReviewed: 0,
      wordsDue: 0
    };
    
    words.forEach(word => {
      // Count by difficulty
      stats.byDifficulty[word.difficulty]++;
      
      // Count reviews
      if (word.reviewHistory && word.reviewHistory.length > 0) {
        stats.totalReviews += word.reviewHistory.length;
        stats.wordsReviewed++;
      }
      
      // Count due words
      if (word.nextReview && new Date(word.nextReview) <= now) {
        stats.wordsDue++;
      }
    });
    
    return stats;
  }

  /**
   * Convert to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      created: this.created,
      isDefault: this.isDefault,
      words: this.words
    };
  }

  /**
   * Create from JSON
   * @param {Object} json - JSON data
   * @param {Object} dictionary - Dictionary instance
   * @returns {VocabularyList} New VocabularyList instance
   */
  static fromJSON(json, dictionary) {
    const list = new VocabularyList(json.name, dictionary, json.isDefault);
    list.id = json.id;
    list.created = json.created;
    list.words = json.words || {};
    return list;
  }
}

module.exports = VocabularyList;