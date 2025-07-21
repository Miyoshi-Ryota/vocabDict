/**
 * Simplified Jest setup for VocabDict Safari Extension
 * Focused on real implementation testing with minimal mocking
 */

// Set up fake IndexedDB for all tests
require('fake-indexeddb/auto');
const FDBFactory = require('fake-indexeddb/lib/FDBFactory');

// Add TextEncoder/TextDecoder for JSDOM compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Reset IndexedDB for each test
beforeEach(() => {
  global.indexedDB = new FDBFactory();
});

// Minimal browser API mocks - only mock what we absolutely need for testing
global.browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  }
};

// Chrome compatibility
global.chrome = global.browser;

// Custom matchers for vocabulary objects
expect.extend({
  toBeValidVocabularyWord(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.word === 'string' &&
      Array.isArray(received.definitions);

    return {
      message: () => `expected ${received} to be a valid vocabulary word`,
      pass
    };
  },

  toBeValidVocabularyList(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      Array.isArray(received.wordIds);

    return {
      message: () => `expected ${received} to be a valid vocabulary list`,
      pass
    };
  }
});

// Test utilities for common operations
global.TestHelpers = {
  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create test data
  createTestWord: (overrides = {}) => ({
    word: 'test',
    definitions: [{
      partOfSpeech: 'noun',
      meaning: 'A test word',
      examples: []
    }],
    ...overrides
  }),
  
  createTestList: (overrides = {}) => ({
    name: 'Test List',
    description: 'A test list',
    ...overrides
  })
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', promise, 'reason:', reason);
});