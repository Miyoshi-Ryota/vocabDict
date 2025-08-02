// Create in-memory storage implementation
const inMemoryStorage = {};

// Load message handler and dependencies
const { handleMessage } = require('../src/background/message-handler');
const DictionaryService = require('../src/services/dictionary-service');
const StorageManager = require('../src/services/storage');
const dictionaryData = require('../src/data/dictionary.json');

const dictionary = new DictionaryService(dictionaryData, StorageManager);

// Mock browser extension APIs for testing
global.browser = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: inMemoryStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (key in inMemoryStorage) {
              result[key] = inMemoryStorage[key];
            }
          });
          return Promise.resolve(result);
        }
        if (keys === null || keys === undefined) {
          return Promise.resolve({ ...inMemoryStorage });
        }
        return Promise.resolve({});
      }),
      set: jest.fn((items) => {
        Object.assign(inMemoryStorage, items);
        return Promise.resolve();
      }),
      remove: jest.fn((keys) => {
        if (typeof keys === 'string') {
          delete inMemoryStorage[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach(key => delete inMemoryStorage[key]);
        }
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(inMemoryStorage).forEach(key => delete inMemoryStorage[key]);
        return Promise.resolve();
      })
    }
  },
  runtime: {
    sendMessage: jest.fn((message) => {
      // Use real message handler with StorageManager
      const services = {
        dictionary,
        storage: StorageManager
      };

      return handleMessage(message, services);
    }),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  action: {
    openPopup: jest.fn()
  }
};

// Polyfill browser APIs that jsdom doesn't provide
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Clear storage
  Object.keys(inMemoryStorage).forEach(key => delete inMemoryStorage[key]);
});
