# Marketplace Billing E2E Validation

**Phase:** Platform Controller 1E  
**Date:** 2026-06-25

---

## 1. Architecture (two subscription stores)

Marketplace business billing uses **two** Prisma models:

| Model | Table | Purpose |
|-------|-------|---------|
| `ModuleSubscription` | `module_subscriptions` | App-store model; Stripe IDs; revenue split; user-scoped |
| `BusinessModuleSubscription` | `business_module_subscriptions` | Business entitlement SoR; install/runtime gate |

Paid business flow **writes both** in `moduleSubscriptionService.createModuleSubscription` when `moduleRequiresBusinessSubscription(module)`.

Free business install writes **only** `BusinessModuleSubscription` via `ensureFreeBusinessModuleSubscription` on install.

**Platform Controller billing page** lists tier `Subscription` rows — not `BusinessModuleSubscription` directly. Business module money appears indirectly via `moduleSubscription` aggregates and developer payouts.

---

## 2. E2E path validation

### 2.1 Free business module install

| Step | Component | Status |
|------|-----------|--------|
| User installs in business context | `moduleProvisionController.installModule` | **Working** (code + tests) |
| Policy / scope check | Policy engine + `moduleScope` | **Working** |
| Installation row | `businessModuleInstallation` | **Working** |
| Free sub row | `ensureFreeBusinessModuleSubscription` | **Working** — idempotent test |
| Domain event | `moduleInstallDomainEvent.test.ts` | **Working** |
| **Live prod E2E** | Not executed in 1E | **Needs manual verification** |

### 2.2 Paid business module subscribe

| Step | Component | Status |
|------|-----------|--------|
| Stripe checkout / subscription | `moduleSubscriptionService` | **Working** (code) |
| `moduleSubscription` row | Prisma create + Stripe ID | **Working** |
| `businessModuleSubscription` upsert | `upsertPaidBusinessModuleSubscription` | **Working** |
| Requires `module.stripePriceId` for paid non-free | `businessBillingProbe` blocker | **Enforced** |
| Rollback on Stripe failure | Deletes `moduleSubscription` | **Working** |
| **Live prod E2E** | Not executed | **P1 — manual checkout required** |

### 2.3 BusinessModuleSubscription creation

| Case | Function | Amount | Stripe ID |
|------|----------|--------|-----------|
| Free | `ensureFreeBusinessModuleSubscription` | 0 | null |
| Paid | `upsertPaidBusinessModuleSubscription` | module price | from Stripe sub |

Unique key: `(moduleId, businessId)`.

### 2.4 ModuleSubscription pairing

On paid business create:

1. `moduleSubscription` created first with `businessId`, `amount`, revenue fields.
2. On Stripe success, `stripeSubscriptionId` set on `moduleSubscription`.
3. `upsertPaidBusinessModuleSubscription` mirrors business row.

**Risk:** If step 3 fails after step 2, tables can diverge — no automated reconciliation job found.

### 2.5 Runtime entitlement

| Check | Location | Data |
|-------|----------|------|
| `assertBusinessModuleEntitlement` | `businessModuleSubscriptionService` | `businessModuleSubscription.status === 'active'` |
| Install gate | `moduleRequiresBusinessSubscription` + active sub | **Working** |
| Runtime bridge | `moduleRuntimeController` | **Working** (code) |

Entitlement reads **`BusinessModuleSubscription`**, not `ModuleSubscription`.

### 2.6 Admin billing display (Platform Controller)

| Surface | Shows | Gap |
|---------|-------|-----|
| Billing → Subscriptions | Tier `Subscription` only | Does not list `business_module_subscriptions` |
| Billing → Payments | `invoice` (module or tier linked) | Depends on webhooks |
| Module stats / developer stats | `moduleSubscription` aggregates | May not match business table |
| **business-billing-probe** | `GET .../modules/:id/business-billing-probe` | **Best PC view** for business module billing truth |

### 2.7 Readiness card billing status

`getMarketplaceReadiness` → `businessBilling`:

- `applicable` — partner module billing rules
- `requiresSubscription` — from `moduleRequiresBusinessSubscription`
- `scopeCompatible` — module scope vs business context

Does **not** query live Stripe — manifest + module row only.

Probe endpoint: `GET /api/admin-portal/modules/:moduleId/marketplace-readiness`

---

## 3. Feature table

| Feature | Page | API | Data source | Status | Risk | Action |
|---------|------|-----|-------------|--------|------|--------|
| Free business install | (product) | `POST /api/module/:id/install` | `businessModuleSubscription` | Working (code) | Low | Smoke test in prod |
| Paid business subscribe | (product) | module subscription + Stripe | Both tables | Working (code) | **High** | Live purchase test |
| Entitlement runtime | (runtime) | policy + entitlement service | `business_module_subscriptions` | Working | Medium | — |
| PC tier billing list | billing | `/billing/subscriptions` | `subscriptions` | N/A for business module | Medium | Document scope |
| Business billing probe | modules | `/modules/:id/business-billing-probe` | DB install + sub rows | **Working** | Low | Use in ops |
| Readiness billing badge | modules | `/marketplace-readiness` | Module manifest + tier | **Partial** (no Stripe) | Medium | Label as config not paid status |
| Webhook status sync | infra | Stripe webhook | Both tables | Working (code) | High | Dashboard delivery |

---

## 4. E2E test recommendations (manual, prod or staging)

1. Install free partner module on test business → probe shows `installReady`, `runtimeReady`, tier `free`.
2. Purchase paid partner module → probe shows active sub, Stripe ID on business row.
3. Cancel in Stripe → webhook → `past_due` / `cancelled` on both tables.
4. Compare `module_subscriptions` vs `business_module_subscriptions` for same `moduleId` + `businessId`.

---

**Last updated:** 2026-06-25
