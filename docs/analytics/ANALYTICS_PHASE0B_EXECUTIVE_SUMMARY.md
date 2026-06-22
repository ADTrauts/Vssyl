# Analytics Capability — Phase 0B Executive Summary

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock & Future-State Architecture  
**Date:** 2026-06-22  
**Status:** Governance complete — **no implementation, no certification, no ledger changes**

**Prior:** [ANALYTICS_EXECUTIVE_SUMMARY.md](./ANALYTICS_EXECUTIVE_SUMMARY.md) (Phase 0A)

**Deliverables:**
- [Strategic Architecture Review](./ANALYTICS_STRATEGIC_ARCHITECTURE_REVIEW.md)
- [Platform Vision 2027](./ANALYTICS_PLATFORM_VISION_2027.md)
- [Warehouse Feasibility](./ANALYTICS_WAREHOUSE_FEASIBILITY.md)
- [Event Pipeline Review](./ANALYTICS_EVENT_PIPELINE_REVIEW.md)
- [Certification Model Review](./ANALYTICS_CERTIFICATION_MODEL_REVIEW.md)

---

## Bottom line

Phase 0A recommended **Platform Capability L2 via federation**. Phase 0B strategic review confirms that recommendation for **2026** — but determines that **pure federation (Option A) is insufficient for Vssyl's 2–3 year vision**.

**Final decision: Option C — Hybrid Phased Roadmap**

| Horizon | Architecture |
|---------|--------------|
| **2026** | Federated Analytics Capability (Option A) → **L2 CwF** |
| **2027** | Event-derived rollups + MVAP storage (selective Option B) → **L3 CwF** |
| **2028** | Historical metrics, relationship analytics, AI consumption substrate |

Do **not** build a full enterprise analytics platform in 2026. Do **not** remain federation-only past 2027 if relationship analytics and executive trends are product commitments.

---

## Strategic decision

| Option | Verdict |
|--------|---------|
| **A — Federated Capability** | ✅ **2026 posture** |
| **B — Enterprise Analytics Platform** | ⚠️ **2027+ selective substrate** — not monolithic 2026 build |
| **C — Hybrid Phased Roadmap** | ✅ **Selected** |

---

## Required questions — complete answers

### 1. Is Option A or Option B the better long-term architecture?

**Neither alone.** Option A wins near-term (constitutional fit, speed, simplicity). Option B elements win for historical trends, relationship analytics, and AI consumption at scale. **Hybrid C** is the better long-term architecture.

### 2. Which option aligns best with Vssyl's platform vision?

**Hybrid C** — federated modules + Tier 0 kernel + Context Graph federation + derived observation layer. Aligns with Platform Standards, Relationship Framework (R2→R3), and certification-first delivery. Full Option B as a "data platform product" **conflicts** with federation principles unless scoped as **derived rollup substrate only**.

### 3. What future AI capabilities require Option B?

| Capability | B required? |
|------------|-------------|
| AI trend narratives | **Partial B** — 30/90-day rollups |
| Predictive forecasting | **Yes** — historical time series |
| Anomaly detection (unwired engines) | **Yes** — baselines |
| Relationship-aware AI summaries | **Yes** — V_Link/share rollups |
| Dashboard quick-stats | **No** — federation sufficient |
| Module AI context providers | **No** — module-owned |

### 4. What future Business Operations capabilities require Option B?

| Capability | B required? |
|------------|-------------|
| HR / Scheduling / WC domain dashboards | **No** |
| Cross-module BO executive KPIs | **Yes** |
| Module adoption funnels | **Yes** — event-derived |
| Elevated HR cross-employee analytics | **Yes** — k-anonymity rollups |
| Business workspace analytics page | **No** for MVP — federation L2 |

### 5. What future Admin Portal capabilities require Option B?

| Capability | B required? |
|------------|-------------|
| Current operator BI (L3) | **No** |
| Scale cohort analysis | **Incremental B** |
| AI pipeline trend history | **Partial B** |
| Cross-tenant relationship health | **Yes** — PII-minimized operator rollups |

### 6. Would Context Graph benefit from Option B?

