# CO-07 hrScheduleService Contract — Engineering Blueprint

**CO:** CO-07 (G07)  
**Status:** Engineering scope — no implementation  
**Last updated:** 2026-06-14  
**Plan source:** [HRSCHEDULESERVICE_CONTRACT_PLAN.md](./HRSCHEDULESERVICE_CONTRACT_PLAN.md)

---

## Purpose

Engineering scope to formalize the `hrScheduleService` bridge contract (~1,014 LOC): ownership, consumers, interfaces, dependencies, and tests. No service extraction (Stage 2+).

---

## Ownership

| Aspect | Owner |
|--------|-------|
| **Service implementation** | Platform / Shared (bridge) |
| **Calendar event semantics** | Calendar module (consumer) |
| **HR time-off source data** | HR module |
| **Schedule publish triggers** | Scheduling module |
| **Contract documentation** | Business Operations program |

**File:** `server/src/services/hrScheduleService.ts`

---

## Consumers (inspection matrix)

| Consumer file | Usage | Read/Write |
|---------------|-------|------------|
| `hrController.ts` | Time-off calendar sync | Write (events) |
| `hrAIActionService.ts` | AI-driven schedule queries | Read |
| `schedulingAdminController.ts` | Publish → calendar sync | Write |
| `schedulingTeamController.ts` | Team publish sync | Write |
| `schedulingEmployeeController.ts` | Employee view sync | Read |
| `businessController.ts` | Business-level calendar hooks | Read/Write |
| Module runtime / provision controllers | Startup provisioning | Read |

**Stage 1 action:** Document each call site; no signature changes unless required for type safety.

---

## Contracts / interfaces

### Planned contract doc (CREATE)

**File:** `docs/business-operations/HR_SCHEDULE_SERVICE_CONTRACT.md`

**Sections:**

1. Purpose and boundary (HR+Scheduling bridge, not WC)
2. Public exports from `hrScheduleService.ts`
3. Input/output types per function
4. Tenant scoping requirements (`businessId`, `dashboardId`)
5. Idempotency rules (publish sync)
6. Error contract
7. Consumer responsibilities
8. Stage 2 extraction hooks (comment only)

### Service header (MODIFY)

Add JSDoc module block at top of `hrScheduleService.ts`:

- `@module bridge`
- `@consumers` list
- `@ownership` Platform
- Link to contract doc

### Type exports (MODIFY if needed)

| Type | Location |
|------|----------|
| `SyncScheduleToCalendarOptions` | Inline or `shared/types/` |
| `TimeOffCalendarEvent` | HR types |
| Bridge result types | Document in contract |

**No new `shared/` package unless existing pattern requires.**

---

## Key functions (document, do not refactor)

Inspection-based function groups to document:

| Group | Examples (grep targets) |
|-------|-------------------------|
| Calendar sync | `syncScheduleToCalendar`, `syncTimeOffToCalendar` |
| Event CRUD | create/update/delete calendar events from schedule |
| Query | get employee schedule overlay, availability |
| Provision | module startup hooks |

Exact function names to be enumerated during implementation from `hrScheduleService.ts` export list.

---

## Dependencies

| Dependency | Direction |
|------------|-----------|
| `prisma` — Schedule, ScheduleShift | Read |
| `prisma` — TimeOffRequest, EmployeeHRProfile | Read |
| Calendar module / events table | Write |
| `EmployeePosition` | Read (identity) |
| CO-05 | EP authority unchanged |
| CO-01 | Publish emits activity; bridge runs after |
| CO-04 | Trashed schedules excluded from sync |

---

## Routes (indirect)

No dedicated hrScheduleService routes. Invoked from:

| Route prefix | Trigger |
|--------------|---------|
| `/api/scheduling/.../publish` | Calendar sync |
| `/api/hr/.../time-off` | Calendar sync |
| `/api/business/...` | Provision hooks |

---

## Models

No schema changes in CO-07.

---

## Migrations

None.

---

## Tests

| Test file (CREATE) | Scope |
|--------------------|-------|
| `server/src/services/__tests__/hrScheduleService.contract.test.ts` | Mock calendar; verify sync inputs/outputs |
| Extend `scheduling-tenant-scope.integration.test.ts` | Publish does not leak cross-tenant |

**Test requirements:**

- Publish sync idempotent (double publish → same event set)
- Trashed schedule → no sync (CO-04 integration)
- Missing `businessId` → throws

---

## Files (exact targets)

| File | Change type |
|------|-------------|
| `server/src/services/hrScheduleService.ts` | MODIFY — header, export docs |
| `docs/business-operations/HR_SCHEDULE_SERVICE_CONTRACT.md` | CREATE |
| `server/src/controllers/scheduling/schedulingAdminController.ts` | DOC — call site comment |
| `server/src/controllers/scheduling/schedulingTeamController.ts` | DOC — call site comment |
| `server/src/controllers/hrController.ts` | DOC — call site comment |
| `server/src/services/hrAIActionService.ts` | DOC — consumer note |
| `server/src/controllers/businessController.ts` | DOC — consumer note |

---

## Entry / exit criteria

| | Criteria |
|---|----------|
| **Entry** | Service LOC and callers identified |
| **Exit** | Contract doc published; all consumers listed; contract test passes |

---

## Assumptions

- No extraction to separate package in Stage 1.
- Calendar module API stable.
- Bridge remains synchronous (no queue) in Stage 1.

---

## Risks

| ID | Risk |
|----|------|
| R-12 | Undocumented caller bypasses contract |
| — | Low operational risk (documentation-focused) |

---

## Dependencies

| CO | Reason |
|----|--------|
| CO-04 | Trashed entity exclusion in sync |
| CO-01 | Publish event ordering |
| None | Contract doc can start immediately |

---

## Verification criteria

- [ ] `HR_SCHEDULE_SERVICE_CONTRACT.md` lists all exports and consumers
- [ ] Each consumer file has call-site reference in contract
- [ ] Contract test covers primary sync path
- [ ] No new callers added without contract update
