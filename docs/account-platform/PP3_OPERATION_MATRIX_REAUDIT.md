# PP-3 — Operation Matrix Re-Audit

**Program:** Account Platform — PP-3 Certification Preparation  
**Date:** 2026-06-20  
**Type:** Governance re-audit — runtime validated, **no code changes**  
**Baseline:** [PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md](./PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md) (Phase 0B-3, 2026-06-19)

---

## Re-audit verdict

| Field | Value |
|-------|-------|
| **Matrix validated against runtime?** | **Yes** — PP-3 Packages 1–2 + Phase 3 |
| **Phase 0B matrix status** | **Superseded** for PP-3 eval — use this re-audit |
| **Compliance shift** | ~15% C → **~38% C** · ~70% P → **~55% P** · ~15% N → **~7% N** |

---

## Summary counts (re-audit)

| Domain | Phase 0B C | Phase 0B P | Phase 0B N | Re-audit C | Re-audit P | Re-audit N | Δ notes |
|--------|------------|------------|------------|------------|------------|------------|---------|
| Core subscription | 2 | 6 | 0 | **5** | **2** | 0 | `billingService` + PE + activity |
| Legacy payment API | 0 | 0 | **4** | **4** | 0 | 0 | JWT routes **410** — not dual API |
| Module commerce | 1 | 5 | 0 | 1 | **4** | 0 | No module-sub PE/activity |
| Payment / invoice | 2 | 4 | 0 | 2 | **4** | 0 | Inline Prisma in controller |
| Usage / metering | 0 | 5 | 0 | 0 | **5** | 0 | `resolveTier` aligned |
| Stripe integration | 1 | 3 | 0 | **2** | **2** | 0 | Checkout → `billingService` |
| Entitlements | 0 | 6 | **1** | **4** | **2** | 0 | SoR + admin path fixed |
| Commerce UX | 1 | 4 | **2** | 1 | **4** | **2** | Dashboard + trial still N |
| **Total** | **7** | **33** | **7** | **19** | **23** | **2** | **47 rows** |

**Re-audit compliance rate:** ~**38% C** · ~**55% P** · ~**7% N**

---

## Core subscription operations

| Operation | Owner | Runtime path | PE | Act | Events | Status | Phase 0B |
|-----------|-------|--------------|-----|-----|--------|--------|----------|
| Create subscription | BILL | `billingController` → `billingService.createSubscription` | ✅ | ✅ | ✅ | **C** | P |
| Get user subscription | BILL | `billingController` → `subscriptionService` | — | — | — | **C** | C |
| Update subscription tier | BILL | `billingController` → `billingService.updateSubscription` | ✅ | ✅ | ✅ | **C** | P |
| Cancel subscription | BILL | `billingService.cancelSubscription` | ✅ | ✅ | ✅ | **C** | P |
| Reactivate subscription | BILL | `billingService.resumeSubscription` | ✅ | ✅ | ✅ | **C** | P |
| Update employee count | BILL | `subscriptionService` (not billingService) | ❌ | ❌ | — | **P** | P |
| Checkout session | BILL/STR | `stripeService` → `upsertSubscriptionFromCheckout` | ✅* | ✅ | ✅ | **P** | P |
| Customer portal | BILL/STR | `billingController` Stripe portal | — | — | — | **C** | C |

*Checkout PE enforced on post-webhook billing path via `billingService` owner policy.

---

## Legacy payment API (retirement — not dual CRUD)

| Operation | Runtime | Status | Phase 0B |
|-----------|---------|--------|----------|
| `POST /api/payment/intent` | **410 Gone** (`paymentRouteRetired`) | **C** (retired) | N |
| `POST /api/payment/subscription` | **410 Gone** | **C** (retired) | N |
| Cancel/reactivate legacy | **410 Gone** | **C** (retired) | N |
| `GET /api/payment/methods` | **410 Gone** | **C** (retired) | N |
| Canonical successor | `POST /api/billing/intent`, `/api/billing/*` | **C** | — |

**Interpretation:** Four Phase 0B **N** rows are **closed** — legacy JWT surface retired; not counted as active non-compliance.

---

## Stripe integration

