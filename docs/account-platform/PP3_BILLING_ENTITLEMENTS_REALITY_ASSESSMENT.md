# PP-3 — Billing & Entitlements Reality Assessment

**Program:** Account Platform Phase 0B-3 — Billing & Entitlements Platform Audit  
**Assessment date:** 2026-06-19  
**Authority:** Phase 0A · PP-1 · PP-2 audits  
**Status:** Constitutional audit — discovery only

**Excluded:** BA business profile ownership · Identity/profile SoR · Settings platform SoR · AI monetization product concepts · Dashboard module

---

## Executive finding

**Billing** exists as a **strong L2 backend subsystem** (Stripe, subscription services, webhooks, partial tests) but **not** as a certified **Billing Platform** capability. **Entitlements** are **not a platform** — they are **fragmented reads** across `Subscription.tier`, `Business.tier`, static feature catalogs, HR tier matrices, and module pricing enums with **no canonical resolver**.

**Critical debt:** Tier vocabulary drift across four+ enum systems creates **entitlement correctness risk** (revenue leakage, wrong feature access).

**PP-3 modernization** can proceed **in parallel with PP-1/PP-2 discovery** but **implementation** should follow PP-1 foundation (user/customer linkage) and coordinate with PP-2 (billing settings IA). **Tier SoR canonicalization is PP-3 P0** before certification.

---

## A. Billing Architecture

### Models (`prisma/modules/billing/`)

| Model | Role |
|-------|------|
| `Subscription` | Core platform tier per user/business |
| `ModuleSubscription` | Per-module App Store subscriptions |
| `Invoice`, `Refund` | Billing history |
| `UsageRecord` | Metering |
| `PricingConfig`, `PriceChange` | DB-driven tier pricing + Stripe price IDs |
| `DeveloperRevenue` | Marketplace revenue split |
| `AIQueryBalance`, `AIQueryPurchase` | AI query packs (metering — adjacent to AI consumption) |

**Related:** `User.stripeCustomerId` (auth/user) · `Business.tier` (business entity) · `Module.pricingTier`

### Services

| Service | Path | Maturity |
|---------|------|----------|
| `subscriptionService` | `server/src/services/subscriptionService.ts` | L2 |
| `moduleSubscriptionService` | `server/src/services/moduleSubscriptionService.ts` | L2 |
| `stripeService` | `server/src/services/stripeService.ts` | L2 |
| `stripeSyncService` | Stripe ↔ DB sync | L2 |
| `paymentService` | Legacy layer | L1 |
| `pricingService` | Admin/public pricing | L2 |
| `usageTrackingService` | Usage aggregation | L2 |
| `overageBillingService` | Cron overage | L2 |
| `revenueSplitService` | Developer split | L2 |
| `aiQueryService` | Query pack purchase | L2 |
| `adminBillingService` | Admin Portal ops | L2–L3 adjacency |
| **`billingService`** (unified) | **Missing** | L0 |
| **`entitlementService`** (resolver) | **Missing** | L0 |

### Routes

| Mount | Role | Status |
|-------|------|--------|
| `/api/billing` | **Canonical** — subscriptions, checkout, modules, usage, invoices, payment methods, portal | Primary |
| `/api/payment` | **Legacy** — intent, subscription CRUD, methods | **Retire target** |
| `POST /api/payment/webhook` | Stripe webhook (raw body, `index.ts`) | Active |
| `/api/feature-gating` | Entitlement checks | Active |
| `/api/features` | Feature catalog + check API | Active |
| `/api/pricing` | Public/admin pricing | Active |
| `/api/usage` | Usage dashboards | Active |
| `/api/ai/queries` | Query balance/purchase | Metering |
| `/api/developer` | Developer revenue | Marketplace |
| `/api/admin-portal/billing/*` | Operator billing | Admin L3 |
| `/api/admin-override` | Tier bypass without payment | **Drift risk** |

### Controllers

| Controller | Pattern | LOC est. |
|------------|---------|----------|
| `billingController` | Uses services + **some inline Prisma** | ~900 |
| `paymentController` | Legacy Stripe paths | ~350 |
| `featureGatingController` | Uses `SubscriptionMiddleware` + `FeatureGatingService` | Medium |

### Frontend commerce surfaces

| Surface | API used |
|---------|----------|
| `BillingModal` | `/api/billing/*` |
| `UpgradeFlow` | `/api/billing/checkout/session` + subscription update |
| `PaymentMethodManager` | `/api/billing/payment-methods` |
| `web/src/api/payment.ts` | **Legacy `/api/payment/*`** |
| `web/src/lib/stripe.ts` | **Legacy `/api/payment/*`** |
| Business workspace billing tab | `BillingModal` embed |
| Avatar menu billing | `BillingModal` |
| `/billing/success`, `/billing/cancel` | Checkout return URLs |

