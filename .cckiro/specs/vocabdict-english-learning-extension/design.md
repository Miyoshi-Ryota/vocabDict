# VocabDict English Learning Extension - Design Document

## Architecture Overview

### Extension Components
```
┌─────────────────────────────────────────────────────────────┐
│                        Safari Extension                       │
├─────────────────┬───────────────────┬───────────────────────┤
│  Content Script │  Background Script │    Extension Popup    │
│                 │                    │                       │
│  - Text selection│  - Message routing │  - Search interface  │
│  - Context menu │  - Data management │  - Vocabulary lists  │
│  - DOM injection│  - Storage API     │  - Learning mode     │
│                 │  - Notifications   │  - Settings          │
└─────────────────┴───────────────────┴───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Local Storage   │
                    │  (IndexedDB/API)  │
                    └───────────────────┘
```

## Data Models

### 1. Dictionary Entry
```typescript
interface DictionaryEntry {
  word: string;
  pronunciations: Pronunciation[];
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
  examples: string[];
}

interface Pronunciation {
  type: 'US' | 'UK';
  phonetic: string;
}

interface Definition {
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
  meaning: string;
  examples?: string[];
}
```

### 2. Vocabulary Word
```typescript
interface VocabularyWord {
  id: string;
  word: string;
  definitions: Definition[];
  dateAdded: Date;
  lookupCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: Date | null;
  nextReview: Date | null;
  reviewHistory: ReviewRecord[];
  listIds: string[];
}

interface ReviewRecord {
  date: Date;
  result: 'known' | 'unknown' | 'skipped';
  responseTime: number; // milliseconds
}
```

### 3. Vocabulary List
```typescript
interface VocabularyList {
  id: string;
  name: string;
  description?: string;
  wordIds: string[];
  createdDate: Date;
  modifiedDate: Date;
  isDefault: boolean;
  sortOrder?: number;
}
```

### 4. User Settings
```typescript
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  autoAddToList: boolean;
  defaultListId: string;
  dailyReviewReminder: boolean;
  reminderTime?: string; // HH:MM format
  reviewSessionSize: number; // cards per session
  keyboardShortcuts: {
    lookup: string;
    addToList: string;
  };
}
```

### 5. Learning Statistics
```typescript
interface LearningStats {
  totalWords: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: Date | null;
  totalReviews: number;
  accuracyRate: number; // percentage
}
```

## Component Design

### 1. Content Script (content.js)
**Responsibilities:**
- Monitor text selection events
- Inject context menu items
- Create floating lookup widget
- Send selected text to background script

**Key Functions:**
```javascript
- handleTextSelection(event)
- injectContextMenu()
- showFloatingWidget(word, position)
- sendLookupRequest(word)
```

### 2. Background Script (background.js)
**Responsibilities:**
- Central message routing hub
- Data persistence management
- Dictionary lookup logic
- Spaced repetition algorithm
- Browser action handling

**Key Functions:**
```javascript
- handleMessage(request, sender, sendResponse)
- lookupWord(word)
- saveToVocabularyList(word, listId)
- calculateNextReview(word, result)
- syncDataToStorage()
```

### 3. Popup Interface (popup.html/js)
**Layout Structure:**
```
┌────────────────────────────────┐
│  [Search Bar]           [⚙️]    │
├────────────────────────────────┤
│  📚 Dictionary │ 📝 Lists │ 🎯  │
├────────────────────────────────┤
│                                │
│    [Dynamic Content Area]       │
│                                │
│                                │
└────────────────────────────────┘
```

**Views:**
- Dictionary Search View
- Vocabulary Lists View
- Learning Mode View
- Settings View

### 4. Storage Architecture

**IndexedDB Schema:**
```javascript
// Database: vocabdict_db
// Object Stores:
1. dictionary_cache
   - Key: word (string)
   - Indexes: none

2. vocabulary_words
   - Key: id (auto-increment)
   - Indexes: word, dateAdded, nextReview

3. vocabulary_lists
   - Key: id (auto-increment)
   - Indexes: name, isDefault

4. user_settings
   - Key: 'settings' (single record)

5. learning_stats
   - Key: 'stats' (single record)
```

## User Interface Design

### 1. Visual Design System
**Color Palette:**
```css
:root {
  /* Light Theme */
  --primary: #007AFF;        /* Safari blue */
  --secondary: #5856D6;      /* Purple accent */
  --success: #34C759;        /* Green */
  --warning: #FF9500;        /* Orange */
  --danger: #FF3B30;         /* Red */
  --background: #FFFFFF;
  --surface: #F2F2F7;
  --text-primary: #000000;
  --text-secondary: #8E8E93;
  
  /* Dark Theme */
  --dark-background: #1C1C1E;
  --dark-surface: #2C2C2E;
  --dark-text-primary: #FFFFFF;
  --dark-text-secondary: #8E8E93;
}
```

