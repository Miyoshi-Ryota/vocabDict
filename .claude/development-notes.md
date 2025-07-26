# VocabDict Development Notes

## Project Structure
- Using Xcode's Safari Extension App template
- Extension files are in `Shared (Extension)/Resources/`
- Manifest v3 is already set up
- Icons and basic popup structure exist

## Important Discoveries

### Safari Extension Specifics
- Safari extensions use `browser.*` APIs, not `chrome.*`
- ES6 modules are NOT supported in Safari extensions (use webpack bundling)
- Content scripts need explicit permissions in manifest
- Use `service_worker` instead of `scripts` in manifest v3 background
- No `persistent` key in manifest v3

### Build Process
1. Run webpack to build JS files: `npm run build:dev`
2. Files output directly to `Shared (Extension)/Resources/`
3. Build in Xcode (no dist folder needed)
4. All resources must be listed in Xcode project file

### Xcode Configuration
- Add all resource files to membershipExceptions
- Include: _locales, images, manifest.json, all JS files, data folder
- Use folder references (blue) for folders
- Individual files should be explicitly listed

## Best Practices
- Keep commits small and atomic
- Test on both macOS and iOS regularly
- Use Detroit School TDD (minimal mocking)
- Run `./scripts/build-extension.sh` for quick builds

## Testing
- Unit tests: 87 tests passing (Day 3)
- Integration tests: 6 comprehensive workflow tests
- Coverage: StorageManager, constants, dictionary, vocabulary list, message handler, spaced repetition
- Mock only browser APIs, use real implementations elsewhere
- Detroit School TDD: Test real behaviors, not implementation details

## Debugging Safari Extensions
- Enable Developer mode in Safari
- Use Develop menu to inspect:
  - Background content (service worker)
  - Popup (right-click → Inspect)
  - Content scripts (in page console)

## File Structure Decisions
- Source files in `src/` directory
- Webpack builds to `Shared (Extension)/Resources/`
- No intermediate dist folder (causes Xcode issues)
- Keep manifest paths simple (no subdirectories)

## Day 3 Insights - Background Service Architecture

### Message Handler Pattern
- Centralized message handling in `message-handler.js`
- All services passed as dependencies for testability
- Consistent error handling with try-catch wrapper
- Returns `{ success: boolean, data?: any, error?: string }`

### Service vs Model Distinction
- **Services**: Business logic and operations (e.g., SpacedRepetition)
- **Models**: Would be pure data structures (not currently used)
- VocabularyList is a service because it manages state and operations
- SpacedRepetition is a service because it contains algorithms

### In-Memory Storage for Testing
Instead of mocking, implemented real storage behavior:
```javascript
const inMemoryStorage = {};
global.browser = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        // Real implementation mimicking browser.storage
      })
    }
  }
};
```

### Integration Testing Best Practices
1. Test complete user workflows (lookup → add → review)
2. Use real service implementations
3. Verify data persistence across operations
4. Test concurrent operations and edge cases
5. Ensure data integrity throughout

### Key Architectural Decisions
1. Dictionary is single source of truth for definitions
2. VocabularyList only stores user-specific data
3. Message types defined as constants for type safety
4. Async/await throughout for better error handling
5. Normalized word keys (lowercase) for consistency