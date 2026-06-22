# Workspace & Dashboard Reality Assessment

**Program:** Workspace & Dashboard Constitutional Review  
**Assessment date:** 2026-06-21  
**Authority:** Platform Portfolio Refresh 2026 — pre-authorization gate for Dashboard Wave 3  
**Status:** Discovery only — **no implementation, no certification, no ledger changes, no council activity**

**Supersedes:** Informal assumptions in portfolio refresh that treat "Dashboard" as a monolithic uncertified product module without shell boundary.

**Related:** [WORKSPACE_OWNERSHIP_MODEL.md](../workspace/WORKSPACE_OWNERSHIP_MODEL.md), [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md), [PLATFORM_PORTFOLIO_REFRESH_2026.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md)

---

## Purpose

Before authorizing Dashboard modernization, validate whether Dashboard is a true module or a workspace composition layer. Map Personal Workspace, Business Workspace, Dashboard module, and Analytics against implementation reality and prior constitutional findings.

---

## Executive determination

| Surface | Constitutional class | Certification track | Ledger row |
|---------|---------------------|----------------------|------------|
| **Business Workspace shell** | Platform shell (orchestrator) | **WS-L3 WITH FINDINGS** (archived) | Co-surface of Reference Workspace program |
| **Personal Dashboard shell** | Platform shell (orchestrator) | **WS-L3 WITH FINDINGS** (archived) | Co-surface of Reference Workspace program |
| **Dashboard module** (`dashboard`) | **True product module** (widget/grid product) | **Independent L1 → L3 module track** | L1 Stabilizing — Wave 3 not started |
| **Analytics** (`analytics`) | **Pseudo-module / capability hybrid** | Scope decision required | L1 Stabilizing — ambiguous |

**Core finding:** Dashboard is **not exclusively** a module or a workspace surface. It is **hybrid (Classification C)** — already ratified at WS-L3 award. Workspace **orchestrates**; Dashboard **module** owns widget grid semantics. Conflating the two under one "Dashboard Wave 3" label is the primary modeling error today.

---

## A. Implementation inventory

### A.1 Business Workspace shell

| Layer | Artifacts | Role |
|-------|-----------|------|
| Routes | `/business/:id/workspace/*` | App Router segment tree |
| Layout | `workspace/layout.tsx` → `DashboardLayoutWrapper` | Shell chrome |
| Mount authority | `BusinessWorkspaceContent.tsx` switch | 16 module cases |
| Navigation SSOT | `businessWorkspaceNavigation.ts`, `businessWorkspaceContracts.ts` | URL policy |
| Server | `businessWorkspaceSeeder.ts` only | No `workspaceService.ts` |
| Registry | `coreModuleRegistry.ts` metadata lookup (non-authoritative) | Contract bridge |

**Identity (prior audit):** Hybrid D — platform shell + orphan stub UIs for dashboard/analytics/members cases. **No `moduleId`**, **no manifest**, **no shell entities**.

**Certification:** WS-L3 WITH FINDINGS — program archived 2026-06-19. Dashboard module explicitly **out of scope**.

### A.2 Personal Dashboard shell (Personal Workspace)

| Layer | Artifacts | Role |
|-------|-----------|------|
| Routes | `/dashboard`, `/dashboard/:id`, module routes, tab embeds | Personal landing |
| Layout | `dashboard/layout.tsx` → `DashboardLayout` → `DashboardLayoutInner` | Shell chrome |
| Orchestration | `DashboardContext`, `personalDashboardNavigation.ts` | Module navigation |
| Grid (boundary) | `DashboardClient.tsx`, `WidgetContentRenderer` | **Product module interior** — not shell |
| Tests | 15 navigation + 15 registry drift tests | CI enforcement |

**Archetype:** Dashboard workspace (widget grid + App Router module pages), not hub switch — intentional difference from Business Workspace per WS-L1 certification.

**Certification:** WS-L3 WITH FINDINGS co-surface — archived. Widget grid (`DashboardClient`) **out of scope** of workspace certification.

### A.3 Dashboard module (`dashboard`)

| Layer | Artifacts | Role |
|-------|-----------|------|
| Registration | `registerBuiltInModules.ts` | One of **10 registered built-in product modules** |
| AI context | `/api/dashboard/ai/context/*` | ModuleAIContext providers |
| Backend | `dashboardService.ts`, `dashboardController.ts`, `/api/dashboard/*` | CRUD for dashboards/widgets |
| Data model | `Dashboard`, `Widget` in `prisma/modules/business/dashboard.prisma` | Layout + widget persistence |
| Widget system | `widgetRegistry.ts`, `WidgetPicker`, 12+ widget types | Module product surface |
| Business mount | `case 'dashboard'` → `BusinessWorkspaceHubPanel` | **Stub hub** — not `DashboardClient` |
| Workspace landing | **Missing** `DashboardWorkspaceLanding.tsx` | Module-development pattern gap |

**Constitutional inventory (§0.1):** Listed among **10 registered built-in product modules**. Dual registry with `coreModuleRegistry` + `WIDGET_REGISTRY` flagged as transitional partial migration.

### A.4 Analytics (`analytics`)

