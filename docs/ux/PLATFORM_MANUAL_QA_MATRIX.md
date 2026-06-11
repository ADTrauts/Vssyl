# Platform Manual QA Matrix (Wave 5G-QA)

**Status:** Ready for execution  
**Date:** 2026-06-03  
**Program:** UX Modernization Wave 5G-QA  
**Runbook:** [`PLATFORM_MANUAL_QA_RUNBOOK.md`](./PLATFORM_MANUAL_QA_RUNBOOK.md)  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)

---

## How to use

| Column | Meaning |
|--------|---------|
| **ID** | Case identifier (`PLT-*`, `DRV-*`, `NTF-*`, `TODO-*`, `CAL-*`, `CHT-*`) |
| **Area** | One of 15 standard areas (see legend) |
| **Viewport** | **D** desktop, **M** mobile 375px, **B** both required |
| **Pri** | P0 (L3 gate) / P1 / P2 |
| **Surface** | Where to test |
| **Action** | Steps |
| **Expected** | Pass criteria |
| **Finding** | Linked certification finding when applicable |
| **Tester** | Name |
| **Date** | YYYY-MM-DD |
| **Result** | PASS / FAIL / N/A / KNOWN-PWF / BLOCKED |
| **Notes** | Deviations, evidence path |

### Area legend

| # | Area |
|---|------|
| 1 | Core navigation |
| 2 | Create workflow |
| 3 | Edit workflow |
| 4 | Delete / destructive workflow |
| 5 | Bulk actions |
| 6 | Drag/drop |
| 7 | Mobile 375px viewport |
| 8 | Dark mode |
| 9 | Keyboard / Escape behavior |
| 10 | Empty / loading / error states |
| 11 | Cross-module integrations |
| 12 | Accessibility checks |
| 13 | ConfirmModal cancel/confirm behavior |
| 14 | Menu behavior |
| 15 | Layout / sidebar behavior |

**Heritage:** Drive interaction rows **DRV-01–33** align with [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md).

---

## Part 1 — Platform primitives

Run once per QA session before module sections.

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| PLT-01 | 13 | B | P0 | Any module ConfirmModal | Open confirm → **Cancel** button | Modal closes; no mutation | — | | | | |
| PLT-02 | 13 | B | P0 | Any module ConfirmModal | Open confirm → **Escape** | Modal closes; no mutation | — | | | | |
| PLT-03 | 13 | B | P0 | Any module ConfirmModal | Open confirm → backdrop click | Modal closes; no mutation | — | | | | |
| PLT-04 | 13 | B | P0 | Any module ConfirmModal | Confirm destructive action | Single mutation; modal closes; toast/feedback | — | | | | |
| PLT-05 | 12 | D | P0 | ConfirmModal | Tab through modal | Focus trapped in modal; primary/cancel reachable | — | | | | |
| PLT-06 | 11 | D | P0 | GlobalTrashBin | Restore trashed item from another module | Item restores in source module; no cross-dashboard leak | — | | | | |
| PLT-07 | 12 | D | P0 | GlobalTrashBin | Inspect trash toggle | `aria-label` + `aria-expanded` present | — | | | | |
| PLT-08 | 12 | D | P1 | GlobalTrashBin | Tab to trash button | Visible focus ring | — | | | | |
| PLT-09 | 8 | B | P0 | Platform chrome | Toggle dark mode | Header, sidebar, modals readable; no invisible text | — | | | | |
| PLT-10 | 15 | D | P0 | Business workspace | Open module from hub | Module landing renders; no generic dashboard fallthrough | — | | | | |
| PLT-11 | 9 | D | P0 | ConfirmModal open | Press `Delete` key again | No duplicate modal | — | | | | |
| PLT-12 | 7 | M | P0 | GlobalTrashBin | Open/close at 375px | Bin reachable; panel does not trap horizontal scroll on body | — | | | | |

---

## Part 2A — Drive (Reference UX #1)

**Routes:** `/drive`, `/drive/starred`, `/drive/shared`, `/drive/recent`, `/drive/trash`; business workspace drive branch.  
**Finding:** **F-1** (matrix sign-off), **F-8** (375px).

