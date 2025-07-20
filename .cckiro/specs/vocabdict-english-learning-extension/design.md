# VocabDict English Learning Extension - Design Document

## Last Updated: 2025-07-20

## Architecture Overview (Actual Implementation)

### Extension Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Safari Extension                           │
├─────────────────┬───────────────────┬───────────────────────┤
│  Content Script │  Background Script │    Extension Popup    │
│   content.js    │   background.js    │    popup.js/html      │
│                 │  (Service Worker)   │                       │
│  - Text selection│  - Message routing │  - Search interface  │
│  - Context menu │  - Data management │  - Dictionary view   │
│  - Floating     │  - Storage API     │  - Lists (pending)   │
│    widget       │  - All core logic  │  - Settings          │
└─────────────────┴───────────────────┴───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    IndexedDB      │
                    │  vocabdict_db v1  │
                    └───────────────────┘
```

### Key Architecture Changes from Original Design:
1. **Monolithic Files**: Instead of modular architecture, using single large files
2. **Service Worker**: Background script runs as service worker, not persistent page  
3. **Direct IndexedDB**: Using IndexedDB directly instead of browser.storage wrapper
4. **Simplified Data Flow**: Removed bidirectional relationships

## Data Models (As Implemented)

### 1. Dictionary Entry (Unchanged)
```javascript
// Structure in TOY_DICTIONARY and dictionary.js
{
  word: string,
  pronunciations: [
    { type: 'US' | 'UK', phonetic: string }
  ],
  definitions: [
    {
      partOfSpeech: string,
      meaning: string,
      examples: [string]
    }
  ],
  synonyms: [string],
  antonyms: [string],
  examples: [string]
}
```

### 2. VocabularyWord (Simplified)
```javascript
class VocabularyWord {
  id: string;              // auto-generated
  word: string;
  definitions: Definition[];
  dateAdded: Date;
  lookupCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: Date | null;
  nextReview: Date | null;
  reviewHistory: ReviewRecord[];
  // REMOVED: listIds - no longer tracking
}
```

### 3. VocabularyList (Updated)
```javascript
class VocabularyList {
  id: string;
  name: string;
  description?: string;
  wordIds: string[];      // One-way relationship
  createdDate: Date;
  modifiedDate: Date;
  isDefault: boolean;
  sortOrder: number;
}
```

### 4. UserSettings (Implemented)
```javascript
class UserSettings {
  theme: 'light' | 'dark' | 'auto';
  autoAddToList: boolean;
  defaultListId: string | null;
  dailyReviewReminder: boolean;
  reminderTime: string;    // HH:MM format
  reviewSessionSize: number;
  keyboardShortcuts: {
    lookup: string;
    addToList: string;
  };
}
```

### 5. LearningStats (Structure Ready)
```javascript
class LearningStats {
  totalWords: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: Date | null;
  totalReviews: number;
  accuracyRate: number;
}
```

## Component Implementation Details

### 1. Content Script (content.js)
**Actual Implementation:**
- Text selection monitoring with debouncing
- Floating widget with mini dictionary view
- Smart positioning algorithm
- Event handling with propagation prevention
- Message passing to background script

**Key Functions Implemented:**
```javascript
- handleTextSelection(event)
- showFloatingWidget(word, position) 
- showDefinitionWidget(definition, position)
- addToVocabularyList(definition)
- hideFloatingWidget()
```

### 2. Background Script (background.js)
**Actual Implementation:**
- Monolithic file containing all core logic
- Service worker lifecycle management
- 21 message handlers registered
- Database wrapper class
- Model definitions
- Dictionary data (5 words)

**Major Classes/Objects:**
```javascript
- TOY_DICTIONARY          // 5-word dictionary
- MessageTypes           // Message type constants
- VocabularyWord        // Word model
- VocabularyList        // List model
- UserSettings          // Settings model
- LearningStats         // Stats model
- VocabDictDatabase     // Database wrapper
- messageHandlers Map   // Handler registration
```

### 3. Popup Interface (popup.js/html)
**Current Implementation:**
```
┌────────────────────────────────┐
│  VocabDict              [⚙️]    │
├────────────────────────────────┤
│ 📚 Dictionary│📝 Lists│🎯│⚙️    │
├────────────────────────────────┤
│  [Search Input]                 │
│                                 │
│  Dictionary Results:            │
│  - Pronunciations              │
│  - Definitions                 │
│  - Synonyms/Antonyms           │
│  - Examples                    │
│  [+ Add to List]               │
└────────────────────────────────┘
```

**Implemented Views:**
- ✅ Dictionary Search View (fully functional)
- ⚠️ Vocabulary Lists View (placeholder only)
- ❌ Learning Mode View (not started)
- ⚠️ Settings View (UI present, persistence buggy)

### 4. Storage Architecture (Actual)

**IndexedDB Schema Implementation:**
```javascript
Database: vocabdict_db (version 1)

