# Notifications UX-L3 Certification Review (Wave 5G-Notifications-D)

**Status:** **Complete** — certification review only; no council action; no designation award  
**Date:** 2026-06-12  
**Wave:** 5G-Notifications-D  
**Program:** UX Modernization — post N-6 evidence  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md)  
**Prior certification:** [`NOTIFICATIONS_UX_RECERTIFICATION_2026.md`](./NOTIFICATIONS_UX_RECERTIFICATION_2026.md) — UX-L2 CwF (9 PASS / 4 PWF)

---

## 1. Executive summary

| Decision | Result |
|----------|--------|
| **Scorecard** | **11 PASS / 1 PWF / 0 FAIL** (up from 9 / 4 / 0 at 5C.2; 10 / 3 / 0 post-5G pre-QA) |
| **UX-L1** | **Certified** (upgraded from Certified with Findings) |
| **UX-L2** | **Certified** (upgraded from Certified with Findings) |
| **UX-L3** | **Certified with Findings** (first Notifications L3 award) |
| **Reference UX #2** | **Eligible With Findings** — no designation |

**Basis:** Part 2B manual QA per [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](./NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md) — **18 PASS / 0 FAIL / 0 BLOCKED / 2 N/A**; zero product FAIL on all exercisable P0 rows. Engineering remediation per [`NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](./NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md).

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md) | Prior 5C.2 / 5G projected scores |
| [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md) | Prior L2 CwF award |
| [`NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md`](./NOTIFICATIONS_L3_REMEDIATION_BATCH5G_CLOSEOUT.md) | 5G engineering (N-2, N-5, N-7) |
| [`NOTIFICATIONS_QA_ADDENDUM_2026.md`](./NOTIFICATIONS_QA_ADDENDUM_2026.md) | QA execution status |
| [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](./NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md) | Part 2B matrix (N-6) |
| [`qa-evidence/5G-QA/notifications/EVIDENCE_INVENTORY.md`](./qa-evidence/5G-QA/notifications/EVIDENCE_INVENTORY.md) | Screenshots + case inventory |
| [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](./NOTIFICATIONS_UX_L3_READINESS_REVIEW.md) | Pre-QA gate analysis |
| [`PLATFORM_MANUAL_QA_MATRIX.md`](../PLATFORM_MANUAL_QA_MATRIX.md) | Part 2B case definitions |
| [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md) | L3 review precedent |
| [`TODO_UX_RECERTIFICATION_2026_5G.md`](./TODO_UX_RECERTIFICATION_2026_5G.md) | Cat 8 / unsigned-QA precedent |

---

## 3. Category 4 — Accessibility reassessment

**Prior (5C.2 / pre-D):** PASS WITH FINDINGS (N-7 open → 5G resolved; N-6 unsigned)

**QA evidence (P0 a11y cases):**

| Case | Result | Validates |
|------|--------|-----------|
| **NTF-16** | **PASS** | 9/9 row overflow triggers `aria-label="Notification actions"` |
| **NTF-17** | **PASS** | Toolbar + row controls labeled in a11y tree; no focus trap observed |
| **NTF-11** | **PASS** | `j` + `Space` mark-read (6→5 unread) |
| **NTF-12** | **PASS** | `Escape` dismisses menu and delete modals |

**Supporting engineering (5G):** N-7 resolved — `Notification actions`, view-mode group, settings button, mobile category open/close labels; `DropdownMenu` `aria-expanded` / `aria-controls` on trigger span.

**Decision:** **PASS**

**Rationale:** All designated P0 accessibility matrix rows **PASS** with documented evidence. N-6 process gate closed — same standard as Calendar E-14 closure upgrading cat 4. Prior PWF was pending human QA + N-7 code gap; both cleared. No undocumented P0 a11y failures.

**Observation (non-blocking):** `data-notification-index` not rendered on list rows — keyboard focus ring not visually tracked; NTF-11 primary action still **PASS**.

---

## 4. Category 5 — Mobile reassessment

**Prior (5C.2 / pre-D):** PASS WITH FINDINGS (N-5 fixed sidebar; N-6 unsigned)

**QA evidence:**

| Case | Result | Validates |
|------|--------|-----------|
| **NTF-09** | **PASS** | 375px — mobile category sheet opens; feed scrolls; toolbar usable; no layout trap |

**Supporting engineering (5G):** N-5 resolved — Calendar 3C-7B mobile sheet pattern (`Open notification categories` / `Close categories panel`; `min-w-0` main feed).

**Decision:** **PASS**

**Rationale:** P0 mobile density case **PASS** at 375px with screenshot evidence ([`NTF-09-M-light.png`](./qa-evidence/5G-QA/notifications/screenshots/NTF-09-M-light.png)). N-6 mobile verification requirement met — same bar as Calendar CAL-11/CAL-12 closure.

---

## 5. Category 7 — Error Handling reassessment

**Prior (5C.2):** PASS WITH FINDINGS (N-2 console-only)  
**Post-5G (pre-D):** **PASS** (N-2 resolved)

**QA evidence:** Error toasts not matrix-tested in Part 2B session (explicitly noted in execution report). Settings route uses `toast.error` (NTF-02 PASS).

**Engineering evidence (5G):** `showNotificationActionError()` + `react-hot-toast` on all feed failure paths per remediation closeout.

**Decision:** **PASS** (unchanged)

**Rationale:** N-2 engineering resolution is authoritative for cat 7 per Todo/Calendar precedent (code closeout + no regression in QA). Absence of dedicated toast-failure matrix row does not downgrade — no FAIL or regression observed.

---

## 6. Category 8 — Empty States reassessment

**Prior (5C.2 / pre-D):** PASS WITH FINDINGS (N-4 local `EmptyState`)

**QA evidence:**

| Case | Result | Validates |
|------|--------|-----------|
| **NTF-13** | **PASS** | Filtered empty shows guidance + “Try adjusting your filters…” copy |

**Engineering status:** N-4 **open** (P3) — inline module-local `EmptyState` in `page.tsx`; not shared `EmptyState` from `shared/components`.

**Decision:** **PASS WITH FINDINGS** (unchanged)

**Rationale:** Per Todo 5G-Todo-D precedent — cat 8 upgrades to **PASS** only when shared primitive adopted (T-8 resolved). NTF-13 validates **behavior** (category-specific messaging, filter guidance) but does not close **N-4** primitive debt. Meets L2/L3 bar with documented P3 exception; blocks strict 11/11 PASS.

---

## 7. Updated scorecard totals

| # | Category | 5C.2 | 5G pre-QA | 5G-Notifications-D | Δ vs 5C.2 |
|---|----------|------|-----------|---------------------|-----------|
| 1 | Interaction Consistency | PASS | PASS | **PASS** | — |
| 2 | Layout Consistency | PASS | PASS | **PASS** | — |
| 3 | Navigation | PASS | PASS | **PASS** | — |
| 4 | Accessibility | PWF | PWF | **PASS** | ↑ |
| 5 | Mobile | PWF | PWF | **PASS** | ↑ |
| 6 | Cross-Module Integration | PASS | PASS | **PASS** | — |
| 7 | Error Handling | PWF | PASS | **PASS** | ↑ |
| 8 | Empty States | PWF | PWF | **PWF** | — |
| 9 | Loading States | PASS | PASS | **PASS** | — |
| 10 | Discoverability | PASS | PASS | **PASS** | — |
| 11 | Workflow Completion | PASS | PASS | **PASS** | — |

| Metric | 5C.2 | 5G-Notifications-D |
|--------|------|---------------------|
| **PASS** | 9 | **11** |
| **PASS WITH FINDINGS** | 4 | **1** |
| **FAIL** | 0 | **0** |

---

## 8. Certification decisions

### UX-L1 — Certified ✅ (upgraded)

| Rule | Result |
|------|--------|
| No FAIL in categories 1, 3, 4, 7 | ✅ |
| ≥8 of 11 PASS | ✅ (11 PASS) |
| L1 blockers (native dialogs, unconfirmed destructive) | ✅ Clear |
| PWF count | 1 (<3 CwF threshold) |

**Award:** **UX-L1 Certified** — upgraded from **Certified with Findings**.

---

### UX-L2 — Certified ✅ (upgraded)

| Rule | Result |
|------|--------|
| Prerequisite L1 | ✅ |
| No FAIL in 1, 2, 3, 5, 7, 8, 9 | ✅ |
| ≥9 PASS | ✅ (11 PASS) |
| Categories 2, 5 not FAIL | ✅ (both **PASS**) |
| PWF count | 1 — **strict L2 bar** (CwF requires 2+ PWF) |

**Award:** **UX-L2 Certified** — upgraded from **Certified with Findings**. Cats 4, 5, 7 PWF → PASS per N-6 evidence eliminates the multi-PWF CwF posture.

---

### UX-L3 — Certified with Findings ✅ (first award)

| Rule | Result |
|------|--------|
| Prerequisite UX-L2 Certified | ✅ (upgraded this wave) |
| No FAIL in any category | ✅ |
| ≥9 strict PASS | ✅ (11 PASS) |
| Core quartet 1, 2, 4, 11 all PASS | ✅ |
| Manual QA matrix executed | ✅ N-6 closed |
| PWF count | 1 (≤2 L3 CwF threshold) |

**Award:** **UX-L3 Certified with Findings** — not strict L3 Certified (cat 8 PWF blocks 11/11 PASS).

**Reasoning:** Meets [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) L3 CwF row: L3 bar + ≤2 documented findings. Strict L3 requires all PASS — cat 8 N-4 deferred. Calendar achieved strict L3 at 0 PWF; Notifications at 1 PWF correctly maps to **L3 CwF**.

---

## 9. Reference UX #2 readiness

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) and [`NOTIFICATIONS_UX_L3_READINESS_REVIEW.md`](./NOTIFICATIONS_UX_L3_READINESS_REVIEW.md):

| Criterion | Status |
|-----------|--------|
| UX-L3 CwF minimum | ✅ **UX-L3 Certified with Findings** |
| Scorecard + certification artifact | ✅ This review + updated scorecard |
| Manual QA matrix | ✅ N-6 executed (Part 2B) |
| `REFERENCE_MODULE_NOTIFICATIONS.md` | ❌ Not created (per wave charter) |
| Council sign-off | ❌ Not requested |

**Assessment:** **Eligible With Findings**

- **Eligible** for registration prep — second-strongest Reference UX candidate (management-page archetype; cross-module routing hub).
- **With Findings** because designation **not awarded**: registration artifact absent; council not convened; **N-4** shared `EmptyState` deferred; **N-3** settings chrome; **QA-ENV-02** env workaround.

**Not awarded:** Reference UX #2 designation requires council approval — explicitly out of scope for 5G-Notifications-D.

---

## 10. Findings register (post 5G-Notifications-D)

| ID | Status | Severity | Notes |
|----|--------|----------|-------|
| **N-6** | **Resolved** | Process | Part 2B complete; 0 FAIL |
| **N-7** | **Resolved** | — | NTF-16 PASS |
| **N-5** | **Resolved** | — | NTF-09 PASS |
| **N-2** | **Resolved** | — | 5G toast remediation |
| N-1 | **Resolved** | — | 5C.1 bulk delete |
| **N-4** | **Open** | P3 | Local `EmptyState` — cat 8 PWF |
| **N-3** | **Open** | P3 | Settings not on `PageHeader` |
| **N-8** | **Open** | P3 | Grouped view delete affordance |
| **QA-ENV-02** | **Open** | P1 (env) | Inline `JWT_SECRET` workaround |

**No P0 or P1 product FAIL findings remain.**

---

## 11. Comparison to 5C.2

| Metric | 5C.2 | 5G-Notifications-D |
|--------|------|---------------------|
| PASS | 9 | **11** |
| PWF | 4 | **1** |
| FAIL | 0 | 0 |
| UX-L1 | CwF | **Certified** |
| UX-L2 | CwF | **Certified** |
| UX-L3 | Not certified | **Certified with Findings** |
| Reference #2 | Not eligible | **Eligible With Findings** |

---

## Related

- [`NOTIFICATIONS_UX_SCORECARD.md`](./NOTIFICATIONS_UX_SCORECARD.md) — **5G-Notifications-D authoritative**
- [`NOTIFICATIONS_UX_CERTIFICATION.md`](./NOTIFICATIONS_UX_CERTIFICATION.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

---

*Wave 5G-Notifications-D — certification review only. No council action. No designation awards.*
