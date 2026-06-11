# Drive Per-Item Permanent Delete ConfirmModal Closeout (Wave 3B-3)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation  
**Scope:** Per-item permanent delete only — 2 files

---

## 1. Verdict

**PASS** — Both per-item permanent delete flows gated behind `ConfirmModal`. `pnpm type-check` PASS. Delete APIs execute only after confirm. Empty-trash purge flows unchanged (3B-1).

---

## 2. Migrations

| # | File | Flow | Before | After |
|---|------|------|--------|-------|
| 1 | `web/src/app/drive/trash/page.tsx` | Per-item “Delete Forever” / grid “Delete” | `handleDelete` → immediate `deleteItem` | `requestPermanentDelete` → `pendingPermanentDeleteItem` snapshot → `ConfirmModal` → `executePermanentDelete` |
| 2 | `web/src/components/GlobalTrashBin.tsx` | Per-item X (delete permanently) | `handleDelete` → immediate `deleteItem` | `requestPermanentDelete` → `pendingPermanentDeleteItem` snapshot → `ConfirmModal` → `executePermanentDelete` |

---

## 3. Copy

| Surface | Title | Description | Confirm label |
|---------|-------|-------------|---------------|
| Both | `Delete forever?` | `Permanently delete "${name}"? This cannot be undone.` | `Delete forever` |

**Rationale:** No prior per-item confirm copy existed (one-click delete). Standardized destructive copy per 3B-3 spec; item `name` snapshotted at open.

---

## 4. Snapshot shape

```ts
Pick<TrashedItem, 'id' | 'name' | 'moduleId' | 'type'>
```

Preserves modal copy and `deleteItem` query params (`moduleId`, `type`) if list re-renders before confirm.

---

## 5. Pattern compliance

| Rule | Status |
|------|--------|
| Permanent delete runs only on Confirm | ✅ `executePermanentDelete` |
| Cancel / Escape / backdrop → no action | ✅ `onClose` clears `pendingPermanentDeleteItem` |
| `variant="destructive"` | ✅ |
| Empty-trash purge unchanged | ✅ 3B-1 modals untouched |
| Soft delete / restore untouched | ✅ |

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Direct `deleteItem` on button click | **0** (both surfaces) |
| Empty-trash `ConfirmModal` | Unchanged |

---

## 7. Remaining (out of 3B-3 scope)

| Item | Wave |
|------|------|
| `DriveModule` drag-to-trash skips ConfirmModal | **3B-2** |
| Trash page HTML5 drop → `trashItem` (edge re-trash) | **3B-2 / D-7** |
| Folder `prompt()` × 7 | **3B-4** |
| Keyboard Delete + trash a11y | **3B-5** |
| Drive interaction certification + manual QA | **3B-6** |

**Native permanent-delete gaps elsewhere:** None in Drive trash cluster. Other modules’ trash surfaces are out of 3B scope.

---

## 8. Next wave

**3B-2** — Drag-to-trash parity (`DriveModule` → `requestMoveToTrash`). Do not start unless explicitly reprioritized.
