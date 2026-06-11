# Todo Module UX Re-Certification (Wave 5G-Todo-D)

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Certification / documentation only (no source changes)  
**Program:** UX Modernization Wave 5G-Todo-D  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_STANDARD.md`](../UX_CERTIFICATION_STANDARD.md), [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)

---

## 1. Executive summary

| Decision | Result |
|----------|--------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX Module slot** | **Not eligible** |

**Rationale:** Wave **5G-Todo** resolved **T-8** (shared `EmptyState`) and **T-9** (overflow/action `aria-label`s); **T-7** received partial responsive secondary width. Re-score upgrades category **8** (Empty States) from PASS WITH FINDINGS to **PASS**, yielding **9 PASS / 2 PWF / 0 FAIL** — meeting the **≥9 PASS** L2 threshold. Categories **4** and **5** remain **PASS WITH FINDINGS** per platform precedent (unsigned manual QA **T-11**; **T-12** keyboard gaps; **T-7** mobile sheet deferred).

**Prior baseline:** Wave 5D.4 — **8 PASS / 3 PWF / 0 FAIL**, UX-L1 CwF, UX-L2 not certified.

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md) | 5G engineering authority |
| [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md) | Prior authoritative score |
| [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) | Working scorecard |
| [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./CALENDAR_UX_RECERTIFICATION_2026_3C7D.md) | Precedent for cat 4/5 PWF retention with unsigned QA |
| `web/src/components/todo/EmptyTaskState.tsx` | Shared `EmptyState` wrapper + variants |
| `web/src/components/todo/TaskItem.tsx` | `aria-label="Task actions"` |
| `web/src/components/todo/ProjectManager.tsx` | Shared `EmptyState`; project action labels |
| `web/src/components/todo/TodoModule.tsx` | Responsive `WorkspaceSecondary`; empty context wiring |
| `web/src/components/todo/TaskList.tsx` / `TaskBoard.tsx` | Empty state integration |

**Validation:** No source changes in 5G-Todo-D — static code audit against 5G closeout.

---

## 3. Category upgrade analysis (5G-Todo-D)

### Category 8 — Empty States → PASS ✅

| Aspect | Wave 5D.4 | Wave 5G-Todo-D |
|--------|-----------|----------------|
| Rating | PASS WITH FINDINGS | **PASS** |
| Primary driver | T-8 local `EmptyTaskState` | T-8 **resolved** |

**Reasoning for upgrade:**

1. **Shared primitive adopted** — `EmptyTaskState` wraps `EmptyState` from `shared/components` (same pattern as `CalendarEventsEmptyState.tsx` per 3C-7C / E-11 resolution).
2. **L2 criterion met** — [`UX_CERTIFICATION_STANDARD.md`](../UX_CERTIFICATION_STANDARD.md) L2 requires intentional `EmptyState` on list/grid zero-data; constitution Rule 6 satisfied.
3. **Scenario coverage** — no tasks, filtered empty, project-scoped empty, board empty, and `ProjectManager` no-projects sidebar all use shared primitive with guidance + CTA.
4. **Layout preserved** — list/board/calendar views retain structure; empty messaging does not disrupt board columns or project sections.
5. **No material gaps** — T-8 was the sole documented cat 8 defect; no remaining empty-state primitive debt.

**Precedent:** Calendar 3C-7D upgraded cat 8 to PASS on identical evidence class (thin wrapper + shared primitive).

### Category 4 — Accessibility — remains PASS WITH FINDINGS ❌ (no upgrade)

| Aspect | Wave 5D.4 | Wave 5G-Todo-D |
|--------|-----------|----------------|
| Rating | PASS WITH FINDINGS | **PASS WITH FINDINGS** |
| Change | T-9 open | T-9 **resolved**; T-11/T-12 **open** |

**Reasoning against PASS upgrade:**

1. **T-9 resolved** — `TaskItem` overflow trigger has `aria-label="Task actions"`; `ProjectManager` create/edit/delete icon buttons labeled; toolbar controls labeled since 5D.3. Primary L1 code defect cleared.
2. **T-11 open (process gate)** — No signed manual QA / WCAG matrix. Calendar 3C-7D retained cat 4 PWF with identical gate (**E-14**). Notifications 5C.2 retained cat 4 PWF with **N-6** unsigned. Per scorecard PASS definition (“no material gaps”), pending human verification is a documented exception — **PASS WITH FINDINGS**, not PASS.
3. **T-12 open** — No list keyboard navigation; no shortcuts help. Calendar upgraded cat 4 only after resolving **E-13** (shortcuts help). Todo has not shipped equivalent discoverability for keyboard paths.
4. **PASS bar not met** — Resolving one P3 code finding (T-9) does not clear all material a11y exceptions when process verification (T-11) and keyboard coverage (T-12) remain. 5D.4 explicitly rated toolbar labels alone “insufficient for PASS” while T-9 was open; parity with Calendar/Notifications requires T-11 sign-off before cat 4 PASS.

**Net:** Finding count reduced; rating unchanged at PWF.

### Category 5 — Mobile — remains PASS WITH FINDINGS ❌ (no upgrade)

| Aspect | Wave 5D.4 | Wave 5G-Todo-D |
|--------|-----------|----------------|
| Rating | PASS WITH FINDINGS | **PASS WITH FINDINGS** |
| Change | T-7 rigid `w-96` | T-7 **partial** |

**Reasoning against PASS upgrade:**

1. **T-7 partial improvement** — `WorkspaceSecondary` no longer enforces `min-w-[384px]`; uses `shrink min-w-0` with responsive `max-w` and `lg:w-96`. Removes primary horizontal-trap driver on narrow viewports.
2. **Mobile sheet not implemented** — Detail panel still shares horizontal split with main content; no overlay/sheet pattern (deferred in 5G closeout to avoid layout regression). Calendar retained cat 5 PWF after partial mobile fixes until **E-14** human verification.
3. **T-11 unsigned** — No signed 375px QA on core flows (create, filter, board scroll, detail panel). L2 allows cat 5 PWF; PASS requires verified mobile usability per category definition.
4. **Precedent** — Calendar **E-10** marked “resolved (impl)” yet cat 5 stayed PWF pending E-14. Todo T-7 is equivalent partial resolution.

**Net:** Implementation improved; rating unchanged at PWF pending T-11.

### Categories unchanged (remain PASS)

| # | Category | Rationale |
|---|----------|-----------|
| 1 | Interaction Consistency | 5D.1 gates preserved; 5G did not alter delete/confirm flows |
| 2 | Layout Consistency | 5D.3 shell unchanged; T-7 width tweak is cat 5 scope |
| 3 | Navigation | Hub + routes unchanged |
| 6 | Cross-Module Integration | Drive/Calendar/trash/AI integration unchanged |
| 7 | Error Handling | Toast paths unchanged |
| 9 | Loading States | Spinner patterns unchanged |
| 10 | Discoverability | Filters/toolbar unchanged; T-6 board menu gap is P3 discoverability, not cat downgrade |
| 11 | Workflow Completion | Edit/complete/create paths unchanged |

---

## 4. Re-scored category table (5G-Todo-D authoritative)

| # | Category | Rating | Score rationale (post-5G) |
|---|----------|--------|-------------------------|
| 1 | **Interaction Consistency** | **PASS** | Task + sub-entity deletes on `ConfirmModal`; board dnd-kit trash gated; zero native dialogs. |
| 2 | **Layout Consistency** | **PASS** | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout`. |
| 3 | **Navigation** | **PASS** | `TodoWorkspaceLanding` + business hub; `/todo` personal route. |
| 4 | **Accessibility** | **PASS WITH FINDINGS** | T-9 **resolved** — overflow + project action labels. **Findings:** T-11 unsigned QA; T-12 limited keyboard. |
| 5 | **Mobile** | **PASS WITH FINDINGS** | Board horizontal scroll. **Findings:** T-7 partial (responsive width; sheet deferred); T-11 unsigned 375px QA. |
| 6 | **Cross-Module Integration** | **PASS** | Drive, Calendar, global trash, AI, Chat (server); tenancy scoped. |
| 7 | **Error Handling** | **PASS** | `toast.error` on primary CRUD paths. |
| 8 | **Empty States** | **PASS** | Shared `EmptyState` via `EmptyTaskState` + `ProjectManager`; filtered/project/board variants. T-8 **resolved**. |
| 9 | **Loading States** | **PASS** | Initial `Spinner`; AI apply loading. |
| 10 | **Discoverability** | **PASS** | Header actions, toolbar filters, view toggles, project panel, counts. |
| 11 | **Workflow Completion** | **PASS** | Core flows completable; T-1 + T-5 resolved. |

