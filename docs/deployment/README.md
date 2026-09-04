# Deployment & Infrastructure

**Domain:** Production deployment, GCP, build optimization  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §10

---

## Purpose

Operational guides for deploying Vssyl to Google Cloud Run, migrations, builds, and rollback.

## Scope

How-to and runbooks — not product architecture. Deployment **intent** in Memory Bank.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Production deployment** | [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) |
| GCP deployment | [`GOOGLE_CLOUD_DEPLOYMENT.md`](./GOOGLE_CLOUD_DEPLOYMENT.md) |
| Product/deployment context | [`../../memory-bank/deployment.md`](../../memory-bank/deployment.md) |

## Reference Documents

- [`AUTOMATIC_MIGRATION_DEPLOYMENT.md`](./AUTOMATIC_MIGRATION_DEPLOYMENT.md)
- [`CLOUD_RUN_ROLLBACK_RUNBOOK.md`](./CLOUD_RUN_ROLLBACK_RUNBOOK.md)
- Build optimization guides in this folder
- [`../setup/`](../setup/) — external service setup

## Reference Implementations

- `cloudbuild.yaml`
- Cloud Run services (frontend + backend)

## Certification Status

N/A — operational domain.

## Related Domains

- [Setup guides](../setup/)
- [Security posture](../architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md) — Platform Standards / Policy Engine; ⚠️ no dedicated security cert program yet (historical: [`../archive/session-summaries/securityComplianceSystem.md`](../archive/session-summaries/securityComplianceSystem.md))

## Open Decisions

- Consolidated `docs/runbooks/` index (Phase 2)

**Last updated:** 2026-06-29
