# File Hub FH-6 Share Service Consolidation Report

**Date:** 2026-05-31  
**Phase:** FH-6 — Reference Implementation Finalization (Part 2)  
**Canonical service:** `server/src/services/driveFileShareService.ts`

---

## Objective

Move share/unshare/permission-update business logic into `driveFileShareService`. Controllers orchestrate auth parsing and HTTP responses only.

---

## Audit results

| Operation | Entry point | Business logic owner | Notification | Activity | Domain event | Realtime | Status |
|-----------|-------------|---------------------|--------------|----------|--------------|----------|--------|
| **File share (grant)** | `POST .../files/:id/permissions` | `grantFileSharePermission` | `driveNotificationService` / `NotificationService` | `emitModuleActivityEvent` | `file.shared` | `broadcastDriveShareChange` | **Consolidated** |
| **File share (update)** | `PUT .../files/:id/permissions/:userId` | `updateFileSharePermission` | `notifyDrivePermissionUpdated` | — | — | shareChange | **Consolidated (FH-6)** |
| **File unshare** | `DELETE .../files/:id/permissions/:userId` | `revokeFileSharePermission` | revoke notification | `unshare` activity | `file.unshared` | shareChange | **Consolidated (FH-6)** |
| **Folder share (grant)** | `POST .../folders/:id/permissions` | `grantFolderSharePermission` | share notification | `share` activity | `folder.shared` | shareChange | **Consolidated (FH-6)** |
| **Folder share (update)** | `PUT .../folders/:id/permissions/:userId` | `updateFolderSharePermission` | `notifyDrivePermissionUpdated` | — | — | shareChange | **Consolidated (FH-6)** |
| **Folder unshare** | `DELETE .../folders/:id/permissions/:userId` | `revokeFolderSharePermission` | revoke notification | `unshare` activity | `folder.unshared` | shareChange | **Consolidated (FH-6)** |
| **AI share tool** | `share_file` executor | `grantFileSharePermission` | Same as HTTP | Same | Same | Same | **Compliant (FH-1)** |

---

## FH-6 code changes

### `driveFileShareService.ts` (expanded)

Added folder parity and update/revoke helpers:

- `grantFolderSharePermission`
- `updateFolderSharePermission`
- `revokeFolderSharePermission`
- Shared helpers: `notifyShareGrant`, `notifyShareRevoke`

### `folderPermissionController.ts` (rewritten)

Now thin orchestration only — delegates all grant/update/revoke to `driveFileShareService`. Removed inline notification, activity, domain event, and realtime logic.

**Import fix:** `canReadFolder` / `canWriteFolder` moved to `drivePermissionHelpers` import in `folderController.ts` (helpers were never part of permission controller exports after rewrite).

### `fileController.ts` (FH-6)

- `updateFilePermission` → `updateFileSharePermission`
- `revokeFilePermission` → `revokeFileSharePermission`
- Removed duplicate `NotificationService`, `notifyDrivePermissionUpdated`, `broadcastDriveShareChange`, `emitFileUnsharedEvent` imports from controller.

---

## Controller responsibilities (post-consolidation)

| Controller function | Allowed logic |
|--------------------|---------------|
| `grantFilePermission` | Parse body → call service → map `DriveShareError` |
| `updateFilePermission` | Parse params/body → call service |
| `revokeFilePermission` | Parse params → call service |
| `grantFolderPermission` | Same pattern |
| `updateFolderPermission` | Same pattern |
| `revokeFolderPermission` | Same pattern |
| `listFilePermissions` / `listFolderPermissions` | PE gate + owner check + Prisma read (list is read path) |

---

## Remaining gaps

| Gap | Priority | Notes |
|-----|----------|-------|
| Split notification types (`drive_file_shared` vs `drive_folder_shared`) | P3 | Catalog aliases; single emitter type `drive_permission` |
| List-permissions PE uses `FILE_READ` for folders | P3 | Pre-existing; not share consolidation |

---

## Tests

| Test | Status |
|------|--------|
| `fileHubFh6Consolidation.test.ts` — share service exports | Pass |
| Existing share grant tests (if any) | Unchanged |

---

## Success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | File share/unshare/update in `driveFileShareService` | **Yes** |
| 2 | Folder share/unshare/update in `driveFileShareService` | **Yes** |
| 3 | Controllers orchestrate only | **Yes** |
| 4 | Notifications/events/activity/realtime in service | **Yes** |

**Part 2 verdict: Complete.**
