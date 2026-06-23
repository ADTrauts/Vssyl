# AN-M2 Remediation Report

**Program:** Platform Kernel Wave 3 — Package 1  
**Finding:** AN-M2 — Personal analytics Activity-table derivation  
**Date:** 2026-06-22  
**Status:** **Read path closed (P0)**

---

## Finding

Analytics Capability certificate major **AN-M2** identified personal analytics deriving activity from the legacy `Activity` table instead of normalized Platform Activity.

---

## Remediation

### `getPersonalAnalyticsCapability`

| Before | After |
|--------|-------|
| `prisma.activity.findMany` | `getRecentActivity` + `getActivitySummary` |
| `recentActivity` from Activity rows | Envelope-based `PlatformActivityRecord` mapping |
| `totalSessions` = legacy row count | `getActivitySummary.totalEvents` |
| `moduleUsage` filtered by `details.moduleId` JSON | Filtered by `record.moduleId` |

### `getModuleAnalyticsCapability`

| Before | After |
|--------|-------|
| `prisma.activity.findMany` with JSON path filter | `getModuleActivity` |

### Preserved (intentional SoR metrics)

| Metric | Source | Rationale |
|--------|--------|-----------|
| `filesCreated` | `prisma.file.count` | Domain metric — not activity feed |
| `messagesSent` | `prisma.message.count` | Domain metric — not activity feed |
| `modulesUsed` | `moduleInstallation` count | Install state |

---

## API behavior

Response JSON shape **unchanged**. Field semantics:

| Field | Semantic shift |
|-------|----------------|
| `usageStats.totalSessions` | Now counts normalized activity events in range (honest) |
| `recentActivity[].id` | Uses `eventId` from envelope (was Activity table id) |
| `recentActivity[].module` | Uses `context.moduleId` (was `details.moduleName`) |
| `moduleUsage[].usageCount` | Normalized events per module |

---

## Certificate impact

| Aspect | Status |
|--------|--------|
| AN-M2 read-path violation | **Closed** |
| Analytics Phase 2 pipeline | **Not in scope** |
| Analytics warehouse / rollups | **Not in scope** |
| Certificate re-evaluation | **Not performed** (implementation only) |

---

## Tests

`analyticsCapabilityService.test.ts` updated to mock `platformActivityQueryService` — **3 tests pass**.

---

## Related

- [ACT_R1_P0_MIGRATION_REPORT.md](./ACT_R1_P0_MIGRATION_REPORT.md)
- [ANALYTICS_CERTIFICATION_RECORD.md](../analytics/ANALYTICS_CERTIFICATION_RECORD.md)

**Last updated:** 2026-06-22
