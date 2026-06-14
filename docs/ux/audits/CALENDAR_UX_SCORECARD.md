# Calendar Module UX Scorecard (Wave 5E.3)

**Status:** **5G-Calendar-D authoritative** (post E-14 QA + L3 certification review)  
**Date:** 2026-06-03  
**Module:** Calendar (`/calendar`, business workspace)  
**Benchmark:** Drive / File Hub — Reference UX Module #1  
**Framework:** [`UX_CERTIFICATION_SCORECARD.md`](../UX_CERTIFICATION_SCORECARD.md) (Wave 5A)  
**Re-certification:** [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md)  
**Prior:** [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./CALENDAR_UX_RECERTIFICATION_2026_3C7D.md)  
**Evidence:** 3C-7 engineering closeouts + E-14 QA [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./CALENDAR_QA_EXEC_R3_REPORT_2026.md)

---

## Scope reviewed

| Area | Paths |
|------|-------|
| Personal routes | `app/calendar/page.tsx` (→ month), `month/page.tsx`, `day/page.tsx`, `week/page.tsx`, `year/page.tsx`, `layout.tsx` |
| Event editor | `components/calendar/EventDrawer.tsx` |
| Sidebar | `components/calendar/CalendarListSidebar.tsx` |
| Business hub | `BusinessWorkspaceContent.tsx` `case 'calendar'` → `CalendarModuleWrapper` |
| Hub wrapper | `components/calendar/CalendarModuleWrapper.tsx` |
| Widget module | `components/modules/CalendarModule.tsx` |
| Enterprise | `components/calendar/enterprise/EnhancedCalendarModule.tsx` |
| Context | `contexts/CalendarContext.tsx` |
| API | `api/calendar.ts` |

**Remediation waves:** **5E.1** interaction safety (E-1–E-3, E-9, E-15); **5E.2** month workflow parity (E-4, E-5).

---

## Rating scale

| Rating | Meaning |
|--------|--------|
| **PASS** | Meets standard for target level |
| **PASS WITH FINDINGS** | Meets bar with documented exceptions |
| **FAIL** | Violates standard; blocks certification at target level |

---

## Interaction inventory (5E.3)

### Create

| Path | Surface | Confirm gate | Notes |
|------|---------|--------------|-------|
| Cell click / drag-select | `month/page.tsx` MonthGrid | None | `openCreateDrawer` → `EventDrawer` (5E.2) |
| New Event (month toolbar) | `month/page.tsx` | None | `openCreateDrawer` (5E.2) |
| New Event (sidebar) | `CalendarListSidebar.tsx` | None | Navigates to `/calendar/month` |
| EventDrawer Create | `month/page.tsx`, `day/page.tsx`, `week/page.tsx` | None | Functional save path |
| Calendar create | `CalendarListSidebar.tsx` | Modal | `CalendarCreateCalendarModal` (5E.1) |
| ICS import | `EventDrawer.tsx` | None | `toast` feedback (5E.1) |
| Widget create | `CalendarModule.tsx` | None | Redirect/toast stub |

### Edit

| Path | Surface | Confirm gate | Notes |
|------|---------|--------------|-------|
| EventDrawer Save | `EventDrawer.tsx` | `ConfirmModal` on conflict (5E.1) | Before save |
| Recurring scope | `EventDrawer.tsx` | Radio UI (THIS/SERIES) | In-drawer — acceptable |
| Month modal Edit | `month/page.tsx` footer | None | `openEditDrawer` → `EventDrawer` (5E.2) |
| Drag move/resize | `month/page.tsx` | `RecurrenceScopeModal` if recurring (5E.1) | Then API update |
| Day/week time drag | `day/page.tsx`, `week/page.tsx` | `RecurrenceScopeModal` if recurring (5E.1) | Then API update |
| Find Time | `EventDrawer.tsx` | `ConfirmModal` slot pick (5E.1) | `toast` on error |

### Delete

| Path | Surface | Confirm gate | Notes |
|------|---------|--------------|-------|
| EventDrawer Delete (non-recurring) | `EventDrawer.tsx` | `ConfirmModal` → `trashItem()` (5E.1) | Gated |
| EventDrawer Delete (recurring) | `EventDrawer.tsx` | `ConfirmModal` → `RecurrenceScopeModal` (5E.1) | Gated |
| Skip occurrence | `EventDrawer.tsx` | `ConfirmModal` (5E.1) | Gated |
| Month modal | `month/page.tsx` | N/A | No delete affordance in view modal — delete via drawer |

