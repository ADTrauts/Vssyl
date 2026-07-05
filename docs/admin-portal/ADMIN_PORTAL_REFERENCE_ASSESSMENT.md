# Admin Portal — Reference Assessment

**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Date:** 2026-07-05  
**Status:** Discovery complete — **no implementation, no architecture redesign, no parallel systems**

**Constraint:** Extend and consolidate what exists. Preserve constitutional decisions (control plane ≠ product module, `authorize → execute → emit` elsewhere).

**Cross-references:** [Launch Readiness](../launch-readiness/LAUNCH_READINESS_ASSESSMENT.md) · [Go-to-Market](../go-to-market/GO_TO_MARKET_PHASE_0A_EXECUTIVE_SUMMARY.md) · [Product Inventory](../product-readiness/EXISTING_PRODUCT_INVENTORY.md) · [Analytics Reality](../analytics/ANALYTICS_REALITY_ASSESSMENT.md) · [Operations Readiness](../launch-readiness/OPERATIONS_READINESS.md) · [Operator Guide](../guides/ADMIN_PORTAL.md)

**Related deliverables:** [Operational Model](./ADMIN_PORTAL_OPERATIONAL_MODEL.md) · [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md) · [UX Audit](./ADMIN_PORTAL_UX_AUDIT.md) · [Information Architecture](./ADMIN_PORTAL_INFORMATION_ARCHITECTURE.md) · [Modernization Plan](./ADMIN_PORTAL_MODERNIZATION_PLAN.md) · [Executive Summary](./ADMIN_PORTAL_REFERENCE_PROGRAM_EXECUTIVE_SUMMARY.md)

---

## 1. Executive answer

| Question | Answer |
|----------|--------|
| **Can Admin Portal become the single operational cockpit for Vssyl?** | **Yes — with consolidation work (~82% today)** |
| **Is it already the day-to-day operator home?** | **Yes** for users, modules, AI pipeline, billing, security, impersonation |
| **Is it a complete SaaS operations center?** | **No** — email ops, business CRM, infra probes, jobs, feature flags, and product funnel analytics live outside or are missing |
| **Should we rebuild?** | **No** — modernize by wiring existing capabilities into the portal shell |

**Prior certification:** LEVEL 3 CERTIFIED control plane (2026-06-18). This assessment is a **recertification baseline** for the Operational Excellence era, not a re-litigation of June architecture work.

---

## 2. Inventory summary (re-verified 2026-07-05)

| Layer | Count | Notes |
|-------|------:|-------|
| Frontend pages (`/admin-portal/*`) | **44** | 10 AI Pipeline sub-pages |
| Sidebar-navigated destinations | **24** | `platformControllerNavigation.ts` (debug-gated items excluded) |
| Orphan / hub / debug pages | **13** | AI satellites, legacy redirects, env-gated labs |
| `admin-portal` components | **46** | 32 AI Pipeline components |
| Legacy `admin` components | **4** | Certification panel, readiness card |
| Canonical API handlers | **158** | 151 domain + 7 `/security` sub-mount |
| Satellite / emergency / debug mounts | **21** | Documented in Satellite Mount Map |
| Domain services (`server/src/services/admin/`) | **17** | Includes `platformAdoptionService` |
| `adminApiService.ts` client | **2,008 LOC** | Primary `/api/admin-portal` + satellite calls |
| Backend integration test files | **18+** | `server/src/routes/__tests__/admin-portal*.ts` |
| Frontend hygiene/smoke tests | **13** | Nav, mock fallback, UX shell |

### 2.1 Classification enum

| Status | Meaning |
|--------|---------|
| **Already Complete** | Production-grade; operator-ready without redesign |
| **Needs Modernization** | Works but fragmented, weak UX, or satellite-mounted |
| **Duplicate** | Overlapping surface; consolidate into canonical path |
| **Missing** | No operator surface; capability exists elsewhere or not at all |
| **Deprecated** | Redirect/retire; do not extend |

---

## 3. Surface inventory

### 3.1 Sidebar navigation (authoritative: `platformControllerNavigation.ts`)

