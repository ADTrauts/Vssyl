# Scheduling Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Scheduling operation matrix, workforce identity architecture, Calendar / To-Do / HR ProductContexts

---

## Purpose

Scheduling is Vssyl’s **workforce planning** application:

> who should work, when, and where — for a future plan.

It complements HR’s **attendance** (what actually happened). It is not Calendar and not To-Do.

## User Value

- Build and publish who is expected to work
- Let employees see their upcoming shifts and manage availability preferences
- Support swaps and open-shift claim where the product enables them
- Help managers and admins think about staffing/coverage without turning Scheduling into a generic calendar or task tool

## Core Product Model

Durable concepts:

- **Workforce schedule** — a published or draft plan for a period
- **Shift** — a planned work block assigned (or open) on a schedule
- **Work availability / preferences** — when someone prefers or can work (Scheduling-owned; not PTO)
- **Publish** — making a plan visible/operational for the business
- **Assignment** — placing a person on a shift
- **Swap** and **open-shift claim** — employee-driven shift change patterns where supported
- **Staffing / coverage** — planning concern (fill intent); dedicated coverage workflows may deepen later
- **Visual schedule building** — intent to plan on a visual board (not a component inventory)
- **Work station / resource** and **work location** — where scheduled work happens (see open decisions for exact user language)

### Time-domain distinctions

| Product | Owns |
|--------|------|
| **Scheduling** | Future workforce plan (schedules, shifts) |
| **HR attendance** | What actually happened (punches / past truth) |
| **HR time-off / PTO** | Leave requests and approvals |
| **Calendar** | Events on a time grid |
| **To-Do** | Tasks / work items / due-date planning |

A shift is not a Calendar event and not a To-Do task—even if another product displays related information.

## Context Behavior

- **Business-only.**
- Personas: schedule builders/admins, managers, employees.
- Relies on **organizational placement** (`EmployeePosition`) for who can be scheduled; does not own org structure or HR profiles.

## Key Relationships

- **HR:** References placement and may reference approved time-off for conflict awareness. Does not own PTO or attendance truth. Publish may create attendance expectations; attendance records remain HR’s domain.
- **Org chart:** Placement and reporting for who is schedulable / who manages whom — referenced, not owned.
- **Calendar:** Optional sync target for published shifts; Calendar owns **events**. Automatic “must appear on Calendar” is an open decision.
- **To-Do:** No ownership overlap for shifts.
- **Place:** Scheduling work locations/stations are **not** Vssyl Place listings or graph nodes.
- **Notifications:** Shift/schedule attention events; delivery infrastructure is platform-owned.
- **AI:** May assist suggestions within Scheduling authority; not the system of record.

## Product Invariants

- A shift remains workforce planning; displaying it elsewhere must not redefine it as a Calendar event or To-Do task.
- Work availability preferences remain Scheduling-owned; PTO remains HR-owned unless an explicit integration policy says otherwise.
- A Scheduling work location/station must not automatically become a Vssyl Place listing.
- Changing publish/sync implementation must not collapse Scheduling into HR or Calendar.

## Boundaries

Scheduling does **not** own:

- Employment lifecycle / HR profiles
- PTO request ownership
- Attendance as past truth
- Organizational structure
- Business membership
- Platform authorization (Policy Engine)
- Calendar event SoR
- To-Do tasks
- Vssyl Place graph / facilities / rooms

## Open Product Decisions

1. Depth of manager **coverage** workflows beyond planning intent.
2. Exact user-facing names for work station/resource and work location.
3. Whether published shifts **must** automatically appear in Calendar.
4. Whether approved PTO automatically blocks Scheduling availability.
5. How far open-shift / claim / swap should go as first-class product vs optional capability.

## Canonical References

- [`docs/architecture/audits/SCHEDULING_OPERATION_MATRIX.md`](../docs/architecture/audits/SCHEDULING_OPERATION_MATRIX.md)
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — BO Reference Candidate #6
- [`docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md`](../docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md)
- [`memory-bank/hrProductContext.md`](./hrProductContext.md)
- [`memory-bank/calendarProductContext.md`](./calendarProductContext.md)
- [`memory-bank/todoProductContext.md`](./todoProductContext.md)
- [`memory-bank/vssylPlaceProductContext.md`](./vssylPlaceProductContext.md)
