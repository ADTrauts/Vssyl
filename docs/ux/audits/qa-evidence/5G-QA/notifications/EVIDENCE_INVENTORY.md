# Notifications QA Evidence Inventory — Wave 5G-QA-EXEC (Part 2B)

**Date:** 2026-06-12  
**Program:** UX Modernization Wave 5G-QA-EXEC — Notifications Part 2B  
**Matrix:** NTF-01–20 (Part 2B)  
**Environment:** Local dev — `localhost:3000` + `localhost:5000` (inline `JWT_SECRET`)  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Seed:** 10 `[QA]` notifications (mixed types; read/unread) — seeded at session start  
**Report:** [`NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md`](../../NOTIFICATIONS_QA_EXECUTION_REPORT_2026.md)  
**Commit:** `b393ab4f4baee039022a1d15e6e13b1e33a3a3f6`

---

## Execution summary

| Metric | Value |
|--------|------:|
| Cases in scope | **20** |
| **PASS** | **18** |
| **FAIL** | **0** |
| **BLOCKED** | **0** |
| **N/A** | **2** |

**P0 gate:** 14 P0 rows — **12 PASS**, **2 N/A** — **0 FAIL**  
**P1 gate:** 6 P1 rows — **6 PASS** — **0 FAIL**

---

## Case inventory (full matrix)

| Case ID | Pri | Result | Viewport | Theme | Notes | Evidence |
|---------|-----|--------|----------|-------|-------|----------|
| NTF-01 | P0 | **PASS** | D | light | Feed loads; `PageHeader` "Notifications" + toolbar | [NTF-01-D-light.png](./screenshots/NTF-01-D-light.png) |
| NTF-02 | P1 | **PASS** | D | light | `/notifications/settings` loads | [NTF-02-D-light.png](./screenshots/NTF-02-D-light.png) |
| NTF-03 | P0 | **N/A** | D | — | System-generated feed; no user create | — |
| NTF-04 | P0 | **PASS** | D | light | Mark as read: 7→6 unread | — |
| NTF-05 | P1 | **PASS** | D | light | Snooze 1h; row hidden; no confirm | — |
| NTF-06 | P0 | **PASS** | D | light | Row delete → `ConfirmModal` → confirm; count 9→8 | [NTF-06-D-light.png](./screenshots/NTF-06-D-light.png) |
| NTF-07 | P0 | **PASS** | D | light | Bulk delete modal shows "delete 2 notifications" | [NTF-07-D-light.png](./screenshots/NTF-07-D-light.png) |
| NTF-08 | P0 | **N/A** | D | — | No drag reorder | — |
| NTF-09 | P0 | **PASS** | M 375px | light | Mobile category sheet; toolbar usable; no layout trap | [NTF-09-M-light.png](./screenshots/NTF-09-M-light.png) |
| NTF-10 | P0 | **PASS** | M+D | dark | Feed, toolbar, modals readable in dark mode | [NTF-10-M-dark.png](./screenshots/NTF-10-M-dark.png), [NTF-20-D-dark.png](./screenshots/NTF-20-D-dark.png) |
| NTF-11 | P0 | **PASS** | D | light | `j` + `Space` mark-read: 6→5 unread | — |
| NTF-12 | P0 | **PASS** | D | light | `Escape` dismisses menu + bulk/single delete modals | — |
| NTF-13 | P0 | **PASS** | D | light | Filtered empty + filter guidance | [NTF-13-D-light.png](./screenshots/NTF-13-D-light.png) |
| NTF-14 | P1 | **PASS** | D | light | Hard refresh: brief empty/loading then rows | — |
| NTF-15 | P1 | **PASS** | D | light | Mixed types: chat, drive, todo, calendar, business, system, ai, place | — |
| NTF-16 | P0 | **PASS** | D | light | 9/9 overflow triggers `aria-label="Notification actions"` | [NTF-19-D-light.png](./screenshots/NTF-19-D-light.png) |
| NTF-17 | P0 | **PASS** | D | light | A11y tree: labeled toolbar + row controls; no trap observed | — |
| NTF-18 | P0 | **PASS** | D | light | Delete cancel + Escape; no delete | [NTF-18-D-light.png](./screenshots/NTF-18-D-light.png) |
| NTF-19 | P0 | **PASS** | D | light | `DropdownMenu` items: mark-read, snooze, archive, delete | [NTF-19-D-light.png](./screenshots/NTF-19-D-light.png) |
| NTF-20 | P0 | **PASS** | D | dark | `PageHeader` + `PageToolbar`; desktop sidebar; no double chrome | [NTF-20-D-dark.png](./screenshots/NTF-20-D-dark.png) |

**Tester:** Agent QA session (Cursor browser MCP)  
**Sign-off:** Pending human review for **5G-Notifications-D**

---

## Screenshots

| File | Case |
|------|------|
| [NTF-01-D-light.png](./screenshots/NTF-01-D-light.png) | NTF-01 feed load |
| [NTF-02-D-light.png](./screenshots/NTF-02-D-light.png) | NTF-02 settings |
| [NTF-06-D-light.png](./screenshots/NTF-06-D-light.png) | NTF-06 single delete confirm |
| [NTF-07-D-light.png](./screenshots/NTF-07-D-light.png) | NTF-07 bulk delete confirm |
| [NTF-09-M-light.png](./screenshots/NTF-09-M-light.png) | NTF-09 mobile 375px sheet |
| [NTF-10-M-dark.png](./screenshots/NTF-10-M-dark.png) | NTF-10 dark mobile |
| [NTF-13-D-light.png](./screenshots/NTF-13-D-light.png) | NTF-13 filtered empty |
| [NTF-18-D-light.png](./screenshots/NTF-18-D-light.png) | NTF-18 delete cancel |
| [NTF-19-D-light.png](./screenshots/NTF-19-D-light.png) | NTF-19 row menu |
| [NTF-20-D-dark.png](./screenshots/NTF-20-D-dark.png) | NTF-20 page chrome dark |

---

## Process findings

| ID | Status | Notes |
|----|--------|-------|
| **N-6** | **Closable** | Full Part 2B matrix executed; **0 FAIL** |
| **N-7** | **Cleared** | NTF-16 PASS post 5G remediation |
| **N-5** | **Cleared** | NTF-09 PASS post mobile sheet |
| **QA-ENV-02** | **Open** | `JWT_SECRET` workaround (inline env) |

**Last updated:** 2026-06-12
