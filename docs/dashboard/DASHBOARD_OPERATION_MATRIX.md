# Dashboard Module — Operation Matrix

**Program:** Dashboard Module Wave 3 — Phase 0B Constitutional Operations Audit  
**Assessment date:** 2026-06-21  
**Module id:** `dashboard`  
**Status:** Discovery only — governance record; **not** certification execution

**Scope:** Dashboard **module** HTTP/API/service operations and product mutations. **Excludes** Reference Workspace shell orchestration (WS-L3 archived).

**Related:** [DASHBOARD_REALITY_ASSESSMENT.md](./DASHBOARD_REALITY_ASSESSMENT.md), [PERSONAL_DASHBOARD_OPERATION_MATRIX.md](../architecture/audits/PERSONAL_DASHBOARD_OPERATION_MATRIX.md) (shell rows only)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant — constitutional requirement met today |
| **P** | Partial — works; incomplete PE / activity / service boundary |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Class:** Create · Read · Update · Delete · Execute · Share · Personalize · Configure

**Actor:** `User` · `System` · `Admin` (platform admin — out of module scope unless noted)

**Req columns:** Constitutional **requirement** (R) vs **today** (T)

---

## Summary counts

| Metric | Count |
|--------|------:|
| **Total operations inventoried** | **42** |
| Require PE (constitutional) | **24** |
| Require activity (constitutional) | **16** |
| Require domain event (constitutional) | **8** |
| PE compliant today | **1** |
| Activity compliant today | **0** |
| Matrix rows **C** | **4** |
| Matrix rows **P** | **22** |
| Matrix rows **N** | **16** |

---

## A. Dashboard tab lifecycle

| ID | Operation | Class | Actor | Owner | Data source | Service | Controller | PE R/T | Act R/T | DE R/T | Status |
|----|-----------|-------|-------|-------|-------------|---------|------------|--------|---------|--------|--------|
| D-01 | List all user dashboards | Read | User | Dashboard | `Dashboard` | `dashboardService.getAllUserDashboards` | `getDashboards` | Yes / **No** | No / — | No / — | **N** |
| D-02 | Auto-create default personal dashboard | Create | System | Dashboard | `Dashboard` | `dashboardService.createDashboard` | `getDashboards` (inline) | Yes / **No** | Yes / **No** | Optional / **No** | **N** |
| D-03 | Create dashboard tab | Create | User | Dashboard | `Dashboard` | `dashboardService.createDashboard` | `createDashboard` | Yes / **No** | Yes / **No** | Yes / **No** | **N** |
| D-04 | Get dashboard by id | Read | User | Dashboard | `Dashboard`+`Widget` | `dashboardService.getDashboardById` | `getDashboardById` | Yes / **Yes** | No / — | No / — | **P** |
| D-05 | Update dashboard (name, layout, preferences) | Update | User | Dashboard | `Dashboard` | `dashboardService.updateDashboard` | `updateDashboard` | Yes / **No** | Yes / **No** | Optional / **No** | **N** |
| D-06 | Delete dashboard tab | Delete | User | Dashboard | `Dashboard` | `dashboardService.deleteDashboard` | `deleteDashboard` | Yes / **No** | Yes / **No** | Yes / **No** | **N** |
| D-07 | Delete dashboard with file migration | Execute | User | Dashboard+Drive | `Dashboard`, `File` | `fileMigrationService` + delete | `deleteDashboard` | Yes / **No** | Yes / **No** | Optional / **No** | **N** |
| D-08 | Get dashboard file summary | Read | User | Drive-adjacent | `File`, `Folder` | `fileMigrationService` | `getDashboardFileSummary` | Yes / **No** | No / — | No / — | **N** |
| D-09 | Ensure business dashboard for user | Create | System/User | Dashboard | `Dashboard` | `dashboardService.ensureBusinessDashboardForUser` | *(called by modules)* | Yes / **P** | Yes / **No** | Yes / **No** | **P** |
| D-10 | Soft-trash dashboard tab | Delete | User | Platform trash | `Dashboard.trashedAt` | `trashController` | `trashController` | Yes / **No** | Yes / **No** | Optional / **No** | **N** |
| D-11 | Restore trashed dashboard tab | Update | User | Platform trash | `Dashboard` | `trashController` | `trashController` | Yes / **No** | Yes / **No** | No / — | **N** |
| D-12 | Permanent purge dashboard tab | Delete | User | Platform trash | `Dashboard` | `trashController` | `trashController` | Yes / **No** | Yes / **No** | No / — | **N** |

**Side effects on D-03 (documented violations):**

