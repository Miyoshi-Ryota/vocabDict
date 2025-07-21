# Safari Extension Manual Testing Guide

## Overview
This guide provides comprehensive manual testing procedures specifically for Safari Web Extension compatibility and Safari-specific functionality. Since the VocabDict extension is built as a Safari Web Extension, it requires testing that cannot be automated with tools like Puppeteer.

## Prerequisites
- macOS with Safari 14+ (Web Extensions support)
- Xcode installed for development builds
- VocabDict extension project
- Safari Developer tools enabled
- Test Apple ID (for App Store testing if applicable)

## Development Setup Testing

### 1. Extension Loading from Xcode

**Test 1.1: Initial Xcode Build**
1. Open VocabDict project in Xcode
2. Select target device/simulator (macOS)
3. Build and run (Cmd+R)
4. **Expected**: App builds successfully without errors
5. **Expected**: Extension host app launches
6. **Expected**: Safari opens automatically

**Test 1.2: Safari Recognition**
1. In Safari, go to Safari > Preferences > Extensions
2. **Expected**: "VocabDict Extension" appears in list
3. **Expected**: Extension can be enabled/disabled with checkbox
4. Enable the extension
5. **Expected**: Toolbar icon appears in Safari

**Test 1.3: Development Updates**
1. Make small change to extension code (add console.log)
2. Build and run again from Xcode
3. **Expected**: Changes reflected in Safari without manual refresh
4. **Expected**: No need to manually reload extension

### 2. Safari Browser Integration

**Test 2.1: Toolbar Icon**
1. Look for VocabDict icon in Safari toolbar
2. **Expected**: Icon is clearly visible and branded
3. **Expected**: Icon has appropriate size and appearance
4. Click icon
5. **Expected**: Popup opens immediately
6. **Expected**: Icon shows active state when popup is open

**Test 2.2: Extension Permissions**
1. In Safari > Preferences > Extensions > VocabDict
2. **Expected**: Correct permissions listed:
   - "Access to websites"
   - "Modify webpage content"
   - "Send messages to the app"
3. Test with permissions disabled/enabled
4. **Expected**: Extension behavior changes appropriately

**Test 2.3: Website Access Controls**
1. Check per-website settings in extension preferences
2. Test options: "Ask for Each Website", "Allow on All Websites", "Allow on Some Websites"
3. **Expected**: Controls work as specified
4. **Expected**: Extension respects user permissions

### 3. Safari-Specific API Testing

**Test 3.1: Browser API Compatibility**
1. Test `browser.runtime.sendMessage`
2. **Expected**: Messages pass between content script and background
3. Test `browser.tabs.query`
4. **Expected**: Can access active tab information
5. Test `browser.contextMenus`
6. **Expected**: Context menu items appear correctly

**Test 3.2: Storage API**
1. Test `browser.storage.local`
2. Add vocabulary words and lists
3. **Expected**: Data persists across browser sessions
4. **Expected**: Data survives browser restart
5. Check storage quota limits
6. **Expected**: Appropriate handling when approaching limits

**Test 3.3: Content Script Injection**
1. Navigate to various websites
2. **Expected**: Content script loads on all allowed sites
3. **Expected**: No conflicts with site-specific JavaScript
4. Test on sites with strict Content Security Policy
5. **Expected**: Extension works or fails gracefully

### 4. Cross-Version Compatibility

**Test 4.1: Safari Version Compatibility**
Test on multiple Safari versions if available:
- Safari 14 (minimum supported)
- Safari 15
- Safari 16
- Latest Safari version

For each version:
1. **Expected**: Extension loads successfully
2. **Expected**: All features work as intended
3. **Expected**: No JavaScript errors in console

**Test 4.2: macOS Version Compatibility**
Test on different macOS versions:
- macOS Big Sur (11.0+)
- macOS Monterey (12.0+)
- macOS Ventura (13.0+)
- Latest macOS

For each version:
1. **Expected**: Extension installs properly
2. **Expected**: Safari recognizes extension
3. **Expected**: No system-level conflicts

### 5. Performance in Safari Environment

**Test 5.1: Memory Usage**
1. Open Activity Monitor
2. Use extension extensively (50+ word lookups)
3. Monitor Safari memory usage
4. **Expected**: No significant memory leaks
5. **Expected**: Memory usage stabilizes
6. **Expected**: Browser remains responsive

**Test 5.2: CPU Usage**
1. Monitor CPU usage during extension operations
2. Perform intensive operations (bulk word additions)
3. **Expected**: CPU usage spikes are brief
4. **Expected**: No continuous high CPU usage
5. **Expected**: Extension doesn't make Safari slow

**Test 5.3: Battery Impact**
1. Test on MacBook with battery monitor
2. Use extension normally for 30+ minutes
3. **Expected**: No significant battery drain
4. **Expected**: Extension doesn't prevent CPU from idle state

### 6. Safari Developer Tools Integration

**Test 6.1: Web Inspector Access**
1. Right-click on any page > "Inspect Element"
2. **Expected**: Can debug content script
3. **Expected**: Extension code visible in debugger
4. Set breakpoints in content script
5. **Expected**: Breakpoints work correctly

**Test 6.2: Extension Debugging**
1. Open Safari > Develop > [Device] > [Extension Background Page]
2. **Expected**: Background script console accessible
3. **Expected**: Can debug background script
4. **Expected**: Network requests from extension visible

**Test 6.3: Console Logging**
1. Add console.log statements to extension code
2. **Expected**: Logs appear in appropriate console (content/background)
3. **Expected**: Error messages are clear and helpful
4. **Expected**: No unexpected console errors

### 7. Safari Security Model

