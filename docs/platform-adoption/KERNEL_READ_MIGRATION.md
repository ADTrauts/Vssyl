# Kernel Read Migration

**Program:** Platform Adoption — Wave 1  
**Date:** 2026-06-25  
**Status:** **Complete** — read migration; write paths unchanged

**Opportunity:** ACT-R1 / PA-P0-01, PA-P0-02, PA-P1-06, PA-P1-11

---

## 1. Objective

Transition platform **read** consumers from legacy module tables (`prisma.activity`, direct `Message`/`Task`/`Event` timeline queries) to the **Platform Kernel** normalized read path (`Log.operation = module_activity_event`).

**In scope:** Read migration only.  
**Out of scope:** Module write paths, Kernel redesign, Activity UI redesign.

---

## 2. Canonical read stack

| Layer | Artifact | Role |
|-------|----------|------|
| **Unified facade** | `server/src/services/platform/platformTimelineReadService.ts` | Single import surface for timeline consumers |
| **Query engine** | `server/src/services/platform/platformActivityQueryService.ts` | Parses envelopes, scopes, sorts |
| **Types** | `server/src/services/platform/platformActivityTypes.ts` | `PlatformActivityRecord`, `MODULE_ACTIVITY_OPERATION` |
| **Feed DTO** | `platformActivityFeedMapper.ts` | Dashboard Activity Feed items |
| **AI DTO** | `platformActivityContextMapper.ts` | Cross-module / twin context rows |
| **Drive DTO** | `platformActivityDriveMapper.ts` | Legacy Drive recent-activity row shape |

### Primary API functions

| Function | Use case |
|----------|----------|
| `getUnifiedTimelineForUser` | Federated user timeline (feed, AI, debug) |
| `getFeedForUser` | Same as above — lower-level with tenant scope filters |
| `getRecentActivity` | Time-bounded analytics / AI |
| `getActivityForEntity` | Per-file/folder/entity history |
| `getModuleActivity` | Module-scoped analytics |
| `getModuleActivityForUserIds` | Multi-actor module feed (Place social) |
| `getActivitySummary` | Counts by module |

### Tenant scope filters (Wave 1)

`getFeedForUser` / `getUnifiedTimelineForUser` accept optional:

- `dashboardId` — personal dashboard isolation
- `businessId` — business workspace isolation
- `householdId` — household isolation

Activity Feed API validates membership before applying scope (`activityFeedController.ts`).

---

## 3. Consumer migration status

| Consumer | Prior source | Current source | Status |
|----------|--------------|----------------|--------|
| `GET /api/activity-feed` | Legacy multi-table federation | `getUnifiedTimelineForUser` | **Migrated** |
| Activity Feed widget (`ActivityFeedWidget.tsx`) | API above | Unchanged client — server migrated | **Migrated** |
| `CrossModuleContextEngine.getActivityContext` | `prisma.activity` | `getUnifiedTimelineForUser` | **Migrated** |
| `DigitalLifeTwinService.getRecentActivity` | `prisma.activity` | `getUnifiedTimelineForUser` | **Migrated** |
| `GET /api/ai-context-debug/user/:userId` | `prisma.activity` | `getUnifiedTimelineForUser` | **Migrated** |
| `analyticsCapabilityService.getPersonalAnalyticsCapability` | `prisma.activity` | `getRecentActivity` + `getActivitySummary` | **Migrated** |
| `fileController.getItemActivity` | Legacy + Log merge | `getActivityForEntity` | **Migrated** |
| `folderController.getRecentActivity` | Legacy + Log merge | `getRecentActivity` (drive module) | **Migrated** |
| `placeVisibilityService.getActivityFeed` | Inline `prisma.log` query | `getModuleActivityForUserIds` | **Migrated** (Wave 1) |

---

## 4. Remaining legacy / blockers

| Item | Reason | Disposition |
|------|--------|-------------|
| `prisma.activity` table | Historical Drive-era rows; purge on hard delete only | **Read removed** — table retained for orphan cleanup (`driveDeleteService`) |
| `prisma.vLinkActivity` | V_Link module-local timeline | **Documented blocker** — not kernel envelope; future Wave |
| `PlaceActivityFeedItem` table | Historical Place rows | **Not read** on product paths (per `placeActivityService` comment) |
| `analyticsCapabilityService` `filesCreated` / `messagesSent` counts | SoR aggregates, not activity timeline | **Intentional** — not kernel reads |
| `CrossModuleContextEngine` drive/chat module slices | `prisma.file`, `prisma.message` for module context | **Intentional** — SoR reads, not activity timeline |
| Intelligence engines (`PredictiveIntelligenceEngine`) | `aIConversationHistory` | **Out of scope** — AI session history, not module activity |

---

## 5. Validation performed

| Dimension | Verification |
|-----------|--------------|
| Permissions | Activity Feed dashboard ownership; business/household membership gates |
| Chronology | `sortRecordsNewestFirst` with logId tie-break |
| Tenant isolation | dashboardId, businessId, householdId filters on feed |
| Cross-module aggregation | Federated feed returns multiple moduleIds |
| Tests | 27 tests across query service, timeline facade, feed controller, AI, Place |

---

## 6. Performance notes

- Query uses indexed `Log` fields: `userId`, `operation`, `module`, `timestamp`
- Fetch buffer multiplier (5×) applied before scope filter to preserve limit accuracy
- No N+1 on feed path; Place feed hydrates actors in one batch

---

**Last updated:** 2026-06-25