### Summary metrics

| Metric | Wave 5D.4 | Wave 5G-Todo-D |
|--------|-----------|----------------|
| **PASS** | 8 | **9** |
| **PASS WITH FINDINGS** | 3 | **2** |
| **FAIL** | 0 | **0** |
| Native `confirm()` / `prompt()` | 0 | **0** |

**Categories upgraded:** 8 (Empty States).

**Categories not upgraded (justified):** 4 (T-11/T-12 remain), 5 (T-7 partial + T-11).

---

## 5. Level decisions (5G-Todo-D)

### UX-L1 — Certified ✅

| Rule | Result |
|------|--------|
| No FAIL in categories 1, 3, 4, 7 | ✅ |
| L1 blockers (native dialogs, unconfirmed primary delete, hub fallthrough) | ✅ Clear |
| ≥8 of 11 PASS | ✅ (9 PASS) |
| PASS WITH FINDINGS count | 2 (**<3** — not CwF by count) |

**Award:** **UX-L1 Certified** — upgraded from 5D.4 **Certified with Findings** (3 PWF → 2 PWF).

### UX-L2 — Certified with Findings ✅

| Rule | Result |
|------|--------|
| Prerequisite L1 Certified or CwF | ✅ |
| No FAIL in categories 1, 2, 3, 5, 7, 8, 9 | ✅ |
| ≥9 of 11 PASS | ✅ (**9 PASS**) |
| Categories 2, 5 PASS or PWF (not FAIL) | ✅ (2 PASS, 5 PWF) |
| ≥2 PWF for CwF label | ✅ (2 PWF — cats 4, 5) |

