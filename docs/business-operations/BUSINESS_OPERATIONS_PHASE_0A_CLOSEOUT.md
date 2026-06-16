# Business Operations Phase 0A Closeout

**Phase:** Business Operations Phase 0A — Scheduling Module Reality Assessment  
**Status:** Complete (discovery only)  
**Last updated:** 2026-06-14  
**Next phases:** 0B HR Assessment · 0C Workforce Communications Assessment

---

## What was inspected

### Scheduling module (primary)

- Prisma models and business scheduling configuration
- Express routes, controllers, middleware, services (`/api/scheduling`)
- Frontend pages, 18 components, API client, hooks, WebSocket integration
- Module registration, AI context, action executors
- Business workspace integration (WS-L1)
- Tests and product documentation
- Comparison against Drive, Chat, Calendar, Business Workspace, and platform constitutional standards

### Cross-domain (secondary)

- HR module overlap (PTO, attendance, profiles, `hrScheduleService`)
- Org chart identity (`EmployeePosition`, `Department`)
- Calendar sync and recurrence/reminder ownership
- Chat realtime and team messaging boundaries
- Workforce Communications gap analysis
- Front-page announcements vs workforce messaging
- Platform capabilities (notifications, activity, trash, V_Link, Policy Engine)

### Reference programs (comparison only — not re-audited)

Architecture Reference, UX Reference, Reference Workspace, Drive UX #1, Notifications UX #2, Todo UX #3, AI Experience UX #4, Calendar UX #5, Place UX-L3, Business Workspace WS-L1, Personal Dashboard WS-L1.

---

## What was found

### Scheduling maturity summary

| Layer | Headline |
|-------|----------|
| **Operational** | Substantial — schedules, shifts, publish, availability, swaps, open-shift claim, visual builder, AI actions |
| **Architectural** | Functional module with constitutional debt — no PE, activity, notifications, V_Link, Global Trash; fat controllers; API stubs |
| **UX** | Usable multi-role UI; fails reference bar on native confirm/prompt and token compliance |
| **Integration** | Real HR/Calendar bridges on publish; manager team routes largely **501** |

### Workforce domain boundary summary

- **Scheduling** and **HR** are separate modules with shared org-chart identity.
- **Workforce Communications** does not exist as a module.
- **Hybrid architecture** emerging: independent modules + shared integration layer (`hrScheduleService`, `EmployeePosition`, platform realtime).
- **~10 capabilities** marked Unknown; **~8 Communications capabilities** NOT PRESENT.

---

## Files created

| # | File | Role |
|---|------|------|
| 1 | [SCHEDULING_OPERATION_MATRIX.md](./SCHEDULING_OPERATION_MATRIX.md) | Operational reality — journeys, operations, flows, evidence |
| 2 | [SCHEDULING_ARCHITECTURE_AUDIT.md](./SCHEDULING_ARCHITECTURE_AUDIT.md) | Architectural reality vs reference patterns |
| 3 | [SCHEDULING_UX_AUDIT.md](./SCHEDULING_UX_AUDIT.md) | UX reality — 11-category assessment |
| 4 | [SCHEDULING_STRATEGIC_POSITIONING.md](./SCHEDULING_STRATEGIC_POSITIONING.md) | Strategic positioning and open questions |
| 5 | [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md) | **Canonical ownership reference** for 0B/0C |
| 6 | [BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md](./BUSINESS_OPERATIONS_PHASE_0A_CLOSEOUT.md) | This document |
| 7 | [BUSINESS_OPERATIONS_CAPABILITY_MAP.md](./BUSINESS_OPERATIONS_CAPABILITY_MAP.md) | **Executive entry point** (5–10 min read) |

**Stakeholder entry:** Start with [BUSINESS_OPERATIONS_CAPABILITY_MAP.md](./BUSINESS_OPERATIONS_CAPABILITY_MAP.md).

---

## Key conclusions

1. **Scheduling is a standalone built-in module** — not an HR or Calendar extension.
2. **Core planning workflows work** for admin and employee paths; **manager and several admin list endpoints are stubs**.
3. **Platform constitutional gaps** are confirmed: activity, notifications, Policy Engine, V_Link, Global Trash.
4. **Workforce Communications is absent** — scheduling realtime is UI sync, not operational messaging.
5. **Hybrid model (C)** best describes repository reality today: separate modules + shared integration layer.
6. **Phase 0A is discovery-complete** — ready to inform modernization *planning*, not certification or implementation.

---

## Workforce Domain Boundary findings

### Classification distribution

| Classification | Approx. count |
|----------------|---------------|
| Scheduling-owned | 14 |
| HR-owned | 16 |
| Calendar-owned | 5 |
| Workforce Communications-owned | 0 (module not present) |
| Shared | 12 |
| Platform-owned | 8 |
| Unknown | 10 |

### Top ownership collisions

