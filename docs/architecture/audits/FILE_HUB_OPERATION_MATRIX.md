# File Hub Operation Matrix (FH-1)

**Module id:** `drive` (user-facing: **File Hub**)  
**Status:** FH-1 read/write path compliance artifact  
**Last updated:** 2026-05-28  
**Related:** [FILE_HUB_CONSTITUTIONAL_AUDIT.md](./FILE_HUB_CONSTITUTIONAL_AUDIT.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)

---

## Permission model (trash + AI reads)

Centralized in `server/src/services/driveVisibilityService.ts` (`DRIVE_TRASH_VISIBILITY_MODEL`).

| Role | Trash list visibility | AI read visibility |
|------|----------------------|-------------------|
| **Owner** | Own trashed items | All owned active files |
| **Editor** (`canWrite`) | Trashed items with write share | Shared + owned; PE `file:read` |
| **Viewer** (`canRead`) | Trashed items with read share | Shared + owned; PE `file:read` |
| **Unrelated user** | Hidden | Denied |
| **Business workspace** | Same rules; scoped by `dashboardId` on resource + PE scope | Same; `list_drive_files` accepts `dashboardId` |

**Restore / permanent delete:** require `canWriteFile` / `canWriteFolder` + Policy Engine — not visibility-only.

**Empty trash:** owner-only (`emptyDriveTrash`) — collaborators cannot bulk-delete another user's trash.

---

## Master operation matrix

Legend: **C** = compliant, **P** = partial, **N** = non-compliant

| Operation | Entry point | Canonical service | Policy (PE) | Persistence | Domain event | Module activity | Notification | Realtime | Status |
|-----------|-------------|-------------------|-------------|-------------|--------------|-----------------|--------------|----------|--------|
| **File upload** | `POST /api/drive/files` → `uploadFile` | `fileController.uploadFile` | `FILE_UPLOAD` dual | `prisma.file.create` + storage | `file.uploaded` | `drive` upload | — | `drive:item:created` | **C** |
| **File rename** | `PUT /api/drive/files/:id` → `updateFile` | `fileController.updateFile` | `FILE_UPDATE` dual | `prisma.file.updateMany` | — (missing) | `drive` update | — | `drive:item:updated` | **P** |
| **File move** | `PUT /api/drive/files/:id` (folderId) / `moveFile` | `fileController.moveFile` | `FILE_MOVE` dual | `prisma.file.updateMany` | — (missing) | `drive` move | — | `drive:item:moved` | **P** |
| **File trash** | Global Trash / deprecated drive trash → `softTrashDriveItem` | `driveDeleteService` | `FILE_DELETE` dual | `trashedAt` set | `file.deleted` (soft) | `drive` delete (soft) | — | `drive:item:deleted` | **C** |
| **File restore** | `POST /api/trash/:id/restore` → `restoreDriveItem` | `driveDeleteService` | `FILE_UPDATE` dual | `trashedAt` null | — (missing) | `drive` restore *(FH-1)* | — | `drive:item:updated` *(FH-1)* | **P** |
| **File permanent delete** | Global Trash delete → `permanentlyDeleteDriveFile` | `driveDeleteService` | `FILE_DELETE` dual | hard delete + storage | `file.deleted` (hard) | `drive` delete | — | — | **P** |
| **File share** | `POST .../permissions` / AI `share_file` | `driveFileShareService.grantFileSharePermission` | `FILE_SHARE` dual | `filePermission.upsert` | `file.shared` | `drive` share *(FH-1)* | `drive_permission` | — | **P** |
| **File unshare** | `DELETE .../permissions/:userId` | `fileController.revokeFilePermission` | owner-only gate | `filePermission.deleteMany` | — (missing) | `drive` unshare *(FH-1)* | `drive_permission` | — | **P** |
| **Folder create** | `POST /api/drive/folders` | `folderController.createFolder` | `FOLDER_CREATE` dual | `prisma.folder.create` | — (missing) | `drive` create | — | `drive:item:created` | **P** |
| **Folder rename** | `PUT /api/drive/folders/:id` | `folderController.updateFolder` | `FOLDER_UPDATE` dual | `prisma.folder.update` | — (missing) | `drive` update | — | `drive:item:updated` | **P** |
| **Folder move** | `POST .../move` | `folderController.moveFolder` | `FOLDER_UPDATE` dual *(FH-1)* | `prisma.folder.update` | — (missing) | `drive` move | — | `drive:item:moved` | **P** |
| **Folder trash** | Global Trash → `softTrashDriveItem` | `driveDeleteService` | `FOLDER_DELETE` dual | `trashedAt` set | — (missing) | `drive` delete (soft) | — | `drive:item:deleted` | **P** |
| **Folder restore** | Global Trash restore | `driveDeleteService` | `FOLDER_UPDATE` dual | `trashedAt` null | — (missing) | `drive` restore *(FH-1)* | — | `drive:item:updated` *(FH-1)* | **P** |
| **Folder permanent delete** | Global Trash delete | `driveDeleteService` cascade | `FOLDER_DELETE` dual | cascade hard delete | — (missing) | `drive` delete | — | — | **P** |
| **Folder share** | `folderPermissionController.grantFolderPermission` | inline | `FOLDER_SHARE` dual | `folderPermission.upsert` | `folder.shared` | `drive` share *(FH-1)* | `drive_permission` | — | **P** |
| **Folder unshare** | `revokeFolderPermission` | inline | owner-only gate | `folderPermission.deleteMany` | — (missing) | `drive` unshare *(FH-1)* | `drive_permission` | — | **P** |
| **List trash (Global)** | `GET /api/trash/items` | `trashController.listTrashedItems` + `driveVisibilityService` | — (read) | permission-aware query | — | — | — | — | **C** *(FH-1)* |
| **AI list files** | tool `list_drive_files` | `driveVisibilityService.listAccessibleDriveFiles` | `FILE_READ` per file | permission-aware query | — | — | — | — | **C** *(FH-1)* |
| **AI attachments** | `aiConversationController.addMessage` | `validateAccessibleFileIds` | `FILE_READ` per file | — | — | — | — | — | **C** *(FH-1)* |
| **AI file analysis** | `DigitalLifeTwinCore` | `fetchAccessibleActiveFiles` | `FILE_READ` per file | — | — | — | — | — | **C** *(FH-1)* |
| **AI context recent** | `GET /api/drive/ai/context/recent` | `listAccessibleDriveFiles` | `FILE_READ` per file | permission-aware | — | — | — | — | **C** *(FH-1)* |
| **AI save-to-drive** | `POST /api/ai/generate-image/save-to-drive` | inline in `routes/ai.ts` | **none** | direct `prisma.file.create` | **none** | **none** | — | **none** | **N** (documented; FH-2+) |

