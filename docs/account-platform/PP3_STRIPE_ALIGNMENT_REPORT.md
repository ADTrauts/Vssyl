# PP-3 — Stripe Alignment Report (Package 2)

**Program:** Account Platform — PP-3 Package 2  
**Date:** 2026-06-20  
**Status:** **Aligned for platform subscription path** — module/AI paths unchanged

---

## Stripe write path inventory

| Path | Pre Package 2 | Post Package 2 |
|------|---------------|----------------|
| Checkout session create | `billingController` → `StripeService.createCheckoutSession` | Unchanged (canonical) |
| Checkout session completed webhook | `StripeService.handleCheckoutSessionCompleted` → inline Prisma | **`billingService.upsertSubscriptionFromCheckout`** + entitlement sync + events |
| Subscription create (billing API) | `billingController` → `SubscriptionService` | **`billingService.createSubscription`** |
| Subscription update/cancel/resume (billing) | `SubscriptionService` direct | **`billingService`** |
| Subscription cancel/resume (payment API) | Inline Prisma + `StripeService` | **`billingService`** + deprecation headers |
| Subscription create (payment API) | Inline Stripe + Prisma | **Legacy retained** — deprecation headers; migrate clients to billing/checkout |
| Payment intent (AI packs / modules) | `StripeService` / `paymentController` | Unchanged — not platform subscription SoR |
| Module subscription | `ModuleSubscriptionService` | Unchanged |
| Stripe sync cron/admin | `StripeSyncService` | Callable via **`billingService.syncSubscription`** |
| Employee count update | `SubscriptionService.updateEmployeeCount` | Unchanged (billingController); future: billingService wrapper |

---

## Tier authority alignment

| Stripe event | Tier write | Entitlement sync |
|--------------|------------|------------------|
| `checkout.session.completed` | `Subscription.tier` from metadata | `syncBusinessTierCache` when `businessId` |
| Billing API tier update | `Subscription.tier` | Cache sync on business subs |
| Payment API legacy create | `Subscription.tier` (legacy path) | Not yet — client migration target |

---

## Gaps remaining (billing remainder)

| Item | Package |
|------|---------|
| Invoice webhook → billingService events | Remainder |
| `subscriptionService` tier enum `standard` vs `pro` | Data migration |
| Payment intent subscription create → billing checkout | Client migration |
| Full Stripe webhook PE coverage | Remainder |

---

## Recommendation

All **new** platform subscription integrations must use:

1. `POST /api/billing/checkout/session` for paid upgrades
2. `billingService` for lifecycle mutations
3. `entitlementService.resolveTier()` for reads

---

**Last updated:** 2026-06-20 (PP-3 Package 2)
