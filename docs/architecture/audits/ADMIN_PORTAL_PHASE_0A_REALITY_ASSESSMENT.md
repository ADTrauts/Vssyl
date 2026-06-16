# Admin Portal Phase 0A — Reality Assessment

**Status:** **Complete** — discovery and planning only  
**Date:** 2026-06-14  
**Wave:** Admin Portal **0A** — Reality Assessment  
**Constraint:** No code changes. No modernization. No certification. No implementation.

> **Excluded from this audit:** Architecture Reference Program, UX Reference Program, Reference Workspace Program, Relationship Framework Program, Drive/Notifications/Todo/AI Experience/Calendar/Place UX certification waves, Business Workspace / Personal Dashboard certification, and Business Operations audits (handled separately).

---

## Required report

| # | Question | Answer |
|---|----------|--------|
| 1 | What is the Admin Portal? | **E — Hybrid** (Platform Control Plane + Platform Governance Surface). Not a product module or certified workspace. See §10. |
| 2 | Surface inventory summary | **39** frontend pages · **~144** `/api/admin-portal` handlers · **13+** fragmented `/api/admin*` mounts · See §2 |
| 3 | Ownership matrix | §3 |
| 4 | Architecture posture | **Mixed** — strong admin auth on most paths; weak platform contract alignment. See §4 |
| 5 | UX posture | **Below UX Reference baseline** — custom shell; AI Pipeline sub-area most consistent. See §5 |
| 6 | AI admin maturity | **AI Pipeline: implemented** · Learning/BI/Context: partial · Centralized-ai: admin-gated scaffold. See §6 |
| 7 | Analytics boundary | **Duplicated / unclear** across admin, AI, and product module surfaces. See §7 |
| 8 | Compliance / diagnostics | **Partial** — APIs exist; production readiness varies; dev surfaces abundant. See §8 |
| 9 | Technical debt (ranked) | **4 P0 · 6 P1 · 8 P2 · 7 P3** — See §9 |
| 10 | Strategic recommendation | **E — Hybrid** with explicit decomposition. See §10 |
| 11 | Recommended follow-up phases | **0B–1B** sequenced in §11 |

---

## 0. Scope and method

### 0.1 What was investigated

Repository evidence only: frontend routes under `web/src/app/admin-portal/**`, adjacent admin trees, backend mounts in `server/src/index.ts`, route files under `server/src/routes/admin-portal/**`, `adminService.ts`, `adminApiService.ts`, prior admin boundary audits, and automated greps for mock/stub markers and UX pattern usage.

### 0.2 What was not done

- No runtime smoke tests (pages not loaded in browser)
- No certification scoring (WS-L*, UX-L*, module L*)
- No modernization implementation
- No re-audit of excluded programs listed above

### 0.3 Evidence confidence

| Label | Meaning |
|-------|---------|
| **Confirmed** | Direct file/route/mount evidence |
| **Inferred** | Structural conclusion from multiple artifacts |
| **UNKNOWN** | Requires runtime verification |

---

## 1. Executive summary

The Admin Portal is a **platform-operator surface** at `/admin-portal` with a **custom admin shell** (not `PlatformShell`), gated by `session.user.role === 'ADMIN'` on the frontend and `requireAdmin` on most backend routes.

**Confirmed facts:**

1. **Scale:** 39 Next.js pages, 43 dedicated components, ~5,861 LOC across four `/api/admin-portal` route files, plus a **4,658-line** `AdminService` monolith and **1,998-line** `adminApiService.ts` client.
2. **API fragmentation:** Admin capabilities are spread across **13+ mount prefixes** (`/api/admin-portal`, `/api/admin`, `/api/centralized-ai`, `/api/admin/business-ai`, `/api/admin/ai-providers`, `/api/ai-context-debug`, `/api/admin-override`, `/api/admin/logs`, `/api/admin/seed`, emergency HR ops mounts, etc.).
3. **AI Pipeline** is the most mature, documented admin subsystem (phases 1–5 per `AI_PIPELINE_ADMIN_TOOLS.md`), with hub + 9 subpages and **45** dedicated API handlers.
4. **Navigation drift:** Authoritative nav lives inline in `layout.tsx`; `AdminNavigation.tsx` is a **duplicate, unused** nav definition with different items.
5. **Phantom module:** `moduleId: admin` exists in `coreModuleRegistry.ts` with **`routes: []`** and is **not** registered in `registerBuiltInModules.ts`.
6. **Mock/stub fallbacks** remain on `support`, `modules`, and sections of `ai-learning` despite Memory Bank claims of full production readiness (`adminProductContext.md`).

**Strategic classification (evidence-based):** **E — Hybrid** comprising:

- **Platform Control Plane** (~60% of mature surfaces): AI Pipeline, system/diagnostics, provider usage, pricing, database ops, impersonation
- **Platform Governance Surface** (~25%): module submission review, moderation, certification tooling fragments
- **Legacy / ops debris** (~15%): debug pages, duplicate routes, dead `/admin/*` pages behind redirect

---

## 2. Surface inventory

### 2.1 Frontend route inventory (`/admin-portal`)

**Total pages:** 39 (`page.tsx` files)

#### 2.1.1 Nav-linked surfaces (authoritative: `web/src/app/admin-portal/layout.tsx`)

