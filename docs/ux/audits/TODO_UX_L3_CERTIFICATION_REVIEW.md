# Todo UX-L3 Certification Review (Wave 5G-Todo-L3-D)

**Status:** **Complete** — certification review only; no council action; no designation award  
**Date:** 2026-06-12  
**Wave:** 5G-Todo-L3-D  
**Program:** UX Modernization — post T-11 evidence  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md)  
**Prior certification:** [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) — UX-L2 CwF (9 PASS / 2 PWF)

---

## 1. Executive summary

| Decision | Result |
|----------|--------|
| **Scorecard** | **11 PASS / 0 PWF / 0 FAIL** (up from 9 PASS / 2 PWF at 5G-Todo-D) |
| **UX-L1** | **Certified** (unchanged) |
| **UX-L2** | **Certified** (upgraded from Certified with Findings) |
| **UX-L3** | **Certified** (first Todo L3 award) |
| **Reference UX #3** | **Eligible With Findings** — no designation |

**Basis:** Part 2C manual QA per [`TODO_QA_EXECUTION_REPORT_2026.md`](./TODO_QA_EXECUTION_REPORT_2026.md) — **25 PASS / 0 FAIL / 2 BLOCKED / 1 N/A / 2 KNOWN-PWF**; zero product FAIL on all exercisable P0 rows. Engineering waves 5D.1–5D.3 + 5G polish per [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md).

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) | Prior 5G-Todo-D scores |
| [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md) | Prior L2 CwF award |
| [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) | 5G-Todo-D re-cert |
| [`TODO_QA_ADDENDUM_2026.md`](./TODO_QA_ADDENDUM_2026.md) | QA execution status |
| [`TODO_QA_EXECUTION_REPORT_2026.md`](./TODO_QA_EXECUTION_REPORT_2026.md) | Part 2C matrix (T-11) |
| [`qa-evidence/5G-QA/todo/EVIDENCE_INVENTORY.md`](./qa-evidence/5G-QA/todo/EVIDENCE_INVENTORY.md) | Screenshots + case inventory |
| [`TODO_UX_L3_READINESS_REVIEW.md`](./TODO_UX_L3_READINESS_REVIEW.md) | Pre-QA gate analysis |
| [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) | Part 2C case definitions |
| [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md) | L3 review precedent |
| [`NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md`](./NOTIFICATIONS_UX_L3_CERTIFICATION_REVIEW.md) | Cat 4 KNOWN-PWF precedent |

---

## 3. Category 4 — Accessibility reassessment

**Prior (5G-Todo-D):** PASS WITH FINDINGS (T-9 resolved; T-11 unsigned; T-12 keyboard)

**QA evidence (P0 a11y cases):**

| Case | Result | Validates |
|------|--------|-----------|
| **TODO-24** | **PASS** | 6 overflow triggers `aria-label="Task actions"` |
| **TODO-25** | **PASS** | View toggles `List view` / `Board view` / `Calendar view` labeled |
| **TODO-17** | **PASS** | `Escape` dismisses delete modal |
| **TODO-18** | **KNOWN-PWF** | No arrow-key list navigation — **T-12** per matrix |

**Supporting engineering (5G):** T-9 resolved — `TaskItem` `aria-label="Task actions"`; `ProjectManager` create/edit/delete labels.

**Decision:** **PASS**

**Rationale:** All designated P0 accessibility matrix rows **PASS** or **KNOWN-PWF** with documented evidence. T-11 process gate closed — same standard as Calendar E-14 and Notifications N-6 upgrading cat 4. TODO-18 **KNOWN-PWF** for T-12 does not block PASS (matrix waiver; P1 only) — mirrors Notifications NTF-11 observation pattern for non-P0 keyboard gaps.

---

## 4. Category 5 — Mobile reassessment

**Prior (5G-Todo-D):** PASS WITH FINDINGS (T-7 partial; T-11 unsigned)

**QA evidence:**

