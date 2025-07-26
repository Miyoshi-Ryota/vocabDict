# VocabDict Development Notes

## Project Structure
- Using Xcode's Safari Extension App template
- Extension files are in `Shared (Extension)/Resources/`
- Manifest v3 is already set up
- Icons and basic popup structure exist

## Important Discoveries

### Safari Extension Specifics
- Safari extensions use `browser.*` APIs, not `chrome.*`
- ES6 modules are NOT supported in Safari extensions (use webpack bundling)
- Content scripts need explicit permissions in manifest
- Use `service_worker` instead of `scripts` in manifest v3 background
- No `persistent` key in manifest v3

### Build Process
1. Run webpack to build JS files: `npm run build:dev`
2. Files output directly to `Shared (Extension)/Resources/`
3. Build in Xcode (no dist folder needed)
4. All resources must be listed in Xcode project file

### Xcode Configuration
- Add all resource files to membershipExceptions
- Include: _locales, images, manifest.json, all JS files, data folder
- Use folder references (blue) for folders
- Individual files should be explicitly listed

## Best Practices
- Keep commits small and atomic
- Test on both macOS and iOS regularly
- Use Detroit School TDD (minimal mocking)
- Run `./scripts/build-extension.sh` for quick builds

## Testing
- Unit tests: 19 tests passing
- Coverage: StorageManager and constants fully tested
- Mock only browser APIs, use real implementations elsewhere

## Debugging Safari Extensions
- Enable Developer mode in Safari
- Use Develop menu to inspect:
  - Background content (service worker)
  - Popup (right-click → Inspect)
  - Content scripts (in page console)

## File Structure Decisions
- Source files in `src/` directory
- Webpack builds to `Shared (Extension)/Resources/`
- No intermediate dist folder (causes Xcode issues)
- Keep manifest paths simple (no subdirectories)