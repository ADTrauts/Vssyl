<!--
Testing Product Context
See README for the modular context pattern.
-->

# Testing Product Context

**Description:**
This file documents the product context for all testing infrastructure, tools, and strategies.

## 1. Header & Purpose
- **Purpose:**  
  The Testing module provides the infrastructure, tools, and strategies to ensure code quality, reliability, and maintainability across all modules. It covers unit, integration, and end-to-end (E2E) testing, as well as CI/CD integration and code quality enforcement.
- **Cross-References:**  
  - [testingStrategy.md] (detailed strategies and patterns)
  - [lintingAndCodeQuality.md] (code quality enforcement)
  - [systemPatterns.md] (test architecture)
  - [progress.md] (testing progress)

## 2. Problem Space
- Legacy and AI-generated code may lack sufficient test coverage or structure.
- Need for modular, extensible, and maintainable test infrastructure.
- Ensuring fast feedback, reliability, and low flakiness in tests.
- Integration of tests into CI/CD pipelines for automated quality gates.

## 3. User Experience Goals
- Fast, reliable feedback for developers and QA.
- Clear, actionable test results and error messages.
- Easy debugging and test isolation.
- Consistent test experience across modules.

## 3a. Panel-Based Layout & Navigation
- **Test Dashboard:** (Planned) Centralized dashboard for test results, coverage, and flakiness tracking.
- **Panels:** (Planned) Per-module test status, recent failures, and actionable insights.

## 4. Core Features & Requirements
- Unit, integration, and E2E test support.
- CI/CD integration for automated test runs.
- Code coverage reporting and enforcement.
- Test data management and mocking utilities.
- Modular test setup and teardown.
- Linting and code quality checks as part of the test suite.

## 4a. Feature Checklist (Implementation Status)
| Feature                        | Status      | Notes/Location (if implemented)                |
|-------------------------------|-------------|-----------------------------------------------|
| Unit Tests                    | ⚠️ Partial | server/tests, web/src/components/__tests__     |
| Integration Tests             | ⚠️ Partial | server/tests, web/src/components/__tests__     |
| E2E Tests                     | ❌ Planned  | To be defined                                 |
| CI/CD Integration             | ⚠️ Partial | .github/workflows, package.json scripts        |
| Code Coverage                 | ⚠️ Partial | To be reviewed (nyc, jest, etc.)              |
| Test Dashboard                | ❌ Planned  | For future                                    |
| Linting/Code Quality          | ✅ Yes      | lintingAndCodeQuality.md, package.json         |
| Test Data Management/Mocking  | ⚠️ Partial | To be reviewed                                |

## 5. Integration & Compatibility
- Integrated with CI/CD pipelines (GitHub Actions, npm scripts).
- Compatible with all modules (server, web, shared).
- Designed for extensibility to new modules and test types.

## 5a. Data Model Reference
- No dedicated data models; test data is managed via fixtures, mocks, and factories.

## 6. Technical Constraints & Decisions
- Use of Jest, React Testing Library, and other standard frameworks.
- Coverage thresholds to be defined and enforced.
- Tests must be isolated, repeatable, and fast.
- Mocking and test data strategies must be consistent across modules.

## 7. Success Metrics
- Test coverage percentage (target: 80%+ where feasible).
- Test pass rate and flakiness (target: <2% flaky tests).
- Time to feedback (target: <5 min for CI runs).
- Developer/QA feedback on test usability.

## 8. Design & UX References
- GitHub Actions, CircleCI, Vercel test dashboards.
- [testingStrategy.md], [lintingAndCodeQuality.md]

## 8a. Global Components & Integration Points
- Shared test utilities, mocks, and setup files in server/tests, web/src/components/__tests__, and shared/frontend/utils.

## 9. Testing & Quality
- The testing system itself is validated via meta-tests, CI checks, and regular review of test flakiness and coverage.
- Linting and code quality tools are integrated into the test process.

## 10. Future Considerations & Ideas
- Maintenance planner/service connection integrations (planned)
- Implement E2E and visual regression testing.
- Build a centralized test dashboard for real-time insights.
- Add performance and load testing.
- Expand test analytics and reporting.

## 11. Update History & Ownership
- **2024-06:** Major update to document testing infrastructure, strategies, and future plans.  
  Owner: [Your Name/Team]