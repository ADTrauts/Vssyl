# PP-3 — Client Migration Test Report

**Program:** Account Platform — PP-3 Phase 3  
**Date:** 2026-06-20  
**Status:** Tests executed

---

## Test suites

### Web — billing client migration

**File:** `web/src/lib/__tests__/billingClient.test.ts`

| Test | Result |
|------|--------|
| `billing.ts` uses only `/api/billing` API paths | ✅ Pass |
| `stripe.ts` does not call `/api/payment` directly | ✅ Pass |
| `payment.ts` re-exports billing client | ✅ Pass |
| Billing client exports canonical helpers | ✅ Pass |

**Command:** `pnpm test src/lib/__tests__/billingClient.test.ts` (web package)  
**Result:** **4/4 passed**

---

### Server — payment route retirement

**File:** `server/src/middleware/__tests__/paymentRouteRetired.test.ts`

| Test | Result |
|------|--------|
| `paymentRouteRetired` returns 410 with successor | ✅ Pass |

**File:** `server/src/routes/__tests__/payment-api-convergence.test.ts`

| Test | Result |
|------|--------|
| Deprecation middleware headers | ✅ Pass |

**Command:** `pnpm test` (server package, targeted files)  
**Result:** **2/2 files, 2/2 tests passed**

---

## Static verification

| Check | Result |
|-------|--------|
| `grep /api/payment` in `web/src` (live API calls) | **None** — comments/deprecation strings only |
| Module subscribe path | `POST /api/billing/modules/:moduleId/subscribe` |

---

## Not covered (deferred)

| Area | Reason |
|------|--------|
| E2E Stripe checkout | Out of scope — no certification execution |
| Authenticated 410 integration | Requires JWT test harness |
| Playwright billing flows | Future QA wave |

---

## Certification evidence

This report satisfies **client migration test evidence** for PP-3 evaluation planning. Operation matrix re-audit remains separate governance step.

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
