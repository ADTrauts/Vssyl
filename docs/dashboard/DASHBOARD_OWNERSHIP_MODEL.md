# Dashboard Module — Ownership Model

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only

**Authority:** [WORKSPACE_OWNERSHIP_MODEL.md](../workspace/WORKSPACE_OWNERSHIP_MODEL.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1

---

## Executive model

The Dashboard module is a **widget composition product** mounted inside **Reference Workspace shells** (WS-L3 archived). It owns **layout and projection chrome**, not domain SoR for Chat, Drive, HR, or Analytics.

```
┌──────────────────────────────────────────────────────────────┐
│ Workspace Shell (WS-L3 · ARCHIVED — do not reopen)            │
│ PlatformShell · navigation SSOT · module mount · scope bridge │
└────────────────────────────┬─────────────────────────────────┘
                             │ hosts
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Dashboard Module (L1 · Wave 3 target)                         │
│ Grid · widget registry · layout persistence · widget CRUD     │
└────────────────────────────┬─────────────────────────────────┘
                             │ projects
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Business Modules (L3) — Chat, Drive, Todo, HR, …              │
│ Domain SoR · module APIs · module activity                    │
└──────────────────────────────────────────────────────────────┘
                             ▲
                             │ derived reads (future)
┌──────────────────────────────────────────────────────────────┐
│ Platform Analytics Capability (L1 · scope TBD)                │
└──────────────────────────────────────────────────────────────┘
```

---

## Ownership matrix

| Concern | Owner | SoR / artifact | Dashboard role |
|---------|-------|----------------|----------------|
| **Shell chrome** | Workspace Shell | `PlatformShell`, layouts | None |
| **Module routing** | Workspace Shell | `personalDashboardNavigation`, business switch | None |
| **Widget grid UI** | Dashboard Module | `DashboardClient`, `DashboardGrid` | **Owner** |
| **Widget registry** | Dashboard Module | `widgetRegistry.ts` | **Owner** |
| **Widget instances** | Dashboard Module | `Widget` model, `widgetService` | **Owner** |
| **Dashboard tabs** | Dashboard Module | `Dashboard` model (product fields) | **Owner** |
| **Tenancy binding** | Platform (kernel-adjacent) | `Dashboard.businessId` etc. | **Shared entity** — not pure module |
| **Sidebar customization data** | Dashboard Module (storage) | `preferences.sidebarCustomization` | **Owner of JSON** |
| **Sidebar customization UI** | Workspace Shell | `DashboardLayoutInner`, modals | **Renderer only** |
| **Module widget interiors** | Source modules | `/api/chat`, `/api/drive`, … | **Consumer/host** |
| **Quick stats / aggregates** | **Split (defect)** | Client hooks, AI provider | Should → Analytics capability |
| **Activity feed widget** | **Split** | `/api/activity-feed` (platform) | Host; not owner |
| **Enterprise analytics panels** | **Split (defect)** | `EnhancedDashboardModule` mock | Should → Analytics capability |
| **Operator metrics** | Admin Portal | `adminAnalyticsService` | None |
| **HR/scheduling summaries** | HR / Scheduling modules | `/api/hr/dashboard-summary` etc. | Widget consumer |
| **File migration on delete** | Drive-adjacent | `fileMigrationService` | Orchestrates on delete |
| **Business workspace seed** | Workspace | `businessWorkspaceSeeder` | **Coupling** via `createDashboard` |
| **Global trash (tabs)** | Platform + Dashboard | `trashController` `dashboard_tab` | Module entity type |
| **AI dashboard context** | Dashboard Module | AI providers | **Owner** (implementation quality gaps) |

---

## Dashboard responsibilities

### In scope (module owns)

1. Widget type registry and picker eligibility rules
2. Grid layout persistence (`layout`, `Widget.position`)
3. Widget instance lifecycle (create, update, delete, batch position)
4. Dashboard tab CRUD (personal; protected business/educational/household)
5. Dashboard-scoped preferences (non-shell theme/view settings)
6. Widget shell chrome (`WidgetShell`) and edit mode
7. Module AI context for layout/widget inventory
8. Templates and build-out onboarding UX
9. Feature-gated enterprise dashboard **presentation** (not metric SoR)

### Out of scope (non-dashboard)

1. PlatformShell geometry and header/tabs chrome (Workspace)
2. Installed-module gating for business (Business Configuration)
3. Module interiors and domain CRUD (each module)
4. Cross-surface navigation (Reference Workspace)
5. Operator/platform analytics (Admin Portal)
6. Cross-module rollup warehouse (Platform Analytics Capability)
7. Domain-specific analytics (HR, Place, Chat analytics services)
8. Policy Engine platform (Dashboard consumes PE on read path only today)

---

## Data ownership

| Data | Owner | Dashboard stores? | Dashboard mutates? |
|------|-------|-------------------|-------------------|
| Widget layout/positions | Dashboard | ✅ | ✅ |
| Widget config JSON | Dashboard | ✅ | ✅ |
| Dashboard name/preferences | Dashboard | ✅ | ✅ |
| Chat messages | Chat | ❌ | ❌ |
| Files | Drive | ❌ (scoped by dashboardId FK on platform) | ❌ |
| Tasks | Todo | ❌ | ❌ |
| Activity events | Platform / modules | ❌ | ❌ |
| Analytics rollups | Analytics capability | ❌ | ❌ |
| Sidebar folder structure | Dashboard prefs JSON | ✅ | ✅ (via API) |
| Bookmarks / quick notes | Widget config (local) | ✅ in widget.config | ✅ client-side |
| Enterprise metrics | **Unowned mock** | ❌ | ❌ (client mock) |

**Rule:** Dashboard owns **composition state** only. Domain data remains in source modules.

---

## UI ownership

| UI surface | Personal | Business | Owner |
|------------|----------|----------|-------|
| Widget grid | `/dashboard/:id` | Rarely (enterprise path) | Dashboard module |
| Hub overview cards | — | `BusinessWorkspaceHubPanel` | **Workspace stub** |
| Enterprise analytics views | — | `EnhancedDashboardModule` | Dashboard module (should delegate reads) |
| Sidebar chrome | `DashboardLayoutInner` | `DashboardLayoutWrapper` | Workspace shell |
| Widget interiors | `web/src/components/widgets/*` | Same | Module projections |
| Module full pages | `/drive`, etc. | `/business/.../workspace/*` | Modules via shell |

---

## Widget ownership

**Principle:** *Module = capability; widget = projection* ([WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md))

| Layer | Owner |
|-------|-------|
| Widget type definition | Dashboard module (`widgetRegistry`) |
| Widget instance record | Dashboard module (`Widget` table) |
| Widget React component | Dashboard module hosts; **domain logic** in source module APIs |
| Widget config schema | Per-widget (module-aligned) |
| Escalation to full module | Workspace navigation helpers + module routes |

---

## Personal vs business ownership

| Dimension | Personal | Business |
|-----------|----------|----------|
| Primary grid surface | ✅ `/dashboard/:id` | 🟡 Enterprise feature-gated only |
| Dashboard row | User-owned personal tabs | Per-user business context row |
| Widget contexts | All non-business-filtered types | HR, scheduling + shared types |
| Hub alternative | N/A (grid is home) | Workspace hub stub |
| Sidebar prefs | Personal shell + tab-scoped JSON | Business shell + customization context |
| Seeding | Default personal dashboard | `businessWorkspaceSeeder` on create |

---

## Adjacent domain boundaries

### Workspace Shell

- **Certified:** WS-L3 WITH FINDINGS (archived)
- **Relationship:** Orchestrates mount; does not own widget grid
- **Duplication risk:** Sidebar UI vs sidebar JSON API

### Analytics Capability

- **Relationship:** Supplies derived metrics; Dashboard hosts `quickstats`, `activityfeed`, enterprise panels
- **Rule:** Dashboard must not become analytics SoR ([moduleSpecs.md](../../memory-bank/moduleSpecs.md) Activity vs Analytics)

### Admin Portal

- **Relationship:** Operator analytics only — no product dashboard overlap
- **Evidence:** [ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md](../architecture/audits/ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md)

### Business Modules

- **Relationship:** Widgets call module APIs (`/api/hr/dashboard-summary`, chat, todo, calendar)
- **Rule:** Mutations never bypass module services from widget code

---

## Constitutional invariant

> Workspace **orchestrates** module mounts; Dashboard **module** owns widget registry and grid semantics.

Violations today: business hub stub, mock enterprise analytics, cross-module Prisma in AI quick-stats provider, calendar side effect in `createDashboard`.

---

**Last updated:** 2026-06-21
