# VocabDict Safari Web Extension - Design Document

## 1. Architecture Overview

### 1.1 Extension Structure (Actual Implementation)
```
VocabDict/
├── src/
│   ├── background/
│   │   ├── background.js      # Service worker for background tasks
│   │   └── message-handler.js # Centralized message handling
│   ├── content/
│   │   └── content.js         # Content script for page integration
│   ├── popup/
│   │   ├── popup.html         # Extension popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styles
│   ├── services/
│   │   ├── dictionary-service.js   # Dictionary lookup logic
│   │   ├── vocabulary-list.js      # Vocabulary list management
│   │   ├── storage.js              # Data persistence layer
│   │   └── spaced-repetition.js    # SRS algorithm service
│   ├── data/
│   │   └── dictionary.json    # Toy dictionary (50+ words)
│   └── utils/
│       └── constants.js       # Shared constants
├── tests/
│   ├── unit/                  # Unit tests (80+ tests)
│   └── integration/           # Integration tests
└── Shared (Extension)/Resources/  # Webpack output directory
```

### 1.2 Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Extension Popup                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Search  │ │  Lists  │ │  Learn  │ │Settings │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Core Services                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Dictionary  │ │  Vocabulary  │ │   Learning   │   │
│  │   Service    │ │   Manager    │ │   Engine     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Storage Layer                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            browser.storage.local                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Data Flow

1. **User Interaction** → Content Script/Popup
2. **Content Script/Popup** → Background Service Worker
3. **Background Service Worker** → Storage Layer
4. **Storage Layer** → Background Service Worker
5. **Background Service Worker** → UI Update

## 2. Core Components Design

### 2.1 Background Service Worker

**Purpose**: Central hub for extension logic, handles all data operations and coordinates between components.

**Key Responsibilities**:
- Dictionary lookups
- Vocabulary list management
- Spaced repetition scheduling
- Context menu creation
- Message routing between components

**Message Handlers**:
```javascript
// Message types
const MessageTypes = {
  LOOKUP_WORD: 'lookup_word',
  ADD_TO_LIST: 'add_to_list',
  GET_LISTS: 'get_lists',
  CREATE_LIST: 'create_list',
  UPDATE_WORD: 'update_word',
  GET_REVIEW_QUEUE: 'get_review_queue',
  SUBMIT_REVIEW: 'submit_review'
};
```

### 2.2 Dictionary Service

**Data Structure**:
```javascript
const dictionary = {
  "hello": {
    word: "hello",
    pronunciation: "/həˈloʊ/",
    definitions: [
      {
        partOfSpeech: "interjection",
        meaning: "used as a greeting or to begin a phone conversation",
        examples: [
          "Hello, how are you?",
          "She said hello to everyone in the room"
        ]
      },
      {
        partOfSpeech: "noun",
        meaning: "an utterance of 'hello'; a greeting",
        examples: [
          "She gave me a warm hello",
          "We exchanged hellos"
        ]
      }
    ],
    synonyms: ["hi", "greetings", "hey", "howdy"],
    antonyms: ["goodbye", "farewell"]
  }
  // ... 50-100 more words
};
```

**Lookup Algorithm**:
1. Normalize input (lowercase, trim)
2. Direct lookup in dictionary
3. If not found, attempt fuzzy matching
4. Return results or suggestions

### 2.3 Vocabulary Manager

**Architecture Principle**: The Dictionary is the single source of truth for word definitions. VocabularyList only stores user-specific data (learning progress, custom notes, etc.) and references the dictionary for word definitions.

**List Structure**:
```javascript
const vocabularyList = {
  id: "uuid",
  name: "My Vocabulary",
  created: "2025-01-26T10:00:00Z",
  isDefault: true,
  words: {
    "hello": {  // Key is normalized word (lowercase)
      word: "hello", // Preserves original case from dictionary
      dateAdded: "2025-01-26T10:00:00Z",
      difficulty: "medium", // easy, medium, hard
      lastReviewed: "2025-01-26T10:00:00Z",
      nextReview: "2025-01-27T10:00:00Z",
      reviewHistory: [
        {
          date: "2025-01-26T10:00:00Z",
          result: "known", // known, unknown, skipped
          timeSpent: 3.5 // seconds
        }
      ],
      customNotes: "Common greeting"
    }
  }
};

// Word definitions come from the dictionary when needed:
const fullWordData = {
  ...dictionaryService.lookup("hello"),  // Definitions, pronunciation, etc.
  ...vocabularyList.words["hello"]       // User-specific data
};
```