- Personal create → Calendar auto-provision (`dashboardService`) — Calendar domain leak
- Business create → `seedBusinessWorkspaceResources` — Workspace coupling

---

## B. Widget lifecycle

| ID | Operation | Class | Actor | Owner | Data source | Service | Controller | PE R/T | Act R/T | DE R/T | Status |
|----|-----------|-------|-------|-------|-------------|---------|------------|--------|---------|--------|--------|
| W-01 | Add widget to grid | Create | User | Dashboard | `Widget` | `widgetService.createWidget` | `createWidget` | Yes / **No** | Yes / **No** | Optional / **No** | **N** |
| W-02 | Update widget (type, config, position) | Update | User | Dashboard | `Widget` | `widgetService.updateWidget` | `updateWidget` | Yes / **No** | Yes / **No** | No / — | **N** |
| W-03 | Remove widget | Delete | User | Dashboard | `Widget` | `widgetService.deleteWidget` | `deleteWidget` | Yes / **No** | Yes / **No** | No / — | **N** |
| W-04 | Batch update widget positions | Execute | User | Dashboard | `Widget.position` | `widgetService.batchUpdatePositions` | `batchUpdatePositions` | Yes / **No** | Yes / **No** | No / — | **N** |
| W-05 | Apply dashboard template | Execute | User | Dashboard | `Widget` (multi) | Client + W-01/W-04 | `DashboardClient` | Yes / **No** | Yes / **No** | No / — | **N** |
| W-06 | Build-out modal initial widgets | Execute | User | Dashboard | `Widget` | Client + W-01 | `DashboardClient` | Yes / **No** | Yes / **No** | No / — | **N** |
| W-07 | Widget picker eligibility check | Read | User | Dashboard | `widgetRegistry` + installs | Client | `WidgetPicker` | No / — | No / — | No / — | **C** |

---

## C. Personalization & configuration

| ID | Operation | Class | Actor | Owner | Data source | Service | Controller | PE R/T | Act R/T | DE R/T | Status |
|----|-----------|-------|-------|-------|-------------|---------|------------|--------|---------|--------|--------|
| S-01 | Get sidebar customization | Read | User | Dashboard | `Dashboard.preferences` | `sidebarCustomizationService.getSidebarConfig` | `getSidebarConfig` | Yes / **No** | No / — | No / — | **N** |
| S-02 | Save sidebar customization | Personalize | User | Dashboard | `Dashboard.preferences` | `sidebarCustomizationService.saveSidebarConfig` | `saveSidebarConfig` | Yes / **No** | Yes / **No** | No / — | **N** |
| S-03 | Update sidebar customization | Personalize | User | Dashboard | `Dashboard.preferences` | `sidebarCustomizationService.saveSidebarConfig` | `updateSidebarConfig` | Yes / **No** | Yes / **No** | No / — | **N** |
| S-04 | Reset sidebar customization | Configure | User | Dashboard | `Dashboard.preferences` | `sidebarCustomizationService.resetSidebarConfig` | `resetSidebarConfig` | Yes / **No** | Yes / **No** | No / — | **N** |
| S-05 | Update widget-local config (bookmarks, notes) | Configure | User | Dashboard | `Widget.config` | `widgetService.updateWidget` | via W-02 | Yes / **No** | Optional / **No** | No / — | **P** |
| S-06 | Enter/exit grid edit mode | Configure | User | Dashboard | Client state | — | `DashboardClient` | No / — | No / — | No / — | **C** |

**Note:** S-01–S-04 JSON is **module-owned**; UI is **shell-rendered** — documented hybrid (DASH-A2).

---

## D. AI context providers

| ID | Operation | Class | Actor | Owner | Data source | Service | Controller | PE R/T | Act R/T | DE R/T | Status |
|----|-----------|-------|-------|-------|-------------|---------|------------|--------|---------|--------|--------|
| A-01 | AI context — dashboard overview | Read | User/AI | Dashboard | `Dashboard`, `Widget` | *(inline)* | `getDashboardOverview` | Yes / **No** | No / — | No / — | **N** |
| A-02 | AI context — quick stats aggregate | Read | User/AI | **Analytics leak** | Task, File, Chat, Notification | *(inline Prisma)* | `getDashboardQuickStats` | Yes / **No** | No / — | No / — | **N** |
| A-03 | AI context — widget summary | Read | User/AI | Dashboard | `Dashboard`, `Widget` | *(inline)* | `getDashboardWidgets` | Yes / **No** | No / — | No / — | **N** |

---

## E. Client read / execute (no dedicated API)

