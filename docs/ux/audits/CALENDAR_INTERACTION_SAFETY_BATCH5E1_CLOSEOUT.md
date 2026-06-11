# Calendar Interaction Safety — Wave 5E.1 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (interaction safety only)  
**Benchmark:** Drive 3B / Chat 5B.1 / Notifications 5C.1 / Todo 5D.1 — `ConfirmModal` + certified modals  
**Prior audit:** [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md) (Wave 5E)

---

## 1. Objective

Resolve Wave 5E P1 interaction findings **E-1**, **E-2**, **E-3**, and **E-9** by eliminating native browser dialogs and gating event deletes behind `ConfirmModal`.

**In scope:** 5E.1A–5E.1D  
**Out of scope:** Layout (E-6), hub landing (E-7), month workflow parity (E-4/E-5 — 5E.2), 3C-7, certification re-score

---

## 2. Pre-change native dialog inventory

| Mechanism | Count | Locations |
|-----------|-------|-----------|
| `confirm()` | **6** | `EventDrawer` (delete, conflict, find-time), `month/page` (move), `day/page`, `week/page` (update) |
| `prompt()` | **1** | `CalendarListSidebar` (calendar create) |
| `alert()` | **6** | `EventDrawer` (ICS, find-time), `month/page` (export) |
| `ConfirmModal` | **0** | — |

---

## 3. Post-change native dialog inventory

| Mechanism | Count |
|-----------|-------|
| `confirm()` | **0** |
| `prompt()` | **0** |
| `alert()` | **0** |
| `ConfirmModal` | **5** surfaces in `EventDrawer` + `RecurrenceScopeModal` for scope |

**Validation:** `rg 'confirm\\(|prompt\\(|alert\\(' web/src/**/*[Cc]alendar*` → **0 matches**.

---

## 4. Delete-path matrix (E-3)

| Path | Trigger | Pre-5E.1 | Post-5E.1 | ConfirmModal? |
|------|---------|----------|-----------|---------------|
| **EventDrawer Delete** (non-recurring) | Delete button | Immediate `trashItem()` | `requestDeleteEvent` → `ConfirmModal` → `executeDeleteEvent` | ✅ |
| **EventDrawer Delete** (recurring) | Delete button | `confirm()` scope → delete/trash | `ConfirmModal` → `RecurrenceScopeModal` → `executeDeleteEvent` | ✅ |
| **EventDrawer Skip occurrence** | Skip button | Immediate API delete | `ConfirmModal` → `executeSkipOccurrence` | ✅ |
| Month modal | — | No delete affordance | Unchanged | N/A |

**Cancel / Escape / backdrop:** Clears pending state with **no mutation**.

---

## 5. Remediation by finding

### E-1 — Native `confirm()` ✅

| Flow | Replacement |
|------|-------------|
| Recurring move (month) | `RecurrenceScopeModal` |
| Recurring update (day/week) | `RecurrenceScopeModal` |
| Recurring delete scope | `RecurrenceScopeModal` (after delete confirm) |
| Conflict on save | `ConfirmModal` (informational) |
| Find-time slot | `ConfirmModal` (informational) |

### E-2 — Native `prompt()` ✅

| Flow | Replacement |
|------|-------------|
| Calendar create | `CalendarCreateCalendarModal` (Drive folder pattern) |

### E-3 — Event delete gate ✅

Central gate in `EventDrawer.tsx`:

- `pendingEventDelete` / `pendingDeleteScope`
- `requestDeleteEvent()` / `executeDeleteEvent(scope)`
- `ConfirmModal` + `RecurrenceScopeModal`

### E-9 — Native `alert()` ✅

| Flow | Replacement |
|------|-------------|
| ICS import success/error | `toast.success` / `toast.error` |
| Find-time no slots / error | `toast.error` |
| Export empty / error (month) | `toast.error` |

**Bonus:** Skip occurrence gated (was E-15 P3).

---

## 6. Files modified

| File | Summary |
|------|---------|
| `web/src/components/calendar/CalendarCreateCalendarModal.tsx` | **New** — calendar name modal (E-2) |
| `web/src/components/calendar/RecurrenceScopeModal.tsx` | **New** — THIS vs SERIES scope (E-1) |
| `web/src/components/calendar/EventDrawer.tsx` | Delete/skip/conflict/find-time gates; toast feedback |
| `web/src/components/calendar/CalendarListSidebar.tsx` | Create calendar modal; toast |
| `web/src/app/calendar/month/page.tsx` | Recurrence move modal; export toast |
| `web/src/app/calendar/day/page.tsx` | Recurrence update modal |
| `web/src/app/calendar/week/page.tsx` | Recurrence update modal |

---

## 7. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| `confirm()` in calendar flows | **0** |
| `prompt()` in calendar flows | **0** |
| `alert()` in calendar flows | **0** |
| Event delete gated | ✅ |
| Calendar create modal | ✅ |
| Recurring scope functional | ✅ (explicit THIS/SERIES buttons) |
| Conflict / find-time functional | ✅ |

---

## 8. Findings disposition (5E.1)

| ID | Status |
|----|--------|
| E-1 | **Resolved** |
| E-2 | **Resolved** |
| E-3 | **Resolved** |
| E-9 | **Resolved** |
| E-15 | **Resolved** (skip occurrence confirm) |
| E-4, E-5 | **Open** — 5E.2 |
| E-6–E-8, E-10–E-14, E-16 | **Open** |

**Authoritative certification awards remain Wave 5E** until re-certification (5E.3 recommended after 5E.2).

**Projected:** Category **1** (Interaction) → **PASS** on re-cert.

---

## Related

- [`CALENDAR_UX_SCORECARD.md`](./CALENDAR_UX_SCORECARD.md)
- [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md)
- [`TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md`](./TODO_INTERACTION_SAFETY_BATCH5D1_CLOSEOUT.md)

**Last updated:** 2026-06-03 (Wave 5E.1)
