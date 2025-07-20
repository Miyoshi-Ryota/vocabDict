# Safari E2E Testing Setup for VocabDict

## Overview
Since VocabDict is a Safari extension, the most effective E2E testing approach combines automated testing for web components with manual testing for Safari-specific features.

## Safari Extension Testing Approaches

### 1. Safari Web Driver (Recommended)
Safari includes built-in WebDriver support for automated testing.

#### Setup Safari WebDriver:
```bash
# Enable Safari's Develop menu
# Safari > Preferences > Advanced > Show Develop menu

# Enable Remote Automation
# Develop > Allow Remote Automation

# Or enable via command line:
sudo safaridriver --enable
```

#### Install Selenium WebDriver:
```bash
npm install --save-dev selenium-webdriver
```

### 2. Manual Testing Framework
For Safari extension-specific features that can't be automated.

## Implementation

### 1. Create Safari WebDriver Configuration

```javascript
// tests/e2e/safari.config.js
const { Builder, By, until } = require('selenium-webdriver');
const safari = require('selenium-webdriver/safari');

const createSafariDriver = async () => {
  const options = new safari.Options();
  
  // Safari-specific options
  options.setTechnologyPreview(false); // Use stable Safari
  
  const driver = await new Builder()
    .forBrowser('safari')
    .setSafariOptions(options)
    .build();
    
  return driver;
};

module.exports = { createSafariDriver };
```

### 2. Safari Extension E2E Tests

```javascript
// tests/e2e/safari-extension.test.js
const { createSafariDriver } = require('./safari.config');

describe('VocabDict Safari Extension E2E', () => {
  let driver;
  
  beforeAll(async () => {
    driver = await createSafariDriver();
    // Navigate to a test page
    await driver.get('https://example.com');
  });
  
  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });
  
  test('should inject content script', async () => {
    // Test that content script is loaded
    const result = await driver.executeScript(() => {
      return window.VocabDict !== undefined;
    });
    expect(result).toBe(true);
  });
  
  test('should open popup when toolbar button clicked', async () => {
    // This requires manual testing as Safari WebDriver
    // cannot directly interact with extension UI
    console.log('Manual test: Click extension icon in toolbar');
  });
});
```

### 3. Manual Testing Checklist

Create structured manual tests for Safari-specific features:

```markdown
## Manual Safari Extension Tests

### Installation & Permissions
- [ ] Extension installs correctly from Xcode
- [ ] Permissions are requested appropriately
- [ ] Extension appears in Safari Extensions preferences
- [ ] Extension can be enabled/disabled

### Toolbar Integration
- [ ] Extension icon appears in Safari toolbar
- [ ] Icon has correct appearance and state
- [ ] Clicking icon opens popup
- [ ] Popup has correct size and positioning

### Content Script Integration
- [ ] Content script injects on web pages
- [ ] Text selection triggers widget
- [ ] Widget positioning is correct
- [ ] Widget doesn't interfere with page layout

### Background Script
- [ ] Message passing works between components
- [ ] Data persistence works correctly
- [ ] Extension survives Safari restart

### Performance
- [ ] Extension doesn't slow down Safari
- [ ] Memory usage is reasonable
- [ ] No console errors in Safari Developer Tools
```

## Setup Instructions

### 1. Enable Safari Development Features

```bash
# Enable Safari's Develop menu if not already enabled
defaults write com.apple.Safari IncludeDevelopMenu -bool true

# Enable Web Inspector
defaults write com.apple.Safari WebKitDeveloperExtrasEnabledPreferenceKey -bool true
```

### 2. Install Testing Dependencies

```bash
# Install Selenium for Safari WebDriver
npm install --save-dev selenium-webdriver

# Install manual testing tools
npm install --save-dev open-cli
```

### 3. Create Test Scripts

Update package.json:
```json
{
  "scripts": {
    "test:safari": "jest --config jest.safari.config.js",
    "test:safari-manual": "open tests/manual/safari-checklist.html",
    "dev:safari": "xcrun xcodebuild -project vocabDict.xcodeproj -scheme Extension -configuration Debug"
  }
}
```

### 4. Create Safari-Specific Jest Config

```javascript
// jest.safari.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/e2e/safari*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.safari.setup.js'],
  testTimeout: 60000, // Longer timeout for browser automation
};
```

## Testing Workflow

### Automated Tests (Web Components)
```bash
# Run Safari WebDriver tests
npm run test:safari

# Test web components in Safari
npm run test:safari -- --testNamePattern="web component"
```

### Manual Tests (Extension Features)
```bash
# Open manual testing checklist
npm run test:safari-manual

# Build and install extension for testing
npm run dev:safari
```

### Development Testing
```bash
# Watch mode for rapid development
npm run test:safari -- --watch

# Debug specific test
npm run test:safari -- --testNamePattern="popup interaction"
```

## Alternative: Playwright with Safari

Playwright has better Safari support than Puppeteer:

```bash
# Install Playwright with Safari
npm install --save-dev playwright

# Install Safari browser
npx playwright install webkit
```

```javascript
// tests/e2e/playwright-safari.test.js
const { webkit } = require('playwright');

describe('VocabDict with Playwright Safari', () => {
  let browser, page;
  
  beforeAll(async () => {
    browser = await webkit.launch();
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  test('should load extension components', async () => {
    await page.goto('file://' + require('path').join(__dirname, '../fixtures/test-page.html'));
    // Test extension functionality
  });
});
```

## Recommended Approach

1. **For web components**: Use Safari WebDriver or Playwright
2. **For extension features**: Use manual testing checklist
3. **For development**: Combine both approaches
4. **For CI/CD**: Focus on web component automation + manual verification

This approach respects Safari's security model while providing comprehensive testing coverage.