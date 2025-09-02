const validators = require('../../src/generated/validators');

describe('Message Validators', () => {
  describe('validateRequest', () => {
    it('should validate valid lookupWord request', () => {
      const request = {
        action: 'lookupWord',
        word: 'test'
      };
      
      const result = validators.validateRequest('lookupWord', request);
      expect(result.valid).toBe(true);
    });
    
    it('should reject lookupWord request without word', () => {
      const request = {
        action: 'lookupWord'
      };
      
      const result = validators.validateRequest('lookupWord', request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('word');
    });
    
    it('should validate addWordToVocabularyList request', () => {
      const request = {
        action: 'addWordToVocabularyList',
        word: 'test',
        listId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: {
          difficulty: 100
        }
      };
      
      const result = validators.validateRequest('addWordToVocabularyList', request);
      expect(result.valid).toBe(true);
    });
    
    it('should reject addWordToVocabularyList with string difficulty', () => {
      const request = {
        action: 'addWordToVocabularyList',
        word: 'test',
        listId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: {
          difficulty: 'easy' // Should be integer
        }
      };
      
      const result = validators.validateRequest('addWordToVocabularyList', request);
      expect(result.valid).toBe(false);
    });
    
    it('should validate submitReview request with reviewResult field', () => {
      const request = {
        action: 'submitReview',
        listId: '123e4567-e89b-12d3-a456-426614174000',
        word: 'test',
        reviewResult: 'good',
        timeSpent: 10.5
      };
      
      const result = validators.validateRequest('submitReview', request);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateResponse', () => {
    it('should validate successful response', () => {
      const response = {
        success: true,
        data: {
          word: 'test',
          definitions: []
        }
      };
      
      const result = validators.validateResponse('lookupWord', response);
      expect(result.valid).toBe(true);
    });
    
    it('should validate error response', () => {
      const response = {
        success: false,
        error: 'Word not found'
      };
      
      const result = validators.validateResponse('lookupWord', response);
      expect(result.valid).toBe(true);
    });
    
    it('should reject response without success field', () => {
      const response = {
        data: {
          word: 'test'
        }
      };
      
      const result = validators.validateResponse('lookupWord', response);
      expect(result.valid).toBe(false);
    });
  });
});