# Admin Portal — Reality Assessment

**Program:** Admin Portal Program — Phase 0A  
**Date:** 2026-06-24  
**Status:** Discovery complete — **no implementation, no migrations, no ledger changes**

**Constraint:** Treat Admin Portal as **platform governance infrastructure**, not merely an administrative settings screen.

**Prior work integrated:** Admin Portal Modernization (Stages 0B–1B, ratified **LEVEL 3 CERTIFIED** 2026-06-18). This assessment re-baselines posture after completion of Platform Kernel, Unified Search, AI Retrieval, Context Graph, and Marketplace Partner Capability Foundation programs.

**Related deliverables:** [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md) · [Architecture Audit](./ADMIN_PORTAL_ARCHITECTURE_AUDIT.md) · [UX Audit](./ADMIN_PORTAL_UX_AUDIT.md) · [Marketplace Governance Review](./ADMIN_PORTAL_MARKETPLACE_GOVERNANCE_REVIEW.md) · [Strategic Positioning](./ADMIN_PORTAL_STRATEGIC_POSITIONING.md) · [Executive Summary](./ADMIN_PORTAL_PHASE_0A_EXECUTIVE_SUMMARY.md)

**Authoritative references:** [`docs/guides/ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md) · [`docs/architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md`](../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md) · [`docs/architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](../architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) · [`memory-bank/adminProductContext.md`](../../memory-bank/adminProductContext.md)

---

## 1. Executive summary

Admin Portal is Vssyl's **platform-operator control plane** — a hybrid of operational command tooling and governance surfaces for modules, AI, marketplace participation, billing, security, and platform configuration. It is **not** an installable product module.

**Bottom line:** Admin Portal is **mature enough to serve as the day-to-day operational control center** for platform operators on core domains (users, modules, AI pipeline, billing, security). It is **conditionally ready** as the **single governance hub** for newly certified platform capabilities (Search Delegate, Workspace Bridge, Activity Ingest, partner billing) — probes and readiness cards exist, but aggregate operator workflows and cross-capability dashboards remain incomplete.

| Dimension | Posture | Confidence |
|-----------|---------|------------|
| Exists and is used | **Confirmed** | High — 41 pages, 148+ canonical API handlers |
| Prior control-plane certification | **LEVEL 3 CERTIFIED** (2026-06-18) | High — ledger + council ratification |
| Operational control center readiness | **~78%** | Medium — strong subsystems; satellite fragmentation |
| Platform governance center readiness | **~72%** | Medium — module gate strong; cross-program IA gaps |
| Marketplace governance completeness | **~85%** (pilot cohort) | High — readiness card + four probes wired |
| Own certification program warranted | **Yes — as control-plane recertification**, not module L3 | See Executive Summary |

---

## 2. What Admin Portal is today

### 2.1 Classification

