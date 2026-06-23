# Platform Activity Query Service

**Program:** Platform Kernel Wave 3 — Package 1 (ACT-R1 P0)  
**Date:** 2026-06-22  
**Status:** **Implemented**

---

## Overview

`platformActivityQueryService` is the **canonical read layer** for normalized Platform Activity stored in `Log` rows with `operation = 'module_activity_event'`.

| Field | Value |
|-------|-------|
| **Path** | `server/src/services/platform/platformActivityQueryService.ts` |
| **Types** | `server/src/services/platform/platformActivityTypes.ts` |
| **Feed mapping** | `server/src/services/platform/platformActivityFeedMapper.ts` |
| **Owner** | Platform Engineering (Runtime Kernel) |

---

## Operations

| Operation | Purpose | Migrated consumers |
|-----------|---------|-------------------|
| `getFeedForUser` | Federated user feed; optional `dashboardId` scope | `activityFeedController` |
| `getRecentActivity` | Time-bounded recent events | `analyticsCapabilityService` (personal) |
| `getModuleActivity` | Module-scoped timeline | `analyticsCapabilityService` (module) |
| `getActivityForEntity` | Target entity history | *(deferred — Drive P1)* |
| `getActivitySummary` | Count aggregates by module | `analyticsCapabilityService` (personal stats) |
| `getActivityTimeline` | Alias of `getRecentActivity` | Export / future timelines |
| `countModuleActivity` | Metric counts | *(available — workforce delegate deferred)* |
| `parseModuleActivityLogRow` | Envelope parser (testable) | Internal + tests |

---

## Query contract

- **Source:** `prisma.log` where `operation = 'module_activity_event'`
- **Envelope:** JSON `metadata` matching `moduleActivityService` normalized shape
- **Tenant scope:** `userId` required; optional `dashboardId` filter on `context.dashboardId`
- **Limits:** Default 50, max 200 per operation; feed uses fetch buffer for dashboard filter

---

## Authorization

Read authorization remains at **controller/capability** layer today:

- Activity feed: JWT + dashboard ownership check in controller
- Analytics: `analyticsPolicyDual` before query service calls

Future: `POLICY_ACTIONS.ACTIVITY_READ` (not in P0 scope).

---

## Related

- [ACT_R1_P0_MIGRATION_REPORT.md](./ACT_R1_P0_MIGRATION_REPORT.md)
- [PLATFORM_ACTIVITY_QUERY_MODEL.md](./PLATFORM_ACTIVITY_QUERY_MODEL.md)

**Last updated:** 2026-06-22
