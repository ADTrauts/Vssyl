# File Hub Operation Matrix

**Module id:** `drive` (user-facing: **File Hub**)  
**Status:** FH-6 reference implementation — finalized  
**Last updated:** 2026-05-31  
**Related:** [FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md](./FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md), [FILE_HUB_FH6_*](./FILE_HUB_FH6_DELETE_PATH_CONSOLIDATION.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

---

## Permission model (trash + AI reads)

Centralized in `server/src/services/driveVisibilityService.ts` (`DRIVE_TRASH_VISIBILITY_MODEL`).

| Role | Trash list visibility | AI read visibility |
|------|----------------------|-------------------|
| **Owner** | Own trashed items | All owned active files |
| **Editor** (`canWrite`) | Trashed items with write share | Shared + owned; PE `file:read` |
| **Viewer** (`canRead`) | Trashed items with read share | Shared + owned; PE `file:read` |
| **Unrelated user** | Hidden | Denied |
| **Business workspace** | Same rules; scoped by `dashboardId` | Same |

**Restore / permanent delete:** `canWriteFile` / `canWriteFolder` + Policy Engine.  
**Empty trash:** owner-only (`emptyDriveTrash`).

---

## Master operation matrix

Legend: **C** = compliant, **P** = partial, **N** = non-compliant

| Operation | Entry point | Service owner | Policy (PE) | Activity | Domain event | Notification | Realtime | Status |
|-----------|-------------|---------------|-------------|----------|--------------|--------------|----------|--------|
| **File upload** | `POST /api/drive/files` | `driveUploadService` / `fileController.uploadFile` | `FILE_UPLOAD` dual | `drive` upload | `file.uploaded` | — | `drive:item:created` | **C** |
| **File rename** | `PUT /api/drive/files/:id` | `fileController.updateFile` | `FILE_UPDATE` dual | `drive` update | `file.renamed` | — | `drive:item:updated` | **C** |
| **File move** | `PUT /api/drive/files/:id` / `moveFile` | `fileController.moveFile` | `FILE_MOVE` dual | `drive` move | `file.moved` | — | `drive:item:moved` | **C** |
| **File trash (HTTP)** | `DELETE /api/drive/files/:id` | `driveDeleteService.softTrashDriveItem` | `FILE_DELETE` dual | `drive` delete soft | `file.deleted` soft | `drive_item_deleted` | `drive:item:deleted` + collaborators | **C** |
| **File trash (Global Trash)** | `POST /api/trash/items` handler | `driveDeleteService.softTrashDriveItem` | Same | Same | Same | Same | Same | **C** |
| **File restore** | `POST /api/trash/restore/:id` | `driveDeleteService.restoreDriveItem` | `FILE_UPDATE` dual | `drive` restore | `file.restored` | `drive_item_restored` | `drive:item:updated` restored + collaborators | **C** |
| **File permanent delete** | Global Trash delete | `driveDeleteService.permanentlyDeleteDriveFile` | `FILE_DELETE` dual | `drive` delete | `file.deleted` hard | `drive_item_deleted` permanent | `drive:item:deleted` permanent + collaborators | **C** |
| **File share** | `POST .../permissions` / AI `share_file` | `driveFileShareService.grantFileSharePermission` | `FILE_SHARE` dual | `drive` share | `file.shared` | `drive_permission` | `drive:item:updated` shareChange | **C** |
| **File permission update** | `PUT .../permissions/:userId` | `driveFileShareService.updateFileSharePermission` | owner gate + PE | — | — | `drive_permission` update | shareChange | **C** |
| **File unshare** | `DELETE .../permissions/:userId` | `driveFileShareService.revokeFileSharePermission` | owner gate | `drive` unshare | `file.unshared` | `drive_permission` revoke | shareChange unshare | **C** |
| **Folder create** | `POST /api/drive/folders` | `folderController.createFolder` | `FOLDER_CREATE` dual | `drive` create | `folder.created` | — | `drive:item:created` | **C** |
| **Folder rename** | `PUT /api/drive/folders/:id` | `folderController.updateFolder` | `FOLDER_UPDATE` dual | `drive` update | `folder.renamed` | — | `drive:item:updated` | **C** |
| **Folder move** | `POST .../move` | `folderController.moveFolder` | `FOLDER_UPDATE` dual | `drive` move | `folder.moved` | — | `drive:item:moved` | **C** |
| **Folder trash (HTTP)** | `DELETE /api/drive/folders/:id` | `driveDeleteService.softTrashDriveItem` | `FOLDER_DELETE` dual | `drive` delete soft | `folder.deleted` soft | `drive_item_deleted` | `drive:item:deleted` + collaborators | **C** |
| **Folder restore** | Global Trash restore | `driveDeleteService.restoreDriveItem` | `FOLDER_UPDATE` dual | `drive` restore | `folder.restored` | `drive_item_restored` | restored + collaborators | **C** |
| **Folder permanent delete** | Global Trash delete | `driveDeleteService.permanentlyDeleteDriveFolderCascade` | `FOLDER_DELETE` dual | `drive` delete | `folder.deleted` hard | `drive_item_deleted` permanent | permanent + collaborators | **C** |
| **Folder share** | `POST .../folders/:id/permissions` | `driveFileShareService.grantFolderSharePermission` | `FOLDER_SHARE` dual | `drive` share | `folder.shared` | `drive_permission` | shareChange | **C** |
| **Folder permission update** | `PUT .../permissions/:userId` | `driveFileShareService.updateFolderSharePermission` | owner gate | — | — | permission update | shareChange | **C** |
| **Folder unshare** | `DELETE .../permissions/:userId` | `driveFileShareService.revokeFolderSharePermission` | owner gate | `drive` unshare | `folder.unshared` | revoke | shareChange unshare | **C** |
| **List trash (Global)** | `GET /api/trash/items` | `trashController` + `driveVisibilityService` | read scope | — | — | — | — | **C** |
| **Empty trash** | `POST /api/trash/empty` | `driveDeleteService.emptyDriveTrash` | owner-only | per-item delete | per-item | per-item | per-item | **C** |
| **Scheduled trash purge** | cron `trash_permanent_delete` | `driveDeleteService` cleanup helpers | system | delete | delete hard | — | — | **C** |
| **Federated search (files)** | `searchController` drive provider | `driveVisibilityService.searchAccessibleDriveFiles` | `FILE_READ` per hit | — | — | — | — | **C** |
| **Federated search (folders)** | same | `searchAccessibleDriveFolders` | read scope | — | — | — | — | **P** |
| **AI list files** | tool `list_drive_files` | `driveVisibilityService.listAccessibleDriveFiles` | `FILE_READ` per file | — | — | — | — | **C** |
| **AI attachments** | `aiConversationController` | `validateAccessibleFileIds` | `FILE_READ` per file | — | — | — | — | **C** |
| **AI save-to-drive** | AI routes | `driveUploadService.createDriveFile` | `FILE_UPLOAD` dual | `drive` create | `file.uploaded` | — | `drive:item:created` | **C** |
| **V_Link resolve** | V_Link resolver | `driveVlinkAccessService` | PE + permissions | — | — | — | — | **C** |
| **Item activity read** | `GET .../activity` | `fileController.getItemActivity` | access gate | dual read legacy+log | — | — | — | **P** |

**Undocumented operations:** None identified for core File Hub mutations.

---

## Service ownership summary

| Service | Owns |
|---------|------|
| `driveDeleteService` | Soft trash, restore, permanent delete, empty trash, cleanup purge |
| `driveFileShareService` | File/folder share, update, revoke |
| `driveUploadService` | HTTP + AI file creation |
| `driveVisibilityService` | Browse, trash list, search, AI read scope |
| `driveNotificationService` | Collaborator notifications (trash/restore/permission) |
| `driveVlinkAccessService` | V_Link content access |
| `driveVlinkLifecycleService` | V_Link unlink on hard delete |
| `driveRealtimeService` | Multi-user socket fan-out |

Controllers (`fileController`, `folderController`, `folderPermissionController`, `trashController`) **orchestrate only** for delete and share paths (FH-6).

---

## Event coverage matrix

Registered: `file.uploaded`, `file.deleted`, `file.shared`, `file.renamed`, `file.moved`, `file.restored`, `file.unshared`, `folder.created`, `folder.shared`, `folder.renamed`, `folder.moved`, `folder.deleted`, `folder.restored`, `folder.unshared`.

| Action | Event | Emitter | Status |
|--------|-------|---------|--------|
| All file lifecycle | `file.*` | Services + controllers | **Complete** |
| All folder lifecycle | `folder.*` | Services + controllers | **Complete** |

---

## Module activity matrix

**Write path:** 100% `emitModuleActivityEvent` (`moduleId: 'drive'`). No new `prisma.activity` writes.

**Read path:** Item/recent endpoints dual-read legacy + normalized log — see [FILE_HUB_FH6_ACTIVITY_CONSOLIDATION.md](./FILE_HUB_FH6_ACTIVITY_CONSOLIDATION.md).

---

## Realtime matrix

| Operation | Event | Collaborator fan-out | Status |
|-----------|-------|---------------------|--------|
| Upload | `drive:item:created` | Owner | **Complete** |
| Rename/update | `drive:item:updated` | Owner | **Complete** |
| Move | `drive:item:moved` | Owner | **Complete** |
| Trash | `drive:item:deleted` | All collaborators | **Complete** |
| Restore | `drive:item:updated` + restored | All collaborators | **Complete** |
| Hard delete | `drive:item:deleted` permanent | All collaborators | **Complete** |
| Share/unshare | shareChange on `drive:item:updated` | Target + owner | **Complete** |
| Star/pin | `drive:item:pinned` | Owner | **Complete** |

---

## Phase completion map

| Phase | Primary contribution |
|-------|---------------------|
| FH-0 / 0.1 | Audit, Global Trash, `driveDeleteService` |
| FH-1 | Read paths, operation matrix baseline |
| FH-2 | Browse visibility, entities, domain events, capabilities |
| FH-3A | V_Link compliance |
| FH-4 | Search parity, upload service, enterprise parity, notification metadata |
| FH-5 | Restore/delete/permission notifications, collaborator realtime |
| **FH-6** | Delete/share consolidation, governance, reference certification |

**Matrix owner:** Platform architecture — update when new drive operations ship.
