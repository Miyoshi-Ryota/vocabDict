/**
 * Minimal browser API mocks for testing
 * Only mocks what's necessary, not the entire implementation
 */

// Mock browser.runtime for message passing
const createRuntimeMock = () => {
    const messageListeners = [];
    const ports = new Map();
    
    return {
        id: 'test-extension-id',
        
        sendMessage: jest.fn((message) => {
            // Allow tests to define custom responses
            if (global.mockMessageResponses && global.mockMessageResponses[message.type]) {
                return Promise.resolve(global.mockMessageResponses[message.type](message));
            }
            return Promise.resolve({ status: 'success' });
        }),
        
        onMessage: {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: (callback) => {
                const index = messageListeners.indexOf(callback);
                if (index > -1) messageListeners.splice(index, 1);
            },
            // Test helper to trigger messages
            trigger: (message, sender = {}) => {
                const sendResponse = jest.fn();
                messageListeners.forEach(listener => {
                    const result = listener(message, sender, sendResponse);
                    if (result === true) {
                        // Async response expected
                        return sendResponse;
                    }
                });
                return sendResponse;
            }
        },
        
        connect: jest.fn((name) => {
            const port = {
                name,
                postMessage: jest.fn(),
                onMessage: {
                    addListener: jest.fn(),
                    removeListener: jest.fn()
                },
                onDisconnect: {
                    addListener: jest.fn(),
                    removeListener: jest.fn()
                },
                disconnect: jest.fn()
            };
            ports.set(name, port);
            return port;
        }),
        
        // Test helper
        _reset: () => {
            messageListeners.length = 0;
            ports.clear();
            global.mockMessageResponses = {};
        }
    };
};

// Mock browser.contextMenus
const createContextMenusMock = () => {
    const menuItems = new Map();
    
    return {
        create: jest.fn((createProperties) => {
            menuItems.set(createProperties.id, createProperties);
            return createProperties.id;
        }),
        
        update: jest.fn((id, updateProperties) => {
            if (menuItems.has(id)) {
                Object.assign(menuItems.get(id), updateProperties);
                return Promise.resolve();
            }
            return Promise.reject(new Error('Menu item not found'));
        }),
        
        remove: jest.fn((id) => {
            return Promise.resolve(menuItems.delete(id));
        }),
        
        removeAll: jest.fn(() => {
            menuItems.clear();
            return Promise.resolve();
        }),
        
        onClicked: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            // Test helper to trigger click
            trigger: (info, tab) => {
                const listeners = createContextMenusMock().onClicked.addListener.mock.calls;
                listeners.forEach(([listener]) => {
                    listener(info, tab);
                });
            }
        },
        
        // Test helper
        _getItems: () => menuItems,
        _reset: () => {
            menuItems.clear();
        }
    };
};

// Mock browser.tabs
const createTabsMock = () => {
    const tabs = new Map();
    let nextId = 1;
    
    return {
        sendMessage: jest.fn((tabId, message) => {
            if (!tabs.has(tabId)) {
                return Promise.reject(new Error('Tab not found'));
            }
            return Promise.resolve({ status: 'success' });
        }),
        
        query: jest.fn((queryInfo) => {
            const results = [];
            tabs.forEach(tab => {
                let matches = true;
                if (queryInfo.active !== undefined && tab.active !== queryInfo.active) matches = false;
                if (queryInfo.currentWindow !== undefined && tab.windowId !== 1) matches = false;
                if (matches) results.push(tab);
            });
            return Promise.resolve(results);
        }),
        
        create: jest.fn((createProperties) => {
            const tab = {
                id: nextId++,
                windowId: 1,
                active: createProperties.active || false,
                url: createProperties.url || 'about:blank',
                title: ''
            };
            tabs.set(tab.id, tab);
            return Promise.resolve(tab);
        }),
        
        // Test helper
        _addTab: (tab) => {
            const id = nextId++;
            const fullTab = { id, windowId: 1, active: false, ...tab };
            tabs.set(id, fullTab);
            return fullTab;
        },
        
        _reset: () => {
            tabs.clear();
            nextId = 1;
        }
    };
};

// Mock browser.storage
const createStorageMock = () => {
    const stores = {
        local: new Map(),
        sync: new Map()
    };
    
    const createArea = (storeName) => ({
        get: jest.fn((keys) => {
            const result = {};
            if (keys === null || keys === undefined) {
                // Get all
                stores[storeName].forEach((value, key) => {
                    result[key] = value;
                });
            } else if (typeof keys === 'string') {
                // Get single key
                if (stores[storeName].has(keys)) {
                    result[keys] = stores[storeName].get(keys);
                }
            } else if (Array.isArray(keys)) {
                // Get multiple keys
                keys.forEach(key => {
                    if (stores[storeName].has(key)) {
                        result[key] = stores[storeName].get(key);
                    }
                });
            }
            return Promise.resolve(result);
        }),
        
        set: jest.fn((items) => {
            Object.entries(items).forEach(([key, value]) => {
                stores[storeName].set(key, value);
            });
            return Promise.resolve();
        }),
        
        remove: jest.fn((keys) => {
            if (typeof keys === 'string') {
                stores[storeName].delete(keys);
            } else if (Array.isArray(keys)) {
                keys.forEach(key => stores[storeName].delete(key));
            }
            return Promise.resolve();
        }),
        
        clear: jest.fn(() => {
            stores[storeName].clear();
            return Promise.resolve();
        })
    });
    
    return {
        local: createArea('local'),
        sync: createArea('sync'),
        
        // Test helper
        _reset: () => {
            stores.local.clear();
            stores.sync.clear();
        }
    };
};

// Create and setup browser mock
const setupBrowserMock = () => {
    global.browser = {
        runtime: createRuntimeMock(),
        contextMenus: createContextMenusMock(),
        tabs: createTabsMock(),
        storage: createStorageMock()
    };
    
    // Also set chrome alias
    global.chrome = global.browser;
    
    return global.browser;
};

// Reset all mocks
const resetBrowserMocks = () => {
    if (global.browser) {
        global.browser.runtime._reset();
        global.browser.contextMenus._reset();
        global.browser.tabs._reset();
        global.browser.storage._reset();
    }
    global.mockMessageResponses = {};
};

// Helper to set up message responses for tests
const mockMessageResponse = (messageType, responseHandler) => {
    if (!global.mockMessageResponses) {
        global.mockMessageResponses = {};
    }
    global.mockMessageResponses[messageType] = responseHandler;
};

module.exports = {
    setupBrowserMock,
    resetBrowserMocks,
    mockMessageResponse
};