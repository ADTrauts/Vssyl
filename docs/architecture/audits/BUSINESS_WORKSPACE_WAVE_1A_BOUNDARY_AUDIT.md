# Business Workspace Wave 1A — Boundary and Ownership Audit

**Status:** **Complete** — audit and governance only  
**Date:** 2026-06-14  
**Wave:** Business Workspace **1A** — Boundary and Ownership Audit  
**Program:** [Reference Workspace Program](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md)  
**Prior:** [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md) (Wave 0, 2026-06-04)

> **No code changes. No certifications. No registrations. No feature work. No UX module changes.**

---

## Required report

| # | Question | Answer |
|---|----------|--------|
| 1 | Workspace-owned surfaces | Shell orchestration, global chrome, module switch, navigation, scope binding, sidebar — see §2 |
| 2 | Module-owned surfaces | Product data, interiors, hub *content*, APIs, PE, activity — see §3 |
| 3 | Orphaned or duplicate workspace components | **4 dead landings**, **3 stub widgets**, **Drive logic in shell**, **dual mount paths** — see §5 |
| 4 | Proposed ownership matrix | §4 |
| 5 | WS-L1 blockers | **9 blockers** — see §8 |
| 6 | Recommended 1B implementation scope | Hub standardization + stub retirement + mount unification — see §10 |

---

## 1. Executive summary

Wave 1A establishes **authoritative ownership boundaries** for the inaugural Reference Workspace Program modernization. Business Workspace is correctly identified as a **platform shell** (`surface id: business-workspace`) — not a `moduleId`. It owns **orchestration**; product modules own **capability and interior UX**.

**Key findings:**

1. **Two render paths** coexist: `BusinessWorkspaceContent` switch (query `?module=`) and **nested App Router pages** (`/workspace/hr/*`, `/workspace/members`, etc.) that bypass the switch via `hasNestedWorkspaceRoute`.
2. **Eight `*WorkspaceLanding.tsx` files** exist; **four are active** (thin wrappers or full hub), **four are dead** on disk.
3. **Three inline stub widgets** in the shell impersonate product surfaces (dashboard overview, analytics, members).
4. **Drive upload/folder creation** lives in `BusinessWorkspaceContent` — a **shell → module boundary leak**.
5. **`PlatformShell`** is certified (3C-4F) and correctly owned as **platform chrome sub-tier**; business and personal consumers are aligned.
6. **Workspace-level search and notifications** are **platform-global** (root layout / header), not business-workspace-specific — no dedicated shell service.

**WS-L1 posture:** **Stabilizing with blockers** — boundary clarity improved by this audit; strict WS-L1 close requires Wave **1B** hub remediation and Wave **1C** navigation contracts.

---

## 2. Workspace-owned surfaces

Surfaces the **Reference Workspace Program** (Business Workspace + Personal Dashboard co-surface) owns or orchestrates.

### 2.1 Business Workspace shell

