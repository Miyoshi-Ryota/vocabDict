/**
 * Storage keys for browser.storage.local
 */
const StorageKeys = {
  LISTS: 'vocab_lists',
  SETTINGS: 'settings',
  SESSION: 'review_session',
  CACHE: 'lookup_cache'
};

/**
 * Message types for communication between components
 */
const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  CREATE_LIST: 'create_list',
  UPDATE_WORD: 'update_word',
  GET_REVIEW_QUEUE: 'get_review_queue',
  SUBMIT_REVIEW: 'submit_review'
};

/**
 * Difficulty levels for vocabulary words
 */
const DifficultyLevels = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

/**
 * Tab names for the extension popup
 */
const TabNames = {
  SEARCH: 'search',
  LISTS: 'lists',
  LEARN: 'learn',
  SETTINGS: 'settings'
};

module.exports = {
  StorageKeys,
  MessageTypes,
  DifficultyLevels,
  TabNames
};