| Segment | Path | Classification | API wiring | Notes |
|---------|------|----------------|------------|-------|
| Overview | `/admin-portal/dashboard` | **partial** | `getDashboardStats`, `getRecentActivity` | Stats real; alerts empty on API failure (no mock) |
| User Management | `/admin-portal/users` | **implemented** | `/api/admin-portal/users/*` | Integration tests exist |
| Content Moderation | `/admin-portal/moderation` | **implemented** | `/api/admin-portal/moderation/*` | Integration tests exist |
| Support | `/admin-portal/support` | **partial** | `/api/admin-portal/support/*` | **Mock fallback** on API error (line 189) |
| Financial Management | `/admin-portal/billing` | **implemented** | `/api/admin-portal/billing/*` | Stripe sync endpoints |
| Pricing Management | `/admin-portal/pricing` | **implemented** | `/api/pricing/*` (admin writes) | Separate mount from admin-portal |
| AI System | `/admin-portal/ai-system` | **partial** | Multiple: BI, centralized-ai, business-ai | Hub with cross-links to orphan pages |
| AI Pipeline | `/admin-portal/ai-pipeline` | **implemented** | `/api/admin-portal/ai-pipeline/*` | Operations hub; most mature area |
| Business Intelligence | `/admin-portal/business-intelligence` | **partial** | `/api/admin-portal/business-intelligence/*` | Empty-on-failure (mock removed) |
| Platform Analytics | `/admin-portal/analytics` | **implemented** | `/api/admin-portal/analytics/*` | Integration test exists |
| Performance | `/admin-portal/performance` | **partial** | `/api/admin-portal/performance/*` | Empty-on-failure |
| Security & Compliance | `/admin-portal/security` | **partial** | `/api/admin-portal/security/*` | Wired; data may be sparse in dev |
| System Logs | `/admin-portal/system-logs` | **partial** | `/api/admin/logs` | Separate mount |
| System Administration | `/admin-portal/system` | **implemented** | `/api/admin-portal/system/*` | Config, backup, maintenance |
| Developer Management | `/admin-portal/developers` | **implemented** | `getDeveloperStats`, payouts | API-first; no mock fallback in code |
| Modules | `/admin-portal/modules` | **partial** | `/api/admin-portal/modules/*` + `/api/admin/modules/ai/*` | **Mock fallback** on error (line 287) |
| Admin Overrides | `/admin-portal/overrides` | **implemented** | `/api/admin-override/*` | Tier/admin grant overrides |
| Testing & Debug | `/admin-portal/testing` | **partial** | `/api/admin-portal/testing/*` | Server-side test runner — **UNKNOWN** production safety |
| Impersonation Lab | `/admin-portal/impersonate` | **partial** | `/api/admin-portal/impersonation/*` | Custom confirm modal; impersonation tests exist; runtime UX **UNKNOWN** |

#### 2.1.2 AI Pipeline subpages (hub-linked via `PipelineHubToolSections.tsx`)

| Segment | Path | Classification | Notes |
|---------|------|----------------|-------|
| Response Diagnostics | `/admin-portal/ai-pipeline/diagnostics` | **implemented** | Uses `PipelineSubpageShell` |
| AI Test Lab | `/admin-portal/ai-pipeline/test-lab` | **implemented** | Dry-run twin path |
| Intent Catalog | `/admin-portal/ai-pipeline/intents` | **implemented** | Policy CRUD |
| Grounding Rules | `/admin-portal/ai-pipeline/grounding` | **implemented** | Policy CRUD |
| Context Sources | `/admin-portal/ai-pipeline/sources` | **implemented** | Includes V_Link source |
| Tool Policies | `/admin-portal/ai-pipeline/tools` | **implemented** | Policy CRUD |
| Quality & Enforcement | `/admin-portal/ai-pipeline/quality` | **implemented** | Quality stats API |
| Policy Audit Log | `/admin-portal/ai-pipeline/audit` | **implemented** | Policy change history |
| Compliance & Export | `/admin-portal/ai-pipeline/compliance` | **partial** | Retention/export — runtime **UNKNOWN** |

#### 2.1.3 Orphan / secondary pages (not in layout nav)

| Segment | Path | Classification | Nav entry | Notes |
|---------|------|----------------|-----------|-------|
| AI Learning | `/admin-portal/ai-learning` | **partial** | Linked from AI System | **"Data coming soon"** stubs (lines 978–1011); module analytics stub |
| AI Context Debug | `/admin-portal/ai-context` | **partial** | Linked from AI System + Pipeline hub | Uses `/api/ai-context-debug/*` |
| Business AI Global | `/admin-portal/business-ai` | **partial** | Linked from AI System | `/api/admin/business-ai` |
| Seed Modules | `/admin-portal/seed-modules` | **partial** | None | Ops tool; `window.confirm` not `ConfirmModal` |
| Debug Auth | `/admin-portal/debug-auth` | **abandoned** | None | Dev auth probe |
| Debug Session | `/admin-portal/debug-session` | **abandoned** | None | Dev session probe |
| Test API | `/admin-portal/test-api` | **abandoned** | None | Hits `/api/admin-portal/test` |
| Test Auth | `/admin-portal/test-auth` | **abandoned** | None | Dev page |
| Test Impersonation | `/admin-portal/test-impersonation` | **abandoned** | In unused `AdminNavigation.tsx` only | Mock developer preview |
| Impersonation Test | `/admin-portal/impersonation-test` | **duplicate** | None | Third impersonation variant |
| Root redirect | `/admin-portal` | **implemented** | — | Redirects to dashboard |

