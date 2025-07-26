# Xcode Setup for VocabDict

## Adding dist/ folder to Copy Bundle Resources

The webpack build creates JavaScript files in `Shared (Extension)/Resources/dist/`, but Xcode needs to be told to include these files in the extension bundle.

### Method 1: Add dist folder to Xcode (Recommended)

1. Open `vocabDict.xcodeproj` in Xcode
2. In the project navigator, right-click on `Shared (Extension)/Resources`
3. Select "Add Files to 'vocabDict'..."
4. Navigate to and select the `dist` folder
5. Make sure these options are selected:
   - ✅ Create folder references (not groups)
   - ✅ Add to targets: "vocabDict Extension"
6. Click "Add"

The dist folder should appear in blue (folder reference) rather than yellow (group).

### Method 2: Update Build Phases

1. Select the project in Xcode navigator
2. Select "vocabDict Extension" target
3. Go to "Build Phases" tab
4. Expand "Copy Bundle Resources"
5. Click the "+" button
6. Add the dist folder
7. Make sure it's set to copy as a folder reference

### Verify the Setup

After adding the dist folder:
1. Build the project (⌘B)
2. Right-click on the built app → Show Package Contents
3. Navigate to: Contents/PlugIns/vocabDict Extension.appex/Contents/Resources/
4. Verify the dist folder exists with your JS files

## Alternative: Change Webpack Output

If you prefer not to modify the Xcode project, you can change webpack to output directly to Resources:

```javascript
// In webpack.config.js, change output path:
output: {
  path: path.resolve(__dirname, 'Shared (Extension)/Resources'),
  filename: '[name].js',
  clean: false  // Don't clean the entire Resources folder!
}

// And update manifest.json:
"background": {
  "scripts": [ "background.js" ],
  "persistent": false
},
"content_scripts": [{
  "js": [ "content.js" ],
  // ...
}]
```

## Build Order

The correct build order is:
1. Run webpack build first: `npm run build:dev`
2. Then build in Xcode

This ensures the dist folder exists before Xcode tries to copy it.

## Troubleshooting

### "dist folder not found" error
- Make sure to run `npm run build:dev` before building in Xcode
- The dist folder must exist when Xcode runs

### Files not updating
- Clean build folder in Xcode: Product → Clean Build Folder (⇧⌘K)
- Delete the dist folder and rebuild: `rm -rf "Shared (Extension)/Resources/dist" && npm run build:dev`

### Extension still not loading
- Check Safari → Settings → Extensions → VocabDict → Details
- Look for any error messages
- Verify manifest.json paths match the actual file locations