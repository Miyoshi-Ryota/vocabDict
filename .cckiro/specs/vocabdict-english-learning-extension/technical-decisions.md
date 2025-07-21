# VocabDict Safari Extension - Implementation Notes

## Last Updated: 2025-07-20

## Overview
This document captures the actual implementation details, technical decisions, workarounds, and known issues discovered during the development of VocabDict Phase 1 and Phase 2.

## Technical Decisions Made

### 1. Single-File Architecture → Multi-File Architecture (Updated 2025-07-20)
**Original Decision**: Consolidate all JavaScript into large single files rather than modules

**Issue**: Safari extensions don't support ES6 modules (`import`/`export` statements)

**Investigation Results**:
- ES6 modules (`type="module"`) are NOT supported in Safari extension service workers (tested 2025-07-20)
- `import` and `export` statements fail with "The background content failed to load due to an error"
- Dynamic imports (`import()`) also fail
- Claude Opus claimed support exists, but testing proved otherwise
- This is a WebExtensions API limitation in Safari, not a bug

**Current Solution**: Multiple files loaded sequentially via manifest.json
```json
"background": {
    "scripts": [
        "constants.js",   // Configuration and enums
        "models.js",      // Data model classes
        "database.js",    // Database operations
        "dictionary.js",  // Toy dictionary data
        "handlers.js",    // Message handlers
        "init.js"         // Initialization and routing
    ],
    "persistent": false
}
```

**Implementation Details**:
- Split monolithic `background.js` (1115 lines) into logical files:
  - `constants.js` (71 lines) - Constants and configuration
  - `models.js` (170 lines) - Data model classes
  - `database.js` (344 lines) - Database operations
  - `handlers.js` (279 lines) - Message handlers
  - `init.js` (247 lines) - Initialization logic
- Files share data via global scope (no modules)
- Loading order matters - dependencies must load first
- Xcode project.pbxproj updated with membershipExceptions for all new files

**Trade-offs**:
- ✅ Better code organization and maintainability
- ✅ Works reliably in Safari
- ✅ Easier to debug specific functionality
- ✅ Reduced cognitive load per file
- ✅ Can still find code by functionality
- ❌ No module encapsulation (everything is global)
- ❌ Must manually manage loading order
- ❌ Risk of global namespace pollution

### 2. Database Design Simplification
**Decision**: Remove bidirectional relationship between words and lists

**Original Design**:
```javascript
// Word tracked which lists it belonged to
word.listIds = ['list1', 'list2']
// AND list tracked which words it contained
list.wordIds = ['word1', 'word2']
```

**New Design**:
```javascript
// Only lists track their words
list.wordIds = ['word1', 'word2']
// Words don't track lists
```

**Rationale**:
- Eliminated synchronization bugs
- Simpler data model
- Single source of truth
- Easier to maintain consistency

### 3. Service Worker vs Background Page
**Decision**: Use service worker instead of persistent background page

**Rationale**:
- Safari moving away from persistent background pages
- Better performance and memory usage
- Future-proof architecture

**Challenges**:
- Service worker can be terminated
- Need to handle reinitialization
- State doesn't persist in memory

### 4. IndexedDB Direct Usage
**Decision**: Use IndexedDB API directly instead of browser.storage

**Rationale**:
- Better performance for complex queries
- More control over data structure
- Supports indexes for efficient lookups
- Larger storage capacity

**Implementation Details**:
- Database name: `vocabdict_db`
- Version: 1
- Object stores: dictionary_cache, vocabulary_words, vocabulary_lists, user_settings, learning_stats

### 5. Message Passing Protocol
**Decision**: Centralized message handling with type constants

**Implementation**:
```javascript
const MessageTypes = {
    LOOKUP_WORD: 'lookup_word',
    ADD_WORD: 'add_word',
    // ... 21 total message types
};

// Centralized handler registration
messageHandlers.set(MessageTypes.LOOKUP_WORD, handleLookupWord);
```

**Benefits**:
- Type safety through constants
- Easy to add new message types
- Central place to see all communications

## Workarounds Implemented

### 1. Safari Import Issues
**Problem**: ES6 imports not working in extension context

