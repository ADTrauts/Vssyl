# File Hub Notification Inventory (FH-4 / P1-N1)

**Date:** 2026-05-31  
**Manifest source:** `server/src/startup/builtInModuleManifests.ts` → reconciled on startup

---

## Registered metadata (discovery)

| Type | Name | Emitted today | Notes |
|------|------|---------------|-------|
| `drive_permission` | File or folder shared | **Yes** | `driveFileShareService`, folder permission controllers |
| `drive_shared` | File shared (legacy) | Partial | Legacy type in `NotificationService`; prefer `drive_permission` |
| `drive_file_shared` | File shared | Planned | Metadata only |
| `drive_file_unshared` | File unshared | Planned | Metadata only |
| `drive_folder_shared` | Folder shared | Planned | Metadata only |
| `drive_folder_unshared` | Folder unshared | Planned | Metadata only |
| `drive_item_restored` | Item restored | Planned | Metadata only |
| `drive_item_deleted` | Item moved to trash | Planned | Metadata only |

---

## Implementation status

| Event | Status |
|-------|--------|
| File share | Implemented (`drive_permission`) |
| File unshare | Implemented (`drive_permission` revocation copy) |
| Folder share | Implemented (`drive_permission`) |
| Folder unshare | Implemented |
| Restore | **Missing emitter** |
| Delete/trash | **Missing emitter** |
| Permission update (non share/revoke) | **Missing** |

---

## FH-4 outcome

Manifest `notifications[]` block added and merged via `reconcileBuiltInManifest`. Notification center can discover File Hub types on next module reconcile.

**Next work (post-FH-4):** Emit `drive_item_restored` / `drive_item_deleted` from `driveDeleteService` for collaborators; split share types if product requires distinct copy.
