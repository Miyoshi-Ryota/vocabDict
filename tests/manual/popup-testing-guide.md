# Popup Interface Manual Testing Guide

This guide provides comprehensive testing instructions for the VocabDict Safari Extension popup interface. Manual testing is essential for Safari extensions as automated testing tools cannot accurately simulate Safari's extension popup behavior.

## Prerequisites

1. VocabDict Safari Extension is installed and enabled
2. Extension toolbar button is visible in Safari
3. Extension has necessary permissions granted

## Test Cases

### Popup Loading and Interface

#### Test 1: Basic Popup Opening
**Objective**: Verify popup opens and displays correctly

**Steps**:
1. Click the VocabDict extension icon in Safari toolbar
2. Verify popup window opens
3. Check popup dimensions are appropriate (approximately 400x600px)
4. Verify all UI elements are visible and not clipped

**Expected Result**: 
- Popup opens within 1 second
- All elements visible and properly styled
- No layout issues or clipping

#### Test 2: Tab Navigation Structure
**Objective**: Verify tab navigation works correctly

**Steps**:
1. Open popup
2. Verify three tabs are present: "Dictionary", "My Lists", "Settings"
3. Verify "Dictionary" tab is active by default
4. Check visual indicators for active/inactive tabs

**Expected Result**: Three tabs visible, Dictionary active, clear visual states

#### Test 3: Theme Application
**Objective**: Verify correct theme is applied on popup open

**Steps**:
1. Open popup
2. Verify theme (light/dark) matches user settings
3. Check color scheme consistency across all elements

**Expected Result**: Consistent theme application throughout popup

### Dictionary Tab Functionality

#### Test 4: Search Input Interface
**Objective**: Verify search input field works correctly

**Steps**:
1. Navigate to Dictionary tab (if not already active)
2. Click in search input field
3. Type a test word (e.g., "hello")
4. Verify input accepts text and displays it correctly
5. Check placeholder text when empty

**Expected Result**: 
- Input field focuses correctly
- Text appears as typed
- Placeholder text: "Enter word to search..."

#### Test 5: Search Button Functionality
**Objective**: Verify search button triggers word lookup

**Steps**:
1. Enter a common word in search field (e.g., "world")
2. Click search button
3. Verify loading state appears
4. Wait for results to display

**Expected Result**: 
- Loading indicator appears immediately
- Results display within 3 seconds
- Loading state disappears when complete

#### Test 6: Enter Key Search
**Objective**: Verify pressing Enter triggers search

**Steps**:
1. Click in search input
2. Type a word
3. Press Enter key
4. Verify search is triggered

**Expected Result**: Search initiated same as clicking search button

#### Test 7: Clear Search Functionality
**Objective**: Verify clear button (if present) works

**Steps**:
1. Enter text in search field
2. Click clear button (×) if visible
3. Verify input field is cleared

**Expected Result**: Input field becomes empty, placeholder reappears

### Search Results Display

#### Test 8: Successful Word Lookup
**Objective**: Verify word definitions display correctly

**Steps**:
1. Search for a common word (e.g., "book")
2. Wait for results to load
3. Verify displayed information includes:
   - Word title/header
   - Pronunciations (if available)
   - Multiple definitions with parts of speech
   - Examples (if available)
   - "Add to List" button

**Expected Result**: Complete word information displayed in organized format

#### Test 9: Word Not Found Handling
**Objective**: Verify appropriate message for unknown words

**Steps**:
1. Search for a non-existent word (e.g., "xyzqwerty123")
2. Wait for lookup to complete
3. Verify appropriate "not found" message displays

**Expected Result**: User-friendly "Word not found" message

#### Test 10: Network Error Handling
**Objective**: Verify graceful error handling

**Steps**:
1. Disconnect internet (or simulate network error)
2. Attempt word search
3. Verify error message displays
4. Reconnect internet and retry

**Expected Result**: Clear error message, retry functionality works

#### Test 11: Loading State Display
**Objective**: Verify loading states are shown appropriately

**Steps**:
1. Search for a word
2. Observe loading indicators during search
3. Verify loading state disappears when complete/error

**Expected Result**: Clear loading indication during operations

### Add to List Functionality

#### Test 12: Add to List Button
**Objective**: Verify adding words to vocabulary list works

**Steps**:
1. Search for and display a word's definition
2. Click "Add to List" button
3. Verify button shows loading state ("Adding...")
4. Wait for completion
5. Verify success feedback

