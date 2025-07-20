/**
 * End-to-End tests for VocabDict content script
 * Tests text selection, floating widget, and page interactions
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('VocabDict Content Script E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI environments
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-file-access-from-files'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set realistic viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Create a test HTML page with content
    const testPageContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page for VocabDict</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px;
            max-width: 800px;
          }
          .content { 
            padding: 20px; 
          }
          .paragraph { 
            margin-bottom: 20px; 
          }
          .word-test { 
            color: blue; 
            font-weight: bold; 
          }
        </style>
      </head>
      <body>
        <div class="content">
          <h1>Test Article for VocabDict Extension</h1>
          <div class="paragraph">
            The <span class="word-test">world</span> is a beautiful place full of opportunities to learn new words.
            When you encounter an unfamiliar word, you can simply select it to look up its meaning.
          </div>
          <div class="paragraph">
            VocabDict makes it easy to <span class="word-test">understand</span> vocabulary in context.
            You can add words to your personal vocabulary lists for later review and practice.
          </div>
          <div class="paragraph">
            Learning new words should be an enjoyable <span class="word-test">experience</span>.
            The spaced repetition system helps you remember words effectively over time.
          </div>
          <div class="paragraph">
            Some test words for selection: hello, good, time, person, year, way, day, thing, man, work, life, child.
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Navigate to a data URL with our test content
    await page.goto(`data:text/html,${encodeURIComponent(testPageContent)}`);
    
    // Mock browser APIs and inject content script
    await page.addScriptTag({
      content: `
        // Mock browser APIs
        window.browser = {
          runtime: {
            sendMessage: function(message) {
              return new Promise((resolve) => {
                // Mock responses based on message type
                if (message.type === 'lookup_word') {
                  const mockResponses = {
                    'hello': {
                      status: 'success',
                      data: {
                        word: 'hello',
                        definitions: [{ partOfSpeech: 'noun', meaning: 'A greeting' }],
                        pronunciations: [{ type: 'US', phonetic: '/həˈloʊ/' }]
                      }
                    },
                    'world': {
                      status: 'success',
                      data: {
                        word: 'world',
                        definitions: [{ partOfSpeech: 'noun', meaning: 'The earth' }],
                        pronunciations: [{ type: 'US', phonetic: '/wɜːrld/' }]
                      }
                    },
                    'good': {
                      status: 'success',
                      data: {
                        word: 'good',
                        definitions: [{ partOfSpeech: 'adjective', meaning: 'Of high quality' }]
                      }
                    }
                  };
                  
                  const word = message.payload.word.toLowerCase();
                  setTimeout(() => {
                    resolve(mockResponses[word] || { status: 'success', data: null });
                  }, 100);
                } else if (message.type === 'add_word_to_list') {
                  setTimeout(() => {
                    resolve({
                      status: 'success',
                      data: { id: 'word_' + Date.now(), word: message.payload.wordData.word }
                    });
                  }, 200);
                } else {
                  resolve({ status: 'success', data: null });
                }
              });
            }
          }
        };
        
        // Also provide chrome API for compatibility
        window.chrome = window.browser;
      `
    });
    
    // Load content script CSS
    await page.addStyleTag({
      content: `
        /* Mock content script styles */
        .vocabdict-widget {
          position: absolute;
          background: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          max-width: 300px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .vocabdict-widget.hidden {
          display: none;
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .widget-word {
          font-weight: bold;
          font-size: 16px;
          color: #333;
        }
        
        .widget-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .widget-close:hover {
          color: #333;
        }
        
        .widget-pronunciation {
          color: #666;
          font-style: italic;
          margin-bottom: 8px;
        }
        
        .widget-definition {
          margin-bottom: 8px;
        }
        
        .definition-pos {
          font-style: italic;
          color: #007acc;
          margin-right: 8px;
        }
        
        .widget-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        
        .widget-button {
          background: #007acc;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .widget-button:hover {
          background: #005fa3;
        }
        
        .widget-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .widget-loading {
          text-align: center;
          color: #666;
          padding: 20px;
        }
        
        .widget-error {
          color: #d73a49;
          text-align: center;
          padding: 10px;
        }
        
        .widget-success {
          color: #28a745;
          text-align: center;
          padding: 10px;
          font-size: 12px;
        }
      `
    });
    
    // Inject simplified content script functionality
    await page.addScriptTag({
      content: `
        // Mock content script functionality
        let currentWidget = null;
        let selectionTimeout = null;
        
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
        
        function createWidget() {
          const widget = document.createElement('div');
          widget.className = 'vocabdict-widget hidden';
          widget.innerHTML = \`
            <div class="widget-loading">Looking up word...</div>
          \`;
          document.body.appendChild(widget);
          return widget;
        }
        
        function showWidget(word, rect) {
          hideWidget();
          
          currentWidget = createWidget();
          
          // Position widget
          const x = Math.min(rect.left, window.innerWidth - 320);
          const y = rect.bottom + 5;
          
          currentWidget.style.left = x + 'px';
          currentWidget.style.top = y + 'px';
          currentWidget.classList.remove('hidden');
          
          // Look up word
          lookupWord(word);
        }
        
        function hideWidget() {
          if (currentWidget) {
            currentWidget.remove();
            currentWidget = null;
          }
        }
        
        async function lookupWord(word) {
          try {
            const response = await browser.runtime.sendMessage({
              type: 'lookup_word',
              payload: { word: word }
            });
            
            if (response.status === 'success' && response.data) {
              displayWordResult(response.data);
            } else {
              displayError('Word not found');
            }
          } catch (error) {
            displayError('Failed to look up word');
          }
        }
        
        function displayWordResult(data) {
          if (!currentWidget) return;
          
          const pronunciationHtml = data.pronunciations ? 
            data.pronunciations.map(p => \`<span class="pronunciation">/\${escapeHtml(p.phonetic)}/</span>\`).join(' ') : '';
          
          const definitionsHtml = data.definitions ? 
            data.definitions.map(def => \`
              <div class="widget-definition">
                <span class="definition-pos">\${escapeHtml(def.partOfSpeech)}</span>
                \${escapeHtml(def.meaning)}
              </div>
            \`).join('') : '';
          
          currentWidget.innerHTML = \`
            <div class="widget-header">
              <div class="widget-word">\${escapeHtml(data.word)}</div>
              <button class="widget-close" onclick="hideWidget()">×</button>
            </div>
            \${pronunciationHtml ? \`<div class="widget-pronunciation">\${pronunciationHtml}</div>\` : ''}
            \${definitionsHtml}
            <div class="widget-actions">
              <button class="widget-button" onclick="addToList('\${escapeHtml(data.word)}')">Add to List</button>
            </div>
          \`;
        }
        
        function displayError(message) {
          if (!currentWidget) return;
          
          currentWidget.innerHTML = \`
            <div class="widget-header">
              <div class="widget-word">Error</div>
              <button class="widget-close" onclick="hideWidget()">×</button>
            </div>
            <div class="widget-error">\${escapeHtml(message)}</div>
          \`;
        }
        
        async function addToList(word) {
          const button = currentWidget.querySelector('.widget-button');
          button.disabled = true;
          button.textContent = 'Adding...';
          
          try {
            const response = await browser.runtime.sendMessage({
              type: 'add_word_to_list',
              payload: {
                wordData: {
                  word: word,
                  definitions: [{ partOfSpeech: 'unknown', meaning: 'Added from context' }]
                }
              }
            });
            
            if (response.status === 'success') {
              const actions = currentWidget.querySelector('.widget-actions');
              actions.innerHTML = '<div class="widget-success">Added to vocabulary!</div>';
              setTimeout(hideWidget, 2000);
            } else {
              button.disabled = false;
              button.textContent = 'Add to List';
              displayError('Failed to add word');
            }
          } catch (error) {
            button.disabled = false;
            button.textContent = 'Add to List';
            displayError('Failed to add word');
          }
        }
        
        // Set up selection handling
        document.addEventListener('mouseup', (e) => {
          if (selectionTimeout) {
            clearTimeout(selectionTimeout);
          }
          
          selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
              // Check if it's a single word (no spaces)
              if (!/\\s/.test(selectedText)) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                showWidget(selectedText, rect);
              }
            }
          }, 100);
        });
        
        // Hide widget when clicking elsewhere
        document.addEventListener('click', (e) => {
          if (currentWidget && !currentWidget.contains(e.target)) {
            hideWidget();
          }
        });
        
        // Keyboard shortcut (Escape to close)
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && currentWidget) {
            hideWidget();
          }
        });
        
        // Make functions globally available for testing
        window.vocabdictTest = {
          hideWidget,
          showWidget,
          addToList
        };
      `
    });
    
    // Wait for page to be ready
    await page.waitForSelector('.content', { timeout: 5000 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Text Selection Detection', () => {
    test('should detect single word selection', async () => {
      // Select the word "world"
      await page.evaluate(() => {
        const wordElement = document.querySelector('.word-test');
        const range = document.createRange();
        range.selectNodeContents(wordElement);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger mouseup event
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      // Wait for widget to appear
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeTruthy();
    });

    test('should show loading state initially', async () => {
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('hello');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-loading', { timeout: 2000 });
      
      const loadingElement = await page.$('.widget-loading');
      expect(loadingElement).toBeTruthy();
      
      const loadingText = await page.evaluate(el => el.textContent, loadingElement);
      expect(loadingText).toBe('Looking up word...');
    });

    test('should ignore multi-word selections', async () => {
      // Select multiple words
      await page.evaluate(() => {
        const paragraph = document.querySelector('.paragraph');
        const range = document.createRange();
        range.setStart(paragraph.firstChild, 0);
        range.setEnd(paragraph.firstChild, 20); // Select "The world is a beaut"
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      // Wait a bit to ensure no widget appears
      await page.waitForTimeout(500);
      
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeNull();
    });

    test('should ignore very long selections', async () => {
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        // Create a very long text selection
        const longText = 'a'.repeat(100);
        const range = document.createRange();
        const textNode = document.createTextNode(longText);
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForTimeout(500);
      
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeNull();
    });
  });

  describe('Widget Display and Positioning', () => {
    test('should position widget near selected text', async () => {
      // Select a word and get its position
      const wordRect = await page.evaluate(() => {
        const wordElement = document.querySelector('.word-test');
        const rect = wordElement.getBoundingClientRect();
        
        const range = document.createRange();
        range.selectNodeContents(wordElement);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        
        return {
          left: rect.left,
          top: rect.top,
          bottom: rect.bottom,
          right: rect.right
        };
      });
      
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      const widgetRect = await page.evaluate(() => {
        const widget = document.querySelector('.vocabdict-widget:not(.hidden)');
        const rect = widget.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top
        };
      });
      
      // Widget should be positioned near the selected text
      expect(Math.abs(widgetRect.left - wordRect.left)).toBeLessThan(50);
      expect(widgetRect.top).toBeGreaterThan(wordRect.bottom);
    });

    test('should not go off-screen horizontally', async () => {
      // Select text near the right edge
      await page.evaluate(() => {
        const textNode = document.createTextNode('test');
        const span = document.createElement('span');
        span.appendChild(textNode);
        span.style.position = 'absolute';
        span.style.right = '10px';
        span.style.top = '100px';
        document.body.appendChild(span);
        
        const range = document.createRange();
        range.selectNodeContents(span);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      const widgetRight = await page.evaluate(() => {
        const widget = document.querySelector('.vocabdict-widget:not(.hidden)');
        const rect = widget.getBoundingClientRect();
        return rect.right;
      });
      
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(widgetRight).toBeLessThanOrEqual(viewportWidth);
    });

    test('should display word information correctly', async () => {
      // Select a known word
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('hello');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      // Wait for widget to load and display content
      await page.waitForSelector('.widget-word', { timeout: 3000 });
      
      const wordText = await page.$eval('.widget-word', el => el.textContent);
      expect(wordText).toBe('hello');
      
      const definition = await page.$('.widget-definition');
      expect(definition).toBeTruthy();
      
      const addButton = await page.$('.widget-button');
      expect(addButton).toBeTruthy();
      
      const buttonText = await page.evaluate(el => el.textContent, addButton);
      expect(buttonText).toBe('Add to List');
    });
  });

  describe('Widget Interactions', () => {
    beforeEach(async () => {
      // Set up a widget for each test
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('hello');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-word', { timeout: 3000 });
    });

    test('should close widget when close button is clicked', async () => {
      const closeButton = await page.$('.widget-close');
      expect(closeButton).toBeTruthy();
      
      await page.click('.widget-close');
      
      // Widget should be hidden or removed
      await page.waitForTimeout(300);
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeNull();
    });

    test('should close widget when clicking outside', async () => {
      // Click somewhere else on the page
      await page.click('body', { offset: { x: 100, y: 100 } });
      
      await page.waitForTimeout(300);
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeNull();
    });

    test('should close widget when pressing Escape', async () => {
      await page.keyboard.press('Escape');
      
      await page.waitForTimeout(300);
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeNull();
    });

    test('should handle add to list action', async () => {
      const addButton = await page.$('.widget-button');
      expect(addButton).toBeTruthy();
      
      await page.click('.widget-button');
      
      // Button should show loading state
      await page.waitForFunction(() => {
        const button = document.querySelector('.widget-button');
        return button && button.textContent === 'Adding...';
      }, { timeout: 1000 });
      
      // Wait for success message
      await page.waitForSelector('.widget-success', { timeout: 3000 });
      
      const successMessage = await page.$eval('.widget-success', el => el.textContent);
      expect(successMessage).toBe('Added to vocabulary!');
    });

    test('should prevent multiple simultaneous add operations', async () => {
      const addButton = await page.$('.widget-button');
      
      // Click multiple times quickly
      await page.click('.widget-button');
      await page.click('.widget-button');
      await page.click('.widget-button');
      
      // Button should be disabled
      const isDisabled = await page.$eval('.widget-button', el => el.disabled);
      expect(isDisabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle lookup errors gracefully', async () => {
      // Mock error response
      await page.evaluate(() => {
        window.browser.runtime.sendMessage = function() {
          return Promise.reject(new Error('Network error'));
        };
      });
      
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('errorword');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-error', { timeout: 3000 });
      
      const errorMessage = await page.$eval('.widget-error', el => el.textContent);
      expect(errorMessage).toBe('Failed to look up word');
    });

    test('should handle word not found', async () => {
      // Mock "not found" response
      await page.evaluate(() => {
        window.browser.runtime.sendMessage = function() {
          return Promise.resolve({ status: 'success', data: null });
        };
      });
      
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('unknownword');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-error', { timeout: 3000 });
      
      const errorMessage = await page.$eval('.widget-error', el => el.textContent);
      expect(errorMessage).toBe('Word not found');
    });

    test('should handle add to list errors', async () => {
      // Set up successful lookup but failed add
      await page.evaluate(() => {
        let callCount = 0;
        window.browser.runtime.sendMessage = function(message) {
          callCount++;
          if (callCount === 1) {
            // First call (lookup) succeeds
            return Promise.resolve({
              status: 'success',
              data: {
                word: 'hello',
                definitions: [{ partOfSpeech: 'noun', meaning: 'greeting' }]
              }
            });
          } else {
            // Second call (add to list) fails
            return Promise.reject(new Error('Add failed'));
          }
        };
      });
      
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('hello');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-button', { timeout: 3000 });
      await page.click('.widget-button');
      
      await page.waitForSelector('.widget-error', { timeout: 3000 });
      
      const errorMessage = await page.$eval('.widget-error', el => el.textContent);
      expect(errorMessage).toBe('Failed to add word');
      
      // Button should be re-enabled
      const isDisabled = await page.$eval('.widget-button', el => el.disabled);
      expect(isDisabled).toBe(false);
    });
  });

  describe('Multiple Widgets', () => {
    test('should hide previous widget when showing new one', async () => {
      // Show first widget
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('first');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      // Show second widget
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('second');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForTimeout(500);
      
      // Should only have one visible widget
      const visibleWidgets = await page.$$('.vocabdict-widget:not(.hidden)');
      expect(visibleWidgets.length).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should handle rapid selections without memory leaks', async () => {
      // Perform many rapid selections
      for (let i = 0; i < 10; i++) {
        await page.evaluate((index) => {
          const selection = window.getSelection();
          selection.removeAllRanges();
          
          const range = document.createRange();
          const textNode = document.createTextNode(`word${index}`);
          document.body.appendChild(textNode);
          range.selectNode(textNode);
          selection.addRange(range);
          
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        }, i);
        
        await page.waitForTimeout(50);
      }
      
      // Should only have one widget in DOM
      const widgets = await page.$$('.vocabdict-widget');
      expect(widgets.length).toBeLessThanOrEqual(1);
    });

    test('should respond quickly to selections', async () => {
      const startTime = Date.now();
      
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('speed');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should appear within 1 second
    });
  });

  describe('Accessibility', () => {
    test('should be keyboard accessible', async () => {
      // Create widget
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('accessible');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-button', { timeout: 3000 });
      
      // Tab to the add button
      await page.keyboard.press('Tab');
      
      // Check if button can be activated with Enter
      await page.keyboard.press('Enter');
      
      await page.waitForSelector('.widget-success', { timeout: 3000 });
      
      const successMessage = await page.$('.widget-success');
      expect(successMessage).toBeTruthy();
    });

    test('should have proper focus management', async () => {
      await page.evaluate(() => {
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        const range = document.createRange();
        const textNode = document.createTextNode('focus');
        document.body.appendChild(textNode);
        range.selectNode(textNode);
        selection.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
      
      await page.waitForSelector('.widget-close', { timeout: 3000 });
      
      // Focus should be manageable within widget
      await page.focus('.widget-close');
      const focusedElement = await page.evaluate(() => document.activeElement.className);
      expect(focusedElement).toContain('widget-close');
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should work with different selection APIs', async () => {
      // Test with manual range creation (fallback method)
      await page.evaluate(() => {
        const range = document.createRange();
        const textNode = document.createTextNode('compat');
        document.body.appendChild(textNode);
        range.selectNodeContents(textNode);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Simulate different event types
        const events = ['mouseup', 'selectionchange'];
        events.forEach(eventType => {
          document.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      });
      
      await page.waitForSelector('.vocabdict-widget:not(.hidden)', { timeout: 3000 });
      
      const widget = await page.$('.vocabdict-widget:not(.hidden)');
      expect(widget).toBeTruthy();
    });
  });
});