### 1 — Core navigation

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-34 | 1 | D | P0 | Personal `/drive` | Load main drive | File list renders; sidebar navigation visible | F-1 | | | | |
| DRV-35 | 1 | D | P1 | Sidebar | Navigate starred / shared / recent / trash | Each route loads without error | F-1 | | | | |
| DRV-36 | 1 | D | P0 | Business workspace | Open Drive from hub | Business-scoped drive loads; tenancy correct in header | F-1 | | | | |

### 2 — Create workflow

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-21 | 2 | D | P0 | Main sidebar | New → Folder | `DriveCreateFolderModal` opens (not `prompt`) | F-1 | | | | = legacy #21 |
| DRV-22 | 2 | D | P0 | Main toolbar | New folder button | Same modal | F-1 | | | | = legacy #22 |
| DRV-24 | 2 | D | P0 | Business drive | Sidebar New folder | `DriveCreateFolderModal` | F-1 | | | | = legacy #24 |
| DRV-25 | 2 | D | P0 | Folder modal | Blank name → Create | Submit disabled | F-1 | | | | = legacy #25 |
| DRV-26 | 2 | D | P0 | Folder modal | Cancel / Escape / backdrop | No folder created | F-1 | | | | = legacy #26 |

### 3 — Edit workflow

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-37 | 3 | D | P1 | Details panel | Rename file/folder (if exposed) | Name updates; toast or inline success | F-1 | | | | |
| DRV-38 | 3 | D | P1 | Context menu | Open / preview file | Preview or download works | F-1 | | | | |

### 4 — Delete / destructive workflow

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-01 | 4 | D | P0 | Main Drive | Context menu → Delete | Move-to-trash ConfirmModal → confirm moves item | F-1 | | | | = legacy #1 |
| DRV-02 | 4 | D | P0 | Main Drive | Details panel → Delete | Same ConfirmModal | F-1 | | | | = legacy #2 |
| DRV-17 | 4 | D | P0 | Trash page | Per-item Delete forever | Permanent delete ConfirmModal | F-1 | | | | = legacy #17 |
| DRV-19 | 4 | D | P0 | Trash page | Empty File Hub Trash | Empty-trash ConfirmModal | F-1 | | | | = legacy #19 |

### 5 — Bulk actions

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-03 | 5 | D | P0 | Main Drive | Multi-select → toolbar Delete | Bulk ConfirmModal with count | F-1 | | | | = legacy #3 |

### 6 — Drag/drop

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-04 | 6 | D | P0 | Main Drive | Drag item to global trash (dnd-kit) | Move-to-trash ConfirmModal | F-1 | | | | = legacy #4 |
| DRV-12 | 6 | D | P0 | Global trash bin | HTML5 drop drive item | Move-to-trash ConfirmModal | F-1 | | | | = legacy #12 |
| DRV-14 | 13 | D | P0 | Drop flow | Cancel / Escape / backdrop on confirm | No trash action | F-1 | | | | = legacy #14 |

### 7 — Mobile 375px

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-39 | 7 | M | P0 | Main Drive | Browse files at 375px | No horizontal trap; primary list usable | F-8 | | | | |
| DRV-40 | 7 | M | P0 | Main Drive | Open ConfirmModal at 375px | Modal fits viewport; actions tappable | F-8 | | | | |

### 8 — Dark mode

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-31 | 8 | B | P0 | Main Drive | Dark mode on | Modals, trash, lists readable | F-1 | | | | = legacy #31 |

### 9 — Keyboard / Escape

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-07 | 9 | D | P0 | Main Drive | Select 1 item → `Delete` | Single-item ConfirmModal | F-1 | | | | = legacy #7 |
| DRV-08 | 9 | D | P0 | Main Drive | Select 2+ → `Delete` | Bulk ConfirmModal | F-1 | | | | = legacy #8 |
| DRV-09 | 9 | D | P0 | Main Drive | No selection → `Delete` | No action | F-1 | | | | = legacy #9 |
| DRV-32 | 9 | D | P0 | ConfirmModal | Escape | Closes without action | F-1 | | | | = legacy #32 |

