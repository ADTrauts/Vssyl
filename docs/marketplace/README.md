# Marketplace & Partner Runtime

**Domain:** Third-party module ecosystem  
**Program:** Marketplace Partner Runtime  
**Index:** [`../architecture/VSSYL_ARCHITECTURE_INDEX.md`](../architecture/VSSYL_ARCHITECTURE_INDEX.md) §3

---

## Purpose

Discovery, install, certification, and runtime isolation for marketplace modules and partner delegates.

## Scope

Partner pipeline, sandbox runtime, search/workspace/billing delegates, admin governance. Not first-party module interiors.

## Source of Truth

| Topic | Document |
|-------|----------|
| **Partner pipeline** | [`../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) |
| Certification | [`MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md`](./MARKETPLACE_PARTNER_CAPABILITY_CERTIFICATION_RECORD.md) |
| Reality assessment | [`MARKETPLACE_REALITY_ASSESSMENT.md`](./MARKETPLACE_REALITY_ASSESSMENT.md) |

## Reference Documents

- [`../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md)
- [`SEARCH_DELEGATE_ARCHITECTURE.md`](./SEARCH_DELEGATE_ARCHITECTURE.md)
- [`PARTNER_OPERATOR_RUNBOOK.md`](./PARTNER_OPERATOR_RUNBOOK.md)
- Phase 1A–1B-G closeout summaries in this folder

## Reference Implementations

- Pilot module: `vssyl-pilot-assets`
- [`../test-modules/`](../test-modules/) sample manifests

## Certification Status

**L3 Certified WITH FINDINGS** — Phase 1B-G, 2026-06-24. [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).

## Related Domains

- [Applications](../architecture/APPLICATION_LIFECYCLE.md)
- [Developer Platform](../guides/MODULE_DEVELOPMENT_GUIDE.md)
- [Search](../search/)

## Open Decisions

- Public partner documentation completeness (GTM audit)
- Organization-wide bulk install

**Last updated:** 2026-06-29
