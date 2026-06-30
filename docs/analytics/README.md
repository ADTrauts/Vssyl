# Analytics Platform Capability

**Domain:** Federated platform analytics (not a product module)  
**Program:** Platform Analytics Capability (archived)  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §6

---

## Purpose

Derived metrics and analytics facades across modules. Hybrid domain primary engine — consumers include Dashboard and Admin Portal.

## Scope

Platform capability certification, ownership model, operation matrix. Not module CRUD surfaces.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Status** | [`ANALYTICS_STATUS_RECORD.md`](./ANALYTICS_STATUS_RECORD.md) |
| Certification | [`ANALYTICS_CERTIFICATION_RECORD.md`](./ANALYTICS_CERTIFICATION_RECORD.md) |
| Ownership | [`ANALYTICS_OWNERSHIP_MODEL.md`](./ANALYTICS_OWNERSHIP_MODEL.md) |
| Operation matrix | [`ANALYTICS_OPERATION_MATRIX.md`](./ANALYTICS_OPERATION_MATRIX.md) |

## Reference Documents

- [`ANALYTICS_EXECUTIVE_SUMMARY.md`](./ANALYTICS_EXECUTIVE_SUMMARY.md)
- [`ANALYTICS_PROGRAM_ARCHIVE.md`](./ANALYTICS_PROGRAM_ARCHIVE.md)
- [`../../memory-bank/analyticsProductContext.md`](../../memory-bank/analyticsProductContext.md)

## Reference Implementations

- Dashboard `dashboardAnalyticsFacade`
- Admin Portal analytics surfaces

## Certification Status

**L2 Certified WITH FINDINGS** — ratified 2026-06-22. Program **archived**. Phase 2 Event Pipeline not authorized.

## Related Domains

- [Dashboard](../dashboard/)
- [Admin Portal](../admin-portal/)
- [Platform Kernel](../platform-kernel/) — activity vs analytics separation

## Open Decisions

- Pseudo-module scope in business workspace stub
- Event pipeline Phase 2 authorization

**Last updated:** 2026-06-29
