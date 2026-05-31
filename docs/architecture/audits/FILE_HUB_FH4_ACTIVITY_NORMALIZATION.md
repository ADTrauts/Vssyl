# Activity Normalization Report (FH-4 / P1-A1)

**Date:** 2026-05-31

---

## Models

| Model | Purpose | Status |
|-------|---------|--------|
| `emitModuleActivityEvent` | Normalized platform module activity | **Canonical** |
| `prisma.activity` | Legacy per-file activity rows | **Deprecated for new writes** |

---

## FH-4 conversions (legacy removed)

| Path | Before | After |
|------|--------|-------|
| HTTP upload | Both legacy + normalized | Normalized only via `driveUploadService` |
| AI save-to-drive | No activity | Normalized via `driveUploadService` |
| AI edit-image save | No activity | Normalized via `driveUploadService` |
| Soft trash (`driveDeleteService`) | Both | Normalized only |
| File update/rename (`fileController`) | Both | Normalized only |
| File move (`fileController`) | Both | Normalized only |
| File delete (`fileController` inline) | Both | Normalized only |

---

## Remaining legacy (documented migration)

| Path | Legacy | Normalized | Migration |
|------|--------|------------|-----------|
| File download | `prisma.activity` create | None | Add `drive` read activity or omit (low value) |
| File detail activity API | Reads `prisma.activity` | — | Migrate read path to module activity feed |
| Hard delete cleanup | `prisma.activity.deleteMany` | N/A | Keep until legacy table retired |

---

## Duplicate activity risk

| Risk | Mitigation |
|------|------------|
| Global trash + inline `deleteFile` both emit module activity | Consolidate `deleteFile` → `softTrashDriveItem` (P1-C1 controller extraction) |

**FH-4 success criterion met:** Drift reduced on all upload/trash/update/move paths; remaining legacy documented.
