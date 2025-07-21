# VocabDict English Learning Extension - Implementation Plan

## Overview
This implementation plan breaks down the development of VocabDict into manageable tasks across 5 phases. Each task includes specific files to create/modify and acceptance criteria.

## Current Status (Last Updated: 2025-07-21)
- **Phase 1**: ✅ COMPLETED (Including modularization improvements)
- **Phase 2**: ✅ COMPLETED (Full dictionary and content script features)
- **Phase 3**: ✅ COMPLETED (List UI fully implemented with comprehensive testing framework)
- **Phase 4**: ⏳ NOT STARTED (Learning mode with spaced repetition)
- **Phase 5**: ⏳ NOT STARTED (Polish and optimization)

## Phase 1: Core Infrastructure (Foundation) ✅ COMPLETED

### 1.1 Update Extension Manifest ✅ DONE
**Files to modify:**
- `Shared (Extension)/Resources/manifest.json`

**Tasks:**
- Update permissions for storage, contextMenus, activeTab
- Configure content scripts for all URLs
- Set up proper icons and extension metadata
- Configure background script as persistent

**Acceptance Criteria:**
- Extension loads without errors
- All permissions properly declared
- Icons display correctly in toolbar

### 1.2 Implement Storage Layer ✅ DONE
**Files to create:**
- `Shared (Extension)/Resources/js/storage/database.js`
- `Shared (Extension)/Resources/js/storage/models.js`

**Tasks:**
- Create IndexedDB wrapper class
- Implement CRUD operations for all data models
- Create data model classes (VocabularyWord, VocabularyList, etc.)
- Add error handling and retry logic
- Implement data validation

**Acceptance Criteria:**
- Can save/retrieve vocabulary words
- Can manage vocabulary lists
- Data persists across browser sessions
- Handles storage errors gracefully

### 1.3 Set Up Message Passing System ✅ DONE
**Files to create:**
- `Shared (Extension)/Resources/js/messaging/messageHandler.js`
- `Shared (Extension)/Resources/js/messaging/messageTypes.js`

**Tasks:**
- Define all message types as constants
- Create centralized message router
- Implement request/response pattern
- Add message validation
- Set up error handling for failed messages

**Acceptance Criteria:**
- Messages pass between all extension components
- Async operations handled properly
- Failed messages report errors appropriately

### 1.4 Create Base UI Components ✅ DONE
**Files to create:**
- `Shared (Extension)/Resources/css/components.css`
- `Shared (Extension)/Resources/js/components/base.js`

**Tasks:**
- Create reusable CSS classes
- Implement Button, Card, Modal components
- Add loading states and spinners
- Create toast notification system
- Implement theme switching (light/dark)

**Acceptance Criteria:**
- Components render consistently
- Theme switching works
- Notifications display properly

## Phase 2: Dictionary Features

### 2.1 Create Toy Dictionary Data
**Files to create:**
- `Shared (Extension)/Resources/js/dictionary/toyDictionary.js`
- `Shared (Extension)/Resources/js/dictionary/dictionaryService.js`

**Tasks:**
- Implement 50-word toy dictionary with full data
- Create dictionary lookup service
- Add caching mechanism
- Implement fuzzy search for typos

**Word list to include:**
Common words like: hello, world, learn, study, book, read, write, speak, listen, understand, practice, improve, vocabulary, language, english, dictionary, meaning, example, sentence, grammar, pronunciation, accent, fluent, beginner, intermediate, advanced, lesson, teacher, student, homework, test, exam, quiz, question, answer, correct, mistake, error, review, repeat, remember, forget, memory, knowledge, education, school, university, course, etc.

**Acceptance Criteria:**
- Can look up all 50 words
- Returns complete dictionary data
- Handles non-existent words gracefully
- Search suggestions work

### 2.2 Implement Content Script
**Files to modify:**
- `Shared (Extension)/Resources/content.js`

**Files to create:**
- `Shared (Extension)/Resources/js/content/selectionHandler.js`
- `Shared (Extension)/Resources/js/content/floatingWidget.js`
- `Shared (Extension)/Resources/css/content.css`

**Tasks:**
- Monitor text selection events
- Create floating lookup widget UI
- Implement positioning logic for widget
- Add click-outside to dismiss
- Send lookup requests to background

**Acceptance Criteria:**
- Text selection triggers lookup
- Widget appears near selected text
- Widget doesn't go off-screen
- Can dismiss widget easily

### 2.3 Add Context Menu Integration ✅ DONE
**Files to modify:**
- `Shared (Extension)/Resources/background.js`

**Tasks:**
- Create context menu on extension install
- Handle context menu clicks
- Look up selected text
- Show results in popup or new tab
- Add keyboard shortcut support (macOS)

**Acceptance Criteria:**
- Right-click shows "Look up in VocabDict"
- Context menu works on selected text
- Keyboard shortcut triggers lookup

