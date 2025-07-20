#!/usr/bin/env node

/**
 * Setup script for VocabDict test environment
 * Installs dependencies and configures testing environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up VocabDict test environment...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Install dependencies
console.log('📦 Installing test dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create necessary directories
const directories = [
  'tests/unit',
  'tests/integration', 
  'tests/e2e',
  'tests/setup',
  'tests/mocks',
  'tests/fixtures',
  'coverage'
];

console.log('📁 Creating test directories...');
directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`   Created: ${dir}`);
  } else {
    console.log(`   Exists: ${dir}`);
  }
});
console.log('✅ Test directories ready\n');

// Create .gitignore entries for test files
const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreEntries = [
  '# Test coverage',
  'coverage/',
  '*.lcov',
  '',
  '# Test artifacts', 
  'tests/artifacts/',
  'tests/screenshots/',
  '*.log',
  '',
  '# Node modules',
  'node_modules/',
  '',
  '# IDE files',
  '.vscode/',
  '.idea/',
  '*.swp',
  '*.swo'
];

console.log('📝 Updating .gitignore...');
if (fs.existsSync(gitignorePath)) {
  const existingContent = fs.readFileSync(gitignorePath, 'utf8');
  
  // Check if test entries already exist
  if (!existingContent.includes('# Test coverage')) {
    fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries.join('\n'));
    console.log('   Added test-related entries to .gitignore');
  } else {
    console.log('   .gitignore already contains test entries');
  }
} else {
  fs.writeFileSync(gitignorePath, gitignoreEntries.join('\n'));
  console.log('   Created .gitignore with test entries');
}
console.log('✅ .gitignore updated\n');

// Create VSCode settings for testing
const vscodeDir = path.join(process.cwd(), '.vscode');
const vscodeSettingsPath = path.join(vscodeDir, 'settings.json');

console.log('⚙️  Setting up VSCode configuration...');
if (!fs.existsSync(vscodeDir)) {
  fs.mkdirSync(vscodeDir);
}

const vscodeSettings = {
  "jest.jestCommandLine": "npm test",
  "jest.autoRun": "off",
  "jest.showCoverageOnLoad": true,
  "jest.coverageFormatter": "GutterFormatter",
  "files.exclude": {
    "**/node_modules": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/coverage": true
  },
  "eslint.workingDirectories": [
    "."
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
};

fs.writeFileSync(vscodeSettingsPath, JSON.stringify(vscodeSettings, null, 2));
console.log('   Created VSCode settings for testing');
console.log('✅ VSCode configuration ready\n');

// Create launch configuration for debugging tests
const vscodeLaunchPath = path.join(vscodeDir, 'launch.json');
const launchConfig = {
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "--no-coverage"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "test"
      }
    },
    {
      "name": "Debug Current Jest Test",
      "type": "node", 
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--runInBand",
        "--no-cache",
        "--no-coverage"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "test"
      }
    }
  ]
};

fs.writeFileSync(vscodeLaunchPath, JSON.stringify(launchConfig, null, 2));
console.log('📊 Created VSCode debug configuration for tests\n');

// Create npm scripts helper
const scriptsHelperPath = path.join(process.cwd(), 'scripts/test-helpers.sh');
const scriptsDir = path.join(process.cwd(), 'scripts');

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir);
}

