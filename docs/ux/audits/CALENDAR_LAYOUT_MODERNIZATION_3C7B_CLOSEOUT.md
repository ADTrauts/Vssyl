# Calendar Layout Modernization — Wave 3C-7B Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (consolidation + mobile + route migration)  
**Plan:** [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../CALENDAR_LAYOUT_MODERNIZATION_PLAN.md)  
**Prior wave:** [`CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](./CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md)

---

## 1. Objective

Complete shell consolidation for all personal calendar routes, modernize mobile sidebar behavior, resolve quick-access stubs, and remove dead business calendar widget code.

**In scope:** 3C-7B only  
**Out of scope:** 3C-7C (EmptyState, menus, shortcuts polish), 3C-7D (re-cert)

**Preserved:** All 5E.1 interaction safety, 5E.2 month workflow, `EventDrawer` / recurrence / delete behavior unchanged.

---

## 2. Deliverables

### Files created

| File | Purpose |
|------|---------|
| `web/src/components/calendar/calendarViewContext.ts` | Shared tenant/context filter hook for view components |
| `web/src/components/calendar/CalendarViewChrome.tsx` | `CalendarViewSwitcher`, `CalendarPageHeader`, re-export `PageToolbar` |
| `web/src/components/calendar/CalendarDayView.tsx` | Day view extracted from route; `CalendarPageShell` |
| `web/src/components/calendar/CalendarWeekView.tsx` | Week view extracted from route; `CalendarPageShell` |
| `web/src/components/calendar/CalendarYearView.tsx` | Year view extracted from route; `CalendarPageShell` |

### Files modified

| File | Change |
|------|--------|
| `web/src/components/calendar/CalendarPageShell.tsx` | Mobile sidebar sheet (`md:hidden` toggle, backdrop, Escape) |
| `web/src/components/calendar/CalendarListSidebar.tsx` | `onNavigate`; quick-access routes; Shared Calendars disabled |
| `web/src/app/calendar/day/page.tsx` | Thin wrapper → `CalendarDayView` |
| `web/src/app/calendar/week/page.tsx` | Thin wrapper → `CalendarWeekView` |
| `web/src/app/calendar/year/page.tsx` | Thin wrapper → `CalendarYearView` |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | Removed dead `BusinessCalendarWidget` |
| `web/src/components/modules/CalendarModule.tsx` | Documented widget exception |
| `web/src/components/calendar/enterprise/EnhancedCalendarModule.tsx` | Documented enterprise exception |

---

## 3. Routes migrated

| Route | Before | After |
|-------|--------|-------|
| `/calendar/day` | Inline `flex` + sidebar + ad hoc header | `CalendarProvider` → `CalendarDayView` → `CalendarPageShell` |
| `/calendar/week` | Inline `flex` + sidebar + ad hoc header | `CalendarProvider` → `CalendarWeekView` → `CalendarPageShell` |
| `/calendar/year` | Inline `flex` + sidebar + ad hoc header | `CalendarProvider` → `CalendarYearView` → `CalendarPageShell` |
| `/calendar/month` | Unchanged (3C-7A reference) | `CalendarProvider` → `CalendarMonthView` |

---

## 4. Mobile sidebar (E-10)

| Behavior | Implementation |
|----------|----------------|
| Sidebar hidden `<md` | `WorkspaceSidebar` uses `hidden md:flex` when sheet closed |
| Open control | Mobile bar with Menu button (`md:hidden`) |
| Sheet overlay | Fixed sidebar + `bg-black/40` backdrop |
| Close triggers | Backdrop click, X button, Escape, sidebar navigate, create event |
| Desktop | Unchanged — sidebar always visible `md:flex` |

Pattern mirrors Notebook/Drive mobile sidebar approach.

---

## 5. Quick-access fixes (E-16)

| Sidebar item | Before | After |
|--------------|--------|-------|
| Today's Events | Stub → `/calendar/month?y&m` | `/calendar/day` |
| Upcoming | Stub → `/calendar/month` | `/calendar/week` (label: This Week) |
| Shared Calendars | Stub → `/calendar/month` | **Disabled** with tooltip |

`onNavigate` prop closes mobile sheet after navigation.

---

## 6. Shell consolidation decisions

| Shell | Category | Action (3C-7B) |
|-------|----------|----------------|
| `CalendarPageShell` + view components | **Canonical** | All four personal routes + business hub (7A) |
| `CalendarModule` | **Exception** | Widget-only preview; JSDoc added; no merge |
| `EnhancedCalendarModule` | **Exception** | Enterprise panels retained; JSDoc added |
| `BusinessCalendarWidget` | **Orphan** | **Removed** — was not wired to `case 'calendar'` |
| `CalendarModuleWrapper` | **Bridge** | Unchanged — feature gate for business embed paths |

---

## 7. Finding disposition

| ID | Status | Notes |
|----|--------|-------|
| **E-8** | **Resolved** | All personal routes + business hub on shared shell |
| **E-10** | **Resolved** (implementation) | Collapsible mobile sidebar; manual QA still gate for L3 |
| **E-16** | **Resolved** | Quick-access stubs removed or disabled |
| E-6, E-7 | Resolved (7A) | Unchanged |
| E-11–E-15 | Open | 3C-7C |

---

## 8. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Month route behavior | Preserved (3C-7A + 5E.2) |
| Day/week/year routes | Migrated to shell; view logic preserved |
| Business workspace `case 'calendar'` | `CalendarWorkspaceLanding` unchanged |
| Mobile sidebar | Collapses below `md` |
| Desktop sidebar | Always visible |

---

## 9. Remaining 3C-7C work

| Item | Finding | Notes |
|------|---------|-------|
| Shared `EmptyState` on zero-event views | E-11 | Month/day/week/year |
| Certified menus on event chips | E-12 | `ContextMenu` / `DropdownMenu` |
| Shortcut discoverability | E-13 | Help popover or toolbar hints |
| Month grid mobile density | E-10 edge | Optional agenda fallback |
| Filter toolbar parity | — | Month-only filters on day/week/year (optional) |

---

## 10. Readiness for 3C-7C

**Ready.** Shell consolidation complete; interaction paths stable. 3C-7C can focus on polish without shell refactors.

**Recommended before 3C-7D re-cert:** Complete 3C-7C (especially E-11 EmptyState) to reach 9 PASS / UX-L2 eligibility per plan projection.
