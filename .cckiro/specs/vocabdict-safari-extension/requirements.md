# VocabDict Safari Web Extension - Requirements Specification

## 1. Product Overview

**Product Name:** VocabDict  
**Product Type:** Safari Web Extension  
**Target Users:** English learners who want to improve their vocabulary  
**Supported Platforms:** macOS (Safari 18.0+) and iOS (Safari on iOS 18.0+)

## 2. Core Features

### 2.1 Dictionary Lookup
- Comprehensive word information retrieval including definitions, parts of speech, pronunciation, synonyms, antonyms, and example sentences
- Multiple access methods:
  - macOS: Right-click context menu on selected text
  - iOS: Text selection menu integration
  - Extension popup: Manual search input field
- Initial implementation with toy dictionary (50-100 words)
- Architecture must support future API integration

### 2.2 User Vocabulary Lists
- Multiple custom vocabulary lists with management capabilities
- Automatic word tracking and lookup counting
- Comprehensive word data storage (definitions, dates, difficulty, review history)
- Advanced sorting and filtering options
- Duplicate prevention
- One-click word addition from lookup results

### 2.3 Learning Mode
- Interactive flashcard system with animations
- Simplified spaced repetition algorithm
- User feedback options (known/unknown/mastered)
- Progress tracking and statistics
- Optional daily review notifications

## 3. Functional Requirements

### 3.1 Dictionary Lookup System

#### 3.1.1 Word Information
- **Required data for each word:**
  - Word text
  - Definition(s) with multiple meanings support
  - Part of speech (noun, verb, adjective, etc.)
  - Phonetic pronunciation guide
  - Synonyms list
  - Antonyms list
  - Example sentences (minimum 2 per meaning)

#### 3.1.2 Access Methods
- **Context Menu Integration (macOS)**
  - Right-click on selected text shows "Look up in VocabDict" option
  - Automatic word extraction from selection
  - Results displayed in extension popup

- **Text Selection Menu (iOS)**
  - Integration with iOS text selection actions
  - "Look up" option in the selection menu
  - Seamless transition to extension view

- **Manual Search**
  - Search input field in extension popup
  - Auto-complete suggestions
  - Search history

#### 3.1.3 Dictionary Data Structure
- JSON-based storage format
- Scalable architecture for future API integration
- Offline capability with local data

### 3.2 Vocabulary List Management

#### 3.2.1 List Operations
- Create new lists with custom names
- Rename existing lists
- Delete lists with confirmation
- Reorder lists (drag and drop or manual)
- Default "My Vocabulary" list (cannot be deleted)

#### 3.2.2 Word Entry Data Model

**Architecture Principle**: Dictionary is the single source of truth for word definitions. VocabularyList only stores user-specific learning data.

```
// Dictionary Entry (from DictionaryService)
DictionaryEntry {
  word: string
  pronunciation: string
  definitions: array of {
    partOfSpeech: string
    meaning: string
    examples: array of strings
  }
  synonyms: array of strings
  antonyms: array of strings
}

// User Word Data (in VocabularyList)
UserWordData {
  word: string (preserves case from dictionary)
  dateAdded: timestamp
  difficulty: enum (easy, medium, hard)
  lastReviewed: timestamp (null if never reviewed)
  nextReview: timestamp
  reviewHistory: array of {
    date: timestamp
    result: enum (known, unknown, skipped)
    timeSpent: number (seconds)
  }
  customNotes: string (optional)
}

// Full Word Data (combined for display)
FullWordData = DictionaryEntry + UserWordData
```

#### 3.2.3 Automatic Features
- Auto-add looked up words to designated list (optional setting)
- Timestamp tracking for all actions
- Smart duplicate detection (case-insensitive)

#### 3.2.4 Sorting Options
- Alphabetical (A-Z, Z-A)
- Date added (newest/oldest first)
- Difficulty level
- Last reviewed date (with null values at end)
- Review performance

#### 3.2.5 Filtering Options
- By difficulty level
- By review status
- By date range
- Search within lists

### 3.3 Learning System

#### 3.3.1 Flashcard Interface
- **Card Front:** English word only
- **Card Back:** 
  - Primary definition
  - Part of speech
  - Synonyms
  - Example sentences
- Flip animation (0.6s duration)
- Progress bar showing session progress
- Current card number indicator

#### 3.3.2 Spaced Repetition Algorithm
- **Review Intervals:**
  - New word: 1 day
  - After "Known": 3 days → 7 days → 14 days → 30 days
  - After "Unknown": Reset to 1 day
  - After "Mastered": Remove from active reviews
- **Daily Review Queue:**
  - Words due for review today
  - Maximum 30 words per session (configurable)
  - Priority to overdue words

#### 3.3.3 Review Actions
- Mark as Known (advance interval)
- Mark as Unknown (reset interval)
- Mark as Mastered (archive)
- Skip (review later in session)
- Add notes

#### 3.3.4 Statistics Tracking
- Words reviewed per session
- Accuracy rate (Known vs Unknown)
- Current streak (consecutive days)
- Total words mastered
- Learning progress graphs

### 3.4 Data Management

#### 3.4.1 Storage
- Browser local storage API
- Maximum 10MB storage usage
- Data compression for efficiency
- Automatic cleanup of old data

#### 3.4.2 Import/Export
- Export formats: JSON, CSV
- Import validation and error handling
- Merge strategies for duplicates
- Backup reminders (weekly)

## 4. User Interface Requirements

