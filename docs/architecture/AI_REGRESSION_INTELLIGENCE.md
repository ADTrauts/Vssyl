# AI Regression Intelligence

**Program:** AI Architecture Phase 3  
**Date:** 2026-07-12  
**Status:** Active — canonical model only (no CI)  
**Source of Truth for:** `AIRegressionCase`

---

## Purpose

Important corrections become **future regression cases**.

Phase 3 ships the **model + builders**. CI integration is explicitly deferred.

---

## Stored fields

- Original request
- Expected behavior
- Expected sources / tools / permissions
- Expected grounding / uncertainty
- Expected response properties
- Links: `executionRecordId`, optional `evaluationId`, `correctionRouteId`
- Status: `DRAFT` | `ACTIVE` | `PASSING` | `FAILING` | `RETIRED`

---

## Service

`createAIRegressionCase` / `buildRegressionCaseDraft` in `regressionCaseService.ts`.

---

## Future

- Replay harness against FakeAIProvider
- CI job using ACTIVE cases
- Tie to Phase 1B Twin E2E patterns

Do **not** treat regression pass rate as live CI until wired.