| Surface | Owner | Key artifacts | Notes |
|---------|-------|---------------|-------|
| **Business workspace route tree** | Workspace | `/business/[id]/workspace/*` (23 route files) | Layout wraps all children |
| **Workspace layout providers** | Workspace | `BusinessConfigurationProvider`, `PositionAwareModuleProvider`, `SidebarCustomizationProvider` | Tenant + install context |
| **Platform chrome (business mode)** | Platform Shell sub-tier | `DashboardLayoutWrapper` → `PlatformShell mode="business"` | 3C-4F certified |
| **Global header in business context** | Workspace + Platform | `GlobalHeaderTabs` in shell header slot | Dashboard tab switching |
| **Business left sidebar** | Workspace | `PlatformLeftSidebar` + folder config + `displayModules` filter | Installed-module filter |
| **Business right rail** | Workspace | `PlatformRightRail`, module quick buttons, `GlobalTrashBin` | Trash is platform-global |
| **Module resolution** | Workspace | `resolveBusinessWorkspaceModule`, `buildBusinessWorkspaceModuleHref`, `hasNestedWorkspaceRoute` | Single helper module (A-043) |
| **Module mount switch** | Workspace | `BusinessWorkspaceContent` `switch (currentModule)` | Authoritative when not nested |
| **Nested route bypass** | Workspace | `shouldRenderNestedRoute ? children : BusinessWorkspaceContent` | Second mount path |
| **Dashboard scope binding** | Workspace + Dashboard platform | `ensureBusinessDashboard` in `page.tsx` + `DashboardLayoutWrapper` | **Duplicated** |
| **Runtime scope bridge** | Workspace | `BusinessLayoutRuntimeShell` → `WorkspaceRuntimeScopeBridge` | `contextType: business` |
| **Module install filtering** | Workspace (shared state) | `BusinessConfigurationContext`, `PositionAwareModuleProvider` | Permissions snapshot input |
| **Sidebar customization** | Workspace | `SidebarCustomizationModal`, `SidebarFolderRenderer` | Per-dashboard-tab config |
| **Parallel Work Tab entry** | Workspace (adjacent) | `BrandedWorkDashboard` | Shares config; not primary shell |
| **Workspace seeding trigger** | Workspace-adjacent | `businessWorkspaceSeeder` via `dashboardService` | On dashboard create |

### 2.2 Personal Dashboard shell (co-surface)

| Surface | Owner | Key artifacts |
|---------|-------|---------------|
| **Personal platform chrome** | Workspace | `DashboardLayoutInner` → `PlatformShell mode="personal"` |
| **Dashboard widget grid** | Dashboard platform | `DashboardClient`, `WIDGET_REGISTRY` |
| **Personal runtime bridge** | Workspace | `DashboardLayout.tsx` → `WorkspaceRuntimeScopeBridge` |
| **Work / Place tab embeds** | Workspace | `WorkTab`, `PlaceContent` in Inner |
| **Household / education context** | Dashboard platform | Dashboard type on `Dashboard` model — no separate shell file |

### 2.3 Workspace navigation (business)

| Concern | Owner | Mechanism |
|---------|-------|-----------|
| Sidebar module list | Workspace | `navigateToModule` → `buildBusinessWorkspaceModuleHref` |
| Active module highlight | Workspace | `currentModule` from resolver |
| Segment deep links | Workspace | Path-first segments (`members`, `notebook`, `hr`, `scheduling`) |
| Query deep links | Workspace | `?module=drive|chat|calendar|…` |
| Cross-context switch (personal ↔ business) | Workspace | `handleSwitchToPersonal`, global dashboard tabs |
| Registry metadata (non-authoritative) | Workspace | `getModuleDefinition(normalizeModuleId)` void lookup |

### 2.4 Workspace-level cross-cutting (platform-global, not BW-specific)

| Concern | Owner | Business WS integration |
|---------|-------|-------------------------|
| **Search** | Platform (root) | `GlobalSearchProvider` in `app/layout.tsx`; `CompactSearchButton` / `AIEnhancedSearchBar` in header — **not** business-workspace scoped |
| **Notifications** | Platform + modules | Module notification types; no `business_workspace_*` types; bell in header layer |
| **Global trash** | Platform | `GlobalTrashBin` in right rail — module handlers per `moduleId` |
| **Auth/session** | Platform | NextAuth; workspace layout verifies session |

---

## 3. Module-owned surfaces

Product `moduleId` surfaces the shell **mounts** but does **not** own.

