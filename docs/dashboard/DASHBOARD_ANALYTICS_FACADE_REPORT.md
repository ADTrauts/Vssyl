# Dashboard Module — Analytics Facade Report

**Program:** Dashboard Module Wave 3 — Package 3  
**Date:** 2026-06-21

---

## 1. Purpose

`dashboardAnalyticsFacade` is the **sole Dashboard-module entry point** for cross-module analytics rollups. Dashboard hosts widgets; Analytics Capability owns data.

**Path:** `web/src/lib/dashboardAnalyticsFacade.ts`

---

## 2. API surface

| Function | Role |
|----------|------|
| `fetchDashboardAnalyticsSummary(token, dashboardId)` | Primary read — delegates to `/api/analytics/dashboard-summary` |
| `fetchEnterpriseAnalyticsProjection(token, dashboardId)` | Enterprise subsection of summary |
| `toDashboardHeaderStats(summary)` | Maps summary for `useDashboardStats` / header |
| `toQuickStatsDisplay(summary)` | Maps summary for `QuickStatsWidget` |
| `DEGRADED_DASHBOARD_SUMMARY` | Static degraded template (null metrics) |

---

## 3. Consumers

| Consumer | File | Data owner |
|----------|------|------------|
| QuickStats widget | `QuickStatsWidget.tsx` | Analytics (via facade) |
| Grid header stats | `useDashboardStats.ts` | Analytics (via facade) |
| Executive panel | `ExecutiveAnalyticsPanel.tsx` | Analytics `enterprise` |
| Cross-module panel | `CrossModuleAnalyticsPanel.tsx` | Analytics `enterprise.moduleRollups` |
| Enhanced module shell | `EnhancedDashboardModule.tsx` | Analytics `enterprise.metrics` |

---

## 4. Strict degraded mode (K3-03)

| Rule | Implementation |
|------|----------------|
| No client module API fallback | Removed chat/todo/calendar imports from consumers |
| No fabricated values | Removed `storageUsedPercent: 23` |
| On API failure | `DEGRADED_DASHBOARD_SUMMARY` — null metrics, `degraded: true` |
| UI honesty | QuickStats shows `—` for null; banner when degraded |

---

## 5. QuickStats reclassification (K3-04)

| Role | Owner |
|------|-------|
| Widget chrome, config, grid placement | **Dashboard** (`moduleId: 'dashboard'`) |
| Rollup metrics | **Analytics** (`capabilityId: 'analytics'`) |

Registry: `web/src/components/dashboard/widgetRegistry.ts`

---

## 6. Forbidden patterns (post-P3)

- `Promise.allSettled` on chat + todo + calendar in Dashboard widgets
- Hardcoded KPI placeholders
- Re-introducing A-02 metadata stub without analytics backend

---

**Last updated:** 2026-06-21