### Destructive-action summary

| Mechanism | Count (calendar surfaces) |
|-----------|---------------------------|
| **`ConfirmModal`** | **5+** surfaces in `EventDrawer` |
| **`RecurrenceScopeModal`** | Recurring move/update/delete scope |
| **`confirm()`** | **0** |
| **`prompt()`** | **0** |
| **`alert()`** | **0** |

---

## Category results (5G-Calendar-D authoritative)

| # | Category | Rating | Rationale |
|---|----------|--------|-----------|
| 1 | **Interaction Consistency** | **PASS** | `ConfirmModal` + `RecurrenceScopeModal` + `CalendarCreateCalendarModal`; zero native dialogs; `ContextMenu` on event chips (3C-7C). CAL-08/16/22/23 PASS (R2/R3). |
| 2 | **Layout Consistency** | **PASS** | `CalendarPageShell` → `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` on all personal routes + business hub (3C-7A/7B). CAL-24 PASS. Widget/enterprise documented exceptions. |
| 3 | **Navigation** | **PASS** | `CalendarWorkspaceLanding`; four view routes; quick-access fixed (E-7, E-16). CAL-01/02 PASS. |
| 4 | **Accessibility** | **PASS** | CAL-14/16/20/21/23 PASS; shortcuts help (E-13); certified modals; E-14 closed. |
| 5 | **Mobile** | **PASS** | CAL-11/12 PASS at 375px; collapsible sidebar sheet (E-10); week horizontal scroll verified. |
| 6 | **Cross-Module Integration** | **PASS** | Notebook, V_Link, Todo (server), notifications/reminders, realtime socket, global trash. |
| 7 | **Error Handling** | **PASS** | `toast` on primary CRUD, ICS, export, find-time. E-9 resolved (5E.1). |
| 8 | **Empty States** | **PASS** | Shared `EmptyState` on day/week/month/year (3C-7C). CAL-17/18 PASS. |
| 9 | **Loading States** | **PASS** | Spinners / inline loading on all views. |
| 10 | **Discoverability** | **PASS** | Filters, view nav, create/edit, shortcuts help (`?`). CAL-14/15 PASS. |
| 11 | **Workflow Completion** | **PASS** | Create/edit/save/cancel/delete via `EventDrawer`. CAL-04/06/08 PASS. |

---

## Level awards (5G-Calendar-D)

| Level | Decision |
|-------|----------|
| **UX-L1** | **Certified** |
| **UX-L2** | **Certified** |
| **UX-L3** | **Certified** |
| **Reference UX #5** | **Eligible With Findings** (no designation) |

### Threshold detail

| Target | Result |
|--------|--------|
| L1 — no FAIL in cats 1, 3, 4, 7 | ✅ |
| L1 — no native dialog blockers | ✅ |
| L1 — ≥8 PASS (strict Certified) | ✅ (11 PASS) |
| L2 — ≥9 PASS | ✅ (11 PASS) |
| L2 — cats 2, 5 not FAIL | ✅ (both PASS) |
| L3 — prerequisite L2 Certified | ✅ |
| L3 — core quartet PASS | ✅ (cats 1, 2, 4, 11) |
| L3 — E-14 QA | ✅ |

---

## Category comparison (5E vs 5E.3 vs 3C-7D)

| # | Category | Wave 5E | Wave 5E.3 | Wave 3C-7D |
|---|----------|---------|-----------|------------|
| 1 | Interaction Consistency | **FAIL** | **PASS** | **PASS** |
| 2 | Layout Consistency | PWF | PWF | **PASS** |
| 3 | Navigation | PWF | PWF | **PASS** |
| 4 | Accessibility | PWF | PWF | PWF |
| 5 | Mobile | PWF | PWF | PWF |
| 6 | Cross-Module Integration | **PASS** | **PASS** | **PASS** |
| 7 | Error Handling | PWF | **PASS** | **PASS** |
| 8 | Empty States | PWF | PWF | **PASS** |
| 9 | Loading States | **PASS** | **PASS** | **PASS** |
| 10 | Discoverability | PWF | **PASS** | **PASS** |
| 11 | Workflow Completion | **FAIL** | **PASS** | **PASS** |

---

