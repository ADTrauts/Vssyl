# ACT-R1 P0 Migration Report

**Program:** Platform Kernel Wave 3 — Package 1  
**Date:** 2026-06-22  
**Status:** **P0 complete** — feed + analytics migrated

---

## Executive summary

ACT-R1 P0 establishes the **Platform Activity Query Layer** and migrates the two highest-priority consumers:

1. **Global Activity Feed** (`activityFeedController`) — **migrated**
2. **Analytics AN-M2 paths** (`analyticsCapabilityService`) — **migrated**

Legacy multi-source aggregation (`Activity`, `Message`, `Event`, `Task`) is **removed** from the feed path. Analytics no longer reads `prisma.activity`.

---

## Consumer inventory (post-P0)

| ID | Consumer | Status | Notes |
|----|----------|--------|-------|
| C-01 | `activityFeedController` | **Migrated** | Uses `getFeedForUser` |
| C-02 | `analyticsCapabilityService` (personal) | **Migrated** | `getRecentActivity` + `getActivitySummary` |
| C-03 | `analyticsCapabilityService` (module) | **Migrated** | `getModuleActivity` |
| C-04 | `CrossModuleContextEngine` | **Deferred** | PK-W3-IMP-3 |
| C-05 | `DigitalLifeTwinService` | **Deferred** | PK-W3-IMP-3 |
| C-06 | `fileController.getItemActivity` | **Deferred** | PK-W3-IMP-4 |
| C-07 | `folderController.getRecentActivity` | **Deferred** | PK-W3-IMP-4 |
| C-08 | `ai-context-debug` | **Deferred** | PK-W3-IMP-3 |
| C-09 | `placeVisibilityService` | **Unaffected** | Already compliant; delegate in IMP-5 |
| C-10 | `workforceReportingService` | **Unaffected** | Log count pattern; `countModuleActivity` ready |
| C-11 | Place export count | **Unaffected** | Same |
| C-12 | `driveDeleteService` | **Unaffected** | Legacy write cleanup only |

---

## Canonical service readers (post-P0)

| # | Consumer | Operations used |
|---|----------|-----------------|
| 1 | `activityFeedController` | `getFeedForUser` |
| 2 | `analyticsCapabilityService` | `getRecentActivity`, `getActivitySummary`, `getModuleActivity` |

**Total production readers on canonical service: 2** (3 code paths).

---

## Remaining `prisma.activity` production reads

| Path | Status |
|------|--------|
| `fileController.getItemActivity` | Deferred P1 |
| `folderController.getRecentActivity` | Deferred P1 |
| `CrossModuleContextEngine` | Deferred P1 |
| `DigitalLifeTwinService` | Deferred P1 |
| `ai-context-debug.ts` | Deferred P1 |
| `driveDeleteService` (deleteMany) | Legacy coupling — P4 |

**Count: 5 read sites + 1 delete** remain outside P0 scope.

---

## AN-M2 status

| Finding | Status |
|---------|--------|
| AN-M2 — Personal analytics Activity-table derivation | **Closed (read path)** |

Personal and module analytics now derive `recentActivity`, `totalSessions`, and module usage from normalized log envelopes. SoR metrics (`filesCreated`, `messagesSent` counts) intentionally remain on File/Chat tables as **metrics**, not activity substitutes.

---

## Maturity update

| Surface | Before | After P0 |
|---------|--------|----------|
| Platform Activity writes | L2 | L2 (unchanged) |
| Platform Activity reads | L1 | **L2 candidate** |
| Combined Platform Kernel | L1 | **L1–L2** |

---

## Recommended next package

**PK-W3-IMP-3** — AI context migration (`CrossModuleContextEngine`, `DigitalLifeTwinService`, `ai-context-debug`)

---

## Related

- [PK_W3_IMP1_IMPLEMENTATION_REPORT.md](./PK_W3_IMP1_IMPLEMENTATION_REPORT.md)
- [ACTIVITY_FEED_REMEDIATION_REPORT.md](./ACTIVITY_FEED_REMEDIATION_REPORT.md)
- [AN_M2_REMEDIATION_REPORT.md](./AN_M2_REMEDIATION_REPORT.md)

**Last updated:** 2026-06-22
