/**
 * Jest setup file for VocabDict Safari Extension tests
 * This file runs before each test suite
 */

// Import required polyfills and mocks
require('fake-indexeddb/auto');

// Mock WebExtension APIs
global.browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    onInstalled: {
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
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn()
  }
};

// Also provide chrome API for compatibility
global.chrome = global.browser;

// Mock IndexedDB if not already available
if (!global.indexedDB) {
  const FDBFactory = require('fake-indexeddb/lib/FDBFactory');
  global.indexedDB = new FDBFactory();
}

// Mock DOM APIs that might be used
const mockElement = {
  tagName: 'DIV',
  innerHTML: '',
  textContent: '',
  appendChild: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  }
};

global.document = {
  createElement: jest.fn((tag) => ({
    ...mockElement,
    tagName: tag.toUpperCase()
  })),
  getElementById: jest.fn(() => null),
  querySelector: jest.fn(() => null),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { href: 'http://localhost' },
  getSelection: jest.fn(() => ({
    toString: jest.fn(() => ''),
    getRangeAt: jest.fn(() => ({
      getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 100,
        right: 200,
        bottom: 120
      }))
    })),
    rangeCount: 0
  })),
  getComputedStyle: jest.fn(() => ({})),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Custom matchers
expect.extend({
  toBeValidVocabularyWord(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.word === 'string' &&
      Array.isArray(received.definitions) &&
      received.definitions.length > 0;

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
  },

  toBeValidUserSettings(received) {
    const pass = received &&
      typeof received.theme === 'string' &&
      typeof received.autoAdd === 'boolean';

    return {
      message: () => `expected ${received} to be valid user settings`,
      pass
    };
  }
});

// Global test utilities
global.testUtils = {
  // Create a mock vocabulary word
  createMockWord: (overrides = {}) => ({
    id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    word: 'test',
    definitions: [{
      partOfSpeech: 'noun',
      meaning: 'A test word',
      examples: ['This is a test.']
    }],
    difficulty: 1,
    reviewCount: 0,
    correctCount: 0,
    lastReviewed: null,
    nextReview: new Date(),
    interval: 1,
    easeFactor: 2.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Create a mock vocabulary list
  createMockList: (overrides = {}) => ({
    id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test List',
    wordIds: [],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Create mock user settings
  createMockSettings: (overrides = {}) => ({
    theme: 'light',
    autoAdd: true,
    defaultListId: null,
    reviewReminders: true,
    sessionSize: 20,
    ...overrides
  }),

  // Create mock learning stats
  createMockStats: (overrides = {}) => ({
    totalWords: 0,
    wordsReviewed: 0,
    correctAnswers: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageEaseFactor: 2.5,
    timeStudied: 0,
    lastStudyDate: null,
    ...overrides
  }),

  // Simulate message passing
  simulateMessage: async (type, payload = {}) => {
    const response = await new Promise((resolve) => {
      const mockResponse = { status: 'success', data: null };
      global.browser.runtime.sendMessage.mockResolvedValueOnce(mockResponse);
      resolve(mockResponse);
    });
    return response;
  },

  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clear all mocks
  clearAllMocks: () => {
    jest.clearAllMocks();
    global.browser.runtime.sendMessage.mockClear();
    global.browser.storage.local.get.mockClear();
    global.browser.storage.local.set.mockClear();
  }
};

// Reset mocks before each test
beforeEach(() => {
  global.testUtils.clearAllMocks();
  
  // Reset IndexedDB
  global.indexedDB = new (require('fake-indexeddb/lib/FDBFactory'))();
  
  // Reset DOM mocks
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});