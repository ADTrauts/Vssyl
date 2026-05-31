# File Hub Search Compliance Report (FH-4 / P0-S1)

**Date:** 2026-05-31  
**Scope:** Federated search parity with browse, trash, and AI visibility

---

## Before

| Aspect | Behavior |
|--------|----------|
| File query | `{ userId }` owner-only filter in `searchController.searchDrive` |
| Folder query | `{ userId }` owner-only |
| Shared content | **Invisible** in global search |
| Policy Engine | Not applied per hit |
| Visibility service | Not used |

---

## After

| Aspect | Behavior |
|--------|----------|
| File query | `searchAccessibleDriveFiles` via `driveVisibilityService` |
| Folder query | `searchAccessibleDriveFolders` |
| Shared content | Owned **or** `FilePermission` / `FolderPermission` (read/write) |
| Policy Engine | `FILE_READ` dual evaluation per candidate row |
| Trashed exclusion | `trashedAt: null` |
| Provider label | `File Hub` (user-facing) |

**Implementation:** `server/src/services/driveVisibilityService.ts` (`searchAccessibleDriveFiles`, `searchAccessibleDriveFolders`); `server/src/controllers/searchController.ts` delegates to these helpers.

---

## Remaining gaps

| Gap | Priority | Notes |
|-----|----------|-------|
| Workspace/dashboard-scoped search facet | P2 | Search is global across accessible items; no `dashboardId` filter in federated provider |
| Domain-event search index | P3 | Platform v2; events emitted but no consumer |
| Search permission metadata on results | P3 | Results still mark `read: granted` when returned; fine for v1 |

**FH-4 success criterion met:** Search visibility matches browse visibility for owned + shared files and folders.
