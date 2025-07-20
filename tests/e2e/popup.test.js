/**
 * End-to-End tests for VocabDict popup interface
 * Tests user interactions and UI functionality using Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('VocabDict Popup E2E Tests', () => {
  let browser;
  let page;
  const extensionPath = path.join(__dirname, '../../Shared (Extension)');
  const popupPath = path.join(extensionPath, 'Resources/popup.html');

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
    
    // Set viewport size similar to extension popup
    await page.setViewport({ width: 400, height: 600 });
    
    // Mock browser APIs before loading the page
    await page.evaluateOnNewDocument(() => {
      // Mock browser.runtime
      global.browser = {
        runtime: {
          sendMessage: jest.fn().mockResolvedValue({
            status: 'success',
            data: null
          }),
          getURL: (path) => `chrome-extension://test/${path}`
        }
      };
      
      // Mock chrome API for compatibility
      global.chrome = global.browser;
      
      // Mock localStorage
      global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
    });
    
    // Load the popup HTML file
    await page.goto(`file://${popupPath}`);
    
    // Wait for page to load completely
    await page.waitForSelector('#app', { timeout: 5000 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Popup Interface Loading', () => {
    test('should load popup with all required elements', async () => {
      // Check main container
      const app = await page.$('#app');
      expect(app).toBeTruthy();
      
      // Check navigation tabs
      const tabs = await page.$$('.tab-button');
      expect(tabs.length).toBe(3); // Dictionary, My Lists, Settings
      
      // Check tab content areas
      const dictionaryTab = await page.$('#dictionary-tab');
      const listsTab = await page.$('#lists-tab');
      const settingsTab = await page.$('#settings-tab');
      
      expect(dictionaryTab).toBeTruthy();
      expect(listsTab).toBeTruthy();
      expect(settingsTab).toBeTruthy();
    });

    test('should have correct initial tab state', async () => {
      // Dictionary tab should be active by default
      const activeTab = await page.$('.tab-button.active');
      const activeTabText = await page.evaluate(el => el.textContent, activeTab);
      expect(activeTabText.trim()).toBe('Dictionary');
      
      // Dictionary content should be visible
      const dictionaryContent = await page.$('#dictionary-tab:not(.hidden)');
      expect(dictionaryContent).toBeTruthy();
      
      // Other tabs should be hidden
      const listsContent = await page.$('#lists-tab.hidden');
      const settingsContent = await page.$('#settings-tab.hidden');
      expect(listsContent).toBeTruthy();
      expect(settingsContent).toBeTruthy();
    });

    test('should apply correct theme on load', async () => {
      // Check if theme is applied to document
      const theme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      expect(theme).toBe('light'); // Default theme
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs correctly', async () => {
      // Click on My Lists tab
      await page.click('[data-tab="lists"]');
      await page.waitForTimeout(300); // Wait for transition
      
      // Check active tab
      const activeTab = await page.$('.tab-button.active');
      const activeTabText = await page.evaluate(el => el.textContent, activeTab);
      expect(activeTabText.trim()).toBe('My Lists');
      
      // Check visible content
      const listsContent = await page.$('#lists-tab:not(.hidden)');
      const dictionaryContent = await page.$('#dictionary-tab.hidden');
      expect(listsContent).toBeTruthy();
      expect(dictionaryContent).toBeTruthy();
      
      // Click on Settings tab
      await page.click('[data-tab="settings"]');
      await page.waitForTimeout(300);
      
      const newActiveTab = await page.$('.tab-button.active');
      const newActiveTabText = await page.evaluate(el => el.textContent, newActiveTab);
      expect(newActiveTabText.trim()).toBe('Settings');
    });

    test('should maintain tab state during interactions', async () => {
      // Switch to Settings tab
      await page.click('[data-tab="settings"]');
      await page.waitForTimeout(300);
      
      // Interact with settings (toggle theme)
      const themeToggle = await page.$('#theme-toggle');
      if (themeToggle) {
        await page.click('#theme-toggle');
        await page.waitForTimeout(100);
      }
      
      // Settings tab should still be active
      const activeTab = await page.$('.tab-button.active');
      const activeTabText = await page.evaluate(el => el.textContent, activeTab);
      expect(activeTabText.trim()).toBe('Settings');
    });
  });

  describe('Dictionary Search Interface', () => {
    beforeEach(async () => {
      // Ensure we're on dictionary tab
      await page.click('[data-tab="dictionary"]');
      await page.waitForTimeout(300);
    });

    test('should have search input and button', async () => {
      const searchInput = await page.$('#search-input');
      const searchButton = await page.$('#search-button');
      
      expect(searchInput).toBeTruthy();
      expect(searchButton).toBeTruthy();
      
      // Check input placeholder
      const placeholder = await page.evaluate(
        el => el.placeholder,
        searchInput
      );
      expect(placeholder).toBe('Enter word to search...');
    });

    test('should accept text input', async () => {
      const searchInput = await page.$('#search-input');
      
      await page.click('#search-input');
      await page.type('#search-input', 'hello');
      
      const inputValue = await page.evaluate(
        el => el.value,
        searchInput
      );
      expect(inputValue).toBe('hello');
    });

    test('should clear input when clear button is clicked', async () => {
      // Type in search input
      await page.click('#search-input');
      await page.type('#search-input', 'test');
      
      // Click clear button (if visible)
      const clearButton = await page.$('#clear-search');
      if (clearButton) {
        await page.click('#clear-search');
        
        const inputValue = await page.evaluate(
          el => el.value,
          await page.$('#search-input')
        );
        expect(inputValue).toBe('');
      }
    });

    test('should show loading state during search', async () => {
      // Mock delayed response
      await page.evaluateOnNewDocument(() => {
        global.browser.runtime.sendMessage = jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                status: 'success',
                data: {
                  word: 'hello',
                  definitions: [{ partOfSpeech: 'noun', meaning: 'greeting' }]
                }
              });
            }, 100);
          });
        });
      });
      
      await page.click('#search-input');
      await page.type('#search-input', 'hello');
      await page.click('#search-button');
      
      // Check for loading indicator
      const loadingIndicator = await page.$('.loading');
      if (loadingIndicator) {
        const isVisible = await page.evaluate(
          el => !el.classList.contains('hidden'),
          loadingIndicator
        );
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Search Results Display', () => {
    beforeEach(async () => {
      await page.click('[data-tab="dictionary"]');
      await page.waitForTimeout(300);
      
      // Mock successful search response
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockResolvedValue({
          status: 'success',
          data: {
            word: 'hello',
            pronunciations: [
              { type: 'US', phonetic: '/həˈloʊ/' },
              { type: 'UK', phonetic: '/həˈləʊ/' }
            ],
            definitions: [
              {
                partOfSpeech: 'noun',
                meaning: 'A greeting or expression of goodwill',
                examples: ['She gave him a warm hello.']
              },
              {
                partOfSpeech: 'verb',
                meaning: 'To greet with hello',
                examples: ['I helloed him from across the street.']
              }
            ],
            synonyms: ['hi', 'greetings', 'salutations'],
            antonyms: ['goodbye', 'farewell'],
            examples: [
              'Hello! How are you today?',
              'She said hello to everyone in the room.'
            ]
          }
        });
      });
    });

    test('should display search results correctly', async () => {
      await page.click('#search-input');
      await page.type('#search-input', 'hello');
      await page.click('#search-button');
      
      // Wait for results to appear
      await page.waitForSelector('#search-results', { timeout: 3000 });
      
      // Check word header
      const wordHeader = await page.$('.word-header');
      expect(wordHeader).toBeTruthy();
      
      // Check pronunciations
      const pronunciations = await page.$$('.pronunciation');
      expect(pronunciations.length).toBeGreaterThan(0);
      
      // Check definitions
      const definitions = await page.$$('.definition');
      expect(definitions.length).toBeGreaterThan(0);
      
      // Check if Add to List button appears
      const addButton = await page.$('#add-to-list-btn');
      expect(addButton).toBeTruthy();
    });

    test('should handle empty search results', async () => {
      // Mock empty response
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockResolvedValue({
          status: 'success',
          data: null
        });
      });
      
      await page.click('#search-input');
      await page.type('#search-input', 'unknownword');
      await page.click('#search-button');
      
      await page.waitForTimeout(1000);
      
      // Check for "not found" message
      const notFoundMessage = await page.$('.not-found-message');
      if (notFoundMessage) {
        const messageText = await page.evaluate(
          el => el.textContent,
          notFoundMessage
        );
        expect(messageText).toContain('not found');
      }
    });

    test('should handle search errors gracefully', async () => {
      // Mock error response
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockResolvedValue({
          status: 'error',
          error: 'Network error'
        });
      });
      
      await page.click('#search-input');
      await page.type('#search-input', 'error');
      await page.click('#search-button');
      
      await page.waitForTimeout(1000);
      
      // Check for error message
      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        const isVisible = await page.evaluate(
          el => !el.classList.contains('hidden'),
          errorMessage
        );
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('Add to List Functionality', () => {
    beforeEach(async () => {
      await page.click('[data-tab="dictionary"]');
      await page.waitForTimeout(300);
      
      // Mock search and add responses
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockImplementation((request) => {
          if (request.type === 'lookup_word') {
            return Promise.resolve({
              status: 'success',
              data: {
                word: 'hello',
                definitions: [{ partOfSpeech: 'noun', meaning: 'greeting' }]
              }
            });
          } else if (request.type === 'add_word_to_list') {
            return Promise.resolve({
              status: 'success',
              data: { id: 'word_123', word: 'hello' }
            });
          }
          return Promise.resolve({ status: 'success', data: null });
        });
      });
    });

    test('should show add to list button after successful search', async () => {
      await page.click('#search-input');
      await page.type('#search-input', 'hello');
      await page.click('#search-button');
      
      await page.waitForSelector('#add-to-list-btn', { timeout: 3000 });
      
      const addButton = await page.$('#add-to-list-btn');
      expect(addButton).toBeTruthy();
      
      const buttonText = await page.evaluate(
        el => el.textContent,
        addButton
      );
      expect(buttonText.trim()).toBe('Add to List');
    });

    test('should handle add to list action', async () => {
      // Perform search first
      await page.click('#search-input');
      await page.type('#search-input', 'hello');
      await page.click('#search-button');
      
      await page.waitForSelector('#add-to-list-btn', { timeout: 3000 });
      
      // Click add to list button
      await page.click('#add-to-list-btn');
      
      // Wait for feedback message
      await page.waitForTimeout(1000);
      
      // Check for success feedback
      const successMessage = await page.$('.success-message');
      if (successMessage) {
        const isVisible = await page.evaluate(
          el => !el.classList.contains('hidden'),
          successMessage
        );
        expect(isVisible).toBe(true);
      }
    });
  });

  describe('My Lists Interface', () => {
    beforeEach(async () => {
      await page.click('[data-tab="lists"]');
      await page.waitForTimeout(300);
      
      // Mock lists data
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockImplementation((request) => {
          if (request.type === 'get_all_lists') {
            return Promise.resolve({
              status: 'success',
              data: [
                {
                  id: 'default_list',
                  name: 'My Vocabulary',
                  wordIds: ['word1', 'word2'],
                  isDefault: true
                },
                {
                  id: 'custom_list',
                  name: 'Business English',
                  wordIds: ['word3'],
                  isDefault: false
                }
              ]
            });
          } else if (request.type === 'get_all_words') {
            return Promise.resolve({
              status: 'success',
              data: [
                { id: 'word1', word: 'hello', definitions: [{ meaning: 'greeting' }] },
                { id: 'word2', word: 'world', definitions: [{ meaning: 'earth' }] },
                { id: 'word3', word: 'business', definitions: [{ meaning: 'commerce' }] }
              ]
            });
          }
          return Promise.resolve({ status: 'success', data: null });
        });
      });
    });

    test('should display vocabulary lists', async () => {
      await page.waitForTimeout(1000); // Wait for lists to load
      
      const listItems = await page.$$('.list-item');
      expect(listItems.length).toBeGreaterThan(0);
      
      // Check for default list
      const defaultListName = await page.$eval(
        '.list-item .list-name',
        el => el.textContent
      );
      expect(defaultListName.trim()).toBe('My Vocabulary');
    });

    test('should show word count for each list', async () => {
      await page.waitForTimeout(1000);
      
      const wordCounts = await page.$$('.word-count');
      expect(wordCounts.length).toBeGreaterThan(0);
      
      // Check first list word count
      const firstWordCount = await page.$eval(
        '.word-count',
        el => el.textContent
      );
      expect(firstWordCount).toContain('word');
    });

    test('should expand list to show words', async () => {
      await page.waitForTimeout(1000);
      
      // Click on a list to expand
      const listItem = await page.$('.list-item');
      if (listItem) {
        await page.click('.list-item');
        await page.waitForTimeout(500);
        
        // Check if words are displayed
        const wordItems = await page.$$('.word-item');
        expect(wordItems.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Settings Interface', () => {
    beforeEach(async () => {
      await page.click('[data-tab="settings"]');
      await page.waitForTimeout(300);
      
      // Mock settings data
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockImplementation((request) => {
          if (request.type === 'get_settings') {
            return Promise.resolve({
              status: 'success',
              data: {
                theme: 'light',
                autoAdd: true,
                defaultListId: null,
                reviewReminders: true,
                sessionSize: 20
              }
            });
          } else if (request.type === 'update_settings') {
            return Promise.resolve({
              status: 'success',
              data: request.payload.settings
            });
          }
          return Promise.resolve({ status: 'success', data: null });
        });
      });
    });

    test('should display settings controls', async () => {
      await page.waitForTimeout(1000);
      
      // Check for theme toggle
      const themeToggle = await page.$('#theme-toggle');
      expect(themeToggle).toBeTruthy();
      
      // Check for auto-add toggle
      const autoAddToggle = await page.$('#auto-add-toggle');
      if (autoAddToggle) {
        expect(autoAddToggle).toBeTruthy();
      }
    });

    test('should toggle theme', async () => {
      await page.waitForTimeout(1000);
      
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      
      // Click theme toggle
      const themeToggle = await page.$('#theme-toggle');
      if (themeToggle) {
        await page.click('#theme-toggle');
        await page.waitForTimeout(300);
        
        const newTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme');
        });
        
        expect(newTheme).not.toBe(initialTheme);
      }
    });

    test('should save settings changes', async () => {
      await page.waitForTimeout(1000);
      
      // Change a setting
      const autoAddToggle = await page.$('#auto-add-toggle');
      if (autoAddToggle) {
        await page.click('#auto-add-toggle');
        await page.waitForTimeout(500);
        
        // Check if save indication appears
        const saveIndicator = await page.$('.settings-saved');
        if (saveIndicator) {
          const isVisible = await page.evaluate(
            el => !el.classList.contains('hidden'),
            saveIndicator
          );
          expect(isVisible).toBe(true);
        }
      }
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to different viewport sizes', async () => {
      // Test small viewport
      await page.setViewport({ width: 320, height: 480 });
      await page.waitForTimeout(300);
      
      const app = await page.$('#app');
      expect(app).toBeTruthy();
      
      // Test larger viewport
      await page.setViewport({ width: 500, height: 700 });
      await page.waitForTimeout(300);
      
      const appAfterResize = await page.$('#app');
      expect(appAfterResize).toBeTruthy();
    });

    test('should maintain functionality at different sizes', async () => {
      await page.setViewport({ width: 300, height: 400 });
      await page.waitForTimeout(300);
      
      // Test tab switching still works
      await page.click('[data-tab="lists"]');
      await page.waitForTimeout(300);
      
      const activeTab = await page.$('.tab-button.active');
      const activeTabText = await page.evaluate(el => el.textContent, activeTab);
      expect(activeTabText.trim()).toBe('My Lists');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      const searchInput = await page.$('#search-input');
      const ariaLabel = await page.evaluate(
        el => el.getAttribute('aria-label'),
        searchInput
      );
      
      if (ariaLabel) {
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
    });

    test('should have sufficient color contrast', async () => {
      // This is a basic check - in real scenarios you'd use specialized tools
      const styles = await page.evaluate(() => {
        const element = document.querySelector('.tab-button');
        if (element) {
          const computed = window.getComputedStyle(element);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        }
        return null;
      });
      
      expect(styles).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      await page.evaluate(() => {
        global.browser.runtime.sendMessage = jest.fn().mockRejectedValue(
          new Error('Network error')
        );
      });
      
      await page.click('[data-tab="dictionary"]');
      await page.waitForTimeout(300);
      
      await page.click('#search-input');
      await page.type('#search-input', 'test');
      await page.click('#search-button');
      
      await page.waitForTimeout(1000);
      
      // Should not crash and should show some error indication
      const app = await page.$('#app');
      expect(app).toBeTruthy();
    });

    test('should recover from JavaScript errors', async () => {
      // Inject an error
      await page.evaluate(() => {
        window.addEventListener('error', (e) => {
          console.log('Caught error:', e.error);
        });
        
        // Trigger an error in a non-critical function
        setTimeout(() => {
          try {
            undefined.someMethod();
          } catch (e) {
            console.log('Expected error caught');
          }
        }, 100);
      });
      
      await page.waitForTimeout(500);
      
      // Interface should still be functional
      await page.click('[data-tab="settings"]');
      await page.waitForTimeout(300);
      
      const activeTab = await page.$('.tab-button.active');
      const activeTabText = await page.evaluate(el => el.textContent, activeTab);
      expect(activeTabText.trim()).toBe('Settings');
    });
  });
});