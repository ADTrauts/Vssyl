# Analytics Capability Phase 1 — Test Report

**Program:** Analytics Capability Phase 1 — Federated L2 Trust & Service Boundary  
**Date:** 2026-06-22  
**Status:** Complete

---

## 1. Test strategy

Phase 1 tests focus on:

1. Policy Engine analytics actions and dual enforcement
2. Capability service authorization + activity side effects
3. Dashboard summary federation (Chat/Todo rollup mocks)
4. Module rollup contract unit tests
5. Frontend ownership registry

**Out of scope:** E2E browser tests, warehouse pipeline tests, certification gates.

---

## 2. Test inventory

| File | Area | Cases |
|------|------|-------|
| `server/src/auth/__tests__/policyEngine.test.ts` | PE | `analytics:read` personal/ dashboard_summary; `analytics:admin` business |
| `server/src/auth/__tests__/analyticsPolicyDual.test.ts` | Dual layer | Allow + security deny |
| `server/src/services/analytics/__tests__/analyticsCapabilityService.test.ts` | Capability | Policy deny; personal read + activity |
| `server/src/services/analytics/__tests__/analyticsActivityService.test.ts` | Activity | personal, dashboard summary, export envelopes |
| `server/src/services/analytics/__tests__/analyticsDashboardSummaryService.test.ts` | Summary | Policy deny; rollup wiring; enterprise projection |
| `server/src/services/__tests__/chatAnalyticsService.test.ts` | Chat rollup | Dashboard-scoped unread count |
| `server/src/services/todo/__tests__/todoAnalyticsRollupService.test.ts` | Todo rollup | Pending task count scope |
| `web/src/lib/__tests__/analyticsCapabilityOwnership.test.ts` | Registry | Canonical surfaces, path helper |
| `web/src/lib/__tests__/dashboardAnalyticsFacade.test.ts` | Consumer | Pre-existing facade mapping (unchanged) |

---

## 3. Execution

Run from repository root:

```bash
pnpm --filter vssyl-server test -- analyticsCapability analyticsActivity analyticsDashboard analyticsPolicyDual policyEngine chatAnalytics todoAnalytics
pnpm --filter vssyl-web test -- analyticsCapabilityOwnership dashboardAnalyticsFacade
```

Or full server suite:

```bash
pnpm --filter vssyl-server test
```

---

## 4. Coverage against Phase 1 acceptance

| Acceptance criterion | Test evidence |
|---------------------|---------------|
| PE on all canonical routes | `policyEngine.test.ts`, `analyticsPolicyDual.test.ts`, capability deny test |
| Chat/Todo federation | `analyticsDashboardSummaryService.test.ts`, rollup unit tests |
| Activity on reads | `analyticsActivityService.test.ts`, capability personal test |
| Ownership registry | `analyticsCapabilityOwnership.test.ts` |
| No placeholder subscriber | Code removal verified; no event subscriber test required |

---

## 5. Gaps (acceptable for Phase 1)

| Gap | Rationale | Target |
|-----|-----------|--------|
| No integration test for full HTTP `/api/analytics/*` stack | Unit coverage sufficient for L2 boundary | Phase 2 |
| Business workspace page untested in vitest | Server business analytics已有 tests elsewhere | Optional UI test Phase 2 |
| `analytics:admin` not yet on live operator routes | Action wired; satellites unchanged | Admin program |

---

## 6. Result

**Phase 1 test bar:** **Met** — all targeted unit tests pass (2026-06-22 run).

| Suite | Result |
|-------|--------|
| `analyticsCapabilityService.test.ts` | ✅ 2/2 |
| `analyticsActivityService.test.ts` | ✅ 3/3 |
| `analyticsDashboardSummaryService.test.ts` | ✅ 3/3 |
| `analyticsPolicyDual.test.ts` | ✅ 2/2 |
| `chatAnalyticsService.test.ts` (rollup) | ✅ 4/4 |
| `todoAnalyticsRollupService.test.ts` | ✅ 1/1 |
| `policyEngine.test.ts` (analytics) | ✅ 5/5 |
| `analyticsCapabilityOwnership.test.ts` | ✅ 3/3 |
| `dashboardAnalyticsFacade.test.ts` | ✅ 3/3 |

**Fix during closeout:** Corrected `analyticsActivityService` import path to `../moduleActivityService`.

---

**Last updated:** 2026-06-22
