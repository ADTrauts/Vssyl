# Calendar Operation Matrix

**Module id:** `calendar`  
**Status:** Phase 1C complete (2026-06-01) — read paths in `calendarVisibilityService`; side-effect adapters pending Phase 1D  
**Extraction plan:** [CALENDAR_SERVICE_EXTRACTION_PLAN.md](./CALENDAR_SERVICE_EXTRACTION_PLAN.md)  
**Last updated:** 2026-05-31  
**Related:** [CALENDAR_CONSTITUTIONAL_AUDIT.md](./CALENDAR_CONSTITUTIONAL_AUDIT.md), [CHAT_OPERATION_MATRIX.md](./CHAT_OPERATION_MATRIX.md), [FILE_HUB_OPERATION_MATRIX.md](./FILE_HUB_OPERATION_MATRIX.md)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant (service-owned, full side effects) |
| **P** | Partial — works but wrong layer or incomplete |
| **N** | Non-compliant or missing |
| **—** | Not applicable |

**Columns:** PE = Policy Engine; Sched = platform scheduler job

---

## Permission model (current)

- **Calendar access:** `calendarMember` role (`OWNER`, `ADMIN`, `EDITOR`, member).
- **Context:** `enforceCalendarContextMembership` on calendar create; personal calendar `contextId = userId`.
- **Household:** TEEN/CHILD read-only on household calendar writes.
- **Policy Engine:** `calendar:event.create` in `policyActions.ts` — **not implemented** in `policyEngine.ts`.
- **Target (Wave 1):** `calendarPolicyDual` on mutations and visibility reads.

---

## Master operation matrix

| Operation | Controller | Service | PE | Activity | Event | Notification | Sched | Realtime | AI | Notes |
| --------- | ---------- | ------- | -- | -------- | ----- | ------------ | ----- | -------- | -- | ----- |
| **List calendars** | `listCalendars` | `calendarVisibilityService` | P | N | N | N | — | — | — | Phase 1C + `calendarPolicyDual` read filter |
| **Create calendar** | `createCalendar` | `calendarService` | N | N | N | N | — | — | — | Phase 1B — permission via `calendarPermissionService` |
| **Update calendar** | `updateCalendar` | `calendarService` | N | N | N | N | — | — | — | Phase 1B |
| **Delete calendar** | `deleteCalendar` | `calendarService` | N | N | N | N | — | — | — | Phase 1B — hard delete; OWNER only |
| **Auto-provision calendar** | `autoProvisionCalendar` | `calendarService` | N | N | N | N | — | — | — | Phase 1B |
| **List events in range** | `listEventsInRange` | `calendarVisibilityService` | P | N | N | N | — | — | Context | Phase 1C; recurrence via `calendarRecurrenceService` |
| **Search events** | `searchEvents` | `calendarVisibilityService` | P | N | N | N | — | — | — | Phase 1C; scoped calendarIds |
| **Check conflicts** | `checkConflicts` | `calendarVisibilityService` | P | N | N | N | — | — | `check_availability` | Phase 1C; `expandEventsForConflictCheck` |
| **Get free/busy** | `getFreeBusy` | `calendarVisibilityService` | P | N | N | N | — | — | — | Phase 1C; `expandEventsToBusySlots` |
| **Create event** | `createEvent` | `calendarEventService` | N | N | P | P | — | P | `create_event` | Phase 1B persist in service; side effects remain in controller (1D) |
| **Update event** | `updateEvent` | `calendarEventService` | N | N | N | N | — | P | `create_event` (update path) | Phase 1B — THIS/SERIES via `calendarRecurrenceService` |
| **Delete event (soft trash)** | `deleteEvent` | `calendarEventService` | N | N | N | N | — | P | `cancel_event` | Phase 1B |
| **RSVP (auth)** | `rsvpEvent` | `calendarAttendeeService` | N | N | N | N | — | — | `rsvp` | Phase 1B |
| **RSVP (public token)** | `rsvpEventPublic` / route inline | — | N | N | N | N | — | — | — | Token + inline Prisma in route |
| **Import ICS** | `importIcsEvents` | — | N | N | N | N | — | — | — | Bulk create from ICS |
| **Export ICS (events)** | `exportIcsEvents` | — | N | N | N | N | — | — | — | Range export |
| **Export calendar ICS** | `calendarUtils.exportIcs` | — | N | N | N | N | — | — | — | Utils controller |
| **List event comments** | `listComments` | — | N | N | N | N | — | — | — | `eventCommentController` |
| **Add event comment** | `addComment` | — | N | N | N | N | — | — | — | Inline Prisma |
| **Delete event comment** | `deleteComment` | — | N | N | N | N | — | — | — | Inline Prisma |
| **Trash event (Global Trash API)** | — (`trashController`) | — | N | N | N | N | — | — | — | Inline Prisma list/restore/delete |
| **Restore event (Global Trash)** | — (`trashController`) | — | N | N | N | N | — | — | — | No module handler |
| **Permanent delete event** | — (`trashController`) | — | N | N | N | N | — | — | — | Hard delete from trash |
| **Dispatch reminders** | — | `reminderService` | N | N | N | P | P | — | — | Cron `reminder_dispatch`; type `calendar_reminder` |
| **AI upcoming context** | `getUpcomingEventsContext` | — | N | N | N | N | — | — | Provider | Personal calendars only |
| **AI today context** | `getTodayScheduleContext` | — | N | N | N | N | — | — | Provider | Direct Prisma |
| **AI availability** | `checkAvailability` | — | N | N | N | N | — | — | Provider | Overlap query |
| **V_Link resolve event** | — | `vlinkEntityResolverService` | N | N | N | N | — | — | — | `CALENDAR_EVENT`; `trashedAt: null` |
| **Place → calendar link** | `placeMeetingController` | — | N | N | N | N | — | — | — | Integration test exists |
| **Realtime fan-out** | `calendarController` | — | N | N | N | N | — | P | — | `chatSocketService` `calendar_event` |