**Test 7.1: Content Security Policy**
1. Test extension on sites with strict CSP
2. **Expected**: Extension respects CSP rules
3. **Expected**: No CSP violation errors
4. **Expected**: Graceful fallback when blocked

**Test 7.2: Cross-Origin Requests**
1. Test dictionary API calls from content script
2. **Expected**: CORS handled properly
3. **Expected**: Network requests succeed
4. **Expected**: Proper error handling for blocked requests

**Test 7.3: Private Browsing**
1. Open private browsing window
2. Test all extension functionality
3. **Expected**: Extension works in private mode
4. **Expected**: No data persists after private session ends
5. **Expected**: Appropriate privacy handling

### 8. Safari Extension Distribution

**Test 8.1: App Store Preparation (if applicable)**
1. Archive build in Xcode
2. **Expected**: Archive succeeds without warnings
3. **Expected**: All required metadata present
4. **Expected**: Icons and screenshots correct size/format

**Test 8.2: Extension Signing**
1. Check code signing in build settings
2. **Expected**: Extension properly signed with Developer ID
3. **Expected**: No signing errors or warnings
4. Test with different signing identities if available

### 9. User Experience in Safari

**Test 9.1: Extension Discovery**
1. Test user flow for finding and enabling extension
2. **Expected**: Clear instructions in app
3. **Expected**: Easy to enable in Safari preferences
4. **Expected**: Helpful onboarding experience

**Test 9.2: First-Time Setup**
1. Enable extension for first time
2. **Expected**: Appropriate permissions requests
3. **Expected**: Clear explanation of what extension does
4. **Expected**: Smooth onboarding flow

**Test 9.3: Extension Updates**
1. Update extension version in Xcode
2. Build and run updated version
3. **Expected**: Safari recognizes update
4. **Expected**: Data migrates properly between versions
5. **Expected**: User notified of updates appropriately

### 10. Safari-Specific Edge Cases

**Test 10.1: Tab Management**
1. Test with many open tabs (20+)
2. **Expected**: Extension works on all tabs
3. **Expected**: Performance remains acceptable
4. Switch between tabs rapidly
5. **Expected**: Extension state managed properly per tab

**Test 10.2: Window Management**
1. Test with multiple Safari windows
2. **Expected**: Extension works independently in each window
3. **Expected**: Popup appears in correct window
4. **Expected**: No cross-window interference

**Test 10.3: Extension Conflicts**
1. Install other Safari extensions
2. Test VocabDict with other extensions enabled
3. **Expected**: No conflicts between extensions
4. **Expected**: All extensions work independently
5. **Expected**: No JavaScript global variable conflicts

### 11. Error Recovery in Safari

**Test 11.1: Extension Crash Recovery**
1. Force extension crash (if possible) or disable/re-enable
2. **Expected**: Safari handles crash gracefully
3. **Expected**: Extension can be restarted
4. **Expected**: Data not corrupted by crash

**Test 11.2: Safari Crash Recovery**
1. Force quit Safari while extension is active
2. Restart Safari
3. **Expected**: Extension loads properly on restart
4. **Expected**: Previous state recovered where appropriate
5. **Expected**: No data loss

### 12. Accessibility in Safari

**Test 12.1: VoiceOver Integration**
1. Enable VoiceOver (Cmd+F5)
2. Test extension popup with VoiceOver
3. **Expected**: All elements announced correctly
4. **Expected**: Navigation works with VoiceOver
5. Test content script elements
6. **Expected**: Widget accessible to screen readers

**Test 12.2: Keyboard Accessibility**
1. Navigate Safari using only keyboard
2. Test extension popup keyboard navigation
3. **Expected**: All controls accessible via keyboard
4. **Expected**: Tab order is logical
5. **Expected**: Escape key closes popups

## Safari-Specific Success Criteria

All tests should pass with:
- ✅ Extension loads properly from Xcode development
- ✅ Safari recognizes and manages extension correctly
- ✅ All Safari APIs work as expected
- ✅ Performance acceptable across Safari versions
- ✅ No security model violations
- ✅ Proper integration with Safari developer tools
- ✅ Cross-version compatibility maintained
- ✅ Memory and CPU usage within reasonable bounds
- ✅ Accessibility features work in Safari context
- ✅ Error states handled gracefully

## Documentation Requirements

For each test session, record:
- Safari version and build number
- macOS version
- Xcode version used for build
- Extension version tested
- All failed tests with detailed descriptions
- Screenshots of Safari preferences showing extension
- Performance metrics where applicable
- Any Safari-specific quirks discovered

## Common Safari Extension Issues

### Troubleshooting Guide

**Extension not appearing in Safari:**
- Check Xcode build succeeded
- Check Safari > Preferences > Extensions
- Try quitting and restarting Safari
- Check extension host app is running

**Extension not working on websites:**
- Check website permissions in Safari preferences
- Check Content Security Policy conflicts
- Verify extension has necessary permissions
- Check Safari Web Inspector for errors

**Performance issues:**
- Check Activity Monitor for memory/CPU usage
- Look for JavaScript errors in console
- Test with other extensions disabled
- Check for memory leaks in extension code

**Data not persisting:**
- Check Safari storage permissions
- Verify browser.storage API usage
- Test private browsing behavior
- Check for storage quota issues

## Notes for Safari Extension Development

- Safari has stricter security policies than Chrome
- Some Chrome APIs may not be available or work differently
- Background pages have limited lifetime in Safari
- Content Security Policy is more strictly enforced
- Extension signing is required for distribution
- App Store review process applies to Safari extensions
- User permissions are more granular in Safari
- Private browsing requires special consideration