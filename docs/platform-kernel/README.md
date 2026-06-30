# Platform Kernel

**Domain:** Activity + Domain Events composite capability  
**Program:** Platform Kernel Program (archived)  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §1

---

## Purpose

Runtime Kernel extensions: module activity federation and domain event bus — Topology Option C.

## Scope

Platform capability (not a product module). Sub-scores: Activity 22/27, Domain Events 21/27.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Status** | [`PLATFORM_KERNEL_STATUS_RECORD.md`](./PLATFORM_KERNEL_STATUS_RECORD.md) |
| Certification | [`PLATFORM_KERNEL_CERTIFICATION_RECORD.md`](./PLATFORM_KERNEL_CERTIFICATION_RECORD.md) |
| Domain events matrix | [`DOMAIN_EVENT_OPERATION_MATRIX.md`](./DOMAIN_EVENT_OPERATION_MATRIX.md) |
| Constitutional parent | [`../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §2–§8 |

## Reference Documents

- [`PLATFORM_KERNEL_PROGRAM_ARCHIVE.md`](./PLATFORM_KERNEL_PROGRAM_ARCHIVE.md)
- [`../architecture/DOMAIN_EVENTS.md`](../architecture/DOMAIN_EVENTS.md)
- [`PLATFORM_ACTIVITY_QUERY_MODEL.md`](./PLATFORM_ACTIVITY_QUERY_MODEL.md)

## Reference Implementations

- Domain event registry (192 types)
- Module activity query federation

## Certification Status

**L2 Certified WITH FINDINGS** — ratified 2026-06-23. Program **archived**.

## Related Domains

- [Analytics](../analytics/) — derived metrics vs activity
- [All L3 modules](../architecture/CERTIFICATION_LEDGER.md) — emit patterns

## Open Decisions

- Stub subscribers env-gating policy
- Activity read migration completion

**Last updated:** 2026-06-29
