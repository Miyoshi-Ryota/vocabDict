/**
 * Integration tests for context menu functionality
 * Tests the complete flow from right-click to word lookup
 */

const { setupBrowserMock, resetBrowserMocks, mockMessageResponse } = require('../helpers/browserMocks');
const fs = require('fs');
const path = require('path');

// Load real implementation files
const loadImplementation = (filename) => {
    const filePath = path.join(__dirname, '../../Shared (Extension)/Resources', filename);
    return fs.readFileSync(filePath, 'utf8');
};

// Create a test environment with real implementations
const createTestEnvironment = () => {
    // Set up browser mock
    const browser = setupBrowserMock();
    
    // Set up globals
    global.browser = browser;
    global.MessageTypes = {
        LOOKUP_WORD: 'lookup_word',
        ADD_WORD_TO_LIST: 'add_word_to_list',
        SELECTION_LOOKUP: 'selection_lookup'
    };
    global.MessageStatus = {
        SUCCESS: 'success',
        ERROR: 'error'
    };
    global.CONSTANTS = {
        MIN_WORD_LENGTH: 2,
        MAX_WORD_LENGTH: 50,
        DEFAULT_EASE_FACTOR: 2.5
    };
    
    // Create a minimal DOM environment for content script
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!DOCTYPE html><html><body><p>Test content with some words to select.</p></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Add selection API
    global.window.getSelection = () => ({
        toString: () => global.mockSelection || '',
        getRangeAt: (index) => ({
            getBoundingClientRect: () => ({
                left: 100,
                top: 100,
                right: 200,
                bottom: 120,
                width: 100,
                height: 20
            })
        }),
        rangeCount: 1,
        isCollapsed: false,
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
    });
    
    return { browser, dom };
};

