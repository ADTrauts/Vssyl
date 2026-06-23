# Drive Activity Migration Report

**Program:** Platform Kernel Wave 3 — Package 3 (ACT-R1 P1)  
**Date:** 2026-06-23  
**Status:** **Complete**

---

## 1. Scope

Migrate Drive / File Hub activity **read** APIs from legacy `prisma.activity` and ad-hoc `prisma.log` filtering to `platformActivityQueryService`.

**Non-goals:** Drive feature work, File Hub modernization, sharing changes.

---

## 2. Consumers migrated

| ID | Endpoint / handler | Operation | Before | After |
|----|-------------------|-----------|--------|-------|
| **C-06** | `GET /api/drive/items/:itemId/activity` | `getItemActivity` | `Log` filter + `prisma.activity.findMany` | `getActivityForEntity` (drive module, file/folder target) |
| **C-07** | `GET /api/drive/folders/activity/recent` | `getRecentActivity` | `prisma.activity` + `prisma.log` | `getRecentActivity` (drive module, 30-day window) + legacy UI mapper |

---

## 3. Mapping layer

**File:** `server/src/services/platform/platformActivityDriveMapper.ts`

| Function | Purpose |
|----------|---------|
| `toNormalizedModuleActivityLogRow` | API `normalizedEvents` DTO for `DriveDetailsPanel` |
| `mapDriveLegacyActionType` | Maps normalized actions → legacy `Activity.type` enum |
| `toDriveLegacyActivityRow` | Builds legacy activity rows for `/drive/recent` UI |

---

## 4. API response behavior

### Item activity (`getItemActivity`)

| Case | `activities` | `normalizedEvents` |
|------|--------------|-------------------|
| Folder owned by user | `[]` | Entity-scoped normalized events |
| File owned / permitted | `[]` | Entity-scoped normalized events |

Legacy `Activity` rows removed from read path. UI already renders normalized events first (`DriveDetailsPanel`).

### Recent activity (`getRecentActivity`)

| Field | Source |
|-------|--------|
| `activities` | Mapped from file-target normalized events + `File`/`User` enrichment |
| `normalizedEvents` | All drive-module records in window |

Preserves `/drive/recent` page expectations (file name, user, action icons).

---

## 5. Visibility / audit

- File access still gated by ownership / `file_permissions` before activity fetch
- Folder activity scoped to owning user (unchanged)
- Entity filter applied in query service (`targetType` + `targetId`)

---

## 6. Tests

| Suite | Coverage |
|-------|----------|
| `platformActivityDriveMapper.test.ts` | Mapper + action type mapping |
| `fileController.itemActivity.test.ts` | File/folder delegation, 401 |
| `folderController.recentActivity.test.ts` | Recent activity delegation + legacy row mapping |
| `platformActivityQueryService.test.ts` | `getActivityForEntity` filter |

---

**Last updated:** 2026-06-23
