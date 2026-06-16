# hrScheduleService Contract

**Program:** Business Operations Stage 1 — CO-07  
**Contract version:** v1.0  
**Service:** `server/src/services/hrScheduleService.ts`  
**Last updated:** 2026-06-14

---

## Purpose and boundary

`hrScheduleService` is a **shared workforce calendar bridge**. It synchronizes HR time-off and Scheduling shift data into Calendar module events. It is **not** a planning service, identity service, or Workforce Communications surface.

| In scope | Out of scope |
|----------|--------------|
| Ensure business Schedule calendar | Shift planning / optimization |
| Sync PTO requests to calendars | PTO approval logic (HR owns) |
| Sync published shifts to calendars | Schedule publish authorization (Scheduling owns) |
| Map `EmployeePosition` → user → calendar membership | Chat or WC broadcast delivery |
| Idempotent event create/update/delete | Attendance stub creation (see COL-2 note) |

**Model:** Integration bridge (Model C). HR-named file path is historical; conceptual owner is Platform / Business Operations.

---

## Owner

| Aspect | Owner |
|--------|-------|
| Implementation | Platform (bridge service) |
| Contract stewardship | Business Operations program |
| PTO source of truth | HR module (`TimeOffRequest`) |
| Shift source of truth | Scheduling module (`Schedule`, `ScheduleShift`) |
| Event persistence | Calendar module (`Event`, `Calendar`, `CalendarMember`) |

---

## Public API

All exports are async. Callers must pass valid `businessId` tenant context.

| Function | Trigger | Input | Output / behavior |
|----------|---------|-------|-------------------|
| `initializeHrScheduleForBusiness` | Module provision / business setup | `businessId` | Ensures Schedule calendar + default members |
| `addUsersToScheduleCalendar` | Member invite / roster changes | `businessId`, `userIds[]` | Upserts calendar membership; no-op if calendar missing |
| `syncTimeOffRequestCalendar` | HR PTO lifecycle change | `requestId` | Creates/updates/deletes schedule + personal events; no-op if request missing |
| `syncScheduleShiftsToCalendar` | Schedule publish / republish | `scheduleId`, `businessId` | Syncs all shifts; no-op if schedule missing |
| `syncSingleShiftToCalendar` | Shift update while published | `shiftId`, `businessId` | Syncs one shift; no-op if shift missing or schedule not `PUBLISHED` |

Internal helpers (`ensureScheduleCalendar`, `ensurePersonalCalendar`, event builders) are **not** part of the public contract.

---

## Source-of-truth boundaries

| Data | Owner | Bridge role |
|------|-------|-------------|
| `TimeOffRequest` | HR | Read status/dates; write `scheduleEventId` / `personalEventId` |
| `Schedule` / `ScheduleShift` | Scheduling | Read shifts; write shift `metadata.calendarEvents` |
| `Event` / `Calendar` | Calendar | Create/update/delete events |
| `EmployeePosition.userId` | HR / org chart | Resolve calendar attendee targets (CO-05 identity trust) |
| `HRModuleSettings.scheduleCalendarId` | HR settings | Persist business Schedule calendar id |

---

## Consumer matrix

| Consumer | Functions used | Responsibility |
|----------|----------------|----------------|
| `hrController.ts` | `syncTimeOffRequestCalendar` | Call after authorized PTO mutations |
| `hrAIActionService.ts` | `syncTimeOffRequestCalendar` | AI-driven PTO writes must trigger sync |
| `schedulingAdminController.ts` | `syncScheduleShiftsToCalendar`, `syncSingleShiftToCalendar` | Call after publish / published shift edits |
| `schedulingTeamController.ts` | `syncSingleShiftToCalendar` | Call after team swap approval on published schedules |
| `schedulingEmployeeController.ts` | `syncSingleShiftToCalendar` | Employee shift mutations on published schedules |
| `businessController.ts` | `addUsersToScheduleCalendar` | Add invited users to Schedule calendar |
| Module runtime / provision controllers | `initializeHrScheduleForBusiness` | Provision calendar on module install |

**Consumer rules:**

