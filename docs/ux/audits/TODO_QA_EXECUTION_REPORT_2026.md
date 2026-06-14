# Todo QA Execution — Wave 5G-QA-EXEC (Part 2C)

**Status:** **Complete** — evidence only; no certification promotion  
**Date:** 2026-06-12  
**Wave:** 5G-QA-EXEC — Todo Part 2C  
**Environment:** Local `http://localhost:3000` + `http://localhost:5000`  
**QA account:** `qa-calendar-5g-exec-2026@test.com`  
**Seed:** 5 `[QA]` tasks + 1 `[QA] Project` + 1 quick-created task — seeded at session start  
**Matrix:** [PLATFORM_MANUAL_QA_MATRIX.md](../PLATFORM_MANUAL_QA_MATRIX.md) Part 2C (TODO-01–30)  
**Runbook:** [PLATFORM_MANUAL_QA_RUNBOOK.md](../PLATFORM_MANUAL_QA_RUNBOOK.md)  
**Commit:** `b393ab4f4baee039022a1d15e6e13b1e33a3a3f6`

---

## Executive summary

| Metric | Count |
|--------|------:|
| **Total cases** | **30** |
| **PASS** | **25** |
| **FAIL** | **0** |
| **BLOCKED** | **2** |
| **N/A** | **1** |
| **KNOWN-PWF** | **2** |

### By priority

| Tier | Total | PASS | FAIL | BLOCKED | N/A | KNOWN-PWF |
|------|------:|-----:|-----:|--------:|----:|----------:|
| **P0** | 24 | **22** | **0** | **1** | **1** | **0** |
| **P1** | 6 | **3** | **0** | **1** | **0** | **2** |

**P0 failures:** **0**  
**P1 failures:** **0**

---

## Preconditions

| Item | Status |
|------|--------|
| Wave 5G polish (T-8, T-9, T-7 partial) | Applied on branch under test |
| QA seed data | 5 `[QA]` tasks inserted via Prisma for QA user |
| `pnpm type-check` | PASS (pre-session) |
| Viewports | D 1280×800; M 375×812 (Chrome DevTools emulation) |
| Themes | Light + dark (`.dark` on `html`) |
| Auth | Credentials login to `/todo` |

---

## Full case inventory (TODO-01–30)

| Case | Pri | Result | Viewport | Theme | Notes |
|------|-----|--------|----------|-------|-------|
| TODO-01 | P0 | **PASS** | D | light | List default; `PageHeader` To-Do + toolbar visible |
| TODO-02 | P0 | **BLOCKED** | D | light | No business membership on QA account — hub not exercisable |
| TODO-03 | P0 | **PASS** | D | light | List / board / calendar views render; calendar grid shows due-date tasks |
| TODO-04 | P0 | **PASS** | D | light | New Task opens `TaskForm` |
| TODO-05 | P0 | **PASS** | D | light | Quick create via toolbar input |
| TODO-06 | P1 | **PASS** | D | light | Projects panel + create affordance visible |
| TODO-07 | P0 | **PASS** | D | light | Footer `title="Edit task"` opens editor (detail panel); overflow Edit also PASS (TODO-08) |
| TODO-08 | P0 | **PASS** | D | light | Overflow → Edit opens `TaskForm` |
| TODO-09 | P0 | **PASS** | D | light | List delete → `ConfirmModal`; cancel preserves row |
| TODO-10 | P0 | **PASS** | D | light | Detail footer trash icon → `ConfirmModal`; cancel |
| TODO-11 | P0 | **N/A** | D | — | No bulk delete surface |
| TODO-12 | P0 | **PASS** | D | light | Board columns render; status columns visible |
| TODO-13 | P0 | **PASS** | D | light | Board view loads; dnd trash gated per 5D.1 (confirm path) |
| TODO-14 | P0 | **PASS** | M 375px | light | Board horizontal scroll; no body trap (`scrollW=375`) |
| TODO-15 | P0 | **PASS** | M 375px | light | Task select opens detail; `Complete` + icon Edit/Delete usable; no rigid 384px overflow |
| TODO-16 | P0 | **PASS** | B | dark | List, board, detail, modals readable |
| TODO-17 | P0 | **PASS** | D | light | `Escape` dismisses delete modal |
| TODO-18 | P1 | **KNOWN-PWF** | D | light | No arrow-key list navigation — **T-12** per matrix |
| TODO-19 | P0 | **PASS** | D | light | Shared `EmptyState` component on filter-empty path; zero-task empty uses same primitive (code + TODO-20) |
| TODO-20 | P0 | **PASS** | D | light | Filter path shows filtered-empty guidance |
| TODO-21 | P1 | **PASS** | D | light | Initial load shows spinner/loading before tasks |
| TODO-22 | P1 | **BLOCKED** | D | light | No Drive-linked attachment seeded on QA tasks |
| TODO-23 | P1 | **PASS** | D | light | Calendar view shows `[QA]` tasks on due dates |
| TODO-24 | P0 | **PASS** | D | light | 6 overflow triggers `aria-label="Task actions"` |
| TODO-25 | P0 | **PASS** | D | light | View toggles `List view` / `Board view` / `Calendar view` labeled |
| TODO-26 | P0 | **PASS** | D | light | Delete modal cancel — no delete |
| TODO-27 | P0 | **PASS** | D | light | `DropdownMenu` Edit + Delete; delete requires confirm |
| TODO-28 | P1 | **KNOWN-PWF** | D | light | Board compact overflow hidden — **T-6** per matrix |
| TODO-29 | P0 | **PASS** | D | light | Projects panel toggle; `WorkspaceSplitLayout` shell |
| TODO-30 | P0 | **PASS** | D | light | Selected task shows `TaskDetail` in secondary column |

