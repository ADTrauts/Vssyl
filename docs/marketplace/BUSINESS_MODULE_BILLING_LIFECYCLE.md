# Business Module Billing Lifecycle

**Program:** Marketplace & Module Ecosystem — Phase 1B-D  
**Date:** 2026-06-24  
**Status:** **Implemented**

---

## 1. Purpose

Complete the **business-scoped** commercial lifecycle for marketplace modules: subscription records, install alignment, runtime entitlement, and Stripe sync — without redesigning Stripe or marketplace UI.

---

## 2. Data model

**`BusinessModuleSubscription`** (`business_module_subscriptions`)

| Field | Purpose |
|-------|---------|
| `moduleId` + `businessId` | Unique business entitlement |
| `tier` | `free`, `premium`, `enterprise` |
| `amount` | Charged amount (0 for free) |
| `status` | `active`, `cancelled`, `past_due`, `unpaid` |
| `stripeSubscriptionId` | Links to Stripe for paid modules |

Paired with **`BusinessModuleInstallation`** for runtime access.

---

## 3. Write paths

### Free partner module (business install)

```
installModule (scope=business)
  → businessModuleInstallation.create
  → ensureFreeBusinessModuleSubscription (idempotent upsert, tier=free, status=active)
```

### Paid partner module

```
POST /api/billing/modules/:moduleId/subscribe { tier, businessId }
  → ModuleSubscriptionService.createModuleSubscription
  → ModuleSubscription row + Stripe (when configured)
  → upsertPaidBusinessModuleSubscription

installModule (scope=business)
  → requires hasActiveBusinessModuleSubscription
  → businessModuleInstallation.create
```

---

## 4. Entitlement service

**`server/src/services/businessModuleSubscriptionService.ts`**

| Function | Role |
|----------|------|
| `moduleRequiresBusinessSubscription` | Paid non-proprietary modules |
| `ensureFreeBusinessModuleSubscription` | Idempotent free tier write |
| `upsertPaidBusinessModuleSubscription` | Paid tier write |
| `evaluateBusinessModuleEntitlement` | Runtime/install alignment |
| `updateBusinessModuleSubscriptionStatusByStripeId` | Webhook sync |

---

## 5. Runtime

`getModuleRuntimeConfig` uses `evaluateBusinessModuleEntitlement` for business scope:

- Denies unapproved, not installed, disabled, non-member  
- Returns 402 when paid subscription missing or inactive  
- Heals missing free subscription row on runtime access (idempotent)

---

## 6. Paid module blockers

Paid business subscribe requires:

- Stripe configured (`STRIPE_SECRET_KEY`)  
- Stripe customer on user  
- Module `stripePriceId` or env `STRIPE_MODULE_PRICE_{MODULE_ID}_{TIER}`  

If incomplete, API returns error — **documented blocker**, not silent bypass.

---

## 7. Tests

`server/src/services/__tests__/businessModuleSubscriptionService.test.ts`

---

**Last updated:** 2026-06-24
