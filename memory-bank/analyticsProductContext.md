# Analytics Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Cross-cutting reporting and insight capability  
**Architecture:** Analytics status / operation matrix (platform capability)

---

## Purpose

**Analytics** is a **cross-cutting reporting and insight capability**: trusted rollups and exploration over data that other products own.

It is not a generic synonym for “any chart,” Dashboard widgets, operator telemetry, audit history, or AI Twin reasoning.

## User Value

- See accurate, validated operational and business insight without inventing fake metrics
- Explore rollups that help decisions without interrupting core workflows
- Consume Analytics outputs from home/business surfaces without treating every number as Analytics

## Core Product Model

- **Accurate / validated reporting** — prefer real production sources
- **Trusted rollups** — aggregated views derived from domain systems of record
- **Exploration / insight** — reporting surfaces where the product exposes them
- **Consumption, not ownership of domain entities** — Analytics reports on Chat, HR, To-Do, Scheduling, etc.; it does not become their system of record
- **Projection** — Dashboard and business surfaces may display selected Analytics outputs

## Where It Appears

- Capability APIs and consumers (Dashboard facade, business workspace analytics, related reporting surfaces)
- Not required to be a single “open Analytics app” destination today

Whether Analytics should eventually have a **standalone destination** remains an open product decision.

## Key Relationships

- **Dashboard:** Contextual home/surface that can **project** selected Analytics outputs. Dashboard ≠ Analytics.
- **Domain products** (Chat, HR, To-Do, Scheduling, …): Own entities and activity; Analytics derives/report.
- **Platform Admin Portal:** May show **operator metrics**; those are not product Analytics.
- **Activity / audit:** Historical “what happened” records are not Analytics ownership.
- **AI Twin:** May use or discuss metrics within AI authority; Twin is not the Analytics capability.

## Product Invariants

- Analytics must not become the system of record for domain entities merely because it charts them.
- Changing Dashboard layout must not redefine Analytics ownership.
- Operator Portal metrics and product Analytics remain distinct product concepts.
- Accuracy / anti-fake-metrics posture remains product law.

## Boundaries

Analytics does **not** own:

- Dashboard as a product
- Platform Admin operator metrics / control-plane telemetry
- Activity or audit history as SoR
- The AI Twin insights engine
- The data warehouse / pipeline itself
- Compliance/risk programs as a blanket Analytics domain without separate product authority

## Open Product Decisions

1. Whether Analytics remains capability-only or gains a durable standalone destination/surface.
2. How deeply personal vs business Analytics scopes should be productized.
3. Which module-local “stats” stay module-owned vs federated into Analytics.

## Canonical References

- [`docs/analytics/ANALYTICS_STATUS_RECORD.md`](../docs/analytics/ANALYTICS_STATUS_RECORD.md)
- [`docs/analytics/ANALYTICS_OPERATION_MATRIX.md`](../docs/analytics/ANALYTICS_OPERATION_MATRIX.md)
- [`memory-bank/dashboardProductContext.md`](./dashboardProductContext.md)
- [`memory-bank/adminProductContext.md`](./adminProductContext.md) — operator metrics fence
