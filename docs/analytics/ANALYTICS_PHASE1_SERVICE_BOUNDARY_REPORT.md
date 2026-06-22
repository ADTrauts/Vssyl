# Analytics Capability Phase 1 — Service Boundary Report

**Program:** Analytics Capability Phase 1 — Federated L2 Trust & Service Boundary  
**Date:** 2026-06-22  
**Status:** Complete

---

## 1. Boundary model (Federated L2)

Platform Analytics Capability **federates** module-owned rollups. It does **not** own Chat, Todo, Calendar, Drive, or Notification source tables for cross-module dashboard summary.

```
┌─────────────────────────────────────────────────────────────┐
│  Consumers (Dashboard facade, Enterprise panels, Workspace)   │
└───────────────────────────┬─────────────────────────────────┘
                            │ GET /api/analytics/*
┌───────────────────────────▼─────────────────────────────────┐
│  analyticsCapabilityService (canonical boundary)              │
│  • PE: evaluateAnalyticsPolicyDual                           │
│  • Activity: analyticsActivityService                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 analyticsDashboard   personal/module      export DTO
 SummaryService       Prisma (owned)       aggregation
        │
        ├── chatAnalyticsService.countUnreadMessagesForDashboardRollup
        ├── todoAnalyticsRollupService.countPendingTasksForDashboardRollup
        ├── calendarVisibilityService.listEventsInRange
        ├── driveVisibilityService.aggregateAccessibleDriveStorageForAIContext
        ├── NotificationService.getUnreadCount
        └── businessAnalyticsService.getBusinessAnalytics (enterprise projection)
```

---

## 2. Violations remediated

| Violation (pre-Phase 1) | Remediation |
|-------------------------|-------------|
| `analyticsDashboardSummaryService` queried `prisma.conversation` / `prisma.task` directly | Replaced with Chat/Todo rollup APIs |
| `analyticsController` inline Prisma for personal/module | Moved to `analyticsCapabilityService` |
| Orphan UI components calling APIs outside registry | Deleted |
| Placeholder domain event subscriber | Removed — false pipeline signal |

---

## 3. Federated rollup contracts

### Chat (FR-01)

- **Owner:** Chat module
- **API:** `countUnreadMessagesForDashboardRollup(userId, dashboardId)`
- **Scope:** Dashboard conversations where user is active participant; unread = messages from others without read receipt
- **Consumer:** `analyticsDashboardSummaryService`

### Todo (FR-02)

- **Owner:** Todo module
- **API:** `countPendingTasksForDashboardRollup(dashboardId)`
- **Scope:** `TODO` + `IN_PROGRESS`, non-trashed, dashboard-scoped tasks
- **Consumer:** `analyticsDashboardSummaryService`

---

## 4. Consumer boundary rules

| Consumer | Rule | Phase 1 status |
|----------|------|----------------|
| `dashboardAnalyticsFacade` | Single HTTP contract to AC-01 | ✅ |
| `ExecutiveAnalyticsPanel` | Enterprise metrics from summary only | ✅ |
| `CrossModuleAnalyticsPanel` | Overview from enterprise rollups; Phase 3 tabs empty | ✅ |
| Business workspace analytics | Business API satellites, not mock | ✅ |

**Prohibited:** Dashboard widgets aggregating `/api/chat/analytics` + todo counts directly for cross-module header stats.

---

## 5. Satellites (unchanged boundary)

These remain **module/domain owned** and are **not** merged into the canonical capability layer in Phase 1:

- `GET /api/chat/analytics` — Chat module
- `GET /api/business/:id/analytics` — Business domain
- Admin Portal operator analytics — Admin Portal program

---

## 6. Verification

| Check | Result |
|-------|--------|
| No `prisma.conversation` / `prisma.task` in `analyticsDashboardSummaryService` | ✅ |
| Controller delegates only to capability service | ✅ |
| Ownership registry lists canonical vs satellite vs consumer | ✅ |
| Orphan components removed | ✅ |

---

**Last updated:** 2026-06-22