### 10 — Empty / loading / error states

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-41 | 10 | D | P1 | Empty folder | Open folder with no children | Intentional empty UI or blank grid with guidance | F-1 | | | | |
| DRV-42 | 10 | D | P1 | Initial load | Hard refresh drive | Loading spinner or skeleton before content | F-1 | | | | |

### 11 — Cross-module integrations

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-15 | 11 | D | P0 | Trash page | Restore item | Restores without confirm | F-1 | | | | = legacy #15 |
| DRV-16 | 11 | D | P0 | GlobalTrashBin | Restore item | Restores without confirm | F-1 | | | | = legacy #16 |

### 12 — Accessibility

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-27 | 12 | D | P0 | GlobalTrashBin | Tab to trash | Visible focus ring | F-1 | | | | = legacy #27 |
| DRV-28 | 12 | D | P0 | GlobalTrashBin | Inspect labels | `aria-label` + `aria-expanded` | F-1 | | | | = legacy #28 |
| DRV-30 | 12 | D | P1 | Trash page | Inspect drop zone | `aria-label` on drop region | F-1 | | | | = legacy #30 |

### 13 — ConfirmModal (module-specific)

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-33 | 13 | D | P0 | ConfirmModal | Backdrop click | Closes without action | F-1 | | | | = legacy #33 |

### 14 — Menu behavior

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-43 | 14 | D | P0 | File row | Right-click / context menu | `ContextMenu` opens; Delete item present | F-1 | | | | |
| DRV-44 | 14 | D | P1 | Toolbar | New / overflow menus | `DropdownMenu` or `Popover`; no duplicate fixed shells | F-1 | | | | |

### 15 — Layout / sidebar

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| DRV-45 | 15 | D | P0 | Main Drive | Inspect layout | `WorkspaceSplitLayout`: sidebar \| main \| optional secondary | F-1 | | | | |
| DRV-46 | 15 | D | P1 | Details panel | Select file | Secondary panel opens; main remains usable | F-1 | | | | |

### Drive sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | | | | | |
| Engineering | | | | | |

---

## Part 2B — Notifications

**Routes:** `/notifications`, `/notifications/settings`.  
**Finding:** **N-6** (primary), **N-5**, **N-7**.

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| NTF-01 | 1 | D | P0 | Sidebar | Navigate to Notifications | Feed loads; `PageHeader` visible | N-6 | | | | |
| NTF-02 | 1 | D | P1 | Settings | Open `/notifications/settings` | Settings page loads | N-6 | | | | |
| NTF-03 | 2 | D | P0 | Feed | System notifications | N/A — feed is system-generated; no user create | N-6 | | | N/A | |
| NTF-04 | 3 | D | P0 | Row | Mark read / unread | State updates without error | N-6 | | | | |
| NTF-05 | 3 | D | P1 | Row | Snooze (if exposed) | Snooze applies; no unexpected confirm | N-6 | | | | |
| NTF-06 | 4 | D | P0 | Row menu | Delete single | `ConfirmModal` → confirm removes row | N-6 | | | | |
| NTF-07 | 5 | D | P0 | Toolbar | Select multiple → bulk delete | Bulk `ConfirmModal` with count | N-6 | | | | |
| NTF-08 | 6 | D | P0 | Feed | Drag/drop | N/A — no drag reorder | N-6 | | | N/A | |
| NTF-09 | 7 | M | P0 | Feed at 375px | Scroll list; use toolbar | List scrolls; toolbar usable; sidebar does not trap layout | N-5, N-6 | | | | |
| NTF-10 | 8 | B | P0 | Feed | Dark mode | Feed, toolbar, modals readable | N-6 | | | | |
| NTF-11 | 9 | D | P0 | Feed | `j` / `k` navigate; `Space` / `Enter` act | Selection moves; primary action works | N-6 | | | | |
| NTF-12 | 9 | D | P0 | Feed | `Escape` dismisses popover/modal | No stuck overlay | N-6 | | | | |
| NTF-13 | 10 | D | P0 | Filtered empty | Apply filter with no matches | Empty guidance shown | N-6 | | | | |
| NTF-14 | 10 | D | P1 | Initial load | Hard refresh | Loading state before rows | N-6 | | | | |
| NTF-15 | 11 | D | P1 | Feed | Inspect mixed notification types | Drive/Chat/Todo types render with correct metadata | N-6 | | | | |
| NTF-16 | 12 | D | P0 | Row overflow | Inspect trigger button | `aria-label` on icon-only trigger | N-7 | | | KNOWN-PWF if N-7 open | |
| NTF-17 | 12 | D | P0 | Keyboard | Tab through toolbar + first row | Focus visible; no trap | N-6 | | | | |
| NTF-18 | 13 | D | P0 | Delete confirm | Cancel / Escape / backdrop | No delete | N-6 | | | | |
| NTF-19 | 14 | D | P0 | Row | Open actions menu | `DropdownMenu`; items match certification | N-6 | | | | |
| NTF-20 | 15 | D | P0 | Page chrome | Inspect layout | `PageHeader` + `PageToolbar`; no double dashboard chrome | N-6 | | | | |

