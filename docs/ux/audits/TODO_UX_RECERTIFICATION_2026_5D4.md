# Todo Module UX Re-Certification (Wave 5D.4)

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Certification / documentation only (no source changes)  
**Program:** UX Modernization Wave 5D.4  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)

---

## 1. Executive summary

| Decision | Result |
|----------|--------|
| **UX-L1** | **Certified with Findings** |
| **UX-L2** | **Not certified** (8/11 PASS; requires ≥9) |
| **UX-L3** | **Not certified** |
| **Reference UX Module slot** | **Not eligible** |

**Rationale:** Waves **5D.1** (T-1) and **5D.3** (T-2–T-5) resolved five P2 findings. Re-score upgrades categories **2** (Layout Consistency), **3** (Navigation), and **10** (Discoverability) from PASS WITH FINDINGS to **PASS**, yielding **8 PASS / 3 PWF / 0 FAIL** — up from **6 PASS / 5 PWF** at 5D.2 but **one category short** of the **≥9 PASS** L2 threshold.

**UX-L3** remains blocked: prerequisite UX-L2 not met; core quartet category **4** (Accessibility) is PWF; manual QA **T-11** not executed.

**Prior baseline:** Wave 5D.2 — **6 PASS / 5 PWF / 0 FAIL**, UX-L1 CwF, UX-L2 not certified.

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) | 5D.2 baseline |
| [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) | Prior certification |
| [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md) | T-1 resolved — task delete gate |
| [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md) | T-2–T-5 resolved — layout/workflow |
| [`TODO_MENU_ROLLOUT_CLOSEOUT.md`](./TODO_MENU_ROLLOUT_CLOSEOUT.md) | 3A-4D menu primitives |
| `web/src/components/todo/TodoModule.tsx` | Layout shell, filters, edit wiring |
| `web/src/components/todo/TodoWorkspaceLanding.tsx` | Business hub entry |
| `web/src/components/todo/TaskDetail.tsx` | Footer Edit + sub-entity confirms |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | `case 'todo'` hub wiring |
| [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) | Benchmark comparison |

**Validation:** No source changes in 5D.4 — `pnpm type-check` not required.

---

## 3. Category upgrade analysis (5D.4A)

### Category 2 — Layout Consistency

| Aspect | Wave 5D.2 | Wave 5D.4 (post-5D.3) |
|--------|-----------|------------------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-2: no certified layout primitives | T-2 **resolved** |

**Reasoning for upgrade:**

1. **`WorkspaceSplitLayout` adopted** — `WorkspaceSidebar` (projects) \| `WorkspaceMain` (list/board/calendar) \| `WorkspaceSecondary` (detail) per [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md).
2. **Management chrome primitives** — `PageHeader` (title, counts, New Task, Projects) + `PageToolbar` (quick create, view toggle, filter) match Drive 3C-6 / Chat 3C-3 workspace pattern.
3. **Correct archetype choice** — three-region workspace module; not management-only single column (Notifications pattern).
4. **T-7 (fixed `w-96` detail)** — responsive/mobile finding; belongs to category **5**, not layout archetype debt. Secondary panel width does not negate shell compliance.

### Category 3 — Navigation

| Aspect | Wave 5D.2 | Wave 5D.4 (post-5D.3) |
|--------|-----------|------------------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-3: no `TodoWorkspaceLanding` | T-3 **resolved** |

**Reasoning for upgrade:**

1. **`TodoWorkspaceLanding.tsx`** — thin business hub entry per `module-development.mdc`.
2. **`BusinessWorkspaceContent` `case 'todo'`** — routes through landing with `dashboardId` + `businessId`; no dashboard fallthrough.
3. **Personal route** — `/todo` mounts `TodoModule` directly; acceptable dual entry (same pattern as other modules with personal + business paths).
4. **In-module navigation** — list/board/calendar views; project sidebar filter; task detail panel selection.

### Category 10 — Discoverability

| Aspect | Wave 5D.2 | Wave 5D.4 (post-5D.3) |
|--------|-----------|------------------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-4: filter toolbar stub | T-4 **resolved** |

**Reasoning for upgrade:**

1. **Filter button functional** — `Popover` with status, priority, hide-completed, clear filters; `filteredTasks` on all three views.
2. **Primary actions visible** — `PageHeader` New Task + Projects; `PageToolbar` quick create + view mode toggle (with `aria-label`).
3. **Task counts** — active/completed in header description.
4. **T-6 (board compact hides overflow)** — P3; delete still reachable via confirmed dnd-kit trash and detail panel — analogous to Notifications N-8 grouped-view affordance gap (cat 10 PASS retained at 5C.2).

