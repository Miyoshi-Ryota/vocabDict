# Content Script Manual Testing Guide

This guide provides step-by-step instructions for manually testing the VocabDict Safari Extension content script functionality. Since Safari extensions have specific behaviors that automated testing tools like Puppeteer cannot accurately simulate, manual testing is essential.

## Prerequisites

1. VocabDict Safari Extension is installed and enabled in Safari
2. Extension has been granted necessary permissions
3. Test websites are accessible

## Test Cases

### Text Selection Detection

#### Test 1: Single Word Selection
**Objective**: Verify that selecting a single word triggers the floating widget

**Steps**:
1. Navigate to any webpage with text (e.g., news article, Wikipedia page)
2. Select a single word by double-clicking on it
3. Verify floating widget appears near the selected text
4. Check that widget shows "Looking up..." initially

**Expected Result**: Widget appears with loading state, positioned below/near selected text

**Common Issues**:
- Widget doesn't appear: Check console for errors, verify extension permissions
- Widget appears in wrong position: Check viewport boundaries and positioning logic

#### Test 2: Multi-word Selection (Should be Ignored)
**Objective**: Verify multi-word selections don't trigger the widget

**Steps**:
1. Navigate to a webpage with text
2. Select multiple words by dragging across them
3. Wait 2 seconds

**Expected Result**: No widget should appear

#### Test 3: Very Long Selection (Should be Ignored)
**Objective**: Verify very long selections are ignored

**Steps**:
1. Navigate to a webpage
2. Select an entire paragraph (more than 50 characters)
3. Wait 2 seconds

**Expected Result**: No widget should appear

#### Test 4: Empty/Whitespace Selection
**Objective**: Verify empty selections don't trigger widget

**Steps**:
1. Navigate to a webpage
2. Click and drag in whitespace areas
3. Try selecting just spaces or line breaks

**Expected Result**: No widget should appear

### Widget Display and Positioning

#### Test 5: Widget Content Display
**Objective**: Verify widget displays word information correctly

**Steps**:
1. Select a common English word (e.g., "hello", "world")
2. Wait for widget to load completely
3. Verify widget displays:
   - Word title
   - Pronunciation (if available)
   - Definitions with parts of speech
   - "Add to List" button
   - Close button (×)

**Expected Result**: All information is clearly displayed and formatted

#### Test 6: Widget Positioning
**Objective**: Verify widget positions correctly relative to selection

**Steps**:
1. Select words in different areas of the page:
   - Top of page
   - Bottom of page
   - Left edge
   - Right edge
   - Center of page
2. Verify widget appears near selection but stays within viewport

**Expected Result**: Widget is always visible and positioned appropriately

#### Test 7: Viewport Boundary Handling
**Objective**: Verify widget stays within viewport bounds

**Steps**:
1. Resize browser window to different sizes (small, medium, large)
2. Select words near edges of viewport
3. Verify widget repositions to stay visible

**Expected Result**: Widget never extends beyond viewport boundaries

### Widget Interactions

#### Test 8: Close Button Functionality
**Objective**: Verify close button hides widget

**Steps**:
1. Select a word to show widget
2. Click the close button (×) in widget header
3. Verify widget disappears immediately

**Expected Result**: Widget closes instantly

#### Test 9: Click Outside to Close
**Objective**: Verify clicking outside widget closes it

**Steps**:
1. Select a word to show widget
2. Click anywhere else on the page (not on widget)
3. Verify widget disappears

**Expected Result**: Widget closes when clicking outside

#### Test 10: Escape Key to Close
**Objective**: Verify Escape key closes widget

**Steps**:
1. Select a word to show widget
2. Press Escape key
3. Verify widget disappears

**Expected Result**: Widget closes on Escape key press

#### Test 11: Add to List Functionality
**Objective**: Verify "Add to List" button works correctly

**Steps**:
1. Select a word to show widget
2. Click "Add to List" button
3. Verify button shows "Adding..." state
4. Wait for completion
5. Verify success feedback appears

**Expected Result**: 
- Button becomes disabled during operation
- Success message appears
- Word is added to vocabulary list

### Error Handling

#### Test 12: Network Error Handling
**Objective**: Verify graceful handling of lookup failures

