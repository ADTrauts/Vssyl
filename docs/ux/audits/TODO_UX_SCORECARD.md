# Todo Module UX Scorecard (Wave 5G-Todo-D)

**Status:** Re-certified (Wave 5G-Todo-D authoritative)  
**Date:** 2026-06-03  
**Module:** Todo / To-Do (`/todo`, business workspace)  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Evidence:** Static code audit — `web/src/components/todo/*`; waves 3A-4D, 5D.1, 5D.3, 5G

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Primary module | `web/src/components/todo/TodoModule.tsx` |
| Route | `web/src/app/todo/page.tsx`, `layout.tsx` |
| Hub landing | `TodoWorkspaceLanding.tsx` |
| Task surfaces | `TaskItem.tsx`, `TaskList.tsx`, `TaskBoard.tsx`, `TaskDetail.tsx` |
| Supporting | `ProjectManager.tsx`, `AttachmentViewer.tsx`, `TimeHistory.tsx`, `TaskForm.tsx`, `QuickTaskInput.tsx`, `EmptyTaskState.tsx` |
| Business hub | `BusinessWorkspaceContent.tsx` `case 'todo'` → `TodoWorkspaceLanding` |
| Layout shell | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` |

**Prior waves:** 3A-4D menus; 5D.1 interaction safety (T-1); 5D.3 layout/workflow (T-2–T-5); 5G L2 polish (T-8, T-9, T-7 partial).

---

## Rating scale

| Rating | Meaning |
|--------|--------|
| **PASS** | Meets standard for target level |
| **PASS WITH FINDINGS** | Meets bar with documented exceptions |
| **FAIL** | Blocks certification at target level |

---

## Interaction inventory (5G-Todo-D)

| Surface / action | ConfirmModal? | Notes |
|------------------|---------------|-------|
| Task delete (menu / detail / board dnd) | ✅ (5D.1) | `requestDeleteTask` → `executeDeleteTask` |
| Task delete (HTML5 → GlobalTrashBin) | ✅ | Bin gate |
| Project / comment / subtask / attachment / time delete | ✅ | Unchanged |
| Task complete / board column move | ❌ | Acceptable |
| Drive file unlink | ❌ | T-10 — P3 |

**Native dialogs:** **0** in `todo/*`.

---

## Category results (5G-Todo-D authoritative)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Task + sub-entity deletes confirmed; T-1 resolved (5D.1). |
| 2 | **Layout Consistency** | **PASS** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout`. T-2 resolved (5D.3). |
| 3 | **Navigation** | **PASS** | `TodoWorkspaceLanding` + business hub; `/todo` personal route. T-3 resolved (5D.3). |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | T-9 **resolved** (5G) — overflow + project action labels. T-11 unsigned QA; T-12 keyboard. |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Board scroll. T-7 **partial** (5G) responsive secondary; T-11 unsigned 375px QA. |
| 6 | **Cross-Module Integration** | **PASS** | Drive, Calendar, trash, AI, Chat (server). |
| 7 | **Error Handling** | **PASS** | Toast on primary CRUD. |
| 8 | **Empty States** | **PASS** | Shared `EmptyState` via `EmptyTaskState` + `ProjectManager`; filtered/project variants. T-8 **resolved** (5G). |
| 9 | **Loading States** | **PASS** | Spinner on load + AI apply. |
| 10 | **Discoverability** | **PASS** | Header actions, filter popover, view toggles, projects. T-4 resolved (5D.3). |
| 11 | **Workflow Completion** | **PASS** | Core flows completable; T-1 + T-5 resolved. |

---

## Level awards (5G-Todo-D)

| Level | Decision |
|-------|----------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX slot** | **Not eligible** |

### Threshold detail

| Target | Result |
|--------|--------|
| L1 Certified (≥8 PASS, <3 PWF) | ✅ 9 PASS; 2 PWF |
| L1 CwF | N/A (2 PWF < 3 threshold) |
| L2 (≥9 PASS) | ✅ **9 PASS** |
| L2 CwF | ✅ 2 PWF (cats 4, 5) |
| L3 | ❌ cat 4 PWF + T-11 |

---

## Open findings

| ID | Finding | Severity |
|----|---------|----------|
| T-1 | Task delete lacks `ConfirmModal` | **Resolved** (5D.1) |
| T-2 | No `WorkspaceSplitLayout` / `PageHeader`+`PageToolbar` | **Resolved** (5D.3) |
| T-3 | No `TodoWorkspaceLanding.tsx` | **Resolved** (5D.3) |
| T-4 | Filter toolbar stub | **Resolved** (5D.3) |
| T-5 | TaskDetail footer Edit no-op | **Resolved** (5D.3) |
| T-6 | Board hides overflow menu in compact | P3 |
| T-7 | Fixed detail panel width | P2 — **partial (5G)** |
| T-8 | Local `EmptyTaskState` | **Resolved** (5G) |
| T-9 | Overflow lacks `aria-label` | **Resolved** (5G) |
| T-10 | Drive file unlink without confirm | P3 |
| T-11 | Manual QA not executed | Process — **L3 blocker** |
| T-12 | Limited keyboard shortcuts | P3 |

---

## Summary metrics

| Metric | Wave 5D.4 | Wave 5G-Todo-D |
|--------|-----------|----------------|
| PASS | 8 | **9** |
| PASS WITH FINDINGS | 3 | **2** |
| FAIL | 0 | **0** |

**Categories upgraded (5D.4 → 5G-Todo-D):** 8 (Empty States).

---

## Wave history

| Wave | Outcome |
|------|---------|
| 5D | Initial audit — 4 PASS / 7 PWF; UX-L1 CwF |
| 5D.1 | T-1 resolved — [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md) |
| 5D.2 | Re-cert — 6 PASS / 5 PWF — [`TODO_UX_RECERTIFICATION_2026.md`](./TODO_UX_RECERTIFICATION_2026.md) |
| 5D.3 | Layout/workflow — T-2–T-5 resolved — [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md) |
| 5D.4 | Re-cert — 8 PASS / 3 PWF — [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md) |
| 5G | L2 polish — T-8, T-9, T-7 partial — [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md) |
| **5G-Todo-D** | Re-cert — **9 PASS / 2 PWF**; **UX-L2 CwF** — [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) |

---

## Related

- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md)
- [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md)

**Last updated:** 2026-06-03 (Wave 5G-Todo-D re-certification)