const helpersScript = `#!/bin/bash

# VocabDict Test Helper Scripts

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo_color() {
  echo -e "\${2}\${1}\${NC}"
}

# Run all tests
run_all_tests() {
  echo_color "🧪 Running all tests..." "\$BLUE"
  npm run test:all
}

# Run tests with coverage
run_coverage() {
  echo_color "📊 Running tests with coverage..." "\$BLUE"
  npm run test:coverage
  echo_color "📈 Coverage report generated in coverage/ directory" "\$GREEN"
}

# Run specific test type
run_unit_tests() {
  echo_color "🔬 Running unit tests..." "\$BLUE"
  npm run test:unit
}

run_integration_tests() {
  echo_color "🔗 Running integration tests..." "\$BLUE"
  npm run test:integration
}

run_e2e_tests() {
  echo_color "🌐 Running E2E tests..." "\$BLUE"
  npm run test:e2e
}

# Watch mode
run_watch() {
  echo_color "👀 Running tests in watch mode..." "\$BLUE"
  npm run test:watch
}

# Lint code
run_lint() {
  echo_color "🔍 Running ESLint..." "\$BLUE"
  npm run lint
}

fix_lint() {
  echo_color "🔧 Fixing ESLint issues..." "\$BLUE"
  npm run lint:fix
}

# Show help
show_help() {
  echo_color "VocabDict Test Helper" "\$BLUE"
  echo ""
  echo "Usage: ./scripts/test-helpers.sh [command]"
  echo ""
  echo "Commands:"
  echo "  all          Run all tests"
  echo "  coverage     Run tests with coverage report"
  echo "  unit         Run unit tests only"
  echo "  integration  Run integration tests only"
  echo "  e2e          Run E2E tests only"
  echo "  watch        Run tests in watch mode"
  echo "  lint         Run ESLint"
  echo "  fix          Fix ESLint issues"
  echo "  help         Show this help"
}

# Main script logic
case "\$1" in
  "all")
    run_all_tests
    ;;
  "coverage")
    run_coverage
    ;;
  "unit")
    run_unit_tests
    ;;
  "integration")
    run_integration_tests
    ;;
  "e2e")
    run_e2e_tests
    ;;
  "watch")
    run_watch
    ;;
  "lint")
    run_lint
    ;;
  "fix")
    fix_lint
    ;;
  "help"|"")
    show_help
    ;;
  *)
    echo_color "Unknown command: \$1" "\$RED"
    show_help
    exit 1
    ;;
esac
`;

fs.writeFileSync(scriptsHelperPath, helpersScript);
fs.chmodSync(scriptsHelperPath, '755');
console.log('🔧 Created test helper scripts\n');

