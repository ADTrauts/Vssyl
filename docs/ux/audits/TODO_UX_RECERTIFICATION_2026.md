# Todo Module UX Re-Certification (Wave 5D.2)

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Certification / documentation only (no source changes)  
**Program:** UX Modernization Wave 5D.2  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)

---

## 1. Executive summary

| Decision | Result |
|----------|--------|
| **UX-L1** | **Certified with Findings** |
| **UX-L2** | **Not certified** (6/11 PASS; requires ≥9) |
| **UX-L3** | **Not certified** |
| **Reference UX Module slot** | **Not eligible** |

**Rationale:** Wave **5D.1** resolved finding **T-1** (task delete `ConfirmModal`). Re-score upgrades categories **1** (Interaction Consistency) and **11** (Workflow Completion) from PASS WITH FINDINGS to **PASS**, yielding **6 PASS / 5 PWF / 0 FAIL** — improved from **4 PASS / 7 PWF** but **three categories short** of the **≥9 PASS** L2 threshold. **UX-L3** remains blocked: core quartet category **4** (Accessibility) is PWF; manual QA **T-11** not executed; layout category **2** PWF (T-2).

**Prior baseline:** Wave 5D initial audit — **4 PASS / 7 PWF / 0 FAIL**, UX-L1 CwF, UX-L2 not certified.

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) | Wave 5D baseline |
| [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) | Wave 5D certification |
| [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md) | T-1 resolved — task delete gate |
| [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](./TODO_MENU_ROLLOUT_CLOSEOUT.md) | 3A-4D menu primitives |
| [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) | Benchmark comparison |

**Validation:** No source changes in 5D.2 — `pnpm type-check` not required.

---

## 3. Category upgrade analysis (5D.2A)

### Category 1 — Interaction Consistency

| Aspect | Wave 5D (pre-5D.1) | Wave 5D.2 (post-5D.1) |
|--------|--------------------|-----------------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-1: task delete immediate on menu/detail/board dnd | T-1 **resolved** |

**Reasoning for upgrade:**

1. **All scoped task delete paths confirmed** — `requestDeleteTask` → `pendingTaskToDelete` → `ConfirmModal` → `executeDeleteTask` in `TodoModule` per [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md).
2. **Drive / Chat / Notifications parity** — menu, detail footer, and board dnd-kit trash match platform confirm contract; HTML5 drag-to-`GlobalTrashBin` unchanged (already gated).
3. **Sub-entity deletes unchanged** — comments, subtasks, attachments, time logs, projects, dependencies retain existing `ConfirmModal` gates.
4. **Non-destructive immediate actions acceptable** — complete/reopen, board column moves, AI bulk apply, calendar unlink — same 5D assessment.
5. **Zero native dialogs** — `confirm()` / `prompt()` count **0** in `todo/*`.
6. **Cancel / Escape / backdrop** — `onClose` clears pending state with no mutation.

No remaining interaction findings block PASS at L2 interaction bar.

### Category 11 — Workflow Completion

| Aspect | Wave 5D (pre-5D.1) | Wave 5D.2 (post-5D.1) |
|--------|--------------------|-----------------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-1 delete without confirm | T-1 **resolved** |

**Reasoning for upgrade:**

1. **T-1 was the workflow safety blocker** — unconfirmed task delete on primary paths created soft-delete risk without user review; now gated.
2. **End-to-end journeys completable** — quick create → list/board/calendar views → detail panel → edit (form/inline) → complete → manage subtasks/attachments/time/projects → cross-module Drive/Calendar links.
3. **T-5 (Edit footer no-op)** — P2 polish; edit available via `TaskForm` modal and inline `TaskDetail` fields. Not a dead-end — analogous to Chat 5B.3 PASS on cat 11 with absent pin/archive flows.
4. **T-4 (filter stub)** — P2 discoverability gap; tasks listable/filterable by project sidebar; not a workflow dead-end.
5. **T-6 (board hides overflow menu)** — delete still available via dnd-kit trash (now confirmed) and detail panel.
6. **No new findings introduced** — per 5D.2 charter.

---

## 4. Re-scored category table (5D.2 authoritative)

| # | Category | Rating | Score rationale (post-5D.1 implementation) |
|---|----------|--------|-----------------------------------------------|
| 1 | **Interaction Consistency** | **PASS** | Task + sub-entity deletes on `ConfirmModal`; board dnd-kit trash gated; zero native dialogs. T-1 resolved (5D.1). |
| 2 | **Layout Consistency** | **PASS WITH FINDINGS** | Specialized `TodoModule` header + main/detail split. No `WorkspaceSplitLayout` / `PageHeader` (T-2); fixed `w-96` detail panel. |
| 3 | **Navigation** | **PASS WITH FINDINGS** | `/todo` + business workspace. No `TodoWorkspaceLanding.tsx` (T-3). |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Some `title` attributes. Overflow lacks `aria-label` (T-9); no list keyboard nav (T-12); no WCAG audit (T-11). |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Board scroll; compact header. Fixed detail width (T-7); manual QA pending (T-11). |
| 6 | **Cross-Module Integration** | **PASS** | Drive, Calendar, global trash, Chat (server), AI suggestions; tenancy scoped. |
| 7 | **Error Handling** | **PASS** | `toast.error` on primary CRUD paths. |
| 8 | **Empty States** | **PASS WITH FINDINGS** | `EmptyTaskState` with CTA. Not shared primitive (T-8). |
| 9 | **Loading States** | **PASS** | Initial `Spinner`; AI apply loading. |
| 10 | **Discoverability** | **PASS WITH FINDINGS** | Views, quick create, projects, counts. Filter stub (T-4). |
| 11 | **Workflow Completion** | **PASS** | Core flows completable post T-1. T-4/T-5 are P2 polish — not dead-ends. |

