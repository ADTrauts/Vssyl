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