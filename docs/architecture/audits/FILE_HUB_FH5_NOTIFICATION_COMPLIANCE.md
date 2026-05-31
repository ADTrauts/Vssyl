# File Hub FH-5 Notification Compliance Report

**Date:** 2026-05-31  
**Phase:** FH-5 — Notification Completion  
**Scope:** Manifest metadata ↔ emitters ↔ domain events ↔ realtime

---

## Compliance matrix

| Notification | Declared (manifest) | Emitted | Tested | Domain event | Activity | Realtime | Status |
|--------------|---------------------|---------|--------|--------------|----------|----------|--------|
| `drive_permission` (share) | Yes | Yes — `driveFileShareService`, folder grant | Yes (existing) | `file.shared` / `folder.shared` | Yes | `drive:item:updated` shareChange | **Complete** |
| `drive_permission` (unshare/revoke) | Yes | Yes — file/folder revoke controllers | Partial | `file.unshared` / `folder.unshared` | Yes | shareChange unshare | **Complete** |
| `drive_permission` (permission update) | Yes (desc includes "permissions change") | Yes — `notifyDrivePermissionUpdated` | Yes | — | — | — | **Complete** |
| `drive_shared` (legacy) | Yes | Legacy path only | — | — | — | — | **Partial** |
| `drive_file_shared` | Yes (`planned`) | Alias — uses `drive_permission` | — | Same as share | Same | Same | **Partial** (catalog alias) |
| `drive_file_unshared` | Yes (`planned`) | Alias — uses `drive_permission` revoke | — | Same as unshare | Same | Same | **Partial** (catalog alias) |
| `drive_folder_shared` | Yes (`planned`) | Alias — uses `drive_permission` | — | Same | Same | Same | **Partial** (catalog alias) |
| `drive_folder_unshared` | Yes (`planned`) | Alias — uses `drive_permission` revoke | — | Same | Same | Same | **Partial** (catalog alias) |
| `drive_item_restored` | Yes | Yes — `driveDeleteService.restoreDriveItem` | Yes | `file.restored` / `folder.restored` | Yes | `drive:item:updated` restored | **Complete** |
| `drive_item_deleted` (soft trash) | Yes | Yes — `softTrashDriveItem` | Yes | `file.deleted` / `folder.deleted` soft | Yes | `drive:item:deleted` | **Complete** |
| `drive_item_deleted` (permanent) | Yes | Yes — permanent delete paths | Yes | `file.deleted` / `folder.deleted` hard | Yes | `drive:item:deleted` permanent | **Complete** |

---

## Notification source paths

| Type | Canonical source | Never controller-only |
|------|------------------|----------------------|
| Share | `driveFileShareService.grantFileSharePermission` | ✓ |
| Unshare | `fileController.revokeFilePermission` / `folderPermissionController.revokeFolderPermission` | Controllers call NotificationService — *migration candidate to share service* |
| Permission update | `notifyDrivePermissionUpdated` via update permission controllers | Partial |
| Restore | `driveDeleteService.restoreDriveItem` → `driveNotificationService` | ✓ |
| Soft trash | `driveDeleteService.softTrashDriveItem` → `driveNotificationService` | ✓ |
| Permanent delete | `driveDeleteService.permanentlyDeleteDriveFile/FolderCascade` | ✓ |

---

## Safety review

| Rule | Implementation |
|------|----------------|
| No self-notifications | `NotificationService.handleDriveNotification` skips `senderId === recipientId`; collaborator collection excludes actor |
| No duplicate recipients | `Set` dedupe in `driveNotificationService` and `broadcastDriveEventToUsers` |
| Safe delete payload | Permanent delete notifications include `itemId`, `itemName`, `deletedAt` only — no file content/URL |
| Access-appropriate recipients | Collaborators = owner + `FilePermission`/`FolderPermission` with read or write |

---

## Realtime alignment (Part 8)

| Action | Notification | Realtime event | Synchronized |
|--------|--------------|----------------|--------------|
| Share | `drive_permission` | `drive:item:updated` shareChange | Yes |
| Unshare | `drive_permission` revoke | shareChange unshare | Yes |
| Restore | `drive_item_restored` | `drive:item:updated` restored → all collaborators | Yes *(FH-5 expanded fan-out)* |
| Soft trash | `drive_item_deleted` | `drive:item:deleted` → all collaborators | Yes *(FH-5 expanded fan-out)* |
| Permanent delete | `drive_item_deleted` permanent | `drive:item:deleted` permanent → collaborators | Yes *(FH-5 expanded fan-out)* |

Notification WebSocket (`broadcastNotification`) is independent of drive socket events; both fire on notification create. Drive UI refreshes via drive socket; notification badge via notification socket.

---

## Remaining gaps (post FH-5)

| Gap | Priority |
|-----|----------|
| Split share types to distinct emitters (`drive_file_shared` vs `drive_folder_shared`) | P3 — catalog aliases sufficient for v1 |
| Move revoke/unshare notification into `driveFileShareService` | P2 — controller consolidation |
| Emit restore/delete notifications from domain event subscriber (optional decouple) | P3 |

---

## FH-5 success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | Manifest matches implementation for active types | Yes |
| 2 | Restore notifications | Yes |
| 3 | Delete notifications (soft + permanent) | Yes |
| 4 | Share/unshare verified | Yes |
| 5 | Permission change notifications | Yes |
| 6 | Self-notification prevention | Yes |
| 7 | Duplicate prevention | Yes |
| 8 | Compliance report | Yes |
| 9 | Targeted tests | Yes (7 tests) |
