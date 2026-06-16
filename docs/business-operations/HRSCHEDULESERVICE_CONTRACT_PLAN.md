# hrScheduleService Contract Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-07 — Shared Bridge Contract Formalization  
**Gap:** G07 (P1)  
**Last updated:** 2026-06-14  
**Source:** [HR_SCHEDULING_BOUNDARY_REVIEW.md](./HR_SCHEDULING_BOUNDARY_REVIEW.md) COL-3  
**Service location:** `server/src/services/hrScheduleService.ts` (~1,014 LOC, HR-named)

---

## Purpose

Convert CO-07 into executable work documenting neutral contract for `hrScheduleService`: owner, API surface, versioning, breaking-change policy, consumer responsibilities.

**Resolves:** G07 — `hrScheduleService` contract formalization. Enables G09 manager publish with calendar sync (Stage 2).

**Classification:** Integration **bridge** — not a platform service. Model C preserved.

---

## Ownership

| Aspect | Decision |
|--------|----------|
| **Package location today** | HR package (`server/src/services/hrScheduleService.ts`) |
| **Conceptual owner** | **Shared workforce calendar bridge** — HR-named for historical reasons |
| **Steward** | BO program + HR module owner (operational); Scheduling + Calendar are consumers |
| **Rename** | Not required in Stage 1 — neutral **contract surface** documented regardless of package name |
| **Future neutral name** | Optional program decision (e.g. `workforceCalendarBridgeService`) — Stage 2+ if desired |

**Rule:** Ownership clarity is **contractual** in Stage 1 — not a codebase move requirement.

---

## Contracts

### Primary responsibilities

| Function | Trigger | Owner action | Calendar outcome |
|----------|---------|--------------|------------------|
| **Ensure business Schedule calendar** | Business setup / first sync | Create/find "Schedule" calendar on business dashboard | Calendar exists |
| **Sync PTO to calendar** | HR PTO approve/deny/update | `syncTimeOffRequestCalendar` | Events on schedule + personal calendars |
| **Sync published shifts** | Scheduling `publishSchedule` | `syncScheduleShiftsToCalendar` | Shift events on employee calendars |
| **Delete/update synced events** | PTO cancel, shift change, unpublish | Corresponding delete/update in calendar | Events removed/updated |

### API surface (contract inventory)

| Export (planned doc) | Caller today | Input | Output |
|---------------------|--------------|-------|--------|
| `ensureScheduleCalendar` | Invite flows, sync init | `businessId`, `dashboardId` | Calendar id |
| `syncTimeOffRequestCalendar` | HR controller on PTO change | `timeOffRequestId` | Sync result |
| `syncScheduleShiftsToCalendar` | Scheduling publish | `scheduleId`, `businessId` | Sync result |
| Event CRUD helpers | Internal | Event payloads | Calendar `Event` records |

**Note:** Exact export names documented in WP-07.1 from existing service — not re-audited here; inventory validated in Phase 0A/0B boundary review.

---

## Dependencies

### Upstream dependencies

| Dependency | Why |
|------------|-----|
| **CO-05 identity trust** | Sync targets `EmployeePosition.user` — must be trustworthy |
| **Org chart EP active state** | Inactive EP should not receive calendar events |
| **Calendar module** | Stores `Event` records — Calendar owns recurrence/reminders |
| **HR module installed check** | Scheduling publish creates attendance stubs only when HR present |

### Downstream consumers

| Consumer | Uses bridge for | Must not |
|----------|-----------------|----------|
| **HR** | PTO calendar sync | Own shift planning |
| **Scheduling** | Shift publish calendar sync | Own PTO data |
| **Calendar** | Event storage | Own workforce planning |
| **WC (future)** | Operational hooks on publish events | Replace bridge |

---

## Integration responsibilities

| Party | Responsibility |
|-------|----------------|
| **HR module** | Trigger PTO sync on PTO lifecycle changes; maintain `TimeOffRequest` SoT |
| **Scheduling module** | Trigger shift sync on publish; maintain `ScheduleShift` SoT |
| **hrScheduleService** | Idempotent sync; handle calendar ensure; map EP→user→calendar |
| **Calendar module** | Persist events; recurrence; reminders |
| **BO program** | Maintain contract doc; approve breaking changes |

