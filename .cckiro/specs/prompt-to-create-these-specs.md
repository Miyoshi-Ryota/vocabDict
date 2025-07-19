Could you help to create the following safari extension?

The application is for English learners who want to improve their English vocabulary.
The application should have the following features:

1. ** Dictionary Lookup**: Users can search for words to get their meanings, synonyms, antonyms, and example sentences. It is easy to look up words from the right-click menu in macOS and from the text select menu on the iPhone.
2. ** User Vocabulary Lists**: Users can create and manage their own vocabulary lists, adding words they want to learn. They can easily add words to vocabulary lists from dictionary lookup results. Looked-up words are automatically added to the user's vocabulary list, and a number of lookup results are saved. Users can also sort vocabulary lists by the number of lookups and difficulty.
3. ** Learning Mode **: Users can practice their vocabulary through flashcards. The system manages review intervals based on spaced repetition principles, ensuring that users review words at optimal times for retention. Users can also mark words as known or unknown, and the system will adjust the review frequency accordingly.

And support the following operating systems:
- macOS
- iOS

The web extension should be built using your recommended technologies and frameworks that are suitable for building that web extension.


And we perform spec-driven development using Claude Code to create this extension.
```
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
```
from https://zenn.dev/sosukesuzuki/articles/593903287631e9
