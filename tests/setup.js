// Create in-memory storage implementation
const inMemoryStorage = {};

// Load message handler and dependencies
const { handleMessage } = require('../src/background/message-handler');
const DictionaryService = require('../src/services/dictionary-service');
const StorageManager = require('../src/services/storage');
const dictionaryData = require('../src/data/dictionary.json');

const dictionary = new DictionaryService(dictionaryData, StorageManager);

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

// Function to setup browser mock
function setupBrowserMock() {
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
}

// Reset and re-setup before each test
beforeEach(() => {
  // Reset DictionaryService lookup statistics to prevent accumulation between tests
  dictionary.lookupStatistics.clear();

  // Always re-setup browser mock for complete isolation
  setupBrowserMock();
});

// Global cleanup after each test for complete isolation
afterEach(() => {
  // Complete DOM reset for jsdom tests
  if (typeof document !== 'undefined') {
    document.getElementsByTagName('html')[0].innerHTML = '';
  }

  // Reset all Jest modules for complete isolation
  jest.resetModules();

  // Clear storage and dictionary lookup statistics
  Object.keys(inMemoryStorage).forEach(key => delete inMemoryStorage[key]);
  dictionary.lookupStatistics.clear();
});
