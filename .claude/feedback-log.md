# VocabDict User Feedback Log

## General Feedback
_This file tracks user feedback that applies broadly across the project_

### Date: 2025-07-26
- User prefers Xcode for Safari extension development (not VSCode)
- Git workflow should use feature branches with meaningful commits
- Documentation should be updated in place, no temporary files

### Date: 2025-07-27 - Testing Philosophy
- "You must avoid unnecessary mock in test. We prefer Detroit style tests."
  - Resolution: Use real implementations of services in tests
  - Only mock browser APIs that can't be implemented
  
- "Model: Represents data structure and state. SpacedRepetition should be a Service, not a Model. Because SpacedRepetition is not data."
  - Resolution: Place business logic in services/, not models/
  - Services contain algorithms and operations
  
- "I prefer to use actual implementations over mocks in tests. Those tests does not mean anything."
  - Resolution: Implement in-memory storage for realistic testing
  - Write integration tests that verify actual data flow
  - Test complete user workflows, not isolated functions