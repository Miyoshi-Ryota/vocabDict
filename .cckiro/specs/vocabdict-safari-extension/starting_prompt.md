# Create a Safari Web Extension for English Learners 
## Your Task
Could you help to create the following safari web extension?
We perform spec-driven development using Claude Code to create this extension.

## Summary Requirements for app
The safari web extension is for English learners who want to improve their English vocabulary.
The safari web extension should have the following features:

1. ** Dictionary Lookup**: Users can search for words to get their meanings, synonyms, antonyms, and example sentences. It is easy to look up words from the right-click menu in macOS and from the text select menu on the iPhone.
2. ** User Vocabulary Lists**: Users can create and manage their own vocabulary lists, adding words they want to learn. They can easily add words to vocabulary lists from dictionary lookup results. Looked-up words are automatically added to the user's vocabulary list, and a number of lookup results are saved. Users can also sort vocabulary lists by the number of lookups and difficulty.
3. ** Learning Mode **: Users can practice their vocabulary through flashcards. The system manages review intervals based on spaced repetition principles, ensuring that users review words at optimal times for retention. Users can also mark words as known or unknown, and the system will adjust the review frequency accordingly.

And support the following operating systems:
- macOS
- iOS

The safari web extension should be built using your recommended technologies and frameworks that are suitable for building that safari web extension.

This app name is "VocabDict".

## More Detailed Requirements
### Overview
VocabDict is a Safari Web Extension designed for English learners to improve their vocabulary through dictionary lookup, vocabulary management, and spaced repetition learning.

### Platform Requirements
- **macOS**: Safari 18.0 or later
- **iOS**: Safari on iOS 18.0 or later

### Functional Requirements

#### 1. Dictionary Lookup

##### 1.1 Core Lookup Features
- Users can search for English words to retrieve:
  - Word definitions (multiple meanings if applicable)
  - Part of speech (noun, verb, adjective, etc.)
  - Pronunciation guide (phonetic notation)
  - Synonyms
  - Antonyms
  - Example sentences demonstrating usage

##### 1.2 Access Methods
- **macOS**: Right-click context menu on selected text
- **iOS**: Text selection menu integration
- **Extension popup**: Manual search input field

##### 1.3 Dictionary Data
- Initial prototype will include a toy dictionary with 50-100 common English words
- Data structure must support future expansion to full dictionary API integration

#### 2. User Vocabulary Lists

##### 2.1 List Management
- Users can create multiple vocabulary lists with custom names
- Default list: "My Vocabulary" created automatically
- Users can rename, delete, and reorder lists

##### 2.2 Word Management
- Add words to lists from:
  - Dictionary lookup results (one-click add)
  - Manual entry in the extension
- Each word entry stores:
  - The word itself
  - Definition(s)
  - Date added
  - Number of lookups
  - Difficulty rating (user-assigned: easy/medium/hard)
  - Last reviewed date
  - Review performance history

##### 2.3 Automatic Features
- Looked-up words are automatically added to a designated list
- Lookup count is tracked and incremented for each search
- Duplicate detection prevents the same word from being added multiple times

##### 2.4 Sorting and Filtering
- Sort vocabulary lists by:
  - Alphabetical order
  - Date added
  - Number of lookups
  - Difficulty level
  - Last reviewed date
- Filter words by difficulty level
- Search within vocabulary lists

#### 3. Learning Mode

##### 3.1 Flashcard System
- Interactive flashcards showing:
  - Front: English word
  - Back: Definition, synonyms, example sentences
- Card flip animation for better user experience
- Progress indicator showing cards remaining in session

##### 3.2 Spaced Repetition Algorithm
- Implement a simplified spaced repetition system:
  - New words: Review after 1 day
  - Known words: Review intervals increase (1, 3, 7, 14, 30 days)
  - Unknown/difficult words: Reset to 1-day interval
- Daily review notifications (optional)

