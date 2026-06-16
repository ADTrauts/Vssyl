# CO-01 Activity Standardization — Engineering Blueprint

**CO:** CO-01 (G03)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [ACTIVITY_STANDARDIZATION_PLAN.md](./ACTIVITY_STANDARDIZATION_PLAN.md)  
**Contract:** `memory-bank/moduleSpecs.md` — normalized activity envelope

---

## Purpose

Engineering scope to wire Scheduling and HR through `emitModuleActivityEvent` with module-specific activity services. Reference patterns: Drive, Chat, Calendar, Todo.

---

## Work packages (engineering mapping)

| WP | Deliverable |
|----|-------------|
| WP-01-01 | CREATE `schedulingActivityService.ts` |
| WP-01-02 | CREATE `hrActivityService.ts` |
| WP-01-03 | Wire P1 events in scheduling controllers |
| WP-01-04 | Wire P1 events in `hrController` + HR services |
| WP-01-05 | Activity tests |

---

## Platform contract

**Emitter:** `server/src/services/moduleActivityService.ts` → `emitModuleActivityEvent`

**Reference implementations (read-only patterns):**

| Module | Service | Pattern |
|--------|---------|---------|
| Chat | `server/src/services/chatActivityService.ts` | Room/message events |
| Todo | `server/src/services/todoActivityService.ts` | Task CRUD events |
| Drive | `server/src/services/driveUploadService.ts` | Inline emit on upload |
| Calendar | `server/src/services/calendarService.ts` (or calendar activity helper) | Event lifecycle |

**Envelope fields (required):** `moduleId`, `action`, `entityType`, `entityId`, `dashboardId`, `businessId`, `actorId`, `metadata`

---

## New services (CREATE)

### `schedulingActivityService.ts`

| Export | Action constant | Entity |
|--------|-----------------|--------|
| `emitScheduleCreated` | `scheduling_schedule_created` | `Schedule` |
| `emitSchedulePublished` | `scheduling_schedule_published` | `Schedule` |
| `emitScheduleDeleted` | `scheduling_schedule_deleted` | `Schedule` |
| `emitShiftCreated` | `scheduling_shift_created` | `ScheduleShift` |
| `emitShiftUpdated` | `scheduling_shift_updated` | `ScheduleShift` |
| `emitShiftDeleted` | `scheduling_shift_deleted` | `ScheduleShift` |
| `emitSwapRequested` | `scheduling_swap_requested` | `ShiftSwapRequest` |
| `emitSwapResolved` | `scheduling_swap_resolved` | `ShiftSwapRequest` |

### `hrActivityService.ts`

| Export | Action constant | Entity |
|--------|-----------------|--------|
| `emitEmployeeCreated` | `hr_employee_created` | `EmployeeHRProfile` |
| `emitEmployeeUpdated` | `hr_employee_updated` | `EmployeeHRProfile` |
| `emitEmployeeTerminated` | `hr_employee_terminated` | `EmployeeHRProfile` |
| `emitTimeOffRequested` | `hr_time_off_requested` | `TimeOffRequest` |
| `emitTimeOffApproved` | `hr_time_off_approved` | `TimeOffRequest` |
| `emitTimeOffDenied` | `hr_time_off_denied` | `TimeOffRequest` |
| `emitOnboardingStepCompleted` | `hr_onboarding_step_completed` | `OnboardingProgress` |

---

## emitModuleActivityEvent insertion points

### Scheduling controllers (currently **zero** emits)

