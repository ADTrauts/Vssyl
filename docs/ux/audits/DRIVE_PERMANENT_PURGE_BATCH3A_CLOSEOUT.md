# Drive Permanent Purge ConfirmModal Closeout (Wave 3B-1 / Batch 3A)

**Status:** **Done**  
**Date:** 2026-06-03  
**Mode:** Implementation  
**Scope:** Empty-trash permanent purge only — 2 files

---

## 1. Verdict

**PASS** — Both native empty-trash confirms migrated to `ConfirmModal`. `pnpm type-check` PASS. Purge APIs execute only after confirm.

---

## 2. Migrations

| # | File | Flow | Before | After |
|---|------|------|--------|-------|
| 1 | `web/src/app/drive/trash/page.tsx` | Empty File Hub Trash | `window.confirm('Permanently delete all File Hub items in trash?')` | `pendingEmptyTrash` + `ConfirmModal` |
| 2 | `web/src/components/GlobalTrashBin.tsx` | Empty trash (all modules) | `confirm(\`…permanently delete all ${n} items?\`)` | `pendingEmptyTrash` + count snapshot + `ConfirmModal` |

---

## 3. Copy preservation

| Surface | Title | Description | Confirm label |
|---------|-------|-------------|---------------|
| `drive/trash/page.tsx` | `Empty File Hub Trash?` (matches button) | `Permanently delete all File Hub items in trash?` (**exact** legacy confirm text) | `Empty File Hub Trash` (matches button) |
| `GlobalTrashBin.tsx` | `Empty trash?` (matches `title` attr) | `Are you sure you want to permanently delete all ${n} items?` (**exact** legacy; `n` snapshotted at open) | `Empty trash` |

**Documented difference:** Drive route scopes purge to File Hub (`emptyDriveTrash`); GlobalTrashBin purges all modules (`emptyTrash`). Copy was already different before migration — preserved per surface.

---

## 4. Pattern compliance

| Rule | Status |
|------|--------|
| Purge runs only on Confirm | ✅ `executeEmptyDriveTrash` / `executeEmptyTrash` |
| Cancel / Escape / backdrop → no action | ✅ `onClose` only clears pending state |
| `variant="destructive"` | ✅ |
| Count snapshot at open (GlobalTrashBin) | ✅ `pendingEmptyTrashCount` |

---

## 5. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `confirm(` in `drive/trash/page.tsx` | **0** |
| `confirm(` in `GlobalTrashBin.tsx` | **0** |
| Per-item permanent delete touched | **No** (3B-3 scope) |

---

## 6. Remaining (out of 3B-1 scope)

| Item | Wave |
|------|------|
| Per-item permanent delete (trash page, GlobalTrashBin) | **3B-3** |
| Drag-to-trash parity | **3B-2** |
| Folder `prompt()` × 7 | **3B-4** |
| Keyboard Delete + a11y | **3B-5** |

---

## 7. Next wave

**3B-3** — Per-item permanent delete confirms (recommended next per 3B-0 order). **Do not** start 3B-2 in same train unless reprioritized.
