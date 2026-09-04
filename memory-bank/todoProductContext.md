# To-Do Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Todo Level 3 certification review; Calendar product context for event boundary; Scheduling for workforce boundary

---

## Purpose

**To-Do** is Vssyl’s **task / work-item** application: create, organize, assign, track, and complete work across personal and business contexts.

### Naming

| Layer | Name |
|------|------|
| **User-facing product** | **To-Do** |
| **Canonical module id** | `todo` |
| **Entity** | **task** |

Do **not** use `tasks` as the canonical module id (legacy alias only where platform contracts still resolve it).

AI may assist with prioritization or planning suggestions; To-Do’s purpose is **work-item management**, not “an AI product that happens to have tasks.”

## User Value

- One place for personal and work tasks without a separate consumer to-do app for each context
- Clear ownership and assignment so responsibility is visible
- Multiple views for how people plan (list, board, due-date oriented)
- Links to Calendar, Chat, and File Hub without absorbing those products

## Core Product Model

Durable user-facing concepts:

- **Tasks** with lifecycle: create → progress → complete / reopen
- **Priority** and **start / due dates**
- **Assignment** of responsibility to people
- **Subtasks**, **projects**, **dependencies**, and **recurrence** where the product supports them
- **Views:** list, board, and due-date / calendar-style task views (**To-Do’s** views—not the Calendar application)
- **Comments** and collaboration on tasks (especially in business)
- **Notifications** for meaningful task attention (e.g. assignment)
- **Attachments / links** via File Hub where supported
- Soft-delete / trash aligned with Global Trash expectations for tasks

### Assignment depth

To-Do supports assignment as a first-class collaboration concept. How deep assignment goes (lightweight responsibility vs richer workflow execution) is an open product decision; do not treat either extreme as an invariant here.

## Context Behavior

- **Personal:** Tasks owned in the personal context; user manages their own work items.
- **Business:** Shared/team task work with assignment, comments, and business-scoped lists/projects as supported.
- **Household:** Not currently defined as a product invariant (availability may lag Calendar).

## Key Relationships

- **Calendar:** **Calendar owns timed events.** **To-Do owns tasks and due dates.** A bridge may create or link Calendar events for tasks; the **exact create/update policy** (when, which calendar, personal vs business) is an open product decision. Bidirectional sync is not a product invariant.
- **Chat:** Discussion and notifications around tasks; Chat does not own the task record.
- **File Hub:** Attachments and file links.
- **Workforce Scheduling (`scheduling`):** Separate product for shifts and “who works when.” A due date is not a shift.
- **AI / Digital Life Twin:** Suggestions and actions only within the user’s To-Do authority.
- **V_Link:** Tasks may participate in relationships; membership alone does not grant task access.
- **Dashboard:** Optional widgets may project tasks; To-Do remains the system of record.

## Product Invariants

- Module identity remains `todo` / To-Do / task—not a legacy `tasks` module product.
- A To-Do due date must not silently redefine the task as a workforce Scheduling shift.
- A To-Do due-date or calendar-style view must not be confused with the Calendar application’s event time-grid.
- Completing or trashing a task is To-Do lifecycle behavior; it does not delete unrelated Calendar events unless an explicit bridge rule says so (policy open).
- AI suggestions do not expand the user’s authority beyond what To-Do already allows.

## Boundaries

To-Do manages **tasks / work items and due-date planning**.

It does **not** own:

- Workforce **Scheduling**
- The Calendar **event** system of record
- File storage (File Hub)
- Chat conversations as the task store
- Platform notification delivery infrastructure

## Open Product Decisions

1. Assignment depth (lightweight responsibility vs richer workflow execution).
2. Exact Calendar auto-create / update bridge policy (personal vs business; when events are created or synced).
3. Household To-Do scope and readiness.
4. Whether bidirectional task↔event sync is desired product behavior.

## Canonical References

- [`docs/architecture/audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/TODO_LEVEL3_CERTIFICATION_REVIEW.md)
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — Reference Module #4
- [`docs/architecture/WORKSPACE_ROUTING_CONTRACT.md`](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md) — `todo` mounts
- [`memory-bank/calendarProductContext.md`](./calendarProductContext.md) — events vs due dates
- [`memory-bank/driveProductContext.md`](./driveProductContext.md) — File Hub
- [`memory-bank/chatProductContext.md`](./chatProductContext.md)
- Scheduling boundary via Architecture Index / Scheduling operation matrix
