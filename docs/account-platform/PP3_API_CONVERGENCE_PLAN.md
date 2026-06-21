# PP-3 — API Convergence Plan

**Program:** Account Platform — PP-3 Package 2  
**Date:** 2026-06-20  
**Status:** **Phase 2–3 complete** (PP-3 Phase 3 client migration + JWT route retirement)

---

## Problem (PP3-F03)

Dual APIs serve overlapping subscription operations:

- **Canonical:** `/api/billing/*` — used by `BillingModal`, `UpgradeFlow`, `PaymentMethodManager`
- **Legacy:** `/api/payment/*` — used by `web/src/api/payment.ts`, `web/src/lib/stripe.ts`

---

## Convergence strategy

### Phase 1 (Package 2 — complete)

| Action | Status |
|--------|--------|
| Mark `/api/payment` deprecated (`Deprecation`, `Sunset`, `Link` headers) | ✅ |
| Delegate payment cancel/resume to `billingService` | ✅ |
| Document canonical vs legacy paths | ✅ |
| Preserve response shapes for legacy clients | ✅ |

**Sunset header:** `2027-06-01` (illustrative; council may adjust)

### Phase 2 (PP-3 Phase 3 — complete)

| Action | Status |
|--------|--------|
| Migrate `web/src/api/payment.ts` to `/api/billing` | ✅ Deprecated wrapper → `billing.ts` |
| Migrate `web/src/lib/stripe.ts` to `/api/billing` | ✅ |
| `POST /api/billing/intent` canonical route | ✅ |
| Migrate `PaymentModal`, `modules/page.tsx` | ✅ |

### Phase 3 (PP-3 Phase 3 — complete)

| Action | Status |
|--------|--------|
| JWT `/api/payment/*` → 410 Gone | ✅ |
| `paymentController` handlers removed from router | ✅ |
| Unmount `/api/payment` router | ⏳ Phase 4 — webhook mount remains |

---

## Route mapping

| Operation | Canonical | Legacy | Migration |
|-----------|-----------|--------|-----------|
| Create subscription | `POST /api/billing/subscriptions` | `POST /api/payment/subscription` | Use checkout session for paid |
| Cancel | `DELETE /api/billing/subscriptions/:id` | `DELETE /api/payment/subscription/:id` | ✅ delegates |
| Reactivate | `POST /api/billing/subscriptions/:id/reactivate` | `POST /api/payment/subscription/:id/reactivate` | ✅ delegates |
| Payment intent | — | `POST /api/payment/intent` | Keep until AI billing slice migrates |
| Payment methods | `GET /api/billing/payment-methods` | `GET /api/payment/methods` | Migrate clients to billing |
| Webhook | `POST /api/payment/webhook` (index mount) | Same | Unchanged mount point |

---

## Client inventory

| Client | API used | Action |
|--------|----------|--------|
| `BillingModal.tsx` | `/api/billing/*` | No change |
| `UpgradeFlow.tsx` | `/api/billing/*` | No change |
| `web/src/api/payment.ts` | Deprecated wrapper → `billing.ts` | ✅ Migrated |
| `web/src/lib/stripe.ts` | Delegates to `billing.ts` | ✅ Migrated |
| `web/src/api/modules.ts` | `/api/billing/modules/*` | No change |

---

## Compatibility guarantees (Package 2)

- Legacy routes remain mounted at `/api/payment`
- Response bodies preserved; deprecation metadata added where applicable
- No breaking changes to `BillingModal` or checkout flows

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
