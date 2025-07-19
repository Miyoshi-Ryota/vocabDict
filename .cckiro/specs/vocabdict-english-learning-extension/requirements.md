# VocabDict English Learning Extension - Requirements

## Overview
VocabDict is a Safari Web Extension designed for English learners to improve their vocabulary through dictionary lookup, vocabulary management, and spaced repetition learning.

## Platform Requirements
- **macOS**: Safari 14.0 or later
- **iOS**: Safari on iOS 15.0 or later

## Functional Requirements

### 1. Dictionary Lookup

#### 1.1 Core Lookup Features
- Users can search for English words to retrieve:
  - Word definitions (multiple meanings if applicable)
  - Part of speech (noun, verb, adjective, etc.)
  - Pronunciation guide (phonetic notation)
  - Synonyms
  - Antonyms
  - Example sentences demonstrating usage

#### 1.2 Access Methods
- **macOS**: Right-click context menu on selected text
- **iOS**: Text selection menu integration
- **Extension popup**: Manual search input field
- **Keyboard shortcut**: Quick lookup activation (macOS only)

#### 1.3 Dictionary Data
- Initial prototype will include a toy dictionary with 50-100 common English words
- Data structure must support future expansion to full dictionary API integration

### 2. User Vocabulary Lists

#### 2.1 List Management
- Users can create multiple vocabulary lists with custom names
- Default list: "My Vocabulary" created automatically
- Users can rename, delete, and reorder lists

#### 2.2 Word Management
- Add words to lists from:
  - Dictionary lookup results (one-click add)
  - Manual entry in the extension
- Each word entry stores:
  - The word itself
  - Definition(s)
  - Date added
  - Number of lookups
  - Difficulty rating (user-assigned: easy/medium/hard)
  - Last reviewed date
  - Review performance history

#### 2.3 Automatic Features
- Looked-up words are automatically added to a designated list
- Lookup count is tracked and incremented for each search
- Duplicate detection prevents the same word from being added multiple times

#### 2.4 Sorting and Filtering
- Sort vocabulary lists by:
  - Alphabetical order
  - Date added
  - Number of lookups
  - Difficulty level
  - Last reviewed date
- Filter words by difficulty level
- Search within vocabulary lists

### 3. Learning Mode

#### 3.1 Flashcard System
- Interactive flashcards showing:
  - Front: English word
  - Back: Definition, synonyms, example sentences
- Card flip animation for better user experience
- Progress indicator showing cards remaining in session

#### 3.2 Spaced Repetition Algorithm
- Implement a simplified spaced repetition system:
  - New words: Review after 1 day
  - Known words: Review intervals increase (1, 3, 7, 14, 30 days)
  - Unknown/difficult words: Reset to 1-day interval
- Daily review notifications (optional)

#### 3.3 User Interactions
- Mark words as:
  - Known (increases review interval)
  - Unknown (resets review interval)
  - Mastered (removes from active review)
- Skip option to postpone review
- Review session statistics:
  - Words reviewed
  - Accuracy rate
  - Streak tracking

### 4. Data Storage and Sync

#### 4.1 Local Storage
- All user data stored locally using browser storage APIs
- Data persistence across browser sessions

#### 4.2 Data Export/Import
- Export vocabulary lists as JSON or CSV
- Import vocabulary lists from files
- Backup reminder system

### 5. User Interface Requirements

#### 5.1 Extension Popup
- Clean, intuitive interface with tabs/sections:
  - Search/Lookup
  - My Lists
  - Learning Mode
  - Settings
- Responsive design for different screen sizes

#### 5.2 Visual Design
- Light/dark mode support (follows system preference)
- Clear typography for readability
- Consistent color scheme for difficulty levels
- Loading states for async operations

#### 5.3 Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option

## Non-Functional Requirements

### Performance
- Dictionary lookup response time < 500ms
- Smooth animations and transitions
- Efficient memory usage for large vocabulary lists

### Security
- No external data transmission without user consent
- Secure storage of user vocabulary data
- Content Security Policy compliance

### Usability
- Intuitive interface requiring minimal learning curve
- Clear error messages and user feedback
- Undo functionality for destructive actions

## Future Considerations (Not in MVP)
- Cloud sync across devices
- Integration with external dictionary APIs
- Audio pronunciation
- Advanced spaced repetition algorithms
- Social features (sharing lists)
- Gamification elements

## Success Criteria
- Users can successfully look up words and view comprehensive information
- Users can create and manage vocabulary lists effectively
- The spaced repetition system helps users retain vocabulary
- The extension works seamlessly on both macOS and iOS Safari