**Workaround**:
```javascript
// Instead of ES6 modules:
// import { VocabularyWord } from './models.js';
// export class VocabularyWord { ... }

// We use global scope with sequential loading:
// In models.js:
class VocabularyWord {
    // Defined globally
}

// In database.js (loaded after models.js):
// Can use VocabularyWord directly
```

### 2. Content Script Context Issues
**Problem**: Content scripts can't directly access extension APIs

**Workaround**:
- All storage operations go through background script
- Message passing for all data operations
- No direct IndexedDB access from content script

### 3. Context Menu Handler Scope Issues ✅ FIXED (2025-07-21)
**Problem**: Context menu handler function was defined but not globally accessible in service worker

**Error Seen**: Context menu clicks not triggering any action, no handler found

**Root Cause**: 
```javascript
// Function was defined but not attached to global scope
function handleContextMenuClick(info, tab) { ... }
// Service worker couldn't access it when context menu clicked
```

**Solution Applied**:
```javascript
// Attach to both globalThis and window for compatibility
if (typeof globalThis !== 'undefined') {
    globalThis.handleContextMenuClick = handleContextMenuClick;
} else if (typeof window !== 'undefined') {
    window.handleContextMenuClick = handleContextMenuClick;
}
```

### 4. Floating Widget Event Handling
**Problem**: Click events on floating widget buttons were closing the widget

**Workaround**:
```javascript
// Prevent event bubbling
addBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await addToVocabularyList(definition);
});
```

### 5. Async Message Response
**Problem**: Safari requires synchronous return for async message handlers

**Workaround**:
```javascript
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({status: 'error', error: error.message}));
    
    return true; // Indicates async response
});
```

### 6. Theme Persistence
**Problem**: CSS variables don't persist across popup closes

**Workaround**:
- Store theme in localStorage
- Apply on every popup load
- Use data-theme attribute on root element

## Known Issues and TODOs

### Critical Issues

1. **Settings Persistence Bug** ✅ FIXED (2025-07-20)
   - **Issue**: UserSettings not properly serializing
   - **Error**: `settings.toJSON is not a function`
   - **Fix Applied**: Added defensive checks in updateSettings method to handle UserSettings instances, plain objects, and objects without toJSON method

2. **Missing List UI** ✅ FIXED (2025-07-20)
   - **Issue**: My Lists tab only shows placeholder
   - **Fix Applied**: Implemented full list display with word items, definitions, and removal functionality

3. **Console Context Issues**
   - **Issue**: Running commands in webpage console fails
   - **TODO**: Document that commands must run in popup console

### Important Issues

1. **Keyboard Shortcuts Implementation** ✅ FIXED (2025-07-21)
   - **Issue**: Keyboard shortcuts were defined in manifest but no handler existed
   - **Fix Applied**: Added browser.commands.onCommand listener in init.js with proper message handling

2. **Duplicate Context Menu Items**
   - **Issue**: Sometimes shows multiple "Look up" items
   - **TODO**: Better cleanup on context menu creation

3. **No Visual Word Count**
   - **Issue**: Lists don't show how many words they contain
   - **TODO**: Add word count badges to lists

### Minor Issues

1. **Debug Code Remains**
   - Multiple console.log statements
   - TODO: Add build process to strip debug code

2. **No Loading States**
   - Some async operations lack visual feedback
   - TODO: Add consistent loading indicators

3. **Memory Management** ✅ FIXED (2025-07-20)
   - **Issue**: Event listeners might accumulate
   - **Fix Applied**: Added cleanup handlers in content script with page navigation detection

## Performance Optimizations Applied

1. **Debounced Search**
   - 300ms delay on dictionary search input
   - Prevents excessive API calls

2. **Cached Dictionary Lookups**
   - Store results in IndexedDB
   - 24-hour cache expiry
   - Reduces repeated lookups

3. **Lazy Database Initialization**
   - Database only opens when needed
   - Prevents slow extension startup

## Security Measures

1. **HTML Escaping**
   ```javascript
   function escapeHtml(text) {
       const div = document.createElement('div');
       div.textContent = text;
       return div.innerHTML;
   }
   ```

2. **Content Security Policy**
   - No inline scripts
   - No eval usage
   - Restricted permissions

3. **Input Validation**
   - Word length limits (2-50 characters)
   - Alphabetic content validation
   - Sanitized before storage

## Development Patterns Established

