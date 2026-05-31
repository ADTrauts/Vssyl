# File Hub FH-6 Delete Path Consolidation Report

**Date:** 2026-05-31  
**Phase:** FH-6 — Reference Implementation Finalization (Part 1)  
**Canonical service:** `server/src/services/driveDeleteService.ts`

---

## Objective

Ensure all file/folder deletion paths route through `driveDeleteService` with the required chain:

**Controller / UI / API / AI → `driveDeleteService` → Policy Engine → persistence → module activity → domain events → notifications → realtime**

---

## Audit results

| Path | Entry point | Routes via `driveDeleteService` | Direct Prisma delete/trash | Status |
|------|-------------|--------------------------------|---------------------------|--------|
| **File soft trash (HTTP)** | `DELETE /api/drive/files/:id` → `deleteFile` | `softTrashDriveItem({ type: 'file' })` | None | **Consolidated (FH-6)** |
| **Folder soft trash (HTTP)** | `DELETE /api/drive/folders/:id` → `deleteFolder` | `softTrashDriveItem({ type: 'folder' })` | None | **Consolidated (FH-6)** |
| **Global Trash soft trash** | `POST /api/trash/items` (module handler) | `registerGlobalTrashHandlers` → `softTrashDriveItem` | None | **Compliant (FH-0.1)** |
| **Global Trash restore** | `POST /api/trash/restore/:id` | `restoreDriveItem` via handler | None | **Compliant** |
| **Global Trash permanent delete** | `DELETE /api/trash/delete/:id` | `permanentlyDeleteDriveItem` via handler | None | **Compliant** |
| **Global Trash empty** | `POST /api/trash/empty` | `emptyDriveTrash` via handler | None | **Compliant** |
| **Enterprise bulk trash (UI)** | `EnhancedDriveModule` → Global Trash API | Handler chain | None | **Compliant (FH-4)** |
| **AI conversation trash** | `aiConversationController` | N/A (non-drive entity) | Inline `trashedAt` on AI conv | Out of scope |
| **Deprecated drive trash list** | `GET /api/drive/files/trashed` | Read-only list (no delete) | None | **Deprecated wrapper** |
| **Deprecated hard delete folder** | `hardDeleteFolder` in `folderController` | `permanentlyDeleteDriveFolderCascade` | None | **Deprecated; still canonical service** |
| **Scheduled cleanup (>30d)** | `cleanupService.deleteOldTrashedItems` | `permanentlyDeleteTrashedDriveFile/FolderForCleanup` | None | **Compliant (tier: canonical)** |

---

## FH-6 code changes

### Before

- `fileController.deleteFile` — inline `prisma.file.updateMany({ trashedAt })`, duplicate activity/events/realtime/notifications.
- `folderController.deleteFolder` — inline soft trash; missing FH-5 notification/realtime parity.

### After

- `fileController.deleteFile` — thin orchestration; delegates to `softTrashDriveItem`.
- `folderController.deleteFolder` — thin orchestration; delegates to `softTrashDriveItem`.
- Error mapping: `DriveDeleteError` → 404/403 at controller boundary.

---

## `driveDeleteService` responsibility chain (verified)

| Step | Implementation |
|------|----------------|
| Policy Engine | `evaluateDrivePolicyDual` (`FILE_DELETE` / `FOLDER_DELETE`) |
| Permission helpers | `canWriteFile` / `canWriteFolder` |
| Persistence | `prisma.file/folder.updateMany` (`trashedAt`) or hard delete cascade |
| Module activity | `emitModuleActivityEvent` (`moduleId: 'drive'`) |
| Domain events | `emitFileDeletedEvent`, `emitFolderDeletedEvent`, `emitFileRestoredEvent`, etc. |
| Notifications | `driveNotificationService` (restore/trash/permanent) |
| Realtime | `broadcastDriveEventToUsers` + owner socket |
| V_Link lifecycle | `driveVlinkLifecycleService` on hard delete |

---

## Remaining Prisma mutations (acceptable)

| Location | Mutation | Rationale |
|----------|----------|-----------|
| `driveDeleteService.deleteFileRecords` | `prisma.activity.deleteMany({ fileId })` | Legacy activity FK cleanup on hard delete — not a delete bypass |
| `driveDeleteService` | `prisma.file.delete` / folder cascade | Canonical persistence layer |

**No controller or route performs direct file/folder trash/delete mutations outside `driveDeleteService`.**

---

## Tests

| Test file | Coverage |
|-----------|----------|
| `server/src/services/__tests__/driveDeleteService.test.ts` | Service-level soft trash, restore, permanent delete |
| `server/src/services/__tests__/fileHubFh6Consolidation.test.ts` | Controller routing to `softTrashDriveItem` |
| `server/src/controllers/__tests__/fileController.update.test.ts` | `deleteFile` delegates to service (updated FH-6) |
| `server/src/controllers/__tests__/trashController.drive.test.ts` | Global Trash handler wiring |

---

## Success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | All soft trash HTTP paths use `softTrashDriveItem` | **Yes** |
| 2 | All restore/permanent paths use handler → `driveDeleteService` | **Yes** |
| 3 | No inline controller trash mutations | **Yes** |
| 4 | PE + activity + events + notifications + realtime in service | **Yes** |

**Part 1 verdict: Complete.**
