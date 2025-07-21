# Popup Interface Manual Testing Guide

## Overview
This guide provides comprehensive manual testing procedures for the VocabDict Safari Extension popup interface. The popup is the main user interface that users interact with when they click the extension toolbar button.

## Prerequisites
- Safari browser with VocabDict extension installed and enabled
- Extension loaded from Xcode during development
- Test data: Have some vocabulary words already in the system from previous testing

## Accessing the Popup

### Opening the Popup
1. Look for VocabDict icon in Safari toolbar
2. Click the extension icon
3. **Expected**: Popup window opens (approximately 400x600px)
4. **Expected**: Popup loads within 2 seconds

## Manual Test Cases

### 1. Popup Interface Loading

**Test 1.1: Initial Load**
1. Click extension icon to open popup
2. **Expected**: Main container `#app` is visible
3. **Expected**: Three navigation tabs appear: "Dictionary", "My Lists", "Settings"
4. **Expected**: Dictionary tab is active by default
5. **Expected**: No loading errors or blank screens

**Test 1.2: Visual Elements**
1. Check header area contains:
   - VocabDict logo/title
   - Current tab highlight
2. Check footer area (if present):
   - Version number
   - Additional navigation
3. **Expected**: All text is readable and properly styled

### 2. Dictionary Tab Tests

**Test 2.1: Search Functionality**
1. Ensure Dictionary tab is active
2. Locate search input field
3. Type "hello" in search field
4. **Expected**: Search suggestions appear (if implemented)
5. Press Enter or click search button
6. **Expected**: Word definition displays
7. **Expected**: Definition includes:
   - Word pronunciation (if available)
   - Parts of speech
   - Definitions/meanings
   - Example sentences (if available)

**Test 2.2: Search Results**
1. Search for common word: "example"
2. **Expected**: Definition loads within 3 seconds
3. **Expected**: Clean, readable format
4. **Expected**: "Add to List" button available
5. Search for non-existent word: "xyzabc123"
6. **Expected**: "Word not found" message
7. Clear search field
8. **Expected**: Results area clears

**Test 2.3: Add Word to List**
1. Search for word "important"
2. Click "Add to List" button
3. **Expected**: List selection dropdown appears (if multiple lists exist)
4. Select target list or use default
5. **Expected**: Success confirmation message
6. **Expected**: Word appears in selected vocabulary list
7. Try adding same word again
8. **Expected**: Appropriate handling (duplicate prevention or count increment)

### 3. My Lists Tab Tests

**Test 3.1: Lists View**
1. Click "My Lists" tab
2. **Expected**: Tab becomes active
3. **Expected**: List of vocabulary lists appears
4. **Expected**: Default list "My Vocabulary" is present
5. **Expected**: Each list shows:
   - List name
   - Word count
   - Last modified date (if implemented)

**Test 3.2: List Management**
1. Look for "New List" or "+" button
2. Click to create new list
3. **Expected**: Create list form appears
4. Enter list name: "Test Vocabulary"
5. Enter description: "Testing purposes"
6. Click "Create" or "Save"
7. **Expected**: New list appears in lists view
8. **Expected**: Success message displayed

**Test 3.3: List Details**
1. Click on existing vocabulary list
2. **Expected**: List detail view opens
3. **Expected**: Shows:
   - List name and description
   - All words in list
   - Add word option
   - Edit/Delete list options
4. **Expected**: Word count matches actual number of words

**Test 3.4: Word Management in Lists**
1. Open list detail view
2. **Expected**: Each word shows:
   - Word text
   - Brief definition or part of speech
   - Options to view details or remove
3. Click word to view details
4. **Expected**: Word detail popup or expanded view
5. Test remove word functionality
6. **Expected**: Word removed from list
7. **Expected**: Word count updates

### 4. Settings Tab Tests

**Test 4.1: Settings Interface**
1. Click "Settings" tab
2. **Expected**: Settings form appears
3. **Expected**: Settings categories include:
   - Appearance (theme)
   - Behavior preferences
   - Default list selection
   - Keyboard shortcuts
   - Review settings

**Test 4.2: Theme Settings**
1. Locate theme setting (Light/Dark/Auto)
2. Test each theme option:
   - Select "Light"
   - **Expected**: Popup changes to light theme immediately
   - Select "Dark"  
   - **Expected**: Popup changes to dark theme immediately
   - Select "Auto"
   - **Expected**: Follows system preference

**Test 4.3: Behavior Settings**
1. Find "Auto-add to list" toggle
2. Toggle ON: **Expected**: Words automatically added to default list
3. Toggle OFF: **Expected**: User must manually add words
4. Find "Default list" dropdown
5. Select different list as default
6. **Expected**: Setting saves and applies to new words

**Test 4.4: Review Settings**
1. Locate review reminder settings
2. Test daily reminder toggle
3. Set reminder time (if available)
4. Set review session size (number of words per session)
5. **Expected**: All settings save and persist between sessions

### 5. Navigation and Tab Management