**Typography:**
- System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial
- Sizes: 12px (small), 14px (body), 16px (subtitle), 20px (title)

### 2. Component Library

**Reusable Components:**
```
- Button (primary, secondary, danger variants)
- Card (for word entries, list items)
- SearchBar (with autocomplete)
- TabBar (for navigation)
- Modal (for dialogs)
- Toast (for notifications)
- LoadingSpinner
- EmptyState
- WordCard (flashcard component)
```

### 3. Interaction Patterns

**Dictionary Lookup Flow:**
1. User selects text → Context menu appears
2. User clicks "Look up in VocabDict"
3. Floating widget shows brief definition
4. Click "+" to add to vocabulary list
5. Toast confirms addition

**Learning Mode Flow:**
1. User clicks Learning tab
2. System shows words due for review
3. Card shows word → User thinks → Flips card
4. User marks as known/unknown
5. Next card appears with progress indicator

## Technical Implementation Details

### 1. Spaced Repetition Algorithm
```javascript
function calculateNextReview(currentInterval, result) {
  const intervals = {
    new: 1,      // 1 day
    again: 1,    // Reset to 1 day
    hard: currentInterval * 1.2,
    good: currentInterval * 2.5,
    easy: currentInterval * 4
  };
  
  return Math.min(intervals[result], 180); // Cap at 180 days
}
```

### 2. Dictionary Data Structure
```javascript
// Toy dictionary for prototype (50 common words)
const toyDictionary = {
  "hello": {
    pronunciations: [
      { type: "US", phonetic: "/həˈloʊ/" },
      { type: "UK", phonetic: "/həˈləʊ/" }
    ],
    definitions: [
      {
        partOfSpeech: "noun",
        meaning: "A greeting or expression of goodwill",
        examples: ["She gave him a warm hello."]
      },
      {
        partOfSpeech: "verb",
        meaning: "To greet with 'hello'",
        examples: ["I helloed him from across the street."]
      }
    ],
    synonyms: ["hi", "greetings", "salutations"],
    antonyms: ["goodbye", "farewell"],
    examples: [
      "Hello! How are you today?",
      "She said hello to everyone in the room."
    ]
  },
  // ... 49 more words
};
```

### 3. Message Protocol
```javascript
// Message types between components
const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  GET_WORDS: 'get_words',
  UPDATE_REVIEW: 'update_review',
  GET_SETTINGS: 'get_settings',
  UPDATE_SETTINGS: 'update_settings'
};

// Example message structure
{
  type: MessageTypes.LOOKUP_WORD,
  payload: { word: "hello" },
  sender: "content",
  timestamp: Date.now()
}
```

### 4. Performance Optimizations
- Lazy load dictionary data
- Cache frequently looked up words
- Debounce search input (300ms)
- Virtual scrolling for large vocabulary lists
- Batch storage operations
- Use Web Workers for heavy computations

### 5. Error Handling Strategy
```javascript
class VocabDictError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Error codes
const ErrorCodes = {
  STORAGE_FULL: 'STORAGE_FULL',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_DATA: 'INVALID_DATA',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
};
```

## Security Considerations

1. **Content Security Policy:**
   - No inline scripts
   - No eval() usage
   - Whitelist only necessary permissions

2. **Data Validation:**
   - Sanitize all user inputs
   - Validate data types before storage
   - Escape HTML in displayed content

3. **Permission Minimization:**
   - Only request necessary permissions
   - Use activeTab instead of broad host permissions

## Accessibility Design

1. **Keyboard Navigation:**
   - Tab order follows logical flow
   - All interactive elements keyboard accessible
   - Escape key closes modals/popups

2. **Screen Reader Support:**
   - Proper ARIA labels and roles
   - Live regions for dynamic updates
   - Descriptive button text

3. **Visual Accessibility:**
   - Minimum contrast ratio 4.5:1
   - Focus indicators clearly visible
   - Text resizable up to 200%

## Testing Strategy

1. **Unit Tests:**
   - Spaced repetition algorithm
   - Data model validations
   - Utility functions

2. **Integration Tests:**
   - Message passing between components
   - Storage operations
   - Dictionary lookup flow

3. **E2E Tests:**
   - Complete user workflows
   - Cross-browser compatibility
   - Performance benchmarks

## Development Phases

1. **Phase 1: Core Infrastructure**
   - Set up extension structure
   - Implement storage layer
   - Basic message passing

2. **Phase 2: Dictionary Features**
   - Toy dictionary implementation
   - Lookup functionality
   - Context menu integration

3. **Phase 3: Vocabulary Management**
   - List creation and management
   - Word addition/removal
   - Sorting and filtering

4. **Phase 4: Learning Mode**
   - Flashcard interface
   - Spaced repetition logic
   - Review statistics

5. **Phase 5: Polish and Optimization**
   - UI/UX refinements
   - Performance optimization
   - Bug fixes and testing