### Notifications sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | | | | | |
| Engineering | | | | | |

---

## Part 2C — Todo

**Routes:** `/todo`; business hub `todo` → `TodoWorkspaceLanding`.  
**Finding:** **T-11** (primary), **T-7**, **T-12**, **T-6**.

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| TODO-01 | 1 | D | P0 | `/todo` | Load module | List view default; `PageHeader` + toolbar visible | T-11 | | | | |
| TODO-02 | 1 | D | P0 | Business hub | Open Todo from workspace | `TodoWorkspaceLanding` → module; no fallthrough | T-11 | | | | |
| TODO-03 | 1 | D | P0 | Toolbar | Switch list / board / calendar | Each view renders | T-11 | | | | |
| TODO-04 | 2 | D | P0 | Header | New Task | `TaskForm` opens | T-11 | | | | |
| TODO-05 | 2 | D | P0 | Toolbar | Quick create | Task created or form opens | T-11 | | | | |
| TODO-06 | 2 | D | P1 | Projects sidebar | Create project | Project modal; project appears in list | T-11 | | | | |
| TODO-07 | 3 | D | P0 | Task detail | Edit via footer Edit | `TaskForm` opens with task data | T-11 | | | | |
| TODO-08 | 3 | D | P0 | Task overflow | Edit from menu | Same edit flow | T-11 | | | | |
| TODO-09 | 4 | D | P0 | List task | Overflow → Delete | `ConfirmModal` → confirm soft-deletes | T-11 | | | | |
| TODO-10 | 4 | D | P0 | Task detail | Delete | Same confirm gate | T-11 | | | | |
| TODO-11 | 5 | D | P0 | Task list | Bulk delete | N/A — no bulk delete today | T-11 | | | N/A | |
| TODO-12 | 6 | D | P0 | Board view | Drag task to another column | Status updates; toast feedback | T-11 | | | | |
| TODO-13 | 6 | D | P0 | Board view | Drag task to global trash | `ConfirmModal` before delete | T-11 | | | | |
| TODO-14 | 7 | M | P0 | Board at 375px | Horizontal scroll columns | Board scrolls; no body horizontal trap | T-11 | | | | |
| TODO-15 | 7 | M | P0 | List + selected task | Open detail secondary at 375px | Detail panel usable; no rigid 384px overflow | T-7, T-11 | | | | |
| TODO-16 | 8 | B | P0 | All views | Dark mode | List, board, detail, modals readable | T-11 | | | | |
| TODO-17 | 9 | D | P0 | ConfirmModal | Escape on task delete | Closes without delete | T-11 | | | | |
| TODO-18 | 9 | D | P1 | List | Arrow key list navigation | Document result | T-12 | | | KNOWN-PWF if absent | |
| TODO-19 | 10 | D | P0 | Empty workspace | No tasks | Shared `EmptyState` + CTA | T-11 | | | | |
| TODO-20 | 10 | D | P0 | Active filters | Filter to zero results | Filtered empty copy | T-11 | | | | |
| TODO-21 | 10 | D | P1 | Initial load | Hard refresh | `Spinner` while loading | T-11 | | | | |
| TODO-22 | 11 | D | P1 | Task with attachment | Open Drive-linked attachment | Attachment viewer opens scoped file | T-11 | | | | |
| TODO-23 | 11 | D | P1 | Calendar view | Tasks with due dates on grid | Tasks appear on correct days | T-11 | | | | |
| TODO-24 | 12 | D | P0 | List task overflow | Inspect trigger | `aria-label="Task actions"` | T-11 | | | | |
| TODO-25 | 12 | D | P0 | Toolbar | Inspect view toggles | `aria-label` on icon buttons | T-11 | | | | |
| TODO-26 | 13 | D | P0 | Task delete modal | Cancel / confirm | Cancel=no op; confirm=trash | T-11 | | | | |
| TODO-27 | 14 | D | P0 | List view | Open task overflow menu | `DropdownMenu`; delete requires confirm | T-11 | | | | |
| TODO-28 | 14 | D | P1 | Board compact card | Overflow menu | Menu hidden in compact — delete via detail/dnd | T-6 | | | KNOWN-PWF | |
| TODO-29 | 15 | D | P0 | Module shell | Toggle projects panel | `WorkspaceSidebar` projects; main + secondary layout | T-11 | | | | |
| TODO-30 | 15 | D | P0 | Select task | Detail panel | `WorkspaceSecondary` shows `TaskDetail` | T-11 | | | | |

