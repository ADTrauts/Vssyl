# HR–Scheduling Boundary Review

**Phase:** Business Operations Phase 0B — Discovery only  
**Status:** Adjudication of shared workforce surfaces (HR evidence + Scheduling Phase 0A citations)  
**Last updated:** 2026-06-14  
**Authority:** [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) remains canonical; this document **extends/clarifies** HR-side evidence only.  
**Constraint:** Scheduling planning surfaces **not** re-audited.

---

## Source-of-truth alignment

| Rule | Application |
|------|-------------|
| Scheduling-owned rows from boundary doc | **Accepted unchanged** from Phase 0A |
| HR-owned rows | **Validated** with line-level HR evidence |
| Shared rows | **Deepened** with contract notes |
| Unknown rows | **Resolved where HR repo provides proof**; remainder stay Unknown |

---

## Shared capability adjudication

| Capability | Classification | HR evidence | Scheduling evidence (0A) | 0B clarification |
|------------|----------------|-------------|---------------------------|------------------|
| PTO conflict detection | **Shared** | Owns `TimeOffRequest` | Reads on shift create/update | Contract is **read-only** from scheduling; no PE |
| Attendance stubs on publish | **Shared** | Owns `AttendanceRecord` | Writes on `publishSchedule` | **Cross-module write leak** in scheduling controller |
| Calendar sync (PTO) | **Shared** | `syncTimeOffRequestCalendar` | — | HR triggers; calendar stores events |
| Calendar sync (shifts) | **Shared** | `syncScheduleShiftsToCalendar` | Called from publish | HR service name; scheduling triggers |
| Org identity | **Platform + consumed** | `EmployeeHRProfile` → `EmployeePosition` | Shift `employeePositionId` | Identity hub unchanged |
| PTO balances | **HR-owned** | `calculateTimeOffBalance` implemented | — | **Upgrade:** not stub (route comment drift) |
| Timecards | **Partial / HR** | `AttendanceRecord` + punch | — | No named timecard entity |
| Call-offs | **NOT PRESENT** | `ABSENCE` exception type only | — | Stays **Unknown** for workflow |
| Overtime | **NOT PRESENT** | — | — | Stays **Unknown** |

---

## Per-collision deep dive

### COL-1: PTO conflict checks

| Attribute | Detail |
|-----------|--------|
| **HR owns** | `TimeOffRequest` CRUD, approval, balance, calendar sync |
| **Scheduling reads** | `prisma.timeOffRequest.findFirst` on overlapping approved PTO when creating/updating shifts |
| **Evidence** | `schedulingAdminController.ts` ~L864, L1116; `hrController.ts` `requestTimeOff`, `approveTeamTimeOff` |
| **Contract today** | Implicit: scheduling checks `APPROVED` requests overlapping shift window |
| **Gaps** | No shared policy service; partial-day PTO edge cases **UNKNOWN** without runtime QA |
| **Risk** | Medium — logic duplicated if HR adds new time-off types without scheduling update |

**0B verdict:** Boundary doc **Shared** row **confirmed**. Recommend formal integration contract in Strategic Architecture Program (planning only).

---

### COL-2: Attendance stubs created by schedule publish

| Attribute | Detail |
|-----------|--------|
| **HR owns** | `AttendanceRecord` lifecycle, punch in/out, exceptions |
| **Scheduling writes** | On `publishSchedule`, if HR module installed, creates `AttendanceRecord` with `status: MISSED`, `metadata.scheduleShiftId` |
| **Evidence** | `schedulingAdminController.ts:508-559` |
| **Contract today** | Scheduling checks HR installation; dedupes by `metadata.scheduleShiftId` |
| **Gaps** | Write happens in **scheduling controller** via direct Prisma — violates module boundary ideal |
| **Risk** | High for maintainability — HR schema changes can break scheduling publish |

**0B verdict:** Boundary doc **Shared** row **confirmed** with **elevated architectural risk**. Planning recommendation: move stub creation to `hrAttendanceService` API called by scheduling (not 0B scope).

---

### COL-3: `hrScheduleService` ownership

| Attribute | Detail |
|-----------|--------|
| **Package location** | `server/src/services/hrScheduleService.ts` (**1,014 LOC**) |
| **Callers** | HR (`syncTimeOffRequestCalendar` on PTO changes); Scheduling (`syncScheduleShiftsToCalendar` on publish); business invite flows |
| **Responsibilities** | Ensure "Schedule" business calendar; sync PTO events to schedule + personal calendars; sync published shifts to calendars |
| **Calendar ownership** | Calendar module stores `Event` records; HR service creates/updates/deletes |

**0B verdict:** **Shared integration** with **HR-package naming**. Boundary doc row accurate. Long-term neutral service name is a **program decision**, not an HR-module-merge decision.

---

### COL-4: `AttendanceShiftTemplate` vs `ShiftTemplate`

| Model | Module | Table | Purpose (schema evidence) |
|-------|--------|-------|---------------------------|
| `AttendanceShiftTemplate` | HR | `attendance_shift_templates` | Recurring **attendance** expectations; `startMinutes`/`endMinutes`; links to `AttendancePolicy` |
| `ShiftTemplate` | Scheduling | `shift_templates` | Recurring **planning** templates; `defaultStartTime`/`defaultEndTime` strings; links to `ScheduleShift` |

