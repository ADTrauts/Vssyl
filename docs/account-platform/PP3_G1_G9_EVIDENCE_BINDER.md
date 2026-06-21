# PP-3 — G1–G9 Evidence Binder

**Program:** Account Platform — PP-3 Certification Preparation  
**Date:** 2026-06-20  
**Type:** Evaluation packet evidence — governance compiled  
**Score:** **24/27 (~89%)** · program rollup **~88%**

---

## Scorecard

| Gate | Score | Status | Evidence summary |
|------|------:|--------|------------------|
| **G1** Authorization | **3** | PASS | `entitlement:*`, `billing:*` PE; JWT on routes |
| **G2** Auditability | **3** | PASS | Entitlement + billing lifecycle activity/events |
| **G3** Service boundaries | **3** | PASS | `entitlementService`, `billingService` canonical |
| **G4** API coherence | **3** | PASS | `/api/billing` + `/api/account`; clients migrated |
| **G5** Ownership | **3** | PASS | `Subscription.tier` SoR; cache model enforced |
| **G6** Test evidence | **3** | PASS | See test inventory below |
| **G7** Documentation | **3** | PASS | P1/P2/P3 + re-audit + prep docs |
| **G8** Production safety | **2** | PARTIAL | F02 vocabulary drift; webhook hardened |
| **G9** UX consistency | **1** | FAIL | F08 modal-only; no dashboard |

---

## G1 — Authorization

| Evidence | Location |
|----------|----------|
| `billing:read` / `billing:write` actions | `server/src/auth/policyActions.ts` |
| `authorizeBillingPolicy` / `billingPolicyDual` | `server/src/auth/billingPolicyDual.ts` |
| Enforcement in `billingService` mutations | `server/src/services/account/billingService.ts` |
| `entitlement:read` / `entitlement:write` | `server/src/auth/entitlementPolicyDual.ts` |
| Admin authority ADMIN-only | `entitlementService.setBusinessTierAuthority` |

**Gap (WITH FINDINGS):** Module subscription routes — JWT only, no dedicated PE.

---

## G2 — Auditability

| Evidence | Location |
|----------|----------|
| Billing activity actions (5) | `billingActivityService.ts` |
| Billing domain events (5) | `billingDomainEventService.ts`, `domainEventRegistry.ts` |
| Entitlement activity/events | `entitlementActivityService.ts`, `entitlementDomainEventService.ts` |
| Emit on successful mutations only | `billingService.ts` post-commit |

**Emit sites:**

| Operation | Activity | Domain event |
|-----------|----------|--------------|
| `createSubscription` | ✅ | ✅ |
| `updateSubscription` | ✅ | ✅ |
| `cancelSubscription` | ✅ | ✅ |
| `resumeSubscription` | ✅ | ✅ |
| `syncSubscription` | ✅ | ✅ |
| `upsertSubscriptionFromCheckout` | ✅ | ✅ |

**Gap (WITH FINDINGS):** Invoice paid/failed webhook paths — no normalized activity (F05).

---

## G3 — Service boundaries

| Service | Role | Artifact |
|---------|------|----------|
| `entitlementService` | Tier SoR reads + admin writes | `server/src/services/account/entitlementService.ts` |
| `billingService` | Platform subscription lifecycle | `server/src/services/account/billingService.ts` |
| `subscriptionService` | Stripe/Prisma data layer | Delegated — not direct controller |
| `moduleSubscriptionService` | Module commerce | `billingController` module routes |

**Gap (PARTIAL):** Invoice list/get — inline Prisma in `billingController`; employee count update bypasses `billingService`.

---

## G4 — API coherence

| Evidence | Location |
|----------|----------|
| Canonical billing routes | `server/src/routes/billing.ts` |
| Canonical web client | `web/src/api/billing.ts` |
| Legacy JWT retirement | `server/src/routes/payment.ts` → 410 |
| Entitlement APIs | `server/src/routes/accountEntitlements.ts` |
| Client migration tests | `web/src/lib/__tests__/billingClient.test.ts` |

**Webhook exception:** `POST /api/payment/webhook` — documented in [PP3_WEBHOOK_EXCEPTION_REVIEW.md](./PP3_WEBHOOK_EXCEPTION_REVIEW.md).

---

## G5 — Ownership

| Rule | Enforcement |
|------|-------------|
| `Subscription.tier` authoritative writes | `billingService`, `setBusinessTierAuthority` |
| `Business.tier` cache | `syncBusinessTierCache` on tier mutations |
| Tier normalization | `entitlementTypes.normalizeTier` |
| Ownership docs | `PP3_ENTITLEMENT_OWNERSHIP_MODEL.md`, `PP3_BILLING_SERVICE_MODEL.md` |

**Gap (PARTIAL):** F02 — `standard` vs `pro` in validators and `subscriptionService` vocabulary.

---

## G6 — Test evidence

| Test file | Tests | Scope |
|-----------|-------|-------|
| `entitlementService.test.ts` | 11 | Resolver, admin authority, cache |
| `account-entitlements.integration.test.ts` | 3 | `/api/account/*` routes |
| `billingService.test.ts` | 4 | Lifecycle, PE errors |
| `payment-api-convergence.test.ts` | 1 | Deprecation headers |
| `paymentRouteRetired.test.ts` | 1 | 410 retirement |
| `billingClient.test.ts` (web) | 4 | No `/api/payment` client calls |
| `stripeWebhookBilling.test.ts` | — | Webhook module subscription path |

**Regression total (PP-3 slice):** **20+** automated tests across server + web.

---

## G7 — Documentation

| Document | Purpose |
|----------|---------|
| `PP3_ENTITLEMENT_ARCHITECTURE.md` | Package 1 |
| `PP3_PACKAGE2_ARCHITECTURE.md` | Package 2 |
| `PP3_BILLING_CLIENT_ARCHITECTURE.md` | Phase 3 client |
| `PP3_API_CONVERGENCE_PLAN.md` | API retirement |
| `PP3_OPERATION_MATRIX_REAUDIT.md` | This prep cycle |
| `PP3_ACTIVITY_AND_DOMAIN_EVENTS.md` | Event catalog |
| `POLICY_ENGINE.md` (billing actions) | PE alignment |

---

## G8 — Production safety

| Evidence | Status |
|----------|--------|
| Webhook raw body before `express.json()` | ✅ `index.ts` |
| No JWT on webhook | ✅ |
| Stripe signature verification | ✅ `paymentController.handleWebhook` |
| Tier bypass via `Business.tier` alone | ✅ Closed (F04) |
| Legacy client dual API drift | ✅ Closed (F03) |
| Tier vocabulary edge cases | ⚠️ F02 partial |

---

## G9 — UX consistency

| Evidence | Status |
|----------|--------|
| `BillingModal`, `UpgradeFlow`, checkout success/cancel | ✅ Functional |
| `PaymentMethodManager`, `CancelSubscriptionModal` | ✅ Canonical API |
| Dedicated billing dashboard / hub | ❌ F08 |
| Settings billing tab IA consolidation | ⚠️ PP-2 deferred |

**Eval disposition:** G9 FAIL acceptable for L3 WITH FINDINGS with F08 documented.

---

## Evidence packet checklist

| Item | Attached |
|------|----------|
| G1–G9 self-score | ✅ This binder |
| Operation matrix re-audit | ✅ |
| Findings reclassification | ✅ |
| Test inventory | ✅ |
| Webhook exception review | ✅ |
| Architecture docs index | ✅ PP-3 doc set |

---

**Last updated:** 2026-06-20 (Certification Preparation)
