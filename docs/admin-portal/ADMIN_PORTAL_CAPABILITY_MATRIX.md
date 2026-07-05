# Admin Portal — Capability Matrix

**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Date:** 2026-07-05  
**Status:** Discovery only

**Purpose:** For every major capability, classify operational readiness and identify consolidation targets. No rebuild recommendations for completed systems.

**Legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ **Complete** | Production-grade operator surface |
| 🔄 **Modernize** | Exists; needs consolidation, UX, or satellite migration |
| 📋 **Duplicate** | Overlapping surface — merge into canonical path |
| ❌ **Missing** | No operator surface |
| 🗑️ **Deprecated** | Retire or redirect |

**Related:** [Reference Assessment](./ADMIN_PORTAL_REFERENCE_ASSESSMENT.md) · [Operational Model](./ADMIN_PORTAL_OPERATIONAL_MODEL.md)

---

## 1. Summary scorecard

| Category | Complete | Modernize | Duplicate | Missing | Deprecated |
|----------|:--------:|:---------:|:---------:|:-------:|:----------:|
| Pages & navigation | 24 | 4 | 2 | 3 | 13 |
| API & services | 12 | 5 | 0 | 4 | 2 |
| Operational coverage | 18 | 8 | 3 | 11 | 4 |
| **Overall** | **~65%** | **~20%** | **~5%** | **~10%** | — |

---

## 2. Pages, routes, and components

### 2.1 Frontend pages (44 total)

| Path | Classification | Operator function |
|------|----------------|-------------------|
| `/admin-portal/dashboard` | ✅ Complete | Platform overview, stats, activity |
| `/admin-portal/analytics` | ✅ Complete | Operator analytics (canonical) |
| `/admin-portal/platform-programs` | ✅ Complete | Certified program hub |
| `/admin-portal/platform-adoption` | ✅ Complete | Per-module adoption metrics |
| `/admin-portal/platform-adoption/[moduleId]` | ✅ Complete | Module adoption detail |
| `/admin-portal/modules` | ✅ Complete | Module governance (canonical) |
| `/admin-portal/developers` | ✅ Complete | Developer oversight |
| `/admin-portal/ai-pipeline` | ✅ Complete | AI ops hub |
| `/admin-portal/ai-pipeline/*` (9 sub) | ✅ Complete | Pipeline policy + diagnostics |
| `/admin-portal/users` | ✅ Complete | User management |
| `/admin-portal/moderation` | ✅ Complete | Content moderation |
| `/admin-portal/support` | 🔄 Modernize | Tickets live; page very large |
| `/admin-portal/impersonate` | ✅ Complete | Impersonation lab |
| `/admin-portal/security` | ✅ Complete | Security events + audit |
| `/admin-portal/billing` | ✅ Complete | Stripe sync, payouts |
| `/admin-portal/pricing` | ✅ Complete | Tier / query pack pricing |
| `/admin-portal/system` | ✅ Complete | Config, migrations (gated) |
| `/admin-portal/governance` | ✅ Complete | Governance dashboard |
| `/admin-portal/retention` | ✅ Complete | Data retention policies |
| `/admin-portal/system-logs` | ✅ Complete | Application log viewer |
| `/admin-portal/performance` | 🔄 Modernize | Partial synthetic metrics |
| `/admin-portal/overrides` | ✅ Complete | Admin overrides |
| `/admin-portal/business-intelligence` | 📋 Duplicate | Overlaps analytics insights |
| `/admin-portal/business-ai` | ✅ Complete | Business AI global dashboard |
| `/admin-portal/ai-system` | 🗑️ Deprecated | Launcher; removed from nav |
| `/admin-portal/ai-context` | 📋 Duplicate | Merge → pipeline diagnostics |
| `/admin-portal/ai-learning` | 🗑️ Deprecated | Redirect to AI Pipeline |
| `/admin-portal/testing` | 🗑️ Deprecated | Debug-gated |
| `/admin-portal/seed-modules` | 🗑️ Deprecated | Debug-gated |
| 7 debug/test pages | 🗑️ Deprecated | Env-gated direct URL |
| `/admin-portal/businesses` | ❌ Missing | **Planned** — business CRM hub |

### 2.2 Components (46 in `admin-portal/`)

| Component group | Count | Status |
|-----------------|------:|--------|
| AI Pipeline | 32 | ✅ Reference pattern |
| Platform Programs / Adoption | 4 | ✅ Complete |
| Shell / UX (`AdminPortalPageShell`, empty states) | 6 | ✅ Complete |
| Provider views | 2 | ✅ Complete |
| Impersonation | 1 | ✅ Complete |
| Analytics insights | 1 | 🔄 Modernize |