| Layer | Artifacts | Role |
|-------|-----------|------|
| Registration | **Not** in `registerBuiltInModules.ts` | Runtime-only |
| Runtime registry | `coreModuleRegistry.ts` — `analytics` entry | BUSINESS_ONLY pseudo-module |
| Backend | `analyticsController.ts`, `/api/analytics/*` | Personal + module reads |
| Business UI | `workspace/analytics/page.tsx` | **Mock data** — TODO API |
| Domain events | `analyticsDomainEventSubscriber.ts` | **Placeholder** consumer |
| Admin Portal | `/admin-portal/analytics` + `adminAnalyticsService` | **Separate operator domain** (L3 certified) |
| Module-local | HR analytics dashboards under `/admin/hr/analytics` | Domain-owned slices |

**Constitutional inventory (§0.1):** Listed as **platform pseudo-module (runtime only)** alongside `ai`, `notifications`, `members`.

---

## B. Tenancy tension (critical)

The `Dashboard` Prisma model serves **dual roles**:

1. **Platform tenancy anchor** — `businessId`, `householdId`, `institutionId` bind tenant context for all modules
2. **Dashboard module domain** — `layout`, `preferences`, `widgets[]` for widget grid product

This entanglement is why "Dashboard" appears everywhere in the platform but is **not** wholly a product module. Workspace runtime and module contracts document: **module = capability; widget = projection** — yet the tenancy row and widget product share one entity.

**Implication:** Dashboard module modernization must **not** collapse tenancy into widget product without an explicit domain split charter. Wave 3 service extraction should address this boundary.

---

## C. Required questions — Dashboard & Workspace

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Dashboard a true module? | **Partially yes** — registered built-in with services, AI context, widget product. **Partially no** — personal shell and tenancy anchor are not module-owned. |
| 2 | Is Dashboard a workspace composition surface? | **Partially yes** — Personal Dashboard shell and Business hub case are workspace-orchestrated surfaces. **Partially no** — widget grid, registry, and `/api/dashboard` are module product. |
| 3 | Should Dashboard have an independent certification track? | **Yes** — WS-L3 award explicitly kept Dashboard module **out of scope**. Module L3 is a separate track from WS-L3. |
| 4 | Should Dashboard be governed by Workspace instead? | **No for product** — shell already governed by Reference Workspace (archived). **Yes for orchestration layers only** (`DashboardLayoutInner`, hub switch, navigation SSOT). |
| 9 | Are Dashboard and Analytics incorrectly modeled today? | **Dashboard:** naming and ledger row conflate shell + module. **Analytics:** runtime pseudo-module without manifest; stubs and mock UI. |
| 10 | Correct long-term architecture? | **Three-layer model:** (1) Reference Workspace owns shell orchestration, (2) Dashboard module owns widget/grid product, (3) Analytics becomes platform derived-read capability with optional business product UI — see deliverable index. |

---

## D. Personal vs Business workspace posture

| Dimension | Business Workspace | Personal Dashboard shell |
|-----------|-------------------|-------------------------|
| Orchestration pattern | Hub switch (`BusinessWorkspaceContent`) | Widget grid + module routes |
| WS-L3 status | Co-surface CwF | Co-surface CwF |
| Product module interior | Mounted modules own CRUD | `DashboardClient` owns grid; modules own routes |
| Dashboard module overlap | Stub `BusinessWorkspaceHubPanel` | Full widget grid |
| Open advisories | B-F2, B-F3 | P-F2–P-F5 |

Both are **shells**, not product modules. Neither has a standalone L3 module certification row — only the Reference Workspace **program** row (WS-L3).

---

## E. Historical program lineage

| Program | Outcome | Relevance to this review |
|---------|---------|--------------------------|
| Business Workspace 0–1D | Hygiene closed | Shell contracts authoritative |
| Personal Dashboard 2A–2D | Drift CI | Shell enforcement |
| Reference Workspace 2E–2F → WS-L3 | **Archived CwF** | Shell certified; Dashboard module excluded |
| Dashboard build-out / Revitalization | Widget registry shipped | Module product debt remains L1 |
| Platform Portfolio Refresh 2026 | Dashboard Wave 3 recommended | **Requires boundary gate** (this review) |

---

## F. Modeling errors today

| Error | Evidence | Severity |
|-------|----------|----------|
| "Dashboard" treated as single uncertified module | Portfolio refresh L1 row; conflates shell + module | **High** |
| WS-L3 work assumed to cover widget grid | WS-L3 record § "Dashboard module out of scope" | **High** |
| Analytics listed as product module peer to Dashboard | Ledger row; no manifest registration | **Medium** |
| Business `dashboard` case is stub hub, not module | `BusinessWorkspaceHubPanel` vs `DashboardClient` | **Medium** |
| Tenancy entity named `Dashboard` | Prisma model scope bleed | **Medium** |
| Missing `DashboardWorkspaceLanding` | module-development.mdc hub pattern | **Low** (business uses hub panel) |

---

## G. Outcome gate (A vs B)

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **A. Dashboard remains standalone module; Wave 3 proceeds** | **Qualified YES** | Module has registration, services, widget product. WS-L3 already closed shell track. |
| **B. Reclassify Dashboard as Workspace; replace Wave 3 with Workspace Experience program** | **NO** | Would reopen archived WS-L3 program and duplicate shell work. Shell advisories are 90-day backlog, not a new modernization charter. |

**Qualified A means:** Rename and scope Wave 3 to **Dashboard Module modernization** (widget registry, services, activity, tenancy boundary) — **not** Workspace Experience reopening.

---

## H. Stop condition

- Discovery complete for workspace/dashboard reality
- No implementation plans
- No certification execution
- No ledger modification
- No council activity

**Last updated:** 2026-06-21
