# VocabDict Safari Extension - Developer Guide

## Quick Start

### Prerequisites
- macOS with Xcode installed
- Safari 14.0 or later
- Basic knowledge of JavaScript and Safari extensions

### Building the Extension
1. Open `vocabDict.xcodeproj` in Xcode
2. Select your development team in project settings
3. Build and run (⌘R)
4. Enable the extension in Safari Preferences → Extensions

### Adding New JavaScript Files to the Extension
**Important**: When adding new JavaScript files to the Safari extension, you must:

1. **Update project.pbxproj membershipExceptions**:
   - Open `vocabDict.xcodeproj/project.pbxproj` in a text editor
   - Find both sections:
     - `Exceptions for "Shared (Extension)" folder in "vocabDict Extension (iOS)" target`
     - `Exceptions for "Shared (Extension)" folder in "vocabDict Extension (macOS)" target`
   - Add your new files to both `membershipExceptions` lists in alphabetical order:
   ```
   membershipExceptions = (
       Resources/_locales,
       Resources/constants.js,    // Add new files here
       Resources/content.css,
       ...
   );
   ```

2. **Update manifest.json**:
   - Add the new files to the `background.scripts` array in the correct order
   - Dependencies must be loaded before files that use them
   
3. **File loading order example**:
   ```json
   "background": {
       "scripts": [
           "dictionary.js",      // Data
           "constants.js",       // Constants and config
           "models.js",          // Data model classes
           "database.js",        // Database operations
           "handlers.js",        // Message handlers
           "init.js"            // Initialization (must be last)
       ]
   }
   ```

**Note**: Safari does NOT support ES6 modules in extensions. You must use the global scope for sharing between files.

### Testing the Extension
1. **Popup Testing**: Click extension icon in toolbar
2. **Content Script Testing**: Visit any webpage, select text, right-click
3. **Background Script Debugging**: Safari → Develop → Web Extension Background Content → vocabDict
4. **Console Access**: Right-click popup → Inspect Element

### Key Files to Know
```
background.js - Core logic, database, message handling (1115 lines)
popup.js     - Popup UI logic (378 lines)
content.js   - Text selection and floating widget (448 lines)
dictionary.js - Extended dictionary data (489 lines)
manifest.json - Extension configuration
```

## Project Structure Overview

### Architecture
```
User Interaction
       ↓
   Popup UI ←→ Background Script ←→ IndexedDB
       ↑              ↓
       └─── Content Script
```

### Data Flow
1. **User Action** → Popup/Content Script
2. **Message** → Background Script
3. **Database Operation** → IndexedDB
4. **Response** → UI Update

### Key Components

#### Background Script (background.js)
- **Lines 1-125**: Toy dictionary data
- **Lines 127-180**: Message type constants
- **Lines 183-304**: Data model classes
- **Lines 306-687**: Database wrapper class
- **Lines 689-1106**: Message handlers and initialization

#### Popup Script (popup.js)
- **Lines 1-60**: Tab switching and theme management
- **Lines 63-91**: Dictionary search functionality
- **Lines 93-243**: Dictionary result display
- **Lines 245-308**: Word addition to lists
- **Lines 297-358**: Settings management

#### Content Script (content.js)
- **Lines 1-117**: Text selection handling
- **Lines 119-143**: Message handling from background
- **Lines 164-243**: Floating widget creation
- **Lines 361-406**: Word addition functionality
- **Lines 423-452**: Widget lifecycle management

## Development Patterns

### Adding a New Feature

#### 1. Message Passing Pattern
When adding a new feature that requires background script communication:

```javascript
// Step 1: Add message type to background.js
const MessageTypes = {
    // ... existing types
    YOUR_NEW_ACTION: 'your_new_action'
};

// Step 2: Create handler in background.js
async function handleYourNewAction({ param1, param2 }) {
    // Validate inputs
    if (!param1) {
        throw new Error('param1 is required');
    }
    
    // Perform action
    const result = await db.someOperation(param1, param2);
    
    // Return result
    return result;
}

// Step 3: Register handler in background.js
messageHandlers.set(MessageTypes.YOUR_NEW_ACTION, handleYourNewAction);

// Step 4: Call from popup.js or content.js
const response = await browser.runtime.sendMessage({
    type: 'your_new_action',
    payload: { param1: 'value', param2: 'value' }
});

if (response.status === 'success') {
    // Handle success
    console.log('Result:', response.data);
} else {
    // Handle error
    console.error('Error:', response.error);
}
```

