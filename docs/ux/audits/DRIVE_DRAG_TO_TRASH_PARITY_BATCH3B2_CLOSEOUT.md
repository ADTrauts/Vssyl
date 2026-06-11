# Drive Drag-to-Trash Parity Closeout (Wave 3B-2)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation  
**Scope:** `DriveModule` drag-to-trash soft-delete gate only — 1 file

---

## 1. Verdict

**PASS** — `DriveModule` drag-to-trash now routes through existing `requestMoveToTrash` → `ConfirmModal` → `executeMoveItemToTrash`. `pnpm type-check` PASS. No second modal pattern introduced.

---

## 2. Change summary

| File | Handler | Before | After |
|------|---------|--------|-------|
| `web/src/components/modules/DriveModule.tsx` | `handleDragEnd` (`over.id === 'global-trash-bin'`) | Immediate `trashItem` + optimistic remove | `requestMoveToTrash(draggedItem.id)` → existing `pendingItemToTrash` `ConfirmModal` |

**Lines removed:** ~35 lines of inline trash-on-drop logic (optimistic update, `trashItem`, toast, `pendingOperationsRef` on drop).

**Preserved on confirm:** `executeMoveItemToTrash` still handles optimistic update, `pendingOperationsRef`, toast, and rollback — unchanged from menu/details delete path.

---

## 3. ConfirmModal integration

Reuses existing state (no new modal):

| State / handler | Role |
|-----------------|------|
| `pendingItemToTrash` | Set by `requestMoveToTrash` on trash drop |
| `requestMoveToTrash` | Opens modal; closes context menu if open |
| `executeMoveItemToTrash` | Runs `trashItem` only after confirm |
| `pendingTrashItem` | Modal description copy |
| `isMovingItemToTrash` | Modal loading state |

**Modal copy (unchanged):** title `Move to trash?`; description `Are you sure you want to move "${name}" to trash?`; confirm `Move to trash`; `variant="destructive"`.

---

## 4. Pattern compliance

| Rule | Status |
|------|--------|
| `trashItem` not called from drag handler before confirm | ✅ |
| Cancel / Escape / backdrop → no trash | ✅ `onClose` clears `pendingItemToTrash` |
| Menu / details / bulk delete unchanged | ✅ |
| Folder move drag paths unchanged | ✅ |
| Parity with `starred/page.tsx` drag-to-trash | ✅ both call `requestMoveToTrash` |

---

## 5. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `trashItem` in `handleDragEnd` trash branch | **0** |
| Second ConfirmModal added | **No** |

---

## 6. Remaining drag/drop parity gaps (out of 3B-2 scope)

| Surface | Behavior | Wave |
|---------|----------|------|
| `GlobalTrashBin` HTML5 `onDrop` | No soft-delete confirm (cross-module) | Advisory |
| `drive/trash/page` HTML5 `onDrop` | Re-trash edge path, no confirm | D-7 / advisory |
| Bulk drag selection to trash | Not implemented | Low priority |
| `EnhancedDriveModule` | Not audited in 3B-2 | Separate if needed |

---

## 7. Next wave

**3B-4** — Folder create modal (replace 7× `prompt()`). Do not start unless explicitly requested.
