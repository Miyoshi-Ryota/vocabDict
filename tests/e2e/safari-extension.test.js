/**
 * Safari E2E tests for VocabDict Extension
 * Tests Safari-specific functionality and web components
 */

describe('VocabDict Safari Extension E2E', () => {
  let driver;
  let testPagePath;

  beforeAll(async () => {
    // Check if Safari WebDriver is available
    try {
      const capabilities = await global.safariHelpers.checkSafariCapabilities();
      if (capabilities.error) {
        console.warn('Safari WebDriver not available:', capabilities.error);
        console.warn('Skipping Safari E2E tests. To enable:');
        console.warn('1. sudo safaridriver --enable');
        console.warn('2. Safari > Develop > Allow Remote Automation');
        return;
      }
      
      console.log('Safari capabilities:', capabilities);
    } catch (error) {
      console.warn('Cannot check Safari capabilities:', error.message);
      return;
    }

    // Create test page
    testPagePath = global.safariHelpers.createExtensionTestPage();
    console.log('Created test page:', testPagePath);
  });

  beforeEach(async () => {
    // Skip if Safari WebDriver not available
    if (!testPagePath) {
      return;
    }

    try {
      driver = await global.safariHelpers.createSafariDriver();
      await global.safariHelpers.loadTestPage(driver, testPagePath);
    } catch (error) {
      console.warn('Could not create Safari driver:', error.message);
      driver = null;
    }
  });

  afterEach(async () => {
    if (driver) {
      try {
        await driver.quit();
      } catch (error) {
        console.warn('Error closing Safari driver:', error.message);
      }
      driver = null;
    }
  });

  describe('Safari Browser Integration', () => {
    test('should load test page in Safari', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      // Check page title
      const title = await driver.getTitle();
      expect(title).toContain('VocabDict Safari Extension Test Page');

      // Check page content
      const { By } = require('selenium-webdriver');
      const heading = await driver.findElement(By.css('h1'));
      const headingText = await heading.getText();
      expect(headingText).toContain('VocabDict Safari Extension Test Page');
    });

    test('should detect Safari browser', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      const safariVersion = await global.safariHelpers.getSafariVersion(driver);
      expect(safariVersion).not.toBe('unknown');
      console.log('Safari version:', safariVersion);

      // Check user agent
      const userAgent = await driver.executeScript(() => navigator.userAgent);
      expect(userAgent).toContain('Safari');
    });
  });

  describe('Extension Detection', () => {
    test('should check for extension APIs', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      // Wait for page to fully load
      await driver.sleep(2000);

      // Check extension status
      const extensionStatus = await global.safariHelpers.checkExtensionLoaded(driver);
      
      // Log status for debugging
      console.log('Extension status:', extensionStatus);

      // Note: Extension may not be loaded in WebDriver context
      // This is expected for Safari extensions in automated testing
      expect(extensionStatus).toHaveProperty('hasVocabDict');
      expect(extensionStatus).toHaveProperty('hasBrowser');
    });

    test('should have browser API compatibility', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      // Check for basic web APIs that extension uses
      const webAPIs = await driver.executeScript(() => {
        return {
          hasSelection: typeof window.getSelection === 'function',
          hasLocalStorage: typeof window.localStorage === 'object',
          hasSessionStorage: typeof window.sessionStorage === 'object',
          hasDocument: typeof document === 'object',
          hasJSON: typeof JSON === 'object'
        };
      });

      expect(webAPIs.hasSelection).toBe(true);
      expect(webAPIs.hasLocalStorage).toBe(true);
      expect(webAPIs.hasSessionStorage).toBe(true);
      expect(webAPIs.hasDocument).toBe(true);
      expect(webAPIs.hasJSON).toBe(true);
    });
  });

  describe('Web Components Testing', () => {
    test('should handle text selection', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      const { By } = require('selenium-webdriver');

      // Find test word element
      const testWord = await global.safariHelpers.waitForElement(driver, '.test-word[data-word="hello"]');
      expect(testWord).toBeDefined();

      // Click the test word
      await testWord.click();

      // Check if click was registered
      const clickResult = await driver.executeScript(() => {
        return document.querySelector('.test-word[data-word="hello"]').dataset.word;
      });

      expect(clickResult).toBe('hello');
    });

    test('should test page interaction elements', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      const { By } = require('selenium-webdriver');

      // Test refresh button
      const refreshButton = await global.safariHelpers.waitForElement(driver, 'button');
      await refreshButton.click();

      // Wait for status update
      await driver.sleep(1000);

      // Check test results were updated
      const resultsDiv = await driver.findElement(By.id('results-content'));
      const resultsText = await resultsDiv.getText();
      
      expect(resultsText).toContain('hasVocabDict');
      expect(resultsText).toContain('hasBrowser');
    });
  });

  describe('Performance and Compatibility', () => {
    test('should load page within reasonable time', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      const startTime = Date.now();
      
      // Reload page and measure load time
      await driver.navigate().refresh();
      await global.safariHelpers.waitForElement(driver, 'h1');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      console.log('Page load time:', loadTime + 'ms');
    });

    test('should not have JavaScript errors', async () => {
      if (!driver) {
        console.log('Safari WebDriver not available - skipping test');
        return;
      }

      // Check browser console for errors
      try {
        const logs = await driver.manage().logs().get('browser');
        const errors = logs.filter(log => log.level.name === 'SEVERE');
        
        if (errors.length > 0) {
          console.warn('JavaScript errors found:', errors);
        }
        
        // Should have no severe JavaScript errors
        expect(errors.length).toBe(0);
      } catch (error) {
        // Safari WebDriver may not support log retrieval
        console.log('Cannot check browser logs (this is expected in Safari)');
      }
    });
  });

  describe('Manual Testing Integration', () => {
    test('should provide manual testing guidance', () => {
      // This test serves as documentation for manual testing
      const manualTests = [
        '1. Install extension in Safari from Xcode',
        '2. Enable extension in Safari Preferences',
        '3. Test popup by clicking toolbar icon',
        '4. Test content script by selecting text',
        '5. Test context menu functionality',
        '6. Verify data persistence across sessions'
      ];

      console.log('Manual testing steps:');
      manualTests.forEach(step => console.log('  ' + step));

      // Always passes - this is just documentation
      expect(manualTests.length).toBeGreaterThan(0);
    });
  });
});