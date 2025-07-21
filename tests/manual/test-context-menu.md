# Manual Test: Context Menu Functionality

## Test Setup

1. Build and install the Safari extension
2. Enable the extension in Safari
3. Open Safari Developer Console (Develop > Show Web Inspector)

## Test Cases

### Test 1: Basic Context Menu
1. Navigate to any webpage (e.g., https://en.wikipedia.org/wiki/English_language)
2. Select a word (e.g., "language")
3. Right-click on the selection
4. Verify "Look up 'language' in VocabDict" appears in context menu
5. Click the menu item

**Expected Results:**
- Console shows: "VocabDict: Context menu clicked: vocabdict-lookup language"
- Console shows: "VocabDict: Sending lookup message for word: language"
- Floating widget appears near the selected word
- Widget shows word definition

### Test 2: Content Script Not Loaded
1. Navigate to a new tab with a simple page
2. Select a word
3. Right-click and select VocabDict lookup

**Expected Results:**
- Console shows error about content script not available
- Word is stored in browser.storage.local
- Opening the popup shows the word automatically

### Test 3: Invalid Selection
1. Select just a single letter "a"
2. Right-click and try VocabDict lookup

**Expected Results:**
- Console shows: "VocabDict: Invalid word selection: a"
- No widget appears

### Test 4: Multiple Word Selection
1. Select a phrase like "hello world"
2. Right-click and select VocabDict lookup

**Expected Results:**
- Widget appears for the entire phrase
- If not found in dictionary, shows "Word not found" message

## Debugging Tips

### Check Background Script Console
1. Open Safari > Develop > Web Extension Background Pages > VocabDict
2. Look for console messages starting with "VocabDict:"

### Check Content Script Console
1. Open Web Inspector on the current page
2. Look for console messages from content.js

### Common Issues and Solutions

**Issue: Context menu doesn't appear**
- Check if extension has proper permissions
- Verify manifest.json includes "contextMenus" permission

**Issue: "Content script not available" error**
- Content script may not be injected on certain pages (like Safari internal pages)
- Try on a regular website

**Issue: Widget doesn't appear**
- Check content script console for errors
- Verify content.css is loaded
- Check if lookupWord message is being sent

## Success Criteria

✅ Context menu item appears when text is selected
✅ Clicking menu item triggers word lookup
✅ Floating widget appears with word definition
✅ Console logs show proper message flow
✅ Fallback to popup works when content script unavailable