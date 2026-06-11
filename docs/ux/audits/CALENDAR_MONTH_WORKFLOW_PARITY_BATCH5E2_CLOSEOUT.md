# Calendar Month Workflow Parity — Wave 5E.2 Closeout

**Status:** **Complete**  
**Date:** 2026-06-03  
**Mode:** Implementation (workflow parity only)  
**Benchmark:** Day/week `EventDrawer` create/edit pattern  
**Prior waves:** [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](./CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md) (5E.1), [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md) (5E)

---

## 1. Objective

Resolve Wave 5E P1 workflow findings **E-4** and **E-5** by mounting `EventDrawer` on the default Calendar route (`/calendar/month`) and wiring create/edit journeys to match day/week views.

**In scope:** E-4, E-5  
**Out of scope:** Certification re-score (5E.3), 3C-7 layout modernization, `WorkspaceSplitLayout` migration

---

## 2. Pre-change workflow inventory

| Path | Surface | Pre-5E.2 behavior |
|------|---------|-------------------|
| Month cell click | `MonthGrid` `onCellCreate` | Sets `draftStart`/`draftEnd` only — **no drawer** (E-5) |
| Month drag-select | `MonthGrid` mouseup | Same — draft state only (E-5) |
| New Event toolbar button | `month/page.tsx` | Sets draft state + TODO comment — **no drawer** (E-5) |
| Month modal Edit | Event view modal footer | Closes modal — **no edit** (E-4) |
| Day/week create/edit | `day/page.tsx`, `week/page.tsx` | `EventDrawer` — functional reference |

---

## 3. Post-change workflow inventory

| Path | Surface | Post-5E.2 behavior |
|------|---------|-------------------|
| Month cell click | `MonthGrid` | `openCreateDrawer(start, end)` → `EventDrawer` with `defaultStart`/`defaultEnd` |
| Month drag-select | `MonthGrid` | Same via `onCellCreate={openCreateDrawer}` |
| New Event toolbar button | `month/page.tsx` | `openCreateDrawer(now, now+1h)` |
| Month modal Edit | Event view modal footer | `openEditDrawer(eventToShow)` → closes modal, opens `EventDrawer` with `eventToEdit` |
| Save / Cancel / Delete | `EventDrawer` | Unchanged 5E.1 gates (`ConfirmModal`, `RecurrenceScopeModal`, toast) |

**User can complete create, edit, save, cancel, and delete without leaving month view.**

---

## 4. Implementation summary

### File modified

| File | Change |
|------|--------|
| `web/src/app/calendar/month/page.tsx` | `EventDrawer` integration; `showDrawer`, `reloadEvents`, `closeEventDrawer`, `openCreateDrawer`, `openEditDrawer` |

### EventDrawer integration

```tsx
<EventDrawer
  isOpen={showDrawer}
  onClose={closeEventDrawer}
  onCreated={async () => { await reloadEvents(); closeEventDrawer(); }}
  onUpdated={async () => { await reloadEvents(); closeEventDrawer(); }}
  contextType={...}   // dashboard type — parity with day/week
  contextId={...}     // business/household/dashboard id
  eventToEdit={editingEvent || undefined}
  defaultStart={draftStart}
  defaultEnd={draftEnd}
/>
```

### Preserved (unchanged)

- `RecurrenceScopeModal` for month drag-move recurring events
- 5E.1 `ConfirmModal` delete/skip/conflict gates in `EventDrawer`
- `CalendarCreateCalendarModal`, toast feedback, realtime socket listeners
- Day/week routes — no edits in 5E.2

---

## 5. Remediation by finding

### E-5 — Month create without EventDrawer ✅

- `onCellCreate={openCreateDrawer}` on `MonthGrid`
- Drag-select create path uses same handler
- **New Event** toolbar button calls `openCreateDrawer`

### E-4 — Month modal Edit no-op ✅

- Footer **Edit Event** → `openEditDrawer(eventToShow)`
- Closes view modal, loads `eventToEdit`, opens drawer

---

## 6. Validation

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Month create opens `EventDrawer` | Code-verified (cell click, drag, New Event) |
| Month edit opens `EventDrawer` | Code-verified (modal Edit) |
| Save reloads month events | `onCreated`/`onUpdated` → `reloadEvents()` |
| Cancel clears drawer state | `closeEventDrawer()` |
| Recurring / delete gates | Inherited from 5E.1 `EventDrawer` |
| Day/week regressions | No day/week file changes |

**Manual QA (E-14):** Not executed in 5E.2 — deferred to 5E.3 re-cert.

---

## 7. Projected certification impact (5E.3 — not performed)

| Category | 5E authoritative | Projected post-5E.1 + 5E.2 |
|----------|------------------|----------------------------|
| 1 Interaction | FAIL | **PASS** (5E.1) |
| 11 Workflow | FAIL | **PASS** (5E.2) |
| Native dialogs | 13+ | **0** (5E.1) |
| PASS count | 2 | **4** (cats 1, 9, 6, 11) |

**UX-L1 eligibility:** With cats 1 and 11 resolved, Calendar becomes **eligible for UX-L1 reassessment** in **5E.3** (documentation-only re-cert). Award not granted in 5E.2.

**Remaining open findings:** E-6–E-8 (layout), E-10–E-14, E-16 (polish/QA).

---

## Related

- [`CALENDAR_UX_SCORECARD.md`](./CALENDAR_UX_SCORECARD.md)
- [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md)
- [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](./CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

**Last updated:** 2026-06-03 (Wave 5E.2 complete; awards unchanged until 5E.3)
