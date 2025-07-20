#!/usr/bin/env node

/**
 * Chrome/Chromium detection script for E2E tests
 * Finds and validates Chrome installation
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking for Chrome/Chromium installation...\n');

const possiblePaths = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium'
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
  ]
};

const platform = process.platform;
const paths = possiblePaths[platform] || [];

console.log(`Platform: ${platform}`);
console.log(`Checking ${paths.length} possible Chrome locations...\n`);

let foundChrome = null;

for (const path of paths) {
  try {
    if (fs.existsSync(path)) {
      console.log(`✅ Found Chrome at: ${path}`);
      foundChrome = path;
      break;
    } else {
      console.log(`❌ Not found: ${path}`);
    }
  } catch (error) {
    console.log(`❌ Error checking: ${path}`);
  }
}

if (foundChrome) {
  console.log(`\n🎉 Chrome found! You can use it for E2E tests.`);
  console.log(`\nTo use this Chrome installation, set:`);
  console.log(`export PUPPETEER_EXECUTABLE_PATH="${foundChrome}"`);
  
  // Test if Chrome can launch
  console.log(`\n🧪 Testing Chrome launch...`);
  try {
    // Try to get Chrome version
    const version = execSync(`"${foundChrome}" --version`, { 
      encoding: 'utf8',
      timeout: 5000 
    }).trim();
    console.log(`✅ Chrome version: ${version}`);
    console.log(`✅ Chrome is working correctly!`);
  } catch (error) {
    console.log(`⚠️  Chrome found but may have issues: ${error.message}`);
  }
} else {
  console.log(`\n❌ No Chrome installation found.`);
  console.log(`\nPlease install Chrome or Chromium:`);
  
  if (platform === 'darwin') {
    console.log(`  brew install --cask google-chrome`);
    console.log(`  or download from: https://www.google.com/chrome/`);
  } else if (platform === 'linux') {
    console.log(`  sudo apt-get install chromium-browser  # Ubuntu/Debian`);
    console.log(`  sudo dnf install chromium              # Fedora`);
  } else {
    console.log(`  Download from: https://www.google.com/chrome/`);
  }
}

// Check Puppeteer configuration
console.log(`\n📦 Checking Puppeteer...`);
try {
  const puppeteer = require('puppeteer');
  console.log(`✅ Puppeteer is installed`);
  
  // Check if Puppeteer has bundled Chromium
  try {
    const browserFetcher = puppeteer.createBrowserFetcher();
    const localRevisions = browserFetcher.localRevisions();
    if (localRevisions.length > 0) {
      console.log(`✅ Puppeteer has bundled Chromium (revision: ${localRevisions[0]})`);
    } else {
      console.log(`⚠️  Puppeteer has no bundled Chromium`);
    }
  } catch (error) {
    console.log(`⚠️  Could not check bundled Chromium: ${error.message}`);
  }
} catch (error) {
  console.log(`❌ Puppeteer not installed: ${error.message}`);
  console.log(`   Run: npm install puppeteer`);
}

console.log(`\n📋 Summary:`);
console.log(`- Chrome found: ${foundChrome ? '✅' : '❌'}`);
console.log(`- Platform: ${platform}`);
console.log(`- Ready for E2E tests: ${foundChrome ? '✅' : '❌'}`);

if (foundChrome) {
  console.log(`\n🚀 You can now run E2E tests with:`);
  console.log(`   npm run test:e2e`);
  console.log(`   HEADLESS=true npm run test:e2e  # Headless mode`);
} else {
  console.log(`\n❌ Install Chrome first, then run this script again.`);
  process.exit(1);
}