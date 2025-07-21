# VocabDict Testing Guide

This directory contains comprehensive tests for the VocabDict Safari Extension, focused on real implementation testing with minimal mocking.

## Test Philosophy

The tests prioritize:
- **Real Implementations**: Tests use actual code instead of extensive mocks
- **Safari-specific Testing**: Manual testing guides for Safari-specific functionality
- **Minimal Mocking**: Only mock browser APIs that cannot be tested in Node environment
- **Data Integrity**: Use fake-indexeddb to test real database operations

## Test Structure

```
tests/
├── unit/                     # Unit tests for individual components
│   ├── models.test.js       # Test real data models (VocabularyWord, etc.)
│   ├── database.test.js     # Test real database operations with fake IndexedDB
│   └── handlers.test.js     # Test real message handlers
├── integration/             # Integration tests for component interaction
│   ├── contentScript.test.js  # Test real content script with JSDOM
│   ├── messagePasssing.test.js # Test real message flow between components
│   ├── storage.test.js      # Test real data persistence and complex operations
│   └── contextMenu.test.js  # Context menu integration tests
├── manual/                  # Manual testing guides for Safari
│   ├── content-script-testing.md # Manual content script testing procedures
│   ├── popup-testing.md     # Manual popup interface testing procedures
│   └── safari-extension-testing.md # Safari-specific extension testing
├── setup/                   # Test configuration (simplified)
│   └── jest.simplified.setup.js # Minimal setup with real implementation focus
├── helpers/                 # Test utilities and browser mocks
│   └── browserMocks.js     # Minimal browser API mocks
├── fixtures/               # Test data and fixtures
│   └── testData.js         # Sample vocabulary data and test helpers
└── README.md              # This file
```

## Running Tests

### All Automated Tests
```bash
npm test                   # Run all unit and integration tests
# or
npm run test:all          # Run unit and integration tests separately
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only (models, database, handlers)
npm run test:integration   # Integration tests only (message flow, storage)
```

### With Coverage
```bash
npm run test:coverage      # Generate code coverage report
```

### Watch Mode
```bash
npm run test:watch
```

## Manual Testing for Safari

Since Puppeteer only supports Chrome and the extension is built for Safari, manual testing guides are provided for Safari-specific functionality:

### Content Script Testing
```bash
# Open the manual testing guide
open tests/manual/content-script-testing.md
```
- Text selection and widget display
- Context menu integration
- Keyboard shortcuts
- Cross-page compatibility

### Popup Interface Testing
```bash
# Open the manual testing guide  
open tests/manual/popup-testing.md
```
- UI interactions and navigation
- Data management (words, lists, settings)
- Theme switching and persistence

### Safari Extension Testing
```bash
# Open the Safari-specific testing guide
open tests/manual/safari-extension-testing.md
```
- Extension loading from Xcode
- Safari API compatibility
- Performance and security testing

## Test Categories

### Unit Tests (Automated)
Test individual functions and classes using **real implementations**:
- Real VocabularyWord, VocabularyList models with actual business logic
- Real VocabDictDatabase with fake IndexedDB for testing persistence
- Real message handlers with actual error handling and validation
- Spaced repetition algorithms and date calculations

### Integration Tests (Automated)
Test component interactions using **real implementations**:
- Real message passing between content script and background using actual handlers
- Real content script functionality with JSDOM environment
- Real database operations with complex transactions and relationships
- Real storage persistence testing across multiple database instances

### Manual Tests (Safari-Specific)
Test complete user workflows in actual Safari environment:
- Popup interface interactions in real Safari extension context
- Content script text selection and widget display on real websites
- Context menu and keyboard shortcuts in Safari
- Extension installation, permissions, and updates

## Real Implementation Testing Approach

### What We Test With Real Code
- **Data Models**: Actual VocabularyWord and VocabularyList classes
- **Database Operations**: Real VocabDictDatabase with fake-indexeddb
- **Message Handlers**: Actual handler functions from handlers.js
- **Content Script Logic**: Real content.js functionality with JSDOM
- **Business Logic**: Spaced repetition, difficulty calculation, stats tracking

### What We Mock Minimally
- **Browser APIs**: Only `browser.runtime.sendMessage` and `browser.storage`
- **Network Requests**: Dictionary API calls (since we test business logic, not external APIs)
- **DOM APIs**: Minimal JSDOM setup for content script testing

## Test Data and Fixtures

The `fixtures/testData.js` file contains:
- Sample vocabulary words with real definition structures
- Sample vocabulary lists for relationship testing
- Test helpers for creating valid data objects
- Constants used across the real codebase

## Coverage

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

Coverage focuses on **real implementation code**, not mocks.

## Debugging Tests

