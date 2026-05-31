# Drive Legacy Cleanup Report (FH-4 / P1-D1)

**Date:** 2026-05-31

---

## Deprecated drive-only trash endpoints

| Endpoint | Controller | Active callers |
|----------|------------|----------------|
| `GET /api/drive/files/trashed` | `listTrashedFiles` | None in web app (deprecated `web/src/api/drive.ts` only) |
| `POST /api/drive/files/:id/restore` | `restoreFile` | None |
| `DELETE /api/drive/files/:id/hard-delete` | `hardDeleteFile` | Server test only |
| `GET /api/drive/folders/trashed` | `listTrashedFolders` | None |
| `POST /api/drive/folders/:id/restore` | `restoreFolder` | None |
| `DELETE /api/drive/folders/:id/hard` | `hardDeleteFolder` | None |

**Canonical replacement:** Global Trash `/api/trash/*` with `moduleId=drive`.

---

## Retirement path

1. **Now:** Endpoints remain mounted; log `drive_trash_api_deprecated` on use.
2. **Next:** Remove deprecated exports from `web/src/api/drive.ts` after one release with zero logged calls.
3. **Later:** Remove routes after API deprecation window; keep `hardDeleteFile` test migration to Global Trash delete path.

---

## Client migration

| Legacy | Replacement |
|--------|-------------|
| `listTrashedFiles` | `useGlobalTrash()` with `moduleId=drive` |
| `restoreFile` / `restoreFolder` | `useGlobalTrash().restoreItem()` |
| `hardDeleteFile` | `useGlobalTrash().deleteItem()` |

**FH-4 success criterion met:** Legacy path audited; no active product callers; retirement documented.
