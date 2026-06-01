# Calendar V_Link + Platform Entity — Phase 2B

**Module id:** `calendar`  
**Last updated:** 2026-06-01  
**Status:** Complete  
**Prerequisite:** [CALENDAR_GLOBAL_TRASH_PHASE2A.md](./CALENDAR_GLOBAL_TRASH_PHASE2A.md)

## Summary

Calendar events are registered as a platform entity (`calendar:event` → `CALENDAR_EVENT`). V_Link access and lifecycle follow File Hub / Chat patterns: membership in a V_Link does not grant event content; permanent delete unlinks dangling references.

## Implementation

| Artifact | Path |
|----------|------|
| Platform entity | `registerCalendarPlatformEntities()` in `platformEntityRegistry.ts` |
| Access service | `server/src/services/calendarVlinkAccessService.ts` |
| Lifecycle service | `server/src/services/calendarVlinkLifecycleService.ts` |
| Resolver delegation | `vlinkEntityResolverService.ts` (`CALENDAR_EVENT` case) |
| Permanent delete hook | `calendarTrashService.permanentlyDeleteCalendarEvent` → `unlinkCalendarEventFromAllVLinks` |
| Manifest | `builtInModuleManifests.ts` — `entities[]`, `calendar_reminder` notification |

## Access rules

1. Event must exist and `trashedAt` must be null (trashed → fail closed).
2. Legacy read path: calendar member, personal calendar owner, or event attendee (`userId` or email match).
3. Policy Engine: `CALENDAR_EVENT_READ` via `evaluateCalendarPolicyDual`.
4. V_Link membership is **not** consulted for content access.

## Deferred entities

Not registered (no access/lifecycle semantics yet):

- `calendar` (calendar container)
- `reminder`
- `attendee`
- recurrence instances

## Tests

- `calendarVlinkAccessService.test.ts`
- `calendarVlinkLifecycleService.test.ts`
- `vlinkEntityResolverService.calendar.test.ts`
- `platformEntityRegistry.calendar.test.ts`
- `builtInModuleManifests.calendar.test.ts`
