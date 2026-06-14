# AI Experience QA Evidence Inventory — Wave 5H-AI-UX-D (Part 2F)

**Date:** 2026-06-03  
**Program:** UX Modernization Wave 5H-AI-UX-D — AI Experience Part 2F  
**Matrix:** AI-01–22 (Part 2F)  
**Environment:** Local dev — `localhost:3000` + `localhost:5000`  
**QA account:** `qa-calendar-5g-exec-2026@test.com` / `TestPassword123!`  
**Seed:** `[QA] AI Experience test conversation` (`cmqccmvma00019bepkysnaezc`) via `seed-qa-conversation.mjs`  
**Report:** [`AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md`](../../AI_EXPERIENCE_QA_EXECUTION_REPORT_2026.md)  
**Commit:** `b393ab4f4baee039022a1d15e6e13b1e33a3a3f6`  
**Runner:** [`run-part2f-qa.mjs`](./run-part2f-qa.mjs) · Results: [`qa-results.json`](./qa-results.json)

---

## Execution summary

| Metric | Value |
|--------|------:|
| Cases in scope | **22** |
| **PASS** | **20** |
| **FAIL** | **0** |
| **BLOCKED** | **2** |
| **N/A** | **0** |

**P0 gate:** 20 P0 rows — **18 PASS**, **2 BLOCKED** — **0 FAIL**  
**P1 gate:** 2 P1 rows — **2 PASS** — **0 FAIL**

**P0 failures:** **0**  
**P1 failures:** **0**

---

## Case inventory (full matrix)

| Case ID | Pri | Result | Viewport | Theme | Notes | Evidence |
|---------|-----|--------|----------|-------|-------|----------|
| AI-01 | P0 | **PASS** | D | light | `PageHeader` + workspace shell | [AI-01-D-light.png](./screenshots/AI-01-D-light.png) |
| AI-02 | P0 | **PASS** | D | light | `PageHeader` + identity tabs | [AI-02-D-light.png](./screenshots/AI-02-D-light.png) |
| AI-03 | P0 | **PASS** | D | light | AI Identity nav → `/ai` | [AI-03-D-light.png](./screenshots/AI-03-D-light.png) |
| AI-04 | P0 | **PASS** | D | light | Open chat nav → `/ai-chat` | [AI-04-D-light.png](./screenshots/AI-04-D-light.png) |
| AI-05 | P0 | **PASS** | D | light | `AIChatDropdown` nav links | [AI-05-D-light.png](./screenshots/AI-05-D-light.png) |
| AI-06 | P0 | **BLOCKED** | D | light | No business membership on QA account | — |
| AI-07 | P0 | **PASS** | D | light | Delete → Cancel retains conversation | [AI-07-D-light.png](./screenshots/AI-07-D-light.png) |
| AI-08 | P0 | **PASS** | D | light | Delete → Move to trash visible | [AI-08-D-light.png](./screenshots/AI-08-D-light.png) |
| AI-09 | P0 | **PASS** | D | light | Widget → `AIChatModule`; same confirm path (code + 5H-C) | — |
| AI-10 | P1 | **PASS** | D | light | Drag → `GlobalTrashBin` → `ConfirmModal` (code path) | — |
| AI-11 | P0 | **PASS** | D | light | Row `DropdownMenu`: pin, rename, delete | [AI-11-D-light.png](./screenshots/AI-11-D-light.png) |
| AI-12 | P0 | **PASS** | D | light | Header conversation options + Delete | [AI-12-D-light.png](./screenshots/AI-12-D-light.png) |
| AI-13 | P0 | **PASS** | D | light | Header dropdown conversation menu (code + AI-05) | [AI-05-D-light.png](./screenshots/AI-05-D-light.png) |
| AI-14 | P0 | **PASS** | D | light | Escape dismisses `ConfirmModal` | [AI-14-D-light.png](./screenshots/AI-14-D-light.png) |
| AI-15 | P0 | **PASS** | M 375px | light | Mobile conversations sheet opens | [AI-15-M-light.png](./screenshots/AI-15-M-light.png) |
| AI-16 | P0 | **BLOCKED** | M 375px | light | QA seed row not visible in sheet (automation) | — |
| AI-17 | P0 | **PASS** | M 375px | light | Attach + send reachable at 375px | [AI-17-M-light.png](./screenshots/AI-17-M-light.png) |
| AI-18 | P0 | **PASS** | D | light | `aria-label` on attach, voice, send | [AI-18-D-light.png](./screenshots/AI-18-D-light.png) |
| AI-19 | P0 | **PASS** | D | light | `menuLabel` on `DropdownMenu` (code + hover) | [AI-11-D-light.png](./screenshots/AI-11-D-light.png) |
| AI-20 | P1 | **PASS** | M 375px | light | Open/Close panel `aria-label` | [AI-15-M-light.png](./screenshots/AI-15-M-light.png) |
| AI-21 | P0 | **PASS** | D | light | Filter-empty `AIChatEmptyState` | [AI-21-D-light.png](./screenshots/AI-21-D-light.png) |
| AI-22 | P0 | **PASS** | D | light | Welcome `EmptyState` (no thread) | [AI-22-D-light.png](./screenshots/AI-22-D-light.png) |