### 2.4 Build Dictionary View in Popup ✅ DONE
**Files to modify:**
- `Shared (Extension)/Resources/popup.html`
- `Shared (Extension)/Resources/popup.js`
- `Shared (Extension)/Resources/popup.css`

**Files to create:**
- `Shared (Extension)/Resources/js/popup/dictionaryView.js`

**Tasks:**
- Create search input with debouncing
- Display word definitions with all details
- Add pronunciation guide display
- Show synonyms/antonyms in pills
- Implement "Add to List" button
- Add search history

**Acceptance Criteria:**
- Can search for words
- Displays complete dictionary data
- Can add words to vocabulary lists
- Search is responsive and fast

## Phase 3: Vocabulary Management

### 3.1 Create List Management UI ✅ COMPLETED
**Files implemented:**
- Enhanced `popup.js` with full list management UI
- Integrated list display in "My Lists" tab

**Tasks completed:**
- ✅ Display all vocabulary lists
- ✅ Show words within each list
- ✅ Remove words from lists 
- ✅ Show word count per list
- ✅ Clean, responsive list interface
- ✅ Default list handling

**Acceptance Criteria met:**
- ✅ Lists show accurate word counts
- ✅ Can view and manage words in lists
- ✅ Clean, intuitive user interface

### 3.2 Implement Word Management ✅ COMPLETED  
**Files implemented:**
- Enhanced `popup.js` with word display and management
- Full vocabulary service integration in background scripts

**Tasks completed:**
- ✅ Display words in selected list with definitions
- ✅ Add/remove words from lists
- ✅ Track lookup count automatically
- ✅ Show detailed word information
- ✅ Clean removal functionality

**Acceptance Criteria met:**
- ✅ Can view all words in a list with full details
- ✅ Can remove words from lists
- ✅ Word information displays completely

### 3.3 Auto-add and Tracking Features ℹ️ TODO
**Files to modify:**
- `Shared (Extension)/Resources/js/dictionary/dictionaryService.js`
- `Shared (Extension)/Resources/background.js`

**Tasks:**
- Auto-add looked up words to default list
- Increment lookup counter
- Prevent duplicate additions
- Add setting to disable auto-add
- Track lookup history

**Acceptance Criteria:**
- Words automatically added after lookup
- Lookup count increases correctly
- No duplicate words in lists
- Can disable auto-add feature

### 3.4 Import/Export Functionality ℹ️ TODO
**Files to create:**
- `Shared (Extension)/Resources/js/services/importExportService.js`

**Tasks:**
- Export lists as JSON/CSV
- Import vocabulary from files
- Validate imported data
- Handle merge conflicts
- Show import preview
- Add progress indicators

**Acceptance Criteria:**
- Can export all data
- Can import valid files
- Invalid files show helpful errors
- Progress shown for large imports

## Phase 4: Learning Mode

### 4.1 Create Flashcard Interface
**Files to create:**
- `Shared (Extension)/Resources/js/popup/learningView.js`
- `Shared (Extension)/Resources/js/components/flashcard.js`
- `Shared (Extension)/Resources/css/flashcard.css`

**Tasks:**
- Build flashcard component with flip animation
- Show word on front, definition on back
- Add swipe gestures for mobile
- Implement keyboard controls
- Show progress indicator
- Add session timer

**Acceptance Criteria:**
- Cards flip smoothly
- Navigation works via buttons/keyboard
- Progress clearly displayed
- Works well on both platforms

### 4.2 Implement Spaced Repetition
**Files to create:**
- `Shared (Extension)/Resources/js/learning/spacedRepetition.js`
- `Shared (Extension)/Resources/js/learning/reviewScheduler.js`

**Tasks:**
- Implement interval calculation algorithm
- Schedule reviews based on performance
- Track review history
- Calculate due cards
- Implement review queue logic
- Add learning statistics tracking

**Acceptance Criteria:**
- Next review dates calculated correctly
- Due cards appear in queue
- Statistics update after reviews
- Algorithm follows design spec

### 4.3 Add Review Controls
**Files to modify:**
- `Shared (Extension)/Resources/js/popup/learningView.js`

**Tasks:**
- Add Known/Unknown/Skip buttons
- Implement keyboard shortcuts (1,2,3,space)
- Update word status after review
- Show immediate feedback
- Add review summary screen
- Implement daily streaks

**Acceptance Criteria:**
- Buttons update word status
- Keyboard shortcuts work
- Summary shows session stats
- Streaks track correctly

### 4.4 Create Settings Interface
**Files to create:**
- `Shared (Extension)/Resources/js/popup/settingsView.js`
- `Shared (Extension)/Resources/js/services/settingsService.js`

**Tasks:**
- Theme selector (light/dark/auto)
- Auto-add toggle
- Default list selector
- Review reminder settings
- Session size setting
- Keyboard shortcut configuration
- About section with version