| File | Function | Insert after success | Event |
|------|----------|---------------------|-------|
| `schedulingAdminController.ts` | `createSchedule` | DB commit | `scheduling_schedule_created` |
| `schedulingAdminController.ts` | `publishSchedule` (~L453) | publish commit | `scheduling_schedule_published` |
| `schedulingAdminController.ts` | `deleteSchedule` | soft-delete commit (CO-04) | `scheduling_schedule_deleted` |
| `schedulingAdminController.ts` | `createShift`, `updateShift`, `deleteShift` | respective commits | shift events |
| `schedulingTeamController.ts` | `publishTeamSchedule` (~L172) | publish commit | `scheduling_schedule_published` |
| `schedulingEmployeeController.ts` | swap request create | commit | `scheduling_swap_requested` |
| `schedulingAdminController.ts` | swap approve/deny | commit | `scheduling_swap_resolved` |

**Route correlation:**

| Route | Controller function |
|-------|---------------------|
| `POST /admin/schedules` | `createSchedule` |
| `POST /admin/schedules/:id/publish` | `publishSchedule` |
| `DELETE /admin/schedules/:id` | `deleteSchedule` |
| `POST /team/schedules/:id/publish` | `publishTeamSchedule` |

### HR controller (currently **zero** emits)

| File | Function | Event |
|------|----------|-------|
| `hrController.ts` | `createEmployee` | `hr_employee_created` |
| `hrController.ts` | `updateEmployee` | `hr_employee_updated` |
| `hrController.ts` | `terminateEmployee` (~L1942) | `hr_employee_terminated` |
| `hrController.ts` | time-off approve/deny handlers | `hr_time_off_*` |
| `hrOnboardingService.ts` | step completion | `hr_onboarding_step_completed` |
| `employeeManagementService.ts` | assign/remove (CO-05) | Optional `hr_position_assigned` (P2) |

**Rule:** `authorize → execute → emit` — never emit on failure.

---

## Entity mappings

| moduleId | entityType | Prisma model | Schema |
|----------|------------|--------------|--------|
| `scheduling` | `schedule` | `Schedule` | `prisma/modules/scheduling/core.prisma` |
| `scheduling` | `shift` | `ScheduleShift` | same |
| `scheduling` | `swap` | `ShiftSwapRequest` | same |
| `hr` | `employee` | `EmployeeHRProfile` | `prisma/modules/hr/core.prisma` |
| `hr` | `time_off` | `TimeOffRequest` | HR module |
| `hr` | `onboarding` | `OnboardingProgress` | HR module |

---

## Activity services (platform)

| File | Role |
|------|------|
| `moduleActivityService.ts` | Core `emitModuleActivityEvent` — no change expected |
| `activityFeedService.ts` (if exists) | Consumer — verify module filter includes scheduling/hr |

---

## Tests

| Test file (CREATE) | Assertions |
|--------------------|------------|
| `server/src/services/__tests__/schedulingActivityService.test.ts` | Envelope shape; tenant fields |
| `server/src/services/__tests__/hrActivityService.test.ts` | Envelope shape; tenant fields |
| Controller integration (optional P2) | Emit called once on success; not on 401/403 |

**Test requirements:**

- Mock `emitModuleActivityEvent`; verify `businessId` + `dashboardId` present
- Verify no emit on unauthorized path
- Match Chat/Todo test structure where present

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | CO-05 identity paths stable (for optional position events) |
| **Exit** | P1 scheduling + HR events emit; services exist; tests pass |

---

## Assumptions

- Activity feed already indexes by `moduleId`.
- No new Prisma models for activity (uses platform activity log).
- P2 events (templates, stations) deferred within CO-01 if needed.

---

## Risks

| ID | Risk |
|----|------|
| R-04 | Emit-before-commit ordering |
| R-05 | Missing `dashboardId` on business routes |

---

## Dependencies

| CO | Reason |
|----|--------|
| CO-05 | Optional position-assignment events |
| CO-04 | Delete events align with soft-delete |
| None | Activity services can start after P0 |

---

## Verification criteria

- [ ] `grep emitModuleActivityEvent` hits scheduling + HR paths
- [ ] Zero emits remain in failure branches
- [ ] Envelope matches `moduleSpecs.md`
- [ ] Activity service unit tests pass
