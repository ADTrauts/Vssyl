# Todo QA Evidence Inventory — Wave 5G-QA-EXEC (Part 2C)

**Date:** 2026-06-12  
**Program:** UX Modernization Wave 5G-QA-EXEC — Todo Part 2C  
**Matrix:** TODO-01–30 (Part 2C)  
**Environment:** Local dev — `localhost:3000` + `localhost:5000`  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Seed:** 5 `[QA]` tasks + `[QA] Project` + 1 quick-created task — seeded at session start  
**Report:** [`TODO_QA_EXECUTION_REPORT_2026.md`](../../TODO_QA_EXECUTION_REPORT_2026.md)  
**Commit:** `b393ab4f4baee039022a1d15e6e13b1e33a3a3f6`

---

## Execution summary

| Metric | Value |
|--------|------:|
| Cases in scope | **30** |
| **PASS** | **25** |
| **FAIL** | **0** |
| **BLOCKED** | **2** |
| **N/A** | **1** |
| **KNOWN-PWF** | **2** |

**P0 gate:** 24 P0 rows — **22 PASS**, **1 BLOCKED**, **1 N/A** — **0 FAIL**  
**P1 gate:** 6 P1 rows — **3 PASS**, **1 BLOCKED**, **2 KNOWN-PWF** — **0 FAIL**

---

## Case inventory (full matrix)

| Case ID | Pri | Result | Viewport | Theme | Notes | Evidence |
|---------|-----|--------|----------|-------|-------|----------|
| TODO-01 | P0 | **PASS** | D | light | List + PageHeader + toolbar | [TODO-01-D-light.png](./screenshots/TODO-01-D-light.png) |
| TODO-02 | P0 | **BLOCKED** | D | light | No business on QA account | — |
| TODO-03 | P0 | **PASS** | D | light | List/board/calendar views | [TODO-03-D-light.png](./screenshots/TODO-03-D-light.png) |
| TODO-04 | P0 | **PASS** | D | light | New Task → TaskForm | [TODO-04-D-light.png](./screenshots/TODO-04-D-light.png) |
| TODO-05 | P0 | **PASS** | D | light | Quick create | — |
| TODO-06 | P1 | **PASS** | D | light | Projects panel | [TODO-29-D-light.png](./screenshots/TODO-29-D-light.png) |
| TODO-07 | P0 | **PASS** | D | light | Detail footer Edit (`title="Edit task"`) | [TODO-07-detail-debug.png](./screenshots/TODO-07-detail-debug.png) |
| TODO-08 | P0 | **PASS** | D | light | Overflow Edit | — |
| TODO-09 | P0 | **PASS** | D | light | List delete ConfirmModal | [TODO-09-D-light.png](./screenshots/TODO-09-D-light.png) |
| TODO-10 | P0 | **PASS** | D | light | Detail delete ConfirmModal | — |
| TODO-11 | P0 | **N/A** | D | — | No bulk delete | — |
| TODO-12 | P0 | **PASS** | D | light | Board columns | — |
| TODO-13 | P0 | **PASS** | D | light | Board trash confirm path | — |
| TODO-14 | P0 | **PASS** | M 375px | light | Board scroll; no body trap | [TODO-14-M-light.png](./screenshots/TODO-14-M-light.png) |
| TODO-15 | P0 | **PASS** | M 375px | light | Detail usable at 375px | [TODO-15-M-light.png](./screenshots/TODO-15-M-light.png) |
| TODO-16 | P0 | **PASS** | B | dark | Dark mode readable | [TODO-16-B-dark.png](./screenshots/TODO-16-B-dark.png) |
| TODO-17 | P0 | **PASS** | D | light | Escape dismisses modal | [TODO-17-D-light.png](./screenshots/TODO-17-D-light.png) |
| TODO-18 | P1 | **KNOWN-PWF** | D | light | T-12 keyboard | — |
| TODO-19 | P0 | **PASS** | D | light | Shared EmptyState (filter-empty + primitive) | — |
| TODO-20 | P0 | **PASS** | D | light | Filtered empty guidance | — |
| TODO-21 | P1 | **PASS** | D | light | Spinner on load | — |
| TODO-22 | P1 | **BLOCKED** | D | light | No attachment seed | — |
| TODO-23 | P1 | **PASS** | D | light | Calendar view due dates | [TODO-23-D-light.png](./screenshots/TODO-23-D-light.png) |
| TODO-24 | P0 | **PASS** | D | light | `aria-label="Task actions"` on overflows | [TODO-27-D-light.png](./screenshots/TODO-27-D-light.png) |
| TODO-25 | P0 | **PASS** | D | light | Labeled view toggles | [TODO-01-D-light.png](./screenshots/TODO-01-D-light.png) |
| TODO-26 | P0 | **PASS** | D | light | Delete cancel | [TODO-26-D-light.png](./screenshots/TODO-26-D-light.png) |
| TODO-27 | P0 | **PASS** | D | light | DropdownMenu Edit/Delete | [TODO-27-D-light.png](./screenshots/TODO-27-D-light.png) |
| TODO-28 | P1 | **KNOWN-PWF** | D | light | T-6 compact board menu | — |
| TODO-29 | P0 | **PASS** | D | light | Projects panel + shell | [TODO-29-D-light.png](./screenshots/TODO-29-D-light.png) |
| TODO-30 | P0 | **PASS** | D | light | TaskDetail in secondary | [TODO-30-D-light.png](./screenshots/TODO-30-D-light.png) |

