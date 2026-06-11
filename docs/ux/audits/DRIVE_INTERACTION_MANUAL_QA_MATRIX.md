# Drive Interaction Manual QA Matrix

**Status:** Ready for sign-off (Wave 3B-5 / 3B-6 gate)  
**Date:** 2026-06-03  
**Scope:** File Hub / Drive interaction certification  
**Automated gate:** `pnpm type-check` PASS

Use this matrix for human QA before **3B-6** certification closeout.

---

## How to record

| Column | Meaning |
|--------|---------|
| **Surface** | Where to test |
| **Action** | Steps |
| **Expected** | Pass criteria |
| **Tester** | Name / date |
| **Result** | PASS / FAIL / N/A |

---

## Soft delete

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 1 | Main Drive (`DriveModule`) | Context menu → Delete | Move-to-trash ConfirmModal → confirm moves item | | |
| 2 | Main Drive | Details panel → Delete | Same ConfirmModal | | |
| 3 | Main Drive | Bulk select → toolbar Delete | Bulk ConfirmModal with count | | |
| 4 | Main Drive | Drag item to global trash bin (dnd-kit) | Move-to-trash ConfirmModal (3B-2) | | |
| 5 | Starred | Context menu → Delete | ConfirmModal | | |
| 6 | Starred | Drag to trash bin | ConfirmModal | | |

---

## Keyboard

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 7 | Main Drive | Select 1 item → `Delete` | Single-item ConfirmModal | | |
| 8 | Main Drive | Select 2+ items → `Delete` | Bulk ConfirmModal | | |
| 9 | Main Drive | No selection → `Delete` | No action | | |
| 10 | Main Drive | Focus search input → `Delete` | No action (typing preserved) | | |
| 11 | Main Drive | ConfirmModal open → `Delete` | No duplicate modal | | |

---

## HTML5 drop (sidebar / legacy drag)

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 12 | Global trash bin | HTML5 drop drive item | Move-to-trash ConfirmModal (3B-5) | | |
| 13 | Trash page main | HTML5 drop drive file/folder | Move-to-trash ConfirmModal (3B-5) | | |
| 14 | Either drop flow | Cancel / Escape / backdrop | No trash action | | |

---

## Trash management

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 15 | Trash page | Restore item | Restores without confirm | | |
| 16 | GlobalTrashBin | Restore item | Restores without confirm | | |
| 17 | Trash page | Per-item Delete forever | Permanent delete ConfirmModal (3B-3) | | |
| 18 | GlobalTrashBin | Per-item X delete | Permanent delete ConfirmModal (3B-3) | | |
| 19 | Trash page | Empty File Hub Trash | Empty-trash ConfirmModal (3B-1) | | |
| 20 | GlobalTrashBin | Empty trash | Empty-trash ConfirmModal (3B-1) | | |

---

## Folder create

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 21 | Main Drive sidebar | New → Folder | `DriveCreateFolderModal` (3B-4) | | |
| 22 | Main Drive toolbar | New folder button | Same modal | | |
| 23 | Starred / Shared / Recent / Trash sidebar | New folder | Same modal | | |
| 24 | Business workspace drive | Sidebar New folder | `DriveCreateFolderModal` (3B-4b) | | |
| 25 | Any folder modal | Blank name → Create | Submit disabled | | |
| 26 | Any folder modal | Cancel / Escape / backdrop | No folder created | | |

---

## Accessibility & chrome

| # | Surface | Action | Expected | Tester | Result |
|---|---------|--------|----------|--------|--------|
| 27 | GlobalTrashBin | Tab to trash button | Visible focus ring | | |
| 28 | GlobalTrashBin | Screen reader / inspect | Trash button `aria-label` + `aria-expanded` | | |
| 29 | GlobalTrashBin | Restore / delete icons | Descriptive `aria-label` per item | | |
| 30 | Trash page | Inspect drop region | `aria-label` on main drop zone | | |
| 31 | Main Drive | Dark mode | Modals, trash, lists readable | | |
| 32 | ConfirmModal | Open any confirm → Escape | Closes without action | | |
| 33 | ConfirmModal | Backdrop click | Closes without action | | |

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| QA / Product | | | |
| Engineering | | | |

**Gate for 3B-6:** All P0 rows (1–20, 7–14) PASS unless documented exception.
