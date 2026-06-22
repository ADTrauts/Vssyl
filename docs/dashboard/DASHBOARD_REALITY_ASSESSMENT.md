# Dashboard Module — Reality Assessment

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Scope:** Dashboard **module** (`dashboard` id) only — **not** Reference Workspace shells  
**Status:** Discovery only — no implementation, certification, ledger, or council activity

**Prior context:** [WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md](../workspace-review/WORKSPACE_DASHBOARD_REALITY_ASSESSMENT.md), [WORKSPACE_CERTIFICATION_RECORD.md](../workspace/WORKSPACE_CERTIFICATION_RECORD.md) (Dashboard module out of scope at WS-L3)

---

## Purpose

Inventory everything the Dashboard module owns in code and data. Separate module product from Workspace shell. Identify duplication.

---

## A. Route inventory

### A.1 Module product routes (in scope)

| Route | Component | Owner | Notes |
|-------|-----------|-------|-------|
| `/dashboard` | Redirect/bootstrap | **Boundary** — shell context selects active id; module creates tabs | Shared with shell |
| `/dashboard/:id` | `DashboardClient` | **Dashboard module** | Widget grid — primary product surface |
| `/dashboard/:id` (error/loading) | Route boundaries | Module UX | Next.js app router |

**Not module routes:** `/drive`, `/chat`, `/calendar`, etc. — module pages mounted by Personal Dashboard **shell** via App Router layouts.

### A.2 Business context (partial / divergent)

| Surface | Component | Owner | Notes |
|---------|-----------|-------|-------|
| Business switch `case 'dashboard'` | `BusinessWorkspaceHubPanel` | **Workspace stub** | Not `DashboardClient` — overlap defect |
| Enterprise path | `DashboardModuleWrapper` → `EnhancedDashboardModule` | **Dashboard module** (feature-gated) | Parallel product path |
| Admin operator | `/admin-portal/dashboard` | **Admin Portal** | Out of scope |

---

## B. API inventory

**Mount points:** `server/src/index.ts` — `/api/dashboard`, `/api/widget`

### B.1 Dashboard CRUD & preferences

| Method | Path | Controller | Service |
|--------|------|------------|---------|
| GET | `/api/dashboard` | `dashboardController.getDashboards` | `dashboardService.getAllUserDashboards` |
| POST | `/api/dashboard` | `dashboardController.createDashboard` | `dashboardService.createDashboard` |
| GET | `/api/dashboard/:id` | `dashboardController.getDashboardById` | `dashboardService.getDashboardById` |
| PUT | `/api/dashboard/:id` | `dashboardController.updateDashboard` | `dashboardService.updateDashboard` |
| DELETE | `/api/dashboard/:id` | `dashboardController.deleteDashboard` | `dashboardService.deleteDashboard` + `fileMigrationService` |
| GET | `/api/dashboard/:id/file-summary` | `dashboardController.getDashboardFileSummary` | `fileMigrationService.getDashboardFileSummary` |

### B.2 Sidebar personalization (module-adjacent)

| Method | Path | Controller | Service |
|--------|------|------------|---------|
| GET | `/api/dashboard/:id/sidebar-config` | `sidebarController.getSidebarConfig` | `sidebarCustomizationService` |
| POST/PUT/DELETE | `/api/dashboard/:id/sidebar-config` | `sidebarController.*` | `sidebarCustomizationService` |

Stored in `Dashboard.preferences.sidebarCustomization` JSON — **rendered by shell** (`DashboardLayoutInner`, `DashboardLayoutWrapper`).

### B.3 Widget lifecycle

| Method | Path | Controller | Service |
|--------|------|------------|---------|
| POST | `/api/widget/:dashboardId/widgets` | `widgetController.createWidget` | `widgetService.createWidget` |
| PUT | `/api/widget/:id` | `widgetController.updateWidget` | `widgetService.updateWidget` |
| DELETE | `/api/widget/:id` | `widgetController.deleteWidget` | `widgetService.deleteWidget` |
| PUT | `/api/widget/:dashboardId/batch-positions` | `widgetController.batchUpdatePositions` | `widgetService.batchUpdatePositions` |

### B.4 AI context providers

| Method | Path | Controller | Notes |
|--------|------|------------|-------|
| GET | `/api/dashboard/ai/context/overview` | `dashboardAIContextController.getDashboardOverview` | Direct Prisma |
| GET | `/api/dashboard/ai/context/quick-stats` | `dashboardAIContextController.getDashboardQuickStats` | Cross-module Prisma aggregate |
| GET | `/api/dashboard/ai/context/widgets` | `dashboardAIContextController.getDashboardWidgets` | Direct Prisma |

