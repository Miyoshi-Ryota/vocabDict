#!/bin/bash

# VocabDict E2E Test Setup Script
# This script helps set up the environment for E2E testing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_color() {
  echo -e "${2}${1}${NC}"
}

echo_color "🔧 VocabDict E2E Test Setup" "$BLUE"
echo ""

# Check OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OS="linux"
fi

echo_color "Detected OS: $OS" "$BLUE"

# Check for Chrome/Chromium
echo ""
echo_color "Checking for Chrome/Chromium..." "$YELLOW"

CHROME_FOUND=false
CHROME_PATH=""

# Check common Chrome paths
if [[ "$OS" == "macos" ]]; then
  if [ -d "/Applications/Google Chrome.app" ]; then
    CHROME_FOUND=true
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  elif [ -d "/Applications/Chromium.app" ]; then
    CHROME_FOUND=true
    CHROME_PATH="/Applications/Chromium.app/Contents/MacOS/Chromium"
  fi
elif [[ "$OS" == "linux" ]]; then
  if command -v google-chrome &> /dev/null; then
    CHROME_FOUND=true
    CHROME_PATH=$(which google-chrome)
  elif command -v chromium-browser &> /dev/null; then
    CHROME_FOUND=true
    CHROME_PATH=$(which chromium-browser)
  elif command -v chromium &> /dev/null; then
    CHROME_FOUND=true
    CHROME_PATH=$(which chromium)
  fi
fi

if [ "$CHROME_FOUND" = true ]; then
  echo_color "✅ Chrome/Chromium found at: $CHROME_PATH" "$GREEN"
else
  echo_color "❌ Chrome/Chromium not found" "$RED"
  echo ""
  echo "Please install Chrome or Chromium:"
  if [[ "$OS" == "macos" ]]; then
    echo "  brew install --cask google-chrome"
    echo "  or"
    echo "  Download from: https://www.google.com/chrome/"
  elif [[ "$OS" == "linux" ]]; then
    echo "  sudo apt-get install chromium-browser  # Ubuntu/Debian"
    echo "  sudo dnf install chromium              # Fedora"
  fi
  echo ""
fi

# Check Node modules
echo ""
echo_color "Checking Node.js dependencies..." "$YELLOW"

if [ -f "package.json" ]; then
  if [ -d "node_modules/puppeteer" ]; then
    echo_color "✅ Puppeteer is installed" "$GREEN"
  else
    echo_color "⚠️  Puppeteer not found. Installing..." "$YELLOW"
    npm install
  fi
else
  echo_color "❌ package.json not found. Are you in the project root?" "$RED"
  exit 1
fi

# Create test fixtures directory
echo ""
echo_color "Setting up test fixtures..." "$YELLOW"

mkdir -p tests/fixtures
echo_color "✅ Test fixtures directory ready" "$GREEN"

# Set up environment variables
echo ""
echo_color "Setting up environment..." "$YELLOW"

# Create .env.test file if it doesn't exist
if [ ! -f ".env.test" ]; then
  cat > .env.test << EOF
# E2E Test Environment Variables
HEADLESS=false
SLOWMO=0
DEVTOOLS=false

# Chrome executable path (uncomment and update if needed)
# PUPPETEER_EXECUTABLE_PATH="$CHROME_PATH"
EOF
  echo_color "✅ Created .env.test file" "$GREEN"
else
  echo_color "✅ .env.test already exists" "$GREEN"
fi

# Test the setup
echo ""
echo_color "Testing E2E setup..." "$YELLOW"

# Create a simple test to verify setup
cat > tests/e2e/setup-test.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  console.log('Creating new page...');
  const page = await browser.newPage();
  
  console.log('Navigating to test URL...');
  await page.goto('about:blank');
  
  console.log('Browser test successful!');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Browser test failed:', err.message);
  process.exit(1);
});
EOF

# Run the test
node tests/e2e/setup-test.js

if [ $? -eq 0 ]; then
  echo_color "✅ E2E setup test passed!" "$GREEN"
  rm tests/e2e/setup-test.js
else
  echo_color "❌ E2E setup test failed" "$RED"
  echo "Please check the error message above"
  rm tests/e2e/setup-test.js
  exit 1
fi

# Summary
echo ""
echo_color "🎉 E2E Test Setup Complete!" "$GREEN"
echo ""
echo "Next steps:"
echo "1. Run E2E tests: npm run test:e2e"
echo "2. Run in headless mode: HEADLESS=true npm run test:e2e"
echo "3. Debug tests: DEVTOOLS=true SLOWMO=250 npm run test:e2e"
echo ""
echo "See tests/E2E_SETUP.md for more information"