**Yes — partially.** Event-derived association metrics and health interpretation — **not** warehousing graph edges as SoR. Analytics supplies **metric rollups** to federation orchestrator.

### 7. Would V_Link benefit from Option B?

**Yes — partially.** V_Link's 14 domain event types are ideal for event-derived rollups (shares, attachments, churn). Highest-value Phase 2B analytics consumer after dashboard metrics.

### 8. Would a warehouse become inevitable at scale?

**Yes** — for **derived R3 rollups** (tenant-partitioned PostgreSQL), not domain SoR. Triggers: executive trends, relationship analytics, query fan-out SLO breach, AI historical series. Estimated **12–18 months** after event pipeline activation.

### 9. What is the minimum viable analytics platform architecture?

**MVAP (Minimum Viable Analytics Platform):**

1. Unified `analyticsCapabilityService` (federation)
2. Module rollup APIs (Chat, Todo, etc.)
3. Optional Redis cache (60–120s TTL)
4. Phase 2: async event subscriber → rollup processors → PostgreSQL R3 tables
5. Read APIs with PE + degraded flags

**Excludes:** Separate warehouse DB, unwired AI scaffold, stream processing platform.

### 10. What event model would be required?

- **Input:** `DomainEvent` envelope (R2) — primary; module activity secondary
- **Registry:** Metric family map (event type → rollup table + grain)
- **Processing:** Async idempotent upsert — **not** sync on emit path
- **Tenant scope:** `dashboardId` / `businessId` / `householdId` required — drop + alert if missing
- **Forbidden:** Activity log as warehouse; graph edge SoR; PII in rollup schema

### 11. What storage model would be required?

| Tier | Technology | Phase |
|------|------------|-------|
| Hot cache | Redis / TTL | 2026 optional |
| Tenant rollups | PostgreSQL (new Prisma module) | 2027 |
| Operator TS | `SystemMetrics`, `SupportAnalytics`, `UsageRecord` | Extend existing |
| Operator export | BigQuery (optional) | 2028+ |

### 12. What certification path would exist under Option B?

| Milestone | Level | Date |
|-----------|-------|------|
| Federation hardening | **L2 CwF** | Q4 2026 |
| Pipeline + MVAP | **L3 CwF** | Q2–Q3 2027 |
| Reference capability eval | **L4** | 2028 |

**Not certifiable:** L3 product module. Admin Portal operator analytics remains separate L3 satellite.

### 13. What risks are introduced by Option B?

| Risk | Severity |
|------|----------|
| SoR drift — warehouse becomes truth | **Critical** |
| Stale aggregates / event lag | High |
| Ops burden (pipeline, backfill, reconciliation) | High |
| Premature build before federation L2 | High |
| PII leakage in rollups | High |
| Team bandwidth diversion from module backlog | Medium |
| Unwired AI scaffold activation pressure | Medium |

### 14. What risks are introduced by staying with Option A?

| Risk | Severity |
|------|----------|
| Query fan-out at scale | High |
| Cannot deliver executive trends / relationship analytics | High |
| Perpetual mock surfaces if L2 not pursued | Medium |
| AI predictive features blocked | Medium |
| Context Graph / V_Link metrics remain expensive | Medium |
| Re-work when rollups eventually needed | Low–Medium |

### 15. Final recommendation

**Select Option C — Hybrid Phased Roadmap.**

Ratify Phase 0A Hybrid Domain classification. Pursue **L2 federated capability in 2026**. Plan **selective platform evolution in 2027** (event pipeline + MVAP). Reject **full Option B in 2026** and **permanent Option A beyond 2027**.

---

## Future-state architecture diagram

