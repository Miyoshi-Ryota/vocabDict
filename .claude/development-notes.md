# VocabDict Development Notes

## Project Structure
- Using Xcode's Safari Extension App template
- Extension files are in `Shared (Extension)/Resources/`
- Manifest v3 is already set up
- Icons and basic popup structure exist

## Important Discoveries
- Safari extensions use `browser.*` APIs, not `chrome.*`
- ES6 modules are NOT supported in Safari extensions (use webpack bundling)
- Content scripts need explicit permissions in manifest

## Best Practices
- Keep commits small and atomic
- Test on both macOS and iOS regularly
- Use Detroit School TDD (minimal mocking)