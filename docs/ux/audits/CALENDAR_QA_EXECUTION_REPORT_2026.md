# Calendar QA Execution Report (Wave 5G-QA-EXEC)

**Status:** **Complete — partial live execution** (re-run 2026-06-12)  
**Date:** 2026-06-12 (re-run); 2026-06-03 (initial attempt)  
**Mode:** QA evidence wave only — **no certification promotion**  
**Program:** UX Modernization Wave 5G-QA-EXEC  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2D  
**Runbook:** [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md)  
**Evidence:** [qa-evidence/5G-QA/calendar/](./qa-evidence/5G-QA/calendar/)

---

## 1. Executive summary

| Field | Value |
|-------|-------|
| **Objective** | Execute CAL-01–CAL-24 (desktop + 375px mobile; light + dark) |
| **Outcome (re-run)** | **9 PASS / 5 FAIL / 9 BLOCKED / 1 N/A** |
| **Outcome (initial)** | **0 PASS / 24 BLOCKED** (QA-ENV-01) |
| **Environment** | Local `localhost:3000` + API `localhost:5000`; commit `b393ab4f` |
| **QA-ENV-01** | **Resolved** — calendar compiles and renders |
| **E-14** | **Open** — P0 FAIL rows block sign-off |
| **5G-Calendar-D** | **Not ready** |

---

## 2. Results summary (re-run 2026-06-12)

| Metric | Count |
|--------|------:|
| **Total cases in scope** | **24** |
| **PASS** | **9** |
| **FAIL** | **5** |
| **BLOCKED** | **9** |
| **N/A** | **1** |

### By priority tier

| Tier | Total | PASS | FAIL | BLOCKED | N/A |
|------|------:|-----:|-----:|--------:|----:|
| **P0** | 16 | 7 | **4** | 4 | 1 |
| **P1** | 8 | 2 | **1** | 5 | 0 |

### Priority cases (requested focus)

| Case | Pri | Result | Notes |
|------|-----|--------|-------|
| **CAL-08** | P0 | **FAIL** | Delete `ConfirmModal` not exercised — drawer overlay blocked event chip |
| **CAL-11** | P0 | **BLOCKED** | 375px mobile sidebar not validated |
| **CAL-12** | P0 | **BLOCKED** | Week 375px scroll not validated |
| **CAL-20** | P0 | **PASS** | Toolbar `aria-label` on nav controls |
| **CAL-21** | P0 | **PASS** | `Open calendars` label present |
| **CAL-22** | P0 | **FAIL** | Delete cancel/Escape not exercised |

---

## 3. Execution log (re-run)

| Step | Action | Result |
|------|--------|--------|
| 1 | QA-ENV-01 verified resolved (`b393ab4f`) | Calendar compiles |
| 2 | Backend on :5000 with inline `JWT_SECRET` | API **200** |
| 3 | Web on :3000 with `NEXTAUTH_URL=http://localhost:3000` | Login **PASS** |
| 4 | Register/login QA user | Session established |
| 5 | `/calendar/month` | **PASS** — shell + empty state |
| 6 | View quartet day/week/month/year | **PASS** |
| 7 | Seed event via API | Grid shows `[QA] Calendar Event 5G` |
| 8 | Interaction cases (delete, shortcuts, context menu) | **FAIL/BLOCKED** — create drawer overlay stuck |

---

## 4. Findings

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| **QA-ENV-01** | `menuShared.js` compile blocker | P0 (env) | **Resolved** |
| **QA-ENV-02** | `JWT_SECRET` missing from root `.env` | P1 (env) | Open |
| **QA-ENV-03** | `NEXTAUTH_URL` port mismatch when web on :3001 | P1 (env) | Workaround documented |
| **E-14** | Manual QA matrix incomplete | P0 (process) | **Open** |
| **CAL-QA-01** (new) | Create `EventDrawer` overlay persists; blocks chip/context/delete flows | P0 (UX) | Observed re-run |

---

## 5. Certification impact

| Field | Before | After re-run |
|-------|--------|--------------|
| UX-L1 | Certified | **Unchanged** |
| UX-L2 | Certified with Findings | **Unchanged** |
| UX-L3 | Not certified | **Unchanged** |
| E-14 | Open | **Open** |

---

## 6. Next steps

1. Fix **CAL-QA-01** drawer overlay / Escape dismiss (engineering).
2. Re-run blocked cases: CAL-08, CAL-11, CAL-12, CAL-14, CAL-16, CAL-22, CAL-23.
3. Human QA sign-off on staging with seeded business + todo data.
4. Then open **5G-Calendar-D**.

---

*Evidence wave only — no certification promotion.*