### Category 11 — Workflow Completion

| Aspect | Wave 5D.2 | Wave 5D.4 |
|--------|-----------|-----------|
| Rating | PASS | **PASS** (unchanged) |
| Strengthened by | T-1 resolved | T-5 **resolved** — footer Edit → `TaskForm` |

**Reasoning:** T-5 removed the last workflow dead-end on the detail footer. Edit paths now consistent: overflow menu, footer Edit, inline fields. No upgrade needed — already PASS.

### Categories unchanged (remain PASS WITH FINDINGS)

| # | Category | Finding drivers |
|---|----------|-----------------|
| 4 | Accessibility | T-9 overflow `aria-label`; T-12 keyboard shortcuts; T-11 no WCAG audit. Toolbar gains `aria-label` in 5D.3 — partial, insufficient for PASS. |
| 5 | Mobile | T-7 fixed `w-96` detail panel; T-11 manual 375px QA not signed. |
| 8 | Empty States | T-8 local `EmptyTaskState` vs shared `EmptyState` — same treatment as Notifications N-4 (PWF at 5C.2). |

---

## 4. Re-scored category table (5D.4 authoritative)

| # | Category | Rating | Score rationale (post-5D.1 + 5D.3) |
|---|----------|--------|-------------------------------------|
| 1 | **Interaction Consistency** | **PASS** | Task + sub-entity deletes on `ConfirmModal`; board dnd-kit trash gated; zero native dialogs. T-1 resolved (5D.1). |
| 2 | **Layout Consistency** | **PASS** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` (sidebar/main/secondary). T-2 resolved (5D.3). |
| 3 | **Navigation** | **PASS** | `TodoWorkspaceLanding` + business hub; `/todo` personal route. T-3 resolved (5D.3). |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | Toolbar icon buttons have `aria-label` (5D.3). **Findings:** `TaskItem` overflow lacks `aria-label` (T-9); no list keyboard nav (T-12); no human WCAG audit (T-11). |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Board horizontal scroll; compact header. **Findings:** Fixed `w-96` detail panel (T-7); manual 375px QA not signed (T-11). |
| 6 | **Cross-Module Integration** | **PASS** | Drive, Calendar, global trash, Chat (server), AI suggestions; tenancy scoped. |
| 7 | **Error Handling** | **PASS** | `toast.error` on primary CRUD paths. |
| 8 | **Empty States** | **PASS WITH FINDINGS** | `EmptyTaskState` with CTA and board/list variants. Not shared primitive (T-8). |
| 9 | **Loading States** | **PASS** | Initial `Spinner`; AI apply loading. |
| 10 | **Discoverability** | **PASS** | Header actions, toolbar filters, view toggles, project panel, counts. T-4 resolved (5D.3). |
| 11 | **Workflow Completion** | **PASS** | Core flows completable; T-1 + T-5 resolved. T-6 board menu gap is P3 — not a dead-end. |

### Summary metrics

| Metric | Wave 5D.2 | Wave 5D.4 |
|--------|-----------|-----------|
| **PASS** | 6 | **8** |
| **PASS WITH FINDINGS** | 5 | **3** |
| **FAIL** | 0 | **0** |
| Native `confirm()` / `prompt()` | 0 | **0** |

**Categories upgraded:** 2 (Layout Consistency), 3 (Navigation), 10 (Discoverability).

---

## 5. Level decisions (5D.4B)

### UX-L1 — Certified with Findings ✅

| Rule | Result |
|------|--------|
| No FAIL in categories 1, 3, 4, 7 | ✅ |
| L1 blockers (native dialogs, unconfirmed primary delete, hub fallthrough) | ✅ Clear |
| ≥8 PASS | ✅ (8 PASS) |
| ≥3 PASS WITH FINDINGS | ✅ (3 PWF — triggers CwF label) |

**Award:** **UX-L1 Certified with Findings** — improved from 6 PASS at 5D.2; meets L1 bar with documented exceptions.

### UX-L2 — Not certified ❌

| Rule | Result |
|------|--------|
| Prerequisite L1 Certified or CwF | ✅ |
| No FAIL in 1, 2, 3, 5, 7, 8, 9 | ✅ |
| ≥9 of 11 PASS | ❌ (**8 PASS** — one short) |
| Categories 2, 5 PASS or PWF (not FAIL) | ✅ (2 PASS, 5 PWF) |

**Award:** **Not certified** — **one category short** of L2 PASS threshold.

**Nearest upgrade paths to L2 (≥9 PASS):** migrate `EmptyTaskState` → shared `EmptyState` (cat 8), add `TaskItem` overflow `aria-label` + spot a11y pass (cat 4), or responsive detail panel + 375px QA (cat 5). Any **one** additional PASS reaches L2 bar.

### UX-L2 — Certified with Findings ❌

Requires L2 bar (≥9 PASS) first. Not met.

### UX-L3 — Not certified ❌

| Rule | Result |
|------|--------|
| Prerequisite UX-L2 | ❌ |
| Core quartet 1, 2, 4, 11 all PASS | ❌ (cat 4 PWF) |
| ≥9 categories PASS (not merely PWF) at L3 bar | ❌ (8 PASS) |
| Manual QA matrix | ❌ (T-11) |

---

## 6. Finding matrix (5D.4C)

| ID | Finding | 5D.2 | 5D.4 | Severity | Blocks |
|----|---------|------|------|----------|--------|
| **T-1** | Task delete no `ConfirmModal` | Resolved (5D.1) | **Resolved** | — | — |
| **T-2** | No layout primitives | Open | **Resolved** (5D.3) | — | Was L2 layout |
| **T-3** | No `TodoWorkspaceLanding` | Open | **Resolved** (5D.3) | — | — |
| **T-4** | Filter toolbar stub | Open | **Resolved** (5D.3) | — | — |
| **T-5** | TaskDetail footer Edit no-op | Open | **Resolved** (5D.3) | — | — |
| T-6 | Board hides overflow menu in compact | Open | **Open** | P3 | No |
| T-7 | Fixed detail panel width | Open | **Open** | P2 | L2 margin (cat 5) |
| T-8 | Local `EmptyTaskState` | Open | **Open** | P3 | L2 margin (cat 8) |
| T-9 | Overflow lacks `aria-label` | Open | **Open** | P3 | L3 (cat 4) |
| T-10 | Drive file unlink without confirm | Open | **Open** | P3 | No |
| T-11 | Manual QA not executed | Open | **Open** | Process | L3 |
| T-12 | Limited keyboard shortcuts | Open | **Open** | P3 | No |

**P1 findings:** All resolved (T-1 only).  
**Open blockers for L2:** One PASS category short — cats 4, 5, or 8 remain PWF.  
**Open blockers for L3:** T-11 (process), T-9 (cat 4), L2 prerequisite.

---

## 7. Reference UX Module assessment (5D.4D)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md):

| Requirement | Todo status |
|-------------|-------------|
| UX-L3 Certified with Findings minimum | ❌ Not L3 |
| Interaction certification artifact | ✅ 5D.1 closeout |
| Layout reference quality | ✅ 5D.3 — `WorkspaceSplitLayout` + management chrome |
| Manual QA matrix | ❌ T-11 pending |
| UX-L2 minimum | ❌ 8 PASS (needs 9) |

**Decision:** **Not eligible** for formal Reference UX Module slot.

**Informal strengths:** Cross-module integration (Drive/Calendar/AI/trash); interaction safety at platform bar; layout shell now Drive-parity for workspace archetype.

---

## 8. Comparison to Wave 5 peers

| Metric | Notifications (5C.2) | Chat (5B.3) | Todo (5D.4) |
|--------|----------------------|-------------|-------------|
| PASS categories | 9 | 6 | **8** |
| UX-L1 | Certified with Findings | Certified with Findings | **Certified with Findings** |
| UX-L2 | Certified with Findings | Not certified | **Not certified** |
| Primary interaction gap | Resolved (5C.1) | Resolved (5B.1) | **Resolved** (5D.1) |
| Layout gap | Resolved (3C-6) | Partial | **Resolved** (5D.3) |

Todo advances from 6 → **8 PASS** post-5D.3; trails Notifications (9 PASS) by **one category**; leads Chat (6 PASS) by **two categories**.

---

## 9. Recommended next steps

### Todo (engineering — not certification)

**5D.5 polish (pick one for L2):**

1. **T-8** — migrate `EmptyTaskState` to shared `EmptyState` (cat 8 → PASS), or
2. **T-9** — `TaskItem` overflow `aria-label` + keyboard spot check (cat 4 → PASS), or
3. **T-7** — responsive detail panel + 375px QA sign-off (cat 5 → PASS)

Then **5D.5 re-cert** for L2 award.

### Next module certification candidate

**Calendar** — largest remaining UX gap vs Drive; deferred 3C-7; recommended per [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md) when reprioritized.

**Do not start in 5D.4** — per charter.

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md)
- [`TODO_UX_RECERTIFICATION_2026.md`](./TODO_UX_RECERTIFICATION_2026.md) (5D.2)

**Last updated:** 2026-06-03 (Wave 5D.4 re-certification)