| Domain | Owner | Mounted via | Shell must not |
|--------|-------|-------------|----------------|
| **File Hub (`drive`)** | Module | `DriveModuleWrapper` + inline `DriveSidebar` in shell | Own upload/folder API calls (**current leak**) |
| **Chat (`chat`)** | Module | `ChatModuleWrapper` | Persist messages |
| **Calendar (`calendar`)** | Module | `CalendarWorkspaceLanding` → `CalendarMonthView` | Own event CRUD |
| **Todo (`todo`)** | Module | `TodoWorkspaceLanding` → `TodoModule` | Own task services |
| **Notebook (`notebook`)** | Module | `NotebookShell` (not landing file) | Own page/link services |
| **Place (`place`)** | Module | `PlaceWorkspaceLanding` | Own graph/listing/commerce |
| **HR (`hr`)** | Module | `HRLayout` (+ nested `/workspace/hr/*` pages) | Own HR records |
| **Scheduling (`scheduling`)** | Module | `SchedulingLayout` (+ nested routes) | Own shift data |
| **V_Link (`vlink`)** | Platform module | `VLinkModule` | Own link resolution |
| **AI chat embed (`ai`)** | Module / UX #4 | `AIWorkspaceLanding` → `AIChatModule` | Own twin pipeline |
| **Members (product)** | Member module / Biz domain | `/workspace/members/page.tsx` (real UI) | Stub `BusinessMembersWidget` (**leak**) |
| **Analytics (product)** | Analytics (immature) | Should own analytics — not `BusinessAnalyticsWidget` | Stub in shell (**leak**) |
| **Dashboard overview (product)** | Dashboard module | Should own overview widgets | Stub `BusinessDashboardWidget` (**leak**) |

### 3.1 Business domain (adjacent — not workspace shell)

| Domain | Owner | Routes |
|--------|-------|--------|
| Business CRUD, EIN, branding | Business domain | `/api/business/*`, `businessController` |
| Member invite/remove (API) | Business domain | `businessController` |
| Business Front Page CMS | Front Page product | `/api/business-front/*` |
| Business Digital Twin | Business AI | `/api/business-ai/*` |
| Module install/uninstall | Platform | `moduleProvisionController` |

### 3.2 UX-owned interiors (Reference UX Program — not workspace)

| Pattern | UX owner | Workspace role |
|---------|----------|------------------|
| `WorkspaceSplitLayout` | UX #1 Drive | Module interior only |
| `PageHeader` + `PageToolbar` | UX #3 Todo | Module / publisher hub content |
| Hub landing **content** pattern | UX #3 NAV-001 | Module files; shell only **mounts** |
| `PlacePageShell` (consumer) | UX #6 candidate | Outside business workspace |

---

## 4. Proposed ownership matrix

| Surface / concern | Workspace | Module | Shared | No owner |
|-------------------|:---------:|:------:|:------:|:--------:|
| `PlatformShell` geometry + slots | | | ✅ Shell sub-tier | |
| `PlatformHeader` / tabs / brand | | | ✅ Shell + header consumers | |
| Module `switch` + mount props | ✅ | | | |
| Nested App Router module pages | ✅ | ✅ | ✅ Dual path | |
| `businessWorkspaceNavigation.ts` | ✅ | | | |
| `WorkspaceRuntimeScopeBridge` | ✅ | | | |
| `BusinessConfigurationContext` | | | ✅ Workspace + modules read | |
| `hasPermission(moduleId, perm)` | | | ✅ Context in workspace; PE in modules | |
| Hub landing **mount** contract | ✅ | | | |
| Hub landing **UI content** | | ✅ | | |
| `WorkspaceSplitLayout` inside module | | ✅ | | |
| Drive file upload handlers | | ✅ | | 🔴 **Shell today** |
| Business overview / analytics / members UI | | ✅ | | 🔴 **Stub in shell** |
| Global search provider | | | ✅ Platform root | |
| Notification bell + routing | | | ✅ Platform header | |
| Activity / domain events for module ops | | ✅ | | |
| `businessWorkspaceSeeder` | | | ✅ Workspace trigger; module APIs | |
| Dead `*WorkspaceLanding` files | | | | 🔴 Orphaned on disk |
| Admin Portal shell | | | | ✅ Separate portal archetype |
| AI Identity Center (`/ai`) | | | | ✅ UX #4 / control-center |

