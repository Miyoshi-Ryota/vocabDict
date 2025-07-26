# Testing VocabDict in Safari

## Prerequisites
- macOS with Safari 18.0+
- Xcode installed
- Developer mode enabled in Safari

## Enable Safari Developer Mode
1. Open Safari
2. Go to Safari → Settings (⌘,)
3. Click on the "Advanced" tab
4. Check "Show features for web developers"
5. You should now see a "Develop" menu in the menu bar

## Build the Extension

### 1. Build JavaScript Bundle
First, we need to build our JavaScript files:

```bash
# Install dependencies if not already done
npm install

# Build for development (with source maps)
npm run build:dev

# Or build for production
npm run build
```

This will create bundled files in `Shared (Extension)/Resources/dist/`.

### 2. Build in Xcode
1. Open `vocabDict.xcodeproj` in Xcode
2. Select your development team:
   - Click on the project in the navigator
   - Select the "vocabDict" target
   - Go to "Signing & Capabilities"
   - Select your team from the dropdown
3. Do the same for the "vocabDict Extension" target
4. Choose your build target:
   - For macOS: Select "My Mac" from the device list
   - For iOS: Select your iPhone or a simulator
5. Build and run (⌘R)

## Testing on macOS

### Enable the Extension
1. When Xcode runs the app, it will open a container app
2. Click "Quit and Open Safari Settings..."
3. In Safari Settings → Extensions:
   - Find "VocabDict"
   - Check the box to enable it
   - Grant any requested permissions

### Test the Extension
1. **Popup**: Click the VocabDict icon in the toolbar
2. **Context Menu**: 
   - Select some text on any webpage
   - Right-click and look for "Look up in VocabDict"
3. **Developer Tools**:
   - Right-click the extension icon → "Inspect Popup"
   - Develop menu → Web Extension Background Content → VocabDict

## Testing on iOS

### Install on Device/Simulator
1. Build and run with iOS target selected
2. The app will install on your device/simulator
3. Open Settings → Safari → Extensions
4. Enable VocabDict
5. Grant permissions when prompted

### Test the Extension
1. Open Safari on iOS
2. Navigate to any webpage
3. Select text to see the lookup button
4. Tap the AA icon in the address bar to see extension options

## Debugging

### Console Logs
- **Background Script**: Develop → Web Extension Background Content → VocabDict
- **Content Script**: Develop → [Current Page] → Show JavaScript Console
- **Popup**: Right-click popup → Inspect Element

### Common Issues

1. **Extension not appearing**:
   - Ensure it's enabled in Safari Settings
   - Try restarting Safari
   - Check that the build succeeded in Xcode

2. **Changes not reflecting**:
   - Rebuild JavaScript: `npm run build:dev`
   - Clean build in Xcode: Product → Clean Build Folder (⇧⌘K)
   - Rebuild in Xcode: Product → Build (⌘B)

3. **Permission errors**:
   - Check manifest.json permissions
   - Grant permissions in Safari settings
   - Check console for specific error messages

## Development Workflow

### Hot Reload Setup
For faster development:

1. Run webpack in watch mode:
   ```bash
   npm run watch
   ```

2. After webpack rebuilds, you need to:
   - Reload the extension in Safari
   - Or rebuild in Xcode (for manifest changes)

### Quick Test Cycle
1. Make code changes
2. Webpack auto-rebuilds (if using watch mode)
3. Right-click extension icon → "Reload"
4. Test your changes

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Tab navigation works
- [ ] Search input accepts text
- [ ] Context menu appears on text selection (macOS)
- [ ] Text selection button appears (iOS)
- [ ] Storage operations work (check in console)
- [ ] Light/dark theme switching works
- [ ] No console errors in background/content/popup

## Production Testing

Before releasing:
1. Build for production: `npm run build`
2. Test on multiple Safari versions
3. Test on both Intel and Apple Silicon Macs
4. Test on various iOS devices and screen sizes
5. Check memory usage and performance
6. Verify all permissions are necessary