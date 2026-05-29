# V_Link (Vssyl_Link) architecture

**Status:** Canonical platform layer (Tier 0) — not a marketplace module  
**Constitutional reference:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §5, §21  
**Product context:** [`memory-bank/vlinkProductContext.md`](../../memory-bank/vlinkProductContext.md)

## Non-negotiables

- **Membership does not grant access** to linked entity content
- One primary vlink per entity (v1)
- AI suggestions require user approval
- Archive UX is **separate from Global Trash**

## Key paths

| Area | Location |
|------|----------|
| Schema | `prisma/modules/platform/vlink.prisma` |
| API | `/api/vlinks` |
| Resolver | `server/src/services/vlinkEntityResolverService.ts` |
| AI pipeline | Context source id `vlink` |

## Module integration

Linkable modules must implement resolver cases in `vlinkEntityResolverService` before claiming `vlink` capability. Do not add `VLinkEntityType` enum values without resolver + link permission check.

**Integrated:** drive, calendar. **Pending:** chat, todo, notes, hr, scheduling, place.

**Last updated:** 2026-05-28
