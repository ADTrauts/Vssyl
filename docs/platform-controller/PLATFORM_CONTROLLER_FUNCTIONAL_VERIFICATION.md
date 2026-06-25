# Platform Controller — Functional Verification (Phase 1C)

**Program:** Platform Controller Program — Phase 1C  
**Date:** 2026-06-24  
**Status:** Verification complete (code-path audit; no runtime Stripe/GCP calls)  
**Mode:** Truth audit only — no implementation changes

**Related deliverables:**

- [Billing + Stripe](./BILLING_STRIPE_VERIFICATION_AUDIT.md)
- [Modules + Subscriptions](./MODULE_SUBSCRIPTION_VERIFICATION_AUDIT.md)
- [AI Workspace](./AI_WORKSPACE_FUNCTIONAL_AUDIT.md)
- [Platform Programs data truth](./PLATFORM_PROGRAMS_DATA_TRUTH_AUDIT.md)
- [Functional gap register](./PLATFORM_CONTROLLER_FUNCTIONAL_GAP_REGISTER.md)
- [Executive summary](./PLATFORM_CONTROLLER_PHASE_1C_EXECUTIVE_SUMMARY.md)

---

## 1. Methodology

For each feature the audit traced:

**UI → API client → Express route → service → Prisma / Stripe / external API → displayed result**

Evidence sources:

- Frontend pages under `web/src/app/admin-portal/`
- `web/src/lib/adminApiService.ts` and direct `fetch` calls
- Backend routes under `server/src/routes/admin-portal/` and satellite mounts
- Domain services (`adminBillingService`, `adminModuleGovernanceService`, `stripeService`, `moduleSubscriptionService`, AI pipeline services)
- Automated tests (`server/src/routes/__tests__/`, `server/src/services/__tests__/`)

**Not performed in this phase:** live calls to Stripe Dashboard, OpenAI/Anthropic billing APIs, or production GCP. Items requiring live verification are marked **Needs Manual Stripe/GCP Verification**.

---

## 2. Status legend

| Status | Meaning |
|--------|---------|
| **Working** | End-to-end path exists; data source is real; known gaps are cosmetic |
| **Partially Working** | Core path works but display, scope, or sync is incomplete or misleading |
| **Stub/UI Only** | Page renders; backend returns synthetic, empty, or random data |
| **Broken** | Route or contract mismatch causes reliable failure |
| **Needs Manual Stripe/GCP Verification** | Code path looks correct; production truth requires external account check |

---

## 3. Master feature matrix

