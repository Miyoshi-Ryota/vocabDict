# E2E Test Setup Guide for VocabDict Safari Extension

## Overview
The E2E tests use Puppeteer to automate browser interactions. Due to Safari Extension limitations, the tests run against Chrome/Chromium instead of Safari, but test the same functionality.

## Prerequisites

### 1. Install Chrome or Chromium
Puppeteer requires Chrome or Chromium to be installed on your system.

#### macOS:
```bash
# Option 1: Download Chrome manually
# Visit: https://www.google.com/chrome/

# Option 2: Install via Homebrew
brew install --cask google-chrome
# or
brew install --cask chromium
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install chromium-browser

# Fedora
sudo dnf install chromium
```

### 2. Install Puppeteer Dependencies
```bash
# Install Puppeteer with bundled Chromium
npm install puppeteer

# Or install puppeteer-core if you want to use system Chrome
npm install puppeteer-core
```

## Environment Setup

### 1. Set Environment Variables (Optional)
```bash
# Use system Chrome instead of bundled Chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome

# For headless mode in CI
export HEADLESS=true
```

### 2. Create Test Extension Build
Since Safari extensions can't be directly tested with Puppeteer, create a Chrome-compatible test build:

```bash
# Create a test build directory
mkdir -p tests/e2e/test-extension

# Copy extension files
cp -r "Shared (Extension)/Resources"/* tests/e2e/test-extension/

# Create a Chrome manifest (if needed)
node scripts/create-test-manifest.js
```

## Running E2E Tests

### Local Development
```bash
# Run E2E tests with visible browser
npm run test:e2e

# Run in headless mode
HEADLESS=true npm run test:e2e
```

### Debugging E2E Tests
```bash
# Run with slow motion to see what's happening
SLOWMO=250 npm run test:e2e

# Keep browser open after tests
DEVTOOLS=true npm run test:e2e
```

## Common Issues and Solutions

### Issue 1: "ws does not work in the browser"
**Cause:** Jest is running in jsdom environment for E2E tests.
**Solution:** Configure Jest to use node environment for E2E tests.

### Issue 2: "Chrome/Chromium not found"
**Cause:** Puppeteer can't find Chrome installation.
**Solution:** 
- Install Chrome/Chromium
- Set PUPPETEER_EXECUTABLE_PATH environment variable
- Use puppeteer instead of puppeteer-core

### Issue 3: "Sandbox errors on Linux"
**Cause:** Chrome sandbox requires specific system permissions.
**Solution:** Add --no-sandbox flag (already included in our config).

### Issue 4: "Extension APIs not available"
**Cause:** Testing raw HTML files without extension context.
**Solution:** Mock extension APIs or use browser.addExtension() method.

## Alternative E2E Testing Approaches

### 1. Manual Testing Guide
For Safari-specific testing, use the manual testing guide in developer-guide.md.

### 2. Safari Web Driver
```javascript
// Alternative: Use Safari's WebDriver for basic automation
const { Builder } = require('selenium-webdriver');
const safari = require('selenium-webdriver/safari');

const driver = new Builder()
  .forBrowser('safari')
  .build();
```

### 3. Playwright (Better Safari Support)
```bash
# Install Playwright with Safari support
npm install -D playwright

# Use Playwright instead of Puppeteer
npx playwright test
```

## CI/CD Configuration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:e2e
        env:
          HEADLESS: true
```

### Local Docker Setup
```dockerfile
FROM node:16
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

WORKDIR /app
COPY . .
RUN npm ci
CMD ["npm", "run", "test:e2e"]
```

## Next Steps

1. **Quick Start:** Install Chrome and run `npm run test:e2e`
2. **For Safari Testing:** Use manual testing guide or consider Playwright
3. **For CI:** Configure headless mode and use GitHub Actions
4. **For Full Coverage:** Combine E2E tests with manual Safari testing