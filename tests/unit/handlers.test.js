/**
 * Unit tests for VocabDict message handlers
 * Tests all message handler functions with various scenarios
 */

const { 
  MockVocabDictDatabase, 
  MockToyDictionary, 
  createMockHandlers,
  MockVocabularyWord,
  MockVocabularyList,
  MockUserSettings
} = require('../mocks/extensionMocks');

const { MESSAGE_TYPES, TestHelpers } = require('../fixtures/testData');

describe('Message Handlers', () => {
  let db;
  let handlers;

  beforeEach(async () => {
    db = new MockVocabDictDatabase();
    await db.initialize();
    handlers = createMockHandlers(db, MockToyDictionary);
  });

  afterEach(() => {
    if (db) {
      db.reset();
    }
    jest.clearAllMocks();
  });

  describe('Dictionary Handlers', () => {
    describe('handleLookupWord', () => {
      test('should return dictionary entry for valid word', async () => {
        const result = await handlers.handleLookupWord({ word: 'hello' });
        
        expect(result).toBeDefined();
        expect(result.word).toBe('hello');
        expect(result.pronunciations).toBeDefined();
        expect(result.definitions).toBeDefined();
        expect(Array.isArray(result.definitions)).toBe(true);
        expect(result.definitions.length).toBeGreaterThan(0);
      });

      test('should return null for unknown word', async () => {
        const result = await handlers.handleLookupWord({ word: 'unknownword' });
        expect(result).toBeNull();
      });

      test('should handle case insensitive lookup', async () => {
        const resultLower = await handlers.handleLookupWord({ word: 'hello' });
        const resultUpper = await handlers.handleLookupWord({ word: 'HELLO' });
        const resultMixed = await handlers.handleLookupWord({ word: 'Hello' });
        
        expect(resultLower).toEqual(resultUpper);
        expect(resultLower).toEqual(resultMixed);
      });

      test('should call handler with correct parameters', async () => {
        await handlers.handleLookupWord({ word: 'test' });
        
        expect(handlers.handleLookupWord).toHaveBeenCalledWith({ word: 'test' });
        expect(handlers.handleLookupWord).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Word Handlers', () => {
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

        const result = await handlers.handleAddWord({ word: wordData });
        
        expect(result).toBeInstanceOf(MockVocabularyWord);
        expect(result.word).toBe('test');
        expect(result.definitions).toEqual(wordData.definitions);
        expect(handlers.handleAddWord).toHaveBeenCalledWith({ word: wordData });
      });

      test('should generate ID for new word', async () => {
        const wordData = { word: 'generate' };
        const result = await handlers.handleAddWord({ word: wordData });
        
        expect(result.id).toBeDefined();
        expect(result.id).toMatch(/^word_\d+_[a-z0-9]+$/);
      });
    });

    describe('handleGetWord', () => {
      test('should retrieve existing word', async () => {
        const addedWord = await db.addWord({ word: 'retrieve' });
        const result = await handlers.handleGetWord({ wordId: addedWord.id });
        
        expect(result).toBeDefined();
        expect(result.id).toBe(addedWord.id);
        expect(result.word).toBe('retrieve');
      });

      test('should return null for non-existent word', async () => {
        const result = await handlers.handleGetWord({ wordId: 'nonexistent' });
        expect(result).toBeNull();
      });
    });

    describe('handleGetAllWords', () => {
      test('should return empty array initially', async () => {
        const result = await handlers.handleGetAllWords();
        
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
      });

      test('should return all words as JSON', async () => {
        await db.addWord({ word: 'word1' });
        await db.addWord({ word: 'word2' });
        
        const result = await handlers.handleGetAllWords();
        
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('word');
        expect(result[0]).toHaveProperty('definitions');
        // Should be JSON, not MockVocabularyWord instance
        expect(result[0]).not.toBeInstanceOf(MockVocabularyWord);
      });
    });

    describe('handleUpdateWord', () => {
      test('should update existing word', async () => {
        const addedWord = await db.addWord({ word: 'original' });
        const updateData = {
          id: addedWord.id,
          word: 'updated',
          difficulty: 3
        };

        const result = await handlers.handleUpdateWord({ word: updateData });
        
        expect(result.word).toBe('updated');
        expect(result.difficulty).toBe(3);
        expect(result.id).toBe(addedWord.id);
      });

      test('should throw error for non-existent word', async () => {
        const updateData = { id: 'nonexistent', word: 'test' };
        
        await expect(handlers.handleUpdateWord({ word: updateData }))
          .rejects.toThrow('Word not found');
      });
    });

    describe('handleDeleteWord', () => {
      test('should delete existing word', async () => {
        const addedWord = await db.addWord({ word: 'deleteme' });
        
        const result = await handlers.handleDeleteWord({ wordId: addedWord.id });
        expect(result).toBe(true);
        
        // Verify word is deleted
        const retrievedWord = await db.getWord(addedWord.id);
        expect(retrievedWord).toBeNull();
      });

      test('should return false for non-existent word', async () => {
        const result = await handlers.handleDeleteWord({ wordId: 'nonexistent' });
        expect(result).toBe(false);
      });
    });

    describe('handleGetWordsDueForReview', () => {
      test('should return words due for review as JSON', async () => {
        const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
        const futureDate = new Date(Date.now() + 86400000); // 1 day ahead
        
        await db.addWord({ word: 'due', nextReview: pastDate });
        await db.addWord({ word: 'notdue', nextReview: futureDate });
        
        const result = await handlers.handleGetWordsDueForReview();
        
        expect(result).toHaveLength(1);
        expect(result[0].word).toBe('due');
        expect(result[0]).not.toBeInstanceOf(MockVocabularyWord);
      });
    });
  });

  describe('List Handlers', () => {
    describe('handleAddList', () => {
      test('should add new list successfully', async () => {
        const listData = {
          name: 'Test List',
          wordIds: ['word1', 'word2']
        };

        const result = await handlers.handleAddList({ list: listData });
        
        expect(result).toBeInstanceOf(MockVocabularyList);
        expect(result.name).toBe('Test List');
        expect(result.wordIds).toEqual(['word1', 'word2']);
      });
    });

    describe('handleGetList', () => {
      test('should retrieve existing list', async () => {
        const addedList = await db.addList({ name: 'Retrieve Me' });
        const result = await handlers.handleGetList({ listId: addedList.id });
        
        expect(result).toBeDefined();
        expect(result.id).toBe(addedList.id);
        expect(result.name).toBe('Retrieve Me');
      });

      test('should return null for non-existent list', async () => {
        const result = await handlers.handleGetList({ listId: 'nonexistent' });
        expect(result).toBeNull();
      });
    });

    describe('handleGetAllLists', () => {
      test('should return default list initially', async () => {
        const result = await handlers.handleGetAllLists();
        
        expect(result).toHaveLength(1);
        expect(result[0].isDefault).toBe(true);
        expect(result[0].name).toBe('My Vocabulary');
      });

      test('should return all lists as JSON', async () => {
        await db.addList({ name: 'Custom List' });
        
        const result = await handlers.handleGetAllLists();
        
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).not.toBeInstanceOf(MockVocabularyList);
      });
    });

    describe('handleUpdateList', () => {
      test('should update existing list', async () => {
        const addedList = await db.addList({ name: 'Original' });
        const updateData = {
          id: addedList.id,
          name: 'Updated',
          wordIds: ['new_word']
        };

        const result = await handlers.handleUpdateList({ list: updateData });
        
        expect(result.name).toBe('Updated');
        expect(result.wordIds).toEqual(['new_word']);
      });
    });

    describe('handleDeleteList', () => {
      test('should delete non-default list', async () => {
        const addedList = await db.addList({ name: 'Delete Me' });
        
        const result = await handlers.handleDeleteList({ listId: addedList.id });
        expect(result).toBe(true);
      });

      test('should not delete default list', async () => {
        const defaultList = await db.getDefaultList();
        
        await expect(handlers.handleDeleteList({ listId: defaultList.id }))
          .rejects.toThrow('Cannot delete default list');
      });
    });

    describe('handleGetDefaultList', () => {
      test('should return default list', async () => {
        const result = await handlers.handleGetDefaultList();
        
        expect(result).toBeDefined();
        expect(result.isDefault).toBe(true);
        expect(result.name).toBe('My Vocabulary');
      });
    });

    describe('handleAddWordToList', () => {
      test('should add existing word to list', async () => {
        const word = await db.addWord({ word: 'test' });
        const list = await db.addList({ name: 'Test List' });

        const result = await handlers.handleAddWordToList({ 
          wordId: word.id, 
          listId: list.id 
        });
        
        expect(result).toBeDefined();
        expect(result.id).toBe(word.id);
        
        // Verify word was added to list
        const updatedList = await db.getList(list.id);
        expect(updatedList.containsWord(word.id)).toBe(true);
      });

      test('should create new word and add to list', async () => {
        const list = await db.addList({ name: 'Test List' });
        const wordData = {
          word: 'newword',
          definitions: [{ partOfSpeech: 'noun', meaning: 'test' }]
        };

        const result = await handlers.handleAddWordToList({ 
          wordData, 
          listId: list.id 
        });
        
        expect(result.word).toBe('newword');
        
        // Verify word was created and added to list
        const updatedList = await db.getList(list.id);
        expect(updatedList.containsWord(result.id)).toBe(true);
      });

      test('should add to default list when no listId provided', async () => {
        const word = await db.addWord({ word: 'test' });

        const result = await handlers.handleAddWordToList({ wordId: word.id });
        
        expect(result.id).toBe(word.id);
        
        // Verify word was added to default list
        const defaultList = await db.getDefaultList();
        expect(defaultList.containsWord(word.id)).toBe(true);
      });

      test('should throw error for non-existent word', async () => {
        await expect(handlers.handleAddWordToList({ wordId: 'nonexistent' }))
          .rejects.toThrow('Word with ID nonexistent not found');
      });

      test('should throw error for non-existent list', async () => {
        const word = await db.addWord({ word: 'test' });
        
        await expect(handlers.handleAddWordToList({ 
          wordId: word.id, 
          listId: 'nonexistent' 
        })).rejects.toThrow('List with ID nonexistent not found');
      });

      test('should throw error when no default list exists', async () => {
        // Remove default list by setting isDefault to false
        const defaultList = await db.getDefaultList();
        defaultList.isDefault = false;
        await db.updateList(defaultList);
        
        const word = await db.addWord({ word: 'test' });
        
        await expect(handlers.handleAddWordToList({ wordId: word.id }))
          .rejects.toThrow('No default list found');
      });
    });

    describe('handleRemoveWordFromList', () => {
      test('should remove word from list', async () => {
        const word = await db.addWord({ word: 'test' });
        const list = await db.addList({ name: 'Test List' });
        
        // Add word to list first
        list.addWord(word.id);
        await db.updateList(list);
        
        const result = await handlers.handleRemoveWordFromList({ 
          wordId: word.id, 
          listId: list.id 
        });
        
        expect(result.success).toBe(true);
        
        // Verify word was removed from list
        const updatedList = await db.getList(list.id);
        expect(updatedList.containsWord(word.id)).toBe(false);
      });

      test('should throw error for non-existent list', async () => {
        await expect(handlers.handleRemoveWordFromList({ 
          wordId: 'word1', 
          listId: 'nonexistent' 
        })).rejects.toThrow('List with ID nonexistent not found');
      });
    });
  });

  describe('Settings Handlers', () => {
    describe('handleGetSettings', () => {
      test('should return default settings as JSON', async () => {
        const result = await handlers.handleGetSettings();
        
        expect(result).toHaveProperty('theme');
        expect(result).toHaveProperty('autoAdd');
        expect(result).toHaveProperty('defaultListId');
        expect(result.theme).toBe('light');
        expect(result.autoAdd).toBe(true);
        expect(result).not.toBeInstanceOf(MockUserSettings);
      });
    });

    describe('handleUpdateSettings', () => {
      test('should update settings with UserSettings instance', async () => {
        const newSettings = new MockUserSettings({
          theme: 'dark',
          autoAdd: false
        });

        const result = await handlers.handleUpdateSettings({ settings: newSettings });
        
        expect(result.theme).toBe('dark');
        expect(result.autoAdd).toBe(false);
      });

      test('should update settings with plain object', async () => {
        const settingsData = {
          theme: 'dark',
          sessionSize: 10
        };

        const result = await handlers.handleUpdateSettings({ settings: settingsData });
        
        expect(result.theme).toBe('dark');
        expect(result.sessionSize).toBe(10);
        expect(result.autoAdd).toBe(true); // Should maintain default
      });
    });
  });

  describe('Stats Handlers', () => {
    describe('handleGetStats', () => {
      test('should return stats as JSON', async () => {
        const result = await handlers.handleGetStats();
        
        expect(result).toHaveProperty('totalWords');
        expect(result).toHaveProperty('wordsReviewed');
        expect(result).toHaveProperty('correctAnswers');
        expect(result).toHaveProperty('currentStreak');
        expect(result.totalWords).toBe(0);
        expect(result.wordsReviewed).toBe(0);
      });
    });

    describe('handleUpdateStats', () => {
      test('should update stats', async () => {
        const statsData = {
          totalWords: 50,
          wordsReviewed: 100,
          correctAnswers: 75
        };

        const result = await handlers.handleUpdateStats({ stats: statsData });
        
        expect(result.totalWords).toBe(50);
        expect(result.wordsReviewed).toBe(100);
        expect(result.correctAnswers).toBe(75);
      });
    });

    describe('handleUpdateReviewStats', () => {
      test('should update word and stats on correct answer', async () => {
        const word = await db.addWord({ word: 'review' });
        
        const result = await handlers.handleUpdateReviewStats({ 
          wordId: word.id, 
          correct: true 
        });
        
        expect(result.word).toBeDefined();
        expect(result.stats).toBeDefined();
        expect(result.word.reviewCount).toBe(1);
        expect(result.word.correctCount).toBe(1);
        expect(result.stats.wordsReviewed).toBe(1);
        expect(result.stats.correctAnswers).toBe(1);
        expect(result.stats.currentStreak).toBe(1);
      });

      test('should update word and stats on incorrect answer', async () => {
        const word = await db.addWord({ word: 'review' });
        
        const result = await handlers.handleUpdateReviewStats({ 
          wordId: word.id, 
          correct: false 
        });
        
        expect(result.word.reviewCount).toBe(1);
        expect(result.word.correctCount).toBe(0);
        expect(result.stats.wordsReviewed).toBe(1);
        expect(result.stats.correctAnswers).toBe(0);
        expect(result.stats.currentStreak).toBe(0);
      });

      test('should throw error for non-existent word', async () => {
        await expect(handlers.handleUpdateReviewStats({ 
          wordId: 'nonexistent', 
          correct: true 
        })).rejects.toThrow('Word with ID nonexistent not found');
      });
    });
  });

  describe('Handler Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Force a database error by making getAllWords throw
      const errorDb = new MockVocabDictDatabase();
      await errorDb.initialize();
      errorDb.getAllWords = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const errorHandlers = createMockHandlers(errorDb, MockToyDictionary);
      
      await expect(errorHandlers.handleGetAllWords())
        .rejects.toThrow('Database error');
    });

    test('should validate required parameters', async () => {
      // Test handlers that require specific parameters
      await expect(handlers.handleGetWord({}))
        .resolves.toBeNull(); // Should handle missing wordId gracefully
      
      await expect(handlers.handleGetList({}))
        .resolves.toBeNull(); // Should handle missing listId gracefully
    });
  });

  describe('Handler Integration', () => {
    test('should work together for complete workflow', async () => {
      // Create a word
      const wordData = {
        word: 'integration',
        definitions: [{ partOfSpeech: 'noun', meaning: 'combining parts' }]
      };
      const word = await handlers.handleAddWord({ word: wordData });
      
      // Create a list
      const listData = { name: 'Integration Test List' };
      const list = await handlers.handleAddList({ list: listData });
      
      // Add word to list
      await handlers.handleAddWordToList({ 
        wordId: word.id, 
        listId: list.id 
      });
      
      // Verify word is in list
      const retrievedList = await handlers.handleGetList({ listId: list.id });
      expect(retrievedList.wordIds).toContain(word.id);
      
      // Review the word
      const reviewResult = await handlers.handleUpdateReviewStats({ 
        wordId: word.id, 
        correct: true 
      });
      
      expect(reviewResult.word.reviewCount).toBe(1);
      expect(reviewResult.stats.wordsReviewed).toBe(1);
    });
  });
});