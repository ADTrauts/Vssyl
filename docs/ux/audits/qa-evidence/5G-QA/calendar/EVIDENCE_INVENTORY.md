# Calendar QA Evidence Inventory — Wave 5G-QA-EXEC

**Date:** 2026-06-03  
**Program:** UX Modernization Wave 5G-QA-EXEC  
**Matrix:** Part 2D — CAL-01 through CAL-24  
**Commit:** `2a83d1f9`  
**`pnpm type-check`:** PASS (after `pnpm build:shared`)

---

## Execution summary

| Metric | Value |
|--------|-------|
| Cases in scope | **24** |
| Live browser execution | **0** — environment blocked |
| Result | **24 × BLOCKED** |

**Primary blocker:** Next.js dev compile failure on `/calendar/month` — `Module not found: Can't resolve './menuShared.js'` from `shared/src/components/ContextMenu.tsx`. See [ENVIRONMENT_BLOCKER.md](./ENVIRONMENT_BLOCKER.md).

---

## Case inventory

| Case ID | Result | Viewport | Theme | Notes | Evidence |
|---------|--------|----------|-------|-------|----------|
| CAL-01 | **BLOCKED** | D | — | Calendar route does not compile | [ENVIRONMENT_BLOCKER.md](./ENVIRONMENT_BLOCKER.md) |
| CAL-02 | **BLOCKED** | D | — | Toolbar view switch untestable | Same |
| CAL-03 | **BLOCKED** | D | — | Business hub untestable | Same |
| CAL-04 | **BLOCKED** | D | — | New Event flow untestable | Same |
| CAL-05 | **BLOCKED** | D | — | Day drag-create untestable | Same |
| CAL-06 | **BLOCKED** | D | — | EventDrawer save untestable | Same |
| CAL-07 | **BLOCKED** | D | — | Context menu edit untestable | Same |
| CAL-08 | **BLOCKED** | D | — | Delete ConfirmModal untestable (priority) | Same |
| CAL-09 | **BLOCKED** | D | — | Bulk delete N/A — cannot confirm in UI session | Same |
| CAL-10 | **BLOCKED** | D | — | Drag-create untestable | Same |
| CAL-11 | **BLOCKED** | M (375px) | — | Mobile sidebar untestable (priority) | Same |
| CAL-12 | **BLOCKED** | M (375px) | — | Week grid scroll untestable (priority) | Same |
| CAL-13 | **BLOCKED** | B | L+D | Dark mode untestable | Same |
| CAL-14 | **BLOCKED** | D | — | Shortcuts `?` untestable | Same |
| CAL-15 | **BLOCKED** | D | — | `N` shortcut untestable | Same |
| CAL-16 | **BLOCKED** | D | — | Escape modal untestable | Same |
| CAL-17 | **BLOCKED** | D | — | Empty state untestable | Same |
| CAL-18 | **BLOCKED** | D | — | Filtered empty untestable | Same |
| CAL-19 | **BLOCKED** | D | — | Todo integration untestable | Same |
| CAL-20 | **BLOCKED** | D | — | Toolbar aria-label live inspect untestable (priority) | Same |
| CAL-21 | **BLOCKED** | M/D | — | Sidebar toggle label untestable (priority) | Same |
| CAL-22 | **BLOCKED** | D | — | Delete confirm cancel untestable (priority) | Same |
| CAL-23 | **BLOCKED** | D | — | Event chip context menu untestable | Same |
| CAL-24 | **BLOCKED** | D | — | Page shell inspect untestable | Same |

**Tester:** Agent QA session (Cursor browser MCP)  
**Sign-off:** **Not eligible** — zero live PASS rows

---

## Supplementary static review (non-sign-off)

The following were reviewed in source only during this session. **Not counted as matrix PASS** per [PLATFORM_MANUAL_QA_RUNBOOK.md](../../../PLATFORM_MANUAL_QA_RUNBOOK.md) §5.

| Case | Static observation | Live PASS? |
|------|-------------------|------------|
| CAL-08 | `EventDrawer.tsx` wires `ConfirmModal` before delete | No |
| CAL-20 | `aria-label` on toolbar/nav in `CalendarPageShell`, month/week views, shortcuts help | No |
| CAL-21 | `aria-label="Open calendars"` / Close panel labels in `CalendarPageShell.tsx` | No |
| CAL-24 | `CalendarPageShell` uses `WorkspaceSplitLayout` + header + toolbar | No |

---

## Screenshots

No calendar UI screenshots captured — compile error prevented page render.

**Log evidence:** Dev server output documenting `menuShared.js` resolution failure (session 2026-06-03, ports 3000/3001).

---

*Inventory for Wave 5G-QA-EXEC — evidence wave only; no certification promotion.*