| Attribute | Value | Evidence |
|-----------|-------|----------|
| Product classification | **Platform Control Plane + Governance Surface** | [`ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md), `memory-bank/adminProductContext.md` |
| Installable module | **No** — must not appear in `coreModuleRegistry` | Stage 0B-B registry cleanup |
| Canonical entry | `/admin-portal` → `/admin-portal/dashboard` | `web/src/app/admin-portal/page.tsx` |
| Frontend gate | Next.js middleware + layout `ADMIN` role check | `web/src/middleware.ts`, `layout.tsx` |
| Backend canonical API | `/api/admin-portal/*` | `server/src/routes/admin-portal.ts` |
| Shell pattern | Custom operator sidebar (intentional PlatformShell exception) | `web/src/app/admin-portal/layout.tsx` |
| Ledger status | **LEVEL 3 CERTIFIED** — Control Plane Reference With Findings | [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md) |

### 2.2 Scale (re-verified 2026-06-24)

| Layer | Count | Notes |
|-------|------:|-------|
| Frontend pages (`/admin-portal/*`) | **41** | 31 non-pipeline + 10 AI Pipeline sub-pages |
| Sidebar-navigated surfaces | **22** | 6 sections in `layout.tsx` (+ debug-gated Testing) |
| Orphan / hub-only pages | **12** | AI satellites, debug, ops tools |
| `admin-portal` components | **42** | Includes 32 AI Pipeline components |
| Legacy `admin` components | **4** | Marketplace readiness, certification panel |
| Canonical API handlers | **148** | 4 domain route files + 7 security sub-mount |
| Satellite / emergency / debug mounts | **21 prefixes** | See Satellite Mount Map |
| Domain services (`server/src/services/admin/`) | **14** | Decomposed from prior monolith |
| `adminService.ts` facade | **706 LOC** | Delegates to domain services (AP-F-004 closed) |
| `adminApiService.ts` client | **1,996 LOC** | Primary `/api/admin-portal` + satellite calls |
| Backend integration tests | **18+** files | `server/src/routes/__tests__/admin-portal*.ts` |
| Frontend tests | **13** files | Static/hygiene + limited page smoke |

---

## 3. Admin Portal inventory

### 3.1 Frontend pages — sidebar-navigated (authoritative)

| Section | Path | Primary function | Backend domain |
|---------|------|------------------|----------------|
| **Operations** | | | |
| Overview | `/admin-portal/dashboard` | Platform stats, recent activity | core |
| User Management | `/admin-portal/users` | Search, ban, reset, role view | core |
| Content Moderation | `/admin-portal/moderation` | Report queue, bulk actions | core / analyticsOps |
| Support | `/admin-portal/support` | Ticket queue, knowledge base | platform |
| **Commercial** | | | |
| Financial Management | `/admin-portal/billing` | Subscriptions, Stripe sync, payouts | analyticsOps |
| Pricing Management | `/admin-portal/pricing` | Tier and query-pack pricing | `/api/pricing` satellite |
| **AI** | | | |
| AI System | `/admin-portal/ai-system` | Launcher hub for AI subsystems | multiple satellites |
| AI Pipeline | `/admin-portal/ai-pipeline` | Retrieval, grounding, diagnostics, test lab | aiPipeline |
| **Platform** | | | |
| Platform Analytics | `/admin-portal/analytics` | System/technical observability | analyticsOps |
| Performance & Scalability | `/admin-portal/performance` | Load, alerts, optimization | platform |
| Security & Compliance | `/admin-portal/security` | Events, audit, compliance export | analyticsOps + security sub-mount |
| Governance | `/admin-portal/governance` | Policy/governance dashboard | platform component |
| Data Retention | `/admin-portal/retention` | Retention policy management | platform component |
| System Logs | `/admin-portal/system-logs` | Application log viewer | `/api/admin/logs` satellite |
| System Administration | `/admin-portal/system` | Config, health, backup, migrations | platform / analyticsOps |
| **Developer & Modules** | | | |
| Developer Management | `/admin-portal/developers` | Developer stats, oversight | analyticsOps |
| Modules | `/admin-portal/modules` | **Canonical** module governance + certification | analyticsOps + module AI satellite |
| **Admin Labs** | | | |
| Admin Overrides | `/admin-portal/overrides` | Role/tier overrides | `/api/admin-override` satellite |
| Testing & Debug | `/admin-portal/testing` | Test runner (debug-gated) | `/api/admin-portal/testing` |
| Impersonation Lab | `/admin-portal/impersonate` | User/business impersonation | core |

### 3.2 Frontend pages — AI Pipeline sub-tree (10)

| Path | Function |
|------|----------|
| `/admin-portal/ai-pipeline` | Operations hub, health, provider governance |
| `.../intents` | Intent catalog registry |
| `.../grounding` | Grounding rules |
| `.../sources` | Context sources (Context Graph instrumentation) |
| `.../tools` | Tool policies |
| `.../diagnostics` | Trace forensics, retrieval evidence |
| `.../test-lab` | Dry-run + evaluation |
| `.../quality` | Enforcement stats |
| `.../audit` | Policy audit log |
| `.../compliance` | Retention, export, purge |

### 3.3 Frontend pages — orphan / hub / debug

| Path | Classification | Discovery |
|------|----------------|-----------|
| `/admin-portal/business-intelligence` | implemented | AI System hub card (not sidebar) |
| `/admin-portal/business-ai` | implemented | AI System hub card |
| `/admin-portal/ai-context` | legacy duplicate | AI System hub; merge target for diagnostics |
| `/admin-portal/ai-learning` | deprecated | Redirects toward AI Pipeline |
| `/admin-portal/seed-modules` | ops tool | Direct URL only |
| `/admin-portal/debug-auth`, `debug-session`, `test-api`, `test-auth`, `test-impersonation`, `impersonation-test` | debug | Direct URL; env-gated where applicable |
| `/admin/*` (2 pages) | legacy | Redirect / dead — do not extend |
| `/modules/admin` | legacy handoff | Redirects to `/admin-portal/modules` |

### 3.4 Backend API domains — canonical `/api/admin-portal`

| Domain file | Handlers | Primary responsibilities |
|-------------|:--------:|--------------------------|
| `adminPortalRoutes.core.ts` | 16 | Dashboard, users, moderation, impersonation |
| `adminPortalRoutes.analyticsOps.ts` | 49 | Analytics, billing, security events, **module governance + marketplace probes** |
| `adminPortalRoutes.platform.ts` | 38 | BI, support, system, database, integrations |
| `adminPortalRoutes.aiPipeline.ts` | 45 | AI pipeline catalog, policies, traces, compliance |
| `adminSecurityRoutes.ts` (sub-mount) | 7 | Module security monitoring |
| **Total canonical** | **155** | Per-route JWT + `requireAdmin` (probe routes use inline check) |

### 3.5 Domain services — `server/src/services/admin/`

| Service | Responsibility |
|---------|----------------|
| `adminUserService` | User listing, status, password reset |
| `adminImpersonationService` | Impersonation sessions, business seed |
| `adminModerationService` | Content reports, moderation rules |
| `adminModuleGovernanceService` | Submissions, certification, promote/rollback |
| `adminSecurityService` | Security events, compliance metrics |
| `adminBillingService` | Subscriptions, Stripe sync, payouts |
| `adminSupportService` | Tickets, knowledge base, live chat ops |
| `adminAnalyticsService` | Platform analytics, BI payloads |
| `adminPerformanceService` | Performance metrics, alerts |
| `adminSystemOpsService` | System config, health, backup, migrations |
| `adminAuditService` + `adminAuditTaxonomy` | Admin audit emission taxonomy |
| `adminAiPipelineDiagnosticsService` | Pipeline-specific diagnostics helpers |
| `adminServiceContracts.ts` | Shared DTO contracts |

### 3.6 Diagnostics and governance functions

| Function | Surface | Maturity |
|----------|---------|----------|
| AI Pipeline trace forensics | `/ai-pipeline/diagnostics` | **Production-grade** |
| Context provider health | AI Pipeline hub panels | **Implemented** |
| Retrieval evidence viewer | Pipeline trace detail | **Implemented** |
| Module certification validator | `/modules` submission detail | **Production-grade** (v1.4.0 gates) |
| Marketplace readiness card | `/modules` per-module | **Implemented** (pilot-complete) |
| Search Delegate probe | API + readiness card button | **Implemented** |
| Workspace Bridge probe | API + readiness card button | **Implemented** |
| Activity Ingest probe | API + readiness card button | **Implemented** |
| Business billing probe | API + readiness card button | **Implemented** |
| Sandbox pilot manifest snapshots | Probe routes (internal pilot) | **Pilot-only** |
| Module AI context status | `/modules` AI Context tab | **Implemented** |
| Provider usage / expenses | AI System + dedicated views | **Implemented** (satellite `/api/admin/ai-providers`) |
| System health / logs | system, system-logs | **Partial** — some synthetic metrics remain |
| Debug test runner | `/testing` (gated) | **Debug-only** |

### 3.7 Certification tooling

| Tool | Location | Notes |
|------|----------|-------|
| `ModuleCertificationReviewPanel` | modules submission modal | Checklist, validator version, pass/warn/fail |
| `MarketplaceReadinessCard` | modules submission modal | Scope, four delegate capabilities, probe buttons |
| Version promote/rollback gates | `adminModuleGovernanceService` | Blocks on certification mismatch |
| Smart artifact scan summary | modules list/detail | Scan verdict badge |
| AI context provider test | modules AI Context tab | Live provider endpoint test |

---

## 4. Maturity by subsystem

| Subsystem | Maturity | Evidence |
|-----------|----------|----------|
| User administration | **L3** | Integration tests, live API |
| Impersonation | **L3** | Audit trail, business seed, tests |
| Module governance gate | **L3** | Certification gate service tests |
| Marketplace probes (pilot) | **L3 CwF** | Four probes + readiness service |
| AI Pipeline admin | **L3** | 45 handlers, 10 pages, pipeline services |
| Billing / Stripe sync | **L3** | Live Stripe integration |
| Platform analytics (operator) | **L3 CwF** | Live data; overlaps with BI |
| Security events | **L2–L3** | Duplicate route history resolved in 1B |
| Support | **L2–L3** | Live API; large page (2,100+ LOC) |
| System health | **L2** | Some non-live health signals |
| Cross-capability governance dashboard | **L1** | No unified Search/Retrieval/Context Graph ops view |
| Satellite mount consolidation | **L1** | 21 prefixes documented; not migrated |
| Frontend test pyramid | **L2** | Backend strong; frontend smoke partial |

---

## 5. Evidence confidence

| Label | Meaning |
|-------|---------|
| **Confirmed** | Direct file, route, mount, or test evidence |
| **Inferred** | Structural conclusion from multiple artifacts |
| **UNKNOWN** | Requires runtime/browser verification |

Runtime browser smoke, production telemetry review, and operator workflow timing were **not** executed in this phase.

---

## 6. Key findings (Phase 0A)

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| AP0A-F01 | No unified operator dashboard for Search / Retrieval / Context Graph platform programs | Major | Open |
| AP0A-F02 | 21 satellite API mounts remain — operator client calls multiple prefixes | Major | Open (documented) |
| AP0A-F03 | Marketplace probe results not persisted in UI history | Advisory | Open |
| AP0A-F04 | AI Context tab does not surface delegate readiness (AP-G09) | Advisory | Open |
| AP0A-F05 | Probe routes use inline ADMIN check vs shared middleware | Advisory | Open |
| AP0A-F06 | 12 orphan/debug pages in production tree | Advisory | Mitigated by env gates |
| AP0A-F07 | `modules/page.tsx` ~2,100 LOC — governance UI monolith | Advisory | Open |
| AP0A-F08 | No aggregate sandbox pilot dashboard (AP-G08) | Advisory | Open |

**Closed since prior June 2026 audit:** AdminService monolith (decomposed), mock fallbacks on support/modules, unauthenticated support route, dangerous migration ops gating, phantom `admin` moduleId, G9 UX shell gaps.

---

## 7. Readiness verdict

| Question | Answer |
|----------|--------|
| Is Admin Portal real and substantial? | **Yes** — 41 pages, 155 canonical ops, 14 domain services |
| Can it operate day-to-day platform admin? | **Yes** — users, billing, modules, AI pipeline, security |
| Is it the governance hub for new platform capabilities? | **Partially** — marketplace probes exist; cross-program operator IA incomplete |
| Is it certified? | **Yes** — LEVEL 3 CERTIFIED control plane (2026-06-18) |
| Does it need a fresh certification wave? | **Yes** — recertification against expanded platform scope (see Executive Summary) |

---

**Last updated:** 2026-06-24 (Phase 0A discovery)