**Steps**:
1. Disconnect internet or block extension network requests
2. Select a word
3. Wait for timeout
4. Verify error message is shown

**Expected Result**: Error message displayed instead of crash

#### Test 13: Unknown Word Handling
**Objective**: Verify handling of words not in dictionary

**Steps**:
1. Select an uncommon/made-up word (e.g., "xyzabc123")
2. Wait for lookup to complete
3. Verify appropriate "not found" message

**Expected Result**: User-friendly "word not found" message

#### Test 14: Very Long Word Handling
**Objective**: Verify handling of extremely long words

**Steps**:
1. Select a very long word (if available) or create one in a text editor
2. Copy/paste into a webpage and select it
3. Verify system handles it gracefully

**Expected Result**: Either processes normally or shows appropriate error

### Multiple Widgets

#### Test 15: Sequential Widget Creation
**Objective**: Verify only one widget shows at a time

**Steps**:
1. Select a word to show first widget
2. Without closing first widget, select another word
3. Verify only one widget is visible (the newest one)

**Expected Result**: Previous widget disappears when new one appears

### Performance

#### Test 16: Rapid Selections
**Objective**: Verify system handles rapid consecutive selections

**Steps**:
1. Quickly select multiple words in succession (don't wait for widgets to load)
2. Verify system remains responsive
3. Check for memory leaks (multiple widgets in DOM)

**Expected Result**: System remains responsive, no DOM pollution

#### Test 17: Selection Response Time
**Objective**: Verify widget appears within reasonable time

**Steps**:
1. Select various words
2. Time from selection to widget appearance
3. Time from widget appearance to content loading

**Expected Result**: 
- Widget appears within 200ms of selection
- Content loads within 2 seconds

### Cross-page Testing

#### Test 18: Different Page Types
**Objective**: Verify functionality across different webpage types

**Test Pages**:
- News articles (e.g., BBC, CNN)
- Wikipedia articles
- Blog posts
- E-commerce sites
- Social media sites
- PDF documents (if supported)

**Steps**: Perform basic selection tests on each page type

**Expected Result**: Consistent behavior across all page types

#### Test 19: Dynamic Content
**Objective**: Verify functionality with dynamic content

**Steps**:
1. Navigate to a page with dynamic content (e.g., social media feed)
2. Wait for new content to load
3. Select words from dynamically loaded content
4. Verify widget works normally

**Expected Result**: Widget works on both static and dynamic content

### Safari-Specific Tests

#### Test 20: Safari Permission Handling
**Objective**: Verify extension handles permission states correctly

**Steps**:
1. Revoke extension permissions in Safari preferences
2. Try to use extension functionality
3. Re-grant permissions
4. Verify functionality returns

**Expected Result**: Graceful degradation when permissions denied, full functionality when restored

#### Test 21: Safari Private Browsing
**Objective**: Verify extension works in private browsing mode

**Steps**:
1. Open Safari private browsing window
2. Navigate to test page
3. Test basic word selection functionality
4. Verify data doesn't persist after closing private window

**Expected Result**: Extension works in private mode, no data persistence

#### Test 22: Safari Tab Management
**Objective**: Verify extension works correctly across multiple tabs

**Steps**:
1. Open multiple tabs with different content
2. Test extension functionality in each tab
3. Switch between tabs while widgets are open
4. Verify no interference between tabs

**Expected Result**: Independent functionality per tab, no cross-tab interference

## Reporting Issues

When reporting bugs found during manual testing:

1. **Browser Information**:
   - Safari version
   - macOS version
   - Extension version

2. **Reproduction Steps**:
   - Exact steps to reproduce
   - Specific words or websites used
   - Any error messages seen

3. **Expected vs Actual Behavior**:
   - Clear description of what should happen
   - What actually happened
   - Screenshots if applicable

4. **Console Logs**:
   - Open Safari Web Inspector
   - Check Console tab for errors
   - Include relevant error messages

## Test Completion Checklist

- [ ] All 22 test cases completed
- [ ] Issues documented with reproduction steps
- [ ] Performance metrics noted
- [ ] Safari-specific behaviors verified
- [ ] Cross-platform testing completed (if applicable)
- [ ] Regression testing for previously fixed issues