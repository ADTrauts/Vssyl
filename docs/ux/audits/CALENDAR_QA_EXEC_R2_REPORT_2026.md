# Calendar QA Execution — Wave 5G-QA-EXEC-R2 (Targeted Re-Run)

**Status:** **Complete** — evidence only; no certification promotion  
**Date:** 2026-06-03  
**Wave:** 5G-QA-EXEC-R2 (post **5G-Calendar-QA-Remediation**)  
**Environment:** Local `http://localhost:3000` + `http://localhost:5000` (inline `JWT_SECRET`)  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Viewport:** Desktop (~523×676 automation); light mode  
**Seed:** `[QA] Calendar Event 5G` on 2026-06-15 (API + UI verified)

---

## Scope

Targeted re-run of remediation-impacted cases only:

| Case | Priority | Result |
|------|----------|--------|
| **CAL-06** | P1 | **PASS** |
| **CAL-08** | P0 | **PASS** |
| **CAL-14** | P0 | **PASS** |
| **CAL-16** | P0 | **PASS** |
| **CAL-22** | P0 | **PASS** |

**5 / 5 PASS** — all prior P0 interaction failures in scope are cleared.

---

## Execution log

| Case | Validation | Outcome |
|------|------------|---------|
| **CAL-06** | New Event → `EventDrawer`; month cell (day 16) → create drawer with Jun 16 09:00–10:00; title fill enables Create | **PASS** |
| **CAL-08** | Event chip → view modal → Edit → Delete → `ConfirmModal` → confirm delete; grid cleared; trash count +1 | **PASS** |
| **CAL-14** | Help button visible; modal opens; `?` shortcut opens modal; `?` in search input does not open modal | **PASS** |
| **CAL-16** | Escape closes create drawer; Escape on nested delete confirm dismisses confirm only (drawer remains); overlay cleanup | **PASS** |
| **CAL-22** | Delete confirm Cancel; Escape on confirm; event chip persists; API event count unchanged after cancel | **PASS** |

---

## Evidence

| File | Case |
|------|------|
| [CAL-06-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-06-D-light.png) | CAL-06 — New Event drawer |
| [CAL-08-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-08-D-light.png) | CAL-08 — Delete confirm |
| [CAL-08-event-modal-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-08-event-modal-D-light.png) | CAL-08 — Event chip modal |
| [CAL-08-D-light-post-delete.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-08-D-light-post-delete.png) | CAL-08 — Post-delete grid |
| [CAL-14-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-14-D-light.png) | CAL-14 — Shortcuts help modal |
| [CAL-16-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-16-D-light.png) | CAL-16 — Grid accessible after Escape |
| [CAL-22-D-light.png](./qa-evidence/5G-QA/calendar/screenshots/CAL-22-D-light.png) | CAL-22 — Delete confirm (cancel path) |

---

## Findings

| ID | Status | Notes |
|----|--------|-------|
| **CAL-QA-01** | **Cleared** (QA) | Drawer unmount/Escape; chips and delete reachable |
| **CAL-QA-02** | **Cleared** (QA) | Help button + `?` on month view |
| **CAL-QA-03** | **Cleared** (QA) | Create workflow actionable |
| **E-14** | **Open** | Full CAL-01–24 matrix still incomplete |
| **QA-ENV-02** | **Open** | `JWT_SECRET` not in root `.env` |

---

## Certification impact

| Field | Value |
|-------|-------|
| UX-L1 / L2 / L3 | **Unchanged** — no promotion |
| P0 interaction blockers (in scope) | **Closed** |
| Full matrix sign-off | **Not ready** |

---

## Next steps

1. Resume full **CAL-01–24** matrix (remaining BLOCKED rows: CAL-11/12 mobile, CAL-03 business, etc.).
2. Re-seed `[QA] Calendar Event 5G` before delete/context re-tests in full matrix.
3. Human sign-off on full matrix → **5G-Calendar-D**.

---

*Evidence wave only — no certification promotion.*
