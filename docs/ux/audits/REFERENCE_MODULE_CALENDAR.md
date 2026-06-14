# Reference Module Registration — Calendar

**Registration type:** Reference UX Module **#5** (Reference Calendar Module)  
**Status:** **Approved with Findings**  
**Date registered:** 2026-06-03  
**moduleId:** `calendar`  
**User-facing name:** Calendar

> **Track clarification:** This is the **UX Reference Calendar Module** (scheduling/time-grid UX patterns) per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) slot **#5**. It is **independent** of **Architecture Reference Module #5** (Place, Level 3, council Wave 4B). Calendar remains **Architecture Reference Module #3** per [`CERTIFICATION_LEDGER.md`](../../architecture/CERTIFICATION_LEDGER.md).

---

## Registration summary

| Field | Value |
|-------|-------|
| **Decision** | **Approved with Findings** |
| **UX level** | **UX-L3 Certified** (11 PASS / 0 PWF / 0 FAIL) |
| **Architecture level** | Level 3 Certified — Reference Module #3 (unchanged) |
| **Benchmark role** | Primary copy target for scheduling, time-grid, and event CRUD UX |
| **UX certification** | [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md) |
| **L3 review** | [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Why Calendar qualified (program rules)

Per [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) Reference Calendar Module definition and certification process:

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Modernization waves (interaction + layout + menus) | ✅ 5E.1–5E.3 + 3C-7A/B/C |
| 2 | Module scorecard (11 categories) | ✅ [`CALENDAR_UX_SCORECARD.md`](./CALENDAR_UX_SCORECARD.md) — **11 PASS** |
| 3 | Interaction certification | ✅ 5E.1 safety + 5E.2 workflow + E-14 QA |
| 4 | Manual QA matrix | ✅ E-14 resolved — [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./CALENDAR_QA_EXEC_R3_REPORT_2026.md) |
| 5 | Registration decision | ✅ **Approved with Findings** (this document) |
| 6 | Register benchmark | ✅ This document |

**Prerequisite met:** UX-L3 Certified (exceeds UX-L3 CwF minimum).

**Not strict Approved:** Carry-forward verification gaps (BLOCKED matrix rows, widget/enterprise shell exceptions) mirror Drive Reference UX #1 precedent — findings documented, non-blocking for registration.

---

## Architectural quality (UX surfaces)

### Shell modernization

| Pattern | Implementation | Evidence |
|---------|----------------|----------|
| Unified page shell | `CalendarPageShell` on month/day/week/year routes | 3C-7A/7B closeouts |
| Layout primitives | `PageHeader` + `PageToolbar` + `WorkspaceSplitLayout` | [`CALENDAR_LAYOUT_MODERNIZATION_PLAN.md`](../CALENDAR_LAYOUT_MODERNIZATION_PLAN.md) |
| Route consolidation | Four view routes + `/calendar` → month redirect | CAL-01/02 PASS |
| Business hub | `CalendarWorkspaceLanding` + `BusinessWorkspaceContent` `case 'calendar'` | 3C-7A; CAL-03 BLOCKED (QA data) |

### Exception documentation (certified)

| Surface | Classification | Rationale |
|---------|----------------|-----------|
| `CalendarModule.tsx` | **Certified exception** | Dashboard widget — embedded grids; not primary workspace shell |
| `EnhancedCalendarModule.tsx` | **Certified exception** | Enterprise resource/approval panels — product tier |
| Month event modal inline Close/Edit | **Certified exception** | 5E.2 preserved; delete via `EventDrawer` |
| Year view | **Product scope** | Read-only heatmap; no create shortcut |

---

## UX quality

### 11-category scorecard (5G-Calendar-D authoritative)

| # | Category | Rating |
|---|----------|--------|
| 1 | Interaction Consistency | **PASS** |
| 2 | Layout Consistency | **PASS** |
| 3 | Navigation | **PASS** |
| 4 | Accessibility | **PASS** |
| 5 | Mobile | **PASS** |
| 6 | Cross-Module Integration | **PASS** |
| 7 | Error Handling | **PASS** |
| 8 | Empty States | **PASS** |
| 9 | Loading States | **PASS** |
| 10 | Discoverability | **PASS** |
| 11 | Workflow Completion | **PASS** |

Full detail: [`CALENDAR_UX_SCORECARD.md`](./CALENDAR_UX_SCORECARD.md)

### UX-L3 certification

| Level | Award |
|-------|-------|
| UX-L1 | **Certified** |
| UX-L2 | **Certified** |
| UX-L3 | **Certified** |

Evidence: [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md)

### QA evidence (E-14)

| Metric | Value |
|--------|------:|
| PASS | **19** |
| FAIL | **0** |
| BLOCKED | **4** (documented — not product FAIL) |
| N/A | **1** |

Evidence folder: [`qa-evidence/5G-QA/calendar/`](./qa-evidence/5G-QA/calendar/)

### Accessibility (verified)

CAL-14 (`?` shortcuts), CAL-16 (Escape), CAL-20 (toolbar `aria-label`), CAL-21 (mobile sidebar labels), CAL-23 (context menu).

### Mobile (verified)

CAL-11 (375px month + sidebar sheet), CAL-12 (375px week horizontal scroll).

---

## Platform integration

| System | Calendar integration | Copy note |
|--------|---------------------|-----------|
| **AI** | `calendarAIActionService`; context providers in manifest; bounded reads via visibility | Copy AI action routing — not controller Prisma |
| **V_Link** | `calendar:event` entity; `calendarVlinkAccessService` / lifecycle; drawer “Add to V_Link” | Copy conservative single-entity V_Link pattern |
| **Notifications** | `calendar_reminder` type; `calendarReminderService` + scheduler | Copy time-based notification adapter |
| **Todo** | Server-side calendar bridge; todo due dates on calendar cells — **UI path CAL-19 BLOCKED** in QA | Copy server bridge; UI surfacing requires Todo module seed |
| **Drive / File Hub** | ICS import in `EventDrawer`; notebook/meeting page links | Copy attachment/import UX in drawer — not Drive shell |
| **Business Workspace** | `CalendarWorkspaceLanding` hub pattern; `CalendarModuleWrapper` in workspace switch | Copy hub-first module entry (same rule as Drive/Todo) |
| **Global Trash** | `calendarTrashService` + handler; soft delete on events | Copy trash confirm → `trashItem()` pattern |
| **Realtime** | Socket membership on calendar rooms | Copy tenant-scoped realtime emit |
| **Policy Engine** | `calendarPolicyDual` on reads | Copy post-query filter pattern |

Architecture detail: [`CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md)

---

## Waves that contributed

| Wave | Contribution | Closeout |
|------|--------------|----------|
| **5E.1** | ConfirmModal + RecurrenceScopeModal; zero native dialogs | [`CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md`](./CALENDAR_INTERACTION_SAFETY_BATCH5E1_CLOSEOUT.md) |
| **5E.2** | Month `EventDrawer` workflow parity | [`CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md`](./CALENDAR_MONTH_WORKFLOW_PARITY_BATCH5E2_CLOSEOUT.md) |
| **5E.3** | Re-certification baseline | [`CALENDAR_UX_RECERTIFICATION_2026_5E3.md`](./CALENDAR_UX_RECERTIFICATION_2026_5E3.md) |
| **3C-7A** | `CalendarPageShell` + `CalendarWorkspaceLanding` | [`CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md`](./CALENDAR_LAYOUT_MODERNIZATION_3C7A_CLOSEOUT.md) |
| **3C-7B** | Route consolidation + mobile sidebar sheet | [`CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md`](./CALENDAR_LAYOUT_MODERNIZATION_3C7B_CLOSEOUT.md) |
| **3C-7C** | EmptyState + ContextMenu + shortcuts help | [`CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md`](./CALENDAR_LAYOUT_POLISH_3C7C_CLOSEOUT.md) |
| **3C-7D** | UX-L2 CwF re-certification | [`CALENDAR_UX_RECERTIFICATION_2026_3C7D.md`](./CALENDAR_UX_RECERTIFICATION_2026_3C7D.md) |
| **5G-QA** | E-14 manual QA R1/R2/R3 | [`CALENDAR_QA_EXEC_R3_REPORT_2026.md`](./CALENDAR_QA_EXEC_R3_REPORT_2026.md) |
| **5G-Calendar-D** | UX-L3 Certified | [`CALENDAR_UX_L3_CERTIFICATION_REVIEW.md`](./CALENDAR_UX_L3_CERTIFICATION_REVIEW.md) |

---

## Known findings (carry-forward)

| ID | Finding | Severity | Blocks reference? |
|----|---------|----------|-------------------|
| R-CAL-1 | CAL-03 BLOCKED — business hub not QA-verified (no business on test account) | P2 (verification) | No |
| R-CAL-2 | CAL-05/10 BLOCKED — drag-create not exercised in automation | P2 (verification) | No |
| R-CAL-3 | CAL-19 BLOCKED — todo due dates not on standalone `/calendar` routes | P2 (scope) | No |
| R-CAL-4 | Recurring delete scope not seeded in QA | P3 (QA) | No |
| R-CAL-5 | `CalendarModule` widget shell divergence | Certified exception | No |
| R-CAL-6 | `EnhancedCalendarModule` enterprise shell divergence | Certified exception | No |
| R-CAL-7 | QA-ENV-02 — `JWT_SECRET` not in root `.env` | P1 (env) | No |

---

## Copy targets for other modules

When building scheduling, time-grid, or agenda modules, copy Calendar patterns for:

| Need | Calendar reference |
|------|-------------------|
| Time-grid shell | `CalendarPageShell` + `WorkspaceSplitLayout` |
| Event create/edit drawer | `EventDrawer.tsx` — conflict confirm, recurrence scope |
| Destructive event delete | `ConfirmModal` → `RecurrenceScopeModal` (if recurring) → trash |
| Month/week/day views | View route quartet + shared toolbar |
| Mobile calendar sidebar | Collapsible sheet + `Open calendars` / `Close calendars panel` labels |
| Empty month/week | `CalendarEventsEmptyState` |
| Event chip actions | `ContextMenu` — View details / Edit event |
| Keyboard shortcuts | `CalendarShortcutsHelp` + `?` guard in inputs |
| Scheduling conflict UX | In-drawer `ConfirmModal` + “Save anyway” |
| Business module hub | `CalendarWorkspaceLanding.tsx` pattern |
| ICS import UX | Drawer drag-drop + `toast` feedback |
| Filtered empty state | Search/filter copy when no matches |

**Secondary reference:** Drive (#1 UX) for trash/menu primitives; Todo (#4 arch) for task-calendar server bridge.

---

## Future recertification requirements

Re-register or re-audit when:

1. New destructive calendar flows ship without `ConfirmModal`
2. `CalendarPageShell` / `WorkspaceSplitLayout` removed from primary routes
3. Native `prompt()`/`confirm()`/`alert()` reintroduced on user paths
4. Global trash contract changes for calendar events
5. Major mobile calendar redesign (sidebar sheet pattern replaced)
6. New P0 FAIL in platform manual QA Part 2D

**Recommended cadence:** Annual or after any interaction-class wave on Calendar surfaces.

---

## Related registrations

| Type | Calendar status |
|------|-----------------|
| **Reference UX #5** | **This document** — Approved with Findings |
| Reference UX #1 | N/A (Drive holds UX #1) |
| Reference UX #2 | [`REFERENCE_MODULE_NOTIFICATIONS.md`](./REFERENCE_MODULE_NOTIFICATIONS.md) — Approved with Findings |
| Reference Architecture #3 | Level 3 Certified — [`CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md) |
| Reference Architecture #5 | **Place** (independent slot) |
| Reference Workspace | Hub pattern only — Business Workspace not reference |

---

## Related

- [`CALENDAR_UX_CERTIFICATION.md`](./CALENDAR_UX_CERTIFICATION.md)
- [`CALENDAR_UX_SCORECARD.md`](./CALENDAR_UX_SCORECARD.md)
- [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)
- [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) — UX #1 precedent

**Last updated:** 2026-06-03 (Reference UX #5 registration)