---

## Operation count summary

| Class | Inventoried rows | C | P | N |
|-------|------------------|---|---|---|
| Calendar CRUD | 5 | 0 | 0 | 5 |
| Event read/query | 4 | 0 | 1 | 3 |
| Event write | 3 | 0 | 3 | 0 |
| RSVP / comments | 5 | 0 | 0 | 5 |
| ICS | 3 | 0 | 0 | 3 |
| Global Trash | 3 | 0 | 0 | 3 |
| Scheduler | 1 | 0 | 1 | 0 |
| AI | 3 | 0 | 0 | 3 |
| V_Link / integrations | 2 | 0 | 1 | 1 |
| **Total** | **29** | **0** | **6** | **23** |

---

## Event coverage (current vs Chat/File Hub target)

| Action | Module activity | Domain event | Target (Wave 1) |
|--------|-----------------|--------------|-----------------|
| Create event | N | `calendar.event.created` (controller) | Both from `calendarEventService` |
| Update event | N | N | `calendar.event.updated` |
| Trash event | N | N | `calendar.event.trashed` |
| Restore event | N | N | `calendar.event.restored` |
| Permanent delete | N | N | `calendar.event.permanentlyDeleted` |
| Create calendar | N | N | Optional `calendar.calendar.created` |
| RSVP | N | N | Optional `calendar.event.rsvp` |
| Reminder fired | N | N | Optional `calendar.reminder.dispatched` |

---

## Notification coverage

| Type | Emitted | In manifest |
|------|---------|-------------|
| `calendar_reminder` | ✅ (cron) | ❌ |
| Email invite/update/cancel | ✅ (SMTP) | ❌ (not in-app catalog) |

---

## Realtime coverage

| Operation | Socket event | Membership check |
|-----------|--------------|------------------|
| Create event | `calendar_event` action `created` | Calendar members queried post-persist |
| Update event | `calendar_event` action `updated` | Same |
| Delete/trash event | `calendar_event` action `deleted` | Same |

---

## Scheduler coverage

| Job ID | Schedule | Calls | Service-owned target |
|--------|----------|-------|----------------------|
| `reminder_dispatch` | `* * * * *` | `dispatchDueReminders(5)` | `calendarReminderService` (proposed) |

---

## Phase 0 gaps (P0 for Wave 1 planning)

1. Extract `calendarEventService` (CRUD + recurrence modes + ICS).
2. Extract `calendarVisibilityService` (list/read/search/AI/free-busy).
3. Extract `calendarTrashService` + register Global Trash handler.
4. Extract `calendarNotificationService` + manifest `notifications[]`.
5. Implement `calendarPolicyDual` + wire `CALENDAR_EVENT_*` actions in policy engine.
6. Migrate `ActionExecutor` off `calendarController`.
7. Move AI context to visibility service.
8. Register `calendar: event` platform entity + `calendarVlinkAccessService` / lifecycle.
9. Expand domain event registry beyond `calendar.event.created`.
10. Add `emitModuleActivityEvent` for writes.
11. Introduce `calendarRealtimeService` adapter.

---

## Target state (post–Calendar Wave 1)

Mirror Chat Level 3 bar:

- **Service** = named `calendar*Service`
- **PE** = `calendarPolicyDual`
- **Activity** = `calendarActivityService`
- **Event** = registered `calendar.*` from services
- **Notification** = `calendarNotificationService` + reminder dispatch delegation
- **Sched** = cron → calendar service only
- **RT** = `calendarRealtimeService`
- **Trash** = `registerGlobalTrashModuleHandler('calendar')`

---

*End of Calendar Operation Matrix — Phase 0.*