**Operations**:
- CRUD operations for lists
- CRUD operations for words within lists
- Sorting and filtering algorithms
- Duplicate detection using word normalization

### 2.4 Learning Engine

**Spaced Repetition Implementation**:
```javascript
class SpacedRepetition {
  static calculateNextReview(currentInterval, result) {
    const intervals = {
      new: 1,
      known: {
        1: 3,
        3: 7,
        7: 14,
        14: 30,
        30: 60
      }
    };
    
    if (result === 'unknown') {
      return 1; // Reset to day 1
    } else if (result === 'known') {
      return intervals.known[currentInterval] || currentInterval * 2;
    }
    return currentInterval; // Skip doesn't change interval
  }
  
  static getReviewQueue(words, maxWords = 30) {
    const now = new Date();
    return words
      .filter(word => new Date(word.nextReview) <= now)
      .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
      .slice(0, maxWords);
  }
}
```

**Review Session State**:
```javascript
const reviewSession = {
  startTime: "2025-01-26T10:00:00Z",
  words: [...], // Words to review
  currentIndex: 0,
  results: {
    known: 0,
    unknown: 0,
    skipped: 0
  },
  completed: []
};
```

## 3. User Interface Design

### 3.1 Extension Popup Layout (Day 4 Implementation)

```html
<!-- Actual popup.html structure -->
<div class="popup-container">
  <header class="header">
    <h1 class="header-title">VocabDict</h1>
    <button class="theme-toggle" aria-label="Toggle theme">
      <span class="theme-icon">🌓</span>
    </button>
  </header>
  
  <nav class="tab-navigation" role="tablist">
    <button class="tab-button active" data-tab="search" role="tab">
      <span class="tab-icon">🔍</span>
      <span class="tab-label">Search</span>
    </button>
    <button class="tab-button" data-tab="lists" role="tab">
      <span class="tab-icon">📚</span>
      <span class="tab-label">Lists</span>
    </button>
    <button class="tab-button" data-tab="learn" role="tab">
      <span class="tab-icon">🎓</span>
      <span class="tab-label">Learn</span>
    </button>
    <button class="tab-button" data-tab="settings" role="tab">
      <span class="tab-icon">⚙️</span>
      <span class="tab-label">Settings</span>
    </button>
  </nav>
  
  <main class="content">
    <!-- Tab panels with dynamic content -->
  </main>
  
  <div class="toast-container" aria-live="polite"></div>
</div>
```

### 3.2 Search Tab Design (Day 4 - Implemented)

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search for a word...     │ │  <- Search input
│ └─────────────────────────────┘ │
│                                 │
│ Recent Searches:                │
│ • philosophy                    │
│ • eloquent                      │
│ • serendipity                   │
├─────────────────────────────────┤
│          Search Result          │
│ ┌─────────────────────────────┐ │
│ │ eloquent /ˈɛləkwənt/    +📚 │ │  <- Add to list button
│ ├─────────────────────────────┤ │
│ │ adj. fluent or persuasive   │ │
│ │ in speaking or writing       │ │
│ │                              │ │
│ │ Synonyms: articulate,        │ │
│ │ expressive, fluent           │ │
│ │                              │ │
│ │ Examples:                    │ │
│ │ • An eloquent speaker        │ │
│ │ • Her eloquent prose         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 3.3 Lists Tab Design (Day 4 - Partially Implemented)

**Note**: Basic structure implemented. Sorting/filtering deferred to Day 5.