### Known cross-module write (documented — not Stage 1 scope)

Scheduling `publishSchedule` creates HR `AttendanceRecord` stubs via direct Prisma (COL-2 in boundary review). **Stage 2 recommendation:** move to `hrAttendanceService` API. **Not CO-07 scope** — documented as adjacent risk.

---

## Versioning and breaking-change policy

| Policy | Rule |
|--------|------|
| **Contract version** | Semantic: `hrScheduleService` contract v1.0 at Stage 1 exit |
| **Breaking change** | Requires BO program steward approval + consumer notification (HR, Scheduling, Calendar) |
| **Additive change** | New optional params — minor version bump |
| **Deprecation** | 1 release cycle notice minimum before removal |
| **Testing** | PTO sync + publish sync scenarios in verification (WP-07.4) |

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-07.1** | Bridge contract document | `HR_SCHEDULE_SERVICE_CONTRACT.md` — API surface, inputs, outputs, errors |
| **WP-07.2** | Consumer responsibility matrix | HR / Scheduling / Calendar roles table |
| **WP-07.3** | Versioning + breaking-change policy | Policy section in contract doc |
| **WP-07.4** | Verification scenarios | PTO approve→calendar; publish→calendar; EP inactive edge case |
| **WP-07.5** | Caller inventory | All call sites documented (from 0A/0B findings) |
| **WP-07.6** | COL-2 attendance stub note | Adjacent risk register entry for Stage 2 |

---

## Entry criteria

| Criterion | Required |
|-----------|----------|
| CO-05 identity trust in progress or complete | ✅ |
| `HR_SCHEDULING_BOUNDARY_REVIEW.md` COL-3 reviewed | ✅ |
| Stage 1 Track 1 near-complete | ✅ |

---

## Exit criteria (G07)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Bridge contract document published (WP-07.1) | `HR_SCHEDULE_SERVICE_CONTRACT.md` or equivalent |
| 2 | Consumer matrix complete (WP-07.2) | All three consumers documented |
| 3 | Versioning policy published (WP-07.3) | Breaking-change rules exist |
| 4 | Verification scenarios defined (WP-07.4) | Test plan ready for implementation |
| 5 | Caller inventory complete (WP-07.5) | No undocumented consumers |
| 6 | HR-named ambiguity resolved in documentation | Contract uses neutral language |

---

# Assumptions

- Service remains in HR package for Stage 1 — no move required
- Calendar module ownership of events unchanged
- Recurrence/reminder ownership stays Calendar — not bridge
- PTO and shift data ownership unchanged (HR and Scheduling respectively)
- Bridge is sync-only — not a planning or identity service

---

# Risks

| Risk | Mitigation |
|------|------------|
| HR-named service implies HR owns scheduling sync | WP-07.1 neutral contract language |
| Undocumented callers bypass contract | WP-07.5 caller inventory |
| Identity drift breaks calendar targeting | CO-05 prerequisite; WP-07.4 inactive EP scenario |
| Breaking schema change in Calendar breaks sync | WP-07.3 breaking-change policy |
| COL-2 attendance stub conflated with bridge scope | WP-07.6 — separate Stage 2 item |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-05.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| CO-05 (G02) | **Required** — identity stable for sync targets |
| CO-01 (G03) | Parallel — publish activity events complement sync |
| G09 (Stage 2) | Manager publish depends on stable bridge |
| CO-08 (Stage 2) | Independent — shift templates separate |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Contract doc review | WP-07.1 complete — API, errors, idempotency |
| Consumer matrix review | Each consumer responsibilities explicit |
| Caller inventory audit | WP-07.5 matches 0A/0B known callers |
| Scenario review | WP-07.4 PTO + publish paths covered |
| Versioning review | Breaking-change policy approved by steward |
| Stage 1 exit gate | G07 row satisfied |

---

## Certification statement

**No certification awarded.** Bridge contract plan only.
