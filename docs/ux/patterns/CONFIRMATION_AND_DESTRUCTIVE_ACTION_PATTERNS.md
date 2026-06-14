# Confirmation & Destructive Action UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #1–#5  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)  
**Benchmark:** Drive #1 interaction program (3B)

---

## UX-PAT-DES-001 — Soft delete via ConfirmModal (menu / details / keyboard)

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, Calendar #5, Notifications #2, AI #4 |
| **Pattern ID** | `UX-PAT-DES-001` |

### Purpose

All user-initiated soft deletes require `ConfirmModal` before `trashItem` / `trashedAt` mutation.

### When to use

- Delete from row menu, detail panel, header menu, keyboard shortcut

### When NOT to use

- Undo-safe inline toggles (complete task, mark read)
- Documented non-destructive unlink (Todo T-10 exception)

### Required components

- `ConfirmModal` from `shared/components`
- `requestDelete*` → modal → `executeDelete*` service pattern
- Cancel retains entity; Escape dismisses without mutation

### Required accessibility

- Focus trap in modal with Escape exit
- Confirm button clearly labeled (`Move to trash`, `Delete`)

### Prohibited

- `window.confirm()`, `prompt()`, `alert()` on user paths
- Silent delete without confirmation

### Reference implementations

| Module | Pattern |
|--------|---------|
| Drive #1 | `requestMoveToTrash` |
| Todo #3 | `requestDeleteTask` |
| Calendar #5 | Event delete in `EventDrawer` |
| Notifications #2 | Per-row + bulk delete |
| AI #4 | `requestDeleteConversation` |

---

## UX-PAT-DES-002 — Bulk delete ConfirmModal

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Notifications #2 |
| **Pattern ID** | `UX-PAT-DES-002` |

### Purpose

Multi-select delete uses one confirm gate with count-aware copy.

### When to use

- Selection mode + bulk action bar (feed, file grid)

### Reference implementations

| Module | Pattern |
|--------|---------|
| Drive #1 | `requestBulkMoveToTrash` |
| Notifications #2 | Bulk delete (5C.1) |

---

## UX-PAT-DES-003 — Drag-to-trash with ConfirmModal

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | Todo #3, AI #4 |
| **Pattern ID** | `UX-PAT-DES-003` |

### Purpose

HTML5 or dnd-kit drag to global trash bin sets `pendingMoveToTrashItem` → `ConfirmModal` before persistence.

### When to use

- Sidebar/list drag to platform trash
- Board card drag to trash zone

### When NOT to use

- Reorder-only drag (no trash destination)

### Reference implementations

| Module | Pattern |
|--------|---------|
| Drive #1 | 3B-2 drag parity |
| Todo #3 | Board trash gate (TODO-13) |
| AI #4 | Conversation drag → `GlobalTrashBin` (AI-10) |

---

## UX-PAT-DES-004 — Permanent delete / empty-trash ConfirmModal

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-DES-004` |

### Purpose

Irreversible purge (empty trash, delete forever) requires explicit second confirm with distinct copy.

### When to use

- Global trash empty-all; per-item permanent delete

### Reference implementations

| Module | Waves |
|--------|-------|
| Drive #1 | 3B-1, 3B-3 |

---

## UX-PAT-DES-005 — Named entity create Modal (no prompt())

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-DES-005` |

### Purpose

Creating named entities (folders, etc.) uses `Modal` + `Input` — never `prompt()`.

### When to use

- Folder/project/entity creation requiring user-provided name

### Reference implementations

| Module | Files |
|--------|-------|
| Drive #1 | `DriveCreateFolderModal` (8 surfaces) |

---

## UX-PAT-DES-006 — Recurrence / scope sub-confirm (scheduling)

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-DES-006` |

### Purpose

Destructive or edit actions on recurring entities prompt scope selection (`RecurrenceScopeModal`) before trash.

### When to use

- Calendar delete/edit on recurring events

### Reference implementations

| Module | Files |
|--------|-------|
| Calendar #5 | `RecurrenceScopeModal` + delete flow |

---

## UX-PAT-DES-007 — Scheduling conflict confirm

| Field | Value |
|-------|-------|
| **Primary reference** | Calendar #5 |
| **Secondary references** | — |
| **Pattern ID** | `UX-PAT-DES-007` |

### Purpose

Save despite detected conflict requires explicit `ConfirmModal` (“Save anyway”).

### Reference implementations

| Module | Files |
|--------|-------|
| Calendar #5 | `EventDrawer` conflict path |

---

## UX-PAT-DES-008 — Row / header action menus (DropdownMenu)

| Field | Value |
|-------|-------|
| **Primary reference** | Drive #1 (ContextMenu) + Notifications #2 (DropdownMenu) |
| **Secondary references** | Todo #3, AI #4, Calendar #5 |
| **Pattern ID** | `UX-PAT-DES-008` |

### Purpose

Floating actions use `ContextMenu`, `DropdownMenu`, or `Popover` — not duplicate inline `fixed` menu shells.

### Ownership resolution

| Context | Primary | Pattern |
|---------|---------|---------|
| Grid/list right-click | **Drive #1** | `ContextMenu` |
| Row overflow “More” | **Notifications #2** / **Todo #3** | `DropdownMenu` |
| Sidebar “New” | **Drive #1** | `DropdownMenu` |
| Filter panels | **Drive #1** | `Popover` |

### Required accessibility

- `menuLabel` or `aria-label` on menu trigger (e.g. `Task actions`, `Conversation options`)

### Reference implementations

| Module | QA |
|--------|-----|
| Todo #3 | TODO-24, TODO-27 |
| AI #4 | AI-11–13 |
| Notifications #2 | NTF-16 |

---

## Related

- [`ACCESSIBILITY_PATTERNS.md`](./ACCESSIBILITY_PATTERNS.md)
- [`CROSS_MODULE_INTEGRATION_PATTERNS.md`](./CROSS_MODULE_INTEGRATION_PATTERNS.md) — Global Trash

**Last updated:** 2026-06-03 (Wave 6A)
