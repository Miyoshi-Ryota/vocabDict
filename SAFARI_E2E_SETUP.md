# Safari E2E Testing Setup Guide

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Enable Safari WebDriver
```bash
# Enable Safari's remote automation (requires admin password)
npm run setup-safari

# Or manually:
sudo safaridriver --enable
```

### 3. Configure Safari
1. Open Safari
2. Go to **Safari > Preferences > Advanced**
3. Check "**Show Develop menu in menu bar**"
4. In the Develop menu, select "**Allow Remote Automation**"

### 4. Run Safari E2E Tests
```bash
# Run Safari-specific E2E tests
npm run test:safari

# Run all tests including Safari E2E
npm run test:all
```

## What Gets Tested

### ✅ Automated (Safari WebDriver)
- **Web page loading** - Extension test pages load correctly
- **Browser compatibility** - Web APIs work in Safari
- **JavaScript functionality** - No console errors
- **Page performance** - Load times within limits
- **DOM interactions** - Text selection and clicks work

### 🧪 Manual Testing Required
- **Extension installation** - Install from Xcode
- **Safari toolbar integration** - Extension icon appears
- **Popup functionality** - Clicking icon opens popup
- **Content script injection** - Text selection triggers widget
- **Background script** - Message passing works
- **Data persistence** - Settings and words saved

## Why This Approach?

Safari extensions have security restrictions that prevent full automation:

1. **Extension APIs** are not accessible to WebDriver
2. **Toolbar interactions** cannot be automated
3. **Popup windows** require manual testing
4. **Permission dialogs** need user interaction

## Test Commands

```bash
# Safari E2E tests only
npm run test:safari

# All tests (unit + integration + Safari E2E)
npm run test:all

# With verbose output
npm run test:safari -- --verbose

# Single test file
npm run test:safari -- safari-extension.test.js
```

## Expected Output

### ✅ Successful Run
```
PASS tests/e2e/safari-extension.test.js
  VocabDict Safari Extension E2E
    Safari Browser Integration
      ✓ should load test page in Safari
      ✓ should detect Safari browser
    Extension Detection
      ✓ should check for extension APIs
      ✓ should have browser API compatibility
    Web Components Testing
      ✓ should handle text selection
      ✓ should test page interaction elements
    Performance and Compatibility
      ✓ should load page within reasonable time
      ✓ should not have JavaScript errors
    Manual Testing Integration
      ✓ should provide manual testing guidance

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

### ⚠️ Safari WebDriver Not Available
```
Safari WebDriver not available: connect ECONNREFUSED 127.0.0.1:4444
Skipping Safari E2E tests. To enable:
1. sudo safaridriver --enable
2. Safari > Develop > Allow Remote Automation
```

## Troubleshooting

### Issue: "Safari WebDriver not available"
**Solution:**
```bash
# Re-enable Safari WebDriver
sudo safaridriver --enable

# Check Safari preferences
# Safari > Preferences > Advanced > Show Develop menu
# Develop > Allow Remote Automation
```

### Issue: "Permission denied"
**Solution:**
```bash
# Run with sudo if needed
sudo npm run setup-safari

# Or manually enable
sudo safaridriver --enable
```

### Issue: "Tests timeout"
**Solution:**
- Increase timeout in jest.safari.config.js
- Close other Safari windows
- Restart Safari

### Issue: "No tests found"
**Solution:**
```bash
# Check test file exists
ls tests/e2e/safari*.test.js

# Run specific test
npm run test:safari -- --testPathPattern=safari
```

## Manual Testing Checklist

For complete testing, also perform these manual steps:

### Extension Installation
- [ ] Build extension in Xcode
- [ ] Extension appears in Safari Preferences
- [ ] Extension can be enabled/disabled
- [ ] No installation errors

### UI Integration
- [ ] Extension icon appears in toolbar
- [ ] Icon has correct appearance
- [ ] Clicking icon opens popup
- [ ] Popup has correct size and content

### Functionality
- [ ] Text selection shows widget
- [ ] Dictionary lookup works
- [ ] Words can be added to lists
- [ ] Settings persist across sessions

### Performance
- [ ] Extension doesn't slow Safari
- [ ] No memory leaks
- [ ] No console errors in Web Inspector

## CI/CD Integration

For automated testing in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test Safari Extension
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: sudo safaridriver --enable
      - run: npm run test:safari
```

## Next Steps

1. **Run setup**: `npm run setup-safari`
2. **Run tests**: `npm run test:safari`
3. **Manual testing**: Use developer-guide.md checklist
4. **CI integration**: Add to GitHub Actions