| Section | Destinations | Primary backend |
|---------|--------------|-----------------|
| Overview | Dashboard, Platform Analytics | core, analyticsOps |
| Platform Programs | Platform Programs, Platform Adoption | adoption, analyticsOps |
| Marketplace | Modules, Developers | analyticsOps |
| AI & Diagnostics | AI Pipeline, Diagnostics, System Logs, Performance | aiPipeline, platform, `/api/admin/logs` |
| Operations | Users, Moderation, Support, Impersonation | core, platform |
| Providers | Provider Governance (hash on AI Pipeline) | aiPipeline + `/api/admin/ai-providers` |
| Security | Security & Compliance | analyticsOps + security sub-mount |
| Billing | Financial Management, Pricing | analyticsOps, `/api/pricing` |
| Configuration | System Admin, Governance, Data Retention | platform |
| Operator Labs | Overrides, Testing (gated), Seed Modules (gated) | satellites, debug |

### 3.2 AI Pipeline sub-tree (10 pages)

| Path | Status |
|------|--------|
| `/admin-portal/ai-pipeline` | **Already Complete** |
| `.../intents`, `grounding`, `sources`, `tools` | **Already Complete** |
| `.../diagnostics`, `test-lab`, `quality`, `audit`, `compliance` | **Already Complete** |

### 3.3 Orphan / satellite pages

| Path | Status | Action |
|------|--------|--------|
| `/admin-portal/business-intelligence` | **Needs Modernization** | Link from Analytics insights tab or Platform Programs |
| `/admin-portal/business-ai` | **Already Complete** | Hub pattern acceptable |
| `/admin-portal/ai-system` | **Deprecated** | Removed from nav; launcher only |
| `/admin-portal/ai-context` | **Duplicate** | Merge into pipeline diagnostics |
| `/admin-portal/ai-learning` | **Deprecated** | Redirect to AI Pipeline |
| 7 debug/test pages | **Deprecated** | Env-gated; not prod nav |
| `/admin/*`, `/modules/admin` | **Deprecated** | Legacy handoff only |

### 3.4 Backend API domains

| File | Handlers | Responsibilities |
|------|:--------:|------------------|
| `adminPortalRoutes.core.ts` | 16 | Dashboard, users, moderation, impersonation |
| `adminPortalRoutes.analyticsOps.ts` | 49 | Analytics, billing, security, module governance, probes |
| `adminPortalRoutes.platform.ts` | 38 | BI, support, system, database, integrations |
| `adminPortalRoutes.aiPipeline.ts` | 45 | Pipeline catalog, policies, traces, compliance |
| `adminPortalRoutes.adoption.ts` | 3 | Platform adoption metrics |
| `adminSecurityRoutes.ts` | 7 | Module security monitoring |
| **Total** | **158** | JWT + `requireAdmin` on canonical mount |

### 3.5 Domain services

| Service | Status |
|---------|--------|
| `adminUserService` | **Already Complete** |
| `adminImpersonationService` | **Already Complete** |
| `adminModerationService` | **Already Complete** |
| `adminModuleGovernanceService` | **Already Complete** |
| `adminSecurityService` | **Already Complete** |
| `adminBillingService` | **Already Complete** |
| `adminSupportService` | **Already Complete** |
| `adminAnalyticsService` | **Needs Modernization** — overlaps BI |
| `adminPerformanceService` | **Needs Modernization** — partial synthetic metrics |
| `adminSystemOpsService` | **Already Complete** |
| `adminAuditService` + taxonomy | **Already Complete** |
| `adminAiPipelineDiagnosticsService` | **Already Complete** |
| `platformAdoptionService` | **Already Complete** (new) |

---

## 4. Capability reality assessment

### 4.1 Platform health & infrastructure

| Capability | Status | Where today | Portal gap |
|------------|--------|-------------|--------------|
| App health (`/api/health`, `/api/ready`, `/api/live`) | **Needs Modernization** | Express routes | Dashboard shows stats; no dedicated infra probe panel |
| Cloud Run | **Missing** | GCP console | No Cloud Run revision/status in portal |
| Cloud SQL | **Missing** | GCP console | DB health indirect via `/api/health` |
| GCS storage | **Missing** | GCP console | No storage quota/ops surface |
| WebSocket | **Missing** | Runtime | No socket connection monitor |
| `/status` public page | **Missing** (customer) | Static manual page | Operator should see live health feed |

### 4.2 Email (Launch Readiness: SMTP verified)

| Capability | Status | Where today | Portal gap |
|------------|--------|-------------|--------------|
| SMTP delivery | **Already Complete** | `emailService`, launch smoke tests | — |
| Transactional templates | **Already Complete** | `server/src/email/` | **Missing** admin template preview/send-test UI |
| Email notification API | **Needs Modernization** | `/api/email-notification` (admin test) | Not linked from portal |
| Delivery analytics | **Missing** | — | No bounce/failure dashboard |
| Support ticket email | **Already Complete** | `adminSupportService` | Wired through support page |