#### 2. Database Operations Pattern
For new data operations:

```javascript
// In VocabDictDatabase class
async yourNewMethod(data) {
    if (!this.db) {
        throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['store_name'], 'readwrite');
        const store = transaction.objectStore('store_name');
        const request = store.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Operation failed'));
    });
}
```

#### 3. UI Component Pattern
For new UI components in popup:

```javascript
// Create render function
function renderYourComponent(data) {
    const container = document.getElementById('your-container');
    
    // Build HTML
    let html = `
        <div class="your-component">
            <h3>${escapeHtml(data.title)}</h3>
            <p>${escapeHtml(data.content)}</p>
            <button class="action-btn">Action</button>
        </div>
    `;
    
    // Update DOM
    container.innerHTML = html;
    
    // Attach event listeners
    container.querySelector('.action-btn').addEventListener('click', handleAction);
}

// Helper function for HTML escaping (already exists)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Storage Access Patterns

#### Reading Data
```javascript
// From popup or content script
const response = await browser.runtime.sendMessage({
    type: 'get_all_words',
    payload: {}
});

if (response.status === 'success') {
    const words = response.data;
    // Use words
}
```

#### Writing Data
```javascript
// Adding a word to list
const response = await browser.runtime.sendMessage({
    type: 'add_word_to_list',
    payload: {
        wordData: {
            word: 'example',
            definitions: [...]
        }
    }
});
```

#### Updating Settings
```javascript
// Get current settings
const settingsResponse = await browser.runtime.sendMessage({
    type: 'get_settings',
    payload: {}
});

// Update settings
const settings = settingsResponse.data;
settings.theme = 'dark';

await browser.runtime.sendMessage({
    type: 'update_settings',
    payload: { settings }
});
```

### Error Handling Patterns

#### In Background Script
```javascript
async function handleSomeAction(payload) {
    try {
        // Validate
        if (!payload.required) {
            throw new Error('Missing required parameter');
        }
        
        // Execute
        const result = await riskyOperation();
        
        return result;
    } catch (error) {
        console.error('Handler error:', error);
        throw error; // Will be caught by message handler
    }
}
```

#### In UI Code
```javascript
try {
    const response = await browser.runtime.sendMessage({
        type: 'some_action',
        payload: data
    });
    
    if (response.status === 'error') {
        showError(response.error);
    } else {
        showSuccess(response.data);
    }
} catch (error) {
    console.error('Communication error:', error);
    showError('Failed to communicate with extension');
}
```

## Contributing Guidelines

### Code Style

#### JavaScript Conventions
- Use `const` for constants, `let` for variables
- Use async/await instead of promises where possible
- Use meaningful variable names
- Add comments for complex logic

#### Naming Conventions
- Functions: `camelCase` (e.g., `handleAddWord`)
- Classes: `PascalCase` (e.g., `VocabularyWord`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MESSAGE_TYPES`)
- CSS classes: `kebab-case` (e.g., `word-card`)

#### CSS Organization
```css
/* Component styles */
.component-name {
    /* Layout */
    display: flex;
    position: relative;
    
    /* Spacing */
    margin: 10px;
    padding: 15px;
    
    /* Visual */
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    
    /* Typography */
    font-size: 14px;
    color: var(--text-primary);
    
    /* Animation */
    transition: all 0.3s ease;
}
```

### Testing Approach

This section provides comprehensive testing scenarios for anyone wanting to verify the extension works correctly. Each test includes step-by-step instructions and expected results.

#### Prerequisites for Testing
1. **Environment Setup**:
   - Safari with extension loaded and enabled
   - Extension icon visible in toolbar
   - Test website open (e.g., Wikipedia, news site, or any text-heavy page)

2. **Access Developer Console**:
   - **Background Script**: Safari → Develop → Web Extension Background Content → vocabDict
   - **Popup Console**: Right-click extension popup → Inspect Element
   - **Content Script**: Regular webpage console (F12 or ⌘⌥I)

#### Core Functionality Tests

##### Test 1: Extension Loading and Initialization
**What to test**: Basic extension startup and configuration
**Steps**:
1. Open Safari
2. Click the VocabDict extension icon in toolbar
3. Check browser console (Safari → Develop → Web Extension Background Content)

