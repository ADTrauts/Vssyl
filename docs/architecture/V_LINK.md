# V_Link (Vssyl_Link) architecture

**Status:** Canonical platform layer (Tier 0) — not a marketplace module  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §5, §21  
**Product context:** [`memory-bank/vlinkProductContext.md`](../../memory-bank/vlinkProductContext.md)  
**Relationship Framework:** [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md) — V_Link = **Association** class ([RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md))

## Non-negotiables

- **Membership does not grant access** to linked entity content
- One primary vlink per entity (v1)
- AI suggestions require user approval
- Archive UX is **separate from Global Trash** ([RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md))

## What V_Link is / is not

| V_Link **is** | V_Link **is not** |
|---------------|-------------------|
| User-curated cross-module **Association** container | Access grant (file share, note share) |
| AI grounding source (`vlink` pipeline catalog id) | Tag system |
| Membership container for collaboration on **vlink metadata** | Module operational links (TaskFileLink, NotebookLink) |

See [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) and [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md).

## Key paths

| Area | Location |
|------|----------|
| Schema | `prisma/modules/platform/vlink.prisma` |
| API | `/api/vlinks` |
| Resolver | `server/src/services/vlinkEntityResolverService.ts` |
| AI pipeline | Context source id `vlink` — `vlinkPipelineContextService.ts` |
| Lifecycle | [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md) — soft-unlink on entity permanent delete |

## Module integration

Linkable modules must implement resolver cases in `vlinkEntityResolverService` (and lifecycle unlink where applicable) before claiming `vlink` capability in manifest. Do not add `VLinkEntityType` enum values without resolver + link permission check.

**Authoritative integration table:** [PLATFORM_ENTITY_MODEL.md](./PLATFORM_ENTITY_MODEL.md) (resolver, lifecycle, manifest, UI).

### Summary (2026-06-14)

| Module | VLinkEntityType(s) | Backend | Manifest `vlink` | Notes |
|--------|-------------------|---------|------------------|-------|
| **drive** | FILE, FOLDER | ✅ | ✅ | Reference implementation ([FH-3A](./audits/FILE_HUB_VLINK_COMPLIANCE.md)) |
| **calendar** | CALENDAR_EVENT | ✅ | ✅ | [Phase 2B](./audits/CALENDAR_VLINK_PHASE2B.md) |
| **chat** | CHAT_CONVERSATION | ✅ | ✅ | CHAT_THREAD deferred |
| **todo** | TASK, TODO | ✅ | ✅ | [Phase 2](./audits/TODO_PHASE2_TRASH_ENTITY_VLINK.md) |
| **place** | PLACE_LISTING, PLACE_MEETING | ✅ | ✅ | `placeVlinkAccessService` |
| **notes** | NOTE | ⚠️ partial inline resolver | ❌ not declared | Dedicated `notesVlinkAccessService` TBD |
| **hr, scheduling** | — | ❌ | ❌ | Not integrated |
| **Enum placeholders** | DASHBOARD, WIDGET, USER, BUSINESS, HOUSEHOLD, MODULE_ENTITY | ❌ | — | No resolver — do not link until implemented |

**UI completeness** may lag backend (hub tabs for chat/task remain partial). **Pending** in this table means **UI or manifest gap**, not necessarily missing resolver.

## AI grounding

- Catalog source: `vlink` / **V_Link Relationships**
- Federation: [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md)
- Pending `VLinkSuggestion` rows **never** ground twin responses
- Persisted V_Links preferred over inference in `entityLinking.ts`

## Historical plan

Implementation phases and non-negotiables origin: [`docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md`](../plans/V_LINK_PLATFORM_LAYER_PLAN.md) (historical — use this doc + PLATFORM_ENTITY_MODEL for current status).

**Last updated:** 2026-06-14