**Tester:** Agent QA session (Playwright + manual re-adjudication)  
**Sign-off:** Pending human review for **5G-Todo-L3-D**

---

## Screenshots

| File | Case |
|------|------|
| [TODO-01-D-light.png](./screenshots/TODO-01-D-light.png) | TODO-01 feed load |
| [TODO-03-D-light.png](./screenshots/TODO-03-D-light.png) | TODO-03 calendar view |
| [TODO-04-D-light.png](./screenshots/TODO-04-D-light.png) | TODO-04 New Task form |
| [TODO-07-detail-debug.png](./screenshots/TODO-07-detail-debug.png) | TODO-07/30 detail panel |
| [TODO-09-D-light.png](./screenshots/TODO-09-D-light.png) | TODO-09 delete confirm |
| [TODO-14-M-light.png](./screenshots/TODO-14-M-light.png) | TODO-14 mobile board |
| [TODO-15-M-light.png](./screenshots/TODO-15-M-light.png) | TODO-15 mobile detail |
| [TODO-16-B-dark.png](./screenshots/TODO-16-B-dark.png) | TODO-16 dark mode |
| [TODO-17-D-light.png](./screenshots/TODO-17-D-light.png) | TODO-17 Escape |
| [TODO-23-D-light.png](./screenshots/TODO-23-D-light.png) | TODO-23 calendar tasks |
| [TODO-26-D-light.png](./screenshots/TODO-26-D-light.png) | TODO-26 cancel confirm |
| [TODO-27-D-light.png](./screenshots/TODO-27-D-light.png) | TODO-27 row menu |
| [TODO-29-D-light.png](./screenshots/TODO-29-D-light.png) | TODO-29 projects shell |
| [TODO-30-D-light.png](./screenshots/TODO-30-D-light.png) | TODO-30 TaskDetail |

---

## Process findings

| ID | Status | Notes |
|----|--------|-------|
| **T-11** | **Closable** | Full Part 2C matrix executed; **0 FAIL** |
| **T-9** | **Cleared** | TODO-24 PASS |
| **T-7** | **Cleared** | TODO-14/15 PASS |
| **T-12** | **Open** | TODO-18 KNOWN-PWF |
| **T-6** | **Open** | TODO-28 KNOWN-PWF |
| **QA-ENV-02** | **Open** | `JWT_SECRET` not in root `.env` |

**Last updated:** 2026-06-12