**Expected Results**:
```
✅ VocabDict: Starting initialization...
✅ VocabDict: Creating database instance...
✅ VocabDict DB: Opening database...
✅ VocabDict DB: Database opened successfully
✅ VocabDict: Registering message handlers...
✅ VocabDict: Registered handlers: 22 handlers
✅ VocabDict: Context menu created
✅ VocabDict: Extension initialized successfully
```

**If test fails**: Check for JavaScript errors, ensure all files are loaded correctly

##### Test 2: Dictionary Lookup (Popup)
**What to test**: Core dictionary functionality through popup interface
**Steps**:
1. Click extension icon to open popup
2. Type "hello" in search box
3. Wait for results to appear
4. Verify all information displays correctly

**Expected Results**:
- **Word header**: "hello" with phonetic pronunciation (/həˈloʊ/, /həˈləʊ/)
- **Definitions section**: 
  - Noun: "A greeting or expression of goodwill"
  - Verb: "To greet with 'hello'"
- **Examples section**: "Hello! How are you today?", etc.
- **Synonyms**: hi, greetings, salutations
- **Antonyms**: goodbye, farewell
- **"Add to List" button** appears and is clickable

**Test variations**:
- Try other available words: "world", "good", "time", "person", "work", "life"
- Test with unknown word (e.g., "xyz123") - should show "Word not found"
- Test with empty search - should clear results
- Test with very long word - should show appropriate error

##### Test 3: Content Script Text Selection
**What to test**: Text selection and floating widget functionality
**Steps**:
1. Navigate to any webpage with text
2. Select a word that's in the dictionary (e.g., "time", "good")
3. Observe floating widget appearance
4. Click "Add to List" button in widget
5. Click "x" to close widget

**Expected Results**:
- **Widget appears** near selected text within 500ms
- **Widget contains**: Word definition, "Add to List" button, close button
- **Widget positioning**: Doesn't go off-screen, positioned relative to selection
- **Add button**: Successfully adds word (shows success message)
- **Close button**: Widget disappears when clicked
- **Click outside**: Widget disappears when clicking elsewhere

**Test variations**:
- Select text at different screen positions (top, bottom, sides)
- Select very long text passages
- Select text in different HTML elements (paragraphs, headers, lists)
- Test on different websites (news sites, Wikipedia, blogs)

##### Test 4: Context Menu Integration
**What to test**: Right-click context menu functionality
**Steps**:
1. On any webpage, select text containing a dictionary word
2. Right-click on the selected text
3. Look for "Look up '[word]' in VocabDict" option
4. Click the context menu item

**Expected Results**:
- **Context menu item** appears when text is selected
- **Menu text** shows "Look up '[selected text]' in VocabDict"
- **Click action**: Either opens popup with word looked up OR triggers content script widget
- **No errors** in console

##### Test 5: Vocabulary List Management
**What to test**: Creating, viewing, and managing vocabulary lists
**Steps**:
1. Open extension popup
2. Click "My Lists" tab
3. Observe current lists display
4. Add a word to default list via dictionary search
5. Return to My Lists tab and verify word appears

**Expected Results**:
- **My Lists tab**: Shows all vocabulary lists
- **Default list**: "My Vocabulary" appears by default
- **Word addition**: Words added via popup appear in appropriate list
- **Word display**: Each word shows with basic definition
- **Word count**: Lists show accurate word counts
- **Word removal**: Can remove words from lists

**Test variations**:
- Add multiple words to same list
- Try to add duplicate words (should handle gracefully)
- Test with very long word lists (performance)

##### Test 6: Settings and Theme Management
**What to test**: Settings persistence and theme switching
**Steps**:
1. Open extension popup
2. Click Settings tab
3. Change theme from Light to Dark
4. Close popup and reopen
5. Verify theme persisted
6. Test other settings if available

**Expected Results**:
- **Settings tab**: Displays all available options
- **Theme switch**: Immediately applies new theme to popup
- **Persistence**: Settings survive popup close/reopen
- **Visual change**: All UI elements adapt to new theme
- **No errors**: Console shows no theme-related errors

**Test variations**:
- Switch between all available themes (Light, Dark, Auto)
- Close and reopen Safari entirely
- Test theme switching on different pages

#### Advanced Testing Scenarios