### Ownership & SoR (billing mutations)

| Concern | SoR | Write owner (target) |
|---------|-----|----------------------|
| Core subscription rows | `Subscription` | PP-3 Billing slice |
| Module subscription rows | `ModuleSubscription` | PP-3 Billing slice |
| Stripe customer ID | `User.stripeCustomerId` | PP-3 + PP-1 linkage |
| Invoices | `Invoice` | PP-3 Billing |
| Pricing config | `PricingConfig` | PP-3 + Admin Portal |

### Maturity: **L2 backend / L1 UX**

---

## B. Entitlement Architecture

### Tier enum inventory (drift)

| Source | Enum values |
|--------|-------------|
| `Subscription.tier` (Prisma) | `free`, `pro`, `business_basic`, `business_advanced`, `enterprise` (+ legacy `standard` in services) |
| `subscriptionService` create params | `free`, `standard`, `enterprise` |
| `billing.ts` POST create validation | `free`, `standard`, `enterprise` |
| `billing.ts` checkout validation | `pro`, `business_basic`, `business_advanced`, `enterprise` |
| `billing.ts` PUT update | All six + `standard` |
| `Business.tier` (Prisma) | `free`, `standard`, `enterprise` |
| `admin-override` set-tier | `free`, `business_basic`, `business_advanced`, `enterprise` |
| `FeatureGatingService` | `free`, `pro`, `business_basic`, `business_advanced`, `enterprise` |
| `subscriptionMiddleware` | `free`, `standard`, `enterprise` |
| `Module.pricingTier` | `free`, `premium`, `enterprise` |
| `ModuleSubscription.tier` | `premium`, `enterprise` |
| `hrFeatureGating` | `business_advanced`, `enterprise` (+ fallback chain) |

### Resolution patterns today

| Consumer | Resolution logic |
|----------|------------------|
| `FeatureGatingService.checkFeatureAccess` | Active `Subscription.tier` for user/business |
| `hrFeatureGating` | `activeSub?.tier \|\| business.tier \|\| 'free'` |
| `subscriptionMiddleware` | `Subscription.tier` with `standard` hierarchy |
| `admin-override` set-tier | Updates **`Business.tier` only** — no `Subscription` sync |
| `debug-business-tier` | Exposes `effectiveTier` vs `business.tier` |

**Authoritative SoR (recommended):** Active **`Subscription`** row for platform tier; **`Business.tier` deprecated** to derived cache or admin-only override with sync job. **Not implemented today.**

### Feature gating duplication

| Implementation | File | Used? |
|----------------|------|-------|
| `FeatureGatingService` | `featureGatingService.ts` | **Yes** — AI, `/api/features` |
| `FeatureGatingService` (duplicate class) | `featureGatingService.simplified.ts` | **Orphan** — archive candidate |
| `SubscriptionMiddleware` | `subscriptionMiddleware.ts` | featureGatingController |
| `hrFeatureGating` | `hrFeatureGating.ts` | HR routes — separate matrix |
| `FeatureGatingService.checkModuleAccess` | In main service | Module access |

### Module access / licensing

| Layer | Mechanism |
|-------|-----------|
| Module install | `ModuleInstallation` / `BusinessModuleInstallation` |
| Module paid tier | `ModuleSubscription` + `Module.pricingTier` |
| Feature flags | Static catalog in `FeatureGatingService` |
| HR features | `hrFeatureGating` + `HRModuleSettings` overrides |

---

## C. Commerce Flows

| Flow | Implementation | API path | Maturity |
|------|----------------|----------|----------|
| **Checkout (new sub)** | `createCheckoutSession` → Stripe Checkout | `/api/billing/checkout/session` | L2 |
| **Upgrade** | Checkout or `PUT /api/billing/subscriptions/:id` | Billing | L2 |
| **Downgrade** | Subscription update / checkout | Billing | P — tier enum validation inconsistent |
| **Cancel** | `cancelAtPeriodEnd` | `/api/billing/subscriptions/:id` DELETE | L2 |
| **Reactivate** | Reactivate endpoint | Billing + legacy payment | L2 — dual paths |
| **Renewal** | Stripe webhook + period fields | Webhook | L2 |
| **Payment methods** | Setup intent, list, default | `/api/billing/payment-methods` | L2 |
| **Customer portal** | Stripe portal session | `/api/billing/customer-portal` | L2 |
| **Module subscribe** | Module subscription service | `/api/billing/modules/*` + legacy payment | L2 — dual |
| **Invoices** | List/get | `/api/billing/invoices` | L2 |
| **Usage record** | Usage tracking | `/api/billing/usage` | L2 |
| **Trials** | Stripe `trialing` status mapped in sync | **No product trial flow** | L0–L1 |
| **Admin tier override** | `Business.tier` only | `/api/admin-override` | L1 — bypass |