### 2.3 Backend services (17 in `services/admin/`)

| Service | Status |
|---------|--------|
| `adminUserService` | ✅ |
| `adminImpersonationService` | ✅ |
| `adminModerationService` | ✅ |
| `adminModuleGovernanceService` | ✅ |
| `adminSecurityService` | ✅ |
| `adminBillingService` | ✅ |
| `adminSupportService` | ✅ |
| `adminAnalyticsService` | 🔄 Triplication with BI |
| `adminPerformanceService` | 🔄 Synthetic metrics |
| `adminSystemOpsService` | ✅ |
| `adminAuditService` | ✅ |
| `adminAiPipelineDiagnosticsService` | ✅ |
| `platformAdoptionService` | ✅ |
| `adminServiceContracts` | ✅ |
| `subscriptionDisplayAmount` | ✅ |

### 2.4 API endpoints (158 canonical)

| Domain file | Handlers | Status |
|-------------|:--------:|--------|
| `adminPortalRoutes.core.ts` | 16 | ✅ |
| `adminPortalRoutes.analyticsOps.ts` | 49 | ✅ |
| `adminPortalRoutes.platform.ts` | 38 | ✅ |
| `adminPortalRoutes.aiPipeline.ts` | 45 | ✅ |
| `adminPortalRoutes.adoption.ts` | 3 | ✅ |
| `adminSecurityRoutes.ts` | 7 | ✅ |

---

## 3. Operational capability matrix

### 3.1 Platform health & monitoring

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Dashboard stats | ✅ | `/dashboard` | — |
| System metrics | 🔄 | `/performance` | Wire real probes |
| API health (`/api/health`) | ❌ | — | Add to dashboard |
| Cloud Run status | ❌ | — | Link + optional probe |
| Cloud SQL status | ❌ | — | Via health DB check |
| GCS storage | ❌ | — | Link to GCP console |
| Uptime / status page | ❌ | Public `/status` static | Feed from health panel |
| Error alerting | ❌ | — | Future: webhook config in System |

### 3.2 Email

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| SMTP delivery (prod) | ✅ | — | Launch verified |
| Template preview | ❌ | — | Wire `emailNotification` routes |
| Send test email | 🔄 | — | API exists; no UI |
| Delivery failures / bounces | ❌ | — | Future provider webhook |
| Ticket assignment email | ✅ | Support backend | — |

### 3.3 Stripe & billing

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Subscription list/sync | ✅ | `/billing` | — |
| Invoice/charge sync | ✅ | `/billing` | — |
| Stripe Dashboard deep links | ✅ | billing rows | — |
| Developer payouts | ✅ | billing payouts | — |
| Pricing management | ✅ | `/pricing` | — |
| Business module billing | 🔄 | Modules probe | Aggregate view needed |
| Live mode switch (`sk_live_`) | 🔄 | Env/Secret Manager | Document in System config |

### 3.4 Businesses & users

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| User search / ban / reset | ✅ | `/users` | — |
| Role view | ✅ | `/users` | — |
| Business list | 🔄 | `/impersonate` only | **Businesses hub** |
| Business detail / members | 🔄 | Impersonation | Extend to CRM |
| Pending invites | ❌ | — | New read-only panel |
| Permissions audit | 🔄 | Security partial | Policy Engine UI missing |

### 3.5 Marketplace & modules

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Submissions queue | ✅ | `/modules` | — |
| Certification validator | ✅ | Certification panel | — |
| Readiness probes (4) | ✅ | Readiness card | Persist probe results |
| Developer registry | ✅ | `/developers` | — |
| Module analytics | ✅ | Modules tab | — |
| Sandbox pilot dashboard | ❌ | Probe only | Platform Programs partial |
| Search delegate ops | ❌ | Probe only | Lightweight Search ops page |

### 3.6 AI administration

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Provider governance | ✅ | AI Pipeline hub | — |
| Provider usage / costs | ✅ | ProviderUsageView | — |
| Trace diagnostics | ✅ | diagnostics | — |
| Test lab | ✅ | test-lab | — |
| Context sources / graph | ✅ | sources, registry | — |
| Grounding / tools / intents | ✅ | sub-pages | — |
| Compliance / retention | ✅ | compliance | — |
| Embeddings admin | 🔄 | Partial | No dedicated page |
| Provider API keys | ❌ | Secret Manager | Read-only key *presence* indicator |
| Legacy centralized AI | 🗑️ | Satellite fenced | Do not extend |

