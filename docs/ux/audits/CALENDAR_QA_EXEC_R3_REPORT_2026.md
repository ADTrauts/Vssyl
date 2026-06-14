# Calendar QA Execution — Wave 5G-QA-EXEC-R3 (Full Matrix Completion)

**Status:** **Complete** — evidence only; no certification promotion  
**Date:** 2026-06-03  
**Wave:** 5G-QA-EXEC-R3 (post R2 remediation validation)  
**Environment:** Local `http://localhost:3000` + `http://localhost:5000` (inline `JWT_SECRET`)  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Seed:** `[QA] Calendar Event 5G` → edited to `[QA] Calendar Event 5G Edited` on 2026-06-15  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2D (CAL-01–24)

---

## Executive summary

| Metric | Count |
|--------|------:|
| **Total cases** | **24** |
| **PASS** | **19** |
| **FAIL** | **0** |
| **BLOCKED** | **4** |
| **N/A** | **1** |

### By priority

| Tier | Total | PASS | FAIL | BLOCKED | N/A |
|------|------:|-----:|-----:|--------:|----:|
| **P0** | 19 | **17** | **0** | **1** | **1** |
| **P1** | 5 | **2** | **0** | **3** | **0** |

**P0 failures:** **0**  
**P1 failures:** **0**

---

## R3 scope (remaining cases executed)

CAL-03, CAL-04, CAL-05, CAL-07, CAL-09, CAL-10, CAL-11, CAL-12, CAL-13, CAL-15, CAL-17, CAL-18, CAL-19, CAL-20, CAL-21, CAL-23, CAL-24 — plus carry-forward from R1/R2 for CAL-01, CAL-02, CAL-06, CAL-08, CAL-14, CAL-16, CAL-22.

---

## Full case inventory (CAL-01–24)

| Case | Pri | Result | Viewport | Theme | Notes |
|------|-----|--------|----------|-------|-------|
| CAL-01 | P0 | **PASS** | D | light | `/calendar` → month shell (R1) |
| CAL-02 | P0 | **PASS** | D | light | Day/week/month/year quartet (R1) |
| CAL-03 | P0 | **BLOCKED** | D | light | QA user has **zero businesses** — `CalendarWorkspaceLanding` not exercisable |
| CAL-04 | P0 | **PASS** | D | dark | New Event → `EventDrawer` opens |
| CAL-05 | P1 | **BLOCKED** | D | light | Day drag-create — pointer drag not reliable in automation |
| CAL-06 | P0 | **PASS** | D | light | R2 create + R3 edit/save; grid reflects `[QA] Calendar Event 5G Edited` |
| CAL-07 | P1 | **PASS** | D | light | Context menu → Edit opens drawer |
| CAL-08 | P0 | **PASS** | D | light | Delete confirm flow (R2) |
| CAL-09 | P0 | **N/A** | D | — | No bulk delete surface |
| CAL-10 | P1 | **BLOCKED** | D | light | Week/day drag-create — automation limitation |
| CAL-11 | P0 | **PASS** | M 375px | light+dark | Mobile sidebar sheet opens; calendar pick usable |
| CAL-12 | P0 | **PASS** | M 375px | dark | Week grid horizontal scroll (`overflow-x-auto`, 494px > 351px) |
| CAL-13 | P0 | **PASS** | D+M | dark | Grid, chips, drawer readable in dark mode |
| CAL-14 | P0 | **PASS** | D | light | `?` + help button (R2) |
| CAL-15 | P1 | **PASS** | D | dark | `N` on day view opens create drawer |
| CAL-16 | P0 | **PASS** | D | light | Escape / nested confirm (R2) |
| CAL-17 | P0 | **PASS** | D | light | July 2026 — `No events this month` empty state |
| CAL-18 | P0 | **PASS** | D | light | Search `zzznomatch999` → `No matching events` |
| CAL-19 | P1 | **BLOCKED** | D | light | Todo due dates not surfaced on `/calendar` routes (integration in Todo module) |
| CAL-20 | P0 | **PASS** | D | light+dark | Toolbar `aria-label` on nav, shortcuts, calendars |
| CAL-21 | P0 | **PASS** | M 375px | dark | `Open calendars` / `Close calendars panel` labeled |
| CAL-22 | P0 | **PASS** | D | light | Delete cancel + Escape (R2) |
| CAL-23 | P0 | **PASS** | D | light | Right-click → View details / Edit event |
| CAL-24 | P0 | **PASS** | D+M | light+dark | `CalendarPageShell` header + toolbar + split layout |

---

## Coverage checklist

| Area | Status |
|------|--------|
| Desktop light | **PASS** — primary interaction cases |
| Desktop dark | **PASS** — CAL-04, CAL-13, CAL-15, CAL-24 |
| Mobile 375px | **PASS** — CAL-11, CAL-12, CAL-21 |
| Toolbar labels | **PASS** — CAL-20 |
| Sidebar labels | **PASS** — CAL-21 |
| Keyboard / Escape / focus | **PASS** — CAL-14, CAL-15, CAL-16, CAL-22 (R2) |
| Create / edit / delete | **PASS** — CAL-04, CAL-06, CAL-08, CAL-22 |
| Recurring scope | **Not seeded** — delete flow exercised on non-recurring event |
| Calendar switching | **PASS** — filter combobox + mobile sidebar |
| Filters / navigation | **PASS** — CAL-18, month nav, view quartet |
| Context menu | **PASS** — CAL-23 |

---

## Blocked cases (documented — not product FAIL)

| Case | Blocker type | Reason |
|------|--------------|--------|
| CAL-03 | **Data** | QA account has no business workspace membership |
| CAL-05 | **Automation** | Timeline drag-create requires pointer drag simulation |
| CAL-10 | **Automation** | Same as CAL-05 |
| CAL-19 | **Data / scope** | Todo due-date bridge not on standalone `/calendar` routes; requires Todo module seed |

---

## Findings

| ID | Status | Notes |
|----|--------|-------|
| **CAL-QA-01** | **Cleared** | Drawer overlay / Escape (R2) |
| **CAL-QA-02** | **Cleared** | Shortcuts help mounted (R2) |
| **CAL-QA-03** | **Cleared** | Create/edit flows actionable (R2+R3) |
| **E-14** | **Closable** | All exercisable matrix rows **PASS**; 4 BLOCKED documented as env/data/automation — **0 FAIL** |
| **QA-ENV-02** | **Open** | `JWT_SECRET` not in root `.env` (workaround: inline env) |

---

## Certification impact (evidence only — no award)

| Question | Answer |
|----------|--------|
| **E-14 close?** | **Yes** — matrix execution complete; zero FAIL; BLOCKED rows documented |
| **5G-Calendar-D eligible?** | **Yes** — pending human sign-off on this evidence package |
| **Cat 4 (Accessibility) PWF → PASS?** | **Yes** — CAL-14, CAL-16, CAL-20, CAL-21, CAL-23 PASS |
| **Cat 5 (Mobile) PWF → PASS?** | **Yes** — CAL-11, CAL-12 PASS at 375px |
| **UX-L3 Certified with Findings review?** | **Ready** — zero P0 FAIL; engineering blockers cleared; human review gate remains |

---

## Evidence

Screenshots: [`qa-evidence/5G-QA/calendar/screenshots/`](./qa-evidence/5G-QA/calendar/screenshots/)  
Inventory: [`qa-evidence/5G-QA/calendar/EVIDENCE_INVENTORY.md`](./qa-evidence/5G-QA/calendar/EVIDENCE_INVENTORY.md)

---

*Evidence wave only — no certification promotion.*