### 4.3 Stripe & billing (Launch Readiness: test-mode E2E verified)

| Capability | Status | Where today | Portal gap |
|------------|--------|-------------|--------------|
| Subscription sync | **Already Complete** | `/admin-portal/billing` | — |
| Invoice/charge sync | **Already Complete** | billing page | — |
| Developer payouts | **Already Complete** | billing payouts tab | Ledger-only; no Stripe Connect (known) |
| Pricing tiers / query packs | **Already Complete** | `/admin-portal/pricing` | — |
| Business module billing probe | **Needs Modernization** | Modules readiness card | No aggregate business billing ops view |
| Revenue analytics | **Already Complete** | analytics + BI | Triplication with BI page |

### 4.4 Businesses & customers

| Capability | Status | Where today | Portal gap |
|------------|--------|-------------|--------------|
| User search/admin | **Already Complete** | `/admin-portal/users` | — |
| Business listing (impersonation) | **Needs Modernization** | `/admin-portal/impersonate` | No dedicated **Businesses** CRM surface |
| Business analytics | **Needs Modernization** | `/api/business/:id/analytics` | Not operator-aggregated in portal |
| Customer success view | **Missing** | — | No cohort health / at-risk businesses |
| Invite/onboarding ops | **Missing** | Email + auth flows | No operator view of pending invites |

### 4.5 Marketplace & modules

| Capability | Status | Notes |
|------------|--------|-------|
| Module submissions | **Already Complete** | Canonical `/admin-portal/modules` |
| Certification v1.4.0 gates | **Already Complete** | `ModuleCertificationReviewPanel` |
| Marketplace readiness probes | **Already Complete** | Four probes on readiness card |
| Developer oversight | **Already Complete** | `/admin-portal/developers` |
| Platform adoption per module | **Already Complete** | `/admin-portal/platform-adoption` |

### 4.6 AI administration

| Capability | Status | Notes |
|------------|--------|-------|
| Provider management | **Already Complete** | AI Pipeline hub + Provider Governance nav |
| Costs / usage | **Already Complete** | `ProviderUsageView`, `ProviderExpensesView` |
| Diagnostics / traces | **Already Complete** | Reference subdomain |
| Prompt / test lab | **Already Complete** | test-lab |
| Context inspection | **Already Complete** | sources, registry graph |
| Pipeline diagnostics | **Already Complete** | diagnostics page |
| Memory / embeddings | **Needs Modernization** | Partial via pipeline; no dedicated embeddings admin |
| Provider key management | **Missing** | Secrets in env/Secret Manager only |

### 4.7 Analytics (operator class)

| Capability | Status | Notes |
|------------|--------|-------|
| Platform metrics | **Already Complete** | `/admin-portal/analytics` |
| Registrations / growth | **Already Complete** | analytics users tab |
| Revenue / subscriptions | **Already Complete** | analytics + billing |
| Feature adoption | **Needs Modernization** | `platform-adoption` partial |
| Marketplace installs | **Already Complete** | modules analytics |
| AI usage | **Already Complete** | pipeline metrics + provider usage |
| Product funnel (signup → action) | **Missing** | Launch readiness: 35% observability |
| Customer success metrics | **Missing** | No CS dashboard |

### 4.8 Security, compliance, audit

| Capability | Status | Notes |
|------------|--------|-------|
| Security events | **Already Complete** | `/admin-portal/security` |
| Admin audit taxonomy | **Already Complete** | 30 `ADMIN_*` actions |
| Compliance export | **Already Complete** | security + pipeline compliance |
| Impersonation audit | **Already Complete** | deny paths + audit |
| Feature flags | **Missing** | Env-only; no operator UI |
| Policy Engine admin | **Missing** | Engine exists; no portal surface |

### 4.9 Support, jobs, notifications

| Capability | Status | Notes |
|------------|--------|-------|
| Support tickets | **Already Complete** | Live API; large page |
| Knowledge base | **Already Complete** | support page |
| Background jobs | **Missing** | `platformCronJobs.ts` — no monitor |
| Push notifications | **Missing** | No admin notification management |
| In-app notification types | **Missing** | Metadata in code; no discovery UI |
| Application logs | **Already Complete** | system-logs → `/api/admin/logs` |

### 4.10 Configuration & release