### 3.7 Analytics

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Platform metrics | ✅ | `/analytics` | — |
| User growth / segments | ✅ | analytics tabs | — |
| Revenue / MRR | ✅ | analytics + billing | — |
| BI insights | 📋 | business-intelligence | Merge into analytics |
| Module install trends | ✅ | modules + adoption | — |
| AI usage metrics | ✅ | pipeline + provider | — |
| Product funnel (signup→action) | ❌ | — | Instrumentation gap |
| CS metrics (retention, churn) | ❌ | — | Future wave |
| Custom report export | ✅ | analytics export | — |
| Tenant analytics (product) | N/A | Dashboard module | Not operator scope |

### 3.8 Security & compliance

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Security events | ✅ | `/security` | — |
| Admin audit log | ✅ | security audit tab | — |
| Audit taxonomy (30 actions) | ✅ | Backend | — |
| Compliance export | ✅ | security + pipeline | — |
| Impersonation audit | ✅ | impersonate | — |
| Module security monitor | ✅ | security sub-mount | — |
| Feature flags | ❌ | Env only | Read-only flags page |
| Policy Engine admin | ❌ | — | Future |

### 3.9 Support, jobs, notifications

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| Support tickets | ✅ | `/support` | — |
| Knowledge base | ✅ | `/support` | — |
| Live chat ops | 🔄 | support partial | — |
| Background jobs (cron) | ❌ | `platformCronJobs` | Jobs panel |
| Push notification admin | ❌ | — | Future |
| In-app notification types | ❌ | Code metadata | Discovery UI |
| Application logs | ✅ | `/system-logs` | — |

### 3.10 Configuration & developer tools

| Capability | Status | Portal surface | Consolidation |
|------------|--------|----------------|---------------|
| System config KV | ✅ | `/system` | — |
| Maintenance mode | ✅ | `/system` | — |
| Dangerous migrations | ✅ | `/system` (gated) | — |
| Data retention | ✅ | `/retention` | — |
| Governance policies | ✅ | `/governance` | — |
| Admin overrides | ✅ | `/overrides` | Migrate satellite API |
| Debug test runner | 🗑️ | `/testing` (gated) | — |
| Seed modules | 🗑️ | gated | CLI preferred |

---

## 4. Permissions & role model

| Capability | Status | Notes |
|------------|--------|-------|
| Platform `ADMIN` gate | ✅ | Middleware + layout + `requireAdmin` |
| Per-route JWT auth | ✅ | Canonical mount |
| Probe route inline check | 🔄 | Minor inconsistency |
| Sub-roles (SUPPORT, FINANCE) | ❌ | Future |
| Impersonation deny paths | ✅ | Audit on deny |
| Dangerous ops env gate | ✅ | `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED` |
| Debug env gate | ✅ | `ADMIN_PORTAL_DEBUG_ENABLED` |

---

## 5. Cross-reference: recent program completion

| Program | Impact on matrix |
|---------|------------------|
| Email Experience | SMTP ✅; portal email ops ❌ |
| Stripe | Billing matrix row ✅ Complete |
| Product Readiness | No new operator pages required |
| Launch Readiness | Health endpoints exist; portal wiring ❌ |
| Dashboard / Workspace | Platform Programs links ✅ |
| AI Platform | AI Pipeline rows ✅ Complete |
| Marketplace | Modules rows ✅ Complete |
| Analytics program | Operator ✅; product funnel ❌ |

---

## 6. Gap priority (consolidation only)

| ID | Gap | Status | Wave |
|----|-----|--------|------|
| AP-OE-01 | Businesses operator hub | ❌ Missing | P0 |
| AP-OE-02 | Email operations surface | ❌ Missing | P0 |
| AP-OE-03 | Infra health panel | ❌ Missing | P1 |
| AP-OE-04 | Analytics/BI merge | 📋 Duplicate | P1 |
| AP-OE-05 | Feature flags read-only | ❌ Missing | P1 |
| AP-OE-06 | Cron jobs monitor | ❌ Missing | P2 |
| AP-OE-07 | Search ops page | ❌ Missing | P2 |
| AP-OE-08 | Probe result persistence | 🔄 Modernize | P2 |
| AP-OE-09 | ai-context retirement | 📋 Duplicate | P3 |
| AP-OE-10 | Satellite API migration | 🔄 Modernize | P3 |

---

**Last updated:** 2026-07-05
