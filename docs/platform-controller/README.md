# Platform Controller

**Domain:** Admin Portal information architecture modernization  
**Program:** Platform Controller Program — Phase 1B complete  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §8

---

## Purpose

Reorganized operator navigation: Platform Programs hub, consolidated diagnostics, Configuration domain — without new dashboards.

## Scope

IA and navigation model for `/admin-portal/*`. Inherits Admin Portal L3 certification.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Information architecture** | [`PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md`](./PLATFORM_CONTROLLER_INFORMATION_ARCHITECTURE.md) |
| Navigation model | [`PLATFORM_CONTROLLER_NAVIGATION_MODEL.md`](./PLATFORM_CONTROLLER_NAVIGATION_MODEL.md) |
| Programs hub | [`PLATFORM_PROGRAMS_HUB_DESIGN.md`](./PLATFORM_PROGRAMS_HUB_DESIGN.md) |

## Reference Documents

- [`PLATFORM_CONTROLLER_IMPLEMENTATION.md`](./PLATFORM_CONTROLLER_IMPLEMENTATION.md)
- [`PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md`](./PLATFORM_CONTROLLER_UX_SIMPLIFICATION.md)
- [`../admin-portal/`](../admin-portal/) — certification truth

## Reference Implementations

- `web/src/config/platformControllerNavigation.ts`

## Certification Status

Inherits **Admin Portal L3**. IA Phase 1B implemented 2026-06-24.

## Related Domains

- [Admin Portal](../admin-portal/)
- [Platform Portfolio](../platform-portfolio/)

## Open Decisions

- Route prefix remains `/admin-portal/*` (by design)

**Last updated:** 2026-06-29