| Collision | Impact |
|-----------|--------|
| PTO interactions | HR owns data; scheduling enforces on assign — **Shared** |
| Attendance interactions | HR owns records; scheduling creates stubs on publish — **Shared** |
| Calendar synchronization | `hrScheduleService` in HR package — **Shared** |
| Org hierarchy ownership | Org chart primary; HR/scheduling consume — **Platform/Shared** |
| Shift communications | Socket broadcasts only; no comms product — **Unknown / gap** |
| Dual shift-template models | `AttendanceShiftTemplate` vs `ShiftTemplate` — **HR + Scheduling** |

### Capabilities with no owner today

- Shift bidding
- Coverage request workflow
- Workforce broadcasts
- Emergency alerts
- Call-offs (explicit)
- Timecards (named entity)
- Overtime tracking
- Skills registry
- Workforce read receipts

---

## Implications for Phase 0B — HR Assessment

**Scope using [WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md](./WORKFORCE_DOMAIN_BOUNDARY_ANALYSIS.md):**

- Validate all **HR-owned** and **Shared** rows in Employee Management, Time Management, and relevant Platform Features.
- **Do not** re-audit scheduling planning surfaces (schedules, shifts, availability CRUD, visual builder).
- **Focus areas:**
  - `EmployeeHRProfile` and employee admin lifecycle
  - PTO request/approval/balance depth
  - Attendance policies, clock-in/out, exceptions
  - `AttendanceShiftTemplate` vs Scheduling `ShiftTemplate` naming collision
  - `hrScheduleService` — document as shared bridge; assess long-term ownership
  - HR notification types and constitutional compliance (activity, PE, trash)
  - Unknown rows: call-offs, timecards, overtime, certifications, skills
  - HR analytics overlap with scheduling UI analytics

**Accept from Phase 0A:**

- Scheduling reads `TimeOffRequest` for conflict detection
- Scheduling creates `AttendanceRecord` stubs on publish when HR is installed

---

## Implications for Phase 0C — Workforce Communications Assessment

**Scope using boundary doc Communications section:**

- All capabilities marked **NOT PRESENT** or **Unknown** in Communications group
- Resolve: new module vs Chat extension vs notifications fan-out
- Explicit boundary: **scheduling realtime ≠ workforce communications**
- Assess front-page `companyAnnouncements` — migrate, extend, or replace
- Department targeting via org-chart `Department`
- Integration hooks: schedule publish, coverage gaps, emergency scenarios
- Read receipts — distinguish Chat message read vs operational workforce receipt

---

## Readiness for modernization planning

| Question | Answer |
|----------|--------|
| Is Scheduling understood? | **Yes** — operational, architectural, UX, and strategic docs complete |
| Is ownership mapped? | **Yes** — boundary analysis is canonical for 0B/0C |
| Is Scheduling ready for certification? | **No** — constitutional gaps and stubs |
| Is Scheduling ready for implementation waves? | **No** — Phase 0A is discovery only; planning may begin with stub/contract inventory |
| Are 0B/0C scoped? | **Yes** — boundary doc defines what each phase owns |

**Caveats for any future planning:**

- Manager API stubs must be in scope before manager workflow modernization
- `schedulingProductContext.md` overstates maturity — use Phase 0A docs as truth
- Do not merge Workforce Communications into scheduling module without Phase 0C assessment

---

## Recommended sequencing after Phase 0A

| Step | Action |
|------|--------|
| 1 | Publish all 7 Phase 0A artifacts; stakeholders read **Capability Map** first |
| 2 | **Phase 0B — HR Module Reality Assessment** (scoped by boundary doc HR + Shared rows) |
| 3 | **Phase 0C — Workforce Communications Assessment** (scoped by Communications NOT PRESENT rows) |
| 4 | **Business Operations Strategic Architecture Program** — synthesize 0A + 0B + 0C using boundary doc and capability map as canonical references |

---

## Follow-on high-level recommendations

### HR Modernization Program (Phase 0B preview)

- Employee profiles and employment lifecycle
- PTO policies, balances, approvals — full depth audit
- Attendance, timecards, call-offs, overtime — resolve Unknown rows
- Org hierarchy extension points and manager relationships
- `hrScheduleService` bridge formalization
- Constitutional alignment (activity, notifications, PE, trash)
- Resolve `AttendanceShiftTemplate` naming collision with scheduling

### Workforce Communications Program (Phase 0C preview)

- Department and workforce broadcasts
- Emergency alerts
- Shift and coverage operational messaging
- Read receipts for operational messages
- Chat integration model (extend vs separate)
- Notifications integration for workforce events
- Department targeting via org hierarchy

---

## Key risks (carried forward)

1. Docs/code drift in `schedulingProductContext.md`
2. Manager UI backed by 501 APIs
3. Admin swap list empty stub
4. Constitutional debt (activity, notifications, PE, V_Link, trash)
5. Dual shift-template model confusion
6. No workforce messaging layer for schedule changes
7. Single integration test for scheduling
8. Ownership re-discovery without boundary doc discipline

---

## Certification statement

**No certification awarded.** Phase 0A is discovery and documentation only. No modernization waves defined.
