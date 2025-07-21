# Content Script Manual Testing Guide

## Overview
This guide provides manual testing procedures for the VocabDict Safari Extension content script functionality. Since Safari extensions cannot be effectively tested with Puppeteer (which only works with Chrome), these manual tests ensure the content script behaves correctly in the Safari environment.

## Prerequisites
- Safari browser with VocabDict extension installed and enabled
- Extension must be loaded from Xcode during development
- Various web pages for testing (suggested test pages included below)

## Test Environment Setup

### Create Test Pages
Create the following HTML file for testing:

```html
<!DOCTYPE html>
<html>
<head>
    <title>VocabDict Content Script Test Page</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px;
            max-width: 800px;
        }
        .content { padding: 20px; }
        .paragraph { margin-bottom: 20px; }
        .test-word { color: blue; font-weight: bold; }
    </style>
</head>
<body>
    <div class="content">
        <h1>VocabDict Content Script Test Page</h1>
        <div class="paragraph">
            The <span class="test-word">vocabulary</span> of a language contains all the words in it.
            Learning new words helps improve your language skills and comprehension.
        </div>
        <div class="paragraph">
            VocabDict makes it easy to <span class="test-word">understand</span> complex words in context.
            You can add words to your personal vocabulary lists for later review and practice.
        </div>
        <div class="paragraph">
            Reading should be an enjoyable <span class="test-word">experience</span>.
            The spaced repetition system helps you remember words effectively over time.
        </div>
        <div class="paragraph">
            Test words: hello, world, example, important, knowledge, development, amazing, beautiful
        </div>
    </div>
</body>
</html>
```

Save as `test-page.html` and open in Safari.

## Manual Test Cases

### 1. Text Selection Detection

**Test 1.1: Single Word Selection**
1. Open test page in Safari
2. Double-click on the word "vocabulary" to select it
3. **Expected**: Floating widget should appear near the selected text
4. **Expected**: Widget should show loading state initially
5. **Expected**: Widget should display word definition after lookup completes

**Test 1.2: Manual Text Selection**
1. Use mouse to select the word "understand" by clicking and dragging
2. **Expected**: Widget appears after selection
3. **Expected**: Widget contains word, pronunciation (if available), and definition

**Test 1.3: Case Insensitive Selection**
1. Select "HELLO" (in uppercase)
2. Select "Hello" (mixed case)  
3. Select "hello" (lowercase)
4. **Expected**: All cases should work and show same definition

**Test 1.4: Invalid Selections (Should Not Trigger Widget)**
1. Select multiple words: "vocabulary of a language"
2. Select very short text: "a" or "I"
3. Select numbers/punctuation: "123-456"
4. Select empty space or line breaks
5. **Expected**: No widget should appear for any of these

### 2. Widget Display and Positioning

**Test 2.1: Widget Positioning**
1. Select word near top of page
2. **Expected**: Widget appears below the selection
3. Select word near bottom of page
4. **Expected**: Widget adjusts position to stay visible (may appear above)
5. Select word near right edge
6. **Expected**: Widget adjusts horizontally to stay within viewport

**Test 2.2: Widget Content**
1. Select "hello"
2. **Expected**: Widget shows:
   - Word name in header
   - Close button (×) in top-right
   - Pronunciation (if available)
   - At least one definition with part of speech
   - "Add to List" button

**Test 2.3: Loading States**
1. Select any word
2. **Expected**: Immediate loading indicator: "Looking up..."
3. **Expected**: Content updates within 2-3 seconds
4. If lookup fails: **Expected**: Error message displayed

### 3. Widget Interactions

**Test 3.1: Close Widget**
1. Select word to show widget
2. Click the × (close) button
3. **Expected**: Widget disappears immediately
4. Alternative: Press Escape key
5. **Expected**: Widget disappears immediately

**Test 3.2: Click Outside to Close**
1. Select word to show widget
2. Click elsewhere on the page (not on widget)
3. **Expected**: Widget disappears

**Test 3.3: Click Inside Widget**
1. Select word to show widget
2. Click inside the widget content area
3. **Expected**: Widget remains visible

**Test 3.4: Add to List Action**
1. Select word to show widget
2. Click "Add to List" button
3. **Expected**: Button shows "Adding..." loading state
4. **Expected**: Button becomes disabled during operation
5. **Expected**: Success message appears: "Added to vocabulary!"
6. **Expected**: Widget auto-hides after ~2 seconds
7. Verify word was added by checking popup or vocabulary list

### 4. Context Menu Integration

**Test 4.1: Right-Click Context Menu**
1. Select word "example"
2. Right-click on selection
3. **Expected**: "Look up 'example'" option appears in context menu
4. Click the lookup option
5. **Expected**: Widget appears showing word definition

