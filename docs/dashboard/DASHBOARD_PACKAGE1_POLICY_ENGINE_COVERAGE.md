# Dashboard Module — Package 1 Policy Engine Coverage

**Program:** Dashboard Module Wave 3 — Package 1 Trust Foundation  
**Date:** 2026-06-21

---

## Policy actions implemented

| Action | Handler | Status |
|--------|---------|--------|
| `dashboard:read` | `authorizeDashboardRead` + `authorizeDashboardList` | ✅ |
| `dashboard:write` | `authorizeDashboardWrite` | ✅ |
| `dashboard:delete` | `authorizeDashboardDelete` | ✅ |

**Dual enforcement:** `server/src/auth/dashboardPolicyDual.ts`

---

## Coverage matrix (24 paths)

| Op | Operation | Policy action | Enforced in |
|----|-----------|---------------|-------------|
| D-01 | List dashboards | `dashboard:read` (list) | `dashboardController.getDashboards` |
| D-02 | Ensure default personal | `dashboard:write` (create) | `dashboardController.ensureDefaultPersonalDashboard` |
| D-03 | Create dashboard | `dashboard:write` (create) | `dashboardController.createDashboard` |
| D-04 | Get by id | `dashboard:read` | `dashboardController.getDashboardById` |
| D-05 | Update dashboard | `dashboard:write` | `dashboardController.updateDashboard` |
| D-06 | Delete tab | `dashboard:delete` | `dashboardController.deleteDashboard` |
| D-07 | Delete + files | `dashboard:delete` | `dashboardController.deleteDashboard` |
| D-08 | File summary | `dashboard:read` | `dashboardController.getDashboardFileSummary` |
| D-09 | Ensure business | `dashboard:write` (create) | Via `createDashboard` / internal membership gate* |
| D-10 | Soft-trash tab | `dashboard:write` | `dashboardTrashService.softTrashDashboardTab` |
| D-11 | Restore tab | `dashboard:write` | `dashboardTrashService.restoreDashboardTab` |
| D-12 | Purge tab | `dashboard:delete` | `dashboardTrashService.permanentlyDeleteDashboardTab` |
| W-01 | Add widget | `dashboard:write` | `widgetController.createWidget` |
| W-02 | Update widget | `dashboard:write` | `widgetController.updateWidget` |
| W-03 | Remove widget | `dashboard:write` | `widgetController.deleteWidget` |
| W-04 | Batch positions | `dashboard:write` | `widgetController.batchUpdatePositions` |
| W-05 | Apply template | `dashboard:write` | Client → W-01 loop |
| W-06 | Build-out widgets | `dashboard:write` | Client → W-01 loop |
| S-01 | Get sidebar | `dashboard:read` | `sidebarController.getSidebarConfig` |
| S-02 | Save sidebar | `dashboard:write` | `sidebarController.saveSidebarConfig` |
| S-03 | Update sidebar | `dashboard:write` | `sidebarController.updateSidebarConfig` |
| S-04 | Reset sidebar | `dashboard:write` | `sidebarController.resetSidebarConfig` |
| S-05 | Widget config | `dashboard:write` | `widgetController.updateWidget` |
| A-01 | AI overview | `dashboard:read` | `dashboardAIContextController.getDashboardOverview` |
| A-03 | AI widgets | `dashboard:read` | `dashboardAIContextController.getDashboardWidgets` |

*D-09 internal `ensureBusinessDashboardForUser` retains service-level membership check; activity emits on create. HTTP-equivalent PE applies on explicit create/ensure endpoints.

---

## A-02 (out of dashboard PE surface)

| Op | Policy | Status |
|----|--------|--------|
| A-02 quick-stats | Metadata stub only — Analytics owns aggregates | Stub ✅, Prisma removed ✅ |

---

## Summary

| Metric | Count |
|--------|------:|
| Paths requiring PE | 24 |
| Paths with PE wired | **24** |
| Compliance | **100%** |

---

**Last updated:** 2026-06-21