**No dedicated user billing dashboard** — modal-only UX (L1).

---

## D. API & Service Audit Summary

| Pattern | Billing status |
|---------|----------------|
| Thin controllers | **Partial** — billingController delegates but ~900 LOC + inline Prisma |
| Service per domain | **Yes** — subscription, module sub, stripe |
| `authorize → activity` | **Fails** — no normalized activity on subscription changes |
| Policy Engine | **Fails** — billing writes not PE-aligned |
| Dual API paths | **Fails** — `/payment` + `/billing` |
| Webhook security | **Pass** — raw body route |

### Extraction requirements

1. `entitlementService` — canonical tier + feature resolution
2. Thin `billingController` — remove inline Prisma
3. Retire `/api/payment` — migrate clients to billing
4. Sync `Business.tier` with `Subscription` or deprecate field
5. Consolidate `hrFeatureGating` tier read through entitlement resolver

---

## E. Revenue Platform Boundaries

See [PP3_BILLING_ENTITLEMENTS_OWNERSHIP_MODEL.md](./PP3_BILLING_ENTITLEMENTS_OWNERSHIP_MODEL.md).

---

## F. Certification Readiness

| Metric | Estimate |
|--------|----------|
| G1–G9 | **~15–17/27 (~56–63%)** |
| Blocking | Tier SoR drift, dual APIs, no entitlement service |
| Likely path | PP-3 impl → **L3 WITH FINDINGS** |

See [PP3_BILLING_ENTITLEMENTS_CERTIFICATION_READINESS.md](./PP3_BILLING_ENTITLEMENTS_CERTIFICATION_READINESS.md).

---

## G. Account Platform Dependencies

### PP-1

| Link | Strength |
|------|----------|
| `User.stripeCustomerId` | **Medium** — identity user record |
| Auth for billing routes | **Hard** — already works via JWT |
| Profile/billing UX identity | **Soft** — modal works without profileService |

**PP-3 implementation can start backend tier work without full PP-1** but customer lifecycle should align with identity service.

### PP-2

| Link | Strength |
|------|----------|
| Business workspace billing tab | **Soft** — UX placement |
| Settings hub billing cross-link | **Soft** |
| HR tier-gated settings UI | **Medium** — reads entitlements |

### Can PP-3 be modernized independently?

| Work type | Independent? |
|-----------|--------------|
| Phase 0B-3 audit | ✅ Yes |
| Tier SoR + entitlement resolver | ✅ **Mostly** — backend-focused |
| Retire `/api/payment` | ✅ Yes with client migration |
| Stripe webhook hardening | ✅ Yes |
| Full certification | ❌ Needs constitutional writes + UX + trilogy coordination |
| Settings billing IA | ❌ Needs PP-2 |

**Verdict:** **Partial independence** — backend entitlement canonicalization can **lead or parallel** PP-1 early phases; **full Account Platform certification** requires trilogy alignment.

### Trilogy modernization order

1. **PP-1** phases 1–3 (auth, profile, preference registry)  
2. **PP-3** tier SoR + entitlement service + retire `/payment` (**can overlap PP-2 discovery**)  
3. **PP-2** settings API + hub IA (includes billing links)  
4. **PP-3** billing UX + constitutional alignment (PE, activity)  
5. **PP-1/2/3** certification evaluations (phased WITH FINDINGS)

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md](./PP3_BILLING_ENTITLEMENTS_OPERATION_MATRIX.md) |
| [PP3_BILLING_ENTITLEMENTS_OWNERSHIP_MODEL.md](./PP3_BILLING_ENTITLEMENTS_OWNERSHIP_MODEL.md) |
| [PP3_BILLING_ENTITLEMENTS_SERVICE_BOUNDARY_ANALYSIS.md](./PP3_BILLING_ENTITLEMENTS_SERVICE_BOUNDARY_ANALYSIS.md) |
| [PP3_BILLING_ENTITLEMENTS_EXECUTIVE_SUMMARY.md](./PP3_BILLING_ENTITLEMENTS_EXECUTIVE_SUMMARY.md) |

**Last updated:** 2026-06-19 (Phase 0B-3)
