# Dashboard Module — Analytics Dependency Matrix

**Program:** Dashboard Module Wave 3 — Phase 0B Constitutional Operations Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only

**Prior authority:** [DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md](./DASHBOARD_ANALYTICS_BOUNDARY_ANALYSIS.md), [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## 1. Ownership classes

| Class | Definition |
|-------|------------|
| **Dashboard-owned** | Composition metadata, layout, widget-local config, widget inventory meta |
| **Analytics-owned** | Cross-module rollups, trends, KPIs, executive BI, derived metrics |
| **Hybrid** | Dashboard hosts UI; Analytics (or module) owns data contract |
| **Module-owned** | Domain summary via module API (not Analytics capability) |
| **Platform activity** | Immutable activity feed reads — not Analytics SoR |

---

## 2. Authoritative matrix — registry widgets

| Widget | Dashboard-owned | Analytics-owned | Hybrid | Module-owned | Platform activity | Primary owner |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| chat | | | ✅ host | ✅ data | | **Module** |
| drive | | | ✅ host | ✅ data | | **Module** |
| calendar | | | ✅ host | ✅ data | | **Module** |
| todo | | | ✅ host | ✅ data | | **Module** |
| notebook | | | ✅ host | ✅ data | | **Module** |
| ai | | | ✅ host | ✅ data | | **Module** |
| notifications | | | ✅ host | ✅ data | | **Platform/Module** |
| quickstats | | ✅ rollup | ✅ **wrong split today** | 🟡 sources | | **Analytics** (should consume) |
| quicknotes | ✅ config | | | | | **Dashboard** |
| bookmarks | ✅ config | | | | | **Dashboard** |
| activityfeed | | | ✅ host | | ✅ read | **Platform activity** |
| hr | | | ✅ host | ✅ summary API | | **Module (HR)** |
| scheduling | | | ✅ host | ✅ summary API | | **Module (Scheduling)** |

---

## 3. Authoritative matrix — non-widget surfaces

| Surface | Dashboard | Analytics | Hybrid | Module | Notes |
|---------|:---------:|:---------:|:------:|:------:|-------|
| AI `overview` provider | ✅ | | | | Widget counts/types |
| AI `widgets` provider | ✅ | | | | Inventory meta |
| AI `quick-stats` provider | | ✅ | ✅ | 🟡 | **Analytics** — cross-module Prisma |
| `useDashboardStats` | | ✅ | ✅ | 🟡 | Duplicate of quickstats |
| `EnhancedDashboardModule` | | ✅ | ✅ | | **Analytics** — mock BI |
| `ExecutiveAnalyticsPanel` | | ✅ | | | **Analytics** |
| `CrossModuleAnalyticsPanel` | | ✅ | | | **Analytics** |
| `/api/activity-feed` consumer | | | | | **Platform activity** |
| Admin Portal analytics | | ✅ | | | Out of module scope |

---

## 4. Widgets belonging to Analytics (answer Q7)

**Primary Analytics-owned (must delegate, not compute in Dashboard):**

| # | Surface | Why |
|---|---------|-----|
| 1 | **quickstats** widget | Cross-module KPI rollup |
| 2 | **useDashboardStats** hook | Same rollup at grid level |
| 3 | AI **quick-stats** provider | Server-side aggregate |
| 4 | **ExecutiveAnalyticsPanel** | Executive BI |
| 5 | **CrossModuleAnalyticsPanel** | Cross-module insights |
| 6 | **EnhancedDashboardModule** metrics/alerts | Enterprise analytics product |

**Not Analytics (common confusion):**

| Surface | Actual owner |
|---------|--------------|
| activityfeed | **Platform activity read** — not Analytics warehouse |
| hr / scheduling widgets | **Module domain** summaries |
| AI overview/widgets providers | **Dashboard composition meta** |

**Count: 6 surfaces** belong to Analytics capability (not Dashboard SoR).

---

## 5. Dependency graph

```
                    ┌─────────────────────┐
                    │ Dashboard Module     │
                    │ (composition SoR)    │
                    └──────────┬──────────┘
                               │ hosts
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Module APIs      │  │ Platform Activity│  │ Analytics Cap.   │
│ chat,drive,todo… │  │ /api/activity-feed│  │ (scope TBD)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         ▲                     ▲                     ▲
         │                     │                     │
    hr, scheduling          activityfeed         quickstats, enterprise
    widgets ✅              hybrid host          ❌ wrong owner today
```

---

## 6. Consumption policy (constitutional)

| Pattern | Allowed | Forbidden |
|---------|---------|-----------|
| Widget calls `/api/{module}/...` | ✅ | |
| Widget calls `/api/analytics/...` (future) | ✅ | |
| Widget/client aggregates 2+ module APIs | | ❌ — use Analytics facade |
| Dashboard controller Prisma on foreign models | | ❌ |
| Mock metrics in production UI | | ❌ |
| Activity feed placeholder on failure | | ❌ |

---

## 7. Sequencing dependency

| Dashboard modernization step | Blocked on Analytics? |
|------------------------------|----------------------|
| PE + activity on widget CRUD | **No** |
| Remove ActivityFeed placeholder | **No** |
| Remove enterprise mock panels | **No** (can feature-off) |
| QuickStats delegation | **Yes** — scope lock or thin facade |
| AI quick-stats rewrite | **Yes** — same facade |
| L3 analytics honesty claim | **Yes** — Analytics capability L2 minimum |

---

**Last updated:** 2026-06-21
