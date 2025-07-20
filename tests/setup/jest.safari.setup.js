/**
 * Jest setup for Safari E2E tests
 * Configures Safari WebDriver and testing utilities
 */

// Longer timeout for Safari automation
jest.setTimeout(60000);

// Global Safari testing utilities
global.safariHelpers = {
  // Create Safari WebDriver instance
  createSafariDriver: async () => {
    try {
      const { Builder } = require('selenium-webdriver');
      const safari = require('selenium-webdriver/safari');
      
      const options = new safari.Options();
      
      // Use Safari Technology Preview if requested
      if (global.SAFARI_TECH_PREVIEW) {
        options.setTechnologyPreview(true);
      }
      
      const driver = await new Builder()
        .forBrowser('safari')
        .setSafariOptions(options)
        .build();
        
      return driver;
    } catch (error) {
      throw new Error(`Failed to create Safari driver: ${error.message}`);
    }
  },

  // Load extension test page
  loadTestPage: async (driver, pagePath) => {
    const path = require('path');
    const fullPath = path.resolve(pagePath);
    const fileUrl = `file://${fullPath}`;
    
    await driver.get(fileUrl);
    
    // Wait for page to load
    await driver.sleep(1000);
    
    return fileUrl;
  },

  // Check if extension is loaded
  checkExtensionLoaded: async (driver) => {
    try {
      const result = await driver.executeScript(() => {
        // Check if VocabDict extension objects are available
        return {
          hasVocabDict: typeof window.VocabDict !== 'undefined',
          hasBrowser: typeof window.browser !== 'undefined' || typeof window.chrome !== 'undefined'
        };
      });
      
      return result;
    } catch (error) {
      return { hasVocabDict: false, hasBrowser: false, error: error.message };
    }
  },

  // Wait for element with timeout
  waitForElement: async (driver, selector, timeout = 10000) => {
    const { By, until } = require('selenium-webdriver');
    
    try {
      const element = await driver.wait(
        until.elementLocated(By.css(selector)),
        timeout
      );
      
      await driver.wait(until.elementIsVisible(element), timeout);
      
      return element;
    } catch (error) {
      throw new Error(`Element not found: ${selector} (timeout: ${timeout}ms)`);
    }
  },

  // Get Safari version
  getSafariVersion: async (driver) => {
    try {
      const userAgent = await driver.executeScript(() => navigator.userAgent);
      const safariMatch = userAgent.match(/Version\/([0-9.]+)/);
      return safariMatch ? safariMatch[1] : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  },

  // Check Safari WebDriver capabilities
  checkSafariCapabilities: async () => {
    try {
      const driver = await global.safariHelpers.createSafariDriver();
      const capabilities = await driver.getCapabilities();
      await driver.quit();
      
      return {
        browserName: capabilities.get('browserName'),
        browserVersion: capabilities.get('browserVersion'),
        platformName: capabilities.get('platformName'),
        automationName: capabilities.get('automationName')
      };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Create test page with extension content
  createExtensionTestPage: () => {
    const fs = require('fs');
    const path = require('path');
    
    const testPagePath = path.join(__dirname, '../fixtures/safari-test-page.html');
    
    if (!fs.existsSync(testPagePath)) {
      const testPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VocabDict Safari Extension Test Page</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        
        .test-section {
            margin: 30px 0;
            padding: 20px;
            border: 2px solid #007AFF;
            border-radius: 8px;
            background: #F8F9FA;
        }
        
        .test-word {
            background: #FFE4B5;
            padding: 2px 4px;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .test-word:hover {
            background: #FFD700;
        }
        
        #test-results {
            margin-top: 20px;
            padding: 15px;
            background: #E8F5E8;
            border-radius: 5px;
            min-height: 100px;
        }
        
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .status.success { background: #D4EDDA; color: #155724; }
        .status.error { background: #F8D7DA; color: #721C24; }
        .status.info { background: #D1ECF1; color: #0C5460; }
    </style>
</head>
<body>
    <h1>🧪 VocabDict Safari Extension Test Page</h1>
    
    <div class="test-section">
        <h2>Text Selection Test</h2>
        <p>Select these words to test the extension: 
           <span class="test-word" data-word="hello">hello</span>, 
           <span class="test-word" data-word="world">world</span>, 
           <span class="test-word" data-word="vocabulary">vocabulary</span>, 
           <span class="test-word" data-word="dictionary">dictionary</span>.
        </p>
    </div>
    
    <div class="test-section">
        <h2>Context Menu Test</h2>
        <p>Right-click on this text: 
           <strong>learning English vocabulary</strong>
        </p>
    </div>
    
    <div class="test-section">
        <h2>Extension Status</h2>
        <div id="extension-status">Checking extension status...</div>
        <button onclick="checkExtension()">Refresh Status</button>
    </div>
    
    <div id="test-results">
        <h3>Test Results</h3>
        <div id="results-content">Tests will appear here...</div>
    </div>

    <script>
        // Extension detection and testing
        function checkExtension() {
            const statusDiv = document.getElementById('extension-status');
            const resultsDiv = document.getElementById('results-content');
            
            // Check for extension presence
            const hasVocabDict = typeof window.VocabDict !== 'undefined';
            const hasBrowser = typeof window.browser !== 'undefined' || typeof window.chrome !== 'undefined';
            
            let status = '';
            if (hasVocabDict) {
                status += '<div class="status success">✅ VocabDict extension detected</div>';
            } else {
                status += '<div class="status error">❌ VocabDict extension not detected</div>';
            }
            
            if (hasBrowser) {
                status += '<div class="status success">✅ Browser APIs available</div>';
            } else {
                status += '<div class="status error">❌ Browser APIs not available</div>';
            }
            
            status += '<div class="status info">📱 User Agent: ' + navigator.userAgent + '</div>';
            status += '<div class="status info">⏰ Page loaded at: ' + new Date().toLocaleString() + '</div>';
            
            statusDiv.innerHTML = status;
            
            // Log results for automated testing
            window.testResults = {
                hasVocabDict,
                hasBrowser,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            
            resultsDiv.innerHTML = '<pre>' + JSON.stringify(window.testResults, null, 2) + '</pre>';
        }
        
        // Run initial check
        setTimeout(checkExtension, 1000);
        
        // Add selection event listeners for testing
        document.addEventListener('mouseup', function() {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
                console.log('Text selected:', selection.toString());
                
                // Test extension response
                if (window.VocabDict && window.VocabDict.handleSelection) {
                    window.VocabDict.handleSelection(selection);
                }
            }
        });
        
        // Add word click handlers
        document.querySelectorAll('.test-word').forEach(word => {
            word.addEventListener('click', function() {
                const wordText = this.getAttribute('data-word');
                console.log('Test word clicked:', wordText);
                
                // Simulate word lookup
                if (window.VocabDict && window.VocabDict.lookupWord) {
                    window.VocabDict.lookupWord(wordText);
                }
            });
        });
    </script>
</body>
</html>`;
      
      fs.writeFileSync(testPagePath, testPageContent);
    }
    
    return testPagePath;
  }
};

// Cleanup function
afterAll(async () => {
  // Clean up any Safari drivers that might be left running
  console.log('Safari E2E tests completed');
});

// Handle unhandled rejections in Safari tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in Safari E2E test:', reason);
});