**Test 5.1: Tab Switching**
1. Start on Dictionary tab
2. Click "My Lists" tab
3. **Expected**: Dictionary content hides, Lists content shows
4. Click "Settings" tab
5. **Expected**: Lists content hides, Settings content shows
6. Click "Dictionary" tab
7. **Expected**: Returns to Dictionary view
8. **Expected**: Previous search/state preserved (if applicable)

**Test 5.2: Tab State Persistence**
1. Search for word in Dictionary tab
2. Switch to My Lists tab
3. Switch back to Dictionary tab
4. **Expected**: Previous search still visible
5. Create new list in My Lists tab
6. Switch to Settings, then back to My Lists
7. **Expected**: New list still shown

### 6. Responsive Design

**Test 6.1: Popup Sizing**
1. Note popup dimensions when opened
2. **Expected**: Appropriate size for content (around 400x600px)
3. **Expected**: All content fits without unnecessary scrolling
4. **Expected**: Text is readable at default size

**Test 6.2: Content Overflow**
1. Add many vocabulary lists
2. **Expected**: Lists scroll properly if too many to fit
3. Search for word with very long definition
4. **Expected**: Definition scrolls or wraps properly
5. Create list with very long name
6. **Expected**: Name truncates or wraps appropriately

### 7. Error Handling

**Test 7.1: Network Errors**
1. Disconnect from internet
2. Try searching for new word
3. **Expected**: Clear error message displayed
4. **Expected**: Popup doesn't crash or freeze
5. Reconnect internet and retry
6. **Expected**: Functionality restored

**Test 7.2: Data Errors**
1. Try creating list with empty name
2. **Expected**: Validation error shown
3. Try adding malformed data
4. **Expected**: Graceful error handling
5. **Expected**: User can recover and continue

### 8. Data Persistence

**Test 8.1: Session Persistence**
1. Add several words to lists
2. Close popup (click outside or press Escape)
3. Reopen popup
4. **Expected**: All data still present
5. **Expected**: Settings maintained

**Test 8.2: Browser Restart**
1. Add words and create lists
2. Close Safari completely
3. Restart Safari
4. Open popup
5. **Expected**: All data preserved
6. **Expected**: Settings maintained

### 9. Integration Tests

**Test 9.1: Content Script Integration**
1. Use content script to add word to list
2. Open popup
3. **Expected**: Word appears in vocabulary lists
4. Check word count in list
5. **Expected**: Count incremented correctly

**Test 9.2: Context Menu Integration**
1. Use context menu to look up word
2. Open popup immediately after
3. **Expected**: Recent activity reflected
4. **Expected**: Word available in dictionary search history (if implemented)

### 10. Performance Tests

**Test 10.1: Loading Speed**
1. Time popup opening from click to full display
2. **Expected**: Opens within 2 seconds
3. Time tab switching
4. **Expected**: Instantaneous (< 0.5 seconds)

**Test 10.2: Large Data Sets**
1. Create 20+ vocabulary lists
2. Add 100+ words to default list
3. **Expected**: Popup still responsive
4. **Expected**: No noticeable lag in interactions
5. **Expected**: Memory usage reasonable

### 11. Accessibility Tests

**Test 11.1: Keyboard Navigation**
1. Open popup
2. Use Tab key to navigate through elements
3. **Expected**: All interactive elements focusable
4. **Expected**: Clear focus indicators
5. Use Arrow keys in lists/tabs (if implemented)
6. **Expected**: Navigation works logically

**Test 11.2: Screen Reader Support**
1. Test with VoiceOver (macOS built-in screen reader)
2. **Expected**: All text content readable
3. **Expected**: Button functions announced
4. **Expected**: Form labels properly associated

## Error States to Test

### Common Issues
- **Empty States**: Test behavior when no lists exist, no words in list
- **Loading States**: Verify loading indicators during API calls
- **Offline States**: Test behavior without internet connection
- **Full Storage**: Test behavior when storage quota reached (if applicable)

## Success Criteria

All manual tests should pass with:
- ✅ Popup opens quickly and reliably
- ✅ All three tabs function correctly
- ✅ Dictionary search works with proper error handling
- ✅ List management (create, edit, delete) works
- ✅ Words can be added to and removed from lists
- ✅ Settings save and apply correctly
- ✅ Navigation between tabs is smooth
- ✅ Data persists across sessions
- ✅ Error states handled gracefully
- ✅ Performance acceptable with large datasets
- ✅ Basic accessibility requirements met

## Test Results Documentation

Document for each test session:
- Date/time of testing
- Safari version and OS
- Extension version
- Test results (pass/fail for each section)
- Screenshots of any failures
- Performance observations
- User experience notes

## Troubleshooting

### Common Issues and Solutions

**Popup won't open:**
- Check extension enabled in Safari preferences
- Check for JavaScript errors in Web Inspector
- Restart Safari and try again

**Data not saving:**
- Check Safari storage permissions
- Check Web Inspector for storage errors
- Clear extension data and reset

**Slow performance:**
- Check number of vocabulary words/lists
- Clear browser cache
- Check system memory usage

## Notes for Developers

- Test on different macOS versions when possible
- Save screenshots of UI for documentation
- Note any Safari-specific behaviors
- Document user feedback and usability issues
- Update this guide when UI changes are made