---

## 5. Landing page audit (`*WorkspaceLanding.tsx`)

| File | Switch wired? | Mount pattern | Status | Recommendation |
|------|---------------|---------------|--------|----------------|
| `PlaceWorkspaceLanding.tsx` | ✅ `case 'place'` | Full publisher hub (`PageHeader`, editor, trash) | **Active** | Keep — UX #6 reference surface |
| `TodoWorkspaceLanding.tsx` | ✅ `case 'todo'` | Thin wrapper → `TodoModule` | **Active** | Keep — canonical thin landing |
| `CalendarWorkspaceLanding.tsx` | ✅ `case 'calendar'` | Thin wrapper → `CalendarMonthView` | **Active** | Keep; consider `CalendarPageShell` alignment in module wave |
| `AIWorkspaceLanding.tsx` | ✅ `case 'ai'` | Thin wrapper → `AIChatModule` | **Active** | Keep |
| `NotebookWorkspaceLanding.tsx` | ❌ | — | **Dead** | **1B:** Wire as hub entry **or** delete; today uses `NotebookShell` |
| `HRWorkspaceLanding.tsx` | ❌ | — | **Dead** | **1B:** Wire replacing direct `HRLayout` **or** delete; `HRLayout` is de facto entry |
| `SchedulingWorkspaceLanding.tsx` | ❌ | — | **Dead** | **1B:** Wire **or** delete; `SchedulingLayout` is de facto entry |
| `VLinkWorkspaceLanding.tsx` | ❌ | — | **Dead** | **1B:** Delete or wire; switch uses `VLinkModule` directly |

### 5.1 Non-landing mount patterns (no `*WorkspaceLanding` file)

| Module | Mount in switch | Landing file? | Classification |
|--------|-----------------|---------------|----------------|
| `drive` | Inline `WorkspaceSplitLayout` + handlers in shell | No | **Boundary leak** — module wrapper without landing; shell owns sidebar actions |
| `chat` | `ChatModuleWrapper` | No | Acceptable — wrapper is module entry |
| `notebook` | `NotebookShell` | Dead file exists | **Duplicated intent** — shell vs orphaned landing |
| `hr` | `HRLayout` + nested pages | Dead file exists | **Duplicated intent** |
| `scheduling` | `SchedulingLayout` + nested pages | Dead file exists | **Duplicated intent** |
| `vlink` | `VLinkModule` | Dead file exists | **Orphaned landing** |
| `members` | Stub widget in switch; real page at `/workspace/members` | No | **Duplicated** — two UIs for same module |

---

## 6. Shell boundary audit

### 6.1 Layer responsibilities

