# Calendar Global Trash — Phase 2A

**Module id:** `calendar`  
**Last updated:** 2026-06-01  
**Status:** Complete

## Summary

Calendar events participate in Global Trash through a canonical `calendarTrashService` and a registered module handler. Event delete (API) remains soft-trash via `calendarEventService.deleteEvent` → `softTrashCalendarEvent`.

## Implementation

| Artifact | Path |
|----------|------|
| Trash service | `server/src/services/calendarTrashService.ts` |
| Handler registration | `server/src/startup/registerGlobalTrashHandlers.ts` (`moduleId: calendar`, `supportedTypes: ['event']`) |
| Controller delegation | `server/src/controllers/trashController.ts` (list/restore/permanent/soft/empty) |
| Event delete path | `server/src/services/calendarEventService.ts` → `softTrashCalendarEvent` |

## Lifecycle events

| Action | Domain event | Module activity |
|--------|--------------|-----------------|
| Soft trash | `calendar.event.trashed` | `event_trashed` |
| Restore | `calendar.event.restored` | `event_restored` |
| Permanent delete | `calendar.event.permanentlyDeleted` | `event_permanently_deleted` |

Legacy `calendar.event.deleted` with `softDelete: true` is **not** emitted on soft trash anymore (use `trashed`).

## Side effects (soft trash)

- `getCalendarForWrite` authorization
- Realtime: `calendar_event` action `deleted` (existing UX)
- Notifications: `sendEventCanceledEmails` (existing delete behavior)
- Visibility reads continue to filter `trashedAt: null`; restore broadcasts `updated` with full event payload

## Tests

- `calendarTrashService.test.ts`
- `trashController.calendar.test.ts`
- `registerGlobalTrashHandlers.calendar.test.ts`
- `trashController.resilience.test.ts` (calendar handler path)
- `calendarEventService.test.ts` (delete delegates to trash service)

## Follow-up (Phase 2B — complete)

- V_Link unlink on permanent delete: [`CALENDAR_VLINK_PHASE2B.md`](./CALENDAR_VLINK_PHASE2B.md)
- Soft trash does not unlink V_Links (links remain restricted via `calendarVlinkAccessService` until restore or permanent delete)
