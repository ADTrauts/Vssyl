# Scheduling Strategic Positioning

**Module id:** `scheduling`  
**Phase:** Business Operations Phase 0A — Discovery only  
**Last updated:** 2026-06-14  
**Related:** [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md), [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md)

---

## What Scheduling is today (confirmed facts)

Repository evidence confirms Scheduling is a **standalone first-party built-in module** (`scheduling`):

- Isolated Prisma module (`prisma/modules/scheduling/core.prisma`)
- Dedicated API mount (`/api/scheduling`)
- Marketplace registration (`seedSchedulingModule.ts`)
- Business workspace hub (`SchedulingLayout` via `businessWorkspaceContracts.ts`)
- Distinct product intent: **future workforce planning** vs HR **past attendance tracking** (`memory-bank/schedulingProductContext.md`)

Scheduling is **not** an HR extension, Calendar extension, or platform-only capability — though it **consumes** HR and Calendar via integration bridges.

---

## Module model evaluation

| Model | Verdict | Evidence |
|-------|---------|----------|
| **Standalone module** | **Keep** | Separate module id, schema, routes, UI, manifest |
| **HR extension** | **Reject** | HR owns PTO, attendance, profiles; scheduling reads/writes integration points only |
| **Calendar extension** | **Reject** | Calendar owns events, recurrence, reminders; scheduling syncs published shifts via `hrScheduleService` |
| **Platform capability** | **Partial** | Realtime rooms and AI routing use platform infrastructure; domain data stays in scheduling module |
| **Hybrid Workforce Operations domain** | **Future program umbrella** | Coordinate Scheduling + HR + Workforce Comms without merging codebases |

Canonical cross-module ownership: [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md).

---

## Capability evaluation

| Capability area | Current state | Owner | Notes |
|-----------------|---------------|-------|-------|
| Employee scheduling | MEDIUM maturity | Scheduling | Core CRUD + visual builder |
| Shift bidding | NOT PRESENT | Unknown | No models/routes |
| Coverage requests | LOW / UNKNOWN | Scheduling (AI context only) | No workflow model |
| Availability management | MEDIUM | Scheduling | Employee CRUD; admin update 501 |
| PTO integration | MEDIUM | Shared | Scheduling reads HR; does not own PTO |
| Attendance integration | MEDIUM | Shared | Publish creates HR `AttendanceRecord` stubs |
| Labor forecasting | LOW | Scheduling (stub) | Analytics 501 |
| Calendar integration | MEDIUM | Shared | `hrScheduleService` bridge |
| Internal communications | NOT PRESENT | Workforce Comms (future) | Realtime ≠ comms |
| AI workforce optimization | MEDIUM | Scheduling | 2 actions; philosophy engine |
| Cross-business scheduling | NOT PRESENT | Unknown | No evidence |
| Workforce marketplace / open shift marketplace | LOW | Scheduling | Employee claim works; manager assign 501 |
| Org hierarchy / department dependency | MEDIUM | Shared (org chart) | `EmployeePosition`, `Department` consumed |
| Place integration | UNKNOWN | — | `JobLocation` is scheduling-local; no Place module tie found |
| V_Link integration | NOT PRESENT | Platform (future) | `V_LINK.md` lists scheduling as not integrated |

---

## Recommended future vision (discovery recommendation — not implementation)

Scheduling should remain the **workforce planning domain module** responsible for:

1. **When people should work** — schedules, shifts, templates, stations, coverage views
2. **Employee scheduling preferences** — availability, swap requests, open-shift claiming
3. **Planning intelligence** — AI generation, assignment suggestions, conflict/coverage context
4. **Publishing planned work** — `DRAFT` → `PUBLISHED` with downstream sync contracts

Scheduling should **not** own:

- PTO balances, approvals, or time-off policy (HR)
- Clock-in/out, timecards, attendance exceptions (HR)
- Calendar recurrence/reminder infrastructure (Calendar)
- Workforce broadcasts, emergency alerts, read receipts (future Workforce Communications)
- Employee identity / org structure (org chart platform)

---

## Recommended architecture ownership

