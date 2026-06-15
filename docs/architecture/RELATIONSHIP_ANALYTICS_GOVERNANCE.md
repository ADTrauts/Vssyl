# Relationship Analytics Governance

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-4 — Relationship analytics constitutional architecture  
**Status:** Canonical governance  
**Date:** 2026-06-14  
**Metrics:** [RELATIONSHIP_METRICS_CATALOG.md](./RELATIONSHIP_METRICS_CATALOG.md)

> **Scope:** Certification, ownership, versioning, and drift prevention for relationship analytics.

---

## Purpose

Prevent **analytics-derived truth**, **analytics-only relationships**, and **metric drift** from events/adapters.

---

## Metric certification

Before a relationship metric ships (AG1–AG12):

| # | Requirement |
|---|-------------|
| AG1 | Catalog entry in [RELATIONSHIP_METRICS_CATALOG.md](./RELATIONSHIP_METRICS_CATALOG.md) |
| AG2 | **Derivation method** declared — event preferred |
| AG3 | **Owner team** assigned |
| AG4 | **Tenant scope** keys defined |
| AG5 | **Confidence band** documented |
| AG6 | **Retention tier** R2/R3 aligned with audit policy |
| AG7 | **Permission model** review — [ANALYTICS_PERMISSION_MODEL.md](./ANALYTICS_PERMISSION_MODEL.md) |
| AG8 | **No SoR write** path from metric job |
| AG9 | **PII-free** rollup schema |
| AG10 | **AI usage** classified — narrative only unless adapter re-fetch |
| AG11 | Dashboard/export audit for ADMIN paths |
| AG12 | Module operation matrix or platform analytics doc updated |

### Health label additional (AG13–AG15)

| # | Requirement |
|---|-------------|
| AG13 | Mapped to lifecycle — not replacing SoR state |
| AG14 | Thresholds configurable — documented defaults |
| AG15 | No auto-mutation from health job |

---

## Ownership

| Domain | Metric owner | Reviewer |
|--------|--------------|----------|
| V_Link analytics | Platform V_Link | Architecture |
| Share/grant metrics | File Hub | Module + architecture |
| Membership | Business / Platform | Architecture |
| Tag facets | Module owners | Architecture + 2A tag strategy |
| Recommendation funnels | AI platform | AI + architecture |
| Health interpreter | Platform analytics | Architecture + compliance |
| Cross-module rollups | Platform architecture | Architecture council |

---

## Versioning

| Artifact | Version field |
|----------|---------------|
| Metric definition | `metricVersion` semver |
| Rollup schema | `schemaVersion` |
| Health threshold set | `healthRulesetId` |
| Event dependency | Domain event registry type + version |

### Compatibility

| Change | Breaking? |
|--------|-----------|
| Add optional rollup column | No |
| Change event source type | Yes — backfill plan |
| Loosen visibility in metric | **Yes** — security review |
| Tighten visibility | No — may drop historical detail |

---

## Deprecation

| Rule | Detail |
|------|--------|
| Deprecate metric | Mark catalog — stop dashboard; retain R3 until TTL |
| Replace derivation | Run parallel metrics one release |
| Remove health label | Stop compute — purge derived rows |

---

## Drift prevention

| Drift risk | Guard |
|------------|-------|
| Warehouse edge table | Forbidden — event counts only |
| Metric job queries Prisma cross-module | Use events or scoped adapter jobs |
| Activity feed skipped for analytics | moduleSpecs — both required |
| Graph density warehoused without label | AG2 derivation tag |
| Health written to SoR | AG8 + schema review |
| Metric contradicts adapter for same user | Parity tests |

### CI expectations (future)

- Metric catalog id in dashboard config  
- Event type exists in domainEventRegistry  
- No `GraphEdge` Prisma models without ADR  

---

## Testing expectations (future)

| Theme | Assert |
|-------|--------|
| Tenant isolation | Foreign tenant count = 0 |
| Restricted V_Link | Titles absent — count only |
| Event replay | Same count as live aggregate |
| Stale snapshot | Label staleness |
| AI block | Contains derivation disclaimer |
| Health | Does not mutate SoR |

---

## Certification levels

| Level | Meaning |
|-------|---------|
| **An0** | Ad hoc query |
| **An1** | Catalog documented |
| **An2** | AG1–AG12 certified |
| **An3** | An2 + automated parity tests + AI review |

---

## PR checklist

- [ ] Catalog entry  
- [ ] Event or adapter source — no god table  
- [ ] Tenant keys  
- [ ] PII review  
- [ ] AI boundary  
- [ ] Retention  
- [ ] No PE bypass  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md) | Model |
| [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md) | Adapter parity |

**Last updated:** 2026-06-14