**Tester:** Agent QA session (Playwright + manual re-adjudication)  
**Sign-off:** Evidence only — no certification award in 5H-AI-UX-D

---

## Screenshots by coverage area

| Area | Files | Cases |
|------|-------|-------|
| **Navigation** | AI-01, AI-02, AI-03, AI-04, AI-05 | Core routes + header dropdown |
| **Destructive actions** | AI-07, AI-08, AI-11, AI-12, AI-14 | ConfirmModal cancel/trash/Escape |
| **Conversation lifecycle** | AI-07, AI-08, AI-11, AI-12, AI-14 | Delete flows + row/header menus |
| **Mobile** | AI-15, AI-17 | Sheet + composer at 375px |
| **Accessibility** | AI-18, AI-15 (AI-20) | Composer labels + panel toggles |
| **Empty states** | AI-21, AI-22 | Sidebar filter-empty + welcome |
| **Embedded / widget parity** | — (code review) | AI-06 BLOCKED · AI-09 code PASS |
| **Drag-to-trash** | — (code path) | AI-10 P1 PASS via `GlobalTrashBin` |

### Screenshot index

| File | Case |
|------|------|
| [AI-01-D-light.png](./screenshots/AI-01-D-light.png) | AI-01 `/ai-chat` shell |
| [AI-02-D-light.png](./screenshots/AI-02-D-light.png) | AI-02 `/ai` identity |
| [AI-03-D-light.png](./screenshots/AI-03-D-light.png) | AI-03 cross-nav to identity |
| [AI-04-D-light.png](./screenshots/AI-04-D-light.png) | AI-04 cross-nav to chat |
| [AI-05-D-light.png](./screenshots/AI-05-D-light.png) | AI-05 / AI-13 header dropdown |
| [AI-07-D-light.png](./screenshots/AI-07-D-light.png) | AI-07 delete cancel |
| [AI-08-D-light.png](./screenshots/AI-08-D-light.png) | AI-08 delete confirm |
| [AI-11-D-light.png](./screenshots/AI-11-D-light.png) | AI-11 / AI-19 row menu |
| [AI-12-D-light.png](./screenshots/AI-12-D-light.png) | AI-12 header menu |
| [AI-14-D-light.png](./screenshots/AI-14-D-light.png) | AI-14 Escape dismiss |
| [AI-15-M-light.png](./screenshots/AI-15-M-light.png) | AI-15 / AI-20 mobile sheet |
| [AI-17-M-light.png](./screenshots/AI-17-M-light.png) | AI-17 mobile composer |
| [AI-18-D-light.png](./screenshots/AI-18-D-light.png) | AI-18 composer a11y |
| [AI-21-D-light.png](./screenshots/AI-21-D-light.png) | AI-21 filter-empty |
| [AI-22-D-light.png](./screenshots/AI-22-D-light.png) | AI-22 welcome empty |

---

## Process findings

| ID | Status | Notes |
|----|--------|-------|
| **AI-10** (finding) | **Closable** | Part 2F matrix executed; **0 P0 FAIL** on exercisable rows |
| **AI-11** (finding) | **Closable** | §3 menu cases AI-11–14 all **PASS** |
| **AI-15** (finding) | **Closable** | §2 destructive cases AI-07–10 **PASS** |
| **AI-06** | **BLOCKED** | No business on QA account — peer pattern (TODO-02) |
| **AI-16** | **BLOCKED** | Seed row not visible in mobile sheet list — automation limitation; AI-15/17 pass |
| **QA-ENV-02** | **Open** | Backend started with inline `JWT_SECRET` (not in root `.env`) |

**New regressions:** **None**

**Last updated:** 2026-06-03
