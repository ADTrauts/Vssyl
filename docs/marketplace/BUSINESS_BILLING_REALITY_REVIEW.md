# Business Billing — Reality Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-D  
**Date:** 2026-06-24  
**Status:** Discovery + remediation baseline

---

## 1. Executive summary

Phase 0A identified a critical gap: **`BusinessModuleSubscription` rows were never written**, while install and runtime gates queried that table for business-scoped paid modules. Personal subscriptions used `ModuleSubscription` correctly; business billing was split across two tables with only one write path.

Phase 1B-D closes the write path and aligns entitlement checks.

---

## 2. Billing path inventory

| Path | Table | Write? (pre-1B-D) | Write? (post-1B-D) |
|------|-------|-------------------|---------------------|
| Personal subscribe (`POST /api/billing/modules/:id/subscribe`) | `ModuleSubscription` | ✅ | ✅ |
| Business subscribe (same endpoint + `businessId`) | `ModuleSubscription` + **`BusinessModuleSubscription`** | ❌ / partial | ✅ |
| Business install (free module) | `BusinessModuleInstallation` + **`BusinessModuleSubscription` (free)** | ❌ | ✅ |
| Business install (paid module) | Requires pre-existing `BusinessModuleSubscription` | Read only | ✅ |
| Runtime (`GET /api/modules/:id/runtime`) | Entitlement check | Read only | ✅ + heal free |
| Stripe webhooks | `ModuleSubscription` status | ✅ | ✅ + `BusinessModuleSubscription` |
| Developer revenue | `DeveloperRevenue` from `ModuleSubscription` | ✅ | ✅ (business subs still via `ModuleSubscription` row) |

---

## 3. Stripe integration

| Capability | Status |
|------------|--------|
| Personal paid module Stripe subscription | ✅ `ModuleSubscriptionService` |
| Business paid module Stripe subscription | ✅ When `businessId` + Stripe customer + price id configured |
| Free business modules | ✅ No Stripe; `tier: free`, `amount: 0` |
| Webhook sync to business table | ✅ Phase 1B-D |

**Paid flow blocker (if Stripe not configured):** `createModuleSubscription` throws when paid business module lacks Stripe customer/price. Documented — not a schema gap.

---

## 4. Install flow

| Gate | Location |
|------|----------|
| Module APPROVED | `installModule` |
| Business membership + manage permission | `installModule` |
| Policy Engine dual | `evaluateModuleInstallPolicyDual` |
| Paid subscription | `hasActiveBusinessModuleSubscription` |
| Proprietary tier (HR, etc.) | Platform `BusinessSubscription` tier check |
| Post-install free sub | `ensureFreeBusinessModuleSubscription` |

---

## 5. Runtime entitlement

`evaluateBusinessModuleEntitlement` checks:

1. Module approved  
2. Installation exists and enabled  
3. Active business membership (when userId provided)  
4. Active `BusinessModuleSubscription` for paid partner modules  

Proprietary modules skip business module subscription (platform tier gate at install only).

---

## 6. Developer revenue

| Item | Status |
|------|--------|
| `DeveloperRevenue` aggregation | ✅ From `ModuleSubscription` |
| Business-scoped revenue attribution | 🟡 `ModuleSubscription.businessId` set; `DeveloperRevenue` not split by business table |
| Payout automation | ❌ Out of scope — `payoutStatus: pending` records only |

**Gap:** `BusinessModuleSubscription` does not feed `calculateDeveloperRevenue` directly. Revenue still flows through paired `ModuleSubscription` row created on business subscribe. Documented; no payout redesign in this phase.

---

## 7. Admin visibility

`GET /api/admin-portal/modules/:moduleId/business-billing-probe?businessId=...`

Returns install/runtime readiness, subscription status, and blockers.

---

**Last updated:** 2026-06-24
