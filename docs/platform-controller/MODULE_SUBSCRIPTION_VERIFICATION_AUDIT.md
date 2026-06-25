# Module + Subscription Verification Audit

**Program:** Platform Controller Phase 1C  
**Date:** 2026-06-24  
**Scope:** Module lifecycle, subscriptions, entitlements, and PC governance surfaces

---

## 1. Data model map

| Table | Purpose | Stripe link |
|-------|---------|-------------|
| `Module` | Marketplace catalog + developer ownership | Indirect via pricing on module |
| `ModuleSubmission` | Review queue | None |
| `ModuleSubscription` | Per-user/business module entitlements | `stripeSubscriptionId`, `amount`, split fields |
| `Subscription` | Platform tier (Pro, Business, etc.) | `stripeSubscriptionId` |
| `BusinessModuleSubscription` | Business-scoped rows (parallel path) | Via `moduleSubscription` / business service |
| `DeveloperRevenue` | Payout ledger | Derived from paid module revenue |
| `ModuleInstallation` / install state | Runtime install record | None |

**Duplication risk:** Revenue appears in both `moduleSubscription` (live subs) and `developerRevenue` (periodic records). `financialValidation` on developer stats exposes deltas.

---

## 2. Install / uninstall

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** |
| **API** | `POST /api/module/:moduleId/install`, `DELETE .../uninstall` |
| **Controller** | `server/src/controllers/module/moduleProvisionController.ts` |
| **Free business sub** | `ensureFreeBusinessModuleSubscription` on install (idempotent) |
| **Events** | Domain events emitted (`moduleInstallDomainEvent.test.ts`, `moduleUninstallDomainEvent.test.ts`) |
| **PC surface** | Not direct — operators use Modules governance, not install buttons |
| **Risk** | Low for code path |
| **Action** | None for 1C |

### Uninstall behavior

- Soft entitlement revocation via subscription status / install record updates
- Tests confirm domain event emission on success paths

---

## 3. Subscription types

### 3.1 Free module subscription (business)

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** |
| **Service** | `businessModuleSubscriptionService.ensureFreeBusinessModuleSubscription` |
| **Trigger** | Module install in business context |
| **Tests** | `businessModuleSubscriptionService.test.ts` — idempotent create |
| **PC visibility** | Module analytics revenue excludes free ($0) |

### 3.2 Paid module subscription (personal)

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** |
| **Service** | `moduleSubscriptionService` |
| **Payment** | Stripe payment intent or subscription checkout |
| **Webhook** | `handleStripeWebhook` updates status |
| **Tests** | `stripeWebhookBilling.test.ts`, payment intent test |

### 3.3 Paid module subscription (business)

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** |
| **Service** | `upsertPaidBusinessModuleSubscription` |
| **Entitlement** | `assertBusinessModuleEntitlement` in `businessModuleSubscriptionService` |
| **Scope** | `businessId` + `moduleId` required |
| **PC probe** | `GET /api/admin-portal/modules/:moduleId/business-billing-probe` |
| **Risk** | Medium — probe shows DB state, not live Stripe unless synced |
| **Action** | Document probe as DB truth; link to billing sync |

### 3.4 Platform tier subscription

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** (separate from module subs) |
| **Table** | `Subscription` |
| **Entitlement** | `entitlementService.syncBusinessTierCache` on checkout |
| **PC** | Billing subscriptions tab (tier rows mixed in same list) |
| **Risk** | High display bug — amount shows 0 (see billing audit) |

---

## 4. Runtime entitlement

| Check | Location | Status |
|-------|----------|--------|
| Business module access | `assertBusinessModuleEntitlement` | **Working** |
| Policy engine billing | `policyEngine.ts` entitlement actions | **Working** |
| Module scope validation | Install + readiness probes | **Working** |
| PC verification | Readiness card + business-billing-probe | **Partially Working** (probe only) |

Entitlements are enforced at API/runtime — not re-validated on every PC page view (expected).

---

## 5. Platform Controller module surfaces

### 5.1 Modules page (`/admin-portal/modules`)