##### 3.3 User Interactions
- Mark words as:
  - Known (increases review interval)
  - Unknown (resets review interval)
  - Mastered (removes from active review)
- Skip option to postpone review
- Review session statistics:
  - Words reviewed
  - Accuracy rate
  - Streak tracking

#### 4. Data Storage and Sync

##### 4.1 Local Storage
- All user data stored locally using browser storage APIs
- Data persistence across browser sessions

##### 4.2 Data Export/Import
- Export vocabulary lists as JSON or CSV
- Import vocabulary lists from files
- Backup reminder system

#### 5. User Interface Requirements

##### 5.1 Extension Popup
- Clean, intuitive interface with tabs/sections:
  - Search/Lookup
  - My Lists
  - Learning Mode
  - Settings
- Responsive design for different screen sizes

##### 5.2 Visual Design
- Light/dark mode support (follows system preference)
- Clear typography for readability
- Consistent color scheme for difficulty levels
- Loading states for async operations
- Professional, beautiful design with animations for interactions

##### 5.3 Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option

### Non-Functional Requirements

#### Performance
- Dictionary lookup response time < 500ms
- Smooth animations and transitions
- Efficient memory usage for large vocabulary lists

#### Security
- No external data transmission without user consent
- Secure storage of user vocabulary data
- Content Security Policy compliance

#### Usability
- Intuitive interface requiring minimal learning curve
- Clear error messages and user feedback
- Undo functionality for destructive actions

### Development Methodology
- Spec-driven development using Claude Code to create this extension
- Iterative development with regular feedback loops
- Use of simpler technologies and architectures suitable for Safari Web Extensions
- Use TDD (Test-Driven Development) practices to ensure code quality. Unit Testing Principles, Practices, and Patterns by Vladimir Khorikov is a good reference. You must prefer Detroit School of TDD.

### Future Considerations (Not in MVP)
- Cloud sync across devices
- Integration with external dictionary APIs
- Audio pronunciation
- Advanced spaced repetition algorithms
- Social features (sharing lists)
- Gamification elements

### Success Criteria
- Users can successfully look up words and view comprehensive information
- Users can create and manage vocabulary lists effectively
- The spaced repetition system helps users retain vocabulary
- The extension works seamlessly on both macOS and iOS Safari


## What is spec-driven development?

Spec-driven development is a development methodology that consists of the following five phases:

### 1. Preparation phase

- The user gives Claude Code an overview of the task they want to perform
- In this phase, run !`mkdir -p ./.cckiro/specs`
- In `./cckiro/specs`, think of an appropriate spec name based on the task overview, and create a directory with that name
- For example, if the task is "Create an article component", create a directory named `./cckiro/specs/create-article-component`
- When creating the following files, create them in this directory

### 2. Requirements phase

- Based on the task overview given by the user, Claude Code creates a "requirements file" that the task must satisfy
- Claude Code presents the "requirements file" to the user and asks if there are any problems
- The user checks the "requirements file" and provides feedback to Claude Code if there are any problems
- The user checks the "requirements file" and repeats corrections to the "requirements file" until it says there are no problems

### 3. Design phase

- Claude Code creates a "design file" that describes a design that satisfies the requirements described in the "requirements file".
- Claude Code presents the "design file" to the user and asks if there are any problems.
- The user checks the "design file" and gives feedback to Claude Code if there are any problems.
- The user checks the "design file" and repeats corrections to the "requirements file" until the user replies that there are no problems.

### 4. Implementation planning phase

- Claude Code creates an "implementation plan file" to implement the design described in the "design file".
- Claude Code presents the "implementation plan file" to the user and asks if there are any problems.
- The user checks the "implementation plan file" and gives feedback to Claude Code if there are any problems.
- The user checks the "implementation plan file" and repeats corrections to the "requirements file" until the user replies that there are no problems.

### 5. Implementation phase

- Claude Code starts implementation based on the "implementation plan file".
- When implementing, please implement while following the contents of the "requirements file" and "design file".