### 4.1 Extension Popup Design
- **Dimensions:** 400x600px (desktop), responsive on mobile
- **Navigation:** Tab-based with icons
  - Search (magnifying glass)
  - My Lists (list icon)
  - Learn (graduation cap)
  - Settings (gear)

### 4.2 Visual Design System
- **Professional Color Palette:**
  - Primary: Deep Blue (#0066CC)
  - Secondary: Soft Purple (#6B5B95)
  - Accent: Vibrant Teal (#00B4D8)
  - Success: Emerald (#10B981)
  - Warning: Amber (#F59E0B)
  - Error: Rose (#EF4444)
  - Background: Light (#F9FAFB), Dark (#111827)
  - Surface: Light (#FFFFFF), Dark (#1F2937)
  - Text: Light (#111827), Dark (#F9FAFB)
  - Difficulty: Easy (#10B981), Medium (#F59E0B), Hard (#EF4444)

- **Typography:**
  - Headers: SF Pro Display (macOS) / System UI, 20-28px, Font-weight: 600
  - Subheaders: SF Pro Display, 16-18px, Font-weight: 500
  - Body: SF Pro Text, 14-16px, Font-weight: 400
  - Small text: SF Pro Text, 12-13px
  - Monospace: SF Mono for pronunciation guides
  - Line height: 1.5 for body text, 1.2 for headers

- **Visual Effects:**
  - Subtle shadows: 0 1px 3px rgba(0,0,0,0.1)
  - Card elevation: 0 4px 6px rgba(0,0,0,0.07)
  - Smooth transitions: all 0.2s ease
  - Card flip: 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)
  - Hover effects: subtle scale(1.02) and shadow increase
  - Focus rings: 2px offset with primary color
  - Glassmorphism for overlays: backdrop-filter blur(10px)

- **Spacing System:**
  - Base unit: 4px
  - Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
  - Consistent padding and margins throughout

- **Border Radius:**
  - Small elements: 4px
  - Cards and buttons: 8px
  - Modal dialogs: 12px
  - Extension popup: 16px

### 4.3 Responsive Design
- Mobile-first approach
- Touch-friendly buttons (minimum 44x44px)
- Swipe gestures for card navigation
- Adaptive layout for different screen sizes

### 4.4 Theme Support
- Light/dark mode manual selection (default: dark)
- High contrast mode
- Consistent theme across all screens
- Note: Auto system theme detection removed due to Safari extension API limitations

### 4.5 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation with visible focus indicators
- Screen reader announcements
- Alternative text for all icons
- Sufficient color contrast ratios

## 5. Non-Functional Requirements

### 5.1 Performance
- Dictionary lookup: < 500ms response time
- Page transitions: < 300ms
- Smooth 60fps animations
- Memory usage: < 50MB active
- Battery efficient on mobile devices

### 5.2 Security
- Content Security Policy compliance
- No external data transmission without consent
- Encrypted local storage
- Secure input validation
- XSS prevention

### 5.3 Reliability
- Offline functionality for core features
- Graceful error handling
- Data integrity checks
- Automatic recovery from crashes
- 99.9% uptime for local features

### 5.4 Usability
- Onboarding tutorial for new users
- Contextual help tooltips
- Undo/redo for critical actions
- Clear error messages
- Consistent UI patterns

## 6. Technical Requirements

### 6.1 Development Stack
- HTML5, CSS3, JavaScript (ES6+ supported, but no ES6 modules)
- No heavy frameworks (vanilla JS preferred)
- Build tools: Webpack or similar (to bundle without ES6 modules)
- Testing: Jest for unit tests
- Linting: ESLint

### 6.2 Safari Extension APIs
- browser.storage.local for data persistence
- Safari Web Extension APIs for context menu integration
- browser.notifications for review reminders (if supported)
- Web Animations API for smooth animations

### 6.3 Architecture
- Modular component structure
- Event-driven communication
- Service worker for background tasks
- Content scripts for page integration

## 7. Testing Requirements

### 7.1 Unit Testing
- Detroit School TDD approach
- Minimum 80% code coverage
- Test all business logic
- Use real objects and data whenever possible
- Mock only when absolutely necessary (e.g., browser APIs)

### 7.2 Integration Testing
- Cross-platform testing (macOS/iOS)
- Different Safari versions
- Various screen sizes
- Light/dark mode scenarios

### 7.3 User Acceptance Testing
- Developer self-testing for usability
- Performance benchmarks
- Accessibility audit
- Security assessment

## 8. Development Constraints

### 8.1 Safari Extension Limitations
- Limited API access compared to Chrome
- Storage quota restrictions
- iOS-specific limitations
- App Store review requirements

### 8.2 Resource Constraints
- Initial dictionary limited to 50-100 words
- No server infrastructure (local only)
- Single developer
- 1-week development timeline for MVP

## 9. Success Metrics

### 9.1 Functional Success
- All three core features fully implemented
- Cross-platform compatibility verified
- No critical bugs in production

### 9.2 User Experience Success
- Intuitive interface (users can use without documentation)
- Fast and responsive (meets performance targets)
- Positive user feedback

### 9.3 Learning Effectiveness
- Users show vocabulary retention improvement
- Regular usage patterns established
- High completion rate for review sessions

## 10. Future Expansion (Post-MVP)

- External dictionary API integration
- Cloud synchronization
- Audio pronunciation
- Advanced SRS algorithms
- Social features
- Gamification elements
- More languages support
- Browser extension for Chrome/Firefox

---

**Document Version:** 1.4  
**Last Updated:** 2025-07-27  
**Status:** Updated based on Day 4 implementation (popup UI completed)