**Test 4.2: Context Menu with No Selection**
1. Right-click on page without selecting text
2. **Expected**: No VocabDict option in context menu

**Test 4.3: Context Menu with Invalid Selection**
1. Select multiple words
2. Right-click on selection
3. **Expected**: No VocabDict option appears (or appears but handles gracefully)

### 5. Keyboard Shortcuts

**Test 5.1: Keyboard Lookup**
1. Select word "knowledge"
2. Press Cmd+Shift+L (or configured shortcut)
3. **Expected**: Widget appears showing word definition

**Test 5.2: Escape to Close**
1. Show widget via any method
2. Press Escape key
3. **Expected**: Widget closes immediately

### 6. Multiple Widgets

**Test 6.1: Sequential Selections**
1. Select word "development"
2. Wait for widget to appear
3. Select different word "amazing"
4. **Expected**: First widget disappears, second widget appears
5. **Expected**: Only one widget visible at a time

**Test 6.2: Rapid Selections**
1. Quickly select multiple words in succession
2. **Expected**: Only the latest selection shows a widget
3. **Expected**: No memory leaks or multiple widgets

### 7. Error Handling

**Test 7.1: Network Errors**
1. Disable internet connection
2. Select word
3. **Expected**: Error message in widget: "Unable to lookup word" or similar
4. Re-enable internet and try again
5. **Expected**: Normal functionality resumes

**Test 7.2: Unknown Words**
1. Select made-up word like "xyzabc123"
2. **Expected**: Widget shows "Word not found" or similar message
3. **Expected**: "Add to List" button may be disabled or show different behavior

**Test 7.3: Extension Disabled**
1. Disable VocabDict in Safari preferences
2. Select words on test page
3. **Expected**: No widget appears
4. Re-enable extension
5. **Expected**: Functionality returns

### 8. Performance Tests

**Test 8.1: Response Time**
1. Select common word like "hello"
2. Measure time from selection to widget appearance
3. **Expected**: Widget appears within 1 second
4. **Expected**: Definition loads within 3 seconds

**Test 8.2: Memory Usage**
1. Perform 20+ word selections
2. Check Safari's memory usage in Activity Monitor
3. **Expected**: No significant memory leaks
4. **Expected**: Extension doesn't slow down browser

### 9. Cross-Page Testing

**Test 9.1: Different Websites**
Test on various websites:
- News articles (CNN, BBC)
- Wikipedia articles
- Blog posts
- Academic papers
- **Expected**: Consistent behavior across all sites

**Test 9.2: Different Content Types**
- Regular paragraphs
- Lists and bullet points
- Tables
- Quoted text
- **Expected**: Selection works in all content types

### 10. Edge Cases

**Test 10.1: Special Characters**
1. Select words with accents: "café", "naïve"
2. Select hyphenated words: "state-of-the-art"
3. Select words with apostrophes: "don't", "it's"
4. **Expected**: All handled correctly

**Test 10.2: Different Languages**
1. Test on pages with non-English content
2. **Expected**: Extension doesn't interfere with page functionality
3. **Expected**: Graceful handling of non-English words

**Test 10.3: Dynamic Content**
1. Test on pages that load content dynamically (AJAX)
2. Select words in newly loaded content
3. **Expected**: Extension works with dynamic content

## Troubleshooting

### Common Issues

**Widget doesn't appear:**
- Check Safari > Preferences > Extensions > VocabDict is enabled
- Check Safari > Develop > Web Inspector for JavaScript errors
- Reload the page and try again
- Check selection is a single word, 2+ characters

**Widget appears in wrong position:**
- Test with different viewport sizes
- Test scrolling up/down before selection
- Check browser zoom level (100% recommended)

**Lookup fails:**
- Check internet connection
- Check browser console for network errors
- Try with common words first

**Add to List doesn't work:**
- Check if popup shows the word was actually added
- Check browser console for errors
- Test with simpler words first

## Test Results Documentation

For each test session, document:
- Date and time
- Safari version
- Extension version  
- Operating system
- Any failed tests with screenshots
- Performance observations
- Suggestions for improvement

## Success Criteria

All manual tests should pass with:
- ✅ Widget appears reliably for valid selections
- ✅ Widget positioning works across viewport sizes
- ✅ All interactive elements function correctly
- ✅ Error states handled gracefully
- ✅ Performance is acceptable (< 1s response time)
- ✅ No JavaScript errors in console
- ✅ Memory usage remains stable
- ✅ Cross-site compatibility maintained

## Notes for Developers

- Save screenshots of failing tests
- Use Safari Web Inspector to check for errors
- Test with multiple users for usability feedback
- Document any browser-specific quirks discovered
- Update this guide as new features are added