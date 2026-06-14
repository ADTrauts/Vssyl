# Calendar QA Remediation — Wave 5G-Calendar-QA-Remediation Closeout

**Status:** **Complete** — engineering remediation only; no certification promotion  
**Date:** 2026-06-03  
**Module:** Calendar (`calendar`)  
**Parent:** [`CALENDAR_QA_ADDENDUM_2026.md`](./CALENDAR_QA_ADDENDUM_2026.md)  
**Prior QA:** [`CALENDAR_QA_EXECUTION_REPORT_2026.md`](./CALENDAR_QA_EXECUTION_REPORT_2026.md) (5G-QA-EXEC re-run)

---

## Scope

Remediation for QA findings **CAL-QA-01**, **CAL-QA-02**, **CAL-QA-03** and related matrix failures **CAL-06**, **CAL-08**, **CAL-14**, **CAL-16**, **CAL-22**.

**Out of scope:** certification, Reference UX prep, AI work, full QA re-run.

---

## Root causes

| Finding | Related cases | Root cause |
|---------|---------------|------------|
| **CAL-QA-01** | CAL-08, CAL-16, CAL-22 | `EventDrawer` stayed mounted when `isOpen={false}` with a full-viewport `fixed inset-0` layer (`pointer-events-none` on wrapper only). After month cell create, the open drawer blocked grid interaction; nested confirm modals and Escape were unreachable because the drawer had no document-level Escape handler and was rendered outside `CalendarPageShell` `overlays`. |
| **CAL-QA-02** | CAL-14 | `CalendarShortcutsHelp` was **imported but never rendered** on **Month** and **Day** views (only Week/Year mounted the component). Without mount, neither the `?` key listener nor the toolbar help button existed on the primary QA surface (`/calendar/month`). |
| **CAL-QA-03** | CAL-06 | `openCreateDrawer` did not dismiss the event view modal; combined with the persistent drawer overlay, toolbar **New Event** and grid create paths appeared blocked (`pointer-events` on controls under the overlay). |

---

## Fixes applied

### `EventDrawer.tsx`

- Unmount drawer when `!isOpen` (no ghost overlay in DOM).
- Portal drawer to `document.body` at `z-[100]` for consistent stacking.
- Document-level **Escape** handler with nested-modal priority (`ConfirmModal` / `RecurrenceScopeModal` states dismiss first, then drawer `onClose`).
- Explicit `pointer-events-auto` on panel; backdrop click closes drawer.

### `CalendarMonthView.tsx`

- `openCreateDrawer` closes event view modal before opening create drawer.
- `EventDrawer` + `RecurrenceScopeModal` moved to `CalendarPageShell` `overlays` (matches week/day pattern).
- **Escape** handler for event view modal when drawer is closed.
- **`CalendarShortcutsHelp`** added to month toolbar trailing actions.

### `CalendarDayView.tsx`

- **`CalendarShortcutsHelp`** added to day toolbar trailing actions.

### `CalendarShortcutsHelp.tsx`

- `?` listener accepts `Shift+/` (`e.key === '/'` with `shiftKey`) for US keyboards.
- Skips `contentEditable` targets; toggles help panel.
- Copy updated — help available from all calendar views.

---

## Files modified

| File | Change |
|------|--------|
| `web/src/components/calendar/EventDrawer.tsx` | Unmount when closed, portal, Escape, layering |
| `web/src/components/calendar/CalendarMonthView.tsx` | Overlays slot, modal/drawer mutual exclusion, shortcuts help, Escape |
| `web/src/components/calendar/CalendarDayView.tsx` | Shortcuts help mount |
| `web/src/components/calendar/CalendarShortcutsHelp.tsx` | Key listener + copy |
| `docs/ux/audits/CALENDAR_QA_REMEDIATION_BATCH5G_CLOSEOUT.md` | This closeout |
| `docs/ux/audits/CALENDAR_QA_ADDENDUM_2026.md` | Remediation status |
| `docs/ux/audits/CALENDAR_UX_SCORECARD.md` | 5G remediation note |
| `memory-bank/activeContext.md` | Wave status |
| `memory-bank/progress.md` | Wave status |

---

## Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `pnpm run build:web` | **PASS** |
| Manual CAL-06 | **Ready for QA re-run** — create drawer opens/closes; toolbar no longer blocked when dismissed |
| Manual CAL-08 | **Ready for QA re-run** — event chips reachable when drawer closed; delete flow in `EventDrawer` |
| Manual CAL-14 | **Ready for QA re-run** — help button + `?` on month/day |
| Manual CAL-16 | **Ready for QA re-run** — Escape dismisses drawer and nested confirms |
| Manual CAL-22 | **Ready for QA re-run** — delete cancel + Escape paths wired in drawer |

*Automated browser QA not re-executed in this wave — engineering validation only.*

---

## QA re-run readiness

| Question | Answer |
|----------|--------|
| Ready for 5G-QA-EXEC re-run on CAL-06/08/14/16/22? | **Yes** — P0 interaction blockers addressed |
| Ready for **5G-Calendar-D**? | **No** — requires signed human QA on full matrix |
| UX-L3 promotion? | **No** — not in scope |

---

## Remaining blockers before UX-L3

| ID | Blocker | Owner |
|----|---------|-------|
| **E-14** | Full CAL-01–24 matrix sign-off (human QA) | QA |
| **QA-ENV-02** | `JWT_SECRET` missing from root `.env` — local backend friction | Platform |
| **CAL-11 / CAL-12** | Mobile 375px sidebar/scroll — blocked in prior run | QA |
| **Cat 4 quartet** | Core views PWF until E-14 closed | Certification |

---

*Remediation wave only — no certification promotion.*
