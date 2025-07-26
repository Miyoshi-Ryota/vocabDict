// Create in-memory storage implementation
const inMemoryStorage = {};

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
    sendMessage: jest.fn(),
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

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});