```
┌─────────────────────────────────┐
│ My Lists              + New List│
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📁 My Vocabulary (25 words) │ │
│ │ Last updated: 2 hours ago   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📁 Business English (12)    │ │
│ │ Last updated: yesterday     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Sort by: [Most Recent ▼]       │
│ Filter: [All Difficulties ▼]   │
├─────────────────────────────────┤
│ Words in "My Vocabulary":       │
│ ┌─────────────────────────────┐ │
│ │ eloquent          🟡 📝      │ │
│ │ Last reviewed: 2 days ago   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ serendipity       🔴 📝      │ │
│ │ Review due: today           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 3.4 Learn Tab Design (Day 4 - Not Implemented)

**Note**: Tab created but functionality deferred to Day 5.

```
┌─────────────────────────────────┐
│ Daily Review      15 words due  │
├─────────────────────────────────┤
│ Progress: ████████░░░░ 8/15     │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │                              │ │
│ │                              │ │
│ │        serendipity           │ │  <- Flashcard front
│ │                              │ │
│ │                              │ │
│ │      [Tap to flip]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│ │ ❌ │ │ ⏭️  │ │ ✅ │ │ ⭐ │  │  <- Action buttons
│ └────┘ └────┘ └────┘ └────┘  │
│ Unknown  Skip  Known  Master   │
└─────────────────────────────────┘
```

### 3.5 Visual Components (Day 4 Implementation)

#### Toast Notification System (Added beyond plan)
```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.toast {
  background: var(--surface-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.toast.success { border-left: 4px solid var(--success); }
.toast.error { border-left: 4px solid var(--error); }
.toast.warning { border-left: 4px solid var(--warning); }
.toast.info { border-left: 4px solid var(--primary); }
```

#### Settings Tab (Moved from Day 6)
```html
<div id="settings-tab" class="tab-content">
  <h2 class="section-title">Settings</h2>
  
  <div class="settings-section">
    <label class="setting-item">
      <span class="setting-label">Theme</span>
      <select id="theme-select" class="setting-control">
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    
    <label class="setting-item">
      <span class="setting-label">Daily Review Limit</span>
      <input type="number" id="review-limit" min="10" max="100" value="30">
    </label>
  </div>
</div>
```

**Actual CSS Design System (Complete)**:
```css
:root {
  /* Color Palette - Light Theme */
  --primary: #0066CC;
  --primary-hover: #0052A3;
  --secondary: #6B5B95;
  --accent: #00B4D8;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  
  /* Spacing System */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Transitions */
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --border: #334155;
}
```

**Button Implementation**:
```css
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 6px;
  font-weight: 500;
  transition: all var(--transition-base);
  cursor: pointer;
  border: none;
  font-size: 14px;
}

.button-primary {
  background: var(--primary);
  color: white;
}

.button-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}
```

**Card Component**:
```css
.word-card {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}

.word-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
```

**Flashcard Animation**:
```css
.flashcard {
  perspective: 1000px;
  cursor: pointer;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}
```

## 4. Data Storage Design

### 4.1 Storage Schema

```javascript
// Storage keys
const StorageKeys = {
  LISTS: 'vocab_lists',
  SETTINGS: 'settings',
  SESSION: 'review_session',
  CACHE: 'lookup_cache'
};

// Storage structure
{
  vocab_lists: [
    {
      id: "list-uuid",
      name: "List Name",
      created: "ISO-8601 date",
      isDefault: boolean,
      words: [...]
    }
  ],
  settings: {
    theme: "auto", // auto, light, dark
    defaultListId: "list-uuid",
    dailyReviewLimit: 30,
    notifications: true,
    autoAddLookups: true
  },
  review_session: {
    // Current review session state
  },
  lookup_cache: {
    // Recent lookups for quick access
  }
}
```

### 4.2 Storage Operations

```javascript
class StorageManager {
  static async get(key) {
    const result = await browser.storage.local.get(key);
    return result[key];
  }
  
  static async set(key, value) {
    await browser.storage.local.set({ [key]: value });
  }
  
  static async update(key, updateFn) {
    const current = await this.get(key);
    const updated = updateFn(current);
    await this.set(key, updated);
    return updated;
  }
}
```

## 5. Context Menu Integration

### 5.1 macOS Right-Click Menu

Context menus are created in the background script using the `browser.contextMenus` API:

```javascript
// In background.js
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "lookup-vocabdict",
    title: "Look up in VocabDict",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "lookup-vocabdict") {
    // Handle the lookup with selected text
    handleLookup(info.selectionText);
  }
});
```

### 5.2 iOS Text Selection Integration

**Best Practices for iOS Safari Web Extensions:**

iOS Safari doesn't support context menus. Instead, we use content scripts with careful consideration for mobile UX:

```javascript
// In content.js - iOS-optimized text selection handling
let lookupButton = null;
let selectionTimeout = null;

