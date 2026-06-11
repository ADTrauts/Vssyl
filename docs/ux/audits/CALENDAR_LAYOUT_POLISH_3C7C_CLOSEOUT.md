# Calendar Layout Polish — Wave 3C-7C Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (EmptyState, menus, shortcuts)  
**Plan:** [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../CALENDAR_LAYOUT_MODERNIZATION_PLAN.md)  
**Prior wave:** [`CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](./CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md)

---

## 1. Objective

Resolve polish findings **E-11**, **E-12**, **E-13** without altering 5E.1 interaction safety or 5E.2 `EventDrawer` workflows.

**In scope:** 3C-7C only  
**Out of scope:** 3C-7D re-certification, shell migration, `EventDrawer` logic changes

---

## 2. Deliverables

### Files created

| File | Purpose |
|------|---------|
| `web/src/components/calendar/CalendarEventsEmptyState.tsx` | Shared `EmptyState` wrapper per view variant |
| `web/src/components/calendar/CalendarShortcutsHelp.tsx` | `?` key + Help button + shortcuts modal |
| `web/src/components/calendar/useCalendarEventContextMenu.tsx` | Certified `ContextMenu` hook for event chips |

### Files modified

| File | Change |
|------|--------|
| `CalendarMonthView.tsx` | EmptyState above grid; `ContextMenu` on chips; responsive `min-h`; shortcuts help |
| `CalendarDayView.tsx` | EmptyState; `ContextMenu` on chips; shortcuts help |
| `CalendarWeekView.tsx` | EmptyState; `ContextMenu` on chips; shortcuts help |
| `CalendarYearView.tsx` | EmptyState; shortcuts help |
| `CalendarViewChrome.tsx` | Re-export `CalendarShortcutsHelp` |

---

## 3. E-11 — Shared EmptyState

| View | Trigger | Placement |
|------|---------|-----------|
| **Day** | No visible events for selected day | Above timeline grid (grid preserved) |
| **Week** | No visible events in week range | Above 7-column grid |
| **Month** | `filteredEvents.length === 0` | Above `MonthGrid` (cells remain blank) |
| **Year** | `events.length === 0` for year | Above month heatmap |

Uses `EmptyState` from `shared/components`. Filtered variant copy when filters hide events but raw list is non-empty.

---

## 4. E-12 — Event menu disposition

| Surface | Before | After |
|---------|--------|-------|
| Month event chips | Click → view modal only | **ContextMenu** (right-click): View details, Edit event |
| Day event chips | Double-click → `EventDrawer` | **ContextMenu**: Edit event |
| Week event chips | Double-click → `EventDrawer` | **ContextMenu**: Edit event |
| Month event modal | Inline Close + Edit footer buttons | **Unchanged** — not a menu pattern; preserves 5E.2 footer Edit |
| Delete / skip occurrence | `EventDrawer` only | **Unchanged** — no new delete affordances on chips |

No `DropdownMenu` ellipsis invented on chips. Delete/skip remain in `EventDrawer` with existing `ConfirmModal` / `RecurrenceScopeModal` gates.

---

## 5. E-13 — Keyboard shortcut discoverability

| Affordance | Implementation |
|------------|----------------|
| Help button | `CalendarShortcutsHelp` in toolbar on all four views |
| `?` key | Opens shortcuts modal (global on calendar routes; skips inputs) |
| Documented shortcuts | D/W/M/Y view nav + N new event (active on **Day** view) |

No new shortcut architecture — discoverability only.

---

## 6. Optional E-10 mobile density

Month grid cells: `min-h-[80px] md:min-h-[120px]` + `p-2 md:p-3` — low-risk density improvement on narrow screens.

---

## 7. Finding disposition

| ID | Status |
|----|--------|
| **E-11** | **Resolved** |
| **E-12** | **Resolved** (chips → `ContextMenu`; modal inline buttons documented exception) |
| **E-13** | **Resolved** |
| E-10 (mobile) | Partial — density tweak; manual QA still open |
| E-6–E-9, E-14–E-16 | Resolved in prior waves (5E / 3C-7A / 3C-7B) |

---

## 8. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Month/day/week/year render | Preserved |
| `EventDrawer` from edit actions | Preserved (context menu + modal footer) |
| EmptyState vs grid | Grid/cells intact; EmptyState above content area |
| Native confirm/prompt/alert | **0** reintroduced |

---

## 9. Projected certification impact (pre-3C-7D)

| Category | Pre-3C-7C | Post-3C-7C (projected) |
|----------|-----------|------------------------|
| 8 Empty States | PWF | **PASS** |
| 10 Discoverability | PASS | PASS |
| 4 Accessibility | PWF | PWF (E-14 QA pending) |
| PASS count (with 3C-7A/7B layout) | ~8 | **~9** — UX-L2 CwF eligible |

---

## 10. Readiness for 3C-7D

**Ready for documentation-only re-certification.** Implementation waves 3C-7A + 7B + 7C complete. Remaining blockers: E-14 manual QA (process), optional E-10 strict PASS with signed mobile QA.