### Todo sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | | | | | |
| Engineering | | | | | |

---

## Part 2D — Calendar

**Routes:** `/calendar` (month default), day/week/year views; business hub calendar.  
**Finding:** **E-14** (primary), **E-10**.

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| CAL-01 | 1 | D | P0 | `/calendar` | Load | Redirects to month or month view renders | E-14 | | | | |
| CAL-02 | 1 | D | P0 | Toolbar | Switch day / week / month / year | Each view loads on `CalendarPageShell` | E-14 | | | | |
| CAL-03 | 1 | D | P0 | Business hub | Open Calendar | `CalendarWorkspaceLanding` → calendar | E-14 | | | | |
| CAL-04 | 2 | D | P0 | Month view | New Event button | `EventDrawer` or create flow opens | E-14 | | | | |
| CAL-05 | 2 | D | P1 | Day view | Drag on timeline | New event with selected time range | E-14 | | | | |
| CAL-06 | 3 | D | P0 | EventDrawer | Edit fields → save | Event updates; grid reflects change | E-14 | | | | |
| CAL-07 | 3 | D | P1 | Event chip | Context menu → Edit | Opens edit flow | E-14 | | | | |
| CAL-08 | 4 | D | P0 | EventDrawer | Delete event | `ConfirmModal` (and recurrence scope if applicable) | E-14 | | | | |
| CAL-09 | 5 | D | P0 | Calendar | Bulk delete | N/A — no bulk delete | E-14 | | | N/A | |
| CAL-10 | 6 | D | P1 | Day/week | Drag to create | Event created at dropped range | E-14 | | | | |
| CAL-11 | 7 | M | P0 | Month at 375px | Open mobile sidebar; pick calendar | Sheet/sidebar usable; grid readable | E-10, E-14 | | | | |
| CAL-12 | 7 | M | P0 | Week at 375px | Scroll grid | Usable or documented horizontal scroll without body trap | E-10, E-14 | | | | |
| CAL-13 | 8 | B | P0 | All views | Dark mode | Grid, chips, drawer readable | E-14 | | | | |
| CAL-14 | 9 | D | P0 | Any view | Press `?` | Shortcuts help modal opens | E-14 | | | | |
| CAL-15 | 9 | D | P1 | Day view | `N` new event shortcut | Create flow opens (if documented for day) | E-14 | | | | |
| CAL-16 | 9 | D | P0 | EventDrawer / modals | Escape | Closes without orphan overlay | E-14 | | | | |
| CAL-17 | 10 | D | P0 | Month empty range | No events in month | `CalendarEventsEmptyState` above grid | E-14 | | | | |
| CAL-18 | 10 | D | P0 | Filtered empty | Filters hide all events | Filtered empty copy | E-14 | | | | |
| CAL-19 | 11 | D | P1 | Todo integration | Task due dates (if seeded) | Appear on calendar cells | E-14 | | | | |
| CAL-20 | 12 | D | P0 | Toolbar | Inspect icon buttons | `aria-label` on primary controls | E-14 | | | | |
| CAL-21 | 12 | D | P0 | Mobile sidebar | Open calendars panel | Sidebar toggle labeled | E-14 | | | | |
| CAL-22 | 13 | D | P0 | Delete confirm | Cancel / Escape | No delete | E-14 | | | | |
| CAL-23 | 14 | D | P0 | Event chip | Right-click context menu | `ContextMenu` with view/edit | E-14 | | | | |
| CAL-24 | 15 | D | P0 | Page shell | Inspect chrome | `CalendarPageShell` = header + toolbar + split layout | E-14 | | | | |