| ID | Operation | Class | Actor | Owner | Data source | Service | Controller | PE R/T | Act R/T | DE R/T | Status |
|----|-----------|-------|-------|-------|-------------|---------|------------|--------|---------|--------|--------|
| C-01 | Load widget grid | Read | User | Dashboard | GET D-04 | Client | `DashboardClient` | Via D-04 | No / — | No / — | **P** |
| C-02 | Refresh header stats | Read | User | Analytics leak | Chat, Todo, Calendar APIs | `useDashboardStats` | hook | Via module APIs / **No** | No / — | No / — | **P** |
| C-03 | Load enterprise dashboard | Read | User | **Untrusted** | Client mock | — | `EnhancedDashboardModule` | Yes / **No** | No / — | No / — | **N** |
| C-04 | Enterprise showcase | Read | User | Marketing | Static/showcase | — | `DashboardEnterpriseShowcase` | No / — | No / — | No / — | **P** |
| C-05 | Federated search — dashboard | Read | User | Platform search | Search index | `searchController` | platform | Yes / **P** | No / — | No / — | **P** |

---

## F. Share operations

| ID | Operation | Class | Status | Notes |
|----|-----------|-------|--------|-------|
| X-01 | Share dashboard tab with another user | Share | **—** | Not implemented |
| X-02 | Share widget configuration | Share | **—** | Not implemented |
| X-03 | Drive widget upload from grid | Execute | **P** | Delegates to Drive API — module-owned mutation |

No Share-class operations are first-class Dashboard module features today.

---

## G. Widget projection reads (hosted — module interior)

These are **not** Dashboard module HTTP operations; documented for matrix completeness and trust cross-ref.

| ID | Operation | Class | Widget | Module API | Status |
|----|-----------|-------|--------|------------|--------|
| P-01 | Render chat preview | Read | chat | `/api/chat` | **C** |
| P-02 | Render drive preview | Read | drive | Drive API | **P** (mock share fields) |
| P-03 | Render calendar preview | Read | calendar | Calendar API | **C** |
| P-04 | Render todo preview | Read | todo | Todo API | **C** |
| P-05 | Render notebook preview | Read | notebook | Notebook API | **C** |
| P-06 | Render notifications | Read | notifications | Notifications API | **C** |
| P-07 | Render activity feed | Read | activityfeed | `/api/activity-feed` | **N** (placeholder fallback) |
| P-08 | Render quick stats | Read | quickstats | Multi-module client | **N** (analytics overlap) |
| P-09 | Render HR summary | Read | hr | `/api/hr/dashboard-summary` | **C** |
| P-10 | Render scheduling summary | Read | scheduling | `/api/scheduling/dashboard-summary` | **C** |
| P-11 | Render AI widget | Read | ai | AI module | **C** |
| P-12 | Local bookmarks/notes | Configure | bookmarks, quicknotes | `Widget.config` | **C** |

---

## H. Constitutional requirement summary

### Policy Engine (24 operations require PE)

All **Create, Update, Delete, Execute, Personalize** rows (D-02–D-12 except protected-delete guards, W-01–W-06, S-01–S-05, A-01–A-03, C-03) plus sensitive **Read** rows (D-01, D-04, D-08, C-05).

**Today:** D-04 read-by-id only → **1/24 compliant (4%)**

### Module activity (16 operations require activity)

All successful **mutations** that change dashboard or widget persisted state: D-02, D-03, D-05, D-06, D-07, D-09, D-10, D-11, D-12, W-01–W-06, S-02–S-04.

**Today:** **0/16 compliant (0%)**

### Domain events (8 operations recommend DE)

High-signal lifecycle: D-03 create tab, D-06/D-07 delete, D-09 ensure business, W-01 add widget, W-03 remove widget, business dashboard seed boundary, first widget on empty grid.

**Today:** **0/8 emitted from dashboard module**

---

## I. Row status rollup (module HTTP + mutations only — IDs D/S/W/A/C core)

| Status | Count | % |
|--------|------:|--:|
| **C** | 4 | 10% |
| **P** | 22 | 52% |
| **N** | 16 | 38% |

**L2 threshold (reference):** majority **P** with zero **N** on blocking rows — **not met**.

---

## J. Blocking finding cross-reference

| Finding | Matrix rows |
|---------|-------------|
| DASH-B1 | All Act R/T = No mutation rows |
| DASH-B2 | All PE R/T gaps on writes |
| DASH-B3 | A-02, C-02, P-08 |
| DASH-B4 | P-07 |
| DASH-B5 | C-03, enterprise panels |

---

**Last updated:** 2026-06-21
