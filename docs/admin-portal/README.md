# Admin Portal & Control Plane

**Domain:** Platform operator control plane  
**Program:** Admin Portal (archived)  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §8

---

## Purpose

Operator-facing administration: AI pipeline, marketplace governance, users, security, billing, diagnostics.

## Scope

Control plane surfaces at `/admin-portal` and `/api/admin-portal`. Certification truth lives in `architecture/audits/`.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Reference status** | [`../architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md`](../architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md) |
| Operation matrix | [`../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md`](../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md) |
| Council ratification | [`../architecture/audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md`](../architecture/audits/ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md) |

## Reference Documents

- Phase 0A summaries in [`./`](./) (supporting)
- [`../guides/ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md) — operator how-to
- [`../platform-controller/`](../platform-controller/) — IA reorganization

## Reference Implementations

- AI Pipeline admin hub
- Audit taxonomy
- Provider governance panel

## Certification Status

**L3 Certified** — Control Plane Reference With Findings. Program **archived** 2026-06-18.

## Related Domains

- [Platform Controller](../platform-controller/)
- [AI Platform](../architecture/AI_PIPELINE_ADMIN_TOOLS.md)
- [Marketplace](../marketplace/)

## Open Decisions

- Split doc trees (`admin-portal/` vs `audits/`) — indexed here

**Last updated:** 2026-06-29