Registered in `registerBuiltInModules.ts` under `moduleId: 'dashboard'`.

### B.5 Client API modules

| File | Base path |
|------|-----------|
| `web/src/api/dashboard.ts` | `/api/dashboard` |
| `web/src/api/widget.ts` | `/api/widget` |

---

## C. Server services inventory

| Service | Path | Role | Module-owned? |
|---------|------|------|---------------|
| `dashboardService` | `server/src/services/dashboardService.ts` | Dashboard CRUD, context membership, `ensureBusinessDashboardForUser` | **Primary** |
| `widgetService` | `server/src/services/widgetService.ts` | Widget CRUD, batch positions | **Primary** |
| `sidebarCustomizationService` | `server/src/services/sidebarCustomizationService.ts` | Sidebar prefs in dashboard JSON | **Hybrid** (data module; UI shell) |
| `fileMigrationService` | `server/src/services/fileMigrationService.ts` | File handling on dashboard delete | **Cross-cutting** (Drive-adjacent) |
| `businessWorkspaceSeeder` | `server/src/services/businessWorkspaceSeeder.ts` | Called from `createDashboard` when `businessId` set | **Workspace coupling** |

**Missing canonical services (gaps):**

- `dashboardActivityService` — no activity emissions
- `dashboardAIContextService` — logic inline in controller
- `dashboardAnalyticsService` — aggregation in AI controller + client hooks
- Dedicated widget validation / capability resolution service

---

## D. Prisma models

From `prisma/modules/business/dashboard.prisma`:

| Model | Module-owned data | Cross-cutting role |
|-------|-------------------|-------------------|
| `Dashboard` | `name`, `layout`, `preferences`, `widgets` | **Tenancy anchor** — `businessId`, `householdId`, `institutionId`; relations to `File`, `Conversation`, `AIConversation` |
| `Widget` | `type`, `config`, `position` | Projection instance |
| `RetentionPolicy` | Dashboard retention settings | Compliance adjunct |
| `ComplianceSettings` | Encryption/audit/residency flags | Compliance adjunct |

**Tenancy tension:** The `Dashboard` row is the platform's primary **context binding object** for modules, not only a dashboard product record.

---

## E. Widget inventory (registry)

**Authoritative registry:** `web/src/components/dashboard/widgetRegistry.ts` — **13 types**

| Widget id | moduleId | Category | Contexts |
|-----------|----------|----------|----------|
| chat | chat | communication | all |
| drive | drive | files | all |
| calendar | calendar | productivity | all |
| todo | todo | productivity | all |
| notebook | notebook | productivity | all |
| ai | ai | utility | all (alwaysAvailable) |
| notifications | notifications | utility | all (alwaysAvailable) |
| quickstats | quickstats | utility | all (alwaysAvailable) |
| quicknotes | quicknotes | utility | all (alwaysAvailable) |
| bookmarks | bookmarks | utility | all (alwaysAvailable) |
| activityfeed | activityfeed | utility | all (alwaysAvailable) |
| hr | hr | business | business only |
| scheduling | scheduling | business | business only |

**Legacy / unregistered:** `NotesWidget.tsx` exists but registry uses `notebook`; not mounted in `DashboardClient`.

**Enterprise panels (not grid widgets):** `ExecutiveAnalyticsPanel`, `CrossModuleAnalyticsPanel` inside `EnhancedDashboardModule` — feature-gated business analytics UI with **mock/generated metrics**.

---

## F. Frontend module components

| Component | Role |
|-----------|------|
| `DashboardClient.tsx` | Grid orchestration, edit mode, widget CRUD client |
| `DashboardGrid.tsx` | react-grid-layout engine |
| `WidgetShell.tsx` | Widget chrome |
| `WidgetContentRenderer` | Type → component switch (in navigation/contracts) |
| `WidgetPicker.tsx` | Add widgets (scoped to installed modules) |
| `DashboardHeader.tsx` | Grid header / edit controls |
| `DashboardTemplates.tsx` | Layout templates |
| `DashboardBuildOutModal.tsx` | Initial module selection |
| `DashboardModuleWrapper.tsx` | Enterprise vs showcase routing |
| `useDashboardGrid`, `useDashboardStats` | Client hooks |

**Shell components (out of module scope):** `DashboardLayout.tsx`, `DashboardLayoutInner.tsx`, `DashboardContext.tsx`, `DashboardLayoutWrapper.tsx`.