Object Stores:
1. dictionary_cache
   - Key: word (string)
   - Value: { word, entry, cachedAt }
   - No indexes
   - 24-hour expiry

2. vocabulary_words  
   - Key: id (string)
   - Value: VocabularyWord object
   - Indexes: word, dateAdded, nextReview

3. vocabulary_lists
   - Key: id (string)
   - Value: VocabularyList object
   - Indexes: name, isDefault

4. user_settings
   - Key: 'settings' (fixed)
   - Value: UserSettings object
   - Single record store

5. learning_stats
   - Key: 'stats' (fixed)
   - Value: LearningStats object
   - Single record store
```

## Message Protocol (Implemented)

### Message Types
```javascript
const MessageTypes = {
    // Dictionary operations
    LOOKUP_WORD: 'lookup_word',
    CACHE_DICTIONARY_ENTRY: 'cache_dictionary_entry',
    GET_CACHED_ENTRY: 'get_cached_entry',
    
    // Vocabulary word operations
    ADD_WORD: 'add_word',
    ADD_WORD_TO_LIST: 'add_word_to_list',
    GET_WORD: 'get_word',
    GET_ALL_WORDS: 'get_all_words',
    UPDATE_WORD: 'update_word',
    DELETE_WORD: 'delete_word',
    GET_WORDS_DUE_FOR_REVIEW: 'get_words_due_for_review',
    
    // Vocabulary list operations
    ADD_LIST: 'add_list',
    GET_LIST: 'get_list',
    GET_ALL_LISTS: 'get_all_lists',
    UPDATE_LIST: 'update_list',
    DELETE_LIST: 'delete_list',
    GET_DEFAULT_LIST: 'get_default_list',
    REMOVE_WORD_FROM_LIST: 'remove_word_from_list',
    
    // Settings operations
    GET_SETTINGS: 'get_settings',
    UPDATE_SETTINGS: 'update_settings',
    
    // Stats operations
    GET_STATS: 'get_stats',
    UPDATE_STATS: 'update_stats',
    UPDATE_REVIEW_STATS: 'update_review_stats',
    
    // UI operations
    SHOW_NOTIFICATION: 'show_notification',
    OPEN_POPUP: 'open_popup',
    CONTEXT_MENU_CLICKED: 'context_menu_clicked',
    
    // Content script operations
    SELECTION_LOOKUP: 'selection_lookup',
    SHOW_FLOATING_WIDGET: 'show_floating_widget',
    HIDE_FLOATING_WIDGET: 'hide_floating_widget'
};
```

### Message Structure
```javascript
// Request
{
    type: MessageTypes.LOOKUP_WORD,
    payload: { word: "hello" }
}

// Response
{
    status: 'success' | 'error',
    data?: any,
    error?: string
}
```

## UI/UX Implementation

### Visual Design System (Implemented)
```css
/* CSS Variables in use */
:root {
    --primary-color: #007AFF;
    --secondary-color: #5AC8FA;
    --success-color: #34C759;
    --warning-color: #FF9500;
    --danger-color: #FF3B30;
    --background-color: #FFFFFF;
    --surface-color: #F2F2F7;
    --text-primary: #000000;
    --text-secondary: #6C6C70;
    --border-color: #C6C6C8;
}