- Invoke only after **authorized, successful** mutations.
- Always pass the **authorized** `businessId` from request context.
- Do not bypass the bridge with direct `Event` writes from HR or Scheduling controllers.
- Calendar module owns recurrence, reminders, and event UI semantics.

---

## HR responsibilities

- Maintain `TimeOffRequest` lifecycle and approval state.
- Trigger `syncTimeOffRequestCalendar` on create/approve/deny/cancel/update.
- Keep `HRModuleSettings` and employee HR profiles accurate for calendar targeting.

## Scheduling responsibilities

- Maintain `Schedule` / `ScheduleShift` as planning source of truth.
- Trigger `syncScheduleShiftsToCalendar` on publish/republish.
- Trigger `syncSingleShiftToCalendar` on shift changes when schedule status is `PUBLISHED`.

## Calendar responsibilities

- Persist and serve `Event` records.
- Enforce calendar membership and visibility.
- Own reminder delivery (`calendar_reminder` notifications).

---

## Sync scenarios

### PTO approved

1. HR controller approves `TimeOffRequest`.
2. Caller invokes `syncTimeOffRequestCalendar(requestId)`.
3. Bridge ensures Schedule + personal calendars and members.
4. Bridge creates/updates events; stores event ids on the request.

### Schedule published

1. Scheduling admin publishes schedule.
2. Caller invokes `syncScheduleShiftsToCalendar(scheduleId, businessId)`.
3. Bridge iterates shifts; creates/updates Schedule calendar events and employee personal events.
4. Open/unassigned shifts update Schedule calendar only.

### Shift updated on published schedule

1. Scheduling updates `ScheduleShift`.
2. Caller invokes `syncSingleShiftToCalendar(shiftId, businessId)`.
3. Bridge updates or removes personal events when assignee changes.

### Idempotency

- Repeated publish sync with unchanged shifts should update existing events (via shift `metadata.calendarEvents`), not duplicate.
- Missing schedule/request/shift: **warn and return** (no throw).

### Inactive employee position

- Shifts without `employeePositionId` skip personal calendar sync.
- Inactive EPs should not be assigned new shifts at the Scheduling layer (CO-05); bridge assumes caller enforced this.

---

## Error contract

| Condition | Behavior |
|-----------|----------|
| Missing schedule / shift / PTO request | `logger.warn`, early return |
| Unpublished schedule (single-shift sync) | Early return |
| Calendar/event delete/update failure | `logger.warn`, continue other shifts |
| Unhandled exception in bulk sync | Logged; outer catch may rethrow for publish path |

Callers should treat sync as **best-effort**: log failures but do not roll back the originating HR/Scheduling mutation unless product rules require it.

---

## Non-responsibilities

- Workforce Communications campaigns or acknowledgments.
- Notification delivery (`NotificationService` — separate CO-02 path).
- Activity event emission (CO-01 services).
- Attendance record stub creation on publish (documented COL-2 adjacent risk; Stage 2).
- Policy Engine authorization.
- Global trash semantics (CO-04).

---

## Breaking-change policy

| Change type | Policy |
|-------------|--------|
| **Breaking** (signature removal, semantic change) | BO steward approval + consumer notification (HR, Scheduling, Calendar) |
| **Additive** (optional params, new export) | Minor contract bump (v1.x) |
| **Deprecation** | Minimum one release cycle notice before removal |
| **Rename to neutral package** | Optional Stage 2+; contract surface remains stable |

---

## Adjacent risk (COL-2)

Scheduling `publishSchedule` may create HR `AttendanceRecord` stubs via direct Prisma when HR module is installed. This is **not** part of the bridge contract and is scheduled for Stage 2 extraction into `hrAttendanceService`.

---

## Verification scenarios (WP-07.4)

| Scenario | Pass condition |
|----------|----------------|
| PTO approve → sync | `syncTimeOffRequestCalendar` called; request gains event ids |
| Publish → sync | All assigned shifts produce calendar events |
| Double publish | No duplicate events for same shift metadata |
| Missing request id | Returns without throw |
| Missing schedule id | Returns without throw |
| Unpublished single-shift sync | No-op |
