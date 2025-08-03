// Create in-memory storage implementation
const inMemoryStorage = {};

// Helper functions to create storage mock implementations
function createStorageMock() {
  return {
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
  };
}

function createBasicRuntimeMock() {
  return {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onConnect: {
      addListener: jest.fn()
    }
  };
}

function createContextMenusMock() {
  return {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  };
}

function createActionMock() {
  return {
    openPopup: jest.fn()
  };
}

// IMPORTANT: Initialize complete browser mock early before loading any modules
// background.js expects browser API to be available immediately when imported
global.browser = {
  storage: {
    local: createStorageMock()
  },
  runtime: createBasicRuntimeMock(),
  contextMenus: createContextMenusMock(),
  action: createActionMock()
};

// Load dependencies
const DictionaryService = require('../src/services/dictionary-service');
const StorageManager = require('../src/services/storage');
const dictionaryData = require('../src/data/dictionary.json');
const dictionary = new DictionaryService(dictionaryData, StorageManager);

// Load message handler and background modules
// These modules can now safely use browser API during initialization
const { handleMessage } = require('../src/background/message-handler');
const { handleContextMenuClick, contextMenuState } = require('../src/background/background');

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

// Function to setup browser mock with full functionality for testing
function setupBrowserMock() {
  global.browser = {
    storage: {
      local: createStorageMock()
    },
    runtime: {
      ...createBasicRuntimeMock(),
      sendMessage: jest.fn((message) => {
        // Use real message handler with StorageManager
        const services = {
          dictionary,
          storage: StorageManager,
          contextMenuState
        };

        return handleMessage(message, services);
      })
    },
    contextMenus: {
      ...createContextMenusMock(),
      simulateClick: async (info) => {
        await handleContextMenuClick(info, null);
      }
    },
    action: {
      openPopup: jest.fn(() => {
        // Simulate popup opening by triggering DOMContentLoaded
        // This mimics what happens when the browser opens the popup window
        setTimeout(() => {
          const event = new Event('DOMContentLoaded');
          document.dispatchEvent(event);
        }, 0);
      })
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