[data-theme="dark"] {
    --background-color: #000000;
    --surface-color: #1C1C1E;
    --text-primary: #FFFFFF;
    --text-secondary: #8E8E93;
    --border-color: #38383A;
}
```

### Implemented Components
1. **Search Bar**: With real-time lookup
2. **Word Cards**: Display dictionary entries
3. **Tab Navigation**: 4-tab interface
4. **Loading Spinner**: For async operations
5. **Toast Notifications**: Success feedback
6. **Floating Widget**: For in-page lookups
7. **Theme Switcher**: Light/Dark/Auto modes

### Interaction Patterns (Actual)

**Dictionary Lookup Flow:**
1. User types in search box → 300ms debounce
2. Background script looks up word
3. Results display with full information
4. "Add to List" button shows
5. Click adds to default list
6. Button shows "✓ Added" feedback

**Content Script Flow:**
1. User selects text on page
2. Right-click → "Look up in VocabDict"
3. Floating widget appears with definition
4. Can click "Add" or "More"
5. Widget dismisses on outside click

## Technical Implementation Status

### Completed Features

1. **Dictionary System**
   - 5-word toy dictionary
   - Full lookup functionality
   - Caching mechanism
   - Search interface

2. **Storage Layer**
   - IndexedDB integration
   - All CRUD operations
   - Automatic initialization
   - Error handling

3. **Message System**
   - 21 message types
   - Centralized routing
   - Error handling
   - Async support

4. **UI Components**
   - Dictionary search
   - Theme switching
   - Responsive design
   - Loading states

### Pending Features

1. **Vocabulary Lists UI**
   - List display component
   - Word management interface
   - Sorting and filtering

2. **Learning Mode**
   - Flashcard interface
   - Spaced repetition algorithm
   - Review statistics

3. **Advanced Features**
   - Import/Export
   - Keyboard shortcuts
   - iOS optimizations

## Performance Characteristics

### Current Metrics
- Initial load: ~200ms
- Dictionary lookup: <100ms (cached)
- Theme switch: Instant
- Database operations: <50ms

### Optimizations Applied
- Debounced search input
- Cached dictionary lookups
- Lazy database initialization
- Event delegation

### Known Performance Issues
- Large background.js file (1115 lines)
- No code splitting
- DOM manipulation could be optimized

## Security Implementation

### Implemented Measures
- HTML escaping for all user input
- Content Security Policy
- No eval() or inline scripts
- Permission minimization

### Security Considerations
- Input validation on all handlers
- Sanitization before storage
- Secure message passing

## Development Patterns Established

### Handler Pattern
```javascript
async function handleAction(payload) {
    // Validate
    if (!payload.required) {
        throw new Error('Missing required field');
    }
    
    // Process
    const result = await someOperation(payload);
    
    // Return
    return result;
}
```

### Database Operation Pattern
```javascript
async function dbOperation() {
    if (!db?.db) {
        throw new Error('Database not initialized');
    }
    
    return await db.method();
}
```

### UI Update Pattern
```javascript
function updateView(data) {
    container.innerHTML = '';
    const html = buildHTML(data);
    container.innerHTML = html;
    attachEventListeners();
}
```

## Future Considerations

### Technical Debt to Address
1. Split monolithic files
2. Add build process
3. Implement tests
4. Add TypeScript/JSDoc

### Feature Roadmap
1. Complete vocabulary list UI
2. Implement learning mode
3. Add import/export
4. iOS optimization
5. Performance improvements

### Architectural Improvements
1. Module bundler setup
2. State management library
3. Component framework
4. Testing framework

This updated design document reflects the actual implementation as of Phase 2 completion, including all deviations from the original plan and lessons learned during development.