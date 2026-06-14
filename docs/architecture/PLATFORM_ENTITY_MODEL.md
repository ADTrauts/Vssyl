# Platform entity model

**Status:** Contract standard (Tier 0 entity registry)  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §21  
**Relationship Framework:** [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md)

## Principle

Modules **own** Prisma schemas. Platform infrastructure operates on **`(entityType, entityId, moduleId)`** contracts — no universal entity table in v1.

V_Link attachments are **Association** relationships ([RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md)); lifecycle rules in [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md) and [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md).

## Entity classes

| Class | Examples |
|-------|----------|
| Full platform entity | File, calendar event, chat conversation, task, note/page |
| Lightweight | Widget instance, chat message |
| Not an entity | Optimistic UI state, runtime availability |

## Registration (modules opt in)

1. Declare types in manifest `entities[]`
2. Implement `*VlinkAccessService` + resolver case in `vlinkEntityResolverService.ts`
3. Implement lifecycle unlink on permanent delete where V_Link linkable
4. Trash handler, domain events, optional SearchProvider

**Startup registry:** `server/src/startup/registerPlatformEntities.ts`

| moduleId | entityTypes (registry) |
|----------|------------------------|
| drive | file, folder |
| chat | conversation |
| calendar | event |
| todo | task |
| notes | page |
| notebook | page |
| place | listing, meeting |

## V_Link integration truth table

**Maintained as single source of truth** for resolver vs manifest vs UI. Other docs (e.g. `V_LINK.md`) summarize and link here.

| VLinkEntityType | moduleId | Taxonomy (V_Link role) | Resolver | Lifecycle unlink | Trash | Search | Manifest `vlink` | Hub / module UI |
|-----------------|----------|------------------------|----------|------------------|-------|--------|------------------|-----------------|
| FILE | drive | Association | ✅ `driveVlinkAccessService` | ✅ permanent delete | ✅ | ✅ | ✅ | ✅ |
| FOLDER | drive | Association | ✅ | ✅ tree unlink | ✅ | partial | ✅ | partial |
| CALENDAR_EVENT | calendar | Association | ✅ `calendarVlinkAccessService` | ✅ | ✅ | ✅ | ✅ | ✅ |
| CHAT_CONVERSATION | chat | Association | ✅ `chatVlinkAccessService` | ✅ | ✅ | ✅ | ✅ | partial (hub tabs) |
| CHAT_THREAD | chat | — | ❌ deferred | partial | partial | partial | — | not registered |
| TASK / TODO | todo | Association | ✅ `todoVlinkAccessService` | ✅ | ✅ | ✅ | ✅ | partial |
| NOTE | notes | Association | ⚠️ inline in resolver | ❌ dedicated service TBD | ⚠️ `deletedAt` legacy | partial | ❌ not declared | pending |
| PLACE_LISTING | place | Association | ✅ `placeVlinkAccessService` | ✅ | ✅ | partial | ✅ | partial |
| PLACE_MEETING | place | Association | ✅ | ✅ | ✅ | partial | ✅ | partial |
| DASHBOARD | dashboard | — | ❌ | tab trash only | ✅ | ✅ | ❌ | N/A |
| WIDGET | dashboard | — | ❌ | ❌ | ❌ | ❌ | ❌ | lightweight |
| USER, BUSINESS, HOUSEHOLD, MODULE_ENTITY | — | — | ❌ enum placeholders | — | — | — | — | — |

Do not add enum values without resolver + link permission + lifecycle policy.

### Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped and aligned with Relationship Framework lifecycle rules |
| ⚠️ | Partial — documented gap with remediation path |
| ❌ | Not implemented or explicitly deferred |

## Alias table (normalize over time)

| V_Link enum | Registry key | Activity targetType | Domain event entity |
|-------------|--------------|---------------------|---------------------|
| FILE | drive:file | file | File |
| FOLDER | drive:folder | folder | Folder |
| CALENDAR_EVENT | calendar:event | event | CalendarEvent |
| CHAT_CONVERSATION | chat:conversation | conversation | — |
| TASK / TODO | todo:task | task | — |
| NOTE | notes:page / notebook:page | page | — |
| PLACE_LISTING | place:listing | listing | — |
| PLACE_MEETING | place:meeting | meeting | — |

## Related documents

| Topic | Document |
|-------|----------|
| V_Link summary | [V_LINK.md](./V_LINK.md) |
| Ownership / SoR | [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) |
| Doc corrections | [audits/RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md](./audits/RELATIONSHIP_DOCUMENTATION_CORRECTION_PLAN.md) |

**Last updated:** 2026-06-14
