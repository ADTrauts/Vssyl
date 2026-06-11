# Todo Interaction Safety — Wave 5D.1 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (interaction safety only)  
**Benchmark:** Drive 3B / Chat 5B.1 / Notifications 5C.1 — `ConfirmModal` before task soft-delete  
**Prior audit:** [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) (Wave 5D)

---

## 1. Objective

Resolve Wave 5D P1 finding **T-1** by gating all in-scope **task delete** paths behind shared `ConfirmModal` in `TodoModule`.

**In scope:** 5D.1A–5D.1C  
**Out of scope:** Layout (T-2), hub landing (T-3), filter (T-4), a11y, certification, sub-entity deletes (already confirmed)

---

## 2. Pre-change delete-path inventory

| Path | Trigger | Pre-5D.1 behavior | ConfirmModal? | Result (pre) |
|------|---------|---------------------|---------------|--------------|
| **TaskItem overflow** | `DropdownMenu` Delete | `onDelete()` → `handleTaskDelete` immediate | ❌ | **Unsafe** |
| **TaskDetail footer** | Trash `Button` | `onDelete` → `handleTaskDelete` immediate | ❌ | **Unsafe** |
| **TaskBoard dnd-kit** | Drop on `global-trash-bin` | `onTaskDelete(taskId)` + toast immediate | ❌ | **Unsafe** |
| **TaskItem HTML5 drag** | Native drag → `GlobalTrashBin` drop | `pendingMoveToTrashItem` → `ConfirmModal` | ✅ | Safe (bin) |
| Project / comment / subtask / attachment / time | Sub-entity handlers | Existing gates | ✅ | Unchanged |

**Native dialogs:** `confirm()` / `prompt()` — **0** in `todo/*` (pre and post).

---

## 3. Post-change delete-path matrix

| Path | Trigger | Post-5D.1 behavior | ConfirmModal? | Result |
|------|---------|--------------------|---------------|--------|
| **TaskItem overflow** | `DropdownMenu` Delete | `requestDeleteTask` → `pendingTaskToDelete` → `ConfirmModal` → `executeDeleteTask` | ✅ | **Safe** |
| **TaskDetail footer** | Trash `Button` | `requestDeleteTask` → modal → `executeDeleteTask` | ✅ | **Safe** |
| **TaskBoard dnd-kit** | Drop on `global-trash-bin` | `requestDeleteTask` only — no toast until confirm | ✅ | **Safe** |
| **TaskItem HTML5 drag** | `GlobalTrashBin` | Unchanged — bin confirm | ✅ | **Safe** |
| Sub-entity deletes | Various | Unchanged | ✅ | **Safe** |

**Cancel / Escape / backdrop:** `onClose` clears `pendingTaskToDelete` with **no mutation**.

---

## 4. Sub-wave deliverables

### 5D.1A — TaskItem delete parity ✅

`TaskItem` unchanged — parent passes `requestDeleteTask` via `TaskList` `onTaskDelete` prop.

### 5D.1B — TaskDetail footer delete parity ✅

`TaskDetail` unchanged — `onDelete` now calls `requestDeleteTask` from `TodoModule`.

### 5D.1C — Board drag-to-trash parity ✅

| File | Change |
|------|--------|
| `TaskBoard.tsx` | Removed immediate delete + premature toast on dnd-kit trash drop; calls `onTaskDelete` (request only) |
| `TodoModule.tsx` | Central `requestDeleteTask` / `executeDeleteTask` + `ConfirmModal` |

---

## 5. Files modified

| File | Summary |
|------|---------|
| `web/src/components/todo/TodoModule.tsx` | `pendingTaskToDelete` / `isDeletingTask`; `requestDeleteTask` + `executeDeleteTask`; module-level `ConfirmModal` |
| `web/src/components/todo/TaskBoard.tsx` | Dnd-kit trash drop → `requestDeleteTask` only (no immediate delete/toast) |

**Unchanged:** `TaskItem.tsx`, `TaskDetail.tsx` (delegate to parent); sub-entity `ConfirmModal` flows.

---

## 6. ConfirmModal integration

| Surface | Pending state | Execute | Modal copy |
|---------|---------------|---------|------------|
| All task delete paths | `pendingTaskToDelete` `{ id, title }` | `executeDeleteTask` | "Delete task?" + task title |

Pattern mirrors Notifications 5C.1 bulk gate and Chat 5B.1 message delete.

---

## 7. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** (2026-06-03) |
| TaskItem delete → `ConfirmModal` | ✅ via `requestDeleteTask` |
| TaskDetail delete → `ConfirmModal` | ✅ via `requestDeleteTask` |
| Board dnd trash → `ConfirmModal` | ✅ no immediate mutation |
| Cancel → no mutation | ✅ |
| Native `confirm()` / `prompt()` | **0** |

---

## 8. Findings resolved / remaining

### Resolved (5D.1)

| ID | Finding | Status |
|----|---------|--------|
| T-1 | Task delete lacks `ConfirmModal` | **Resolved** |

### Remaining (not 5D.1)

| ID | Finding | Blocks L2/L3? |
|----|---------|---------------|
| T-2 | No `WorkspaceSplitLayout` / management primitives | Yes (layout) |
| T-3 | No `TodoWorkspaceLanding.tsx` | No |
| T-4 | Filter toolbar stub | No |
| T-5 | TaskDetail footer Edit no-op | No |
| T-6–T-12 | See scorecard | Partial (T-11 L3) |

---

## 9. UX-L2 outlook (projected — not re-certified)

| Metric | 5D audit | Post-5D.1 (projected) |
|--------|----------|------------------------|
| PASS | 4 | **6** (cats 1, 11 upgrade) |
| PWF | 7 | **5** |
| T-1 | Open | **Resolved** |
| L2 threshold (≥9 PASS) | ❌ | **Still short** (need 3 more PASS) |

**Interaction Consistency (cat 1):** Projected **PASS**.  
**Workflow Completion (cat 11):** Projected **PASS** (T-1 was primary safety gap).

L2 still blocked by layout (T-2) and other PWF categories — **5D.2 re-cert** recommended after layout wave or additional PASS upgrades.

---

## 10. Readiness for re-certification

**Interaction safety:** **Ready** — all scoped task delete paths align with Drive 3B / Chat 5B.1 / Notifications 5C.1.

**Do not re-certify in 5D.1** — per wave charter.

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md`](./NOTIFICATIONS_INTERACTION_SAFETY_BATCH5C1_CLOSEOUT.md)

**Last updated:** 2026-06-03 (Wave 5D.1 ACT closeout)