| Tab / feature | API | Data | Status |
|---------------|-----|------|--------|
| Submissions list | `GET /modules/submissions` | `moduleSubmission` | **Working** |
| Module stats header | `GET /modules/stats` | Aggregates on submissions + revenue | **Working** |
| Certification panel | Submission detail APIs | Certification gate on version | **Working** |
| Readiness card | `GET /modules/:id/readiness` | Registry probes | **Working** |
| AI Context tab | `?tab=ai-context` | Module AI context providers | **Working** |
| Status update | `PUT /modules/:id/status` | `module.status` | **Working** |
| Financial validation (developers) | `GET /developers/stats` | Cross-table deltas | **Partially Working** |

### 5.2 Developers page (`/admin-portal/developers`)

| Feature | API | Status |
|---------|-----|--------|
| Developer list | Developer governance routes | **Working** |
| Stats + revenue | `getDeveloperStats` | **Partially Working** (delta fields) |
| Payout visibility | Billing payouts tab | **Partially Working** |

### 5.3 Marketplace readiness card

| Probe | Validates | Status |
|-------|-----------|--------|
| Scope | `moduleScope` | **Working** |
| Search delegate | Registry + allowlist | **Working** (pilot) |
| AI context | Provider registration | **Working** |
| Business billing | DB subscription rows | **Partially Working** |
| Live search probe | `?live=true` | **Needs Manual Verification** |

### 5.4 Module analytics (`getModuleAnalytics`)

| Attribute | Value |
|-----------|-------|
| **Status** | **Working** |
| **Data** | Real Prisma `groupBy` on categories, revenue by module, ratings |
| **Note** | Not synthetic — unlike legacy placeholder comment in `adminServiceContracts` for older overview bundles |

---

## 6. Subscription display in Platform Controller

| Surface | What it shows | Accurate? |
|---------|---------------|-----------|
| Billing → Subscriptions | Tier + linked subs | Status yes; **amount no** |
| Billing → Payments | Invoices | Yes when rows exist |
| Modules stats `totalRevenue` | Sum active `moduleSubscription.amount` | **Working** for module revenue |
| Dashboard `monthlyRevenue` | Same module sub sum | **Partial** — omits tier revenue |
| Developers `financialValidation` | Deltas | **Truthful warning** when mismatch |

---

## 7. Feature table

| Feature | Page | API | Data Source | Status | Risk | Recommended Action |
|---------|------|-----|-------------|--------|------|-------------------|
| Module install | (product) | `POST /api/module/:id/install` | install controller + `moduleSubscription` | Working | Low | — |
| Module uninstall | (product) | `DELETE /api/module/:id/uninstall` | install controller | Working | Low | — |
| Free business module sub | (install) | internal | `moduleSubscription` $0 | Working | Low | — |
| Paid personal module sub | (checkout) | payment + webhook | `moduleSubscription` + Stripe | Working | Medium | Stripe reconcile |
| Paid business module sub | (checkout) | business service + webhook | `moduleSubscription` + `businessId` | Working | Medium | Use billing probe |
| Runtime entitlement | (runtime) | policy + entitlement service | `moduleSubscription` | Working | Medium | — |
| Submissions queue | modules | `/modules/submissions` | `moduleSubmission` | Working | Low | — |
| Certification gate | modules | promote/certify APIs | version certification fields | Working | Low | — |
| Readiness card | modules | `/modules/:id/readiness` | registry probes | Working | Low | — |
| Business billing probe | modules | `/modules/:id/business-billing-probe` | DB subs | Partially Working | Medium | Label as DB not Stripe |
| Module stats | modules, Programs card | `/modules/stats` | submissions + revenue | Working | Low | Don't use for runtime health |
| Developer financial validation | developers | `/developers/stats` | cross-table | Partially Working | High | Investigate deltas |
| Module revenue by module | modules analytics | `/modules/analytics` | `moduleSubscription` groupBy | Working | Low | — |
| Tier subscription in module context | billing | `/billing/subscriptions` | `subscription` | Partially Working | High | Fix amount display |

---

## 8. Duplication / consistency checklist

| Question | Finding |
|----------|---------|
| Same sub in two tables? | Tier (`Subscription`) vs module (`ModuleSubscription`) — **intentional separation** |
| Business vs personal duplicate? | Prevented by scoping `businessId` |
| Revenue double-recorded? | Possible gap between `moduleSubscription` split fields and `developerRevenue` — **monitor deltas** |
| Free + paid collision? | `ensureFreeBusinessModuleSubscription` idempotent — paid upsert replaces |

---

**Last updated:** 2026-06-24
