# Dashboard Module — Service Boundary Analysis

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — violations documented, not remediated

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §16, §3; [moduleSpecs.md](../../memory-bank/moduleSpecs.md)

---

## Purpose

Map existing Dashboard services, controller thickness, Prisma usage, API fragmentation, and constitutional violations.

---

## 1. Service layer inventory

| Service | Lines (approx) | Responsibility | Canonical? |
|---------|----------------|----------------|------------|
| `dashboardService.ts` | ~480 | Dashboard CRUD, membership checks, business ensure, delete guards | **Partial** — primary but coupled |
| `widgetService.ts` | ~68 | Widget CRUD, batch positions | **Partial** — thin, no PE/activity |
| `sidebarCustomizationService.ts` | ~360 | Read/write sidebar JSON in preferences | **Partial** — UI data in module service |
| `fileMigrationService` | external | Dashboard delete file handling | **Cross-domain** |
| `businessWorkspaceSeeder` | external | Chat/conversation bootstrap on business dashboard create | **Workspace** — wrong coupling |

### Missing services (expected per File Hub pattern)

| Missing service | Would own |
|-----------------|-----------|
| `dashboardActivityService` | Normalized activity for widget/tab lifecycle |
| `dashboardAIContextService` | Bounded reads for AI providers |
| `dashboardPolicyService` / dual | PE on all mutation paths |
| `dashboardWidgetCapabilityService` | Registry ↔ manifest ↔ install validation |
| `dashboardAnalyticsFacade` | Delegated reads to Analytics capability (not Prisma aggregate in controller) |

---

## 2. Controller analysis

### 2.1 `dashboardController.ts`

| Handler | PE | Service call | Direct Prisma | Activity | Verdict |
|---------|-----|--------------|---------------|----------|---------|
| `getDashboards` | ❌ | ✅ | ❌ | ❌ | **Partial** |
| `createDashboard` | ❌ | ✅ | ❌ | ❌ | **Partial** |
| `getDashboardById` | ✅ `DASHBOARD_READ` | ✅ | ❌ | ❌ | **Best path** |
| `updateDashboard` | ❌ | ✅ | ❌ | ❌ | **Violation** — no PE on write |
| `deleteDashboard` | ❌ | ✅ + fileMigration | ❌ | ❌ | **Partial** — complex orchestration in controller |
| `getDashboardFileSummary` | ❌ | ✅ | ❌ | ❌ | **Partial** |

**Thickness:** `deleteDashboard` is **fat** — switch on `fileAction`, orchestrates migration then delete (should be service-owned workflow).

**Type quality:** `hasUserId(user: any)` — legacy `any` on req.user guard.

### 2.2 `widgetController.ts`

| Handler | PE | Service | Activity |
|---------|-----|---------|----------|
| All CRUD | ❌ | ✅ widgetService | ❌ |

Thin pass-through — **correct shape**, incomplete constitutional envelope (no authorize → execute → emit).

### 2.3 `sidebarController.ts`

| Handler | PE | Service | Notes |
|---------|-----|---------|-------|
| CRUD sidebar config | ❌ | ✅ sidebarCustomizationService | Validates dashboard ownership via service |

### 2.4 `dashboardAIContextController.ts`

| Handler | PE | Direct Prisma | Cross-module reads |
|---------|-----|---------------|-------------------|
| `getDashboardOverview` | ❌ | ✅ dashboard + widgets | ❌ |
| `getDashboardQuickStats` | ❌ | ✅ tasks, conversations, files, notifications | **Yes — aggregates foreign domains** |
| `getDashboardWidgets` | ❌ | ✅ | ❌ |

**Major violation:** AI context controller performs **cross-module aggregation via direct Prisma** without PE on foreign resources, without tenant-scoped dashboard binding on aggregates, without canonical module services.

---

## 3. Direct Prisma usage map

| Location | Models touched | Issue |
|----------|----------------|-------|
| `dashboardService` | Dashboard, Widget, User, Business, Calendar, Household | Calendar **create** on personal dashboard — domain leak |
| `widgetService` | Widget, Dashboard | Acceptable for widget SoR |
| `sidebarCustomizationService` | Dashboard | Acceptable |
| `dashboardAIContextController` | Dashboard, Widget, Task, Conversation, File, Notification | **Cross-module reads in controller** |
| `dashboardController` | — (delegates) | OK |

---

## 4. API fragmentation

| Namespace | Routes | Coherence |
|-----------|--------|-----------|
| `/api/dashboard` | CRUD, sidebar, AI context | Primary module API |
| `/api/widget` | Widget CRUD separate router | **Split namespace** — acceptable but dual client (`dashboard.ts`, `widget.ts`) |

