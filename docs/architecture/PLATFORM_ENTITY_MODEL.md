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
2. Implement `*VlinkAccessService` + resolver case in `vlinkEntityResolverService.ts` when V_Link linkable
3. Implement lifecycle unlink on permanent delete where V_Link linkable
4. Trash handler, domain events, optional SearchProvider

**Startup registry:** `server/src/startup/registerPlatformEntities.ts` → `platformEntityRegistry.ts`

Descriptor fields today (`PlatformEntityDescriptor`): `entityType`, `moduleId`, `displayName`, `pluralName`, optional `vlinkEntityType`, `supportsTrash`, `supportsSearch`, `activityTargetType`.

| moduleId | entityTypes (registry) |
|----------|------------------------|
| drive | file, folder |
| chat | conversation |
| calendar | event |
| todo | task |
| notes | page |
| notebook | page |
| place | listing, meeting |

---

## Entity metadata consistency (Phase 3B)

Descriptor flags are **descriptive metadata**, not executable runtime gates.

### Search

| Layer | Role |
|-------|------|
| Module `capabilities.search: true` | Claims Unified Search **participation contract** |
| Manifest `entities[].supportsSearch` | Declares searchable **intent** for that entity type |
| Registry `supportsSearch` | Same intent as descriptor metadata — should stay consistent with manifest |
| SearchProvider readiness / registration | **Runtime inclusion gate** for Unified Search |

**Runtime gate:** Unified Search runs a domain because a valid SearchProvider/delegate is registered and **ready** under the Search contract ([`SEARCH_PROVIDER_MODEL.md`](./SEARCH_PROVIDER_MODEL.md), Search Constitution). Entity metadata does **not** activate Search.

**Metadata truthfulness:** If an entity is intentionally searchable through a ready SearchProvider, canonical descriptor metadata (`supportsSearch`) **should** truthfully represent that intent unless an explicitly documented exception applies.

**Consistency rule (expected):**

| Module claim | Entity metadata | Live provider | Status |
|--------------|-----------------|---------------|--------|
| `search: true` | `supportsSearch: true` for searchable types | Ready provider | **Consistent** |
| `search: true` | `supportsSearch: false` while provider ready | Ready provider | **Metadata drift** (fix metadata; do not disable Search solely for the flag) |
| `search: false` / omitted | any | No ready provider | Consistent non-participation |
| `search: false` | true | Ready provider | **Claim drift** — fix claim or retire provider |

**Known implementation drift (do not fix in Phase 3B):** Scheduling has a ready SearchProvider and manifest searchable entities, while registry `supportsSearch` remains `false` for scheduling entity types — representation debt to correct later.

### Analogous flags (same descriptive rule)

| Flag / field | Executable gate | Consistency expectation |
|--------------|-----------------|-------------------------|
| `supportsTrash` + `capabilities.trash` | Global Trash **handlers** + soft-delete paths ([`GLOBAL_TRASH.md`](./GLOBAL_TRASH.md)) | Descriptor should match trash participation intent |
| `vlinkEntityType` + `capabilities.vlink` | Resolver + access/lifecycle ([`V_LINK.md`](./V_LINK.md)) | Do not claim `vlink` without resolver coverage; descriptors should list linkable types |
| Preview | Module preview surfaces when `preview` claimed | Align when preview entity metadata exists; no separate registry preview flag today |

Do not invent new descriptor flags in this phase.

---

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
| Search inclusion | [SEARCH_PROVIDER_MODEL.md](./SEARCH_PROVIDER_MODEL.md) |
| Participation composition | [APPLICATION_PARTICIPATION_COMPOSITION.md](./APPLICATION_PARTICIPATION_COMPOSITION.md) |

**Last updated:** 2026-09-08 (entity metadata consistency — Phase 3B)
