# Platform entity model

**Status:** Contract standard (Tier 0 entity registry)  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §21

## Principle

Modules **own** Prisma schemas. Platform infrastructure operates on **`(entityType, entityId, moduleId)`** contracts — no universal entity table in v1.

## Entity classes

| Class | Examples |
|-------|----------|
| Full platform entity | File, calendar event, chat conversation, task, note |
| Lightweight | Widget instance, chat message |
| Not an entity | Optimistic UI state, runtime availability |

## Registration (modules opt in)

1. Declare types in manifest `entities[]` (Batch 2 schema)
2. Implement resolver in `vlinkEntityResolverService` or module adapter
3. Trash handler, events, optional SearchProvider

## Resolver gap (audit)

`VLinkEntityType` enum vs `vlinkEntityResolverService` implementation:

| VLinkEntityType | Module | Resolver | Trash | Search | V_Link UI |
|-----------------|--------|----------|-------|--------|-----------|
| FILE | drive | ✅ | ✅ | ✅ | ✅ |
| FOLDER | drive | ✅ | ✅ | ✅ | partial |
| CALENDAR_EVENT | calendar | ✅ | ✅ | partial | ✅ |
| CHAT_CONVERSATION | chat | ✅ (`chatVlinkAccessService`) | ✅ | ✅ | conversation only |
| CHAT_THREAD | chat | ❌ deferred | partial | partial | not registered |
| TASK / TODO | todo | ❌ | ✅ | ❌ | pending |
| NOTE | notes | ❌ | ❌ deletedAt | ❌ | pending |
| DASHBOARD | dashboard | ❌ | ✅ tab trash | ✅ | N/A |
| WIDGET | dashboard | ❌ | ❌ | ❌ | lightweight |
| PLACE / LOCATION | place | ❌ | ❌ | partial | pending |

Do not add enum values without resolver + link permission implementation.

## Alias table (normalize over time)

| V_Link enum | Activity targetType | Domain event |
|-------------|---------------------|--------------|
| FILE | file | File |
| CALENDAR_EVENT | event | CalendarEvent |

**Last updated:** 2026-05-28