##### Test 7: Database Persistence
**What to test**: Data survives browser restarts and extension reloads
**Steps**:
1. Add several words to vocabulary lists
2. Change some settings
3. Completely quit Safari
4. Restart Safari and reload extension
5. Check if all data persists

**Expected Results**:
- **Words persist**: All vocabulary words still in lists
- **Settings persist**: Theme and settings unchanged
- **No data loss**: No missing or corrupted data
- **Clean startup**: Extension initializes without errors

##### Test 8: Error Handling and Edge Cases
**What to test**: Extension behavior under stress and error conditions

**Subtest 8a: Invalid Input Handling**
**Steps**:
1. Search for extremely long text (1000+ characters)
2. Search for special characters: `!@#$%^&*()`
3. Search for empty string
4. Search for numbers only: "12345"

**Expected Results**:
- **Long text**: Appropriate error message or truncation
- **Special chars**: Handled gracefully, no crashes
- **Empty search**: Clears results, no errors
- **Numbers**: Either shows "not found" or finds if valid

**Subtest 8b: Rapid User Actions**
**Steps**:
1. Click rapidly between tabs in popup
2. Type very quickly in search box
3. Click "Add to List" multiple times rapidly
4. Open/close popup rapidly

**Expected Results**:
- **No crashes**: Extension remains responsive
- **No duplicate data**: No duplicate entries created
- **Consistent state**: UI remains in valid state
- **Performance**: No significant slowdown

**Subtest 8c: Network/Storage Issues**
**Steps**:
1. Open browser's Storage tab in Developer Tools
2. Clear IndexedDB manually: `indexedDB.deleteDatabase('vocabdict_db')`
3. Try to use extension
4. Check error handling

**Expected Results**:
- **Graceful degradation**: Extension attempts to reinitialize
- **Error messages**: Clear messages about what went wrong
- **Recovery**: Extension can recover after database recreation

##### Test 9: Cross-Platform Consistency
**What to test**: Extension works the same on different platforms (if available)

**For macOS Safari**:
1. Test all above scenarios on macOS Safari
2. Note any platform-specific behaviors
3. Test keyboard shortcuts (⌘ vs Ctrl)

**For iOS Safari** (if available):
1. Test content script on mobile sites
2. Test touch interactions with floating widget
3. Verify popup works on smaller screens

#### Performance Testing

##### Test 10: Performance and Resource Usage
**What to test**: Extension doesn't slow down browser or use excessive resources

**Steps**:
1. Open Activity Monitor (macOS) or Task Manager
2. Note Safari's memory usage before loading extension
3. Load extension and use all features extensively
4. Monitor memory usage over time
5. Check for memory leaks

**Expected Results**:
- **Memory usage**: Reasonable memory consumption (< 50MB for extension)
- **No memory leaks**: Memory doesn't continuously increase
- **Performance**: No noticeable browser slowdown
- **Database size**: Reasonable storage usage

#### Security Testing

##### Test 11: Security and Data Safety
**What to test**: Extension handles sensitive data appropriately

**Steps**:
1. Inspect extension permissions in Safari preferences
2. Try to access extension from webpage console
3. Check what data is stored and how
4. Test with potential XSS inputs

**Expected Results**:
- **Minimal permissions**: Only necessary permissions requested
- **Isolated execution**: Webpage can't access extension directly
- **Safe storage**: No sensitive data in plain text
- **XSS protection**: HTML properly escaped in all outputs

#### Debugging Common Issues

##### Issue: "No handler registered for message type"
**Diagnosis**:
1. Check background script console for initialization errors
2. Verify message type constants match exactly
3. Ensure handler is registered in `registerMessageHandlers()`

##### Issue: Widget not appearing on text selection
**Diagnosis**:
1. Check content script console for JavaScript errors
2. Verify extension is enabled for current website
3. Test on different websites to isolate issue
4. Check if text selection contains valid words

##### Issue: Settings not saving
**Diagnosis**:
1. Check browser storage permissions
2. Look for database errors in background console
3. Verify UserSettings class methods work correctly
4. Test database transaction completion

##### Issue: Extension icon shows error badge
**Diagnosis**:
1. Check background script console immediately
2. Look for initialization failure messages
3. Verify all required files are present
4. Check Xcode build for file inclusion errors

#### Test Data Recommendations

