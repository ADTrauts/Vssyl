# Calendar Layout Modernization Plan (Wave 3C-7)

**Status:** **3C-7 program complete** (7A–7D)  
**Date:** 2026-06-03  
**Mode:** Plan + implementation + re-certification complete  
**Closeout:** [`audits/CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md), [`audits/CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md), [`audits/CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md`](./audits/CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md), [`audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./audits/CALENDAR_UX_RECERTIFICATION_2026_3C7D.md)  
**Prerequisite:** Wave 5E.3 — **UX-L1 Certified with Findings** (6 PASS / 5 PWF / 0 FAIL)  
**Framework:** [`LAYOUT_PATTERNS.md`](./LAYOUT_PATTERNS.md), [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](./LAYOUT_SHELL_STANDARDIZATION_REVIEW.md), [`UX_CERTIFICATION_SCORECARD.md`](./UX_CERTIFICATION_SCORECARD.md)  
**Benchmark:** Drive 3C-2, Chat 3C-3, Todo 5D.3, Notifications 3C-6

---

## 1. Executive summary

Calendar has **five parallel UI shells** and **four divergent route headers** with zero adoption of certified layout primitives (`WorkspaceSplitLayout`, `PageHeader`, `PageToolbar`). Interaction and workflow debt is resolved (5E.1–5E.3); **layout fragmentation (E-6, E-7, E-8)** is the primary blocker to **UX-L2**.

**Recommended approach:** Phased extract-and-rollout mirroring Todo 5D.3 and Notifications 3C-6:

1. **3C-7A** — Shared `CalendarPageShell` + header/toolbar primitives; migrate personal routes + business hub landing.
2. **3C-7B** — Widget/enterprise shell consolidation; responsive sidebar; quick-access fixes.
3. **3C-7C** — Polish wave (EmptyState, menus, shortcuts) + optional QA — targets remaining P3 findings and L2 strict PASS edges.
4. **3C-7D** — Documentation-only re-certification after 3C-7A (+7B if needed).

**Projected certification after 3C-7A:** **8 PASS** (cats 2, 3 upgrade) — **one short of L2**.  
**Projected after 3C-7A + 3C-7C (EmptyState):** **9 PASS** — **UX-L2 Certified with Findings** eligible.

---

## 2. Files reviewed

### Personal routes

| Path | Role |
|------|------|
| `web/src/app/calendar/layout.tsx` | `DashboardLayout` wrapper only |
| `web/src/app/calendar/page.tsx` | Redirect → `/calendar/month` |
| `web/src/app/calendar/month/page.tsx` | Richest shell (~1330 LOC); `h-screen`; filters; `MonthGrid`; `EventDrawer` |
| `web/src/app/calendar/day/page.tsx` | Day grid; keyboard shortcuts; availability toggle |
| `web/src/app/calendar/week/page.tsx` | Week grid; search; `DayColumn` inline |
| `web/src/app/calendar/year/page.tsx` | Year heatmap; minimal chrome |

### Shared components

| Path | Role |
|------|------|
| `web/src/components/calendar/CalendarListSidebar.tsx` | Fixed `w-[280px]` sidebar; overlay mode; quick-access stubs |
| `web/src/components/calendar/EventDrawer.tsx` | Create/edit drawer (5E.1/5E.2 — preserve) |
| `web/src/components/calendar/CalendarModuleWrapper.tsx` | Standard vs enterprise feature gate |
| `web/src/components/calendar/CalendarCreateCalendarModal.tsx` | Calendar create (preserve) |
| `web/src/components/calendar/RecurrenceScopeModal.tsx` | Recurring scope (preserve) |

### Widget / enterprise / business entry

| Path | Role |
|------|------|
| `web/src/components/modules/CalendarModule.tsx` | Business/personal widget; gradient header; embedded month/week/day grids |
| `web/src/components/calendar/enterprise/EnhancedCalendarModule.tsx` | Enterprise shell + resource/approval/analytics panels |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | `case 'calendar'` — raw `flex` + sidebar + wrapper (no landing) |
| `web/src/components/BrandedWorkDashboard.tsx` | Module tile entry (core module group) |

### Reference primitives

| Path | Role |
|------|------|
| `web/src/components/layouts/WorkspaceSplitLayout.tsx` | Sidebar \| main \| optional secondary |
| `web/src/components/layouts/PageHeader.tsx` | Title + description + actions |
| `web/src/components/layouts/PageToolbar.tsx` | Leading/trailing/secondary toolbar slots |
| `web/src/components/todo/TodoWorkspaceLanding.tsx` | Hub landing pattern (E-7 reference) |
| `web/src/components/todo/TodoModule.tsx` | Full `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` reference |

### Certification context

| Path | Role |
|------|------|
| `docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_5E3.md` | Current authoritative scores |
| `docs/ux/LAYOUT_SHELL_STANDARDIZATION_REVIEW.md` | 3C-7 scope definition |

---

## 3. Current shell inventory

| # | Shell | Location | Category | Layout pattern |
|---|-------|----------|----------|----------------|
| 1 | **Personal route shell** | `month/day/week/year/page.tsx` | **Canonical target** | `flex` + `CalendarListSidebar` + main column |
| 2 | **Month route variant** | `month/page.tsx` | Canonical (richest) | `flex h-screen overflow-hidden` + ultra-compact header + filter bar |
| 3 | **Day/week/year variant** | `day/week/year/page.tsx` | Duplicate of #1 | `flex h-full` + simpler inline header (no `PageHeader`) |
| 4 | **Business workspace shell** | `BusinessWorkspaceContent` `case 'calendar'` | Duplicate | `flex h-full` + locked sidebar + `CalendarModuleWrapper` |
| 5 | **Widget shell** | `CalendarModule.tsx` | Widget | Gradient hero header + search/nav bar + embedded grids; no sidebar |
| 6 | **Enterprise shell** | `EnhancedCalendarModule.tsx` | Enterprise-specific | Duplicates widget header + enterprise tab panels |
| 7 | **Dead/stub shell** | `BusinessCalendarWidget` in `BusinessWorkspaceContent.tsx` | **Orphan** | Mock data widget — **not wired** to `case 'calendar'` |

### Fragmentation summary (E-8)

| Divergence | Impact |
|------------|--------|
| 4 route-specific header implementations | Title, nav, view switcher, actions duplicated |
| Month-only filter toolbar | Calendar/attendee/status filters absent on day/week/year |
| `CalendarModule` internal grids | Third copy of month/week/day grid logic |
| `EnhancedCalendarModule` | Fourth copy + enterprise panels |
| Sidebar only on routes + business flex | Widget has no `CalendarListSidebar` |
| `h-screen` (month) vs `h-full` (others) | Height contract inconsistent with `PlatformShell` |

---

## 4. WorkspaceSplitLayout readiness

### Can routes migrate directly?

**Yes, with extraction first** — structural fit is strong:

```
WorkspaceSplitLayout
├── WorkspaceSidebar → CalendarListSidebar (calendar list / visibility)
└── WorkspaceMain → PageHeader + PageToolbar + view content (month/day/week/year grid)
```

**Drive/Chat precedent:** Sidebar is module-specific content inside `WorkspaceSidebar`; shell provides flex geometry only.

### Route-specific layouts

| Route | Main content | Secondary panel? | Special chrome |
|-------|--------------|------------------|----------------|
| `/calendar/month` | `MonthGrid` + event view modal portal | No | Full filter row; ICS export; richest header |
| `/calendar/day` | Hourly `DayGrid` | No | Availability overlay; keyboard shortcuts |
| `/calendar/week` | 7× `DayColumn` | No | Inline search; no month-level filters |
| `/calendar/year` | 12-month count grid | No | Minimal toolbar |

**No route needs `WorkspaceSecondary`** today (unlike Todo task detail). `EventDrawer` is overlay — not a split column.

### Migration blockers

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| **Large monolithic page files** | High | Extract view bodies to `components/calendar/views/*` before shell swap |
| **Four duplicate headers** | High | Extract `CalendarPageHeader` + `CalendarPageToolbar` from month (richest) |
| **Month `h-screen`** | Medium | Replace with `h-full min-h-0` inside `WorkspaceMain` (PlatformShell child) |
| **`CalendarProvider` per page** | Low | Hoist to `app/calendar/layout.tsx` or shared shell |
| **Year `contextFilter` format** | Low | Uses `TYPE:id` string vs dashboard ID elsewhere — fix during refactor |
| **Inline grid components** | Medium | `MonthGrid` in month page (~300 LOC); `DayColumn` in week page — extract for testability |
| **5E.1/5E.2 flows** | **Do not break** | `EventDrawer`, modals, confirm gates stay outside layout refactor |

### Readiness verdict

| Route | Direct migration | Notes |
|-------|------------------|-------|
| Month | ✅ After extraction | Reference implementation for shared chrome |
| Day | ✅ After shared chrome | Add optional toolbar slots for availability / my-events |
| Week | ✅ After shared chrome | Search moves to `PageToolbar.leading` |
| Year | ✅ After shared chrome | Simplest — minimal toolbar |

---

## 5. PageHeader / PageToolbar readiness

### Current header ownership map

| Element | Month | Day | Week | Year | CalendarModule | Business hub |
|---------|-------|-----|------|------|----------------|--------------|
| **Title** | `Calendar — Month` | `Calendar — Day` | `Calendar — Week` | `Calendar — Year` | Gradient `Calendar` h2 | — |
| **View switcher** | Pill links (D/W/M/Y) | 4-link grid | 4-link grid | 4-link grid | Button group (M/W/D) | — |
| **Date navigation** | Prev/Today/Next + label | Prev/Today/Next + label | Prev/Today/Next + week label | Prev/This Year/Next | Chevron + gradient label | — |
| **Create event** | Header + sidebar | Header button | Toolbar button | — | Gradient New Event | Sidebar → `/calendar/month` |
| **Export ICS** | Month only | — | — | — | — | — |
| **Filters** | Search + calendar/attendee/status | My events + availability | Search + my events | — | Search only | — |
| **Context label** | — | — | Dashboard name | Dashboard name | — | Locked business context |

### Recommended primitive mapping

#### `PageHeader`

| Slot | Content |
|------|---------|
| `title` | `Calendar` (static) or `Calendar — {view}` during transition |
| `description` | `{viewDate label}` · `{event count}` · `{dashboard display name}` |
| `icon` | `Calendar` (lucide) — match Todo/Drive |
| `actions` | `New Event` (primary `Button`) · `Export` (month only, `DropdownMenu` or icon button) |

#### `PageToolbar`

| Slot | Content |
|------|---------|
| `leading` | View switcher (segmented control or tab links) · date prev/today/next |
| `trailing` | Search input · filter `Popover` (month filters) · `My events` toggle · day-only `Availability` toggle |
| `secondary` | Month-only: calendar/attendee/status `<select>` row → migrate to `Popover` filters (Todo 5D.3 pattern) |

### Extraction source of truth

**Primary extract:** `month/page.tsx` lines ~325–570 (ultra-compact header + filter bar).  
**Normalize:** day/week/year simpler headers into same component via `view: 'month' | 'day' | 'week' | 'year'` prop.

### Create-event action consolidation

| Current path | Post-3C-7 behavior |
|--------------|-------------------|
| Month header New Event | `PageHeader.actions` → `openCreateDrawer` |
| Sidebar New Event | Same handler via shared context/callback — **stop** `window.location.href` hard navigation |
| CalendarModule New Event | Open `EventDrawer` in-place OR `router.push` with query `?create=1` |
| Business sidebar | Pass `onCreateEvent` from landing shell |

---

## 6. CalendarWorkspaceLanding recommendation

### Current entry points

| Context | Entry | Problem |
|---------|-------|---------|
| **Personal** | `/calendar` → `/calendar/month` | Works; no landing component |
| **Business** | `BusinessWorkspaceContent` `case 'calendar'` | Inline flex + `CalendarModuleWrapper` — **no** `CalendarWorkspaceLanding` (E-7) |
| **Dashboard widget** | `CalendarModule` via widget grid | Separate shell; navigates away for create |
| **BrandedWorkDashboard** | Module tile → business workspace module route | Standard hub path |

### Recommended architecture (Todo parity)

```
Personal:
  /calendar/* → app/calendar/layout.tsx
    └── CalendarProvider
        └── CalendarPageShell (WorkspaceSplitLayout + PageHeader + PageToolbar)
            └── {Month|Day|Week|Year}View

Business:
  BusinessWorkspaceContent case 'calendar'
    └── CalendarProvider
        └── CalendarWorkspaceLanding (thin)
            └── CalendarPageShell (same shell, locked context)
                └── CalendarModule OR default MonthView embed
```

#### `CalendarWorkspaceLanding.tsx` (new)

```tsx
interface CalendarWorkspaceLandingProps {
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
}

export function CalendarWorkspaceLanding({ dashboardId, businessId, householdId }) {
  return (
    <CalendarPageShell
      dashboardId={dashboardId}
      businessId={businessId}
      householdId={householdId}
      contextLocked={Boolean(businessId || householdId)}
      defaultView="month"
    />
  );
}
```

### Design decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Business embed routes vs widget? | **Embed `CalendarPageShell` with month default** | Parity with personal routes; eliminates widget-only shell over time |
| Keep `CalendarModule`? | **Phase out as primary hub UI in 3C-7B** | Retain for dashboard widget grid only (certified exception) |
| Enterprise path | **Keep `EnhancedCalendarModule` as exception** | Feature-gated panels; share `PageHeader`/`PageToolbar` only |
| `BrandedWorkDashboard` | **No change** | Tile → workspace route unchanged |
| Double sidebar in business? | **Remove duplicate** — shell owns one `CalendarListSidebar` | Today: business wraps sidebar outside wrapper AND widget has no sidebar |

### Dashboard embedding implications

- Widget grid may still mount slim `CalendarModule` preview — document as **L2 certified exception** (same as Chat `MobileChat` / widget patterns).
- Business full-module view should use **same** `CalendarPageShell` as `/calendar/month` to resolve E-8.

---

## 7. Shell fragmentation — consolidation plan

| Shell | Action | Wave |
|-------|--------|------|
| Personal route shell | **Canonical** — migrate to `CalendarPageShell` | 3C-7A |
| Business flex shell | **Replace** with `CalendarWorkspaceLanding` | 3C-7A |
| `CalendarModule` widget | **Shrink** to widget-only preview OR thin wrapper over shared views | 3C-7B |
| `EnhancedCalendarModule` | **Partial share** — adopt `PageHeader`/`PageToolbar`; keep enterprise panels | 3C-7B |
| `BusinessCalendarWidget` | **Delete or archive** — dead code | 3C-7B |
| `CalendarListSidebar` | **Keep** — move inside `WorkspaceSidebar`; add responsive collapse | 3C-7B |

### Consolidation target (end state)

```
CalendarPageShell (shared)
├── WorkspaceSplitLayout
│   ├── WorkspaceSidebar → CalendarListSidebar
│   └── WorkspaceMain
│       ├── PageHeader
│       ├── PageToolbar
│       └── CalendarViewRouter (month|day|week|year)
├── EventDrawer (global)
└── RecurrenceScopeModal / ConfirmModal (unchanged)

Exceptions (documented):
├── Dashboard widget: CalendarWidgetPreview (subset)
└── Enterprise: EnhancedCalendarModule extends shell + enterprise panels
```

---

## 8. Mobile layout audit (E-10)

| Issue | Evidence | Severity |
|-------|----------|----------|
| **Fixed 280px sidebar** | `CalendarListSidebar` `w-[280px] shrink-0` | P3 — at 375px, main column ~95px |
| **No sidebar collapse** | No drawer/hamburger on calendar routes | Blocks mobile usability |
| **Month `h-screen`** | Bypasses parent `PlatformShell` height chain | Scroll/trap risk |
| **Month grid density** | `min-h-[120px]` cells, 6-week grid | Unreadable on narrow main |
| **Day/week horizontal grids** | Week 7-column grid on ~95px main | Unusable without sidebar hide |
| **Touch targets** | Month event chips small (`text-xs`) | P3 a11y/mobile |
| **No mobile-specific view** | Unlike Chat `MobileChat` | Optional exception path |

### Recommended mobile mitigations (3C-7B)

1. **Collapsible sidebar** — `WorkspaceSidebar` with `hidden md:flex` + hamburger `Popover` or sheet for `<md`.
2. **Default to day view on mobile** — optional `useMediaQuery` redirect or toolbar prompt.
3. **Replace `h-screen`** with `h-full min-h-0` throughout.
4. **Month grid** — reduce `min-h` on small screens; consider agenda list fallback (future).

**E-14 manual QA** remains process gate for L3; mobile fixes alone may keep cat 5 at PWF without signed QA.

---

## 9. UX certification impact

### Finding → category mapping

| ID | Finding | Current cat | Post-3C-7A | Post-3C-7A+7C |
|----|---------|-------------|--------------|----------------|
| **E-6** | No layout primitives | 2 PWF | **2 PASS** | 2 PASS |
| **E-7** | No `CalendarWorkspaceLanding` | 3 PWF | **3 PASS** | 3 PASS |
| **E-8** | Fragmented shells | 2 PWF (with E-6) | **2 PASS** (partial; widget exception) | 2 PASS |
| **E-10** | Fixed sidebar mobile | 5 PWF | 5 PWF | 5 PWF (or PWF→PASS if collapse + QA) |
| **E-11** | No shared `EmptyState` | 8 PWF | 8 PWF | **8 PASS** |
| **E-12** | No certified menus on events | — | — | 10 PWF unchanged |
| **E-13** | Shortcut discoverability | 4 PWF | 4 PWF | 4 PWF (or PASS if help popover) |
| **E-14** | Manual QA | Process | Process | Process |
| **E-16** | Quick-access stub | — | — | Resolved in 7B |

### Projected scorecard

| Metric | 5E.3 (now) | 3C-7A | 3C-7A + 7B | 3C-7A + 7B + 7C |
|--------|------------|-------|------------|-----------------|
| PASS | 6 | **8** | 8 | **9** |
| PWF | 5 | 3 | 3 | 2 |
| FAIL | 0 | 0 | 0 | 0 |

**Categories upgraded (3C-7A):** 2 (Layout), 3 (Navigation).  
**Categories upgraded (3C-7C):** 8 (Empty States) — optional 10/4 if shortcuts/help added.

### UX-L2 likelihood

| Milestone | PASS count | L2 verdict |
|-----------|------------|------------|
| 5E.3 (now) | 6 | **Not certified** (need 9) |
| 3C-7A only | 8 | **Not certified** (one short) |
| 3C-7A + 7C (EmptyState) | 9 | **UX-L2 Certified with Findings** eligible |
| + E-14 QA + mobile PASS | 9–10 | **UX-L2 Certified** possible |

**Conservative projection:** Implement **3C-7A + 7C** before 3C-7D re-cert to maximize L2 award probability.

---

## 10. Implementation waves

### Wave 3C-7A — Shell primitives + routes + hub (P1)

**Goal:** Resolve E-6, E-7; partial E-8.

| Step | Task | Files (est.) |
|------|------|--------------|
| A1 | Create `CalendarPageShell.tsx` with `WorkspaceSplitLayout` | `web/src/components/calendar/CalendarPageShell.tsx` |
| A2 | Create `CalendarPageHeader.tsx` + `CalendarPageToolbar.tsx` | `web/src/components/calendar/` |
| A3 | Extract `MonthView`, `DayView`, `WeekView`, `YearView` from route pages | `web/src/components/calendar/views/` |
| A4 | Migrate `month/day/week/year/page.tsx` to thin wrappers | `web/src/app/calendar/*/page.tsx` |
| A5 | Hoist `CalendarProvider` to `app/calendar/layout.tsx` | `layout.tsx` |
| A6 | Create `CalendarWorkspaceLanding.tsx` | `web/src/components/calendar/` |
| A7 | Update `BusinessWorkspaceContent` `case 'calendar'` | `BusinessWorkspaceContent.tsx` |
| A8 | Wire sidebar `New Event` to drawer callback (no `window.location`) | `CalendarListSidebar.tsx`, shell |
| A9 | `pnpm type-check` + preserve 5E.1/5E.2 flows | — |

**Out of scope 3C-7A:** `CalendarModule` rewrite, enterprise panels, EmptyState, mobile collapse.

---

### Wave 3C-7B — Widget consolidation + mobile sidebar (P2)

**Goal:** Complete E-8; address E-10, E-16.

| Step | Task |
|------|------|
| B1 | Refactor `CalendarModule` to use shared views OR documented widget-only preview |
| B2 | Adopt shared header in `EnhancedCalendarModule` (keep enterprise tabs) |
| B3 | Remove/archive `BusinessCalendarWidget` dead code |
| B4 | Collapsible sidebar (`md:` breakpoint + mobile drawer) |
| B5 | Fix quick-access stubs — real filters or remove (E-16) |
| B6 | Normalize `h-full min-h-0`; remove `h-screen` |

---

### Wave 3C-7C — Polish + menus (P3, L2 edge)

**Goal:** E-11, E-12, E-13; push toward 9 PASS.

| Step | Task |
|------|------|
| C1 | Shared `EmptyState` on empty month/week grids (E-11) |
| C2 | `ContextMenu` on event chips — edit/delete/open (E-12) |
| C3 | Keyboard shortcut help `Popover` in toolbar (E-13) |
| C4 | Optional: month filter `Popover` (replace raw `<select>` row) |

---

### Wave 3C-7D — Re-certification (docs only)

**Goal:** Authoritative UX-L2 reassessment after 3C-7A (+7C).

| Deliverable | Path |
|-------------|------|
| Re-cert doc | `docs/ux/audits/CALENDAR_UX_RECERTIFICATION_2026_3C7.md` |
| Scorecard update | `CALENDAR_UX_SCORECARD.md` |
| Certification update | `CALENDAR_UX_CERTIFICATION.md` |

---

## 11. Risk register

| Risk | Mitigation |
|------|------------|
| Regression on 5E.1/5E.2 flows | Layout-only first; do not touch `EventDrawer` delete/skip gates |
| Large diff from month page extraction | Phase A3 before A4; one view per PR if needed |
| Business context scoping break | Preserve `contextType`/`contextId` props through landing |
| Enterprise feature gate | Keep `CalendarModuleWrapper` switch; only share chrome |
| Widget grid regression | Certified exception; minimal preview surface |

---

## 12. Success criteria

| Criterion | Verification |
|-----------|--------------|
| All `/calendar/*` routes use `WorkspaceSplitLayout` | Grep + visual |
| `PageHeader` + `PageToolbar` on all primary routes | Component audit |
| `CalendarWorkspaceLanding` wired in business hub | `BusinessWorkspaceContent` |
| 5E.1/5E.2 flows intact | Existing tests + manual create/edit/delete |
| `pnpm type-check` PASS | CI |
| Cats 2, 3 → PASS on 3C-7D | Documentation re-cert |

---

## Related

- [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./audits/CALENDAR_UX_RECERTIFICATION_2026_5E3.md)
- [`LAYOUT_SHELL_STANDARDIZATION_REVIEW.md`](./LAYOUT_SHELL_STANDARDIZATION_REVIEW.md)
- [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./audits/TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md)
- [`NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md`](./audits/NOTIFICATIONS_LAYOUT_CONSOLIDATION_CLOSEOUT.md)
- [`UX_MODERNIZATION_ROADMAP.md`](./UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 3C-7 plan — audit only)