**Acceptance Criteria:**
- All settings persist
- Changes apply immediately
- Theme switches smoothly
- Shortcuts can be customized

## Phase 5: Polish and Optimization

### 5.1 Performance Optimization
**Tasks:**
- Implement virtual scrolling for long lists
- Add lazy loading for dictionary data
- Optimize storage queries
- Minimize bundle size
- Add caching strategies
- Profile and fix memory leaks

**Acceptance Criteria:**
- Lists with 1000+ words scroll smoothly
- Initial load time < 500ms
- No memory leaks detected
- Bundle size < 500KB

### 5.2 iOS-Specific Adaptations
**Files to modify:**
- `Shared (App)/ViewController.swift`
- `iOS (App)/` related files

**Tasks:**
- Adapt UI for iOS Safari
- Handle text selection on iOS
- Test gesture interactions
- Optimize for different screen sizes
- Fix iOS-specific bugs

**Acceptance Criteria:**
- Extension works on iPhone/iPad
- UI adapts to screen size
- All features accessible on touch

### 5.3 Error Handling and Edge Cases
**Tasks:**
- Add comprehensive error boundaries
- Handle offline scenarios
- Manage storage quota limits
- Add data recovery options
- Implement proper loading states
- Add helpful empty states

**Acceptance Criteria:**
- No unhandled errors in console
- Clear error messages for users
- Can recover from corrupted data
- Works offline appropriately

### 5.4 Final Testing and Documentation
**Tasks:**
- Write unit tests for core functions
- Add integration tests
- Create user documentation
- Add inline code comments
- Test on multiple Safari versions
- Performance benchmarking
- Accessibility audit

**Acceptance Criteria:**
- 80%+ test coverage
- All features documented
- Passes accessibility checks
- Works on Safari 14+

## Implementation Schedule

**Week 1-2:** Phase 1 (Core Infrastructure)
**Week 3-4:** Phase 2 (Dictionary Features)
**Week 5-6:** Phase 3 (Vocabulary Management)
**Week 7-8:** Phase 4 (Learning Mode)
**Week 9-10:** Phase 5 (Polish and Optimization)

## Success Metrics

1. **Technical Metrics:**
   - Page load time < 500ms
   - No memory leaks
   - < 1% crash rate
   - All features work offline

2. **User Experience Metrics:**
   - Can look up word in < 3 clicks
   - Can create vocabulary list in < 30 seconds
   - Learning session setup < 10 seconds
   - All text readable (WCAG AA compliant)

3. **Feature Completion:**
   - All requirements implemented
   - All design specifications met
   - Cross-platform compatibility achieved
   - Data persistence working reliably

## Risk Mitigation

1. **Storage Limits:** Implement data pruning for old reviews
2. **Performance Issues:** Use Web Workers for heavy computation
3. **iOS Compatibility:** Test early and often on iOS devices
4. **Data Loss:** Regular auto-backup reminders
5. **Browser Updates:** Follow Safari extension best practices

## Notes for Implementation

- Start each phase with the most critical features
- Test continuously on both macOS and iOS
- Keep the toy dictionary simple but complete
- Focus on core functionality before polish
- Maintain backward compatibility for future sync feature
- Document all APIs for future development

## Implementation Notes (Actual vs Planned)

### Key Deviations:
1. **Architecture**: Initially adopted single-file approach, then successfully modularized into 6 files
2. **Dictionary Size**: Expanded to 20+ words (beyond initial 5 words)
3. **Service Worker**: Changed from persistent background page to service worker
4. **Data Model**: Removed bidirectional word-list relationship for simplicity
5. **Testing**: Added comprehensive test suite with real implementations (not in original plan)

### Technical Decisions:
- Used IndexedDB directly instead of browser.storage API
- Implemented consolidated message handling with error wrapper
- Created comprehensive UI with theme switching
- Added floating widget for better UX (not in original plan)
- Successfully split monolithic background.js into logical modules (constants, models, database, handlers, init)
- Attempted ES6 modules but reverted due to Safari compatibility issues
- Implemented comprehensive testing framework with minimal mocking

### Major Issues Fixed:
- ✅ Settings persistence bug (toJSON error)
- ✅ Missing vocabulary lists UI (full implementation)
- ✅ Code duplication and magic numbers
- ✅ Debug console.log cleanup
- ✅ Memory leaks in content script
- ✅ Monolithic background.js refactored into modules
- ✅ Xcode project.pbxproj updated for new files
- ✅ Context menu functionality (scope and message type issues)
- ✅ Keyboard shortcut handler implementation
- ✅ Test false positives from excessive mocking
- ✅ Service worker compatibility (globalThis vs window)

### Testing Framework Added:
- ✅ Real model tests with actual implementations
- ✅ Minimal browser API mocking (mock boundaries, not implementations)
- ✅ Integration tests for context menu and content script
- ✅ Comprehensive test coverage for spaced repetition algorithm

See `technical-decisions.md` for detailed technical documentation.