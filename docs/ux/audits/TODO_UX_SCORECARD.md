# Todo Module UX Scorecard (Wave 5G-Todo-L3-D)

**Status:** **5G-Todo-L3-D authoritative** (UX-L3 Certified)  
**Date:** 2026-06-12  
**Module:** Todo / To-Do (`/todo`, business workspace)  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Evidence:** Waves 3A-4D, 5D.1–5D.3, 5G polish, Part 2C QA (T-11)

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Primary module | `web/src/components/todo/TodoModule.tsx` |
| Route | `web/src/app/todo/page.tsx`, `layout.tsx` |
| Hub landing | `TodoWorkspaceLanding.tsx` |
| Task surfaces | `TaskItem.tsx`, `TaskList.tsx`, `TaskBoard.tsx`, `TaskDetail.tsx` |
| Supporting | `ProjectManager.tsx`, `EmptyTaskState.tsx`, etc. |
| Layout shell | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` |

---

## Category results (5G-Todo-L3-D authoritative)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | Task + sub-entity deletes on `ConfirmModal` (5D.1); TODO-09/10/13/26/27 QA PASS. |
| 2 | **Layout Consistency** | **PASS** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` (5D.3). |
| 3 | **Navigation** | **PASS** | `TodoWorkspaceLanding` + `/todo`; TODO-01 PASS (TODO-02 BLOCKED verification). |
| 4 | **Accessibility** | **PASS** | TODO-24/25/17 PASS; T-9 resolved (5G); T-11 closed; TODO-18 KNOWN-PWF (T-12 P3). |
| 5 | **Mobile** | **PASS** | TODO-14/15 PASS at 375px; T-7 partial sufficient; T-11 closed. |
| 6 | **Cross-Module Integration** | **PASS** | Drive, Calendar, trash, AI; TODO-23 PASS. |
| 7 | **Error Handling** | **PASS** | Toast on primary CRUD. |
| 8 | **Empty States** | **PASS** | Shared `EmptyState` via `EmptyTaskState` (T-8); TODO-19/20 PASS. |
| 9 | **Loading States** | **PASS** | Spinner on load; TODO-21 PASS. |
| 10 | **Discoverability** | **PASS** | Header, filters, view toggles, projects. |
| 11 | **Workflow Completion** | **PASS** | Core flows completable; TODO-07/08 edit paths PASS. |

---

## Level awards (5G-Todo-L3-D)

| Level | Decision |
|-------|----------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified** (upgraded from CwF) |
| **UX-L3** | **Certified** (first award) |
| **Reference UX #3** | **Approved with Findings** — [`REFERENCE_MODULE_TODO.md`](./REFERENCE_MODULE_TODO.md) |

### Threshold detail

| Target | Result |
|--------|--------|
| L1 Certified | ✅ 11 PASS; 0 PWF |
| L2 Certified | ✅ 11 PASS; cats 4+5 upgraded |
| L3 Certified (strict) | ✅ 11 PASS; core quartet; T-11 closed |
| L3 CwF | N/A (0 PWF) |

---

## Open findings

| ID | Finding | Severity |
|----|---------|----------|
| T-1–T-5, T-8, T-9 | Resolved (5D/5G) | — |
| T-11 | Manual QA | **Resolved** (5G-QA-EXEC) |
| T-7 | Detail panel width | **Resolved** (QA TODO-14/15) |
| T-6 | Board compact overflow hidden | P3 |
| T-10 | Drive file unlink without confirm | P3 |
| T-12 | Limited keyboard shortcuts | P3 |
| R-TOD-1 | TODO-02 business hub BLOCKED | P2 verification |
| R-TOD-2 | TODO-22 attachment BLOCKED | P2 verification |

---

## Summary metrics

| Metric | 5G-Todo-D | 5G-Todo-L3-D |
|--------|-----------|--------------|
| PASS | 9 | **11** |
| PASS WITH FINDINGS | 2 | **0** |
| FAIL | 0 | **0** |

---

## Wave history

| Wave | Outcome |
|------|---------|
| 5D–5D.4 | Initial certification ladder — 4→8 PASS |
| 5G | L2 polish — T-8, T-9, T-7 partial |
| 5G-Todo-D | **9 PASS / 2 PWF** — UX-L2 CwF |
| 5G-QA-EXEC | Part 2C — T-11 closable |
| **5G-Todo-L3-D** | **11 PASS / 0 PWF** — UX-L3 Certified — [`TODO_UX_L3_CERTIFICATION_REVIEW.md`](./TODO_UX_L3_CERTIFICATION_REVIEW.md) |

**Last updated:** 2026-06-12 (Wave 5G-Todo-L3-D authoritative)
