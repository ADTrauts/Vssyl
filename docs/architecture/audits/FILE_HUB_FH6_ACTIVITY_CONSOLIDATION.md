# File Hub FH-6 Activity Consolidation Report

**Date:** 2026-05-31  
**Phase:** FH-6 — Reference Implementation Finalization (Part 3)  
**Canonical write path:** `emitModuleActivityEvent` (`moduleActivityService`, `moduleId: 'drive'`)  
**Canonical read path (target):** `prisma.log` where `operation = 'module_activity_event'` and `module = 'drive'`

---

## Write path audit

| Operation | Legacy `prisma.activity.create` | Normalized module activity | Status |
|-----------|--------------------------------|---------------------------|--------|
| File upload | Removed (FH-4) | `driveUploadService` / controller | **Normalized** |
| File rename/update | Removed (FH-4) | `fileController.updateFile` | **Normalized** |
| File move | Removed (FH-4) | `fileController.moveFile` | **Normalized** |
| File trash | Removed (FH-6) | `driveDeleteService.softTrashDriveItem` | **Normalized** |
| File restore | Never legacy | `driveDeleteService.restoreDriveItem` | **Normalized** |
| File hard delete | Never legacy | `driveDeleteService` | **Normalized** |
| File share/unshare | Removed (FH-2) | `driveFileShareService` | **Normalized** |
| Folder lifecycle | Removed (FH-4/6) | Controllers + `driveDeleteService` | **Normalized** |
| File download | Removed (FH-6) | None (read-only; no activity required) | **Normalized** |

**No File Hub write path creates new `prisma.activity` rows.**

---

## Read path audit

| Consumer | Reads legacy `Activity` | Reads normalized log | Migration |
|----------|------------------------|---------------------|-----------|
| `fileController.getItemActivity` | Yes (`fileId`) | Yes (`prisma.log` filtered) | **Dual-read — document** |
| `folderController.getRecentActivity` | Yes (`userId`) | Yes (merged response) | **Dual-read — document** |
| `activityFeedController` | Yes (platform feed) | Partial | **Platform migration (FH-7+)** |
| `analyticsController` | Yes | No | **Platform migration** |
| `CrossModuleContextEngine` | Yes | No | **AI platform migration** |
| `DigitalLifeTwinService` | Yes | No | **AI platform migration** |
| `ai-context-debug` route | Yes | No | Debug only |

---

## Delete path (legacy cleanup)

| Location | Mutation | Rationale |
|----------|----------|-----------|
| `driveDeleteService.deleteFileRecords` | `prisma.activity.deleteMany({ fileId })` | FK cleanup when hard-deleting files |

This is **not** a write-path regression; it prevents orphaned legacy rows.

---

## Recommended migration phases

### Phase A — File Hub UI/API (low risk)

1. Update `getItemActivity` to return `normalizedEvents` only; deprecate `activities` field.
2. Update `getRecentActivity` to normalized log query with drive module filter.
3. Client: File Hub activity panels consume normalized shape.

### Phase B — Platform feed (medium risk)

1. Extend `activityFeedController` to union normalized module activity across modules.
2. Retire cross-module `prisma.activity` reads once all modules emit normalized events.

### Phase C — AI/analytics (medium risk)

1. Add `listModuleActivityForUser(userId, moduleId)` helper.
2. Point AI context engines at normalized log or dedicated activity index.

---

## Straightforward conversions (not done in FH-6)

FH-6 scope excluded large platform migrations. The following are **documented only**:

- `activityFeedController` — requires multi-module normalized feed design.
- `analyticsController` — requires analytics pipeline decision (activity vs metrics).
- AI engines — require bounded query contract in `aiContextSystem.md`.

---

## Success criteria

| # | Criterion | Met |
|---|-----------|-----|
| 1 | No legacy activity writes on drive paths | **Yes** |
| 2 | All writes use `emitModuleActivityEvent` | **Yes** |
| 3 | Remaining reads documented with migration plan | **Yes** |
| 4 | Single canonical model defined | **Yes** (normalized module activity) |

**Part 3 verdict: Complete for FH-6 scope.** Legacy reads remain as documented platform debt (P2).
