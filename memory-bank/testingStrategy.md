<!--
Update Rules for testingStrategy.md
- Updated when testing philosophy, coverage requirements, or QA workflow change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Testing & QA Strategy

## Philosophy
- Testing is essential for reliability, maintainability, and rapid iteration.
- All critical business logic, core modules, and shared utilities must be covered by automated tests.
- Tests should be fast, deterministic, and easy to maintain.
- Testing is a shared responsibility—every contributor is expected to write and maintain tests for their code.

## Coverage Requirements
- **Unit Tests:**
  - All core business logic, utility functions, and module logic must have unit tests.
  - Target: 80%+ coverage for core modules and shared utilities.
- **Integration Tests:**
  - Key module interactions, API endpoints, and database operations must be covered by integration tests.
  - Target: All critical user flows and API endpoints.
- **End-to-End (E2E) Tests:**
  - Major user journeys (e.g., login, file upload, chat, module install) must be covered by E2E tests.
  - Target: All high-value user flows.
- **Manual QA:**
  - Used for exploratory testing, UI/UX review, and edge cases not easily automated.

## Recommended Tools & Frameworks
- **Unit/Integration:** Vitest (server + web runtime), supertest (API)
- **E2E:** Playwright (`.ts` specs in `tests/e2e/`)
- **Coverage:** Vitest coverage, Playwright trace/report tools
- **Linting/Type Checking:** See [lintingAndCodeQuality.md](./lintingAndCodeQuality.md)

## QA Workflow
- All new features and bugfixes must include appropriate tests (unit, integration, or E2E as appropriate).
- Tests and type checks must pass locally; CI (`.github/workflows/ci.yml`) currently runs `pnpm type-check`, web production build, web Vitest, and server Vitest via the job steps / `pnpm test` — **lint is not currently part of that CI gate** (see [lintingAndCodeQuality.md](./lintingAndCodeQuality.md)).
- Prefer `pnpm verify:ci` locally as a CI-like gate (type-check + web build + server test).
- Coverage targets above are philosophy; do not assume CI fails solely on coverage deltas unless a coverage gate is added to the workflow.
- Manual QA is performed before major releases or after significant UI/UX changes.
- Known issues and test gaps: check [progress.md](./progress.md) when status context is needed.

## Cross-References
- [lintingAndCodeQuality.md](./lintingAndCodeQuality.md) (linting, code quality, CI enforcement)
- [progress.md](./progress.md) (test enforcement, known issues)
- [moduleSpecs.md](./moduleSpecs.md) (module-specific test requirements)

---

## Archive (Deprecated Strategies/Requirements)
- [Add deprecated or superseded testing strategies/requirements here, with date and summary.] 