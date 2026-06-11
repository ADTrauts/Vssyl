# Todo Module UX Certification (Wave 5G-Todo-D)

**Status:** **Complete — UX-L2 Certified with Findings**  
**Date:** 2026-06-03  
**Mode:** Certification / audit (documentation-only)  
**Program:** UX Modernization Wave 5D + 5G  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Scorecard:** [`TODO_UX_SCORECARD.md`](./TODO_UX_SCORECARD.md)  
**Re-certification:** [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md)

---

## 1. Certification decision

| Field | Value |
|-------|-------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified with Findings** |
| **UX-L3** | **Not certified** |
| **Reference UX module slot** | **Not eligible** |

### Rationale

Post **5G-Todo-D** re-certification: **9 PASS / 2 PASS WITH FINDINGS / 0 FAIL** — up from **8 PASS / 3 PWF** at 5D.4. Wave **5G** resolved **T-8** (shared `EmptyState`) upgrading category **8** to PASS, meeting the **≥9 PASS** L2 threshold. Categories **4** and **5** remain PWF (unsigned **T-11**; **T-12** keyboard; **T-7** partial mobile).

**UX-L1** upgraded to **Certified** (2 PWF < 3 CwF threshold).

**UX-L3** blocked: core quartet category **4** (Accessibility) PWF; manual QA **T-11** not executed.

**Reference eligibility:** Does not meet UX-L3 minimum.

---

## 2. Scorecard summary (5G-Todo-D)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PASS** |
| 2 | Layout Consistency | **PASS** |
| 3 | Navigation | **PASS** |
| 4 | Accessibility | PASS WITH FINDINGS |
| 5 | Mobile | PASS WITH FINDINGS |
| 6 | Cross-Module Integration | PASS |
| 7 | Error Handling | PASS |
| 8 | Empty States | **PASS** |
| 9 | Loading States | PASS |
| 10 | Discoverability | **PASS** |
| 11 | Workflow Completion | **PASS** |

---

## 3. Findings register

| ID | Status | Blocks L2/L3? |
|----|--------|---------------|
| T-1 Task delete no `ConfirmModal` | **Resolved** (5D.1) | — |
| T-2 No layout primitives | **Resolved** (5D.3) | — |
| T-3 No `TodoWorkspaceLanding` | **Resolved** (5D.3) | — |
| T-4 Filter stub | **Resolved** (5D.3) | — |
| T-5 Edit footer no-op | **Resolved** (5D.3) | — |
| T-6 Board compact overflow hidden | Open (P3) | No |
| T-7 Fixed detail width | **Partial (5G)** | L3 cat 5 strict PASS |
| T-8 Local `EmptyTaskState` | **Resolved (5G)** | — |
| T-9 Overflow `aria-label` | **Resolved (5G)** | — |
| T-10 Drive file unlink no confirm | Open (P3) | No |
| T-11 Manual QA | Open (Process) | **L3** |
| T-12 Keyboard shortcuts | Open (P3) | L3 cat 4 strict PASS |

---

## 4. Comparison to Wave 5 peers

| Metric | Notifications (5C.2) | Calendar (3C-7D) | Todo (5G-Todo-D) |
|--------|----------------------|------------------|------------------|
| PASS | 9 | 9 | **9** |
| UX-L1 | Certified with Findings | Certified | **Certified** |
| UX-L2 | Certified with Findings | Certified with Findings | **Certified with Findings** |
| Interaction gap | Resolved | Resolved | **Resolved** |
| Layout gap | Resolved | Resolved | **Resolved** |

---

## 5. Engineering waves

| Wave | Status |
|------|--------|
| 5D.1 Interaction safety (T-1) | **Complete** |
| 5D.2 Re-certification | **Complete** — 6 PASS / 5 PWF |
| 5D.3 Layout/workflow (T-2–T-5) | **Complete** |
| 5D.4 Re-certification | **Complete** — 8 PASS / 3 PWF |
| 5G L2 polish (T-8, T-9, T-7 partial) | **Complete** |
| **5G-Todo-D Re-certification** | **Complete** — 9 PASS / 2 PWF — [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) |

**Recommended next (Todo):** **5G-QA** manual QA matrix (T-11); optional T-7 sheet + T-12 for L3 path.

**Recommended next certification:** **5G-QA** (platform) or **5G-Calendar-D** (Calendar L3 CwF).

---

## Related

- [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md)
- [`TODO_L2_POLISH_BATCH5G_CLOSEOUT.md`](./TODO_L2_POLISH_BATCH5G_CLOSEOUT.md)
- [`TODO_UX_RECERTIFICATION_2026_5D4.md`](./TODO_UX_RECERTIFICATION_2026_5D4.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5G-Todo-D)