| Capability | Status | Notes |
|------------|--------|-------|
| System config | **Already Complete** | system page |
| Dangerous migration ops | **Already Complete** | Env-gated |
| Data retention | **Already Complete** | retention page |
| Governance policies | **Already Complete** | governance page |
| Admin overrides | **Already Complete** | overrides + satellite |
| Release management | **Missing** | No deploy/version visibility |
| Feature rollout | **Missing** | Flags env-only |

---

## 5. Cross-program integration (Operational Excellence context)

| Program | Substantial completion | Admin Portal integration | Gap |
|---------|------------------------|--------------------------|-----|
| Email Experience | ✅ SMTP verified | Support ticket emails only | **Email ops hub missing** |
| Stripe | ✅ Test-mode E2E | Billing + pricing complete | Business paid-module E2E unverified in portal |
| Product Readiness | ✅ ~76% capability | Modules, users, impersonation | Customer-facing gaps ≠ operator gaps |
| Launch Readiness | ✅ 74% controlled beta | Health endpoints exist | Infra monitoring not in portal |
| Dashboard / Workspace | ✅ Certified modules | Platform Programs hub links | No workspace health aggregate |
| AI Platform | ✅ Pipeline L3 | AI Pipeline reference | Legacy satellites remain |
| Marketplace | ✅ L2.5 backend | Modules governance strong | Search ops page missing |
| Analytics | ✅ Operator class | analytics + BI | Product funnel missing |
| Billing | ✅ PP-3 | billing complete | Business billing aggregate missing |

---

## 6. Major strengths

1. **AI Pipeline admin** — production-grade reference subdomain (45 handlers, 10 pages, trace forensics).
2. **Module governance gate** — certification v1.4.0, readiness probes, promote/rollback enforcement.
3. **Billing / Stripe operator surface** — sync, payouts, pricing without parallel billing admin.
4. **Platform Programs hub** — federated operator entry for certified capabilities (added Phase 1B).
5. **Service decomposition** — 17 domain services; route Prisma ban enforced by tests.
6. **Safety controls** — debug gate, dangerous-op gate, impersonation audit, mock removal.
7. **Prior L3 certification** — constitutional control-plane decisions documented and ratified.

---

## 7. Major gaps (consolidation targets — not rebuilds)

| Priority | Gap | Consolidation approach |
|----------|-----|------------------------|
| P0 | **Business/customer operations** | Add Businesses hub — extend impersonation data + billing joins |
| P0 | **Email operations** | Wire `/api/email-notification` into Configuration section |
| P1 | **Infra health panel** | Consume `/api/health` + GCP links on dashboard/system |
| P1 | **Feature flag visibility** | Read-only env snapshot page (no new flag system) |
| P1 | **Analytics triplication** | Merge BI insights into analytics tabs (AP-F-007) |
| P2 | **Background jobs monitor** | Surface `platformCronJobs` last-run status |
| P2 | **Search ops** | Lightweight page from existing delegate probe |
| P2 | **Probe result history** | Persist last probe result on readiness card |
| P3 | **Orphan page retirement** | Redirect ai-context, remove debug from prod tree |
| P3 | **Satellite mount migration** | Gradual — ai-providers, admin-override into canonical prefix |

---

## 8. Operational maturity score

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| User & access ops | 15% | 92% | Users, impersonation, moderation |
| Marketplace & modules | 15% | 88% | Governance + adoption |
| AI administration | 15% | 90% | Pipeline reference |
| Billing & commercial | 12% | 85% | Stripe complete; business aggregate weak |
| Security & audit | 10% | 82% | Events + taxonomy; Policy Engine UI missing |
| Analytics (operator) | 10% | 75% | Live data; triplication + no funnel |
| Platform health & infra | 10% | 55% | Health endpoints exist; no GCP ops |
| Email & comms ops | 8% | 45% | SMTP works; no portal surface |
| Configuration & flags | 8% | 60% | System config; flags external |
| Support & jobs | 5% | 70% | Tickets live; jobs invisible |

### **Weighted overall: ~82%**

**Estimated completion to single cockpit:** **~92%** after P0–P1 consolidation (6–8 weeks engineering, no architecture program).

---

## 9. Verdict

**Yes** — Admin Portal can become Vssyl's single operational cockpit. It already functions as one for the highest-frequency operator workflows. Remaining work is **consolidation and surfacing**, not platform redesign.

Do **not** rebuild completed systems (AI Pipeline, module certification, billing, impersonation). Do **not** introduce parallel admin UIs in product modules.

---

**Last updated:** 2026-07-05 (Operational Excellence Phase 0A)
