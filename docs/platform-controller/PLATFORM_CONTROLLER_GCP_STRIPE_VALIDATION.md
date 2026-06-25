# Platform Controller — GCP + Stripe Operational Validation (Phase 1E)

**Program:** Platform Controller Program  
**Phase:** 1E — Operational validation  
**Date:** 2026-06-25  
**Status:** Complete (code + GCP live probes; Stripe Dashboard manual checklist)

**Rule applied:** Local tests ≠ production readiness. This audit traces **Platform Controller → API → Service → DB / Stripe / GCP → displayed result** and records what was **live-verified** vs **code-only**.

---

## 1. Validation methodology

| Layer | Method |
|-------|--------|
| Code path | Static trace of services, routes, Prisma models, webhook handlers |
| Automated tests | Existing vitest/integration tests (not re-run against prod DB) |
| GCP live | `gcloud` CLI: Cloud Run env, Cloud SQL, GCS, Cloud Build; `curl` to production `/api/health`, `/api/ready`, `/api/payment/webhook` |
| Stripe live | Endpoint reachability + secret mounting; **no** Stripe API list calls (keys in Secret Manager) |
| Platform Controller UI | Inferred from API contracts post–Phase 1D truth fixes |

---

## 2. Executive verdict

| Area | Production readiness | Confidence |
|------|---------------------|------------|
| **GCP runtime (Cloud Run + SQL + GCS)** | **Ready** for serving | **High** — live health + env verified |
| **Stripe infrastructure** | **Configured** on Cloud Run | **Medium** — secrets mounted; webhook route live; Dashboard delivery unverified here |
| **Tier billing in Platform Controller** | **Partially ready** | **Medium** — truthful display after sync; unknown amounts until `stripeMetadata` populated |
| **Marketplace business billing E2E** | **Partially ready** | **Medium** — dual-table model; entitlement path strong; PC billing list gap |
| **Platform Programs signals** | **Honestly labeled proxies** | **High** for copy; **Medium** for prod data volume |

---

## 3. Master validation matrix

| Feature | PC surface | API | Data / external | Live prod check | Status | Risk | Action |
|---------|------------|-----|-----------------|-----------------|--------|------|--------|
| Stripe customer create | User checkout (not PC) | `StripeService.createCustomer` | Stripe + `user.stripeCustomerId` | Code + secret mounted | **Working** | Low | Spot-check customers in Stripe Dashboard |
| Checkout session | User billing | Checkout API | Stripe | Not live-tested | **Working** (code) | Medium | One test checkout in test mode |
| Tier subscription webhook | N/A | `POST /api/payment/webhook` | Stripe → `subscription` | Endpoint **400** without sig (expected) | **Working** (route) | **High** | Confirm Dashboard webhook URL + events |
| Subscription amount (PC) | Billing | `GET /billing/subscriptions` | `stripeMetadata.items` | Code + 1D fix | **Partially Working** | Medium | Run sync-all; verify metadata in prod |
| Module subscription (paid) | Billing payments | Webhook + `moduleSubscription` | Stripe + DB | Code | **Working** (code) | Medium | Live paid module purchase |
| Business module sub | Install/probe | `businessModuleSubscription` | DB (+ Stripe on paid) | Code | **Partially Working** | **High** | See marketplace billing doc |
| Stripe sync (admin) | Billing sync buttons | `StripeSyncService` | Stripe API | Secret mounted | **Working** (code) | Medium | Operator sync in prod |
| Cloud SQL | All PC data | Prisma | `vssyl-db-optimized` | Instance **RUNNABLE**; `/api/health` **connected** | **Working** | Low | — |
| GCS artifacts | Marketplace | `storageService` | `vssyl-storage-472202` | Bucket exists | **Working** | Low | Test artifact signed URL once |
| Programs — Kernel | Programs hub | Dashboard stats | Host CPU/memory | `/api/health` proves server up | **Proxy truthful** | Medium | Label only (1D done) |
| Programs — Search | Programs hub | Readiness pilot | Registry + DB | Code | **Pilot scope** | Medium | Fleet probe future |
| Programs — Retrieval | Programs hub | Pipeline quality | Trace store | Not counted in prod | **Data-dependent** | Medium | Confirm traces in prod |
| Programs — Context Graph | Programs hub | Pipeline catalog | Registry | Code | **Catalog truth** | Medium | Not graph SLO |
| Programs — Marketplace | Programs hub | Module stats | `moduleSubmission` | Code | **Queue truth** | Medium | Not runtime SLO |

---

## 4. Live GCP probes (2026-06-25)

| Probe | Result |
|-------|--------|
| `GET https://vssyl-server-…/api/health` | `200` — `database: connected`, `environment: production` |
| `GET …/api/ready` | `200` |
| `POST …/api/payment/webhook` (empty body) | `400` — signature/config path active (not `401`) |
| Cloud SQL `vssyl-db-optimized` | `RUNNABLE`, PostgreSQL 15, `us-central1` |
| GCS `gs://vssyl-storage-472202` | Exists, US |
| Cloud Run `vssyl-server` secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, AI keys, JWT |
| Cloud Build latest | `bdb96683` failed (TS billing types); fix build `cf6eefb7` in progress after `9bb0756c` |

---

## 5. Stripe manual verification checklist (operator)

Not executed in this phase (requires Stripe Dashboard / CLI):

- [ ] Webhook endpoint URL = `https://vssyl-server-235369681725.us-central1.run.app/api/payment/webhook`
- [ ] Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, `payment_intent.*`
- [ ] Signing secret matches Secret Manager `stripe-webhook-secret`
- [ ] Test vs live key mode documented for operators
- [ ] Sample tier subscription shows `stripeMetadata.items` after sync in PC billing
- [ ] Sample module subscription appears in `module_subscriptions` + `business_module_subscriptions` when business-scoped

---

## 6. Related deliverables

| Document | Focus |
|----------|--------|
| [STRIPE_OPERATIONAL_VALIDATION.md](./STRIPE_OPERATIONAL_VALIDATION.md) | Stripe chain detail |
| [MARKETPLACE_BILLING_E2E_VALIDATION.md](./MARKETPLACE_BILLING_E2E_VALIDATION.md) | Module install / entitlement |
| [GCP_RUNTIME_VALIDATION.md](./GCP_RUNTIME_VALIDATION.md) | Cloud Run / SQL / GCS |
| [PLATFORM_PROGRAMS_OPERATIONAL_DATA_VALIDATION.md](./PLATFORM_PROGRAMS_OPERATIONAL_DATA_VALIDATION.md) | Per-program card sources |
| [Phase 1E Executive Summary](./PLATFORM_CONTROLLER_PHASE_1E_EXECUTIVE_SUMMARY.md) | Priorities |
| [Functional gap register](./PLATFORM_CONTROLLER_FUNCTIONAL_GAP_REGISTER.md) | Updated P0–P3 |

---

## 7. Phase 1E acceptance criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | Stripe-backed billing truth known | ✅ With manual Dashboard checklist |
| 2 | Marketplace billing E2E status known | ✅ Dual-table + probe documented |
| 3 | GCP runtime readiness known | ✅ Live probes |
| 4 | Program cards validated vs sources | ✅ Per-program in Programs doc |
| 5 | Production blockers ranked | ✅ In executive summary + gap register |
| 6 | No misleading UI introduced | ✅ Validation only |
| 7 | Documentation updated | ✅ |

---

**Last updated:** 2026-06-25