---

## G. Personalization & settings

| Feature | Storage | API | UI owner |
|---------|---------|-----|----------|
| Widget layout | `Dashboard.layout` + `Widget.position` | PUT dashboard / widget batch | Module |
| Widget config | `Widget.config` | PUT widget | Module |
| Sidebar folders/pins | `Dashboard.preferences.sidebarCustomization` | sidebar-config routes | **Shell renders** |
| Theme (partial) | preferences + localStorage | update dashboard | Mixed |
| Dashboard tabs | Multiple `Dashboard` rows per user | CRUD dashboard | Module + shell tabs |
| Templates | Client-side | — | Module |
| Enterprise views | Client state | — | Module (mock data) |

---

## H. Tenancy & business switching

| Behavior | Implementation |
|----------|----------------|
| Personal dashboards | `userId` + null context FKs |
| Business dashboard per user | `ensureBusinessDashboardForUser`, `createDashboard({ businessId })` |
| Household / educational | Context FK on `Dashboard` row |
| Active dashboard selection | `DashboardContext` (shell) + URL `/dashboard/:id` |
| Business workspace binding | `useEnsureBusinessDashboard`, `BusinessConfigurationContext` |
| Auto-provision on business create | `createDashboard` → `seedBusinessWorkspaceResources` |
| Auto-provision personal calendar | Side effect inside `createDashboard` (Calendar domain leak) |
| Protected deletes | Business/educational dashboards cannot be deleted via API |

---

## I. Functionality attribution

### Belongs to Dashboard module

- Widget grid layout and edit mode
- Widget CRUD and registry
- Dashboard tab CRUD (name, layout, preferences)
- Widget picker and templates
- Dashboard AI context providers (layout/widget summary)
- Global trash integration for `dashboard_tab` type
- Enterprise dashboard panels (product surface — quality issues noted separately)
- `DashboardBuildOutModal` onboarding

### Belongs to Workspace (NOT this audit's implementation scope)

- `PlatformShell` chrome (header, sidebars, rails)
- Module route mounting (`/drive`, `/chat`, …)
- `BusinessWorkspaceContent` switch
- Navigation SSOT (`personalDashboardNavigation.ts`, `businessWorkspaceNavigation.ts`)
- Cross-surface transitions
- `WorkspaceRuntimeScopeBridge`
- Business hub stub (`BusinessWorkspaceHubPanel`)

### Duplicated / blurred

| Duplication | Surfaces | Severity |
|-------------|----------|----------|
| Sidebar customization | Module API + shell UI | Medium — intentional hybrid |
| Quick stats aggregation | `useDashboardStats`, `QuickStatsWidget`, AI `quick-stats` provider | Medium — three paths |
| Business "dashboard" UX | Hub panel vs `EnhancedDashboardModule` vs personal grid | High |
| Dashboard naming | Tenancy entity vs module product | High |
| Activity presentation | `ActivityFeedWidget` vs module activity log vs Analytics | High |

---

## J. Registration & manifest

| Item | Status |
|------|--------|
| `registerBuiltInModules.ts` entry | ✅ `id: 'dashboard'` |
| AI context in manifest | ✅ 3 providers |
| `coreModuleRegistry` | ✅ `id: 'dashboard'`, **`widgets: []`** (registry drift) |
| Permissions in manifest | `dashboard:read`, `dashboard:write` |
| Module notifications metadata | ❌ Not declared |
| `DashboardWorkspaceLanding` | ❌ Missing (business hub uses workspace stub) |

---

## K. Test evidence

| Test | Scope | Count |
|------|-------|-------|
| `dashboard-context.integration.test.ts` | Business membership on create | Partial |
| `activity-feed-dashboard.integration.test.ts` | Activity feed + dashboard scope | Platform |
| `personalDashboardRegistryDrift.test.ts` | Shell registry drift | Shell (includes widget types) |
| `policyEngine.test.ts` | `DASHBOARD_READ` | PE partial |
| Dashboard module operation matrix | — | **Missing** |

---

## L. Determination summary

| Question | Answer |
|----------|--------|
| Legitimate standalone module? | **Yes** — registered, services, APIs, widget product |
| Primarily widget platform? | **Yes** — core value is grid + projections |
| Owns business domain data? | **No** — owns layout/widget instances; aggregates read module data |
| Workspace overlap? | **High on routes/chrome** — WS-L3 archived for shell; module interior separate |

---

**Last updated:** 2026-06-21
