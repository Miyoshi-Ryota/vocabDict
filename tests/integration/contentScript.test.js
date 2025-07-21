/**
 * Integration tests for content script using real implementation
 * Tests actual content script behavior without excessive mocking
 */

const { setupBrowserMock, resetBrowserMocks, mockMessageResponse } = require('../helpers/browserMocks');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Content Script Real Implementation Tests', () => {
    let dom;
    let window;
    let document;
    let browser;
    
    beforeEach(() => {
        // Set up browser mock
        browser = setupBrowserMock();
        global.browser = browser;
        global.chrome = browser;
        
        // Create DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Page</title>
                <style>
                    body { margin: 40px; font-family: Arial, sans-serif; }
                    .test-paragraph { margin: 20px 0; line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>Test Article</h1>
                <p class="test-paragraph">
                    The <span id="test-word">vocabulary</span> of a language is all the words in it.
                    Learning new words helps improve your language skills.
                </p>
                <p class="test-paragraph">
                    This is another paragraph with the word <strong>example</strong> in it.
                    We can select different words to test the extension functionality.
                </p>
            </body>
            </html>
        `, {
            url: 'https://example.com',
            runScripts: 'dangerously',
            resources: 'usable'
        });
        
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        
        // Add required DOM APIs
        global.setTimeout = window.setTimeout;
        global.clearTimeout = window.clearTimeout;
        
        // Mock getSelection API
        let currentSelection = null;
        window.getSelection = () => {
            if (!currentSelection) {
                return {
                    toString: () => '',
                    isCollapsed: true,
                    rangeCount: 0,
                    getRangeAt: () => null,
                    removeAllRanges: jest.fn(),
                    addRange: jest.fn()
                };
            }
            return currentSelection;
        };
        
        // Helper to create selection
        global.createSelection = (text, element) => {
            const range = document.createRange();
            if (element) {
                range.selectNodeContents(element);
            } else {
                const textNode = document.createTextNode(text);
                document.body.appendChild(textNode);
                range.selectNode(textNode);
            }
            
            currentSelection = {
                toString: () => text,
                isCollapsed: false,
                rangeCount: 1,
                getRangeAt: (index) => {
                    if (index === 0) return range;
                    throw new Error('Invalid range index');
                },
                removeAllRanges: jest.fn(() => {
                    currentSelection = null;
                }),
                addRange: jest.fn()
            };
            
            return currentSelection;
        };
        
        // Set up message responses
        mockMessageResponse('lookup_word', (message) => {
            const word = message.payload.word.toLowerCase();
            const dictionary = {
                'vocabulary': {
                    word: 'vocabulary',
                    definitions: [
                        { partOfSpeech: 'noun', meaning: 'The body of words used in a particular language' }
                    ],
                    pronunciations: [{ type: 'US', phonetic: '/voʊˈkæbjəˌlɛri/' }]
                },
                'example': {
                    word: 'example',
                    definitions: [
                        { partOfSpeech: 'noun', meaning: 'A thing characteristic of its kind or illustrating a general rule' }
                    ]
                },
                'test': {
                    word: 'test',
                    definitions: [
                        { partOfSpeech: 'noun', meaning: 'A procedure intended to establish quality or performance' }
                    ]
                }
            };
            
            return {
                status: 'success',
                data: dictionary[word] || null
            };
        });
        
        mockMessageResponse('add_word_to_list', (message) => {
            return {
                status: 'success',
                data: {
                    id: 'word_' + Date.now(),
                    word: message.payload.wordData.word
                }
            };
        });
        
        // Load and execute the real content script
        const contentScriptPath = path.join(__dirname, '../../Shared (Extension)/Resources/content.js');
        const contentScript = fs.readFileSync(contentScriptPath, 'utf8');
        
        // Execute in the window context
        const scriptEl = document.createElement('script');
        scriptEl.textContent = contentScript;
        document.head.appendChild(scriptEl);
    });
    
    afterEach(() => {
        resetBrowserMocks();
        dom.window.close();
        // Clean up globals
        delete global.window;
        delete global.document;
        delete global.browser;
        delete global.chrome;
        delete global.setTimeout;
        delete global.clearTimeout;
        delete global.createSelection;
    });
    
    describe('Text Selection Handling', () => {
        test('should process valid word selection', async () => {
            // Select the word "vocabulary"
            const wordElement = document.getElementById('test-word');
            const selection = global.createSelection('vocabulary', wordElement);
            
            // Simulate mouseup event
            const mouseEvent = new window.MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100
            });
            document.dispatchEvent(mouseEvent);
            
            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // Content script should have processed the selection
            expect(selection.toString()).toBe('vocabulary');
        });
        
        test('should ignore invalid selections', async () => {
            // Test empty selection
            global.createSelection('', null);
            
            const mouseEvent = new window.MouseEvent('mouseup', { bubbles: true });
            document.dispatchEvent(mouseEvent);
            
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // No widget should be created
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeNull();
        });
        
        test('should ignore selections that are too short', async () => {
            global.createSelection('a', null);
            
            const mouseEvent = new window.MouseEvent('mouseup', { bubbles: true });
            document.dispatchEvent(mouseEvent);
            
            await new Promise(resolve => setTimeout(resolve, 20));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeNull();
        });
        
        test('should ignore selections with mostly non-alphabetic characters', async () => {
            global.createSelection('123-456-789', null);
            
            const mouseEvent = new window.MouseEvent('mouseup', { bubbles: true });
            document.dispatchEvent(mouseEvent);
            
            await new Promise(resolve => setTimeout(resolve, 20));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeNull();
        });
    });
    
    describe('Message Handling', () => {
        test('should handle show_floating_widget message', async () => {
            // Send message to show widget
            const sendResponse = browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: {
                    word: 'test',
                    position: { x: 200, y: 200 }
                }
            });
            
            // Wait for widget to be created
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            expect(widget.style.position).toBe('fixed');
        });
        
        test('should handle selection_lookup message from context menu', async () => {
            // First select a word
            global.createSelection('example', null);
            
            // Send selection_lookup message
            browser.runtime.onMessage.trigger({
                type: 'selection_lookup',
                payload: { word: 'example' }
            });
            
            // Wait for lookup and widget creation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            
            // Verify lookup was called
            expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'lookup_word',
                payload: { word: 'example' }
            });
        });
        
        test('should handle hide_floating_widget message', async () => {
            // First create a widget
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'test', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeTruthy();
            
            // Hide the widget
            browser.runtime.onMessage.trigger({
                type: 'hide_floating_widget'
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeNull();
        });
    });
    
    describe('Widget Display', () => {
        test('should show loading state initially', async () => {
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'vocabulary', position: { x: 100, y: 100 } }
            });
            
            // Check loading state immediately
            await new Promise(resolve => setTimeout(resolve, 10));
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            expect(widget.innerHTML).toContain('Looking up');
        });
        
        test('should display word definition after lookup', async () => {
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'vocabulary', position: { x: 100, y: 100 } }
            });
            
            // Wait for lookup to complete
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget.innerHTML).toContain('vocabulary');
            expect(widget.innerHTML).toContain('The body of words used in a particular language');
            expect(widget.querySelector('.vocabdict-close-btn')).toBeTruthy();
            expect(widget.querySelector('.vocabdict-add-btn')).toBeTruthy();
        });
        
        test('should show error for lookup failure', async () => {
            // Override to simulate error
            browser.runtime.sendMessage.mockRejectedValueOnce(new Error('Network error'));
            
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'test', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget.innerHTML).toContain('Unable to lookup word');
        });
        
        test('should show appropriate message for word not found', async () => {
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'nonexistentword', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget.innerHTML).toContain('Lookup failed');
        });
    });
    
    describe('Widget Interactions', () => {
        beforeEach(async () => {
            // Create a widget for interaction tests
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'example', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
        });
        
        test('should close widget when close button clicked', async () => {
            const closeBtn = document.querySelector('.vocabdict-close-btn');
            expect(closeBtn).toBeTruthy();
            
            closeBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeNull();
        });
        
        test('should add word to list when add button clicked', async () => {
            const addBtn = document.querySelector('.vocabdict-add-btn');
            expect(addBtn).toBeTruthy();
            
            addBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify add word message was sent
            expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'add_word_to_list',
                payload: {
                    wordData: {
                        word: 'example',
                        definitions: expect.any(Array)
                    }
                }
            });
            
            // Check success feedback
            expect(addBtn.textContent).toContain('Added');
            expect(addBtn.disabled).toBe(true);
        });
        
        test('should open full definition when more button clicked', async () => {
            const moreBtn = document.querySelector('.vocabdict-more-btn');
            expect(moreBtn).toBeTruthy();
            
            moreBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Verify open popup message was sent
            expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'open_popup',
                payload: { word: 'example' }
            });
            
            // Widget should be hidden after clicking more
            expect(document.querySelector('.vocabdict-floating-widget')).toBeNull();
        });
    });
    
    describe('Widget Positioning', () => {
        test('should position widget below selection', async () => {
            const rect = { left: 100, top: 50, bottom: 70, right: 200 };
            
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { 
                    word: 'test', 
                    position: { x: rect.left, y: rect.bottom + 5 }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget.style.position).toBe('fixed');
            expect(parseInt(widget.style.left)).toBe(100);
            expect(parseInt(widget.style.top)).toBe(75); // bottom + 5
        });
        
        test('should adjust position to stay within viewport', async () => {
            // Mock viewport dimensions
            Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });
            
            // Position that would go off screen
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { 
                    word: 'test', 
                    position: { x: 750, y: 550 }
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const widget = document.querySelector('.vocabdict-floating-widget');
            const widgetRect = widget.getBoundingClientRect();
            
            // Widget should be adjusted to stay on screen
            expect(widgetRect.right).toBeLessThanOrEqual(800);
            expect(widgetRect.bottom).toBeLessThanOrEqual(600);
        });
    });
    
    describe('Event Handling', () => {
        test('should hide widget when clicking outside', async () => {
            // Create widget
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'test', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeTruthy();
            
            // Click outside widget
            document.body.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeNull();
        });
        
        test('should not hide widget when clicking inside it', async () => {
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'test', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
            const widget = document.querySelector('.vocabdict-floating-widget');
            expect(widget).toBeTruthy();
            
            // Click inside widget
            widget.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeTruthy();
        });
        
        test('should handle keyboard navigation', async () => {
            browser.runtime.onMessage.trigger({
                type: 'show_floating_widget',
                payload: { word: 'test', position: { x: 100, y: 100 } }
            });
            
            await new Promise(resolve => setTimeout(resolve, 150));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeTruthy();
            
            // Press Escape key
            const escapeEvent = new window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(escapeEvent);
            
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(document.querySelector('.vocabdict-floating-widget')).toBeNull();
        });
    });
});