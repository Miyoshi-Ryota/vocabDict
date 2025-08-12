# VocabDict - Safari Web Extension for English Learners

VocabDict is a Safari Web Extension designed to help English learners improve their vocabulary through dictionary lookup, vocabulary management, and spaced repetition learning.

## Features

### 1. Dictionary Lookup
- Right-click context menu on macOS
- Text selection menu on iOS
- Comprehensive word information (definitions, synonyms, antonyms, examples)
- Quick add to vocabulary lists

### 2. Vocabulary Management
- Create and manage custom vocabulary lists
- Automatic word tracking with lookup counts
- Sort by difficulty, date added, or lookup frequency
- Import/export vocabulary data

### 3. Learning Mode
- Flashcard-based spaced repetition
- Track learning progress
- Review scheduling based on performance
- Daily review reminders

## Platform Support
- macOS: Safari 18.0+
- iOS: Safari on iOS 18.0+

## Development

### Prerequisites
- Xcode 15+
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build web extension resources only (webpack)
npm run build:dev       # Development build to Resources folder
npm run build           # Production build to Resources folder

# Build and compile complete app (requires Xcode)
npm run build:macos     # Build web resources + compile macOS app
npm run build:ios       # Build web resources + compile iOS app  
npm run build:all       # Build web resources + compile both platforms
```

### Project Structure
```
VocabDict/
├── Shared (Extension)/     # Safari extension files
│   └── Resources/         # Extension resources
├── iOS (App)/            # iOS app files
├── macOS (App)/          # macOS app files
├── src/                  # Additional JS modules
├── tests/                # Test files
└── .claude/              # Development notes
```

### Testing
This project follows Test-Driven Development (TDD) using the Detroit School approach:
- Write tests first
- Use real objects where possible
- Mock only external dependencies (browser APIs)
- Use integration tests with real message handlers

Current test coverage:
- Unit tests: 131 tests covering all services and UI components
- Integration tests: 16 comprehensive workflow tests
- Services tested: Storage, Dictionary, VocabularyList, MessageHandler, SpacedRepetition
- UI tested: Popup interface with real DOM and event handling
- Test approach: Uses waitFor helpers instead of fixed timeouts for reliable async testing

## Contributing
1. Create a feature branch
2. Make small, atomic commits
3. Ensure all tests pass
4. Submit a pull request

## License
[To be determined]