# Calendar Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** Calendar Level 3 certification review; Scheduling operation matrix for workforce boundary

---

## Purpose

Calendar is Vssyl’s **events and time-grid** application: personal, business, and other verified contextual calendars where people create and manage time-bound events (meetings, reminders, overlays)—not workforce shift planning and not To-Do task management.

## User Value

- One place for life and work **events** in the correct operating context
- Overlays so people can see multiple calendars together or focus on the current context
- Familiar Day / Week / Month / Year browsing of time
- Attachments, attendees, and reminders that connect Calendar to the rest of Vssyl without absorbing those products

## Core Product Model

- **Calendars** bound to operating contexts (personal, business, household where supported)
- **Primary calendars** auto-provisioned for a context; primary personal calendar is durable for the user
- **Events** with start/end (timed or all-day), title, details, location/meeting link as supported
- **Overlays** (combined vs current-context focus)
- **Views:** Day, Week, Month, Year
- **Recurrence** and exceptions at a product level
- **Attendees / RSVP** where supported
- **Reminders** for upcoming events
- **File Hub attachments** on events
- **Permissions** that respect context (e.g. business roles; household Teen/Child read-only write restrictions where enforced)

## Context Behavior

- **Personal:** Main personal calendar; overlay with other calendars the user can see.
- **Business:** Business-context calendars for work events; roles map to edit/view expectations for that business.
- **Household:** Shared household calendars may exist with stronger protection for younger members (read-only for Teen/Child where enforced). Temporary-guest time limits are not currently defined as a product invariant here.
- New events default to the active context’s primary calendar unless the user picks another.

## Key Relationships

- **File Hub:** Event attachments.
- **Chat / Notifications:** Coordination and reminder attention (Calendar owns the event; notifications deliver attention).
- **To-Do:** Tasks may have due dates and may bridge to Calendar events; **To-Do owns tasks and due-date planning**. Calendar owns timed events. A To-Do due-date/calendar view is not the Calendar application.
- **Workforce Scheduling (`scheduling`):** Separate product for who works which shifts. Calendar must not be described as that system.
- **AI:** May assist with events only through normal Calendar authority.

## Product Invariants

- Calendar remains the system of record for **events** on calendars it owns.
- Context-bound calendars must not leak private events across unauthorized contexts.
- Soft-deleted events remain recoverable under Global Trash–aligned lifecycle expectations.
- Calling something a “schedule” in casual language must not redefine Calendar as the workforce Scheduling module.

## Boundaries

Calendar is for **events and time-bound calendar experiences**.

It is **not**:

- Workforce **Scheduling** (shifts, publish, swaps, labor planning)
- The canonical owner of **To-Do** tasks merely because tasks have due dates
- Platform notification infrastructure
- File storage (File Hub)
- Billing tier definitions (entitlements live elsewhere)

## Open Product Decisions

1. Default reminder policy as a permanent product rule vs per-calendar defaults.
2. Which advanced availability features (find-time, multi-user free-busy depth, provider sync, booking links) are committed product vs aspirational.
3. Household guest permission model beyond Teen/Child write restrictions.

## Canonical References

- [`docs/architecture/audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md`](../docs/architecture/audits/CALENDAR_LEVEL3_CERTIFICATION_REVIEW.md)
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — Reference Module #3
- Scheduling boundary: Scheduling operation matrix / `scheduling` module (via Architecture Index) — not an extension of Calendar
- [`memory-bank/todoProductContext.md`](./todoProductContext.md) — tasks vs events
- [`memory-bank/driveProductContext.md`](./driveProductContext.md) — File Hub attachments
