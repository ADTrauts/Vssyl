# ACT-R1 Migration Matrix

**Program:** Platform Kernel Modernization — Wave 2 Package 1  
**Date:** 2026-06-22  
**Status:** Read-path migration matrix — **no implementation**

---

## 1. Summary counts

| Category | Count |
|----------|------:|
| **Production activity read sites** | **12** |
| **ACT-R1 violations** | **8** |
| **Compliant (normalized Log)** | **2** |
| **Partial compliant** | **2** |
| **SoR surrogate violations** (feed only) | **3** (Message, Event, Task within `activityFeedController`) |
| **Legacy write coupling** | **1** (`driveDeleteService.deleteMany`) |

---

## 2. Full consumer inventory

| ID | Consumer | Path | Read pattern | Class | Status |
|----|----------|------|--------------|-------|--------|
| **C-01** | Global activity feed | `activityFeedController.ts` | `Activity` + `Message` + `Event` + `Task` + partial `Log` | Platform | **VIOLATION** |
| **C-02** | Analytics personal | `analyticsCapabilityService.ts` | `prisma.activity.findMany` | Analytics | **VIOLATION** (AN-M2) |
| **C-03** | Analytics module | `analyticsCapabilityService.ts` | `prisma.activity.findMany` + JSON filter | Analytics | **VIOLATION** (AN-M2) |
| **C-04** | AI cross-module context | `CrossModuleContextEngine.ts` | `prisma.activity.findMany` | AI | **VIOLATION** |
| **C-05** | Digital Life Twin | `DigitalLifeTwinService.ts` | `prisma.activity.findMany` | AI | **VIOLATION** |
| **C-06** | File item activity | `fileController.ts` `getItemActivity` | `Log` (filtered) + `Activity` | Module | **PARTIAL** |
| **C-07** | Drive recent activity | `folderController.ts` `getRecentActivity` | `Activity` + `Log` (drive only) | Module | **PARTIAL** |
| **C-08** | AI context debug | `ai-context-debug.ts` | `prisma.activity.findMany` | AI | **VIOLATION** (prod route) |
| **C-09** | Place activity feed | `placeVisibilityService.ts` | `Log` `module_activity_event` | Module | **COMPLIANT** |
| **C-10** | Workforce publish metric | `workforceReportingService.ts` | `Log.count` scoped | Analytics | **COMPLIANT** |
| **C-11** | Place export aggregate | `placeVisibilityService.ts` | `Log.count` place module | Module | **COMPLIANT** |
| **C-12** | Legacy Activity cleanup | `driveDeleteService.ts` | `activity.deleteMany` | Module | **WRITE coupling** |

### Frontend consumers (delegate to backend)

| ID | Consumer | API | Backend |
|----|----------|-----|---------|
| **F-01** | `ActivityFeedWidget.tsx` | `GET /api/activity-feed` | C-01 |
| **F-02** | `PlaceActivityFeed.tsx` | `GET /api/place/feed` | C-09 |
| **F-03** | Dashboard `DashboardClient.tsx` | embeds F-01 | C-01 |

### Explicitly not Platform Activity (documented boundary)

| Item | Path | Note |
|------|------|------|
| V_Link activity list | `vlinkService.listVLinkActivity` | `vLinkActivity` table — module SoR |
| AI intelligence engines | `PredictiveIntelligenceEngine` | Uses `aIConversationHistory` — misnamed |
| Admin analytics | `adminAnalyticsService` | User signup metrics — not kernel activity |

---

## 3. Migration matrix