// Create README for testing
const testReadmePath = path.join(process.cwd(), 'tests/README.md');
const testReadme = `# VocabDict Testing Guide

This directory contains comprehensive tests for the VocabDict Safari Extension.

## Test Structure

\`\`\`
tests/
├── unit/                 # Unit tests for individual components
│   ├── models.test.js   # Test data models
│   ├── database.test.js # Test database operations
│   └── handlers.test.js # Test message handlers
├── integration/         # Integration tests for component interaction
│   ├── messagePasssing.test.js # Test message flow
│   └── storage.test.js  # Test data persistence
├── e2e/                 # End-to-end tests using Puppeteer
│   ├── popup.test.js    # Test popup interface
│   └── contentScript.test.js # Test content script
├── setup/               # Test configuration
│   └── jest.setup.js    # Jest setup and mocks
├── mocks/               # Mock objects and utilities
│   └── extensionMocks.js # Extension API mocks
├── fixtures/            # Test data and fixtures
│   └── testData.js      # Sample test data
└── README.md           # This file
\`\`\`

## Running Tests

### All Tests
\`\`\`bash
npm test
# or
npm run test:all
\`\`\`

### Specific Test Types
\`\`\`bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
\`\`\`

### With Coverage
\`\`\`bash
npm run test:coverage
\`\`\`

### Watch Mode
\`\`\`bash
npm run test:watch
\`\`\`

### Using Helper Script
\`\`\`bash
./scripts/test-helpers.sh all      # Run all tests
./scripts/test-helpers.sh coverage # Run with coverage
./scripts/test-helpers.sh watch    # Watch mode
\`\`\`

## Test Categories

### Unit Tests
Test individual functions and classes in isolation:
- Data model validation
- Database operations
- Message handler logic
- Utility functions

### Integration Tests
Test component interactions:
- Message passing between extension parts
- Data flow through the system
- Storage persistence across operations

### End-to-End Tests
Test complete user workflows:
- Popup interface interactions
- Content script text selection
- Word lookup and addition flows
- Settings management

## Test Data

The \`fixtures/testData.js\` file contains:
- Sample vocabulary words
- Sample vocabulary lists
- Mock dictionary entries
- Test constants and helpers

## Mocking

The test suite uses comprehensive mocks for:
- Browser/Chrome extension APIs
- IndexedDB operations
- DOM manipulation
- Network requests

## Coverage

Coverage reports are generated in the \`coverage/\` directory:
- \`coverage/lcov-report/index.html\` - HTML report
- \`coverage/lcov.info\` - LCOV format for CI tools

## Debugging Tests

### In VSCode
1. Set breakpoints in test files
2. Use "Debug Jest Tests" launch configuration
3. Or use "Debug Current Jest Test" for single files

### Command Line
\`\`\`bash
node --inspect-brk node_modules/.bin/jest --runInBand [test-file]
\`\`\`

## Writing New Tests

### Unit Test Example
\`\`\`javascript
describe('MyComponent', () => {
  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
\`\`\`

### Integration Test Example
\`\`\`javascript
describe('Component Integration', () => {
  let mockDb;
  
  beforeEach(async () => {
    mockDb = new MockVocabDictDatabase();
    await mockDb.initialize();
  });
  
  test('should handle complete workflow', async () => {
    // Test multi-component interaction
  });
});
\`\`\`

### E2E Test Example
\`\`\`javascript
describe('User Workflow', () => {
  let page;
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('test-page-url');
  });
  
  test('should complete user action', async () => {
    await page.click('#button');
    await page.waitForSelector('#result');
    // Assert expected outcome
  });
});
\`\`\`

## Test Environment

The test environment includes:
- Jest testing framework
- Puppeteer for E2E tests
- fake-indexeddb for database mocking
- jest-webextension-mock for browser APIs
- Custom matchers and utilities

## Continuous Integration

For CI environments:
\`\`\`bash
npm run test:coverage  # Generate coverage reports
npm run lint           # Check code quality
\`\`\`

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in test files
2. **Puppeteer fails**: Ensure Chrome/Chromium is installed
3. **Mock issues**: Check jest.setup.js configuration
4. **Coverage low**: Add tests for uncovered code paths

### Debug Tips

1. Use \`console.log\` in tests (remove before commit)
2. Run single test files: \`npm test -- filename.test.js\`
3. Skip tests temporarily: \`test.skip()\` or \`describe.skip()\`
4. Focus on specific tests: \`test.only()\` or \`describe.only()\`

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure good test coverage (>80%)
3. Test both happy path and error cases
4. Update this README if needed

For more details, see the main project README and developer guide.
`;

fs.writeFileSync(testReadmePath, testReadme);
console.log('📖 Created comprehensive testing README\n');

// Verify setup
console.log('🔍 Verifying test setup...');

const requiredFiles = [
  'package.json',
  'tests/setup/jest.setup.js',
  'tests/fixtures/testData.js',
  'tests/mocks/extensionMocks.js',
  'tests/unit/models.test.js',
  'tests/integration/messagePasssing.test.js',
  'tests/e2e/popup.test.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('');

if (allFilesExist) {
  console.log('🎉 Test environment setup complete!\n');
  console.log('Next steps:');
  console.log('1. Run "npm test" to verify everything works');
  console.log('2. Run "npm run test:coverage" to see coverage report');  
  console.log('3. Use "./scripts/test-helpers.sh help" for more options');
  console.log('4. See tests/README.md for detailed testing guide\n');
  
  // Try to run a quick test
  console.log('🧪 Running a quick test to verify setup...');
  try {
    execSync('npm run test:unit -- --testNamePattern="should create word with default values"', { 
      stdio: 'inherit',
      timeout: 30000 
    });
    console.log('✅ Quick test passed! Setup is working correctly.\n');
  } catch (error) {
    console.log('⚠️  Quick test failed. You may need to install dependencies or check configuration.\n');
  }
} else {
  console.log('❌ Test environment setup incomplete. Some files are missing.');
  process.exit(1);
}