| Case | Result | Validates |
|------|--------|-----------|
| **TODO-14** | **PASS** | 375px board — horizontal scroll; `scrollW=375` no body trap |
| **TODO-15** | **PASS** | 375px list + detail — `TaskDetail` usable; no rigid 384px overflow |

**Supporting engineering (5G):** T-7 partial — responsive `WorkspaceSecondary` width (`shrink min-w-0`; `lg:w-96`); mobile sheet deferred but QA shows sufficient at 375px.

**Decision:** **PASS**

**Rationale:** P0 mobile cases **PASS** at 375px with screenshot evidence ([`TODO-14-M-light.png`](./qa-evidence/5G-QA/todo/screenshots/TODO-14-M-light.png), [`TODO-15-M-light.png`](./qa-evidence/5G-QA/todo/screenshots/TODO-15-M-light.png)). T-7 partial implementation sufficient per QA — same bar as Calendar CAL-11/CAL-12 closure after 3C-7B.

---

## 5. Categories unchanged (remain PASS)

| # | Category | Rating | Notes |
|---|----------|--------|-------|
| 1 | Interaction Consistency | **PASS** | 5D.1 delete confirms; TODO-09/10/13/26/27 QA |
| 2 | Layout Consistency | **PASS** | 5D.3 shell; TODO-29 QA |
| 3 | Navigation | **PASS** | `TodoWorkspaceLanding`; TODO-01 QA (TODO-02 BLOCKED — verification only) |
| 6 | Cross-Module Integration | **PASS** | TODO-23 calendar view; Drive/Calendar bridges |
| 7 | Error Handling | **PASS** | Toast paths; no QA regression |
| 8 | Empty States | **PASS** | T-8 shared `EmptyState`; TODO-19/20 QA |
| 9 | Loading States | **PASS** | TODO-21 QA |
| 10 | Discoverability | **PASS** | Toolbar/views/filters; TODO-03/04/05 QA |
| 11 | Workflow Completion | **PASS** | TODO-07/08 edit flows; core paths completable |

---

## 6. Updated scorecard totals

| # | Category | 5G-Todo-D | 5G-Todo-L3-D | Δ |
|---|----------|-----------|--------------|---|
| 1 | Interaction Consistency | PASS | **PASS** | — |
| 2 | Layout Consistency | PASS | **PASS** | — |
| 3 | Navigation | PASS | **PASS** | — |
| 4 | Accessibility | PWF | **PASS** | ↑ |
| 5 | Mobile | PWF | **PASS** | ↑ |
| 6 | Cross-Module Integration | PASS | **PASS** | — |
| 7 | Error Handling | PASS | **PASS** | — |
| 8 | Empty States | PASS | **PASS** | — |
| 9 | Loading States | PASS | **PASS** | — |
| 10 | Discoverability | PASS | **PASS** | — |
| 11 | Workflow Completion | PASS | **PASS** | — |

| Metric | 5G-Todo-D | 5G-Todo-L3-D |
|--------|-----------|--------------|
| **PASS** | 9 | **11** |
| **PWF** | 2 | **0** |
| **FAIL** | 0 | **0** |

---

## 7. Certification decisions

### UX-L1 — Certified ✅ (unchanged)

| Rule | Result |
|------|--------|
| ≥8 PASS | ✅ 11 PASS |
| PWF < 3 | ✅ 0 PWF |
| No L1 blockers | ✅ |

---

### UX-L2 — Certified ✅ (upgraded)

| Rule | Result |
|------|--------|
| Prerequisite L1 | ✅ |
| ≥9 PASS | ✅ 11 PASS |
| Categories 2, 5 not FAIL | ✅ (both **PASS**) |
| PWF count | 0 — **strict L2** (was CwF at 2 PWF) |

**Award:** **UX-L2 Certified** — upgraded from **Certified with Findings**.

---

### UX-L3 — Certified ✅ (first award)