---

## Event coverage matrix

Registered types: `file.uploaded`, `file.deleted`, `file.shared`, `folder.shared` (`domainEventRegistry.ts`).

| Action | Event type | Status | Notes |
|--------|-----------|--------|-------|
| File upload | `file.uploaded` | **complete** | `fileController.uploadFile` |
| File rename | — | **missing** | Needs `file.renamed` registry entry (FH-2) |
| File move | — | **missing** | Needs `file.moved` (FH-2) |
| File trash | `file.deleted` (soft) | **complete** | `driveDeleteService`, `fileController` legacy |
| File restore | — | **missing** | Intentionally omitted FH-1; add `file.restored` later |
| File hard delete | `file.deleted` (hard) | **complete** | `driveDeleteService` |
| File share | `file.shared` | **complete** | `driveFileShareService` |
| File unshare | — | **missing** | Needs `file.unshared` (FH-2) |
| Folder create | — | **missing** | FH-2 |
| Folder rename/move/trash/restore/delete | — | **missing** | FH-2 |
| Folder share | `folder.shared` | **complete** | `folderPermissionController` |
| Folder unshare | — | **missing** | FH-2 |

---

## Module activity coverage matrix

Normalized via `emitModuleActivityEvent` (`moduleId: 'drive'`).

| Action | Activity | Status | Location |
|--------|----------|--------|----------|
| File upload | `upload` | **complete** | `fileController.uploadFile` |
| File rename | `update` | **complete** | `fileController.updateFile` |
| File move | `move` | **complete** | `fileController.moveFile`, `updateFile` |
| File trash | `delete` (soft metadata) | **complete** | `driveDeleteService` |
| File restore | `restore` | **complete** *(FH-1)* | `driveDeleteService.restoreDriveItem` |
| File hard delete | `delete` | **complete** | `driveDeleteService` |
| File share | `share` | **complete** *(FH-1)* | `driveFileShareService` |
| File unshare | `unshare` | **complete** *(FH-1)* | `fileController.revokeFilePermission` |
| Folder create | `create` | **complete** | `folderController.createFolder` |
| Folder rename | `update` | **complete** | `folderController.updateFolder` |
| Folder move | `move` | **complete** | `folderController.moveFolder` |
| Folder trash | `delete` (soft) | **complete** | `driveDeleteService` |
| Folder restore | `restore` | **complete** *(FH-1)* | `driveDeleteService.restoreDriveItem` |
| Folder hard delete | `delete` | **complete** | `driveDeleteService` |
| Folder share | `share` | **complete** *(FH-1)* | `folderPermissionController` |
| Folder unshare | `unshare` | **complete** *(FH-1)* | `folderPermissionController` |

