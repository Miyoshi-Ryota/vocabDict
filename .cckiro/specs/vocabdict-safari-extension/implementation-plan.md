# VocabDict Safari Web Extension - Implementation Plan

## Overview

This implementation plan outlines the step-by-step approach to building the VocabDict Safari Web Extension within a 1-week timeline. The plan follows Test-Driven Development (TDD) principles using the Detroit School approach.

## Development Timeline

**Total Duration**: 7 days  
**Daily Commitment**: 4-6 hours  
**Methodology**: TDD (Detroit School), iterative development

## Git Workflow

### Branch Strategy
- **main**: Stable, working code only
- **Feature branches**: One branch per implementation section
  - `feature/project-setup` (Day 1)
  - `feature/dictionary-service` (Day 2)
  - `feature/background-worker` (Day 3)
  - `feature/popup-ui-base` (Day 4)
  - `feature/learning-mode` (Day 5)
  - `feature/content-script` (Day 6)
  - `feature/polish-deployment` (Day 7)

### Commit Guidelines
- **Commit frequently**: After each passing test or completed subtask
- **Commit message format**: `type: description`
  - `feat:` new feature
  - `fix:` bug fix
  - `test:` adding tests
  - `refactor:` code refactoring
  - `docs:` documentation changes
  - `style:` formatting, missing semicolons, etc.
- **Examples**:
  - `test: add StorageManager CRUD tests`
  - `feat: implement dictionary lookup with fuzzy matching`
  - `fix: handle storage quota exceeded error`

### Workflow Process
1. Create feature branch from main
2. Make small, atomic commits
3. Push branch regularly
4. Merge to main when feature is complete and tested
5. Delete feature branch after merge

### Documentation Updates
- Update spec documents directly in their original locations
- Never create temporary copies
- Commit documentation changes with code changes

## General Feedback Tracking

Throughout development, general feedback and insights will be documented in:
- `.claude/development-notes.md` - For patterns and best practices discovered
- `.claude/feedback-log.md` - For user feedback that applies broadly

## Phase Breakdown

### Day 1: Project Setup and Core Infrastructure (6 hours) ✅ COMPLETED

#### 1.1 Project Initialization (1 hour)
- [x] Review existing Xcode Safari Extension App project structure
- [x] Initialize npm project with package.json for JS dependencies
- [x] Update README.md with project details
- [x] Create .claude directory for development notes

#### 1.2 Build System Setup (2 hours)
- [x] Configure Webpack for Safari Web Extension bundling
- [x] Set up development and production build scripts
- [x] Configure ESLint for code quality
- [x] Set up Jest for unit testing
- [x] Create build scripts for macOS and iOS

#### 1.3 Extension Manifest and Basic Structure (1 hour)
- [x] Update manifest.json with Safari-specific configurations (service_worker)
- [x] Set up basic file structure (background, content, popup folders)
- [x] Create placeholder HTML/CSS/JS files
- [x] Configure extension icons and assets

#### 1.4 Storage Layer Foundation (2 hours)
- [x] Write tests for StorageManager class (12 tests passing)
- [x] Implement StorageManager with browser.storage.local
- [x] Test basic CRUD operations
- [x] Implement error handling for storage quota

#### 1.5 Additional Work Completed
- [x] Fix Xcode build configuration issues
- [x] Resolve webpack output path problems
- [x] Create constants file with tests
- [x] Set up proper git workflow with feature branches
- [x] Create comprehensive testing documentation
- [x] Successfully load extension in Safari

### Day 2: Dictionary Service and Data Model (5 hours)

#### 2.1 Dictionary Data Structure (1 hour)
- [ ] Create toy dictionary JSON with 50-100 words
- [ ] Design word data model
- [ ] Write tests for data validation

#### 2.2 Dictionary Service Implementation (2 hours)
- [ ] Write tests for dictionary lookup
- [ ] Implement DictionaryService class
- [ ] Add fuzzy matching for misspellings
- [ ] Test edge cases (case sensitivity, special characters)

#### 2.3 Vocabulary List Model (2 hours)
- [ ] Write tests for VocabularyList operations
- [ ] Implement VocabularyList class
- [ ] Add word management methods (add, remove, update)
- [ ] Implement duplicate detection
- [ ] Test sorting and filtering logic

### Day 3: Background Service Worker and Message Handling (5 hours)

#### 3.1 Background Service Worker Setup (2 hours)
- [ ] Write tests for message handlers
- [ ] Implement background.js service worker
- [ ] Set up message routing system
- [ ] Test message passing between components

#### 3.2 Context Menu Integration (1 hour)
- [ ] Implement macOS context menu creation
- [ ] Add context menu click handler
- [ ] Test context menu functionality

#### 3.3 Core Business Logic (2 hours)
- [ ] Implement word lookup flow
- [ ] Add automatic word tracking
- [ ] Implement lookup counting
- [ ] Test integration between services

### Day 4: Extension Popup UI - Part 1 (6 hours)

#### 4.1 Popup HTML/CSS Structure (2 hours)
- [ ] Create popup.html with tab navigation
- [ ] Implement professional CSS design system
- [ ] Add responsive layout
- [ ] Implement theme switching (light/dark)

#### 4.2 Search Tab Implementation (2 hours)
- [ ] Write tests for search functionality
- [ ] Implement search input with debouncing
- [ ] Create word display component
- [ ] Add "Add to List" functionality
- [ ] Implement recent searches

#### 4.3 Lists Tab - Basic Structure (2 hours)
- [ ] Create lists view UI
- [ ] Implement list creation/deletion
- [ ] Add word list display
- [ ] Test list management operations

### Day 5: Extension Popup UI - Part 2 & Learning Mode (6 hours)

