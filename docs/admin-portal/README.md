# Admin Portal & Control Plane

**Domain:** Platform operator control plane  
**Program:** Admin Portal Reference Program — Operational Excellence Phase 0A  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §8

---

## Purpose

Operator-facing administration: AI pipeline, marketplace governance, users, security, billing, diagnostics. The Admin Portal is Vssyl's **single operational cockpit** target for running the platform as a SaaS.

## Scope

Control plane surfaces at `/admin-portal` and `/api/admin-portal`. Certification truth lives in `architecture/audits/`; Operational Excellence assessments live here.

## Phase 0A Deliverables (2026-07-05)

| Document | Purpose |
|----------|---------|
| [Reference Program Executive Summary](./ADMIN_PORTAL_REFERENCE_PROGRAM_EXECUTIVE_SUMMARY.md) | Bottom-line verdict and council decisions |
| [Reference Assessment](./ADMIN_PORTAL_REFERENCE_ASSESSMENT.md) | Full inventory and reality assessment |
| [Operational Model](./ADMIN_PORTAL_OPERATIONAL_MODEL.md) | Personas, workflows, consolidation rules |
| [Capability Matrix](./ADMIN_PORTAL_CAPABILITY_MATRIX.md) | Per-capability Complete / Modernize / Missing |
| [UX Audit](./ADMIN_PORTAL_UX_AUDIT.md) | Navigation, efficiency, consistency |
| [Information Architecture](./ADMIN_PORTAL_INFORMATION_ARCHITECTURE.md) | Nav map, API IA, target state |
| [Modernization Plan](./ADMIN_PORTAL_MODERNIZATION_PLAN.md) | Consolidation waves 0–4 |

## Prior assessments (still valid reference)

| Document | Notes |
|----------|-------|
| [Reality Assessment (June)](./ADMIN_PORTAL_REALITY_ASSESSMENT.md) | Pre–Platform Programs hub baseline |
| [Strategic Positioning](./ADMIN_PORTAL_STRATEGIC_POSITIONING.md) | Hybrid governance + command center |
| [Marketplace Governance Review](./ADMIN_PORTAL_MARKETPLACE_GOVERNANCE_REVIEW.md) | Pilot cohort governance |
| [Architecture Audit](./ADMIN_PORTAL_ARCHITECTURE_AUDIT.md) | June architecture closeout |

## Source of Truth

| Topic | Document |
|-------|----------|
| **Reference status** | [`../architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md`](../architecture/audits/ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md) |
| Operation matrix | [`../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md`](../architecture/audits/ADMIN_PORTAL_OPERATION_MATRIX.md) |
| Operator how-to | [`../guides/ADMIN_PORTAL.md`](../guides/ADMIN_PORTAL.md) |

## Certification Status

**L3 Certified** — Control Plane Reference With Findings (2026-06-18).  
**Operational Excellence recertification** recommended after Modernization Waves 1–2.

## Verdict (Phase 0A)

**Yes** — Admin Portal can become the single operational cockpit (**~82% today**, **~92%** after consolidation). See [Executive Summary](./ADMIN_PORTAL_REFERENCE_PROGRAM_EXECUTIVE_SUMMARY.md).

## Related Domains

- [Launch Readiness](../launch-readiness/)
- [Go-to-Market](../go-to-market/)
- [Product Readiness](../product-readiness/)
- [Analytics](../analytics/)
- [AI Platform](../architecture/AI_PIPELINE_ADMIN_TOOLS.md)
- [Marketplace](../marketplace/)

**Last updated:** 2026-07-05
