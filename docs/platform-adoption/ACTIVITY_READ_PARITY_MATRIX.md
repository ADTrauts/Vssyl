# Activity Read Parity Matrix

**Program:** Platform Adoption — Wave 1  
**Date:** 2026-06-25  
**Status:** Post-migration baseline

**Legend:** **K** = Kernel read · **L** = Legacy read · **S** = SoR read (intentional) · **N/A** = Not applicable

---

## 1. Platform consumers

| ID | Consumer | Path | Read class | Kernel function | Legacy removed? | Tests |
|----|----------|------|------------|-----------------|-----------------|-------|
| **AR-01** | Activity Feed API | `activityFeedController.ts` | **K** | `getUnifiedTimelineForUser` | Yes | `activityFeedController.test.ts` |
| **AR-02** | Activity Feed widget | `ActivityFeedWidget.tsx` | **K** (via API) | — | Yes (server) | integration |
| **AR-03** | CrossModuleContextEngine activity | `CrossModuleContextEngine.ts` | **K** | `getUnifiedTimelineForUser` | Yes | `CrossModuleContextEngine.activity.test.ts` |
| **AR-04** | DigitalLifeTwin recent activity | `DigitalLifeTwinService.ts` | **K** | `getUnifiedTimelineForUser` | Yes | `DigitalLifeTwinService.activity.test.ts` |
| **AR-05** | AI context debug user slice | `ai-context-debug.ts` | **K** | `getUnifiedTimelineForUser` | Yes | — |
| **AR-06** | Personal analytics recent | `analyticsCapabilityService.ts` | **K** | `getRecentActivity` | Yes | `analyticsCapabilityService.test.ts` |
| **AR-07** | Personal analytics summary | `analyticsCapabilityService.ts` | **K** | `getActivitySummary` | Yes | same |
| **AR-08** | Module analytics | `analyticsCapabilityService.ts` | **K** | `getModuleActivity` | Yes | same |
| **AR-09** | Drive item activity | `fileController.ts` | **K** | `getActivityForEntity` | Yes | `fileController.itemActivity.test.ts` |
| **AR-10** | Drive recent activity | `folderController.ts` | **K** | `getRecentActivity` | Yes | `folderController.recentActivity.test.ts` |
| **AR-11** | Place social feed | `placeVisibilityService.ts` | **K** | `getModuleActivityForUserIds` | Yes | `placeVisibilityService.test.ts` |

---

## 2. Intentional non-kernel reads

| ID | Consumer | Read class | Source | Rationale |
|----|----------|------------|--------|-----------|
| **AR-X-01** | CrossModuleContextEngine drive slice | **S** | `prisma.file` | Module SoR listing for AI |
| **AR-X-02** | CrossModuleContextEngine chat slice | **S** | `prisma.message` | Module SoR listing for AI |
| **AR-X-03** | Analytics file/message counts | **S** | `prisma.file.count`, `prisma.message.count` | Aggregate metrics, not timeline |
| **AR-X-04** | V_Link activity timeline | **L** | `prisma.vLinkActivity` | Module-local; no kernel envelope yet |
| **AR-X-05** | Drive hard-delete cleanup | **L** (write-side) | `prisma.activity.deleteMany` | Orphan cleanup only |

---

## 3. Parity rules (CI / review)

| Rule | Enforcement |
|------|-------------|
| No `prisma.activity.findMany` in timeline hot paths | Grep gate — only deleteMany in drive purge |
| Activity Feed returns `metadata.source = normalized_event` | Unit test |
| Feed scoped by dashboard requires ownership | Integration test |
| Feed scoped by business requires membership | Unit test (Wave 1) |
| Kernel records sorted newest-first | Unit test |

---

## 4. Historical events gap

Kernel reads only return events emitted via `emitModuleActivityEvent`. Pre-normalization `prisma.activity` rows are **not** backfilled in Wave 1.

| Impact | Mitigation |
|--------|------------|
| Very old Drive actions may be absent from feed | Acceptable — forward-looking truth |
| Need historical audit | Use module-local history APIs or future backfill program |

---

## 5. Wave 2+ parity targets

| Target | Opportunity |
|--------|-------------|
| V_Link → kernel reads | PA-P2-10 |
| Activity Feed widget realtime refresh only | Already uses socket `activity:feed:refresh` |
| Operator timeline views | Platform Controller adoption cards |

---

**Last updated:** 2026-06-25