Legacy `prisma.activity` rows still created on some paths (upload, update, trash) — parallel to normalized module activity; consolidation is FH-2.

---

## Realtime compliance matrix

Transport: `getChatSocketService().broadcastDriveEvent(ownerUserId, event, payload)`.

| Operation | Event emitted | Client refresh expected | Status |
|-----------|---------------|-------------------------|--------|
| Upload | `drive:item:created` | File list refresh | **complete** |
| Rename | `drive:item:updated` | Item metadata refresh | **complete** |
| Move (file) | `drive:item:moved` | List + folder navigation | **complete** |
| Move (folder) | `drive:item:moved` | List + folder navigation | **complete** |
| Trash | `drive:item:deleted` | Remove from list | **complete** |
| Restore | `drive:item:updated` (+ `restored: true`) | Reappear in list *(FH-1)* | **complete** |
| Hard delete | — | Stale until manual refresh | **partial** |
| Share / unshare | — | No broadcast | **partial** (documented; FH-2) |
| Star / pin | `drive:item:pinned` | Star state | **complete** |

No realtime redesign in FH-1 — only restore broadcast added.

---

## AI read-path audit (FH-1)

| Path | Before FH-1 | After FH-1 |
|------|-------------|------------|
| `list_drive_files` tool | Owner-only Prisma | `listAccessibleDriveFiles` + PE |
| AI message attachments | Owner + `canRead` only | `validateAccessibleFileIds` (+ `canWrite` share, PE) |
| `DigitalLifeTwinCore` analysis | Owner + `canRead` only | `fetchAccessibleActiveFiles` |
| `/api/drive/ai/context/recent` | Owner-only | Accessible owned + shared |
| `/api/drive/ai/context/storage` | Owner-only counts | Accessible owned + shared counts |
| `/api/drive/ai/query/count` | Owner-only | Accessible scope |
| `/api/ai/extract-document` | Owner + `canRead` | `fetchAccessibleActiveFiles` |
| `downloadFile` | `canReadFile` | unchanged (already compliant) |
| `POST /api/ai/generate-image/save-to-drive` | No folder write check, no events | **Gap documented** — FH-2 |

---

## Remaining FH-1 gaps (explicitly out of scope)

1. **Domain events** for rename, move, restore, unshare, folder lifecycle — registry + emitters (FH-2).
2. **AI save-to-drive / edit-image saveToDrive** — bypass canonical upload pipeline (FH-2).
3. **listFiles / listFolders UI listing** — still owner-centric in places; full permission-aware browse (FH-2).
4. **Share/unshare realtime** — no socket fan-out to collaborators (FH-2).
5. **Hard delete realtime** — no `drive:item:deleted` on permanent delete from trash (low impact).
6. **Storage quota stats** — shared-file bytes counted in AI storage context but quota enforcement unchanged (FH-5).

---

## FH-1 completion recommendation

**Recommend marking FH-1 complete** for the scoped batch:

- Permission-aware Global Trash drive visibility implemented and tested.
- AI read paths aligned to visibility + Policy Engine.
- Restore activity + realtime gap closed (low-risk).
- Share/unshare module activity added (file + folder).
- Canonical operation, event, activity, and realtime matrices delivered.

Proceed to **FH-1.5 / FH-2** only after explicit approval; do not start capability reconciliation or V_Link UX in this batch.

---

## FH-2 progress (in flight — post `file-hub-fh-1-complete`)

| Area | Status | Notes |
|------|--------|-------|
| Browse visibility | **Done** | `listFiles` / `listFolders` → `driveVisibilityService` browse helpers |
| Entity model | **Done** | `platformEntityRegistry` + manifest `entities[]` + startup registration |
| Capability matrix | **Done** | `coreModuleRegistry` + manifest `preview`; AI purpose versioning claim removed |
| Domain events | **Done** | `file.renamed/moved/restored/unshared`, `folder.created/renamed/moved/deleted/restored/unshared` |
| Realtime | **Done** | Share/unshare fan-out; permanent delete + restore multi-user broadcast |

**Remaining FH-2:** AI save-to-drive canonical pipeline, satellite page consolidation, notification manifest metadata block, legacy `prisma.activity` consolidation.
