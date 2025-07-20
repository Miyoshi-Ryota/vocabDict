# VocabDict Testing Guide

This directory contains comprehensive tests for the VocabDict Safari Extension.

## Test Structure

```
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
```

## Running Tests

### All Tests
```bash
npm test
# or
npm run test:all
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Using Helper Script
```bash
./scripts/test-helpers.sh all      # Run all tests
./scripts/test-helpers.sh coverage # Run with coverage
./scripts/test-helpers.sh watch    # Watch mode
```

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

The `fixtures/testData.js` file contains:
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

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

## Debugging Tests

### In VSCode
1. Set breakpoints in test files
2. Use "Debug Jest Tests" launch configuration
3. Or use "Debug Current Jest Test" for single files

### Command Line
```bash
node --inspect-brk node_modules/.bin/jest --runInBand [test-file]
```

## Writing New Tests

### Unit Test Example
```javascript
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
```

### Integration Test Example
```javascript
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
```

### E2E Test Example
```javascript
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
```

## Test Environment

The test environment includes:
- Jest testing framework
- Puppeteer for E2E tests
- fake-indexeddb for database mocking
- jest-webextension-mock for browser APIs
- Custom matchers and utilities

## Continuous Integration

For CI environments:
```bash
npm run test:coverage  # Generate coverage reports
npm run lint           # Check code quality
```

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in test files
2. **Puppeteer fails**: Ensure Chrome/Chromium is installed
3. **Mock issues**: Check jest.setup.js configuration
4. **Coverage low**: Add tests for uncovered code paths

### Debug Tips

1. Use `console.log` in tests (remove before commit)
2. Run single test files: `npm test -- filename.test.js`
3. Skip tests temporarily: `test.skip()` or `describe.skip()`
4. Focus on specific tests: `test.only()` or `describe.only()`

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure good test coverage (>80%)
3. Test both happy path and error cases
4. Update this README if needed

For more details, see the main project README and developer guide.