### 1. Message Handler Pattern
```javascript
async function handleSomeAction({ param1, param2 }) {
    // Validate inputs
    if (!param1) throw new Error('param1 required');
    
    // Perform action
    const result = await someOperation(param1, param2);
    
    // Return result
    return result;
}
```

### 2. Database Operation Pattern
```javascript
async function databaseOperation() {
    if (!db || !db.db) {
        throw new Error('Database not initialized');
    }
    
    try {
        // Perform operation
        return await db.someMethod();
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}
```

### 3. UI Update Pattern
```javascript
function updateUI(data) {
    // Clear existing content
    container.innerHTML = '';
    
    // Build new content
    const html = buildHTML(data);
    
    // Update DOM
    container.innerHTML = html;
    
    // Attach event listeners
    attachEventListeners();
}
```

## Lessons Learned

1. **Safari Extension Constraints**
   - Module system limitations require creative solutions
   - Service workers have different lifecycle than background pages
   - Testing must be done in actual Safari, not just Chrome

2. **State Management**
   - Centralized state in background script works well
   - Message passing adds complexity but ensures consistency
   - IndexedDB is reliable for persistence

3. **UI/UX Considerations**
   - Users expect immediate feedback
   - Floating widgets need careful positioning
   - Theme switching should be instant

4. **Testing Challenges**
   - Console context matters for debugging
   - Some issues only appear in production
   - Need automated tests desperately

## Next Technical Steps

1. **Testing Framework**
   - Add Jest for unit tests
   - Puppeteer for E2E tests
   - Mock browser APIs

2. **Error Tracking**
   - Implement proper logging
   - Add error reporting
   - Track user actions for debugging

3. **Performance Monitoring**
   - Add timing measurements
   - Track memory usage
   - Monitor database size

4. **Build Process Considerations**
   - Current multi-file approach works well
   - Consider bundling only if performance issues arise
   - Keep global scope organized with namespacing

## Code Snippets for Common Tasks

### Adding a New Message Handler
```javascript
// 1. Add to MessageTypes
const MessageTypes = {
    // ...
    NEW_ACTION: 'new_action',
};

// 2. Create handler function
async function handleNewAction({ param }) {
    // Implementation
    return result;
}

// 3. Register handler
messageHandlers.set(MessageTypes.NEW_ACTION, handleNewAction);
```

### Adding a New Database Model
```javascript
class NewModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        // ... other properties
    }
    
    generateId() {
        return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    toJSON() {
        return {
            id: this.id,
            // ... other properties
        };
    }
}
```

### Adding a New UI Component
```javascript
function renderNewComponent(data) {
    const html = `
        <div class="component">
            ${escapeHtml(data.title)}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach events
    container.querySelector('.component').addEventListener('click', handleClick);
}
```

## Update (2025-07-21) - Context Menu and Testing Fixes

### Context Menu Functionality Fixed:
**Issue**: Right-click context menu "Look up in VocabDict" was not working despite tests passing
**Root Cause**: Multiple related issues:
1. handleContextMenuClick function not globally accessible in service worker
2. Message type inconsistency (string literals vs constants in content script)
3. Missing keyboard shortcut command handler

**Fixes Applied**:
1. **Handler Scope**: Added proper global scope attachment for context menu handler
2. **Message Types**: Replaced all string literals with MessageTypes constants in content.js
3. **Keyboard Handler**: Added browser.commands.onCommand listener in init.js
4. **Content Script**: Fixed SELECTION_LOOKUP message handling for context menu integration

### Testing Framework Improvements:
**Issue**: Tests were passing despite broken functionality due to excessive mocking
**Root Cause**: Complete mock implementations instead of testing real code

**Solution Applied**:
1. **Real Implementation Tests**: Created tests/unit/models.real.test.js using actual model classes
2. **Minimal Browser Mocks**: Only mock browser APIs, not business logic (tests/helpers/browserMocks.js)
3. **Integration Tests**: Test actual message passing and context menu flows
4. **Mock Boundaries**: Mock external dependencies (browser APIs) but test real implementations

### Service Worker Compatibility:
**Issue**: Some code used window-specific APIs in service worker context
**Solution**: Added globalThis compatibility checks throughout codebase

This implementation has been a learning experience in working within Safari's constraints while maintaining code quality and functionality, with particular focus on proper testing practices and cross-context compatibility.