# Calendar QA Evidence Inventory — Wave 5G-QA-EXEC-R3

**Date:** 2026-06-03  
**Program:** UX Modernization Wave 5G-QA-EXEC-R3 (full matrix completion)  
**Matrix:** CAL-01–24 (Part 2D)  
**Environment:** Local dev — `localhost:3000` + `localhost:5000`  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Report:** [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](../../CALENDAR_QA_EXEC_R3_REPORT_2026.md)

---

## Execution summary

| Metric | Value |
|--------|------:|
| Cases in scope | **24** |
| **PASS** | **19** |
| **FAIL** | **0** |
| **BLOCKED** | **4** |
| **N/A** | **1** |

**Prior runs:** R1 (9/5/9/1) → R2 (5/5 targeted PASS) → **R3 full matrix complete**.

---

## Case inventory (full matrix)

| Case ID | Result | Viewport | Theme | Notes | Evidence |
|---------|--------|----------|-------|-------|----------|
| CAL-01 | **PASS** | D | light | Month shell load | [CAL-01-D-light.png](./screenshots/CAL-01-D-light.png) |
| CAL-02 | **PASS** | D | light | View quartet (R1) | — |
| CAL-03 | **BLOCKED** | D | light | No business workspace | [ENVIRONMENT_BLOCKER.md](./ENVIRONMENT_BLOCKER.md) |
| CAL-04 | **PASS** | D | dark | New Event drawer | [CAL-04-D-dark.png](./screenshots/CAL-04-D-dark.png) |
| CAL-05 | **BLOCKED** | D | light | Drag-create automation | — |
| CAL-06 | **PASS** | D | light | Create (R2) + edit/save (R3) | [CAL-06-D-light.png](./screenshots/CAL-06-D-light.png), [CAL-06-D-light-edited.png](./screenshots/CAL-06-D-light-edited.png) |
| CAL-07 | **PASS** | D | light | Context menu Edit | [CAL-23-D-light.png](./screenshots/CAL-23-D-light.png) |
| CAL-08 | **PASS** | D | light | Delete flow (R2) | [CAL-08-D-light.png](./screenshots/CAL-08-D-light.png), [CAL-08-event-modal-D-light.png](./screenshots/CAL-08-event-modal-D-light.png) |
| CAL-09 | **N/A** | D | — | No bulk delete | — |
| CAL-10 | **BLOCKED** | D | light | Drag-create automation | — |
| CAL-11 | **PASS** | M 375px | light+dark | Mobile sidebar | [CAL-11-M-light.png](./screenshots/CAL-11-M-light.png), [CAL-11-M-dark.png](./screenshots/CAL-11-M-dark.png) |
| CAL-12 | **PASS** | M 375px | dark | Week horizontal scroll | [CAL-12-M-dark.png](./screenshots/CAL-12-M-dark.png) |
| CAL-13 | **PASS** | D+M | dark | Dark mode readability | [CAL-13-D-dark-desktop.png](./screenshots/CAL-13-D-dark-desktop.png), [CAL-13-D-dark.png](./screenshots/CAL-13-D-dark.png) |
| CAL-14 | **PASS** | D | light | Shortcuts help (R2) | [CAL-14-D-light.png](./screenshots/CAL-14-D-light.png) |
| CAL-15 | **PASS** | D | dark | `N` shortcut day view | [CAL-15-D-dark.png](./screenshots/CAL-15-D-dark.png) |
| CAL-16 | **PASS** | D | light | Escape handling (R2) | [CAL-16-D-light.png](./screenshots/CAL-16-D-light.png) |
| CAL-17 | **PASS** | D | light | Month empty state | [CAL-17-D-light.png](./screenshots/CAL-17-D-light.png) |
| CAL-18 | **PASS** | D | light | Filtered empty search | [CAL-18-D-light.png](./screenshots/CAL-18-D-light.png) |
| CAL-19 | **BLOCKED** | D | light | Todo bridge not on `/calendar` | — |
| CAL-20 | **PASS** | D | light+dark | Toolbar aria-labels | — |
| CAL-21 | **PASS** | M 375px | dark | Sidebar toggle labels | [CAL-21-M-dark.png](./screenshots/CAL-21-M-dark.png) |
| CAL-22 | **PASS** | D | light | Delete cancel (R2) | [CAL-22-D-light.png](./screenshots/CAL-22-D-light.png) |
| CAL-23 | **PASS** | D | light | Context menu view/edit | [CAL-23-D-light.png](./screenshots/CAL-23-D-light.png) |
| CAL-24 | **PASS** | D+M | light+dark | Page shell chrome | [CAL-24-D-light.png](./screenshots/CAL-24-D-light.png), [CAL-24-D-dark.png](./screenshots/CAL-24-D-dark.png) |

**Tester:** Agent QA session (Cursor browser MCP)  
**Sign-off:** Pending human review for **5G-Calendar-D**

---

## Screenshots (R3 additions)

| File | Case |
|------|------|
| [CAL-04-D-dark.png](./screenshots/CAL-04-D-dark.png) | CAL-04 |
| [CAL-06-D-light-edited.png](./screenshots/CAL-06-D-light-edited.png) | CAL-06 edit save |
| [CAL-11-M-light.png](./screenshots/CAL-11-M-light.png) | CAL-11 mobile light |
| [CAL-11-M-dark.png](./screenshots/CAL-11-M-dark.png) | CAL-11 mobile dark |
| [CAL-12-M-dark.png](./screenshots/CAL-12-M-dark.png) | CAL-12 week scroll |
| [CAL-13-D-dark-desktop.png](./screenshots/CAL-13-D-dark-desktop.png) | CAL-13 dark desktop |
| [CAL-13-D-dark.png](./screenshots/CAL-13-D-dark.png) | CAL-13 dark mobile |
| [CAL-15-D-dark.png](./screenshots/CAL-15-D-dark.png) | CAL-15 N shortcut |
| [CAL-17-D-light.png](./screenshots/CAL-17-D-light.png) | CAL-17 empty month |
| [CAL-18-D-light.png](./screenshots/CAL-18-D-light.png) | CAL-18 filtered empty |
| [CAL-21-M-dark.png](./screenshots/CAL-21-M-dark.png) | CAL-21 sidebar labels |
| [CAL-23-D-light.png](./screenshots/CAL-23-D-light.png) | CAL-23 context menu |
| [CAL-24-D-light.png](./screenshots/CAL-24-D-light.png) | CAL-24 shell light |
| [CAL-24-D-dark.png](./screenshots/CAL-24-D-dark.png) | CAL-24 shell dark |

### Prior evidence (R2)

| File | Case |
|------|------|
| [CAL-06-D-light.png](./screenshots/CAL-06-D-light.png) | CAL-06 create |
| [CAL-08-D-light.png](./screenshots/CAL-08-D-light.png) | CAL-08 delete |
| [CAL-14-D-light.png](./screenshots/CAL-14-D-light.png) | CAL-14 |
| [CAL-16-D-light.png](./screenshots/CAL-16-D-light.png) | CAL-16 |
| [CAL-22-D-light.png](./screenshots/CAL-22-D-light.png) | CAL-22 |

---

*Inventory for Wave 5G-QA-EXEC-R3 — evidence only; no certification promotion.*
