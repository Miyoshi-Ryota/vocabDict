# First Prompt
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

----------------------------------------------------------------------------

# Second Prompt
# Codebase Documentation and Refactoring Request

I've completed Phase 2 of the VocabDict Safari Extension implementation following spec-driven development. The codebase has grown complex and needs documentation and potential refactoring to maintain code quality and ensure Claude Code can continue working effectively.

## Current Status
- Phase 1 (Core Infrastructure) - Complete
- Phase 2 (Dictionary Features) - Complete
- The extension structure and implementation files are in the attached .cckiro directory

## Request

Please help me with the following tasks:

### 1. First, Analyze Existing Documentation

Review the existing files in `.cckiro/specs/`:
- `requirements.md`
- `design.md`
- `implementation-plan.md`

Understand what's already documented and what needs updating based on the actual implementation.

### 2. Update Existing Documentation

Based on your codebase analysis:

1. **Update `.cckiro/specs/implementation-plan.md`**
   - Mark completed tasks as DONE
   - Add notes about any deviations from the plan
   - Document any additional tasks that were needed
   - Update the schedule based on actual progress

2. **Update `.cckiro/specs/design.md`**
   - Update architecture diagrams if implementation differs
   - Revise data models to match actual implementation
   - Document any design decisions made during implementation
   - Add sections for implemented components

3. **Create/Update `.cckiro/specs/implementation-notes.md`** (if it doesn't exist)
   - Document actual implementation details
   - List any technical decisions made
   - Note any workarounds or temporary solutions
   - Document known issues and TODOs

### 3. Code Quality Assessment

Review the codebase and create `.cckiro/specs/code-review.md` with:

1. **Current Codebase Structure**
   - Actual file organization
   - Dependencies between modules
   - Which files belong to which phase

2. **Code Quality Issues**
   - Duplicated code locations
   - Complex functions needing refactoring
   - Missing error handling
   - Inconsistent patterns
   - Performance concerns

3. **Refactoring Priorities**
   - Critical: Must fix before Phase 3
   - Important: Should fix for maintainability  
   - Minor: Can be addressed later

### 4. Incremental Refactoring

Based on your analysis:

1. **Update code files directly**
   - Add missing comments to complex functions
   - Fix critical issues identified
   - Improve error handling
   - Standardize naming conventions

2. **For each refactoring:**
   - Make focused changes
   - Test that nothing breaks
   - Update relevant documentation in .cckiro/specs/
   - Commit with clear message about what was improved

### 5. Create Developer Onboarding Guide

Create `.cckiro/specs/developer-guide.md` with:

1. **Quick Start**
   - How to build and test the extension
   - Project structure overview
   - Where to find what

2. **Development Patterns**
   - Message passing patterns used
   - Storage access patterns
   - UI component patterns
   - Error handling patterns

3. **Contributing Guidelines**
   - How to add new features
   - Code style we're following
   - Testing approach
   - How to update documentation

## Approach

1. **Start by reading ALL code** to understand the implementation
2. **Compare with existing .cckiro documentation** to identify gaps
3. **Update existing files** rather than creating new ones where possible
4. **Document findings** in the appropriate .cckiro/specs/ files
5. **Make code improvements** incrementally
6. **Keep .cckiro as the single source of truth** for project documentation

## Priority Order

1. First: Update implementation-plan.md with current status
2. Second: Create code-review.md with findings
3. Third: Fix critical issues in code
4. Fourth: Update design.md to reflect reality
5. Fifth: Create developer-guide.md
6. Finally: Address non-critical improvements

This will help stabilize the codebase while maintaining the .cckiro directory as the central documentation hub for the project.