### Calendar sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | | | | | |
| Engineering | | | | | |

---

## Part 2E — Chat

**Routes:** `/chat`; `MobileChat`; `UnifiedGlobalChat` widget.  
**Finding:** **C-8** (primary); C-5/C-6 out of matrix scope (product stubs).

| ID | Area | View | Pri | Surface | Action | Expected | Finding | Tester | Date | Result | Notes |
|----|------|------|-----|---------|--------|----------|---------|--------|------|--------|-------|
| CHT-01 | 1 | D | P0 | `/chat` | Load | Thread list + main panel render | C-8 | | | | |
| CHT-02 | 1 | D | P0 | Business | Open Chat from hub | Chat loads in business context | C-8 | | | | |
| CHT-03 | 2 | D | P0 | Main panel | Send message | Message appears in thread | C-8 | | | | |
| CHT-04 | 2 | M | P0 | MobileChat | Send message | Message sends; composer usable | C-8 | | | | |
| CHT-05 | 3 | D | P1 | Message | Edit message (if exposed) | Edit applies or N/A documented | C-8 | | | | |
| CHT-06 | 4 | M | P0 | MobileChat | Delete message via context menu | `ConfirmModal` → trash | C-8 | | | | |
| CHT-07 | 4 | D | P1 | Desktop main | Delete message | Trash path documented; confirm if applicable | C-8 | | | | |
| CHT-08 | 5 | D | P0 | Chat | Bulk delete | N/A | C-8 | | | N/A | |
| CHT-09 | 6 | D | P1 | Left panel | Drag conversation to trash | Document whether confirm shown | C-8 | | | | |
| CHT-10 | 7 | M | P0 | MobileChat 375px | Reply / react / delete | Core actions reachable | C-8 | | | | |
| CHT-11 | 8 | B | P0 | Chat surfaces | Dark mode | Panels and menus readable | C-8 | | | | |
| CHT-12 | 9 | D | P0 | ConfirmModal / menus | Escape | Dismisses without action | C-8 | | | | |
| CHT-13 | 10 | D | P0 | Empty thread | No messages | Empty state or placeholder | C-8 | | | | |
| CHT-14 | 11 | D | P2 | Notifications | Mention notification (if seeded) | Links back to chat context | C-8 | | | | |
| CHT-15 | 12 | D | P0 | Main panel | Inspect primary controls | `aria-label` on toolbar controls | C-8 | | | | |
| CHT-16 | 12 | D | P1 | Desktop message actions | Hover-only actions | Document visibility; KNOWN-PWF if hover-only | C-8 | | | | |
| CHT-17 | 13 | M | P0 | Mobile delete | Cancel confirm | No delete | C-8 | | | | |
| CHT-18 | 14 | D | P0 | Message | Context menu | `ContextMenu` opens; actions consistent | C-8 | | | | |
| CHT-19 | 15 | D | P0 | Desktop layout | Inspect shell | `WorkspaceSplitLayout` or documented chat layout | C-8 | | | | |
| CHT-20 | 10 | D | P1 | Search | Global/thread search | Document stub if non-functional | C-5 | | | KNOWN-PWF / out of scope | |