**Expected Result**: 
- Button becomes disabled during operation
- Success message appears
- Button text updates to confirm addition

#### Test 13: Duplicate Word Handling
**Objective**: Verify behavior when adding duplicate words

**Steps**:
1. Add a word to list successfully
2. Search for the same word again
3. Attempt to add it again
4. Verify appropriate feedback

**Expected Result**: System handles duplicates gracefully (either prevents or increments count)

#### Test 14: Add to List Error Handling
**Objective**: Verify error handling for failed additions

**Steps**:
1. Search for a word
2. Simulate add operation failure (if possible)
3. Verify error message and button state recovery

**Expected Result**: Error message shown, button returns to clickable state

### My Lists Tab Functionality

#### Test 15: Lists Display
**Objective**: Verify vocabulary lists are displayed correctly

**Steps**:
1. Click on "My Lists" tab
2. Wait for lists to load
3. Verify lists are displayed with:
   - List names
   - Word counts
   - Default list indication
4. Check scrolling if many lists exist

**Expected Result**: All lists displayed with correct information and formatting

#### Test 16: List Expansion
**Objective**: Verify clicking lists shows contained words

**Steps**:
1. Navigate to My Lists tab
2. Click on a list that contains words
3. Verify list expands to show word entries
4. Click again to collapse (if applicable)

**Expected Result**: List expands/collapses showing word details

#### Test 17: Word Management in Lists
**Objective**: Verify individual word actions within lists

**Steps**:
1. Expand a list containing words
2. Look for word action buttons (delete, edit, etc.)
3. Test available actions
4. Verify changes are reflected immediately

**Expected Result**: Word actions work correctly, UI updates immediately

#### Test 18: Empty Lists Display
**Objective**: Verify empty lists are handled appropriately

**Steps**:
1. Navigate to lists tab
2. Find an empty list or create one
3. Verify appropriate empty state message

**Expected Result**: Clear indication when lists are empty

#### Test 19: Create New List
**Objective**: Verify new list creation (if feature exists)

**Steps**:
1. Navigate to My Lists tab
2. Look for "Add List" or similar button
3. Click and follow creation process
4. Verify new list appears

**Expected Result**: New list creation works and list appears immediately

### Settings Tab Functionality

#### Test 20: Settings Display
**Objective**: Verify settings are displayed correctly

**Steps**:
1. Click on "Settings" tab
2. Wait for settings to load
3. Verify all setting controls are present:
   - Theme toggle
   - Auto-add toggle
   - Review reminders
   - Session size
   - Other available settings

**Expected Result**: All settings displayed with current values

#### Test 21: Theme Toggle
**Objective**: Verify theme switching works

**Steps**:
1. Navigate to Settings tab
2. Note current theme
3. Toggle theme setting
4. Verify popup immediately updates to new theme
5. Close and reopen popup to verify persistence

**Expected Result**: 
- Immediate visual theme change
- Setting persists across popup sessions

#### Test 22: Auto-Add Setting
**Objective**: Verify auto-add to list setting works

**Steps**:
1. Navigate to Settings tab
2. Toggle auto-add setting
3. Verify setting state changes
4. Test if behavior changes (search and add word)

**Expected Result**: Setting toggles correctly and affects behavior

#### Test 23: Review Settings
**Objective**: Verify review reminder and session settings

**Steps**:
1. Navigate to Settings tab
2. Modify review reminder settings
3. Change session size (if applicable)
4. Verify changes are saved

**Expected Result**: Settings update and save correctly

#### Test 24: Settings Persistence
**Objective**: Verify settings persist across sessions

**Steps**:
1. Change multiple settings
2. Close popup completely
3. Reopen popup and navigate to Settings
4. Verify all changes are preserved

**Expected Result**: All setting changes persist across sessions

### Responsive Design and Layout

#### Test 25: Popup Resizing
**Objective**: Verify popup handles different sizes gracefully

**Steps**:
1. Open popup
2. If possible, resize popup window
3. Verify content adapts appropriately
4. Check for layout breaking points

**Expected Result**: Content remains usable at different sizes

#### Test 26: Content Overflow Handling
**Objective**: Verify long content doesn't break layout

**Steps**:
1. Search for words with very long definitions
2. Create lists with long names
3. Verify scrolling works appropriately
4. Check text truncation or wrapping

**Expected Result**: Long content handled gracefully with scrolling/truncation

#### Test 27: Tab Content Switching
**Objective**: Verify smooth transitions between tabs

