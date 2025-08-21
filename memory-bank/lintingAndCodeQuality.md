# Linting and Code Quality Policy

## Overview

This project enforces strict linting and code quality standards across all codebases. Linting is required for all pull requests and merges, and is enforced in CI/CD for both frontend (`web/`) and backend (`server/`).

## Linting Configurations

- **Frontend (`web/`):**
  - Uses classic `.eslintrc.json` (JSON format).
  - Suitable for Next.js/React/TypeScript projects.
  - Run with: `npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings=0`

- **Backend (`server/`):**
  - Uses the new flat config `eslint.config.js` (JavaScript format).
  - Suitable for modern Node/TypeScript setups.
  - Run with: `npx eslint . --ext .ts,.js --max-warnings=0`

- **Config Types:**
  - Do not mix config types in the same directory. Each subproject maintains its own ESLint config style.
  - See `activeContext.md` for a summary of config types in use.

## CI/CD Enforcement

- Linting is enforced in CI/CD for all PRs and pushes.
- The build will fail if any linter errors or warnings are present (`max-warnings=0`).
- Both frontend and backend must pass linting for a PR to be merged.
- Example CI steps (GitHub Actions):

```yaml
- name: Lint frontend (web)
  run: |
    cd web
    npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings=0

- name: Lint backend (server)
  run: |
    cd server
    npx eslint . --ext .ts,.js --max-warnings=0
```

## Contributor Workflow

- Run the linter locally before pushing code:
  - `cd web && npx eslint . --ext .ts,.tsx,.js,.jsx`
  - `cd server && npx eslint . --ext .ts,.js`
- Fix all errors and warnings before submitting a PR.
- Use `--fix` to auto-fix where possible, but review remaining issues manually.
- Do not ignore or suppress linter warnings/errors unless absolutely necessary and justified in code review.

## Additional Notes

- Prettier is not currently enforced, but may be added for code formatting consistency.
- For questions or updates to linting policy, update this file and notify the team.

## New Rules and Patterns (2024-06)

### 1. Express Request Augmentation & Type Safety
- The Express `Request` object is globally augmented (via `server/types/express.d.ts`) to include a `user` property, attached by authentication middleware.
- When accessing `req.user` in route handlers, use a type guard or explicit type assertion (e.g., `const typedReq = req as Request & { user?: User }`) to satisfy TypeScript, since the property is not present on the base type.

### 2. Importing CommonJS Middleware in TypeScript
- Middleware files (e.g., `auth.js`) are written in CommonJS style and exported as named exports.
- When importing these in TypeScript, use `const { exportedName } = require('...')` instead of ES module import syntax, to avoid linter/type errors about missing exports.

### 3. Prisma Model Field Naming Consistency
- Prisma model fields use camelCase (e.g., `threadPresence`, `lastSeen`).
- Always reference Prisma model fields using the exact casing as defined in the schema.

### 4. Required Fields in Prisma Models
- Always ensure all required fields are provided when creating or updating Prisma records. Use fallback/default values if necessary.

### 5. Type-Safe Route Handlers
- Never use `any` for Express route handler parameters. Use type-safe patterns and document any necessary type assertions.

### 6. Runtime Type Guards for Request Data
- When extracting data from `req.body`, `req.query`, or `req.params`, always use runtime type checks or validation (e.g., `typeof`, `zod`, or similar).

### 7. Consistent Error Handling
- All route handlers and services should use consistent error logging and response patterns. Always log errors with context and return a standardized error response to the client.

### 8. WebSocket Service Singleton Pattern
- All WebSocket services (Socket.IO and ws-based) are implemented as singletons.
- Use the provided `getInstance()` method to access the shared instance.
- Do not instantiate WebSocket services directly or per feature/module.
- This ensures all real-time events are coordinated and prevents resource leaks or port conflicts.
- This pattern was enforced and clarified during the 2024-06 linter/type remediation process.

These rules are now part of the project's code quality standards and should be followed for all future development and code reviews.

## New Patterns: Robust Error Handling & Frontend Validation (2024-06)
- Centralized Express error-handling middleware is now required in all backend services. All API routes must return standardized error responses (`{ message, error?, code? }`).
- Prisma and authentication errors must be handled and logged. No stack traces or sensitive info in production responses.
- All frontend user flows (register, sign in, profile) must have inline validation for required fields, display backend error messages, and show loading states during submission.
- See [activeContext.md](./activeContext.md) for the latest implementation details and patterns.

## Related Documentation
- See [activeContext.md](./activeContext.md) for current config summary and recent changes.
- See [testingStrategy.md](./testingStrategy.md) for test enforcement and CI details.
- See [contributorGuide.md](./contributorGuide.md) for onboarding and workflow.

## Updating Linting & Code Quality Rules
- Propose changes via PR, with a clear summary and rationale in the PR description.
- Tag at least one codebase maintainer for review.
- If approved, update this file and cross-reference any related documentation.
- Summarize major changes in the 'Change History / Archived Rules' section below.

## Additional Best Practices To Implement (TODO)

| Best Practice | Owner | Target Date |
|---------------|-------|-------------|
| Environment Variable Validation |  |  |
| Dependency Audit & Update Workflow |  |  |
| Test Enforcement in CI |  |  |
| API Versioning |  |  |
| Graceful Shutdown |  |  |
| CORS and Security Headers |  |  |

These items are marked as TODOs and should be addressed as part of ongoing technical debt reduction and security hardening. Assign owners and target dates as appropriate.

---

## Change History / Archived Rules

- 2024-06: Major linter/type remediation; new rules for Express, Prisma, WebSocket singleton, and error handling added.
- [Add future changes here, with date and summary. Archive deprecated rules as needed.]

## Additional Notes

- Prettier is not currently enforced, but may be added for code formatting consistency.
- For questions or updates to linting policy, update this file and notify the team. 