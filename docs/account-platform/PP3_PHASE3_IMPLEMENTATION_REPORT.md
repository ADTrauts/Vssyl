# PP-3 Phase 3 — Implementation Report

**Program:** Account Platform — PP-3 Phase 3 (Client Migration & Payment API Retirement)  
**Date:** 2026-06-20  
**Status:** **COMPLETE**

---

## Executive summary

PP-3 Phase 3 completes client-side migration from legacy `/api/payment` to canonical `/api/billing`. All active web consumers use the new **`billing.ts`** client or inline billing paths. JWT-gated `/api/payment` routes return **410 Gone**. Stripe webhook remains on `POST /api/payment/webhook`.

**Not started:** Billing UX redesign, certification execution, ledger, council.

---

## Required reporting

### 1. Files created

| File | Purpose |
|------|---------|
| `web/src/api/billing.ts` | Canonical billing client |
| `server/src/middleware/paymentRouteRetired.ts` | 410 handler for retired routes |
| `server/src/middleware/__tests__/paymentRouteRetired.test.ts` | Retirement middleware test |
| `web/src/lib/__tests__/billingClient.test.ts` | Client migration tests |
| `docs/account-platform/PP3_CLIENT_MIGRATION_INVENTORY.md` | Consumer inventory |
| `docs/account-platform/PP3_BILLING_CLIENT_ARCHITECTURE.md` | Client architecture |
| `docs/account-platform/PP3_API_RETIREMENT_PLAN.md` | Retirement roadmap |
| `docs/account-platform/PP3_CLIENT_MIGRATION_TEST_REPORT.md` | Test report |
| `docs/account-platform/PP3_PHASE3_IMPLEMENTATION_REPORT.md` | This report |

### 2. Files modified

| File | Change |
|------|--------|
| `web/src/lib/stripe.ts` | Delegate to `billing.ts`; remove direct `/api/payment` fetch |
| `web/src/api/payment.ts` | Deprecated re-exports → billing client |
| `web/src/api/modules.ts` | Correct subscribe path; billing delegation |
| `web/src/components/PaymentModal.tsx` | `subscribeModule` from billing |
| `web/src/app/modules/page.tsx` | `subscribeModule` from billing |
| `server/src/routes/payment.ts` | All JWT routes → 410 retirement |
| `server/src/routes/billing.ts` | Added `POST /api/billing/intent` |
| `docs/account-platform/PP3_API_CONVERGENCE_PLAN.md` | Phase 2–3 status |

### 3. Client inventory completed?

**Yes** — see [PP3_CLIENT_MIGRATION_INVENTORY.md](./PP3_CLIENT_MIGRATION_INVENTORY.md).

### 4. Active payment consumers migrated?

**Yes** — `PaymentModal`, `modules/page.tsx`, `lib/stripe.ts`, `api/payment.ts` (wrapper).

### 5. Canonical billing client implemented?

**Yes** — `web/src/api/billing.ts`.

### 6. Legacy API usage remaining?

| Surface | Status |
|---------|--------|
| Web clients calling `/api/payment` | **None** |
| `payment.ts` | Deprecated wrapper → billing |
| Server webhook | `POST /api/payment/webhook` — intentional |
| JWT payment router | **410 Gone** |

### 7. Tests?

| Suite | Result |
|-------|--------|
| `billingClient.test.ts` (web) | 4/4 ✅ |
| `paymentRouteRetired.test.ts` (server) | 1/1 ✅ |
| `payment-api-convergence.test.ts` (server) | 1/1 ✅ |

### 8. Findings closed?

| Finding | Status |
|---------|--------|
| **PP3-F03** — Dual API surface | **Closed** |
| **PP3-F05** — PE/activity on mutations | **Partial** — invoice webhooks deferred |
| **PP3-F07** — Gating fragmentation | **Partial** — HR matrix by design |
| **PP3-F08** — Modal billing UX | **Open** — UX redesign out of scope |
| **PP3-F12** — Legacy `payment.ts` | **Closed** — delegates to billing |

### 9. Updated readiness?

| Dimension | Pre Phase 3 | Post Phase 3 |
|-----------|-------------|--------------|
| PP-3 G4 API coherence | 2 | **3** |
| PP-3 overall estimate | ~85% | **~88%** |
| Client dual API drift | Active | **Eliminated** |

### 10. Evaluation readiness?

| Criterion | Status |
|-----------|--------|
| Client migration complete (cert planning gate) | ✅ |
| PP3-F03 closed | ✅ |
| Full PP-3 L3 evaluation | ⏳ F08 open; matrix re-audit; invoice events |
| Progress review (billing backend + client) | **Eligible** |

---

## Stop condition

PP-3 Client Migration **complete**. Not started: PP-3 evaluation execution, certification, ledger, council, billing UX redesign.

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