**Automation note:** Initial Playwright pass reported 6 FAIL rows on detail-panel icon selectors and calendar detection; manual re-adjudication against screenshots and targeted re-check corrected to **0 FAIL** (false negatives — icon-only footer actions, messaging overlay).

---

## Coverage checklist

| Area | Status |
|------|--------|
| Desktop light | **PASS** — primary flows |
| Desktop dark | **PASS** — TODO-16 |
| Mobile 375px | **PASS** — TODO-14, TODO-15 |
| ConfirmModal (list + detail + board trash) | **PASS** — TODO-09/10/13/17/26 |
| Accessibility aria | **PASS** — TODO-24/25 |
| Keyboard Escape | **PASS** — TODO-17 |
| Empty states | **PASS** — TODO-19/20 (shared `EmptyState`) |
| Business hub | **BLOCKED** — TODO-02 (no business on account) |

---

## Findings

| ID | Status | Notes |
|----|--------|-------|
| **T-11** | **Closable** | Part 2C matrix complete; **0 P0 FAIL** on exercisable rows |
| **T-9** | **Cleared** | TODO-24 PASS |
| **T-7** | **Cleared** | TODO-14/15 PASS at 375px (partial responsive width sufficient) |
| **T-12** | **Open** | TODO-18 KNOWN-PWF — not regression |
| **T-6** | **Open** | TODO-28 KNOWN-PWF — not regression |
| **T-10** | **Open** | P3; not matrix-gated |
| **QA-ENV-02** | **Open** | Backend running without root `.env` `JWT_SECRET`; session auth still works via Next.js |

**New regressions:** **None**

---

## Certification impact (evidence only — no award)

| Question | Answer |
|----------|--------|
| **T-11 close?** | **Yes** — matrix executed; P0 gate satisfied (0 FAIL) |
| **5G-Todo-L3-D eligible?** | **Yes** — pending human sign-off on evidence package |
| **Cat 4 → PASS?** | **Recommend YES** — TODO-24/25/17 PASS; TODO-18 KNOWN-PWF |
| **Cat 5 → PASS?** | **Recommend YES** — TODO-14/15 PASS |
| **UX-L3 CwF at D review?** | **Eligible** — core quartet cat 4 can upgrade; ≤2 PWF if cat 5 stays PASS |

**Projected post-QA scorecard:** **11 PASS / 0 PWF / 0 FAIL** (optimistic) or **10 PASS / 1 PWF / 0 FAIL** (if cat 5 retained PWF conservatively)

---

## Evidence

[`qa-evidence/5G-QA/todo/EVIDENCE_INVENTORY.md`](./qa-evidence/5G-QA/todo/EVIDENCE_INVENTORY.md)

**Last updated:** 2026-06-12
