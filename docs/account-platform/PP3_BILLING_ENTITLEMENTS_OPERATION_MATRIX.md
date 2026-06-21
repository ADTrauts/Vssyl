# PP-3 — Billing & Entitlements Operation Matrix

**Surface id:** `billing-entitlements` (Account Platform PP-3)  
**Program:** Account Platform Phase 0B-3 — Billing & Entitlements Platform Audit  
**Date:** 2026-06-19  
**Status:** Constitutional audit — discovery only

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant |
| **P** | Partial |
| **N** | Non-compliant / missing |
| **—** | Out of scope |

**Owner:** `BILL` = Billing · `ENT` = Entitlements · `STR` = Stripe · `MOD` = Module marketplace · `ADMIN` = Admin Portal

**PE** = Policy Engine · **Act** = normalized activity

---

## Core subscription operations

| Operation | Owner | Service / artifact | PE | Act | Notes | Status |
|-----------|-------|-------------------|-----|-----|-------|--------|
| Create subscription (API) | BILL | `subscriptionService` | N | N | POST validates `standard` tier | **P** |
| Get user subscription | BILL | `subscriptionService` | — | — | `/api/billing/subscriptions/user` | **C** |
| Update subscription tier | BILL | `subscriptionService` + Stripe | N | N | Multi-tier enum on PUT | **P** |
| Cancel subscription | BILL | `subscriptionService` | N | N | `cancelAtPeriodEnd` | **P** |
| Reactivate subscription | BILL | `subscriptionService` | N | N | Dual billing/payment paths | **P** |
| Update employee count | BILL | `subscriptionService` | N | N | Business plans | **P** |
| Checkout session | BILL/STR | `stripeService` + billingController | N | N | Upgrade/new paid tier | **P** |
| Customer portal session | BILL/STR | Stripe portal | — | — | | **C** |

## Legacy payment API (retire target)

| Operation | Owner | Service | Notes | Status |
|-----------|-------|---------|-------|--------|
| Create payment intent | BILL | `paymentController` | `/api/payment/intent` | **N** |
| Create subscription (legacy) | BILL | `paymentController` | `/api/payment/subscription` | **N** |
| Cancel/reactivate (legacy) | BILL | `paymentController` | Client `payment.ts` still uses | **N** |
| Get payment methods (legacy) | BILL | `paymentController` | `stripe.ts` helper | **N** |

## Module commerce

| Operation | Owner | Service | PE | Act | Notes | Status |
|-----------|-------|---------|-----|-----|-------|--------|
| Subscribe to module | BILL/MOD | `moduleSubscriptionService` | N | N | Billing + legacy paths | **P** |
| List module subscriptions | BILL | `moduleSubscriptionService` | — | — | | **C** |
| Update module subscription | BILL | `moduleSubscriptionService` | N | N | `premium`/`enterprise` tier | **P** |
| Cancel module subscription | BILL | `moduleSubscriptionService` | N | N | Revenue split | **P** |
| Module access check | ENT/MOD | `FeatureGatingService.checkModuleAccess` | — | — | Separate from install | **P** |
| Module install (free) | MOD | `ModuleInstallation` | P | P | Not billing | **—** |

## Payment methods & invoices

| Operation | Owner | Service | PE | Act | Status |
|-----------|-------|---------|-----|-----|--------|
| List payment methods | BILL/STR | `billingController` + Stripe | — | — | **C** |
| Setup intent | BILL/STR | Stripe | — | — | **C** |
| Set default PM | BILL | billingController inline prisma | N | N | **P** |
| Delete PM | BILL | billingController | N | N | **P** |
| List invoices | BILL | prisma invoice query in controller | — | — | **P** |
| Get invoice | BILL | prisma in controller | — | — | **P** |

## Usage & metering

| Operation | Owner | Service | Notes | Status |
|-----------|-------|---------|-------|--------|
| Record usage | BILL | `usageTrackingService` | Billing route | **P** |
| Get usage summary | BILL | `usageTrackingService` | | **P** |
| Overage billing (cron) | BILL | `overageBillingService` | platformCronJobs | **P** |
| AI query balance | BILL/AI | `aiQueryService` | Metering — AI consumes | **P** |
| AI query pack purchase | BILL/STR | `aiQueryService` + Stripe | | **P** |