| Attribute | Detail |
|-----------|--------|
| **Collision type** | Naming + conceptual overlap (recurring work periods) |
| **Data link** | **No** foreign key between models |
| **Scheduling template CRUD** | Phase 0A: **501 / empty list stub** |
| **HR template usage** | `AttendanceShiftAssignment` links employees to `AttendanceShiftTemplate` |

**0B verdict:** Boundary doc **High risk** collision **confirmed**. Models serve **different domains** (attendance expectation vs schedule planning) but names confuse integrators.

**CO-08 resolution (2026-06-15):** Tier A accepted — see [SHIFT_TEMPLATE_DOMAIN_DECISION.md](./SHIFT_TEMPLATE_DOMAIN_DECISION.md). Product terminology disambiguates concepts; **no schema merge**. Optional Prisma rename (Tier B) **deferred**.

**Planning recommendation (superseded for Tier A):** rename or namespace (e.g. `AttendanceExpectationTemplate`) remains optional Tier B — not required while decision record and UX rules are in effect.

---

### COL-5: Employee identity through `EmployeePosition`

| Attribute | Detail |
|-----------|--------|
| **Platform** | `EmployeePosition` joins `User` to `Position` in business |
| **HR extension** | `EmployeeHRProfile.employeePositionId` unique 1:1 |
| **Scheduling** | `ScheduleShift.employeePositionId` assignment |
| **PTO** | `TimeOffRequest.employeePositionId` |
| **Attendance** | `AttendanceRecord.employeePositionId` |

**0B verdict:** Boundary doc **Platform-owned identity hub** **confirmed**. HR correctly extends rather than duplicates identity.

---

### COL-6: Calendar sync ownership

| Flow | Owner of action | Owner of storage |
|------|-----------------|------------------|
| PTO approved → calendar events | HR (`syncTimeOffRequestCalendar`) | Calendar `Event`; IDs stored on `TimeOffRequest` |
| Schedule published → shift events | Scheduling triggers; HR service executes | Calendar `Event`; IDs in shift `metadata` |
| Schedule calendar bootstrap | HR (`HRModuleSettings.scheduleCalendarId`) | Calendar `Calendar` record |

**0B verdict:** **Shared** per boundary doc. Recurrence/reminders remain **Calendar-owned** — HR bridge does not implement recurrence rules.

---

### COL-7: Scheduling visibility into HR data

| Data | Scheduling reads? | Evidence |
|------|-------------------|----------|
| Approved PTO | Yes | Shift create/update conflict check |
| Employee positions | Yes | Shift assignment |
| Attendance records | Writes stubs only | Publish side effect |
| HR profiles | No direct evidence | — |
| Onboarding status | No | — |

**0B verdict:** Scheduling visibility is **narrow and intentional** (PTO + position assignment). No broad HR profile mirroring.

---

### COL-8: HR visibility into scheduling data

| Data | HR reads? | Evidence |
|------|-----------|----------|
| Published shifts | Indirect via calendar sync | Events on schedule calendar |
| Availability | No HR API consumption found | — |
| Swap requests | No | — |
| Open shifts | No | |

**HR UI:** `OnboardingSchedulingIntegration.tsx` exists — onboarding task integration; depth **UNKNOWN** without runtime QA.

**0B verdict:** HR module **does not** broadly consume scheduling planning state. Calendar-visible shifts are the primary cross-read path.

---

## Contract gaps (implicit vs documented)

| Gap | Current state | Recommended doc owner |
|-----|---------------|----------------------|
| PTO conflict rules | Code-only in scheduling controller | Workforce integration contract (future) |
| Publish → attendance stub schema | `metadata.scheduleShiftId` convention | HR + Scheduling joint spec |
| Calendar event deletion on unpublish | **UNKNOWN** | 0B did not trace unpublish/delete sync |
| `hrScheduleService` error handling | Logged warnings; publish may succeed if sync fails | Observability program |

---

## Boundary doc update recommendations

| Row / topic | Current boundary doc | 0B recommendation |
|-------------|---------------------|-------------------|
| PTO balances | HR-owned; "verify depth in 0B" | **Confirmed implemented** — update note |
| Timecards | Unknown | **Partial** — `AttendanceRecord` + punch; no timecard entity |
| Call-offs | Unknown | **NOT PRESENT** as workflow; `ABSENCE` exception partial |
| Certifications | Unknown | **NOT PRESENT** workforce cert registry; onboarding TRAINING task only |
| Skills | Unknown | **NOT PRESENT** |
| Attendance anomaly detection | Unknown | **Partial** — exceptions model; no ML anomaly service |
| `hrScheduleService` | Shared; HR package | **Confirmed**; add 0B evidence link |
| Dual template collision | High risk | **Confirmed** with schema differentiation table |
| HR notifications | Platform gap partial | **Clarify:** HR emits several `hr_*` types; scheduling still none |

**Does boundary doc need updates?** **Yes — minor clarifications** on PTO balance depth, timecards partial, and HR notification partial maturity. **No** contradictions to Scheduling-owned rows.

---

## Open questions (defer)

1. Unpublish / delete schedule — are calendar events and attendance stubs removed?
2. Should attendance stub creation move behind `hrAttendanceService.createExpectedFromShift()`?
3. Partial-day PTO vs partial shifts — conflict behavior at runtime?
4. ~~Rename `AttendanceShiftTemplate` — product naming decision~~ **Resolved (Tier A):** [SHIFT_TEMPLATE_DOMAIN_DECISION.md](./SHIFT_TEMPLATE_DOMAIN_DECISION.md)

---

**0B discovery only.** Scheduling planning not re-audited.