| Feature | Page | API | Data Source | Status | Risk | Recommended Action |
|---------|------|-----|-------------|--------|------|-------------------|
| **Billing — tier subscriptions list** | `/admin-portal/billing` | `GET /api/admin-portal/billing/subscriptions` | `prisma.subscription` | Partially Working | **High** | Surface amount from `stripeMetadata.items` or add `amount` column; fix summary to use Stripe totals not `additionalEmployeeCost` only |
| **Billing — subscription Stripe sync** | `/admin-portal/billing` | `POST .../billing/subscriptions/:id/sync`, `sync-all` | `StripeSyncService` → Stripe API → `subscription` | Working | Medium | Verify sync in staging with real Stripe test subs |
| **Billing — invoices / payments** | `/admin-portal/billing` (Payments tab) | `GET /api/admin-portal/billing/payments` | `prisma.invoice` + Stripe URL helpers | Partially Working | **High** | Confirm webhooks populate `invoice`; run manual Stripe reconciliation |
| **Billing — developer payouts** | `/admin-portal/billing` (Payouts) | `GET /api/admin-portal/billing/payouts` | `prisma.developerRevenue` | Partially Working | **High** | Validate payout status transitions vs Stripe Connect (if used) |
| **Billing — AI provider expenses** | `/admin-portal/billing` (Expenses) | `GET /api/admin/ai-providers/expenses/providers` | OpenAI + Anthropic admin APIs | Needs Manual Stripe/GCP Verification | Medium | Confirm API keys; empty provider response shows $0 silently |
| **Billing — pricing management** | `/admin-portal/pricing` | `/api/admin-portal/pricing/*` | `prisma.pricingConfig` + Stripe price seed | Working | Low | Spot-check `stripePriceId` alignment with Stripe Dashboard |
| **Stripe — customer creation** | User settings / checkout (not PC UI) | `StripeService.createCustomer`, `paymentService` | Stripe API → `user.stripeCustomerId` | Working | Low | PC billing displays customer links when IDs present |
| **Stripe — subscription checkout** | User billing flows | Checkout webhook → `upsertSubscriptionFromCheckout` | Stripe → `subscription` | Working | Medium | Needs Manual Stripe/GCP Verification in prod |
| **Stripe — webhooks** | N/A (infra) | `POST /api/payment/webhook` | `StripeService.handleWebhookEvent` | Working | **High** | Confirm signing secret and event coverage in deployed env |
| **Stripe — module subscription webhooks** | N/A | Same webhook | `ModuleSubscriptionService.handleStripeWebhook` | Working | Medium | Integration tests exist; verify business vs personal metadata |
| **Dashboard — platform overview** | `/admin-portal/dashboard` | `GET /api/admin-portal/dashboard/stats` | `user`/`business` counts, `moduleSubscription` revenue | Partially Working | Medium | `activeUsers` equals `totalUsers`; revenue excludes tier subs |
| **Dashboard — system health score** | Dashboard + Programs Kernel card | Same + `SystemMonitoringService` | Host CPU/memory heuristic | Partially Working | Medium | Label as infrastructure pressure, not “kernel certified” |
| **Platform Programs hub** | `/admin-portal/platform-programs` | Multiple probes (see Programs audit) | Mixed proxies | Partially Working | **High** | Add disclaimers on cards; do not treat green as program certification |
| **Modules — submissions & certification** | `/admin-portal/modules` | `/api/admin-portal/modules/*` | `moduleSubmission`, certification gate | Working | Low | Keep as governance SoT |
| **Modules — install / uninstall** | Product workspace (not PC) | `POST/DELETE /api/module/:id/install` | `moduleProvisionController` | Working | Low | PC observes via analytics only |
| **Modules — free business subscription** | Install path | `ensureFreeBusinessModuleSubscription` | `moduleSubscription` | Working | Low | Idempotent per tests |
| **Modules — paid module subscription** | Marketplace checkout | `moduleSubscriptionService` + Stripe | `moduleSubscription` + Stripe | Working | Medium | Reconcile `amount` with Stripe price |
| **Modules — business entitlement runtime** | Runtime (not PC) | Policy + `assertBusinessModuleEntitlement` | `moduleSubscription` scoped by `businessId` | Working | Medium | PC readiness probe is indirect |
| **Modules — marketplace readiness card** | `/admin-portal/modules` | `GET .../modules/:id/readiness` | Registry probes | Working | Low | Pilot-complete per Phase 0A |
| **Modules — business billing probe** | Module detail | `GET .../business-billing-probe` | `moduleSubscription` + business rows | Partially Working | Medium | Use for ops; not full Stripe truth |
| **Modules — developer stats / financial validation** | `/admin-portal/developers` | `GET .../developers/stats` | `moduleSubscription` vs `developerRevenue` deltas | Partially Working | **High** | Investigate non-zero `financialValidation` deltas |
| **AI Pipeline — hub & subpages** | `/admin-portal/ai-pipeline/*` | `/api/admin-portal/ai-pipeline/*` | Pipeline policy store, traces | Working | Low | Route tests AP-F-030 |
| **AI Pipeline — grounding / intents / tools** | Subpages | CRUD on pipeline routes | Pipeline DB / config | Working | Low | Affects live AI when enabled |
| **AI Pipeline — diagnostics / quality** | diagnostics, quality | traces + quality stats | Trace store | Working | Low | Diagnostics-only for operators |
| **AI Pipeline — test lab** | test-lab | dry-run endpoints | Pipeline test services | Working | Low | Does not mutate production AI config without save |
| **AI — providers (usage/expenses)** | AI Pipeline + billing expenses | `/api/admin/ai-providers/*` | Provider APIs + `HistoricalDataService` | Needs Manual Stripe/GCP Verification | Medium | Depends on provider admin credentials |
| **AI System overview** | `/admin-portal/ai-system` (off-nav) | `business-ai` + learning satellites | Mixed | Partially Working | Low | Launcher only; prefer Programs + Pipeline |
| **Business AI global dashboard** | `/admin-portal/business-ai` | `/api/admin/business-ai/global`, `/patterns` | `businessAIDigitalTwin`, `globalPattern`, `collectiveInsight` | Partially Working | Medium | `averageConfidence` is placeholder in global metrics |
| **AI — memories / preferences admin** | None in PC | N/A (runtime only) | `PreferenceResolver`, context assembler | Stub/UI Only | Low | No operator surface; not a PC gap for 1C |
| **Admin overrides** | `/admin-portal/overrides` | `/api/admin-override/*` | `user`, `business` tier | Working | Medium | Powerful; audit log coverage separate |
| **Security — module metrics widget** | `/admin-portal/security` | Security routes | **`Math.random()` in `adminSecurityService`** | **Stub/UI Only** | **Critical** | Replace with real `securityEvent` aggregates or hide widget |
| **Security — security events list** | `/admin-portal/security` | `GET /api/admin-portal/security/events` | `securityEvent` (when populated) | Partially Working | High | Depends on events being written |
| **Performance metrics** | `/admin-portal/performance` | `/api/admin-portal/performance/*` | `SystemMonitoringService` + `os` | Partially Working | Medium | Single-host metrics; not cluster-wide |
| **System health page** | `/admin-portal/system` | `/api/admin-portal/system/*` | `adminSystemOpsService` | Partially Working | Medium | Real when monitoring service available |
| **Analytics / BI** | `/admin-portal/analytics`, `business-intelligence` | `/api/admin-portal/analytics/*` | Prisma aggregates, `collectiveInsight` | Partially Working | Medium | Session metrics may be sparse; BI avoids mock insights |
| **Support tickets** | `/admin-portal/support` | `/api/admin-portal/support/*` | `supportTicket` | Working | Low | Standard CRUD |
| **Governance** | `/admin-portal/governance` | Governance routes | Policy / audit artifacts | Partially Working | Medium | Verify per-tab backing (see gap register) |
| **Impersonation** | `/admin-portal/impersonate` | `/api/admin-portal/impersonation/*` | `adminImpersonationService` | Working | High | Ops-critical; test in staging |
| **Moderation** | `/admin-portal/moderation` | Moderation routes | Content moderation tables | Partially Working | Medium | Confirm volume in prod |
| **Retention** | `/admin-portal/retention` | Retention + pipeline retention API | Pipeline retention settings | Working | Low | Tied to AI pipeline store |
| **Unified Search program health** | Programs hub | `GET .../modules/:id/readiness` (pilot) | Search delegate registry probe | Partially Working | Medium | Single pilot module; not fleet health |
| **Context Graph program health** | Programs hub | `GET .../ai-pipeline/catalog` | Context source count | Partially Working | **High** | Count ≠ graph connectivity health |
| **Marketplace runtime program health** | Programs hub | `GET .../modules/stats` | `moduleSubmission` pending count | Partially Working | **High** | Submission queue ≠ partner runtime health |

