# Calendar Layout Modernization — Wave 3C-7A Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (shell + hub only)  
**Plan:** [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../CALENDAR_LAYOUT_MODERNIZATION_PLAN.md)  
**Prior certification:** [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./CALENDAR_UX_RECERTIFICATION_2026_5E3.md) — UX-L1 CwF

---

## 1. Objective

Resolve layout/hub findings **E-6**, **E-7**, and partial **E-8** by adopting certified layout primitives on the primary month calendar experience and business workspace hub.

**In scope:** 3C-7A only  
**Out of scope:** 3C-7B (widget/enterprise/mobile), 3C-7C (polish), 3C-7D (re-cert), day/week/year route migration

**Preserved:** All 5E.1 interaction safety and 5E.2 month workflow behavior (`EventDrawer`, `ConfirmModal`, `RecurrenceScopeModal`, create/edit/save/cancel/delete).

---

## 2. Deliverables

### Files created

| File | Purpose |
|------|---------|
| `web/src/components/calendar/CalendarPageShell.tsx` | `WorkspaceSplitLayout` + sidebar/main shell |
| `web/src/components/calendar/CalendarWorkspaceLanding.tsx` | Business hub entry (Todo parity) |
| `web/src/components/calendar/CalendarMonthView.tsx` | Month view logic extracted from route page |

### Files modified

| File | Change |
|------|--------|
| `web/src/app/calendar/month/page.tsx` | Thin wrapper → `CalendarProvider` + `CalendarMonthView` |
| `web/src/components/calendar/CalendarListSidebar.tsx` | `embedded` + `onCreateEvent` props |
| `web/src/components/business/BusinessWorkspaceContent.tsx` | `case 'calendar'` → `CalendarWorkspaceLanding` |

---

## 3. Shell architecture (3C-7A)

```
CalendarMonthView
├── CalendarPageShell
│   ├── PageHeader (title, description, New Event, Export)
│   ├── PageToolbar (view switcher, date nav, search, filters)
│   └── WorkspaceSplitLayout
│       ├── WorkspaceSidebar (280px)
│       │   └── CalendarListSidebar (embedded)
│       └── WorkspaceMain
│           └── MonthGrid + loading/error
├── Event view modal (portal)
├── EventDrawer (overlay)
└── RecurrenceScopeModal
```

### Personal route

`/calendar/month` → `CalendarProvider` → `CalendarMonthView`

### Business hub

`BusinessWorkspaceContent` `case 'calendar'` → `CalendarProvider` → `CalendarWorkspaceLanding` → `CalendarMonthView` (locked `BUSINESS` context)

---

## 4. Finding disposition

| ID | Status | Notes |
|----|--------|-------|
| **E-6** | **Resolved** (month + business hub) | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` on primary month path |
| **E-7** | **Resolved** | `CalendarWorkspaceLanding.tsx` + `BusinessWorkspaceContent` switch |
| **E-8** | **Partial** | Personal month + business hub unified; day/week/year/widget/enterprise shells unchanged (3C-7B) |
| E-10–E-16 | Open | 3C-7B / 3C-7C |

---

## 5. Sidebar improvements

- **`embedded` prop** — `CalendarListSidebar` fills `WorkspaceSidebar` without duplicate `w-[280px]` / border
- **`onCreateEvent` prop** — sidebar New Event opens `EventDrawer` in-place (no `window.location.href` on month/business paths)

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Month route uses `PageHeader` / `PageToolbar` / `WorkspaceSplitLayout` | Code-verified |
| Business hub uses `CalendarWorkspaceLanding` | Code-verified |
| 5E.1/5E.2 flows preserved | No changes to `EventDrawer` gates or create/edit handlers |
| Day/week/year routes | **Unchanged** (still legacy shell) |

---

## 7. Projected certification impact (pending 3C-7D)

| Category | 5E.3 | Projected post-3C-7A |
|----------|------|----------------------|
| 2 Layout Consistency | PWF | **PASS** (primary month + business hub) |
| 3 Navigation | PWF | **PASS** (`CalendarWorkspaceLanding`) |
| 8 Fragmentation (E-8) | Partial | Improved — widget/enterprise remain |

**PASS count projection:** 6 → **8** (one short of UX-L2 ≥9 until 3C-7C EmptyState or additional PWF→PASS).

---

## 8. Recommended next wave — 3C-7B

1. Collapsible mobile sidebar (E-10)
2. `CalendarModule` / `EnhancedCalendarModule` shell consolidation (E-8 completion)
3. Quick-access stub fixes (E-16)
4. Migrate day/week/year routes to `CalendarPageShell`

**Not started in 3C-7A.**

---

## Related

- [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../CALENDAR_LAYOUT_MODERNIZATION_PLAN.md)
- [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./CALENDAR_UX_RECERTIFICATION_2026_5E3.md)
- [`TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md`](./TODO_LAYOUT_WORKFLOW_BATCH5D3_CLOSEOUT.md)

**Last updated:** 2026-06-03 (Wave 3C-7A complete)