| ID | Priority | Target operation | Migration steps | Risk | Package |
|----|----------|------------------|-----------------|------|---------|
| **C-01** | **P0** | `queryActivityFeed` | Remove SoR queries; use full-module `Log` federation; map to existing DTO | **Critical** | PK-W3-IMP-1 |
| **C-02** | **P0** | `queryByActor` | Replace `activities` array; keep SoR **counts** for files/messages | High | PK-W3-IMP-2 |
| **C-03** | **P0** | `queryByActor` + module filter | Same as C-02 scoped | High | PK-W3-IMP-2 |
| **C-04** | **P1** | `queryRecentForContext` | Replace `getActivityContext` body | High | PK-W3-IMP-3 |
| **C-05** | **P1** | `queryRecentForContext` | Replace `getRecentActivity` | High | PK-W3-IMP-3 |
| **C-06** | **P1** | `queryByTarget` | Drop `Activity` merge; normalized only | Medium | PK-W3-IMP-4 |
| **C-07** | **P2** | `queryByActor` | Drop `Activity`; use query service | Medium | PK-W3-IMP-4 |
| **C-08** | **P2** | `queryRecentForContext` | Debug route uses query service | Low | PK-W3-IMP-3 |
| **C-09** | **P3** | `queryModuleFeed` | Refactor to delegate (no Prisma in module) | Low | PK-W3-IMP-5 |
| **C-10** | **P3** | `countByModule` | Extract shared count helper | Low | PK-W3-IMP-5 |
| **C-11** | **P3** | `countByModule` | Same | Low | PK-W3-IMP-5 |
| **C-12** | **P4** | N/A | Remove deleteMany when Activity table unused | Low | PK-W4 |

**Legend:** PK-W3 = implementation wave (post-charter); numbers are sequencing only — **not authorized in W2P1**.

---

## 4. Per-consumer retirement detail

### C-01 — activityFeedController (highest risk)

| Today | Target |
|-------|--------|
| 5 parallel queries across 4 stores | 1 `queryActivityFeed` call |
| Normalized slice: drive/chat only | All modules with `module_activity_event` |
| Message content in description | Envelope metadata only — no SoR body text |
| `GET /api/activity-feed` | Same route; thin controller |

### C-02 / C-03 — analyticsCapabilityService

| Today | Target |
|-------|--------|
| `recentActivity` from `Activity` table | `queryByActor` envelopes |
| `moduleUsage` from Activity details JSON | `countByModule` or grouped query |
| `totalSessions` = activity row count | Redefine metric from normalized events (charter documents semantic shift) |

**AN-M2 closure:** Document metric redefinition in Analytics hygiene track.

### C-04 / C-05 — AI services

| Today | Target |
|-------|--------|
| 50–100 legacy rows | `queryRecentForContext` limit 20–50 |
| `analyzeModuleUsage(activities)` | Operate on envelope `context.moduleId` |

### C-06 / C-07 — Drive surfaces

| Today | Target |
|-------|--------|
| Dual JSON response `{ activities, normalizedEvents }` | `{ events: PlatformActivityRecord[] }` — version API |
| Client breaking change | Coordinate with File Hub — deprecation header |

### C-09 — Place (reference)

| Today | Target |
|-------|--------|
| Direct `prisma.log.findMany` | `platformActivityQueryService.queryModuleFeed` |
| Mapping stays in Place | **Presentation ownership unchanged** |

---

## 5. Compliance criteria (exit gate per consumer)

- [ ] No `prisma.activity` import usage in consumer path
- [ ] No module SoR table queried as activity substitute
- [ ] All reads go through `platformActivityQueryService`
- [ ] Tenant scope validated before query
- [ ] Integration test with fixture `module_activity_event` rows
- [ ] Operation matrix row updated

---

## 6. Risk register (migration-specific)

| ID | Risk | Mitigation |
|----|------|------------|
| **M-R1** | Feed content regression (missing modules) | Federation includes all modules with adapters before cutover |
| **M-R2** | Analytics metric semantic change | Document in AN-M2 remediation; parallel run optional |
| **M-R3** | Drive API response shape break | Versioned response or dual-field deprecation period |
| **M-R4** | JSON target filter performance | DB index + pre-filter by module before envelope parse |
| **M-R5** | Incomplete historical data in Log | Legacy `Activity` not backfilled — accept feed history gap or one-time migration script (out of charter) |

---

## Related

- [ACTIVITY_CONSUMER_AUDIT.md](./ACTIVITY_CONSUMER_AUDIT.md)
- [PLATFORM_ACTIVITY_QUERY_MODEL.md](./PLATFORM_ACTIVITY_QUERY_MODEL.md)

**Last updated:** 2026-06-22