### Summary metrics

| Metric | Wave 5D (initial) | Wave 5D.2 (re-cert) |
|--------|-------------------|---------------------|
| **PASS** | 4 | **6** |
| **PASS WITH FINDINGS** | 7 | **5** |
| **FAIL** | 0 | **0** |
| Native `confirm()` / `prompt()` | 0 | **0** |

**Categories upgraded:** 1 (Interaction Consistency), 11 (Workflow Completion).

---

## 5. Level decisions (5D.2B)

### UX-L1 — Certified with Findings ✅

| Rule | Result |
|------|--------|
| No FAIL in categories 1, 3, 4, 7 | ✅ |
| L1 blockers (native dialogs, unconfirmed primary delete, hub fallthrough) | ✅ Clear post T-1 |
| ≥3 PASS WITH FINDINGS documented | ✅ (5 PWF) |
| ≥8 PASS (plain L1 Certified) | ❌ (6 PASS) |

**Award:** **UX-L1 Certified with Findings** — improved from 5D audit; plain L1 Certified (8 PASS) not met.

### UX-L2 — Not certified ❌

| Rule | Result |
|------|--------|
| Prerequisite L1 Certified or CwF | ✅ |
| No FAIL in 1, 2, 3, 5, 7, 8, 9 | ✅ |
| ≥9 of 11 PASS | ❌ (6 PASS) |
| Categories 2, 5 PASS or PWF (not FAIL) | ✅ |

**Award:** **Not certified** — **three categories short** of L2 PASS threshold. Primary remaining gaps: **T-2** layout primitives (cat 2), accessibility/mobile/empty/discoverability PWF categories.

### UX-L2 — Certified with Findings ❌

Requires L2 bar (≥9 PASS) first. Not met.

### UX-L3 — Not certified ❌

| Rule | Result |
|------|--------|
| Prerequisite UX-L2 | ❌ |
| Core quartet 1, 2, 4, 11 all PASS | ❌ (cat 4 PWF; cat 2 PWF) |
| Manual QA matrix | ❌ (T-11) |

---

## 6. Finding matrix (5D.2C)

| ID | Finding | Wave 5D status | 5D.2 status | Blocks |
|----|---------|----------------|-------------|--------|
| **T-1** | Task delete no `ConfirmModal` | Open | **Resolved** (5D.1) | Was L2 interaction |
| T-2 | No `WorkspaceSplitLayout` / management primitives | Open | **Still open** | L2 layout |
| T-3 | No `TodoWorkspaceLanding.tsx` | Open | **Still open** | No |
| T-4 | Filter toolbar stub | Open | **Still open** | No |
| T-5 | TaskDetail footer Edit no-op | Open | **Still open** | No |
| T-6 | Board hides overflow menu | Open | **Still open** | No |
| T-7 | Fixed detail panel width | Open | **Still open** | No |
| T-8 | Local `EmptyTaskState` | Open | **Still open** | No |
| T-9 | Overflow lacks `aria-label` | Open | **Still open** | L3 core quartet |
| T-10 | Drive file unlink without confirm | Open | **Still open** | No |
| T-11 | Manual QA not executed | Open | **Still open** | L3 |
| T-12 | Limited keyboard shortcuts | Open | **Still open** | No |

**P1 findings:** All resolved (T-1 only).  
**Open blockers for L2:** T-2 (layout) + 5 PWF categories.  
**Open blockers for L3:** T-11 (process), T-9 (cat 4), T-2 (cat 2).

---

## 7. Reference UX Module assessment (5D.2D)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md):

| Requirement | Todo status |
|-------------|-------------|
| UX-L3 Certified with Findings minimum | ❌ Not L3 |
| Interaction certification artifact | ✅ 5D.1 closeout |
| Layout reference quality | ❌ T-2 — 3C not applied |
| Manual QA matrix | ❌ T-11 pending |

**Decision:** **Not eligible** for formal Reference UX Module slot.

**Informal strengths:** Cross-module integration (Drive/Calendar/AI/trash) — strong for a workspace module; interaction safety now at platform bar post 5D.1.

---

## 8. Comparison to Wave 5 peers

| Metric | Notifications (5C.2) | Chat (5B.3) | Todo (5D.2) |
|--------|----------------------|-------------|-------------|
| PASS categories | 9 | 6 | **6** |
| UX-L2 | Certified with Findings | Not certified | **Not certified** |
| Primary interaction gap | Resolved (5C.1) | Resolved (5B.1) | **Resolved** (5D.1) |
| Cross-module | PASS | PASS WITH FINDINGS | **PASS** |

Todo ties Chat at **6 PASS** post-remediation; trails Notifications (9 PASS) primarily due to layout shell debt (T-2).

---

## 9. Recommended next engineering wave

**Wave 3C-Todo (layout modernization)** — recommended to close **T-2** and gain L2 PASS categories:

1. Migrate `TodoModule` to `WorkspaceSplitLayout` (or certified management primitives where appropriate).
2. Optional: `TodoWorkspaceLanding.tsx` for business hub (**T-3**).

**Secondary (product polish, not L2-critical alone):**

- **T-4** — implement filter UI or remove stub button.
- **T-5** — wire `TaskDetail` footer Edit to `TaskForm`.
- **T-9 / T-11** — a11y labels + manual QA for L3 path.

**Do not start in 5D.2** — per charter.

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5D.2 re-certification)
