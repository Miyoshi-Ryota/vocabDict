/**
 * Jest setup for E2E tests
 * Configures Puppeteer and E2E test utilities
 */

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Global E2E test utilities
global.e2eHelpers = {
  // Get extension popup URL
  getPopupUrl: () => {
    const path = require('path');
    return `file://${path.join(__dirname, '../../Shared (Extension)/Resources/popup.html')}`;
  },

  // Get test page URL
  getTestPageUrl: () => {
    const path = require('path');
    return `file://${path.join(__dirname, '../fixtures/test-page.html')}`;
  },

  // Wait for element and return it
  waitForElement: async (page, selector, options = {}) => {
    await page.waitForSelector(selector, { visible: true, ...options });
    return await page.$(selector);
  },

  // Mock extension APIs in page context
  mockExtensionAPIs: async (page) => {
    await page.evaluateOnNewDocument(() => {
      // Mock chrome/browser APIs
      window.chrome = window.browser = {
        runtime: {
          sendMessage: jest.fn((message) => {
            // Mock responses based on message type
            const responses = {
              'get_settings': { 
                status: 'success', 
                data: { theme: 'light', autoAdd: true } 
              },
              'get_all_words': { 
                status: 'success', 
                data: [] 
              },
              'get_all_lists': { 
                status: 'success', 
                data: [{ id: 'default', name: 'My Vocabulary', isDefault: true }] 
              },
              'lookup_word': {
                status: 'success',
                data: {
                  word: 'test',
                  pronunciations: { US: '/test/' },
                  definitions: [{
                    partOfSpeech: 'noun',
                    meaning: 'A procedure to establish quality',
                    examples: ['This is a test.']
                  }]
                }
              }
            };
            
            const response = responses[message.type] || { 
              status: 'error', 
              error: 'Unknown message type' 
            };
            
            return Promise.resolve(response);
          }),
          getURL: (path) => `chrome-extension://test/${path}`,
          onMessage: {
            addListener: jest.fn()
          }
        },
        storage: {
          local: {
            get: jest.fn(() => Promise.resolve({})),
            set: jest.fn(() => Promise.resolve()),
            remove: jest.fn(() => Promise.resolve()),
            clear: jest.fn(() => Promise.resolve())
          }
        },
        tabs: {
          query: jest.fn(() => Promise.resolve([])),
          sendMessage: jest.fn(() => Promise.resolve())
        }
      };
    });
  },

  // Create test page HTML
  createTestPage: async () => {
    const fs = require('fs');
    const path = require('path');
    const testPagePath = path.join(__dirname, '../fixtures/test-page.html');
    
    if (!fs.existsSync(testPagePath)) {
      const testPageContent = `<!DOCTYPE html>
<html>
<head>
  <title>VocabDict E2E Test Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
    }
    #test-content {
      max-width: 800px;
      margin: 0 auto;
    }
    .test-paragraph {
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div id="test-content">
    <h1>VocabDict E2E Test Page</h1>
    
    <p class="test-paragraph" id="paragraph1">
      This is a test paragraph with some sample text. You can select 
      words like <span class="test-word">hello</span>, <span class="test-word">world</span>, 
      or <span class="test-word">vocabulary</span> to test the extension.
    </p>
    
    <p class="test-paragraph" id="paragraph2">
      Another paragraph with different words: <span class="test-word">dictionary</span>, 
      <span class="test-word">learning</span>, and <span class="test-word">English</span>.
    </p>
    
    <div id="test-results"></div>
  </div>
</body>
</html>`;
      
      fs.writeFileSync(testPagePath, testPageContent);
    }
    
    return testPagePath;
  },

  // Puppeteer launch options
  getPuppeteerOptions: () => {
    const options = {
      headless: global.HEADLESS || false,
      devtools: global.DEVTOOLS || false,
      slowMo: global.SLOWMO || 0,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--enable-features=NetworkService',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    // Use executablePath if provided
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    return options;
  }
};

// Clean up test files after all tests
afterAll(async () => {
  // Clean up any temporary test files if needed
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in E2E test:', reason);
});