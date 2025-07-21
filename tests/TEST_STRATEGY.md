# VocabDict Test Strategy

## Issues with Current Tests

1. **Excessive Mocking**: Tests use completely mocked implementations (MockVocabularyWord, MockVocabularyList, etc.) instead of testing real code
2. **False Positives**: All tests pass even when features don't work (e.g., right-click context menu)
3. **No Real Integration**: Tests don't verify actual browser extension behavior
4. **Isolated Testing**: Tests don't catch issues that arise from component interactions

## Refactoring Strategy

### 1. Unit Tests - Test Real Code, Not Mocks

**models.test.js**
- Import actual models from `models.js` instead of mock versions
- Only mock external dependencies (browser APIs, database)
- Test actual model behavior and business logic

**database.test.js**
- Use real IndexedDB implementation (in-memory for tests)
- Test actual database operations
- Mock only browser-specific APIs

### 2. Integration Tests - Test Component Interactions

**handlers.test.js**
- Test real message handlers with real models
- Mock only the browser runtime messaging API
- Verify handler logic with actual data flow

**content-script-integration.test.js**
- Test content script with actual DOM manipulation
- Mock browser.runtime.sendMessage but verify correct calls
- Test widget creation, positioning, and interactions

### 3. E2E Tests - Test User Workflows

**context-menu.e2e.test.js**
- Test right-click context menu flow
- Verify message passing between content script and background
- Test widget display after context menu click

**lookup-flow.e2e.test.js**
- Test complete word lookup flow
- Verify dictionary lookup, caching, and display
- Test error handling for network issues

### 4. Test Utilities

Create shared test utilities:
- `setupBrowserMocks.js` - Minimal browser API mocks
- `testDatabase.js` - In-memory database for tests
- `domHelpers.js` - DOM setup and manipulation helpers

## Implementation Plan

1. **Phase 1: Fix Unit Tests**
   - Refactor models.test.js to use real models
   - Update database.test.js to use real IndexedDB
   - Remove unnecessary mocks

2. **Phase 2: Add Integration Tests**
   - Create handler integration tests
   - Add content script integration tests
   - Test message passing flows

3. **Phase 3: Add E2E Tests**
   - Implement context menu E2E test
   - Add lookup flow E2E test
   - Test error scenarios

4. **Phase 4: Clean Up**
   - Remove unused mock files
   - Update test documentation
   - Add CI/CD test coverage reporting

## Key Principles

1. **Test Real Code**: Always test actual implementations
2. **Mock Boundaries**: Only mock external APIs (browser, network)
3. **Test User Flows**: Focus on real user scenarios
4. **Verify Integration**: Test component interactions
5. **Fast Feedback**: Keep tests fast but comprehensive

## Success Criteria

- Tests fail when actual code is broken
- Context menu functionality is properly tested
- All user workflows have test coverage
- Tests run quickly and reliably
- Clear separation between unit, integration, and E2E tests