const { StorageKeys, MessageTypes, DifficultyLevels, TabNames } = require('../../src/utils/constants');

describe('Constants', () => {
  describe('StorageKeys', () => {
    test('should have all required storage keys', () => {
      expect(StorageKeys.LISTS).toBe('vocab_lists');
      expect(StorageKeys.SETTINGS).toBe('settings');
      expect(StorageKeys.SESSION).toBe('review_session');
      expect(StorageKeys.CACHE).toBe('lookup_cache');
    });
  });

  describe('MessageTypes', () => {
    test('should have all required message types', () => {
      expect(MessageTypes.LOOKUP_WORD).toBe('lookup_word');
      expect(MessageTypes.ADD_TO_LIST).toBe('add_to_list');
      expect(MessageTypes.GET_LISTS).toBe('get_lists');
      expect(MessageTypes.CREATE_LIST).toBe('create_list');
      expect(MessageTypes.UPDATE_WORD).toBe('update_word');
      expect(MessageTypes.GET_REVIEW_QUEUE).toBe('get_review_queue');
      expect(MessageTypes.SUBMIT_REVIEW).toBe('submit_review');
    });
  });

  describe('DifficultyLevels', () => {
    test('should have all difficulty levels', () => {
      expect(DifficultyLevels.EASY).toBe('easy');
      expect(DifficultyLevels.MEDIUM).toBe('medium');
      expect(DifficultyLevels.HARD).toBe('hard');
    });
  });

  describe('TabNames', () => {
    test('should have all tab names', () => {
      expect(TabNames.SEARCH).toBe('search');
      expect(TabNames.LISTS).toBe('lists');
      expect(TabNames.LEARN).toBe('learn');
      expect(TabNames.SETTINGS).toBe('settings');
    });
  });
});