## Open findings

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| E-1 | Native `confirm()` recurring/conflict flows | P1 | **Resolved** (5E.1) |
| E-2 | Native `prompt()` calendar create | P1 | **Resolved** (5E.1) |
| E-3 | Event delete lacks `ConfirmModal` | P1 | **Resolved** (5E.1) |
| E-4 | Month view modal Edit no-op | P1 | **Resolved** (5E.2) |
| E-5 | Month create without `EventDrawer` | P1 | **Resolved** (5E.2) |
| E-6 | No layout primitives | P2 | **Resolved** (3C-7A) |
| E-7 | No `CalendarWorkspaceLanding.tsx` | P2 | **Resolved** (3C-7A) |
| E-8 | Fragmented shells | P2 | **Resolved** (3C-7B) |
| E-9 | `alert()` feedback paths | P1 | **Resolved** (5E.1) |
| E-10 | Fixed sidebar — mobile crowding | P3 | **Resolved** impl (3C-7B); QA open |
| E-11 | No shared `EmptyState` on empty grid | P3 | **Resolved** (3C-7C) |
| E-12 | No `DropdownMenu`/`ContextMenu` on event actions | P3 | **Resolved** (3C-7C) |
| E-13 | Keyboard shortcuts undocumented | P3 | **Resolved** (3C-7C) |
| E-14 | Manual QA matrix not executed | Process | **Resolved** (R3) |
| E-15 | Skip occurrence no confirm | P3 | **Resolved** (5E.1) |
| E-16 | Shared Calendars quick-access stub | P3 | **Resolved** (3C-7B) |

---

## Summary metrics

| Metric | Wave 5E | Wave 5E.3 | Wave 3C-7D | Wave 5G-D |
|--------|---------|-----------|------------|-----------|
| **PASS** | 2 | 6 | 9 | **11** |
| **PASS WITH FINDINGS** | 7 | 5 | 2 | **0** |
| **FAIL** | 2 | 0 | 0 | **0** |
| Native dialogs | 13+ | **0** | **0** | **0** |

---

## Comparison to Wave 5 peers

| Metric | Notifications (5C.2) | Todo (5D.4) | Chat (5B.3) | Calendar (5G-D) |
|--------|----------------------|-------------|-------------|-------------------|
| PASS | 9 | 8 | 6 | **11** |
| FAIL | 0 | 0 | 0 | **0** |
| UX-L1 | CwF | CwF | CwF | **Certified** |
| UX-L2 | CwF | Not certified | Not certified | **Certified** |
| UX-L3 | Not certified | Not certified | Not certified | **Certified** |
| Native dialogs | 0 | 0 | 0 | **0** |

---

## Related

- [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md)
- [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./CALENDAR_UX_RECERTIFICATION_2026_5E3.md)
- [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](./CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md)
- [`CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md`](./CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

## Wave history

| Wave | Outcome |
|------|---------|
| 5E | Initial audit — 2 PASS / 7 PWF / 2 FAIL; UX-L1 not certified |
| 5E.1 | Interaction safety — E-1–E-3, E-9, E-15 resolved |
| 5E.2 | Month workflow parity — E-4, E-5 resolved |
| **5E.3** | Re-certification — 6 PASS / 5 PWF / 0 FAIL; UX-L1 CwF |
| 3C-7A | Shell + hub — E-6, E-7 |
| 3C-7B | Route consolidation + mobile — E-8, E-10, E-16 |
| 3C-7C | Polish — E-11, E-12, E-13 |
| **3C-7D** | Re-certification — 9 PASS / 2 PWF / 0 FAIL; UX-L1 Certified; UX-L2 CwF |
| **5G-Calendar-D** | **L3 certification review — 11 PASS / 0 PWF / 0 FAIL; UX-L1/L2/L3 Certified** |

---

## Wave 5G QA + certification (2026-06-03)

| Item | Status |
|------|--------|
| CAL-QA-01 drawer overlay | **Cleared** (R2) |
| CAL-QA-02 shortcuts help | **Cleared** (R2) |
| CAL-QA-03 create workflow | **Cleared** (R2+R3) |
| E-14 matrix sign-off | **Resolved** (R3) |
| UX-L3 | **Certified** (5G-Calendar-D) |
| Reference UX #5 | **Eligible With Findings** |

**Evidence:** [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md), [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./CALENDAR_QA_EXEC_R3_REPORT_2026.md)

---

**Last updated:** 2026-06-03 (Wave 5G-Calendar-D — authoritative scorecard)