#### 2.1.4 Classification summary

| Class | Count | Examples |
|-------|------:|----------|
| **implemented** | 18 | users, moderation, billing, pricing, ai-pipeline core, pipeline subpages (8), developers, overrides, dashboard stats |
| **partial** | 14 | support, modules, ai-system, ai-learning, ai-context, business-ai, BI, performance, security, system-logs, impersonate, testing, compliance export |
| **stub** | 1 | ai-learning module analytics section |
| **legacy** | 2 | `/admin/governance`, `/admin/retention` (unreachable — see §2.3) |
| **duplicate** | 3 | `/modules/admin`, impersonation-test pages, `/api/admin-portal/security/events` (dup route) |
| **abandoned** | 5 | debug-auth, debug-session, test-api, test-auth, test-impersonation |
| **unknown** | 0 | — |

### 2.2 Adjacent admin surfaces (boundary only — not Admin Portal owned)

| Tree | Pages | Owner | Relationship to Admin Portal |
|------|------:|-------|------------------------------|
| `/admin/*` | 2 (+ layout) | **Legacy / unknown** | Layout **unconditionally redirects** to `/admin-portal` — children never render |
| `/modules/admin` | 1 | **Duplicate governance** | Parallel module submission UI with mock fallback |
| `/business/[id]/admin/*` | 7 | **Business Workspace / HR / Scheduling** | Tenant-scoped business admin — not platform admin |
| `web/src/components/admin/*` | 2 | **Platform fragments** | `SecurityDashboard`, `ModuleCertificationReviewPanel` — usage **UNKNOWN** outside portal |

### 2.3 Legacy `/admin` tree

**Confirmed:** `web/src/app/admin/layout.tsx` checks ADMIN role then **`redirect('/admin-portal')`** without rendering children. Pages at `/admin/governance` and `/admin/retention` import `GovernanceManagementDashboard` and `RetentionManagementDashboard` but are **unreachable** through normal navigation.

**Classification:** **legacy / dead** unless direct URL bypasses layout behavior (Next.js layout still runs — redirect fires).

### 2.4 Backend API inventory

#### 2.4.1 Primary mount: `/api/admin-portal` (~144 handlers)

| File | Handlers | Domain |
|------|----------:|--------|
| `adminPortalRoutes.core.ts` | 16 | Dashboard, users, impersonation, moderation reports |
| `adminPortalRoutes.analyticsOps.ts` | 45 | Analytics, billing, security, system, moderation ops, modules |
| `adminPortalRoutes.platform.ts` | 38 | BI, support, performance, database ops, integrations |
| `adminPortalRoutes.aiPipeline.ts` | 45 | Pipeline catalog, policies, diagnostics, test-lab, compliance |
| `adminSecurityRoutes.ts` (sub-mount `/security`) | 7 | Module security monitoring |

**Confirmed duplicate route:** `GET /security/events` registered **twice** in `adminPortalRoutes.analyticsOps.ts` (lines 452 and 528).

**Confirmed unauthenticated route:** `POST /support/tickets/customer` in `adminPortalRoutes.platform.ts` (line 653) — **no** `authenticateJWT` or `requireAdmin`. Intentional public customer endpoint or auth gap — **UNKNOWN** without product intent doc.

#### 2.4.2 Fragmented `/api/admin*` and related mounts (`server/src/index.ts`)

| Mount | Auth pattern | Owner | Primary surfaces |
|-------|--------------|-------|------------------|
| `/api/admin` | Per-route `requireAdmin` | Admin Portal (parallel) | Block IDs, user location, audit logs |
| `/api/admin-portal` | Per-route `requireAdmin` | **Admin Portal (canonical)** | Main admin API |
| `/api/admin-portal/testing` | `requireAdmin` | Admin Portal (dev) | Test runner, coverage |
| `/api/admin/ai-providers` | Per-route `requireAdmin` | AI Platform | Provider usage/expenses |
| `/api/admin/business-ai` | **UNKNOWN** (not verified per-route) | AI Platform | Business AI global |
| `/api/centralized-ai` | **Mount-level** `requireAdmin` | AI Platform | ~95 admin scaffold handlers |
| `/api/ai-context-debug` | Per-route `requireAdmin` | AI Platform | Context inspection |
| `/api/admin-override` | Per-route `requireAdmin` | Admin Portal | Tier/admin overrides |
| `/api/admin/logs` | `authenticateJWT` (role check **UNKNOWN**) | Platform service | Application logs |
| `/api/admin/seed` | `authenticateJWT` | Platform ops | Module seeding |
| `/api/admin-setup` | Secret-gated conditional | Platform ops | Initial admin setup |
| `/api/admin/hr-setup` | `authenticateJWT` | HR module (emergency) | HR seeding |
| `/api/admin/fix-hr` | `authenticateJWT` | HR module (emergency) | Raw DB HR fixes |
| `/api/admin/create-hr-tables` | `authenticateJWT` | HR module (emergency) | SQL table creation |
| `/api/admin/fix-subscriptions` | `authenticateJWT` | Billing (emergency) | Schema fixes |
| `/api/pricing` | Public read; admin write | Commercial | Pricing CRUD |
| `/api/admin/modules/ai/*` | `requireRole('ADMIN')` via `moduleAIContext.ts` | AI Platform + governance | Module AI registry |

