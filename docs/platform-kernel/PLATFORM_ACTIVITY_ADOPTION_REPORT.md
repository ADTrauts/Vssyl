# Platform Activity Adoption Report

**Program:** Platform Kernel — Platform Activity Query Layer  
**Date:** 2026-06-23 (post PK-W3-IMP-3)  
**Status:** Major consumer adoption **complete**

---

## 1. Canonical read layer

**Service:** `server/src/services/platform/platformActivityQueryService.ts`  
**Source of truth:** `Log` rows with `operation: 'module_activity_event'`

| Operation | Primary use |
|-----------|-------------|
| `getFeedForUser` | Federated user feed, AI context |
| `getRecentActivity` | Time-bounded module/user activity |
| `getActivityForEntity` | File/folder/entity timelines |
| `getModuleActivity` | Analytics module views |
| `getActivitySummary` | Usage aggregates |
| `getActivityTimeline` | Export / timelines |
| `countModuleActivity` | Workforce / metrics counts |
| `parseModuleActivityLogRow` | Envelope parsing |

---

## 2. Consumer adoption matrix

| Consumer | Operations used | Maturity |
|----------|-----------------|----------|
| `activityFeedController` | `getFeedForUser` | Migrated IMP-1 |
| `analyticsCapabilityService` | `getRecentActivity`, `getModuleActivity`, `getActivitySummary` | Migrated IMP-1 |
| `CrossModuleContextEngine` | `getFeedForUser` | Migrated IMP-3 |
| `DigitalLifeTwinService` | `getFeedForUser` | Migrated IMP-3 |
| `ai-context-debug.ts` | `getFeedForUser` | Migrated IMP-3 |
| `fileController.getItemActivity` | `getActivityForEntity` | Migrated IMP-3 |
| `folderController.getRecentActivity` | `getRecentActivity` | Migrated IMP-3 |
| `placeVisibilityService` | Direct `Log` (compliant) | Delegate pending |
| `workforceReportingService` | Direct `Log.count` (compliant) | Delegate pending |

**Adopters via query service:** **7 / 9** kernel-facing consumers (78%).  
**Normalized without query service:** **2** (already compliant).

---

## 3. Supporting mappers

| Mapper | Consumers |
|--------|-----------|
| `platformActivityFeedMapper.ts` | Activity feed, analytics descriptions |
| `platformActivityContextMapper.ts` | AI context engines |
| `platformActivityDriveMapper.ts` | Drive APIs, recent page |

---

## 4. Maturity assessment

| Dimension | Pre IMP-1 | Post IMP-3 |
|-----------|-----------|------------|
| Write path | L2 | L2 |
| Read path | L1 (fragmented) | **L2 candidate** |
| Consumer coverage | ~17% canonical | **~100% violations migrated** |
| Certification | Not started | **L2 candidacy** (not ratified) |

---

## 5. Drift prevention (recommended)

1. ESLint rule: ban `prisma.activity.findMany` / `findFirst` in `server/src` (exclude tests + deleteMany until retirement)
2. Delegate C-09–C-11 to query service
3. Retire `Activity` Prisma model after write-path cleanup
4. Document query service in `docs/architecture/PLATFORM_ACTIVITY_QUERY_SERVICE.md` (IMP-1)

---

**Last updated:** 2026-06-23