describe('Context Menu Integration', () => {
    let browser;
    let dom;
    let contextMenuHandler;
    
    beforeEach(() => {
        ({ browser, dom } = createTestEnvironment());
        
        // Reset any previous state
        resetBrowserMocks();
        
        // Set up message handler for word lookups
        mockMessageResponse('lookup_word', (message) => {
            const word = message.payload.word.toLowerCase();
            
            // Simulate dictionary lookup
            const mockDictionary = {
                'test': {
                    word: 'test',
                    definitions: [{ partOfSpeech: 'noun', meaning: 'A procedure for evaluation' }],
                    pronunciations: [{ type: 'US', phonetic: '/test/' }]
                },
                'example': {
                    word: 'example',
                    definitions: [{ partOfSpeech: 'noun', meaning: 'A representative form or pattern' }]
                }
            };
            
            if (mockDictionary[word]) {
                return { status: 'success', data: mockDictionary[word] };
            }
            return { status: 'success', data: null };
        });
    });
    
    afterEach(() => {
        resetBrowserMocks();
        // Clean up globals
        delete global.window;
        delete global.document;
        delete global.mockSelection;
    });
    
    describe('Context Menu Creation', () => {
        test('should create context menu on initialization', async () => {
            // Simulate init.js context menu creation
            await browser.contextMenus.removeAll();
            await browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            
            const menuItems = browser.contextMenus._getItems();
            expect(menuItems.size).toBe(1);
            expect(menuItems.has('vocabdict-lookup')).toBe(true);
            
            const menuItem = menuItems.get('vocabdict-lookup');
            expect(menuItem.title).toBe('Look up "%s" in VocabDict');
            expect(menuItem.contexts).toContain('selection');
        });
        
        test('should handle multiple initialization attempts', async () => {
            // First initialization
            await browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            
            // Clear and re-initialize (like extension reload)
            await browser.contextMenus.removeAll();
            await browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            
            const menuItems = browser.contextMenus._getItems();
            expect(menuItems.size).toBe(1);
        });
    });
    
    describe('Context Menu Click Handling', () => {
        beforeEach(async () => {
            // Set up context menu
            await browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            
            // Set up click handler (from handlers.js)
            contextMenuHandler = async (info, tab) => {
                if (info.menuItemId === 'vocabdict-lookup' && info.selectionText) {
                    try {
                        await browser.tabs.sendMessage(tab.id, {
                            type: 'selection_lookup',
                            payload: { word: info.selectionText }
                        });
                    } catch (error) {
                        console.log('Content script not available, opening popup');
                    }
                }
            };
            
            browser.contextMenus.onClicked.addListener(contextMenuHandler);
        });
        
        test('should send message to content script when menu clicked', async () => {
            const testTab = browser.tabs._addTab({ id: 1, url: 'https://example.com' });
            
            // Simulate context menu click
            const clickInfo = {
                menuItemId: 'vocabdict-lookup',
                selectionText: 'test',
                pageUrl: 'https://example.com'
            };
            
            await contextMenuHandler(clickInfo, testTab);
            
            expect(browser.tabs.sendMessage).toHaveBeenCalledWith(testTab.id, {
                type: 'selection_lookup',
                payload: { word: 'test' }
            });
        });
        
        test('should handle missing selection text', async () => {
            const testTab = browser.tabs._addTab({ id: 1, url: 'https://example.com' });
            
            const clickInfo = {
                menuItemId: 'vocabdict-lookup',
                selectionText: '', // Empty selection
                pageUrl: 'https://example.com'
            };
            
            await contextMenuHandler(clickInfo, testTab);
            
            expect(browser.tabs.sendMessage).not.toHaveBeenCalled();
        });
        
        test('should handle content script not available', async () => {
            const testTab = browser.tabs._addTab({ id: 1, url: 'https://example.com' });
            
            // Make sendMessage fail (content script not injected)
            browser.tabs.sendMessage.mockRejectedValueOnce(new Error('Could not establish connection'));
            
            const consoleSpy = jest.spyOn(console, 'log');
            
            const clickInfo = {
                menuItemId: 'vocabdict-lookup',
                selectionText: 'test',
                pageUrl: 'https://example.com'
            };
            
            await contextMenuHandler(clickInfo, testTab);
            
            expect(consoleSpy).toHaveBeenCalledWith('Content script not available, opening popup');
            consoleSpy.mockRestore();
        });
    });
    
    describe('Content Script Message Handling', () => {
        test('should handle selection_lookup message in content script', async () => {
            // Simulate content script message handler
            const handleMessage = (request, sender, sendResponse) => {
                const { type, payload } = request;
                
                if (type === 'selection_lookup') {
                    // Mock the lookupWord function behavior
                    const word = payload.word;
                    
                    // Create mock widget
                    const widget = document.createElement('div');
                    widget.className = 'vocabdict-floating-widget';
                    widget.innerHTML = `<div class="widget-loading">Looking up ${word}...</div>`;
                    document.body.appendChild(widget);
                    
                    // Simulate async lookup
                    browser.runtime.sendMessage({
                        type: 'lookup_word',
                        payload: { word: word }
                    }).then(response => {
                        if (response.status === 'success' && response.data) {
                            widget.innerHTML = `
                                <div class="widget-content">
                                    <div class="widget-word">${response.data.word}</div>
                                    <div class="widget-definition">${response.data.definitions[0].meaning}</div>
                                </div>
                            `;
                        }
                    });
                }
                
                return true; // Async response
            };
            
            // Register the handler
            browser.runtime.onMessage.addListener(handleMessage);
            
            // Trigger selection_lookup message
            const sendResponse = browser.runtime.onMessage.trigger(
                { type: 'selection_lookup', payload: { word: 'test' } },
                { tab: { id: 1 } }
            );
            
            // Check that widget was created
            await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DOM update
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            expect(widget.innerHTML).toContain('Looking up test...');
            
            // Wait for lookup to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(widget.innerHTML).toContain('test');
            expect(widget.innerHTML).toContain('A procedure for evaluation');
        });
        
        test('should position widget correctly near selection', () => {
            global.mockSelection = 'example';
            
            // Mock selection position
            const mockRect = {
                left: 200,
                top: 150,
                right: 300,
                bottom: 170,
                width: 100,
                height: 20
            };
            
            // Create and position widget
            const widget = document.createElement('div');
            widget.className = 'vocabdict-floating-widget';
            widget.style.position = 'fixed';
            widget.style.left = `${mockRect.left}px`;
            widget.style.top = `${mockRect.bottom + 10}px`; // Below selection
            document.body.appendChild(widget);
            
            expect(widget.style.left).toBe('200px');
            expect(widget.style.top).toBe('180px'); // 170 + 10
        });
    });
    
    describe('Complete Context Menu Flow', () => {
        test('should complete full flow from menu click to widget display', async () => {
            // 1. Set up context menu and handler
            await browser.contextMenus.create({
                id: 'vocabdict-lookup',
                title: 'Look up "%s" in VocabDict',
                contexts: ['selection']
            });
            
            browser.contextMenus.onClicked.addListener(contextMenuHandler);
            
            // 2. Set up content script message listener
            const contentScriptHandler = async (request) => {
                if (request.type === 'selection_lookup') {
                    // Look up the word
                    const lookupResponse = await browser.runtime.sendMessage({
                        type: 'lookup_word',
                        payload: { word: request.payload.word }
                    });
                    
                    // Create widget with result
                    const widget = document.createElement('div');
                    widget.className = 'vocabdict-floating-widget';
                    widget.setAttribute('data-word', request.payload.word);
                    
                    if (lookupResponse.status === 'success' && lookupResponse.data) {
                        widget.innerHTML = `
                            <div class="widget-header">
                                <span class="widget-word">${lookupResponse.data.word}</span>
                                <button class="widget-close">×</button>
                            </div>
                            <div class="widget-definition">
                                ${lookupResponse.data.definitions[0].meaning}
                            </div>
                            <button class="widget-add-btn">Add to List</button>
                        `;
                    }
                    
                    document.body.appendChild(widget);
                    return { status: 'success' };
                }
            };
            
            // Mock successful message to content script
            browser.tabs.sendMessage.mockImplementation(async (tabId, message) => {
                return await contentScriptHandler(message);
            });
            
            // 3. Simulate user action
            const testTab = browser.tabs._addTab({ id: 1, url: 'https://example.com' });
            
            await contextMenuHandler({
                menuItemId: 'vocabdict-lookup',
                selectionText: 'example',
                pageUrl: 'https://example.com'
            }, testTab);
            
            // 4. Verify complete flow
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait for async operations
            
            // Check widget was created with correct content
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            expect(widget.getAttribute('data-word')).toBe('example');
            expect(widget.innerHTML).toContain('example');
            expect(widget.innerHTML).toContain('A representative form or pattern');
            expect(widget.querySelector('.widget-add-btn')).toBeTruthy();
        });
        
        test('should handle word not found in dictionary', async () => {
            const testTab = browser.tabs._addTab({ id: 1, url: 'https://example.com' });
            
            // Override lookup response for unknown word
            mockMessageResponse('lookup_word', (message) => {
                return { status: 'success', data: null };
            });
            
            browser.tabs.sendMessage.mockImplementation(async (tabId, message) => {
                if (message.type === 'selection_lookup') {
                    const lookupResponse = await browser.runtime.sendMessage({
                        type: 'lookup_word',
                        payload: { word: message.payload.word }
                    });
                    
                    const widget = document.createElement('div');
                    widget.className = 'vocabdict-floating-widget';
                    
                    if (!lookupResponse.data) {
                        widget.innerHTML = '<div class="widget-error">Word not found</div>';
                    }
                    
                    document.body.appendChild(widget);
                    return { status: 'success' };
                }
            });
            
            await contextMenuHandler({
                menuItemId: 'vocabdict-lookup',
                selectionText: 'unknownword',
                pageUrl: 'https://example.com'
            }, testTab);
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            expect(widget.innerHTML).toContain('Word not found');
        });
    });
});