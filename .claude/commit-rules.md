When write a git commit message for the changes made. Follow these best practices:

1. Format:
  - First line: concise summary (50 chars max)
  - Blank line
  - Body: detailed explanation (wrap at 72 chars)
  - Footer: references, breaking changes, etc.

2. First line conventions:
  - Use imperative mood ("Add", "Fix", "Update", not "Added", "Fixed")
  - Capitalize first letter
  - No period at the end
  - Be specific but concise

3. Common prefixes:
  - feat: new feature
  - fix: bug fix
  - docs: documentation changes
  - style: formatting, missing semicolons, etc.
  - refactor: code restructuring without changing functionality
  - test: adding or updating tests
  - chore: maintenance tasks, dependency updates
  - perf: performance improvements

4. Body should explain:
  - What changed and why (not how)
  - Any side effects or consequences
  - Rationale for the approach taken

5. Example:
  feat: Add user authentication middleware
  
  Implement JWT-based authentication for API endpoints.
  This middleware validates tokens and attaches user data
  to the request object for protected routes.
  
  - Add auth.js middleware module
  - Include token validation and refresh logic
  - Update API routes to use authentication
  
  Closes #123

Please analyze the code changes and write an appropriate commit message following these guidelines.
