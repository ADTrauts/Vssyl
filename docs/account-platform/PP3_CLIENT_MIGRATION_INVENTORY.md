# PP-3 — Client Migration Inventory

**Program:** Account Platform — PP-3 Phase 3 (Client Migration)  
**Date:** 2026-06-20  
**Status:** **Complete**

---

## Legacy client files

| File | Role | Pre-migration | Post-migration |
|------|------|---------------|----------------|
| `web/src/api/payment.ts` | Module subscription helpers | Called `/api/payment/*` | Deprecated re-exports → `billing.ts` |
| `web/src/lib/stripe.ts` | Stripe.js + API fetch | Direct fetch to `/api/payment/*` | Delegates to `billing.ts`; Stripe.js utilities only |

## Canonical client

| File | Role |
|------|------|
| `web/src/api/billing.ts` | **Authoritative** billing client — all `/api/billing` operations |

---

## Consumer inventory

| Consumer | Pre-migration API | Post-migration | Status |
|----------|-------------------|----------------|--------|
| `BillingModal.tsx` | `/api/billing/*` (inline) | No change — already canonical | ✅ Canonical |
| `UpgradeFlow.tsx` | `/api/billing/*` (inline) | No change | ✅ Canonical |
| `PaymentMethodManager.tsx` | `/api/billing/*` (inline) | No change | ✅ Canonical |
| `CancelSubscriptionModal.tsx` | `/api/billing/*` (inline) | No change | ✅ Canonical |
| `AddPaymentMethodModal.tsx` | `/api/billing/*` (inline) | No change | ✅ Canonical |
| `web/src/api/modules.ts` | Wrong path `/api/billing/modules/subscribe` | `billing.subscribeModule` + correct path | ✅ Migrated |
| `web/src/app/modules/page.tsx` | Direct fetch `/api/billing/modules/subscribe` | `subscribeModule()` | ✅ Migrated |
| `web/src/app/modules/[id]/page.tsx` | `PaymentModal` → `lib/stripe` | `PaymentModal` → `billing.subscribeModule` | ✅ Migrated |
| `PaymentModal.tsx` | `lib/stripe` → `/api/payment/subscription` | `billing.subscribeModule` | ✅ Migrated |
| `web/src/lib/stripe.ts` | `/api/payment/*` | `billing.ts` | ✅ Migrated |
| `web/src/api/payment.ts` | `/api/payment/*` | `billing.ts` re-exports | ✅ Deprecated wrapper |

---

## Classification

| Category | Items |
|----------|-------|
| **Canonical** | `billing.ts`; components already on `/api/billing` |
| **Legacy (retired server)** | JWT `/api/payment/*` routes → 410 Gone |
| **Legacy (compat)** | `payment.ts` deprecated re-exports for external callers |
| **Orphaned** | None — all known consumers migrated or wrapped |
| **Server-only legacy** | `POST /api/payment/webhook` (index.ts mount — unchanged) |

---

## Remaining `/api/payment` usage (production)

| Surface | Path | Notes |
|---------|------|-------|
| Stripe webhook | `POST /api/payment/webhook` | Intentional — raw body mount in `index.ts` |
| JWT router | All other `/api/payment/*` | **410 Gone** after Phase 3 |

**No web client** makes live calls to `/api/payment` for subscription lifecycle.

---

**Last updated:** 2026-06-20 (PP-3 Phase 3)