**Award:** **UX-L2 Certified with Findings** — first L2 award for Todo module.

### UX-L2 — Certified (strict) ❌

Requires all L2 categories PASS or ≤1 PWF at strict interpretation; 2 PWF categories present → **Certified with Findings** per decision matrix.

### UX-L3 — Not certified ❌

| Rule | Result |
|------|--------|
| Prerequisite UX-L2 | ✅ (L2 CwF met) |
| Core quartet 1, 2, 4, 11 all PASS | ❌ (cat **4** PWF) |
| ≥9 categories PASS at L3 bar | ✅ (9 PASS) |
| Manual QA matrix executed | ❌ (**T-11**) |
| No FAIL any category | ✅ |

**Award:** **Not certified** — core quartet cat 4 PWF + unsigned T-11.

### UX-L3 — Certified with Findings ❌

Requires L3 bar; core quartet cat 4 not PASS.

---

## 6. Finding matrix (5G-Todo-D)

| ID | Finding | 5D.4 | 5G-Todo-D | Severity | Blocks |
|----|---------|------|-----------|----------|--------|
| **T-1** | Task delete no `ConfirmModal` | Resolved | **Resolved** | — | — |
| **T-2** | No layout primitives | Resolved | **Resolved** | — | — |
| **T-3** | No `TodoWorkspaceLanding` | Resolved | **Resolved** | — | — |
| **T-4** | Filter toolbar stub | Resolved | **Resolved** | — | — |
| **T-5** | TaskDetail footer Edit no-op | Resolved | **Resolved** | — | — |
| **T-6** | Board hides overflow in compact | Open | **Open** | P3 | No |
| **T-7** | Fixed detail panel width | Open | **Partial** (5G) | P2 | L3 cat 5 strict PASS |
| **T-8** | Local `EmptyTaskState` | Open | **Resolved** (5G) | — | — |
| **T-9** | Overflow lacks `aria-label` | Open | **Resolved** (5G) | — | — |
| **T-10** | Drive file unlink without confirm | Open | **Open** | P3 | No |
| **T-11** | Manual QA not executed | Open | **Open** | Process | **L3** |
| **T-12** | Limited keyboard shortcuts | Open | **Open** | P3 | L3 cat 4 strict PASS |

**Open blockers for L3:** T-11 (process), cat 4 PWF (T-11 + T-12).

---

## 7. Reference UX Module assessment

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md):

| Requirement | Todo status |
|-------------|-------------|
| UX-L3 Certified with Findings minimum | ❌ Not L3 |
| UX-L2 minimum | ✅ **L2 CwF** (new) |
| Manual QA matrix | ❌ T-11 pending |
| Interaction certification | ✅ 5D.1 |
| Layout reference quality | ✅ 5D.3 workspace shell |

**Decision:** **Not eligible** for formal Reference UX Module slot.

---

## 8. Comparison to Wave 5 peers

| Metric | Notifications (5C.2) | Calendar (3C-7D) | Todo (5G-Todo-D) |
|--------|----------------------|------------------|------------------|
| PASS categories | 9 | 9 | **9** |
| PWF categories | 4 | 2 | **2** |
| UX-L1 | CwF | Certified | **Certified** |
| UX-L2 | CwF | CwF | **CwF** |
| Primary L2 unlock | N-1 resolved | E-6/E-7/E-11 | **T-8** |

Todo joins Notifications and Calendar at **9 PASS**; matches Calendar on **2 PWF** count.

---

## 9. Recommended next steps

### Todo (remaining)

| Priority | Wave | Goal |
|----------|------|------|
| 1 | **5G-QA** | Execute platform manual QA matrix — clears **T-11**; unblocks L3 path for Todo + peers |
| 2 | **5H-Todo** (optional) | T-7 mobile sheet + T-12 shortcuts → cat 4/5 PASS for L3 core quartet |
| 3 | **5G-Todo-L3-D** | Re-cert after QA + optional polish |

### Next module certification candidate

**5G-QA (platform)** — shared manual QA matrix execution unblocks L3 for Calendar (**E-14**), Notifications (**N-6**), Todo (**T-11**), Drive (**F-1**), and Chat (**C-8**) in one process wave.

**Parallel certification:** **5G-Calendar-D** — Calendar L3 CwF re-cert post E-14 sign-off (highest ROI Reference #5 path per [`PLATFORM_CERTIFICATION_GAP_ANALYSIS.md`](../PLATFORM_CERTIFICATION_GAP_ANALYSIS.md)).

---

## Related

- [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md)
- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md)

**Last updated:** 2026-06-03 (Wave 5G-Todo-D)