**Confirmed:** Four separate `requireAdmin` implementations: `adminPortalShared.ts`, `admin.ts`, `pricing.ts`, `ai-provider-usage.ts`.

#### 2.4.3 Service and client layer

| Artifact | LOC | Role |
|----------|----:|------|
| `server/src/services/adminService.ts` | 4,658 | Monolithic admin business logic (~60+ static methods) |
| `web/src/lib/adminApiService.ts` | 1,998 | Frontend API client (~80+ methods) |

**Confirmed:** Extensive **direct `prisma.*` calls** in route files (e.g. `adminPortalRoutes.core.ts` dashboard stats, impersonation seeding) bypassing `AdminService` — fat controllers.

### 2.5 Required domain coverage

| Domain | Admin Portal surfaces | Classification | Owner |
|--------|----------------------|----------------|-------|
| **User administration** | users, overrides, impersonate | implemented / partial | Admin Portal |
| **Business administration** | overrides (tier), impersonation business seed | partial | Admin Portal (platform-global) |
| **Module management** | modules, developers, seed-modules | partial | Admin Portal + governance |
| **AI administration** | ai-system, ai-pipeline/**, ai-learning, ai-context, business-ai | mixed | AI Platform (portal hosts UI) |
| **Provider management** | pricing, ProviderUsageView, `/api/admin/ai-providers` | implemented | AI Platform + Commercial |
| **Analytics** | analytics, business-intelligence, ai-system charts | partial / duplicated | Admin Portal (see §7) |
| **Diagnostics** | ai-pipeline/diagnostics, system-logs, performance, testing | mixed | Admin Portal + Platform |
| **Compliance** | security, ai-pipeline/compliance, audit logs | partial | Admin Portal |
| **Feature flags** | system/config, overrides, pipeline policies | partial | Platform (no dedicated UI) |
| **Platform settings** | system, pricing | implemented | Admin Portal |
| **Audit tools** | security audit-logs, ai-pipeline/audit, `/api/admin` audit routes | partial | Platform service |
| **Security tooling** | security page, adminSecurityRoutes, SecurityDashboard component | partial | Platform service |

---

## 3. Ownership assessment

### 3.1 Ownership matrix (selected surfaces)

| Surface | Route / API | Owner | Co-owner | Tenant scope | Admin only |
|---------|-------------|-------|----------|--------------|------------|
| Admin shell + nav | `/admin-portal/layout.tsx` | **Admin Portal** | — | Platform-global | ✅ |
| User CRUD + status | `/api/admin-portal/users` | **Admin Portal** | — | Platform-global | ✅ |
| Impersonation | `/api/admin-portal/impersonation/*` | **Admin Portal** | Platform auth | Cross-tenant | ✅ |
| Module submissions | `/api/admin-portal/modules/submissions` | **Admin Portal** | Module governance | Platform-global | ✅ |
| Module AI registry | `/api/admin/modules/ai/*` | **AI Platform** | Admin Portal UI | Platform-global | ✅ |
| AI Pipeline ops | `/api/admin-portal/ai-pipeline/*` | **AI Platform** | Admin Portal UI | Platform-global | ✅ |
| Centralized AI scaffold | `/api/centralized-ai/*` | **AI Platform** | — | Platform-global | ✅ (mount) |
| Context debug | `/api/ai-context-debug/*` | **AI Platform** | — | Per-user inspect | ✅ |
| Business AI global | `/api/admin/business-ai` | **AI Platform** | — | Cross-business | ✅ |
| Provider usage | `/api/admin/ai-providers` | **AI Platform** | External providers | Platform-global | ✅ |
| Product analytics | `/analytics` (workspace) | **Product module** | — | Tenant-scoped | ❌ |
| HR admin | `/business/[id]/admin/hr/*` | **HR module** | Business Workspace | Business-scoped | Business admin |
| Place analytics provider | `/api/place/ai/context/analytics` | **Place module** | — | User-scoped | ❌ |
| Emergency HR SQL | `/api/admin/fix-hr` etc. | **Platform ops** | HR module | Platform-global | ✅ |
| Phantom `admin` moduleId | `coreModuleRegistry.ts` | **Unknown** | — | — | — |

### 3.2 Ownership conflicts

| ID | Conflict | Evidence | Severity |
|----|----------|----------|----------|
| OC-1 | **Module admin duplication** | `/admin-portal/modules` vs `/modules/admin` — both review submissions; latter has mock fallback | P1 |
| OC-2 | **Analytics triplication** | Platform Analytics + BI + AI System charts vs product `analytics` module vs AI learning analytics | P1 |
| OC-3 | **AI learning dual path** | `/admin-portal/ai-learning` + `/api/centralized-ai/*` + user `/api/ai/learning/*` | P1 |
| OC-4 | **API mount sprawl** | 13+ admin-related prefixes; four `requireAdmin` implementations | P2 |
| OC-5 | **Phantom admin moduleId** | Registry entry with empty routes; not in `registerBuiltInModules.ts`; `config/modules.ts` points to `/admin` (redirects) | P1 |
| OC-6 | **Nav source duplication** | `layout.tsx` inline nav vs unused `AdminNavigation.tsx` (missing ai-pipeline; has test-impersonation) | P2 |
| OC-7 | **Impersonation surface triplication** | `impersonate`, `impersonation-test`, `test-impersonation` | P2 |
| OC-8 | **Emergency ops outside portal** | HR/subscription SQL fixes on `/api/admin/fix-*` not surfaced in portal nav | P2 |

---

## 4. Architecture assessment

Scored against `VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` and module interoperability contract. **No certification awarded.**

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Entity Registry** | **NOT PRESENT** | No admin routes reference platform entity registry patterns |
| **Policy Engine** | **NOT PRESENT** | `rg policyEngine emitModuleActivity` in `admin-portal/` — zero matches |
| **Activity logging** | **PASS WITH FINDINGS** | `AuditLog` used (impersonation, dashboard activity); not normalized `emitModuleActivityEvent` envelope |
| **Notifications** | **NOT PRESENT** | No admin-specific notification types in portal flows |
| **V_Link** | **PASS WITH FINDINGS** | AI Pipeline sources include V_Link; grounding via `vlinkPipelineContextService` (per `activeContext.md`, `AI_PIPELINE_ADMIN_TOOLS.md`) — owned by AI Platform, instrumented in portal |
| **Global Trash** | **NOT PRESENT** | Admin deletes appear hard-operational, not trash-mediated |
| **Realtime** | **UNKNOWN** | `RealTimeContextMonitor.tsx` exists; socket usage in admin pages not verified at runtime |
| **Domain events** | **NOT PRESENT** | No domain event emission in admin route files |
| **Service extraction** | **FAIL** | 4,658-line `AdminService` + extensive inline Prisma in routes (impersonation business seed writes tiers, positions, members directly in `adminPortalRoutes.core.ts`) |
| **Controller thinness** | **FAIL** | Route files 1,292–1,864 LOC; dashboard stats and impersonation logic inline |
| **Tenant isolation** | **PASS WITH FINDINGS** | Admin surfaces are platform-global by design; impersonation crosses tenants intentionally — leak risk **UNKNOWN** without runtime test |
| **Admin authorization** | **PASS WITH FINDINGS** | Most routes use `authenticateJWT` + `requireAdmin`; `/api/centralized-ai` mount-level gate (Wave 1D); exceptions: `POST /support/tickets/customer` (no auth), `/api/admin/logs` auth depth **UNKNOWN** |

### 4.1 Admin authorization detail

**Confirmed improvements (prior wave, not re-audited):** AI Platform Wave 1D fenced `/api/centralized-ai` with mount-level `requireAdmin` (`AI_PLATFORM_WAVE_1D_ADMIN_DIAGNOSTICS_CLOSEOUT.md`).

**Confirmed gaps:**

- Duplicate `requireAdmin` implementations increase drift risk
- Raw SQL migration repair endpoints in `adminPortalRoutes.platform.ts` (`/database/migrations/delete`, `reset-baseline`) — high-privilege control-plane ops
- `seed-modules/page.tsx` uses native `confirm()` and direct `fetch` to `/api/admin/seed/seed-core-modules`

---

## 5. UX assessment

Scored against `UX_REFERENCE_PATTERN_CATALOG.md` (Wave 6A). Admin portal was **not** included in PlatformShell or ConfirmModal modernization waves.

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **PlatformShell usage** | **NOT PRESENT** | Custom shell in `layout.tsx` — dark sidebar, gray-900 header |
| **Navigation consistency** | **FAIL** | Inline nav in layout; unused `AdminNavigation.tsx` differs; orphan pages only linked from hubs |
| **PageHeader / PageToolbar** | **NOT PRESENT** | Custom `<h1>` headers per page; no shared `PageHeader` / `PageToolbar` |
| **Portal shell consistency** | **PASS WITH FINDINGS** | `PipelineSubpageShell` + `PipelineOperationsHub` header pattern in AI Pipeline only |
| **EmptyState usage** | **FAIL** | No shared `EmptyState` imports in admin-portal pages; inline empty divs |
| **ConfirmModal usage** | **FAIL** | `impersonate/page.tsx` uses custom modal; `seed-modules` uses `window.confirm` |
| **Destructive workflows** | **UNKNOWN** | Ban/suspend, migration delete, policy purge — confirm pattern not verified at runtime |
| **Loading states** | **PASS WITH FINDINGS** | `Spinner`, loading booleans common; inconsistent across pages |
| **Error states** | **PASS WITH FINDINGS** | `Alert`, `adminApiService` error handling; some pages fall back to mock |
| **Mobile behavior** | **UNKNOWN** | Sidebar collapse exists; 375px behavior not tested |
| **Accessibility** | **UNKNOWN** | `PipelineSubpageShell` has `aria-label` on back link; broader a11y not assessed |
| **Dark mode** | **PASS WITH FINDINGS** | Widespread `dark:` classes; uses `gray-*` not `v-*` design tokens |
| **Dashboard consistency** | **FAIL** | Heterogeneous card/chart patterns across dashboard, analytics, BI, ai-system |

### 5.1 Shell and navigation drift (confirmed)

| Item | `layout.tsx` (active) | `AdminNavigation.tsx` (unused) |
|------|----------------------|----------------------------------|
| AI Pipeline nav item | ✅ | ❌ missing |
| test-impersonation nav item | ❌ | ✅ |
| Impersonate path | `/admin-portal/impersonate` | `/admin-portal/impersonate` (label: "Impersonation Lab") |
| Imported anywhere | ✅ (inline) | ❌ **no imports in codebase** |

**Closest Wave 6A patterns:** UX-PAT-WS-010 (management page shell), UX-PAT-NAV-004 (control-center tabs) — AI Context Debug uses tab pattern locally; not platform-standardized.

---

## 6. AI administration assessment

### 6.1 Maturity by area

| Area | Surfaces | Maturity | Duplication risk |
|------|----------|----------|------------------|
| **AI Pipeline (control plane)** | Hub + 9 subpages, 45 API routes | **Implemented** — documented phases 1–5 | Low — canonical per `AI_PIPELINE_ADMIN_TOOLS.md` |
| **Provider controls** | pricing, `ProviderUsageView`, `/api/admin/ai-providers` | **Implemented** | Low |
| **Pipeline / grounding controls** | intents, grounding, sources, tools policies | **Implemented** | Low |
| **Diagnostics / trace forensics** | diagnostics, test-lab, quality | **Implemented** (backend 1D aligned) | Low |
| **Model/provider visibility** | centralized-ai `/models` | **Retired** — 410 deprecated per Wave 1D | Resolved |
| **Orchestration tooling** | registry graph, validate, catalog | **Implemented** | Low |
| **AI analytics (admin)** | ai-system charts, ai-learning, business-ai | **Partial** | **High** — overlaps BI and product analytics |
| **Learning controls** | ai-learning page, centralized-ai scaffold | **Partial** — "coming soon" UI sections | **High** — dual API paths |
| **Context debug** | ai-context page, `/api/ai-context-debug` | **Partial** | Medium — separate from pipeline hub |
| **Admin AI safety** | compliance export, enforcement settings, quality | **Partial** | Low–medium |
| **UI schema parity** | Pipeline hub vs `pipelineTrace` fields | **Partial** | Per `AI_PLATFORM_LEVEL3_READINESS_REVIEW.md` — backend complete, UI parity open |

### 6.2 AI Pipeline — confirmed strengths

- Additive instrumentation of live twin path (does not replace `QueryIntent`)
- Policy CRUD with audit log
- Enforcement modes (off / disclose / block / regenerate)
- Evidence bundle and compliance export APIs
- Unit/integration tests: `aiCentralizedAdminFence.test.ts`, `pipelineDiagnosticPersistence.test.ts`, `mergeDiagnosticsFromHistoryContext.test.ts`

### 6.3 AI duplication register (admin-touching only)

From `AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md` (Decision D — reference, not re-decided):

| Concern | Surfaces | Disposition status |
|---------|----------|-------------------|
| Learning events | user `/api/ai/learning/*` vs centralized-ai | Fence shipped (1D); definitions consolidation **open** |
| Insights / patterns | twin metadata vs centralized-ai | Admin-gated; overlap remains |
| Business metrics | business-ai admin vs product analytics | Auth boundary review **open** |

---

## 7. Analytics assessment

### 7.1 Surface ownership map

| Surface | Path / API | Owner class | Overlaps with |
|---------|------------|-------------|---------------|
| Platform Analytics | `/admin-portal/analytics` | **Admin-owned** (observability) | Performance page metrics |
| Business Intelligence | `/admin-portal/business-intelligence` | **Admin-owned** (strategic) | AI System combined charts |
| AI System charts | `/admin-portal/ai-system` | **Admin-owned** (cross-AI hub) | BI + ai-learning + business-ai |
| AI Learning analytics | `/admin-portal/ai-learning` | **Admin-owned / AI Platform** | Centralized-ai; stub sections |
| Module analytics (admin) | `/api/admin-portal/modules/analytics` | **Admin-owned** | Product module marketplace metrics |
| Product analytics module | `/analytics` workspace | **Module-owned** | Must not appear in admin nav without gate |
| HR analytics | `/business/[id]/admin/hr/analytics` | **Module-owned** (HR) | None with portal |
| Place analytics | `/api/place/ai/context/analytics` | **Module-owned** (Place) | AI context provider only |

### 7.2 Boundary verdict (0A)

**Classification:** **Duplicated and unclear** — consistent with prior Decision D (`AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md`).

**Confirmed separation intent (docs):** Platform Analytics = system/technical; BI = business/strategic. **Confirmed drift (code):** AI System page aggregates charts from BI, ai-learning, and business-ai sources — hub duplication.

**Recommendation (planning only):** Phase **0C** should produce authoritative analytics ownership map; no consolidation in 0A.

---

## 8. Compliance and diagnostics assessment

| Area | Surfaces | Readiness | Evidence |
|------|----------|-----------|----------|
| **Audit logs** | security page, `/security/audit-logs`, `/api/admin/users/:id/audit-logs` | **Partial** | APIs + `AuditLog` model; empty in sparse environments |
| **Compliance reporting** | `/security/compliance`, ai-pipeline/compliance export | **Partial** | GDPR/SOC2 UI fields; runtime data **UNKNOWN** |
| **AI policy audit** | ai-pipeline/audit | **Implemented** | Dedicated API `GET /ai-pipeline/audit` |
| **Diagnostics** | ai-pipeline/diagnostics, performance, system-logs | **Partial–Implemented** | Pipeline diagnostics strongest |
| **Troubleshooting / dev** | testing, debug-*, test-*, admin-portal-testing API | **Dev-grade** | Server-side test execution — production policy **UNKNOWN** |
| **Security visibility** | security events/metrics, adminSecurityRoutes | **Partial** | Module security monitoring sub-router |
| **Database ops** | platform routes: schema-check, migrations, reset | **Control-plane** | Raw SQL including `DELETE FROM "_prisma_migrations"` — high risk |
| **Admin-only reports** | analytics export, security export, BI export | **Implemented** (API) | Export endpoints exist; auth confirmed on sampled routes |

---

## 9. Technical debt inventory

| ID | Priority | Surface | Evidence | Suggested phase |
|----|----------|---------|----------|-----------------|
| TD-01 | **P0** | `POST /support/tickets/customer` unauthenticated | `adminPortalRoutes.platform.ts:653` | 0E |
| TD-02 | **P0** | Raw migration delete/reset endpoints | `adminPortalRoutes.platform.ts` database routes | 0E |
| TD-03 | **P0** | Impersonation cross-tenant safety | Extensive seeding in impersonation routes; tests exist; runtime **UNKNOWN** | 0E |
| TD-04 | **P0** | `/api/admin/logs` auth depth unverified | `index.ts:950` — JWT only at mount | 0E |
| TD-05 | **P1** | Phantom `admin` moduleId | `coreModuleRegistry.ts:300-309`, empty routes | 0B |
| TD-06 | **P1** | `/modules/admin` duplicate | Mock fallback `modules/admin/page.tsx:44` | 0B |
| TD-07 | **P1** | Analytics surface duplication | §7 | 0C |
| TD-08 | **P1** | AI learning dual API + stub UI | `ai-learning/page.tsx` "coming soon" | 0D |
| TD-09 | **P1** | Mock fallbacks on support/modules | Lines 189, 287 respectively | 0B |
| TD-10 | **P1** | Memory Bank stale claims | `adminProductContext.md` "production ready" vs mock fallbacks | 0A doc reconciliation |
| TD-11 | **P2** | 4,658-line AdminService monolith | `adminService.ts` | 1B |
| TD-12 | **P2** | Fat route files + inline Prisma | core/platform route files | 1B |
| TD-13 | **P2** | 13+ API mount fragmentation | `index.ts` | 0B |
| TD-14 | **P2** | Four `requireAdmin` implementations | shared, admin.ts, pricing.ts, ai-provider-usage.ts | 0B |
| TD-15 | **P2** | Unused `AdminNavigation.tsx` | No imports | 0B |
| TD-16 | **P2** | Duplicate `GET /security/events` | `analyticsOps.ts` lines 452, 528 | 0B |
| TD-17 | **P2** | Dead `/admin/governance`, `/admin/retention` | `admin/layout.tsx` redirect | 0B |
| TD-18 | **P3** | No PlatformShell / UX Reference alignment | §5 | 1A |
| TD-19 | **P3** | No shared ConfirmModal / EmptyState | §5 | 1A |
| TD-20 | **P3** | 5 abandoned debug/test pages | §2.1.3 | 0B |
| TD-21 | **P3** | Triple impersonation pages | §2.1.3 | 0B |
| TD-22 | **P3** | No frontend admin tests | §9.1 | 1B |
| TD-23 | **P3** | `gray-*` tokens vs `v-*` design system | UX constitution gap | 1A |
| TD-24 | **P3** | Emergency HR mounts outside portal | `index.ts:1021-1024` | 0B |
| TD-25 | **P3** | `seed-modules` uses `window.confirm` | `seed-modules/page.tsx:24` | 1A |

### 9.1 Test coverage map

| Area | Test file | Coverage |
|------|-----------|----------|
| Core portal | `admin-portal.test.ts` | Basic |
| Users | `admin-portal-user-management.test.ts`, `admin-user-management.integration.test.ts` | Moderate |
| Impersonation | `admin-portal-impersonation.test.ts` | Moderate |
| Moderation | `admin-moderation.integration.test.ts`, `admin-portal-moderation.test.ts` | Moderate |
| Analytics | `admin-analytics.integration.test.ts` | Moderate |
| AI admin fence | `aiCentralizedAdminFence.test.ts` | Moderate |
| Module governance | `moduleApprovalCertificationGate.test.ts` | Certification gate only |
| Frontend admin | — | **None found** |
| Billing, security, BI, support, performance | — | **None found** |
| AI Pipeline routes | Pipeline unit tests (AI package) | Partial |

---

## 10. Strategic classification

### 10.1 Option evaluation

| Option | Assessment | Key evidence |
|--------|------------|--------------|
| **A. Module** | **Rejected** | `coreModuleRegistry` `admin` has `routes: []`; no `registerBuiltInModules` entry; no manifest; no workspace landing; no `emitModuleActivityEvent` |
| **B. Workspace** | **Rejected** | No `PlatformShell`; no `dashboardId` scope; not in Reference Workspace Program |
| **C. Governance Surface** | **Partial fit** | Module review, moderation, certification panel — subset only |
| **D. Control Plane** | **Partial fit** | AI Pipeline, DB ops, provider policies, system config — largest mature subset |
| **E. Hybrid** | **Selected** | Combines C + D + legacy ops debris |

### 10.2 Recommendation (planning only)

**Admin Portal should be classified as E — Hybrid**, explicitly decomposed:

1. **Platform Control Plane** — operational tooling for platform engineers (AI Pipeline, diagnostics, provider usage, pricing, system/DB ops, impersonation).
2. **Platform Governance Surface** — marketplace/module moderation, AI registry inspection, certification review entry points.
3. **Not** a product module, **not** a certified workspace, **not** a single ownership domain.

**Phantom `admin` moduleId:** Should be treated as **registry debris** until 0B boundary review decides retire vs. formalize.

---

## 11. Recommended follow-up phases (planning only)

| Phase | Focus | Entry criteria | Exit criteria |
|-------|-------|----------------|---------------|
| **0B** Admin Portal Boundary Review | API mount map; nav reconciliation; retire duplicates; phantom moduleId disposition | 0A complete | Authoritative boundary doc; orphan page policy |
| **0C** Admin Analytics Architecture Review | Enforce Decision D separation; chart ownership | 0A §7 | Analytics ownership map; no new consolidation |
| **0D** AI Administration Review | UI/trace schema parity; centralized-ai scaffold disposition; ai-learning stubs | 0A §6 | AI admin maturity matrix updated |
| **0E** Compliance / Diagnostics Review | Auth gaps; DB ops policy; dev route retirement | 0A §8, P0 debt | Production readiness checklist |
| **1A** Admin Shell Modernization | Management shell pattern (Wave 6A UX-PAT-WS-010); ConfirmModal/EmptyState | 0B boundaries | Shell pattern adopted — **not started in 0A** |
| **1B** Admin Governance Architecture | Service extraction plan; PE/audit alignment for governance mutations | 0B + 0E | Controller thinness roadmap — **not started in 0A** |

### 11.1 Sequencing

```
0A (this doc) → 0B Boundary ─┬→ 1A Shell Modernization
               ├→ 0C Analytics ───→ 1B Governance Architecture
               ├→ 0D AI Admin ─────→ 1B
               └→ 0E Compliance ──→ 1B
```

---

## 12. Evidence appendix

### 12.1 Key file index

| Path | Role |
|------|------|
| `web/src/app/admin-portal/layout.tsx` | Active shell + nav (20 nav items) |
| `web/src/components/admin-portal/AdminNavigation.tsx` | Unused duplicate nav |
| `web/src/runtime/modules/coreModuleRegistry.ts:300-309` | Phantom `admin` module |
| `server/src/routes/admin-portal.ts` | Router composition |
| `server/src/routes/admin-portal/adminPortalRoutes.{core,analyticsOps,platform,aiPipeline}.ts` | ~144 handlers |
| `server/src/services/adminService.ts` | 4,658 LOC monolith |
| `web/src/lib/adminApiService.ts` | 1,998 LOC client |
| `server/src/index.ts:922-1024` | Fragmented mounts |
| `docs/architecture/AI_PIPELINE_ADMIN_TOOLS.md` | AI Pipeline maturity reference |
| `docs/architecture/audits/AI_ADMIN_ANALYTICS_BOUNDARY_REVIEW.md` | Analytics Decision D |
| `memory-bank/adminProductContext.md` | Product claims (stale vs code) |

### 12.2 Automated inventory commands (reproducible)

```bash
find web/src/app/admin-portal -name 'page.tsx' | wc -l          # 39
find web/src/components/admin-portal -type f | wc -l          # 43
rg -c "router\.(get|post|put|patch|delete)\(" server/src/routes/admin-portal  # 144 total
wc -l server/src/services/adminService.ts                     # 4658
wc -l web/src/lib/adminApiService.ts                          # 1998
rg "PlatformShell|PageHeader|ConfirmModal|EmptyState" web/src/app/admin-portal  # ConfirmModal custom only
```

---

## 13. Open questions (deferred to 0B+)

1. Is `POST /support/tickets/customer` intentionally public? (**UNKNOWN** — needs product owner confirmation)
2. Should emergency HR/subscription SQL mounts remain separate from Admin Portal? (**UNKNOWN**)
3. Runtime behavior of impersonation flow in production — still failing? (**UNKNOWN** — archive analysis noted 500s; tests pass in CI)
4. Should `admin-portal/testing` server-side test runner be production-enabled? (**UNKNOWN**)
5. Disposition of unreachable `/admin/governance` and `/admin/retention` dashboards? (**Recommendation:** 0B retire or relocate)

---

**0A close:** Admin Portal reality documented. No code changes. No certification. Follow-up phases 0B–1B recommended but not executed.