---

## 4. Cross-cutting findings

### 4.1 Financial truth gaps (highest priority)

1. **`Subscription` model has no `amount` column** — admin billing UI maps `amount: 0` while Stripe amounts live in `stripeMetadata.items` after sync.
2. **Dashboard `monthlyRevenue`** sums active `moduleSubscription.amount` only — excludes tier (`Subscription`) revenue.
3. **`getSubscriptions` summary** uses `additionalEmployeeCost` for `estimatedMonthlyAmount` — wrong for non-business tiers.
4. **`developerRevenue` vs `moduleSubscription` split fields** — `financialValidation` deltas exposed on developer stats; non-zero delta implies reconciliation debt.

### 4.2 Misleading health signals

1. **Platform Kernel card** — green when host CPU/memory pressure &lt; 20%; not platform kernel certification.
2. **Security module metrics** — random numbers; must not be used for ops decisions.
3. **Dashboard `activeUsers`** — hardcoded equal to `totalUsers`.

### 4.3 What is genuinely strong

- AI Pipeline operator surface (catalog, diagnostics, grounding CRUD, test lab) with route-level tests.
- Module governance (submissions, certification, readiness probes, promote gates).
- Stripe webhook single entrypoint with module + tier handlers and integration tests.
- Admin billing sync buttons call real `StripeSyncService` (not no-ops).

---

## 5. Test coverage summary

| Area | Automated tests | Gap |
|------|-----------------|-----|
| Billing admin routes | Contract tests (delegation to services) | No integration test against Stripe |
| Stripe webhooks | `stripe-webhook.integration.test.ts`, `stripeWebhookBilling.test.ts` | Prod signing secret not verified here |
| AI Pipeline admin | `admin-portal-ai-pipeline.test.ts` (8 cases) | UI E2E not covered |
| Module install/uninstall | Domain event tests | No full PC UI E2E |
| Platform Programs hub | `platformControllerPhase1B.test.ts` (config/nav) | Health heuristics not asserted |
| Security metrics | None for random data path | **Missing** |

---

## 6. Verification scope boundaries

**In scope:** Code-path truth, data-source identification, classification, gap register.  
**Out of scope:** New features, UI redesign, API refactors (except documenting small truth fixes).  
**Deferred manual checks:** Stripe Dashboard reconciliation, OpenAI/Anthropic billing API credentials, production webhook delivery logs.

---

**Last updated:** 2026-06-24
