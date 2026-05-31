# File Hub FH-6 Governance Cleanup Report

**Date:** 2026-05-31  
**Phase:** FH-6 — Reference Implementation Finalization (Part 4)

---

## Deprecated drive trash wrappers

| Item | Location | Mounted | Behavior | Recommendation |
|------|----------|---------|----------|----------------|
| `listTrashedFiles` | `fileController.ts` | `GET /api/drive/files/trashed` | Logs deprecation warning; owner-centric list | **Safe to remove** after telemetry confirms zero traffic (1 release cycle) |
| `listTrashedFolders` | `folderController.ts` | `GET /api/drive/folders/trashed` | Same | **Safe to remove** (same) |
| `hardDeleteFolder` | `folderController.ts` | Legacy route | Delegates to `permanentlyDeleteDriveFolderCascade` | **Safe to remove** — Global Trash is canonical |
| Client helpers | `web/src/api/drive.ts` | Deprecated JSDoc | No active callers found | **Safe to remove** with route retirement |

**Compatibility:** Global Trash (`/api/trash/*`) is the supported API. Enterprise UI uses Global Trash (FH-4).

---

## Deprecated drive routes (summary)

| Route | Replacement |
|-------|-------------|
| `GET /api/drive/files/trashed` | `GET /api/trash/items?moduleId=drive` |
| `GET /api/drive/folders/trashed` | Same |
| Drive-only restore/delete endpoints (if any remain) | `POST /api/trash/restore/:id`, `DELETE /api/trash/delete/:id` |

---

## Job registrations

| Job | Registry | Tier | Status |
|-----|----------|------|--------|
| `trash_permanent_delete` | `cleanupService.startCleanupJob` | **canonical** | Uses `driveDeleteService` cleanup helpers |
| Other platform crons | `platformCronJobs.ts` | transitional | **Not File Hub-specific** — platform governance |

File Hub trash cleanup is **canonical**. Remaining `transitional` tiers are platform-wide jobs unrelated to drive consolidation.

---

## Capability declarations

| Source | Status |
|--------|--------|
| `builtInModuleManifests.ts` — drive manifest | Reconciled FH-2/FH-4 (vlink, realtime, trash, notifications) |
| `platformEntityRegistry.ts` — file/folder | Registered FH-2 |
| AI manifest copy | Aligned with capability matrix |

**No stale capability claims identified post FH-4.**

---

## Entity declarations

| Entity | Registry | V_Link type | Resolver |
|--------|----------|-------------|----------|
| `file` | `platformEntityRegistry` | `FILE` | `driveVlinkAccessService` |
| `folder` | `platformEntityRegistry` | `FOLDER` | `driveVlinkAccessService` |

**No drift.**

---

## Safe removals (next release)

1. Deprecated drive trash list routes + `web/src/api/drive.ts` helpers.
2. `hardDeleteFolder` legacy endpoint (if still routed).
3. `scheduleTrashCleanup` re-export (already deprecated; calls `startCleanupJob`).

---

## Future removals (requires platform coordination)

1. `Activity` model reads in platform feed and analytics.
2. Split notification type aliases in manifest (`drive_file_shared` etc.) — optional catalog cleanup.

---

## Compatibility requirements

- **Global Trash handler contract** must remain registered at startup (`registerGlobalTrashHandlers`).
- **Deprecated endpoints:** maintain 1 release with deprecation logs before removal.
- **Enterprise business workspace:** uses `DriveModuleWrapper` + Global Trash — no dependency on deprecated routes.

---

## Success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | Governance drift identified | **Yes** |
| 2 | Safe vs future removals documented | **Yes** |
| 3 | No false capability/entity claims | **Yes** |
| 4 | Trash job tier canonical | **Yes** |

**Part 4 verdict: Complete.**
