class DictionaryService {
  constructor(dictionaryData, storageManager = null) {
    this.data = {};
    // Normalize all keys to lowercase for case-insensitive lookup
    Object.keys(dictionaryData).forEach(key => {
      this.data[key.toLowerCase()] = dictionaryData[key];
    });

    this.storageManager = storageManager;
    this.lookupStatistics = new Map();
  }

  /**
   * Load lookup statistics from storage
   */
  async loadLookupStatistics() {
    if (!this.storageManager) return;

    try {
      const stats = await this.storageManager.get('dictionary_lookup_stats');
      if (stats) {
        this.lookupStatistics = new Map(Object.entries(stats));
      }
    } catch (error) {
      console.error('Failed to load lookup statistics:', error);
    }
  }

  /**
   * Look up a word in the dictionary
   * @param {string} word - The word to look up
   * @returns {Promise<Object|null>} The word entry or null if not found
   */
  async lookup(word) {
    if (!word || typeof word !== 'string') {
      return null;
    }

    const normalizedWord = word.trim().toLowerCase();
    if (!normalizedWord) {
      return null;
    }

    const result = this.data[normalizedWord] || null;

    // Increment lookup count if word was found
    if (result) {
      await this.incrementLookupCount(normalizedWord);
    }

    return result;
  }

  /**
   * Increment lookup count for a word
   * @param {string} normalizedWord - The normalized word to increment
   */
  async incrementLookupCount(normalizedWord) {
    if (!this.storageManager) return;

    const current = this.lookupStatistics.get(normalizedWord) || {
      count: 0,
      firstLookup: null,
      lastLookup: null
    };

    const now = new Date().toISOString();

    current.count++;
    current.lastLookup = now;
    if (!current.firstLookup) {
      current.firstLookup = now;
    }

    this.lookupStatistics.set(normalizedWord, current);

    // Persist to storage
    try {
      await this.storageManager.set('dictionary_lookup_stats',
        Object.fromEntries(this.lookupStatistics)
      );
    } catch (error) {
      console.error('Failed to persist lookup statistics:', error);
    }
  }

  /**
   * Get dictionary data for a word without incrementing lookup statistics
   * Used internally for data retrieval without tracking
   * @param {string} word - The word to look up
   * @returns {Object|null} Word data or null if not found
   */
  getDictionaryData(word) {
    if (!word || typeof word !== 'string') {
      return null;
    }
    const normalizedWord = word.trim().toLowerCase();
    if (!normalizedWord) {
      return null;
    }
    return this.data[normalizedWord] || null;
  }

  /**
   * Get lookup count for a word
   * @param {string} word - The word to get count for
   * @returns {number} The lookup count (0 if never looked up)
   */
  getLookupCount(word) {
    if (!word || typeof word !== 'string') {
      return 0;
    }

    const normalizedWord = word.trim().toLowerCase();
    const stats = this.lookupStatistics.get(normalizedWord);
    return stats ? stats.count : 0;
  }

  /**
   * Find words with similar spelling using Levenshtein distance
   * @param {string} word - The word to match
   * @param {number} maxSuggestions - Maximum number of suggestions to return
   * @returns {Array} Array of suggested words
   */
  fuzzyMatch(word, maxSuggestions = 5) {
    if (!word || typeof word !== 'string') {
      return [];
    }

    const normalizedWord = word.trim().toLowerCase();
    if (!normalizedWord) {
      return [];
    }

    // Calculate Levenshtein distance
    const levenshtein = (a, b) => {
      const matrix = [];

      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            );
          }
        }
      }

      return matrix[b.length][a.length];
    };

    // Find words with low Levenshtein distance
    const suggestions = [];
    const maxDistance = Math.min(3, Math.floor(normalizedWord.length / 2));

    for (const dictWord in this.data) {
      const distance = levenshtein(normalizedWord, dictWord);
      if (distance > 0 && distance <= maxDistance) {
        suggestions.push({ word: dictWord, distance });
      }
    }

    // Sort by distance and return top suggestions
    return suggestions
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(s => s.word);
  }

  /**
   * Get all words in the dictionary
   * @returns {Array} Sorted array of all words
   */
  getAllWords() {
    return Object.keys(this.data).sort();
  }

  /**
   * Get words by part of speech
   * @param {string} partOfSpeech - The part of speech to filter by
   * @returns {Array} Array of words matching the part of speech
   */
  getWordsByPartOfSpeech(partOfSpeech) {
    if (!partOfSpeech || typeof partOfSpeech !== 'string') {
      return [];
    }

    const normalizedPos = partOfSpeech.toLowerCase();
    const results = [];

    for (const word in this.data) {
      const entry = this.data[word];
      const hasPartOfSpeech = entry.definitions.some(
        def => def.partOfSpeech && def.partOfSpeech.toLowerCase() === normalizedPos
      );
      if (hasPartOfSpeech) {
        results.push(word);
      }
    }

    return results.sort();
  }

  /**
   * Get a random word from the dictionary
   * @returns {Object} A random word entry
   */
  getRandomWord() {
    const words = Object.keys(this.data);
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    return this.data[randomWord];
  }

  /**
   * Search for words by definition content
   * @param {string} searchTerm - The term to search for in definitions
   * @returns {Array} Array of words containing the search term in their definitions
   */
  searchByDefinition(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    const normalizedTerm = searchTerm.toLowerCase();
    const results = [];

    for (const word in this.data) {
      const entry = this.data[word];
      const hasMatch = entry.definitions.some(def => {
        const meaning = def.meaning.toLowerCase();
        const examples = def.examples.join(' ').toLowerCase();
        return meaning.includes(normalizedTerm) || examples.includes(normalizedTerm);
      });

      if (hasMatch) {
        results.push(word);
      }
    }

    return results.sort();
  }
}

module.exports = DictionaryService;