```
┌──────────────────────────────────────────────────────────────────┐
│ GLOBAL NAVIGATION (Platform)                                      │
│ GlobalHeaderTabs · dashboard context tabs · auth · search bell    │
├──────────────────────────────────────────────────────────────────┤
│ WORKSPACE CHROME (Reference Workspace / Platform Shell 3C-4F)   │
│ PlatformShell · PlatformLeftSidebar · PlatformRightRail           │
│ DashboardLayoutWrapper (business) · DashboardLayoutInner (personal)│
├──────────────────────────────────────────────────────────────────┤
│ WORKSPACE ORCHESTRATION (Reference Workspace)                     │
│ Module resolver · switch OR nested children · scope props       │
│ businessDashboardId · BusinessConfigurationContext              │
├──────────────────────────────────────────────────────────────────┤
│ MODULE CONTAINER (thin mount — workspace contract)              │
│ *WorkspaceLanding (thin) · *ModuleWrapper · *Layout entry       │
├──────────────────────────────────────────────────────────────────┤
│ MODULE INTERIOR (UX Reference Program)                          │
│ WorkspaceSplitLayout · PageHeader · ConfirmModal · module pages │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Authoritative responsibilities

| Layer | Owns | Must not own |
|-------|------|--------------|
| **PlatformShell** | Header/body/main/rail geometry; collapse; mode attribute | Module data, routing logic, permissions |
| **Business Workspace** | Which module renders; href building; installed-module sidebar; dashboard id propagation | File uploads, HR records, analytics metrics, member CRUD |
| **Dashboard (platform)** | `Dashboard` record, widget grid, `WIDGET_REGISTRY`, create/list API | Business module switch |
| **Module containers** | Scope props (`businessId`, `dashboardId`); entry component selection | Cross-module aggregation (except Notebook composition) |
| **Workspace chrome vs module chrome** | Sidebar lists **modules** | Sidebar lists **entities inside module** (Drive folders — module sidebar, but today mounted by shell for drive case) |

### 6.3 Dual render path (critical boundary finding)

| Path | Trigger | Renderer | Risk |
|------|---------|----------|------|
| **Switch path** | `/workspace?module=X` or `/workspace` | `BusinessWorkspaceContent` | Stubs for dashboard/analytics/members |
| **Nested path** | `/workspace/hr/team`, `/workspace/members`, … | App Router `children` | Bypasses switch; may duplicate module entry (`HRLayout` twice) |

**Rule (draft):** Nested routes must either (a) delegate to the same module entry component as the switch, or (b) be deprecated in favor of segment URLs resolved by a single mount function.

---

## 7. Workspace contract draft (v0.1)

### 7.1 Ownership rules

1. **Shell has no `moduleId`** — no manifest, entities, global trash handler, or activity events for `business-workspace`.
2. **Shell mounts; modules mutate** — all user data writes go through mounted module APIs.
3. **Shell passes scope** — every mount receives `businessId` and `businessDashboardId` (when applicable); modules enforce tenancy.
4. **Shell does not assemble module context for AI** — twin/module providers own context (Notebook exception: composition module).
5. **PlatformShell primitives are shared** — business and personal shells use the same certified components.

### 7.2 Workspace / module boundaries

| Operation class | Workspace | Module |
|-----------------|:---------:|:------:|
| Open workspace / resolve module | ✅ | |
| Build sidebar from install list | ✅ | |
| Render module entry | ✅ mount | ✅ interior |
| CRUD on domain entities | | ✅ |
| Policy Engine on writes | | ✅ |
| Hub landing content | | ✅ |
| Provisioning seed on dashboard create | ✅ trigger | ✅ APIs |

### 7.3 Workspace lifecycle rules

1. **Enter business workspace** → load business → ensure `Dashboard` with `businessId` → set `businessDashboardId` → render module.
2. **Switch module** → update URL via `buildBusinessWorkspaceModuleHref` → resolve module → mount (switch or nested).
3. **Leave business workspace** → global tab to personal dashboard → reset runtime scope via navigation.
4. **Install/uninstall module** → platform `moduleProvisionController` → `BusinessConfigurationContext` refresh → sidebar filter updates.

### 7.4 Workspace mounting rules

1. **One canonical entry component per `moduleId`** — `WorkspaceLanding` (thin or full) **or** documented `*Layout` / `*Wrapper` — not both stub + nested page + dead landing file.
2. **Thin landing preferred** — delegate to module root (`TodoWorkspaceLanding` pattern).
3. **No product UI in shell switch** — replace stubs with module routes or remove cases.
4. **Shell must not call module APIs directly** — exception: provisioning seeder on dashboard create (documented).
5. **Nested routes** — must use shared module entry; no second implementation.

### 7.5 Workspace navigation rules

1. **Single resolver** — `resolveBusinessWorkspaceModule(pathname, searchParams)` is authoritative for active module id.
2. **Single href builder** — `buildBusinessWorkspaceModuleHref(businessId, moduleId)` for sidebar and programmatic navigation.
3. **Segment URL policy (target)** — all modules use path segments where deep links exist; query `?module=` transitional only.
4. **Nested guard** — `hasNestedWorkspaceRoute` prevents switch from overriding deep HR/scheduling/notebook pages.
5. **Registry is metadata-only** — `getModuleDefinition` must not drive render until explicit migration.

---

## 8. WS-L1 blockers

WS-L1 criteria (from charter): boundary audit ✅ · single navigation source ✅ · `PlatformShell` adopted ✅ · module switch authoritative ⚠️ · runtime bridge present ✅.

| # | Blocker | Severity | Wave |
|---|---------|----------|------|
| **B-1** | Stub product UI in shell (`BusinessDashboardWidget`, `BusinessAnalyticsWidget`, `BusinessMembersWidget`) | **P0** | 1B |
| **B-2** | Four dead `*WorkspaceLanding` files (Notebook, HR, Scheduling, V_Link) | **P0** | 1B |
| **B-3** | Drive upload/folder handlers in `BusinessWorkspaceContent` | **P1** | 1B |
| **B-4** | Dual mount paths (switch vs nested pages) without shared entry contract | **P1** | 1B–1C |
| **B-5** | Duplicated `ensureBusinessDashboard` (`page.tsx` + `DashboardLayoutWrapper`) | **P1** | 1B |
| **B-6** | Members: stub widget vs real `/workspace/members` page | **P1** | 1B |
| **B-7** | No navigation/resolver contract tests | **P1** | 1C |
| **B-8** | Dual URL model (query vs segment) incomplete segment coverage | **P2** | 1C |
| **B-9** | Registry metadata vs switch cases drift risk | **P2** | 1C |

**WS-L1 verdict after 1A:** **Stabilizing — blockers documented**; strict WS-L1 close targeted post-**1B** (P0/P1) + **1C** (tests).

---

## 9. Surface inventory summary tables

### 9.1 Business workspace switch cases (16)

| `case` | Mount | Landing status | Owner leak? |
|--------|-------|----------------|-------------|
| `dashboard` | `BusinessDashboardWidget` | N/A stub | 🔴 Shell |
| `drive` | Inline split + `DriveModuleWrapper` | No file | 🔴 Shell upload |
| `chat` | `ChatModuleWrapper` | N/A | ✅ |
| `calendar` | `CalendarWorkspaceLanding` | Active thin | ✅ |
| `hr` | `HRLayout` | Dead landing | 🟡 Layout not landing |
| `scheduling` | `SchedulingLayout` | Dead landing | 🟡 |
| `analytics` | `BusinessAnalyticsWidget` | N/A stub | 🔴 Shell |
| `members` / `connections` | `BusinessMembersWidget` | Real page exists | 🔴 Duplicate |
| `ai` | `AIWorkspaceLanding` | Active thin | ✅ |
| `notebook` / `notes` | `NotebookShell` | Dead landing | 🟡 |
| `todo` | `TodoWorkspaceLanding` | Active thin | ✅ |
| `place` | `PlaceWorkspaceLanding` | Active full | ✅ |
| `vlink` | `VLinkModule` | Dead landing | 🟡 |
| `default` | `BusinessDashboardWidget` | — | 🔴 |

### 9.2 Nested workspace routes (bypass switch)

| Route pattern | Renders | Aligns with switch? |
|---------------|---------|---------------------|
| `/workspace/members` | `WorkMembersPage` (real) | ❌ Switch uses stub |
| `/workspace/hr`, `/workspace/hr/*` | `HRLayout` | ✅ Same as switch |
| `/workspace/scheduling/*` | Scheduling pages | ✅ Via layout |
| `/workspace/notebook/*` | Notebook pages | Partial — switch uses `NotebookShell` |
| `/workspace/developer-portal/*` | Developer portal | No switch case |
| `/workspace/settings/*` | Settings | Adjacent admin |

---

## 10. Modernization roadmap

### 10.1 Wave 1B — Hub standardization and boundary cleanup (recommended scope)

**Goal:** Resolve P0/P1 WS-L1 blockers; no new product features.

| # | Task | Outcome |
|---|------|---------|
| **1B-1** | **Retire or replace stub widgets** — `dashboard`, `analytics`, `members` cases delegate to module surfaces or redirect to nested routes | B-1, B-6 |
| **1B-2** | **Landing file decision table** — per dead file: wire in switch, merge into Layout, or delete | B-2 |
| **1B-3** | **Unify members mount** — switch `members`/`connections` → `/workspace/members` or shared component | B-6 |
| **1B-4** | **Move Drive sidebar actions into Drive module** — shell passes callbacks only or uses `DriveModuleWrapper` self-contained | B-3 |
| **1B-5** | **Extract `ensureBusinessDashboard` hook** — single client hook used by page + wrapper | B-5 |
| **1B-6** | **Document canonical entry per moduleId** — update catalog + `module-development.mdc` hub checklist | Governance |
| **1B-7** | **Developer-portal / settings routes** — classify adjacent vs workspace-owned | Boundary |

**Out of scope 1B:** UX scorecard changes, Place UX #6, segment URL migration (1C).

### 10.2 Wave 1C — Navigation contracts and URL policy

| # | Task | Outcome |
|---|------|---------|
| **1C-1** | Contract tests: `resolveBusinessWorkspaceModule`, `buildBusinessWorkspaceModuleHref`, `hasNestedWorkspaceRoute` | B-7 |
| **1C-2** | Segment URL migration plan for `drive`, `chat`, `calendar`, `todo`, `place`, `ai` | B-8 |
| **1C-3** | Switch vs registry drift test (`coreModuleRegistry` cases ⊆ switch cases) | B-9 |
| **1C-4** | WS-L1 reassessment gate | Certification path |

### 10.3 WS-L1 certification path

| Gate | Prerequisite | Status |
|------|--------------|--------|
| Boundary audit (1A) | This document | ✅ |
| Hub standardization (1B) | P0/P1 blockers cleared | ⏳ |
| Navigation contracts (1C) | Tests + URL policy | ⏳ |
| PlatformShell prerequisite | 3C-4F | ✅ |
| Operation matrix update | Post-1B | ⏳ |
| WS-L1 award | Governance review only — separate wave | ⏳ |

**WS-L2 target:** No stub product UI · all modules hub-complete · segment URLs · contract tests green.

**WS-L3 target:** `REFERENCE_WORKSPACE_PLATFORM_SHELL.md` registration + `WS-REF-*` pattern extraction (Wave 6E).

---

## 11. Relationship to Reference Workspace Program

| Program element | 1A outcome |
|-----------------|------------|
| Inaugural candidate | **Business Workspace** confirmed |
| Personal co-surface | **DashboardLayoutInner** documented |
| PlatformShell | **Sub-tier** — certified; not a separate reference |
| UX Reference #6 Place | **Publisher hub** correctly module-owned; mounted by workspace |
| Architecture Reference #6 | **Rejected** (Wave 0) — still correct |

---

## 12. Constraints honored

- ✅ Audit and governance only  
- ✅ No code changes  
- ✅ No certifications awarded  
- ✅ No registrations  
- ✅ No UX module changes  

---

## Related

- [REFERENCE_WORKSPACE_CHARTER_REVIEW.md](./REFERENCE_WORKSPACE_CHARTER_REVIEW.md)
- [BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md](./BUSINESS_WORKSPACE_CONSTITUTIONAL_AUDIT.md)
- [BUSINESS_WORKSPACE_OPERATION_MATRIX.md](./BUSINESS_WORKSPACE_OPERATION_MATRIX.md)
- [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md)
- [PLATFORMSHELL_CERTIFICATION.md](../../ux/audits/PLATFORMSHELL_CERTIFICATION.md)

---

**Last updated:** 2026-06-14 (Wave 1A complete)
