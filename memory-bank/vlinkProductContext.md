# V_Link Product Context

**Status:** Implemented (May 2026) — platform layer, not a marketplace module  
**Canonical plan:** [`docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md`](../docs/plans/V_LINK_PLATFORM_LAYER_PLAN.md)

## Purpose

V_Link is a native operating-layer primitive that lets users connect related items across Vssyl (files, calendar events, future modules). It organizes relationships; **membership does not grant access to linked entity content**.

## Key paths

| Area | Location |
|------|----------|
| Schema | `prisma/modules/platform/vlink.prisma` |
| API | `/api/vlinks` — `server/src/routes/vlinks.ts` |
| Hub UI | `/vlink` — `web/src/components/vlink/VLinkModule.tsx` |
| Sidebar | `web/src/components/vlink/VLinkSidebarButton.tsx` (under AI) |
| AI context | `GET /api/vlinks/ai/context/recent` |

## Non-negotiables

- Membership-only access in v1 (no UNLISTED/code-only anonymous access)
- One primary vlink per entity in v1; schema supports future secondary links
- AI suggestions require user approval; no silent link creation
- Separate archive UX (not Global Trash)