| Operation | Runtime | Status | Phase 0B |
|-----------|---------|--------|----------|
| Webhook ingest | `POST /api/payment/webhook` — `index.ts` raw body, no JWT | **C** | C |
| Checkout completed | `StripeService` → `billingService.upsertSubscriptionFromCheckout` | **C** | P |
| Stripe ↔ DB sync | `StripeSyncService` + `billingService.syncSubscription` | **P** | P |
| Pricing config | `pricingService` + scripts | **P** | P |
| Developer revenue split | `revenueSplitService` | **P** | P |

---

## Entitlement operations

| Operation | Runtime | Status | Phase 0B |
|-----------|---------|--------|----------|
| Effective tier resolution | `entitlementService.resolveTier` | **C** | P |
| Feature catalog API | `FeatureGatingService` + `resolveTier` | **C** | P |
| Subscription middleware | `subscriptionMiddleware` → `resolveTier` | **C** | P |
| HR feature gate | `hrFeatureGating` → `resolveBusinessTier` + HR matrix | **P** | P |
| Admin tier override | `setBusinessTierAuthority` → Subscription + cache | **C** | **N** |
| Effective tier debug | `debug-business-tier` → entitlement APIs | **P** | P |
| Module pricing tier | `Module.pricingTier` enum | **P** | P |

---

## Module commerce

| Operation | Runtime | PE | Act | Status | Phase 0B |
|-----------|---------|-----|-----|--------|----------|
| Subscribe to module | `moduleSubscriptionService` via `billingController` | ❌ | ❌ | **P** | P |
| List module subscriptions | `moduleSubscriptionService` | — | — | **C** | C |
| Update / cancel module sub | `moduleSubscriptionService` | ❌ | ❌ | **P** | P |
| Module access check | `FeatureGatingService.checkModuleAccess` | — | — | **P** | P |

**Client path:** `web/src/api/billing.ts` → `POST /api/billing/modules/:moduleId/subscribe` ✅

---

## Tier resolution consumers (validated)

| Consumer | Uses `entitlementService` | Status |
|----------|---------------------------|--------|
| `featureGatingService.ts` | `resolveTier` | ✅ C |
| `subscriptionMiddleware.ts` | `resolveTier` | ✅ C |
| `hrFeatureGating.ts` | `resolveBusinessTier` | ✅ P (HR matrix) |
| `usageTrackingService.ts` | `resolveTier` | ✅ C |
| `aiQueryService.ts` | `resolveTier` | ✅ C |
| `billingService.ts` | `syncBusinessTierCache` | ✅ C |
| `admin-override.ts` | `setBusinessTierAuthority` | ✅ C |

---

## Commerce UX (unchanged — F08)

| Operation | Status | Phase 0B |
|-----------|--------|----------|
| BillingModal / UpgradeFlow / checkout pages | **P** | P |
| Business settings billing embed | **P** | P |
| User billing dashboard | **N** | N |
| Product trial start UX | **N** | N |

---

## Service boundary validation

| Service | Ownership | Entry point | Status |
|---------|-----------|-------------|--------|
| `entitlementService` | Tier SoR reads + admin authority writes | `/api/account/*` | **C** |
| `billingService` | Platform subscription lifecycle | `billingController` mutations | **C** |
| `subscriptionService` | Stripe/Prisma subscription data | Delegated from billingService | **P** |
| `moduleSubscriptionService` | Module commerce rows | `billingController` module routes | **P** |
| `paymentController` | Webhook handler only (JWT routes retired) | `index.ts` webhook | **C** |

---

## API coherence validation

| Surface | Status |
|---------|--------|
| Web clients → `/api/billing` only | **C** — `web/src/api/billing.ts` |
| JWT `/api/payment/*` | **C** — 410 retirement |
| `POST /api/payment/webhook` | **C** — intentional ops exception (see webhook review) |
| Entitlement reads `/api/account/*` | **C** |

---

## Remaining N rows (evaluation context)

| Row | Finding | Eval disposition |
|-----|---------|------------------|
| User billing dashboard | PP3-F08 | **Accepted WITH FINDINGS** |
| Product trial start UX | PP3-F10 | **Advisory / WITH FINDINGS** |

---

## Matrix change log (Phase 0B → re-audit)

| Change type | Count | Examples |
|-------------|-------|----------|
| N → C | **5** | Legacy payment API (4), admin tier override (1) |
| P → C | **~12** | Lifecycle PE/activity, entitlement SoR, tier consumers, checkout sync |
| N → P | 0 | — |
| Unchanged N | **2** | Billing dashboard, product trial UX |
| New rows | 0 | — |

---

**Last updated:** 2026-06-20 (Certification Preparation)