**Client inconsistency:** `web/src/api/dashboard.ts` uses `API_BASE = '/api/dashboard'`; widgets use `/api/widget`. Not user-visible fragmentation but increases drift risk.

**AI routes:** Nested under `/api/dashboard/ai/context/*` — correct module pattern.

**No** `/api/dashboard/widgets` — widgets on separate mount (document as intentional or consolidate in future charter).

---

## 5. Dashboard-specific business logic (in services)

| Logic | Location | Assessment |
|-------|----------|------------|
| Context membership on create | `assertDashboardContextMembership` | ✅ Correct tenant gate |
| Single context FK enforcement | `countContextIds` | ✅ |
| Idempotent business dashboard | findFirst before create | ✅ |
| Personal calendar auto-provision | `createDashboard` | **Leak** — Calendar domain |
| Business workspace seed | post-create hook | **Leak** — Workspace domain |
| Protected delete (business/edu) | `deleteDashboard` | ✅ Product rule |
| Household cascade delete | `deleteDashboard` | ✅ Heavy — household owner check |
| Widget ownership check | `widgetService` via dashboard.userId | ✅ Basic — no PE |

---

## 6. Constitutional violations (document only)

### Blocking-class (trust / authZ)

| ID | Violation | Evidence |
|----|-----------|----------|
| **DASH-V1** | **No PE on dashboard/widget write paths** | `updateDashboard`, widget CRUD, sidebar writes — only `getDashboardById` uses `authorize()` |
| **DASH-V2** | **No module activity emissions** | Zero `emitModuleActivityEvent` for dashboard module in server |
| **DASH-V3** | **AI quick-stats cross-module Prisma without PE** | `dashboardAIContextController.getDashboardQuickStats` |

### Major-class (boundaries / architecture)

| ID | Violation | Evidence |
|----|-----------|----------|
| **DASH-V4** | **Dual widget registry** | `widgetRegistry.ts` vs `coreModuleRegistry` `widgets: []` |
| **DASH-V5** | **Calendar provisioning in dashboardService** | Personal dashboard create → `prisma.calendar.create` |
| **DASH-V6** | **Workspace seeder coupling** | `createDashboard` → `seedBusinessWorkspaceResources` |
| **DASH-V7** | **Tenancy entity conflation** | `Dashboard` model binds files, conversations, widgets |
| **DASH-V8** | **No dashboard module operation matrix** | Unlike L3 modules |
| **DASH-V9** | **Fat delete controller** | File migration orchestration in controller |

### Advisory-class

| ID | Violation | Evidence |
|----|-----------|----------|
| **DASH-V10** | Split `/api/dashboard` vs `/api/widget` | Two routers |
| **DASH-V11** | Sidebar data owned by module, rendered by shell | Hybrid by design — document contract |
| **DASH-V12** | `hasUserId(any)` in controllers | typescript-quality drift |
| **DASH-V13** | Manifest minimal on fresh deploy | Platform standards §0.4 |
| **DASH-V14** | Missing `DashboardWorkspaceLanding` | module-development.mdc hub pattern |

---

## 7. Lifecycle sequence compliance

Required: **authorize → execute → emit activity → notify/realtime**

| Operation | Current sequence | Compliant? |
|-----------|------------------|------------|
| Create dashboard | auth JWT → execute → — | ❌ |
| Update layout | auth JWT → execute → — | ❌ |
| Add widget | auth JWT → execute → — | ❌ |
| Delete widget | auth JWT → execute → — | ❌ |
| Read dashboard | auth JWT → PE (partial) → execute | 🟡 Read only |

---

## 8. Comparison to File Hub reference

| Pattern | File Hub | Dashboard module |
|---------|----------|------------------|
| Canonical `*Service` | ✅ | 🟡 partial |
| Thin controllers | ✅ | 🟡 delete fat; AI fat |
| PE dual-enforcement | ✅ | 🔴 read-only partial |
| Activity service | ✅ | ❌ |
| Domain events | ✅ | ❌ |
| Operation matrix | ✅ | ❌ |
| AI context via service | ✅ | ❌ controller Prisma |

---

## 9. Service boundary recommendation (discovery)

Future phases (not authorized here) should:

1. Extract AI context to `dashboardAIContextService` with bounded delegates to module APIs
2. Add `dashboardActivityService` + emissions on widget/tab mutations
3. Expand PE dual to all write routes
4. Move calendar provision to Calendar module bootstrap hook
5. Decouple workspace seed from dashboard create (workspace lifecycle event)
6. Unify capability resolution (single registry path)

---

**Last updated:** 2026-06-21