// Debounced selection handler for better performance
document.addEventListener('selectionchange', () => {
  clearTimeout(selectionTimeout);
  
  selectionTimeout = setTimeout(() => {
    handleSelection();
  }, 300); // Debounce to avoid excessive updates
});

function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // Clean up existing button
  if (lookupButton) {
    lookupButton.remove();
    lookupButton = null;
  }
  
  // Validate selection (1-3 words, not too long)
  if (selectedText && 
      selectedText.length <= 50 && 
      selectedText.split(/\s+/).length <= 3) {
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Only show button if selection is visible
    if (rect.width > 0 && rect.height > 0) {
      lookupButton = createLookupButton();
      positionButton(lookupButton, rect);
    }
  }
}

function createLookupButton() {
  const button = document.createElement('button');
  button.className = 'vocabdict-lookup-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
    </svg>
  `;
  
  // iOS-optimized styles
  button.style.cssText = `
    position: fixed;
    width: 44px;
    height: 44px;
    background: #0066CC;
    border: none;
    border-radius: 22px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
  `;
  
  // Prevent button from interfering with selection
  button.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  }, { passive: true });
  
  button.addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    
    // Visual feedback
    button.style.transform = 'scale(0.9)';
    setTimeout(() => button.remove(), 150);
    
    // Send message to background
    try {
      await browser.runtime.sendMessage({
        type: MessageTypes.LOOKUP_WORD,
        word: selectedText,
        source: 'ios_selection'
      });
    } catch (error) {
      console.error('VocabDict: Failed to send message', error);
    }
  });
  
  document.body.appendChild(button);
  return button;
}

function positionButton(button, selectionRect) {
  const buttonSize = 44;
  const margin = 10;
  
  // Calculate position above selection, centered
  let top = selectionRect.top + window.scrollY - buttonSize - margin;
  let left = selectionRect.left + window.scrollX + (selectionRect.width / 2) - (buttonSize / 2);
  
  // Ensure button stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust if too close to edges
  if (left < margin) left = margin;
  if (left + buttonSize > viewportWidth - margin) {
    left = viewportWidth - buttonSize - margin;
  }
  
  // If not enough space above, show below
  if (top < margin) {
    top = selectionRect.bottom + window.scrollY + margin;
  }
  
  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
  
  // Animate entrance
  button.style.opacity = '0';
  button.style.transform = 'scale(0.8)';
  
  requestAnimationFrame(() => {
    button.style.transition = 'opacity 0.2s, transform 0.2s';
    button.style.opacity = '1';
    button.style.transform = 'scale(1)';
  });
}

// Clean up on page unload
window.addEventListener('pagehide', () => {
  if (lookupButton) {
    lookupButton.remove();
  }
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
  if (lookupButton) {
    lookupButton.remove();
    lookupButton = null;
  }
});
```

**Key iOS Considerations:**
1. **Touch-friendly**: 44x44px minimum touch target (Apple HIG)
2. **Performance**: Debounced selection handler to avoid lag
3. **Positioning**: Smart positioning to avoid iOS selection handles
4. **Visual feedback**: Smooth animations and touch feedback
5. **Clean architecture**: Proper cleanup on page navigation
6. **Viewport awareness**: Ensures button stays visible
7. **Non-intrusive**: Doesn't interfere with native selection behavior

## 6. Performance Optimizations

### 6.1 Lazy Loading
- Load dictionary data only when needed
- Paginate vocabulary lists (20 items per page)
- Load tab content on demand

### 6.2 Caching Strategy
- Cache recent lookups (last 50)
- Cache rendered components
- Use debouncing for search input

### 6.3 Memory Management
- Limit stored words to 10,000
- Compress old review history
- Clear cache periodically

## 7. Theme System

### 7.1 CSS Variables

```css
:root {
  /* Light theme */
  --bg-primary: #F9FAFB;
  --bg-secondary: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --shadow: rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  /* Dark theme */
  --bg-primary: #111827;
  --bg-secondary: #1F2937;
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --border: #374151;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

### 7.2 Theme Detection

```javascript
function detectTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}
```

## 8. Error Handling

### 8.1 Error Types
- Network errors (future API integration)
- Storage quota exceeded
- Invalid data format
- Permission errors

### 8.2 User Feedback
```javascript
class NotificationManager {
  static show(message, type = 'info') {
    const notification = {
      info: { icon: 'ℹ️', color: 'blue' },
      success: { icon: '✅', color: 'green' },
      warning: { icon: '⚠️', color: 'orange' },
      error: { icon: '❌', color: 'red' }
    };
    
    // Show toast notification in popup
    showToast(message, notification[type]);
  }
}
```

## 9. Testing Strategy

### 9.1 Unit Test Structure (Detroit School TDD)
```javascript
// Example: dictionary.test.js - Using real objects
describe('Dictionary Service', () => {
  const dictionary = new DictionaryService(realDictionaryData);
  
  test('should find exact word match', () => {
    const result = dictionary.lookup('hello');
    expect(result).toBeDefined();
    expect(result.word).toBe('hello');
  });
  
  test('should handle case-insensitive lookup', () => {
    const result = dictionary.lookup('HELLO');
    expect(result.word).toBe('hello');
  });
});