| Rule | Result |
|------|--------|
| Prerequisite UX-L2 Certified | ✅ (upgraded this wave) |
| No FAIL in any category | ✅ |
| ≥9 strict PASS | ✅ 11 PASS |
| Core quartet 1, 2, 4, 11 all PASS | ✅ |
| Manual QA matrix executed | ✅ T-11 closed |
| PWF count | 0 — **strict L3** |

**Award:** **UX-L3 Certified** — matches Calendar strict L3 bar (11/11 PASS). Todo exceeds Notifications L3 CwF (which retained 1 PWF on cat 8).

---

## 8. Reference UX #3 readiness

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) and [`TODO_UX_L3_READINESS_REVIEW.md`](./TODO_UX_L3_READINESS_REVIEW.md):

| Criterion | Status |
|-----------|--------|
| UX-L3 minimum | ✅ **UX-L3 Certified** (strict) |
| Scorecard + certification artifact | ✅ This review + updated scorecard |
| Manual QA matrix | ✅ T-11 executed (Part 2C) |
| `REFERENCE_MODULE_TODO.md` | ❌ Not created (per wave charter) |
| Council sign-off | ❌ Not requested |

**Assessment:** **Eligible With Findings**

- **Eligible** for UX **#3** registration prep — workspace-split task/board archetype; Architecture **#4** already held.
- **With Findings** because designation **not awarded**: registration artifact absent; T-12/T-6 documented; TODO-02/22 BLOCKED verification gaps; QA-ENV-02.

**Not awarded:** Reference UX #3 requires council approval — explicitly out of scope for 5G-Todo-L3-D.

---

## 9. Findings register (post 5G-Todo-L3-D)

| ID | Status | Severity | Notes |
|----|--------|----------|-------|
| **T-11** | **Resolved** | Process | Part 2C complete; 0 FAIL |
| **T-9** | **Resolved** | — | TODO-24 PASS |
| **T-7** | **Resolved** | — | TODO-14/15 PASS (partial width sufficient) |
| T-12 | **Open** | P3 | TODO-18 KNOWN-PWF |
| T-6 | **Open** | P3 | TODO-28 KNOWN-PWF |
| T-10 | **Open** | P3 | Drive unlink no confirm |
| **QA-ENV-02** | **Open** | P1 (env) | `JWT_SECRET` workaround |
| R-TOD-1 | **Open** | P2 (verification) | TODO-02 BLOCKED — business hub not QA-verified |
| R-TOD-2 | **Open** | P2 (verification) | TODO-22 BLOCKED — no attachment seed |

**No P0 or P1 product FAIL findings remain.**

---

## 10. Comparison to 5G-Todo-D

| Metric | 5G-Todo-D | 5G-Todo-L3-D |
|--------|-----------|--------------|
| PASS | 9 | **11** |
| PWF | 2 | **0** |
| FAIL | 0 | 0 |
| UX-L1 | Certified | **Certified** |
| UX-L2 | CwF | **Certified** |
| UX-L3 | Not certified | **Certified** |
| Reference UX #3 | Not eligible | **Eligible With Findings** |

---

## 11. Platform UX-L3 roster (post-review)

| Module | UX-L3 | PWF | Reference UX |
|--------|-------|-----|--------------|
| Calendar | **Certified** | 0 | **#5 Approved w/ Findings** |
| Notifications | **Certified with Findings** | 1 | **#2 Approved w/ Findings** |
| **Todo** | **Certified** | **0** | **#3 Eligible w/ Findings** |
| Chat | Not certified | — | #2 Rejected (UX) |
| Drive | Pre-11-cat audit | — | **#1 Approved w/ Findings** |

---

## Related

- [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md) — **5G-Todo-L3-D authoritative**
- [`TODO_UX_CERTIFICATION.md`](./TODO_UX_CERTIFICATION.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

---

*Wave 5G-Todo-L3-D — certification review only. No council action. No designation awards.*