#### 5.1 Lists Tab - Advanced Features (2 hours)
- [ ] Implement sorting (alphabetical, date, lookups)
- [ ] Add filtering by difficulty
- [ ] Create word detail view
- [ ] Add edit/delete word functionality

#### 5.2 Learning Mode - Spaced Repetition (2 hours)
- [ ] Write tests for SpacedRepetition class
- [ ] Implement spaced repetition algorithm
- [ ] Create review queue logic
- [ ] Test interval calculations

#### 5.3 Learning Mode - UI (2 hours)
- [ ] Create flashcard component
- [ ] Implement flip animation
- [ ] Add review action buttons
- [ ] Create progress tracking UI
- [ ] Test review session flow

### Day 6: Content Script and Mobile Optimization (5 hours)

#### 6.1 Content Script Implementation (2 hours)
- [ ] Write tests for text selection detection
- [ ] Implement iOS text selection handler
- [ ] Create lookup button component
- [ ] Add positioning logic
- [ ] Test on various websites

#### 6.2 Mobile UI Optimization (1 hour)
- [ ] Optimize popup for iOS screens
- [ ] Test touch interactions
- [ ] Ensure 44px touch targets
- [ ] Fix any iOS-specific issues

#### 6.3 Settings and Data Management (2 hours)
- [ ] Implement settings tab UI
- [ ] Add import/export functionality
- [ ] Create backup reminder system
- [ ] Test data persistence

### Day 7: Testing, Polish, and Deployment (6 hours)

#### 7.1 Integration Testing (2 hours)
- [ ] Test complete user flows
- [ ] Test cross-component communication
- [ ] Verify data persistence
- [ ] Test on both macOS and iOS

#### 7.2 Performance Optimization (1 hour)
- [ ] Implement lazy loading
- [ ] Add caching for lookups
- [ ] Optimize memory usage
- [ ] Test with large datasets

#### 7.3 Accessibility and Polish (1 hour)
- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Add loading states
- [ ] Polish animations and transitions

#### 7.4 Build and Package (2 hours)
- [ ] Create production build
- [ ] Generate extension package
- [ ] Write user documentation
- [ ] Prepare for Safari Extension Gallery submission

## Implementation Guidelines

### TDD Approach (Detroit School)
1. Write failing test first
2. Implement minimal code to pass test
3. Refactor while keeping tests green
4. Use real objects instead of mocks where possible
5. Only mock browser APIs and external dependencies

### Code Organization

Building on the existing Xcode Safari Extension App structure:

```
VocabDict/
├── VocabDict.xcodeproj
├── VocabDict/                    # Main app
├── VocabDict Extension/          # Safari extension
│   ├── Resources/
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.js
│   │   │   └── popup.css
│   │   └── images/
│   ├── SafariExtensionHandler.swift
│   └── Info.plist
├── Shared/                       # Shared between app and extension
├── src/                          # Additional JS modules
│   ├── services/
│   │   ├── dictionary-service.js
│   │   ├── vocabulary-manager.js
│   │   └── storage.js
│   ├── models/
│   │   └── spaced-repetition.js
│   └── utils/
│       ├── constants.js
│       └── helpers.js
├── tests/
│   ├── unit/
│   └── integration/
├── .claude/                      # Development notes
├── package.json
└── webpack.config.js
```

### Testing Strategy
- Unit tests for all business logic
- Integration tests for component communication
- Manual testing on Safari (macOS and iOS)
- Minimum 80% code coverage

### Key Development Principles
1. **Incremental Development**: Complete one feature fully before moving to next
2. **Continuous Testing**: Run tests after every change
3. **Early Integration**: Test on actual Safari frequently
4. **User-Centric**: Test actual user workflows regularly
5. **Performance First**: Profile and optimize as you go

## Risk Mitigation

### Potential Challenges and Solutions

1. **Safari API Limitations**
   - Solution: Test early, have fallbacks ready
   - Keep Safari documentation handy

2. **iOS-specific Issues**
   - Solution: Test on real iOS device daily
   - Have iOS simulator ready

3. **Time Constraints**
   - Solution: Focus on MVP features first
   - Cut scope if needed (e.g., reduce toy dictionary size)

4. **Storage Limitations**
   - Solution: Implement data cleanup early
   - Test with maximum data loads

## Lessons Learned

### Day 1 Insights
1. **Safari Extension Specifics**:
   - Use `service_worker` instead of `scripts` in manifest v3
   - No ES6 module support in Safari extensions
   - Xcode project file needs all resources explicitly listed

2. **Build Configuration**:
   - Webpack should output directly to Resources folder
   - Don't use CleanWebpackPlugin - it removes essential files
   - Build JS files first, then build in Xcode

3. **Testing**:
   - Detroit School TDD works well for extension development
   - Mock only browser APIs, use real objects elsewhere
   - 19 tests written and passing on Day 1

## Success Criteria

By end of Day 7:
- [ ] All three core features working (Lookup, Lists, Learning)
- [ ] Extension runs on both macOS and iOS Safari
- [ ] All tests passing with >80% coverage
- [ ] No critical bugs
- [ ] Professional, polished UI
- [ ] Ready for user testing

## Daily Checkpoints

Each day ends with:
1. Working code committed to Git
2. All tests passing
3. Quick demo of new features
4. Note any blockers for next day

## Tools and Resources

### Development Tools
- Xcode (primary development environment)
- Safari Web Inspector
- Terminal for npm scripts and testing
- Jest for testing
- Webpack for bundling

### Documentation
- [Safari Web Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [WebExtensions API Reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Document Version:** 1.2  
**Last Updated:** 2025-07-26-13-08  
**Status:** In Progress - Day 1 Complete
