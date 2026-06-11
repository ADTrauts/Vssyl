# Todo Layout & Workflow — Wave 5D.3 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (layout + workflow modernization only)  
**Benchmark:** Drive 3C-1/3C-6, Notifications 3C-6 — `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout`  
**Prior audit:** [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) (Wave 5D.2)

---

## 1. Objective

Resolve Wave 5D P2 findings **T-2** through **T-5** without re-certification or scope creep.

| Finding | Goal |
|---------|------|
| **T-2** | Adopt certified layout primitives (`PageHeader`, `PageToolbar`, `WorkspaceSplitLayout`) |
| **T-3** | Business workspace hub entry via `TodoWorkspaceLanding.tsx` |
| **T-4** | Wire Filter toolbar button to basic client-side filters |
| **T-5** | Connect `TaskDetail` footer Edit to existing `TaskForm` modal |

**In scope:** T-2, T-3, T-4, T-5  
**Out of scope:** T-6–T-12, re-certification (5D.4), Drive/Chat/Notifications/Calendar/AI work

---

## 2. T-2 — Layout modernization disposition

**Decision:** **WorkspaceSplitLayout** (not management-only `PageHeader` shell).

**Rationale:** Todo is a three-region workspace — optional project sidebar, primary list/board/calendar canvas, and optional task detail panel. This matches Drive/Chat split patterns, not single-column management pages (Notifications list-only).

**Implementation:**

| Primitive | Role |
|-----------|------|
| `PageHeader` | Module title, active/completed counts, New Task + Projects toggle |
| `PageToolbar` | `QuickTaskInput` (leading); view mode toggle + filter popover (trailing) |
| `WorkspaceSplitLayout` | Horizontal body shell |
| `WorkspaceSidebar` | `ProjectManager` when projects panel open |
| `WorkspaceMain` | List / board / calendar views |
| `WorkspaceSecondary` | `TaskDetail` panel (`w-96`) |

**Preserved:** Board drag/drop, list view, detail panel, project management, AI suggestions, calendar integration, 5D.1 delete `ConfirmModal` gate.

---

## 3. T-3 — Workspace landing disposition

**Decision:** Add thin **`TodoWorkspaceLanding.tsx`** hub entry.

**Rationale:** Business workspace modules require a certified landing/orchestration entry (`module-development.mdc`). Todo UI remains in `TodoModule`; landing is a pass-through wrapper (same pattern as other module wrappers).

**Wiring:** `BusinessWorkspaceContent.tsx` `case 'todo'` → `TodoWorkspaceLanding` (was direct `TodoModule`).

**Note:** Personal route `/todo` still mounts `TodoModule` directly — acceptable; business hub path is the certification target for T-3.

---

## 4. T-4 — Filter implementation

**Before:** Filter icon button with no handler (stub).

**After:** `Popover` on toolbar Filter button with:

- Status select (`all` | `TaskStatus`)
- Priority select (`all` | `TaskPriority`)
- Hide completed checkbox
- Clear filters when any active

**Filtering:** Client-side `useMemo` (`filteredTasks`) applied to `TaskList`, `TaskBoard`, and `TaskCalendar`. Project sidebar filter unchanged (server reload).

**Scope:** Smallest viable production behavior — no advanced query builder.

---

## 5. T-5 — Edit button implementation

**Before:** `TaskDetail` footer Edit `Button` rendered with no effect.

**After:**

- `TaskDetail` accepts optional `onEdit?: () => void`
- Footer Edit calls `onEdit`; disabled when prop omitted
- `TodoModule` passes `onEdit={() => openTaskEditor(selectedTask)}` → existing `TaskForm` modal (`setEditingTask` + `setShowTaskForm(true)`)

**No new editor** — reuses `TaskForm` and `openTaskEditor` shared with list/board overflow edit paths.

---

## 6. Files modified

| File | Summary |
|------|---------|
| `web/src/components/todo/TodoModule.tsx` | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout`; filter state + `filteredTasks`; `openTaskEditor`; `TaskDetail` `onEdit` |
| `web/src/components/todo/TodoWorkspaceLanding.tsx` | **New** — thin business hub wrapper |
| `web/src/components/todo/TaskDetail.tsx` | `onEdit` prop; footer Edit wired |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | `case 'todo'` → `TodoWorkspaceLanding` |

**Unchanged (preserved):** `TaskBoard.tsx` dnd-kit delete gate (5D.1), `TaskItem.tsx`, `ProjectManager.tsx`, sub-entity `ConfirmModal` flows.

---

## 7. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Layout renders (`PageHeader` / `PageToolbar` / split shell) | Code-complete; manual visual QA pending |
| Board / list / detail / calendar views | Preserved; `filteredTasks` on all three views |
| Filter button | Functional popover + client filters |
| Edit button | Opens `TaskForm` for selected task |
| Delete confirmations (5D.1) | Unchanged — `requestDeleteTask` → `ConfirmModal` |

---

## 8. Findings disposition

| ID | Status (5D.3) | Notes |
|----|---------------|-------|
| T-2 | **Resolved** | Layout primitives adopted |
| T-3 | **Resolved** | `TodoWorkspaceLanding` + business hub wiring |
| T-4 | **Resolved** | Basic filter popover |
| T-5 | **Resolved** | Edit → `TaskForm` |
| T-6–T-12 | **Open** | Out of 5D.3 scope |

**Authoritative scorecard awards remain Wave 5D.2** until **5D.4 re-certification**.

---

## 9. Projected UX-L2 outlook (not awarded)

If re-scored after 5D.3 remediation:

| Category | 5D.2 | Projected post-5D.3 |
|----------|------|---------------------|
| 2 Layout Consistency | PWF | **PASS** (T-2) |
| 3 Navigation | PWF | **PASS** (T-3) |
| 10 Discoverability | PWF | **PASS** (T-4) |
| 11 Workflow Completion | PASS | PASS (T-5 polish) |

**Projected:** **~9–10 PASS / ~1–2 PWF** — **L2 threshold (≥9 PASS) potentially reachable** on 5D.4 re-cert if cats 4, 5, 8 remain PWF only.

**Remaining L2 risks:** T-7 fixed detail width (cat 5), T-8 empty state primitive (cat 8), T-9 a11y (cat 4).

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5D.3)