| Layer | Recommended owner |
|-------|-------------------|
| Planning data (`Schedule`, `ScheduleShift`, etc.) | Scheduling module |
| Employee identity (`EmployeePosition`) | Org chart (platform/business) |
| HR profile extensions | HR module |
| Calendar event projection | Calendar module (sync via defined bridge) |
| Calendar bridge service | **Shared** — resolve `hrScheduleService` ownership in boundary doc |
| Realtime UI sync | Platform (`chatSocketService`) + scheduling event contracts |
| Notifications for schedule events | Scheduling module emitters → platform `NotificationService` |
| Activity audit | Scheduling module → platform activity envelope |
| V_Link entities (`Schedule`, `Shift`) | Scheduling module (future) |

---

## Recommended domain boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                  SCHEDULING DOMAIN (planning)                 │
│  Schedules · Shifts · Availability · Swaps · Open shifts    │
│  Stations · Job locations · AI planning                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ integration contracts
┌──────────────────────────▼──────────────────────────────────┐
│  ORG CHART (identity)  │  HR (time/people)  │  CALENDAR (events) │
│  EmployeePosition      │  PTO · Attendance   │  Synced shifts/PTO │
└──────────────────────────┴────────────────────┴───────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│     WORKFORCE COMMUNICATIONS (future — NOT PRESENT today)      │
│  Shift broadcasts · Coverage alerts · Emergency messaging      │
└───────────────────────────────────────────────────────────────┘
```

---

## Recommended integration model

| Integration | Pattern | Direction |
|-------------|---------|-----------|
| PTO conflict | Read-only query | Scheduling → HR `TimeOffRequest` |
| Publish → attendance expectation | Write stub records | Scheduling → HR `AttendanceRecord` (when HR installed) |
| Publish → calendar visibility | Sync events | Scheduling → `hrScheduleService` → Calendar |
| Org structure | FK references | Scheduling → `EmployeePosition`, `Department`, `Position` |
| Realtime | Socket broadcasts | Scheduling controllers → `chatSocketService` |
| AI context | Module providers | Scheduling → AI platform |
| Future comms | Event subscription | Scheduling domain events → Workforce Comms (not present) |

---

## Modernization priorities (ordered — not waves)

Discovery sequencing for future programs (no implementation in Phase 0A):

1. **Constitutional alignment** — activity events, notification types, Global Trash, Policy Engine
2. **Complete API stubs** — manager team routes, shift templates, admin swap list, admin availability update
3. **Service extraction** — canonical scheduling services (Calendar/Chat reference pattern)
4. **Integration contract clarity** — formalize `hrScheduleService` as shared bridge with documented API
5. **UX standardization** — tokens, confirm/prompt removal, manager dead-end guards
6. **V_Link entity registration** — when relationship framework extends to workforce entities
7. **Workforce Communications module** — separate program; do not fold into scheduling

---

## Open architectural questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should `hrScheduleService` move to neutral `workforceCalendarBridgeService`? | Open |
| 2 | Should HR `AttendanceShiftTemplate` merge conceptually with Scheduling `ShiftTemplate`? | Open — naming collision today |
| 3 | Should manager publish delegate to admin `publishSchedule` or diverge? | Open — manager route is 501 |
| 4 | Where should labor/coverage analytics live — scheduling module or platform analytics? | Open |
| 5 | Is shift bidding in scope for scheduling or a marketplace feature? | Unknown — not in repo |
| 6 | Should coverage requests be a scheduling workflow or comms-triggered workflow? | Unknown |
| 7 | Cross-business scheduling — multi-tenant business boundary or new domain? | Unknown |

---

## Confirmed facts vs recommendations

### Confirmed facts

- Scheduling exists as standalone module with substantial UI and API.
- Multiple integration points with HR and Calendar are implemented on publish/assign paths.
- Workforce Communications does not exist as a module.
- Platform constitutional gaps are documented in architecture audit.

### Recommendations (strategic — not implementation)

- Preserve standalone scheduling module; expand via integration contracts, not absorption into HR.
- Launch Workforce Communications as separate domain when Phase 0C completes assessment.
- Treat `WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md` as ownership authority before any cross-module refactor.