### Chat sign-off

| Role | Name | Date | Viewports | P0 FAIL | Notes |
|------|------|------|-----------|---------|-------|
| QA / Product | | | | | |
| Engineering | | | | | |

---

## Part 3 — Finding ID cross-reference

| Finding | Module | Cert doc | Matrix sections | Cleared when |
|---------|--------|----------|-----------------|--------------|
| **F-1** | Drive | [`REFERENCE_MODULE_DRIVE.md`](./audits/REFERENCE_MODULE_DRIVE.md) | Part 2A; PLT-* | Drive sign-off; platform §9.2 |
| **F-8** | Drive | [`DRIVE_REFERENCE_UX_SCORECARD.md`](./audits/DRIVE_REFERENCE_UX_SCORECARD.md) | DRV-39, DRV-40 | 375px P0 PASS |
| **N-6** | Notifications | [`NOTIFICATIONS_UX_CERTIFICATION.md`](./audits/NOTIFICATIONS_UX_CERTIFICATION.md) | Part 2B §7, §12 | Notifications sign-off |
| **N-5** | Notifications | Same | NTF-09 | M viewport PASS or KNOWN-PWF |
| **N-7** | Notifications | Same | NTF-16 | Engineering or KNOWN-PWF |
| **T-11** | Todo | [`TODO_UX_CERTIFICATION.md`](./audits/TODO_UX_CERTIFICATION.md) | Part 2C §7, §12 | Todo sign-off |
| **T-7** | Todo | Same | TODO-15 | Partial — document result |
| **T-12** | Todo | Same | TODO-18 | KNOWN-PWF acceptable |
| **T-6** | Todo | Same | TODO-28 | KNOWN-PWF acceptable |
| **E-14** | Calendar | [`CALENDAR_UX_CERTIFICATION.md`](./audits/CALENDAR_UX_CERTIFICATION.md) | Part 2D §7, §12 | Calendar sign-off |
| **E-10** | Calendar | Same | CAL-11, CAL-12 | M density documented |
| **C-8** | Chat | [`CHAT_UX_CERTIFICATION.md`](./audits/CHAT_UX_CERTIFICATION.md) | Part 2E | Chat sign-off |

---

## Part 4 — Platform sign-off

| Field | Value |
|-------|-------|
| Commit / deploy SHA | |
| `pnpm type-check` | |
| Evidence root | `docs/ux/audits/qa-evidence/5G-QA/` |

| Module | Signed | P0 FAIL | Process finding cleared |
|--------|--------|---------|-------------------------|
| Platform primitives (Part 1) | ☐ | | — |
| Drive | ☐ | | F-1 ☐ |
| Notifications | ☐ | | N-6 ☐ |
| Todo | ☐ | | T-11 ☐ |
| Calendar | ☐ | | E-14 ☐ |
| Chat | ☐ | | C-8 ☐ |

| Role | Name | Date | Notes |
|------|------|------|-------|
| QA / Product lead | | | |
| Engineering lead | | | |

**Gate:** All modules signed; all P0 rows PASS, KNOWN-PWF, or N/A. Proceed to certification addendum refresh after execution.

**5G-QA-D addendum (2026-06-03):** [`audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md`](./audits/PLATFORM_QA_CERTIFICATION_ADDENDUM_2026.md) — records QA **not executed**; levels unchanged. Re-run addendum after sign-off.

---

## Related

- [`PLATFORM_MANUAL_QA_RUNBOOK.md`](./PLATFORM_MANUAL_QA_RUNBOOK.md)
- [`DRIVE_INTERACTION_MANUAL_QA_MATRIX.md`](./audits/DRIVE_INTERACTION_MANUAL_QA_MATRIX.md)
- [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](./PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5G-QA)