### In VSCode
1. Set breakpoints in test files or real implementation files
2. Use "Debug Jest Tests" launch configuration
3. Debug the actual code path, not mocked functions

### Command Line
```bash
node --inspect-brk node_modules/.bin/jest --runInBand [test-file]
```

## Writing New Tests

### Real Implementation Unit Test Example
```javascript
describe('VocabularyWord Model - Real Implementation', () => {
  let word;

  beforeEach(() => {
    // Use real VocabularyWord class
    word = new VocabularyWord({
      word: 'test',
      definitions: [{
        partOfSpeech: 'noun',
        meaning: 'A test word',
        examples: []
      }]
    });
  });

  test('should calculate next review correctly', () => {
    const nextReview = word.calculateNextReview(true);
    
    expect(nextReview).toBeInstanceOf(Date);
    expect(word.reviewHistory).toHaveLength(1);
    expect(word.reviewHistory[0].correct).toBe(true);
  });
});
```

### Real Implementation Integration Test Example
```javascript
describe('Message Handler Integration - Real Implementation', () => {
  let db;

  beforeEach(async () => {
    // Use real database with fake IndexedDB
    global.indexedDB = new FDBFactory();
    db = new VocabDictDatabase();
    await db.initialize();
  });

  test('should handle complete word addition flow', async () => {
    // Test actual handler function with real database
    const result = await handleAddWord({
      wordData: {
        word: 'integration',
        definitions: [{ partOfSpeech: 'noun', meaning: 'Testing integration' }]
      }
    });

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^word_\d+_[a-z0-9]+$/);

    // Verify word is actually in database
    const savedWord = await db.getWord(result.id);
    expect(savedWord.word).toBe('integration');
  });
});
```

## Best Practices

1. **Test Real Code**: Import and test actual implementation files
2. **Minimal Mocking**: Only mock external dependencies (browser APIs, network)
3. **Use Real Data**: Test with realistic vocabulary data structures
4. **Test Error Paths**: Verify actual error handling in real code
5. **Integration Focus**: Test how real components work together
6. **Manual Safari Testing**: Use manual guides for Safari-specific functionality

## Troubleshooting

### Common Issues
- **Import Errors**: Ensure real implementation files are properly imported
- **IndexedDB Issues**: Check that fake-indexeddb is properly set up
- **Browser API Errors**: Verify minimal browser mocks are in place
- **Test Data**: Use TestHelpers to create valid test data structures

### Debug Real Implementation Issues
1. Set breakpoints in actual implementation files (not test files)
2. Step through real code execution paths
3. Verify real data flows and transformations
4. Check actual error handling and validation logic

## Running Tests in Development

### Quick Test Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test database.test.js

# Run tests in watch mode
npm run test:watch

# Run with verbose output
npm test -- --verbose

# Run specific test pattern
npm test -- --testNamePattern="should add word"
```

## Test Environment

The test environment includes:
- **Jest testing framework** for running automated tests
- **fake-indexeddb** for testing real database operations
- **JSDOM** for content script testing with minimal DOM mocking
- **Custom matchers** for vocabulary-specific assertions (toBeValidVocabularyWord, etc.)
- **Real implementation imports** using Node.js require/eval

## Continuous Integration

For CI environments:
```bash
npm run test:coverage  # Generate coverage reports for real implementation code
npm run lint           # Check code quality
```

## Debug Tips for Real Implementation Testing

1. **Debug Actual Code**: Set breakpoints in implementation files (models.js, database.js, handlers.js)
2. **Test Real Data Flow**: Follow data through actual business logic, not mocked functions  
3. **Use Realistic Test Data**: Create vocabulary words and lists that match real usage patterns
4. **Focus on Integration**: Test how real components interact, not isolated units
5. **Skip/Focus Tests**: Use `test.skip()` or `test.only()` during development

### Running Single Tests
```bash
# Run specific test file
npm test -- tests/unit/models.test.js

# Run specific test pattern  
npm test -- --testNamePattern="should calculate next review"

# Run tests in specific directory
npm run test:unit
npm run test:integration
```

## Contributing to Tests

When adding new features:
1. **Import Real Code**: Test actual implementation files, not mocks
2. **Test Business Logic**: Focus on algorithms, validation, data transformations
3. **Add Manual Tests**: Create manual testing procedures for Safari-specific features
4. **Maintain Real Implementation Coverage**: Aim for >80% coverage of actual code
5. **Update Guides**: Keep manual testing guides current with feature changes

### Test File Naming Convention
- `*.test.js` - Automated tests using real implementations
- `*.manual.md` - Manual testing guides for Safari browser testing

For more details about the project architecture and development workflow, see the main project README and CLAUDE.md.