**Steps**:
1. Switch between all tabs multiple times
2. Verify content changes smoothly
3. Check for any visual glitches during transitions
4. Verify tab states remain consistent

**Expected Result**: Smooth transitions, no visual artifacts

### Performance Testing

#### Test 28: Popup Opening Speed
**Objective**: Verify popup opens quickly

**Steps**:
1. Click extension icon multiple times
2. Measure time from click to fully loaded popup
3. Test with different system loads

**Expected Result**: Popup opens within 1-2 seconds consistently

#### Test 29: Search Performance
**Objective**: Verify search operations are responsive

**Steps**:
1. Perform multiple word searches
2. Measure response times
3. Test with complex words and simple words

**Expected Result**: Most searches complete within 2-3 seconds

#### Test 30: Memory Usage
**Objective**: Verify popup doesn't cause memory issues

**Steps**:
1. Open and close popup multiple times
2. Perform various operations within popup
3. Monitor system memory usage (if possible)
4. Leave popup open for extended periods

**Expected Result**: No apparent memory leaks or performance degradation

### Error Recovery

#### Test 31: Popup Recovery from Errors
**Objective**: Verify popup recovers from JavaScript errors

**Steps**:
1. Trigger various error conditions
2. Verify popup remains functional
3. Test error boundary behavior
4. Verify error messages are user-friendly

**Expected Result**: Popup continues functioning despite non-critical errors

#### Test 32: Network Connectivity Issues
**Objective**: Verify behavior during network problems

**Steps**:
1. Disconnect internet while using popup
2. Attempt various operations
3. Reconnect internet
4. Verify functionality returns

**Expected Result**: Graceful degradation offline, full function when online

### Accessibility Testing

#### Test 33: Keyboard Navigation
**Objective**: Verify popup is keyboard accessible

**Steps**:
1. Open popup
2. Navigate using only keyboard (Tab, Enter, Arrow keys)
3. Verify all interactive elements are reachable
4. Test tab order makes sense

**Expected Result**: Complete keyboard accessibility

#### Test 34: Screen Reader Compatibility
**Objective**: Verify popup works with screen readers (if possible)

**Steps**:
1. Enable screen reader (VoiceOver on macOS)
2. Navigate popup with screen reader
3. Verify content is properly announced
4. Test interactive elements

**Expected Result**: Screen reader can access all content and functions

#### Test 35: High Contrast Mode
**Objective**: Verify popup works in high contrast mode

**Steps**:
1. Enable system high contrast mode
2. Open popup
3. Verify all elements remain visible and usable
4. Test both light and dark high contrast modes

**Expected Result**: Full functionality maintained in high contrast

### Safari-Specific Testing

#### Test 36: Safari Version Compatibility
**Objective**: Verify popup works across Safari versions

**Steps**:
1. Test on latest Safari version
2. Test on older supported versions (if available)
3. Verify consistent behavior

**Expected Result**: Consistent functionality across supported Safari versions

#### Test 37: macOS Integration
**Objective**: Verify popup integrates properly with macOS

**Steps**:
1. Test popup behavior with different macOS themes
2. Verify popup respects system accessibility settings
3. Test with different display scaling settings

**Expected Result**: Proper integration with macOS system settings

#### Test 38: Extension Management Integration
**Objective**: Verify popup works with Safari extension management

**Steps**:
1. Disable and re-enable extension
2. Change extension permissions
3. Update extension (if possible)
4. Verify popup continues working correctly

**Expected Result**: Popup handles extension state changes gracefully

## Test Environment Setup

### Required Test Data
- Dictionary with known words for testing
- At least one vocabulary list with words
- Various settings configurations
- Test words: common words, uncommon words, non-existent words

### Testing Checklist
- [ ] All 38 test cases executed
- [ ] Issues documented with steps to reproduce
- [ ] Performance metrics recorded
- [ ] Accessibility requirements verified
- [ ] Cross-version compatibility confirmed
- [ ] Error handling validated

## Reporting Issues

When documenting issues:

1. **Environment Details**:
   - Safari version
   - macOS version
   - Extension version
   - Screen resolution/scaling

2. **Reproduction Steps**:
   - Exact sequence of actions
   - Specific content used
   - Expected vs actual behavior

3. **Evidence**:
   - Screenshots of issues
   - Console error messages
   - Performance measurements

4. **Impact Assessment**:
   - Severity level (critical, high, medium, low)
   - User impact description
   - Workaround availability