## Stripe integration

| Operation | Owner | Artifact | Status |
|-----------|-------|----------|--------|
| Webhook ingest | STR | `POST /api/payment/webhook` raw body | **C** |
| Stripe ↔ DB sync | STR | `stripeSyncService` | **P** |
| Pricing config seed | BILL | `pricingService` + scripts | **P** |
| Developer revenue split | BILL/MOD | `revenueSplitService` | **P** |

## Entitlement operations

| Operation | Owner | Resolver | Notes | Status |
|-----------|-------|----------|-------|--------|
| Check feature access | ENT | `FeatureGatingService` | Reads `Subscription.tier` | **P** |
| Feature catalog API | ENT | Static `FEATURES` map | `/api/features` | **P** |
| Subscription middleware gate | ENT | `subscriptionMiddleware` | `standard` hierarchy | **P** |
| HR feature gate | ENT/HR | `hrFeatureGating` | `activeSub \|\| business.tier` | **P** |
| Admin tier override | ADMIN | `Business.tier` only | No Subscription sync | **N** |
| Effective tier debug | ENT | `debug-business-tier` | Exposes drift | **P** |
| Module pricing tier check | ENT/MOD | `Module.pricingTier` | Enum: premium/enterprise | **P** |

## Commerce UX flows

| Operation | Owner | Surface | API | Status |
|-----------|-------|---------|-----|--------|
| View subscription (modal) | BILL | `BillingModal` | `/api/billing/*` | **P** |
| Upgrade flow | BILL | `UpgradeFlow` | billing checkout/update | **P** |
| Cancel modal | BILL | `CancelSubscriptionModal` | billing | **P** |
| Business settings billing tab | SET/BILL | workspace settings | BillingModal embed | **P** |
| Checkout success/cancel pages | BILL | `/billing/success` | Return URLs | **C** |
| User billing dashboard | BILL | **Missing** | — | **N** |
| Product trial start | BILL | **Missing** | Stripe trialing only | **N** |

---

## Summary counts

| Domain | C | P | N |
|--------|---|---|---|
| Core subscription | 2 | 6 | 0 |
| Legacy payment API | 0 | 0 | 4 |
| Module commerce | 1 | 5 | 0 |
| Payment/invoice | 2 | 4 | 0 |
| Usage/metering | 0 | 5 | 0 |
| Stripe | 1 | 3 | 0 |
| Entitlements | 0 | 6 | 1 |
| Commerce UX | 1 | 4 | 2 |
| **Total** | **7** | **33** | **7** |

**Compliance rate:** ~15% C · ~70% P · ~15% N

---

## Finding disposition (PP-3 audit)

| ID | Severity | Finding |
|----|----------|---------|
| PP3-F01 | **Blocking** | No canonical entitlement SoR / resolver service |
| PP3-F02 | **Blocking** | Tier enum drift across Subscription/Business/services |
| PP3-F03 | **Blocking** | Dual `/api/billing` + `/api/payment` APIs |
| PP3-F04 | **Major** | `admin-override` sets `Business.tier` without Subscription sync |
| PP3-F05 | **Major** | No PE/activity on subscription mutations |
| PP3-F06 | **Major** | Fat billingController + inline Prisma |
| PP3-F07 | **Major** | Multiple gating implementations (HR separate matrix) |
| PP3-F08 | **Major** | Modal-only billing UX — no dashboard |
| PP3-F09 | Advisory | Orphan `featureGatingService.simplified.ts` |
| PP3-F10 | Advisory | No product trial flow |
| PP3-F11 | Advisory | `subscriptionService` uses `standard` vs checkout uses `pro` |
| PP3-F12 | Advisory | Legacy `web/src/api/payment.ts` still active |

---

**Last updated:** 2026-06-19 (Phase 0B-3)
