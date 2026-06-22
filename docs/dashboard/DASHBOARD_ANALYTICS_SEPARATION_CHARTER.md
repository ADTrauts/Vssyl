# Dashboard Module — Analytics Separation Charter

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Boundary definition only — **no implementation, no migration**

**Prior:** [DASHBOARD_ANALYTICS_DEPENDENCY_MATRIX.md](./DASHBOARD_ANALYTICS_DEPENDENCY_MATRIX.md), [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## 1. Purpose

Define what Dashboard keeps, what Analytics owns, and transition boundaries for modernization Packages 1–3.

---

## 2. Ownership principles

| Principle | Rule |
|-----------|------|
| **AS-1** | Dashboard owns **composition state** only |
| **AS-2** | Analytics owns **derived cross-module metrics** |
| **AS-3** | Module APIs own **domain summaries** (HR, Scheduling) |
| **AS-4** | Platform activity owns **immutable event feed** (not Analytics warehouse) |
| **AS-5** | Dashboard **consumes** Analytics; never computes rollups in controllers |
| **AS-6** | No mock metrics in Dashboard product paths post-Package 1 |

---

## 3. What Dashboard keeps (answer Q6)

| Asset | Layer |
|-------|-------|
| `Widget` rows (type, config, position) | Data |
| `Dashboard.layout`, `Dashboard.preferences` (non-analytics) | Data |
| `widgetRegistry.ts` | Product |
| Grid UX (`DashboardClient`, `DashboardGrid`, edit mode) | UI |
| Widget picker / templates / build-out | UI |
| AI providers: **overview**, **widgets** (metadata only) | AI context |
| Bookmarks / quick notes widget config | Widget-local SoR |
| Enterprise **shell** chrome (when fed real data) | UI host |
| Sidebar customization JSON API | Data (hybrid render with shell) |
| Global trash `dashboard_tab` type | Platform integration |

---

## 4. What Analytics owns (answer Q5)

| Asset | Current location (violation) |
|-------|---------------------------|
| Cross-module quick stats (messages, tasks, events counts) | `QuickStatsWidget`, `useDashboardStats` |
| AI quick-stats aggregate | `getDashboardQuickStats` |
| Executive BI metrics | `ExecutiveAnalyticsPanel` |
| Cross-module insights | `CrossModuleAnalyticsPanel` |
| Enterprise quick metrics / alerts | `EnhancedDashboardModule` |
| Future tenant rollup warehouse | Not built |
| Domain event subscriber rollups | `analyticsDomainEventSubscriber` placeholder |

**Not Analytics (do not migrate):**

| Asset | Owner |
|-------|-------|
| `/api/activity-feed` | Platform activity |
| HR / scheduling widget summaries | HR / Scheduling modules |
| Admin Portal operator metrics | Admin Portal |

---

## 5. Transition boundaries

### 5.1 Phase boundary map

```
┌─────────────────────────────────────────────────────────────┐
│ PACKAGE 1 — Trust Foundation                                 │
│ • Remove mock/placeholder (B4, B5) — no Analytics build yet  │
│ • quickstats: empty/loading state OR hide widget             │
│ • A-02: disable or return metadata-only stub                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PACKAGE 3 — Analytics Decoupling                               │
│ • Introduce dashboardAnalyticsFacade (read-only)               │
│ • Facade calls /api/analytics/* or new capability endpoint     │
│ • quickstats + useDashboardStats + A-02 consume facade         │
│ • Enterprise panels consume facade OR remain feature-gated     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Interface contract (charter — not implemented)

**`GET /api/analytics/dashboard-summary?dashboardId=`** (or extend existing `/api/analytics/personal`)

| Field | Source |
|-------|--------|
| `pendingTasks` | Todo module rollup (tenant-scoped) |
| `unreadMessages` | Chat rollup |
| `upcomingEvents` | Calendar rollup |
| `storageUsedPercent` | Drive rollup |

Dashboard module **must not** import Prisma models for Task, File, Conversation in AI or widget paths after Package 3.

### 5.3 Widget disposition

| Widget | Package 1 | Package 3 |
|--------|-----------|-----------|
| quickstats | Empty state / "unavailable" | Analytics facade |
| activityfeed | Empty on failure (no placeholder) | Unchanged — activity API |
| enterprise panels | Feature-gate off OR demo label | Analytics facade or off |
| hr, scheduling | Unchanged | Unchanged — module APIs |
| drive | Remove random share (hygiene) | Optional Drive API for share truth |

---

## 6. Analytics scope lock dependency

| Dashboard work | Blocked without Analytics scope lock? |
|----------------|--------------------------------------|
| Remove mocks (Package 1) | **No** |
| PE + activity (Package 1) | **No** |
| quickstats real data (Package 3) | **Yes** — need capability owner |
| L3 claim "analytics honest" | **Yes** |

**Charter:** Analytics scope lock is a **parallel governance track** — Dashboard Package 3 may use **facade stub returning empty** until Analytics capability charter completes.

---

## 7. Finding closure

| Finding | Separation action |
|---------|-------------------|
| **DASH-B3** | Remove A-02 Prisma; Package 1 stub → Package 3 facade |
| **DASH-B4** | Activity feed stays platform activity — not Analytics |
| **DASH-B5** | Enterprise metrics → Analytics or feature-off |
| **DASH-M6** | quickstats → Package 3 |

---

## 8. Forbidden after charter adoption

- Dashboard controller Prisma on `task`, `file`, `conversation`, `notification`
- New Dashboard-native rollup tables
- Storing analytics summaries in module activity log
- Re-introducing placeholder/mock metrics without demo flag

---

**Last updated:** 2026-06-21