For comprehensive testing, use these test words (all available in dictionary):
- **Basic words**: hello, world, good, time, work
- **Common words**: person, year, way, day, thing, man, life
- **Longer words**: water, food, house, school, place
- **Edge cases**: eye, hand (short words)

For content script testing, use websites with:
- **Simple text**: Wikipedia articles
- **Complex layouts**: News websites
- **Dynamic content**: Social media sites
- **Different fonts**: Various blog sites

#### Automated Testing Setup (Future)

**Recommended tools for future automated testing**:
1. **Unit tests**: Jest for testing individual functions
2. **Integration tests**: Puppeteer for browser automation
3. **E2E tests**: Selenium for full user flow testing
4. **Performance tests**: Lighthouse for extension performance

**Test file structure recommendation**:
```
tests/
├── unit/
│   ├── database.test.js
│   ├── models.test.js
│   └── handlers.test.js
├── integration/
│   ├── message-passing.test.js
│   └── storage.test.js
└── e2e/
    ├── popup.test.js
    ├── content-script.test.js
    └── full-workflow.test.js
```

This comprehensive testing guide ensures the extension works reliably across all use cases and platforms.

### Adding New Features

#### Step-by-Step Process
1. **Plan the Feature**
   - Define message types needed
   - Design data model changes
   - Sketch UI changes

2. **Implement Backend**
   - Add message types to `MessageTypes`
   - Create handler functions
   - Register handlers
   - Update database operations if needed

3. **Implement Frontend**
   - Add UI components
   - Connect to message handlers
   - Add loading/error states
   - Test user flows

4. **Test Thoroughly**
   - Test happy path
   - Test error cases
   - Test on both macOS and iOS Safari
   - Check console for errors

5. **Document Changes**
   - Update relevant .cckiro documentation
   - Add code comments
   - Update this guide if needed

### Common Issues and Solutions

#### Issue: "No handler registered for message type"
**Solution**: Ensure handler is registered in `registerMessageHandlers()`

#### Issue: Settings not persisting
**Solution**: Check `UserSettings` class and `toJSON()` method

#### Issue: Widget disappears immediately
**Solution**: Add `e.stopPropagation()` to button click handlers

#### Issue: Database not initialized
**Solution**: Ensure `initialize()` completes before operations

#### Issue: Styles not applying
**Solution**: Check CSS specificity and theme variables

### Debugging Tips

1. **Background Script Console**
   - Safari → Develop → Web Extension Background Content
   - Shows initialization logs and errors

2. **Popup Console**
   - Right-click popup → Inspect Element
   - Best for testing message passing

3. **Content Script Console**
   - Regular web page console (F12)
   - Shows content script logs

4. **Database Inspection**
   - In any console: `indexedDB.databases()`
   - Use Application tab in DevTools

5. **Message Tracing**
   - Add logs in message handlers
   - Log both request and response

## How to Update Documentation

### When to Update
- After implementing new features
- When fixing significant bugs
- When changing architecture
- When discovering workarounds

### What to Update
1. **implementation-plan-updated.md**: Mark tasks complete
2. **design-updated.md**: Document architectural changes
3. **implementation-notes.md**: Add technical decisions
4. **code-review.md**: Note new issues or improvements
5. **This guide**: Add new patterns or tips

### Documentation Standards
- Use clear, concise language
- Include code examples
- Explain the "why" not just "what"
- Keep formatting consistent
- Date your updates

## Resources

### Safari Extension Documentation
- [Safari Web Extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

### Technologies Used
- IndexedDB API
- Web Extensions API
- CSS Custom Properties
- ES6+ JavaScript

### Project Links
- Repository: [Your repo here]
- Issues: [Issue tracker]
- Documentation: `.cckiro/specs/`

## FAQ

**Q: Why is everything in one file?**
A: Safari has limitations with ES6 modules in extensions. A build process could solve this.

**Q: How do I add a new word to the dictionary?**
A: Add to `TOY_DICTIONARY` in background.js or the extended dictionary in dictionary.js.

**Q: Why doesn't the extension work in Chrome?**
A: It's built specifically for Safari. Chrome would need manifest v3 adaptations.

**Q: How do I reset the database?**
A: In console: `indexedDB.deleteDatabase('vocabdict_db')` then reload extension.

**Q: Can I use npm packages?**
A: Not directly. You'd need a build process to bundle them.

This guide should help you navigate and contribute to the VocabDict project effectively!