```mermaid
flowchart TB
  subgraph sor [Module Systems of Record]
    MOD[Drive · Chat · Calendar · Todo · HR · Place · WC · Business]
    VL[V_Link / Context Graph Associations]
  end

  subgraph events [Domain Events - R2]
    DEB[Domain Event Bus]
  end

  sor -->|authorized mutations| DEB
  VL --> DEB

  subgraph pipeline [Analytics Event Pipeline - 2027+]
    SUB[Analytics Event Subscriber]
    PROC[Rollup Processors - async jobs]
  end

  DEB --> SUB
  SUB --> PROC

  subgraph storage [Derived Storage - R3]
    RT[Tenant Rollup Tables]
    OPS[Operator Time Series]
    CACHE[Optional Cache - 2026]
  end

  PROC --> RT
  PROC --> OPS
  SUB --> CACHE

  subgraph fed [Federation Layer - Always]
    MAPI[Module Rollup APIs]
    SVC[Platform Analytics Service]
  end

  sor --> MAPI
  MAPI --> SVC
  RT --> SVC
  CACHE --> SVC
  OPS --> SVC

  subgraph apis [Analytics APIs]
    A1[/api/analytics/dashboard-summary]
    A2[/api/analytics/*]
    A3[Relationship metrics - future]
  end

  SVC --> apis

  subgraph consumers [Consumers]
    DASH[Dashboard + facade]
    ADMIN[Admin Portal]
    AI[AI Platform]
    BWS[Business Workspace]
    CG[Context Graph]
  end

  apis --> DASH
  apis --> BWS
  apis --> AI
  SVC --> ADMIN
  apis --> CG
```

---

## 12–24 month roadmap

### Phase 1 — Federated L2 (2026 Q3–Q4)

**Architecture:** Option A  
**Certification target:** L2 CwF

| Work | Outcome |
|------|---------|
| Extract `analyticsCapabilityService` | Unified service boundary |
| Module rollup APIs for Chat, Todo | Decouple Prisma coupling |
| PE audit on all `/api/analytics/*` | AP1–AP5 compliance |
| Wire or hide business workspace analytics | No mock |
| **Remove placeholder event subscriber** | Pipeline honesty |
| Operation matrix + contract tests | L2 candidacy |
| Optional Redis cache for dashboard-summary | Performance |

**Dependencies:** None blocking — can ACT after council ratification.

### Phase 2 — Event-Derived Rollups (2027 Q1–Q2)

**Architecture:** Selective Option B  
**Certification target:** L3 readiness

| Work | Outcome |
|------|---------|
| Domain Events taxonomy (platform #2) | Stable R2 input |
| Async analytics subscriber + rollup processors | MVAP pipeline |
| PostgreSQL tenant rollup tables (3–5 families) | R3 storage |
| Cache invalidation on events | Freshness |
| Reconciliation jobs | Drift detection |
| V_Link + core module metric families | Relationship analytics MVP |

**Dependencies:** Platform Activity migration, Scheduler registry (#7).

### Phase 3 — Platform Substrate (2027 Q3–2028)

**Architecture:** Option B substrate (not monolith)  
**Certification target:** L3 CwF → L4 eval

| Work | Outcome |
|------|---------|
| Historical trend APIs (30/90/365d) | Executive panels |
| Relationship analytics Phase 2B | Context Graph supplier |
| AI bounded trend consumption APIs | AI Platform integration |
| Activate `SupportAnalytics` writes | Operator honesty |
| L3 certification candidacy | Council review |

---

## Governance decisions ratified (Phase 0B)

| ID | Decision |
|----|----------|
| **SB-01** | Strategic architecture = **Hybrid C** |
| **SB-02** | 2026 = federated L2 only — no warehouse build |
| **SB-03** | 2027 = MVAP event pipeline + rollups |
| **SB-04** | Product module L3 track = **rejected** |
| **SB-05** | Placeholder subscriber = **remove in Phase 1** (charter) |
| **SB-06** | Ledger reclassification = propose in Phase 1 governance (not 0B) |
| **SB-07** | Do not wire `ai/analytics/*` scaffold without AI Platform charter |
| **SB-08** | Context Graph / V_Link benefit from rollups — not edge warehouse |

---

## Stop condition confirmation

| Constraint | Status |
|------------|--------|
| Governance and architecture only | ✅ |
| No runtime code | ✅ |
| No schema changes | ✅ |
| No APIs created | ✅ |
| No certification | ✅ |
| No ledger updates | ✅ |
| No modernization packages | ✅ |

---

## Next step

**Council ratification of Phase 0B decisions (SB-01 through SB-08)** → authorize **Analytics Capability Phase 1 — Federated L2 Engineering** as a separate ACT program.

---

**Last updated:** 2026-06-22