// Example: message-handler.test.js - Real services, not mocks
describe('Message Handler', () => {
  let services;
  
  beforeEach(async () => {
    // Use real implementations
    const dictionary = new DictionaryService(dictionaryData);
    const storage = StorageManager;
    services = { dictionary, storage };
    
    await browser.storage.local.clear();
  });
  
  test('should handle LOOKUP_WORD message', async () => {
    const result = await handleMessage({
      type: MessageTypes.LOOKUP_WORD,
      word: 'hello'
    }, services);
    
    expect(result.success).toBe(true);
    expect(result.data.word).toBe('hello');
  });
});
```

### 9.2 Integration Test Areas (Day 3-4 Implementation)

**Test Philosophy**: Following Detroit School TDD principles, our integration tests use real implementations of all services, with only browser APIs mocked. This ensures tests verify actual behavior and data flow.

#### 9.2.1 Storage Operations
```javascript
describe('Storage Integration', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  test('should persist vocabulary list across sessions', async () => {
    const testList = {
      id: 'test-list',
      name: 'Test List',
      words: [{ word: 'test', definitions: [...] }]
    };
    
    await StorageManager.set('vocab_lists', [testList]);
    const retrieved = await StorageManager.get('vocab_lists');
    
    expect(retrieved).toEqual([testList]);
  });

  test('should handle storage quota limits gracefully', async () => {
    const largeData = new Array(1000000).fill('test');
    
    await expect(
      StorageManager.set('large_data', largeData)
    ).rejects.toThrow('Storage quota exceeded');
  });
});
```

#### 9.2.2 Message Passing Between Components
```javascript
describe('Message Passing', () => {
  test('content script to background communication', async () => {
    // In content script test
    const response = await browser.runtime.sendMessage({
      type: 'LOOKUP_WORD',
      word: 'test'
    });
    
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('definitions');
  });

  test('background to popup communication', async () => {
    // Simulate background script sending update
    const mockPort = browser.runtime.connect({ name: 'popup' });
    
    mockPort.postMessage({
      type: 'WORD_ADDED',
      word: 'test'
    });
    
    // Verify popup receives and processes message
    expect(popupState.lists[0].words).toContainEqual(
      expect.objectContaining({ word: 'test' })
    );
  });
});
```

#### 9.2.3 UI State Management
```javascript
describe('UI State Synchronization', () => {
  test('should sync state between popup instances', async () => {
    // Open two popup instances
    const popup1 = await openPopup();
    const popup2 = await openPopup();
    
    // Add word in popup1
    await popup1.addWord('test');
    
    // Verify popup2 reflects the change
    await waitFor(() => {
      expect(popup2.getWordCount()).toBe(1);
    });
  });

  test('should maintain state after popup closes', async () => {
    const popup1 = await openPopup();
    await popup1.switchToTab('learn');
    await popup1.startReviewSession();
    await popup1.close();
    
    const popup2 = await openPopup();
    expect(popup2.getCurrentTab()).toBe('learn');
    expect(popup2.hasActiveSession()).toBe(true);
  });
});
```

#### 9.2.4 Context Menu and Content Script Integration
```javascript
describe('Context Menu Integration', () => {
  test('macOS context menu creates word lookup', async () => {
    // Simulate context menu click
    await browser.test.contextMenus.click('lookup-vocabdict', {
      selectionText: 'eloquent'
    });
    
    // Verify lookup occurred
    const cache = await StorageManager.get('lookup_cache');
    expect(cache).toHaveProperty('eloquent');
  });

  test('iOS text selection button works correctly', async () => {
    // Load content script
    await browser.tabs.executeScript({ file: 'content.js' });
    
    // Simulate text selection
    await page.selectText('hello world');
    
    // Verify button appears
    const button = await page.waitForSelector('.vocabdict-lookup-button');
    expect(button).toBeTruthy();
    
    // Click button and verify message sent
    await button.click();
    const messages = await browser.test.getMessages();
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'LOOKUP_WORD',
        word: 'hello world'
      })
    );
  });
});
```

#### 9.2.5 Complete User Flow Tests

**Day 4 Popup Integration Tests**:
```javascript
describe('Popup User Interactions', () => {
  test('should search for a word and display results', async () => {
    const searchInput = document.querySelector('.search-input');
    searchInput.value = 'hello';
    searchInput.dispatchEvent(new Event('input'));
    
    const wordCard = await waitForElement('.word-card');
    expect(wordCard.querySelector('.word-title').textContent).toBe('hello');
    expect(wordCard.querySelector('.pronunciation').textContent).toBe('/həˈloʊ/');
  });
  
  test('should add word to list with toast notification', async () => {
    const addButton = document.querySelector('.add-to-list-button');
    addButton.click();
    
    const toast = await waitForElement('.toast');
    expect(toast.textContent).toContain('Added to "My Vocabulary"');
  });
  
  test('should save and display recent searches', async () => {
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));
    
    await waitFor(() => {
      const recentSearches = document.querySelectorAll('.recent-search-item');
      return Array.from(recentSearches).some(item => 
        item.textContent.includes('test')
      );
    });
  });
});
```

#### 9.2.6 Theme System Testing
```javascript
describe('End-to-End User Flows', () => {
  test('complete word learning flow', async () => {
    // 1. User selects text on webpage
    await page.selectText('serendipity');
    await page.click('.vocabdict-lookup-button');
    
    // 2. Word appears in popup
    const popup = await waitForPopup();
    expect(popup.getCurrentWord()).toBe('serendipity');
    
    // 3. User adds to list
    await popup.click('.add-to-list-button');
    await popup.selectList('My Vocabulary');
    
    // 4. User starts review session
    await popup.switchToTab('learn');
    await popup.startReview();
    
    // 5. Word appears in flashcard
    expect(popup.getFlashcardWord()).toBe('serendipity');
    
    // 6. User marks as known
    await popup.clickKnown();
    
    // 7. Verify spaced repetition scheduled
    const lists = await StorageManager.get('vocab_lists');
    const word = lists[0].words.find(w => w.word === 'serendipity');
    expect(word.nextReview).toBeDefined();
    expect(new Date(word.nextReview)).toBeAfter(new Date());
  });
});
```

#### 9.2.6 Theme System Testing
```javascript
describe('Theme Management', () => {
  test('should detect and apply system theme preference', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn()
    }));
    
    const theme = ThemeManager.detectTheme();
    expect(theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
  
  test('should persist theme preference', async () => {
    await ThemeManager.setTheme('light');
    const stored = await browser.storage.local.get('settings');
    expect(stored.settings.theme).toBe('light');
  });
});
```

## 10. Accessibility Features

### 10.1 ARIA Labels
```html
<button aria-label="Add word to vocabulary list" class="add-button">
  <span aria-hidden="true">📚</span>
</button>
```

### 10.2 Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for list navigation

### 10.3 Screen Reader Support
- Announce state changes
- Provide context for actions
- Label all form inputs

---

**Document Version:** 1.5  
**Last Updated:** 2025-07-27  
**Status:** Updated based on Day 4 implementation (popup UI partial, theme system, toast notifications)