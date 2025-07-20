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

1. **Add files to Xcode project**:
   - Right-click on "Shared (Extension)/Resources" in Xcode
   - Select "Add Files to vocabDict..."
   - Select your new .js files
   - Make sure "Copy items if needed" is unchecked (files should already be in the correct location)
   - Ensure the target "vocabDict Extension" is checked

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

#### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Dictionary search works
- [ ] Words can be added to lists
- [ ] Settings persist across sessions
- [ ] Theme switching works
- [ ] Content script text selection works
- [ ] Floating widget displays properly
- [ ] No console errors during normal use

#### Common Test Scenarios
1. **Dictionary Lookup**: Search for "hello", "world", "good", "time", "work"
2. **Add to List**: Add word via popup and floating widget
3. **Settings**: Change theme, toggle settings
4. **Content Script**: Select text on various websites
5. **Database**: Close/reopen extension, check persistence

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