# PP-3 — Activity and Domain Events

**Program:** Account Platform — PP-3 Packages 1–2  
**Date:** 2026-06-20  
**Status:** **Entitlement + billing foundation implemented**

---

## Package 1 — Entitlement events

**Service:** `server/src/services/account/entitlementActivityService.ts`  
**Domain events:** `entitlementDomainEventService.ts`

| Activity action | Domain event | Trigger |
|-----------------|--------------|---------|
| `entitlement.subscription_tier_changed` | `entitlement.subscription_tier_changed` | `setBusinessTierAuthority()` |
| `entitlement.granted` | `entitlement.granted` | Admin authority grant |
| `entitlement.business_updated` | `entitlement.business_updated` | Business cache sync |

---

## Package 2 — Billing events

**Service:** `server/src/services/account/billingActivityService.ts`  
**Domain events:** `billingDomainEventService.ts`  
**Module ID:** `account`

### Module activity

| Action | Trigger |
|--------|---------|
| `billing.subscription_created` | `createSubscription`, `upsertSubscriptionFromCheckout` (create) |
| `billing.subscription_updated` | `updateSubscription`, checkout upsert (update) |
| `billing.subscription_cancelled` | `cancelSubscription` |
| `billing.subscription_resumed` | `resumeSubscription` |
| `billing.sync_completed` | `syncSubscription`, checkout upsert |

### Domain events (registry)

| Type constant | Event string |
|---------------|--------------|
| `BILLING_SUBSCRIPTION_CREATED` | `billing.subscription_created` |
| `BILLING_SUBSCRIPTION_UPDATED` | `billing.subscription_updated` |
| `BILLING_SUBSCRIPTION_CANCELLED` | `billing.subscription_cancelled` |
| `BILLING_SUBSCRIPTION_RESUMED` | `billing.subscription_resumed` |
| `BILLING_SYNC_COMPLETED` | `billing.sync_completed` |

### Recommended metadata

| Event | Fields |
|-------|--------|
| `subscription_created` | `tier` |
| `subscription_updated` | `previousTier`, `newTier`, `changedFields` |
| `subscription_cancelled` | — |
| `subscription_resumed` | — |
| `sync_completed` | `source` (`stripe_sync`, `checkout`) |

### Emit sites (Package 2)

| Operation | Activity | Domain events |
|-----------|----------|---------------|
| `billingService.createSubscription` | ✅ created | ✅ created |
| `billingService.updateSubscription` | ✅ updated | ✅ updated |
| `billingService.cancelSubscription` | ✅ cancelled | ✅ cancelled |
| `billingService.resumeSubscription` | ✅ resumed | ✅ resumed |
| `billingService.syncSubscription` | ✅ sync_completed | ✅ sync_completed |
| `billingService.upsertSubscriptionFromCheckout` | ✅ create/update + sync | ✅ create/update + sync |

**Not implemented (billing remainder):** Invoice paid/failed, payment intent, module subscription commerce events.

---

## Policy alignment

Billing mutations enforce `billing:write` before emit. Entitlement admin path uses `entitlement:write`. Failed/unauthorized mutations emit **nothing**.

---

## Subscriber posture

Existing domain event subscribers receive billing event types via the in-process bus. No new subscribers in Package 2.

---

**Last updated:** 2026-06-20 (PP-3 Package 2)
