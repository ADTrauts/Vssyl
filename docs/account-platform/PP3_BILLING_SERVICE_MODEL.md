# PP-3 — Billing Service Model

**Program:** Account Platform — PP-3 Package 2  
**Date:** 2026-06-20  
**Status:** **Runtime-enforced** for platform subscription lifecycle

---

## Ownership

### billingService owns

| Concern | SoR | Write authority |
|---------|-----|-----------------|
| Platform subscription lifecycle mutations | `Subscription` | `billingService` |
| Checkout completion upsert | `Subscription` | `billingService.upsertSubscriptionFromCheckout` |
| Stripe sync → DB alignment | `Subscription` | `billingService.syncSubscription` |
| Billing activity events | `account` module activity | `billingActivityService` |
| Billing domain events | Domain event bus | `billingDomainEventService` |
| Business tier cache sync on billing writes | `Business.tier` (derived) | Via `entitlementService.syncBusinessTierCache` |

### billingService does NOT own

| Concern | Owner |
|---------|-------|
| Effective tier resolution reads | `entitlementService` |
| Module subscriptions | `ModuleSubscriptionService` |
| Invoices / refunds | Billing remainder (controllers today) |
| Payment method CRUD | `billingController` + Stripe Customer |
| AI query pack purchases | `aiQueryService` + Stripe intents |
| Admin tier override | `entitlementService.setBusinessTierAuthority` |

---

## Delegation model

`billingService` is a **facade** over existing Stripe/DB infrastructure:

- **Creates/updates/cancels** delegate to `SubscriptionService` for Stripe item management
- **Sync** delegates to `StripeSyncService`
- **Adds** PE, activity, domain events, and entitlement cache sync missing from legacy paths

This avoids duplicating Stripe logic while establishing a single **constitutional call site** for lifecycle mutations.

---

## Policy ownership

| Action | Authority |
|--------|-----------|
| `billing:read` | Subscription owner (`subscription.userId === actor`) |
| `billing:write` | Subscription owner |

Enforced in `billingService` via `billingPolicyDual.ts`.

---

## Relationship to entitlementService

| Operation | billingService | entitlementService |
|-----------|----------------|-------------------|
| User upgrades via checkout | Upserts `Subscription` | Syncs `Business.tier` cache |
| User cancels | Updates `Subscription.status` | No tier cache change until period end |
| Admin override | — | `setBusinessTierAuthority` (separate path) |
| Feature gating read | — | `resolveTier()` |

**Rule:** Billing writes `Subscription`; entitlements reads and derives cache. No parallel tier SoR.

---

**Last updated:** 2026-06-20 (PP-3 Package 2)
