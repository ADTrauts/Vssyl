# Analytics Capability — Strategic Architecture Review

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock & Future-State Architecture  
**Date:** 2026-06-22  
**Status:** Governance only — **no implementation, no certification, no ledger changes**

**Prior:** [ANALYTICS_EXECUTIVE_SUMMARY.md](./ANALYTICS_EXECUTIVE_SUMMARY.md) (Phase 0A)  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md); [RELATIONSHIP_ANALYTICS_MODEL.md](../architecture/RELATIONSHIP_ANALYTICS_MODEL.md); [CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md](../context-graph/CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md)

---

## 1. Purpose

Phase 0A classified Analytics as a **Hybrid Domain** and recommended **Platform Capability L2** via federated reads. Phase 0B asks a strategic question before accepting that path:

> Should Vssyl remain a **federated analytics capability** (Option A), evolve into a **full enterprise analytics platform** (Option B), or pursue a **phased hybrid** (Option C)?

This review compares options against constitutional constraints, certified platform state, and 2–3 year product vision.

---

## 2. Option definitions

### Option A — Federated Analytics Capability

| Attribute | Description |
|-----------|-------------|
| **Engine class** | Lightweight platform capability |
| **Computation** | Domain modules own analytics; capability federates and presents |
| **Data path** | On-demand reads + module rollup APIs |
| **Events** | Minimal — optional cache invalidation only |
| **Storage** | No warehouse; derived at request time |
| **Certification** | Platform Capability L2 CwF |
| **Precedent** | Dashboard Package 3 facade pattern; Chat `chatAnalyticsService` |

### Option B — Enterprise Analytics Platform

| Attribute | Description |
|-----------|-------------|
| **Engine class** | First-class platform subsystem (Tier 0 kernel adjacent) |
| **Computation** | Central rollup processors; modules emit events |
| **Data path** | Event pipeline → materialized rollups → warehouse → APIs |
| **Events** | Central analytics event pipeline on domain events |
| **Storage** | Tenant-partitioned warehouse; historical time series |
| **Certification** | Platform Capability L3–L4; separate operation matrix |
| **Precedent** | Unwired `ai/analytics/*` scaffold; `RELATIONSHIP_ANALYTICS_MODEL` warehouse layer |

### Option C — Hybrid Phased Roadmap (under evaluation)

| Phase | Posture |
|-------|---------|
| **Now → 12 months** | Option A — federated L2 |
| **12 → 24 months** | Selective Option B — event-derived rollups, tenant materialized views |
| **24 → 36 months** | Partial platform — historical metrics, cross-domain correlation where constitution allows |

---

## 3. Constitutional alignment analysis

Vssyl's Relationship Framework already defines analytics architecture — Option B is **not greenfield**:

| Constitutional rule | Option A | Option B (full) | Interpretation |
|---------------------|----------|-----------------|----------------|
| Analytics observes — does not own SoR | ✅ Natural fit | ⚠️ Risk if warehouse becomes truth | B must keep warehouse **derived only** |
| No universal relationship edge warehouse | ✅ | ❌ if graph edges warehoused as SoR | B forbidden for graph SoR substitution |
| Activity ≠ analytics | ✅ with discipline | ⚠️ Event pipeline must not replace activity | Separate R2 (events) from R3 (rollups) |
| Federation Pattern E — merge in presentation | ✅ Primary | ⚠️ Temptation to pre-merge in god table | Warehouse stores aggregates, not federated presentation |
| AP1–AP5 fail-closed | Both require enforcement | Both require enforcement | Not differentiating |
| AI uses analytics as narrative — not grounding SoR | ✅ | ⚠️ Unwired BI engines risk violation | B needs AI boundary charter |

**Conclusion:** Option B as a **monolithic enterprise data platform** conflicts with Vssyl federation principles. Option B as a **derived rollup substrate** is **already contemplated** in constitutional docs (warehouse marked "future" in RELATIONSHIP_ANALYTICS_MODEL).

The real decision is **when and how much** derived materialization to add — not whether to abandon federation.

---

## 4. Platform state fit (June 2026)

| Factor | Implication for Option A | Implication for Option B |
|--------|--------------------------|--------------------------|
| 10 archived L3 programs | Modules certified with domain analytics interiors | Central platform must not re-absorb module SoR |
| Domain Event Bus L1 | Thin taxonomy; placeholder subscribers | B blocked until Platform Activity + Events migration (portfolio #2) |
| Dashboard L3 CwF | Consumer facade pattern established | B APIs must preserve facade contract |
| Admin Portal L3 | Operator analytics mature | B operator warehouse partially exists (`SystemMetrics`) |
| Context Graph L3 CwF | Federation orchestrator planned | B relationship rollups are Phase 2B+ dependency |
| AI Platform L2 deferred | Unwired analytics engines | B AI consumption premature without stub policy |
| No analytics warehouse today | A is current reality | B requires 6–12 month platform investment |

**Platform readiness for full Option B today:** **Low (~35%)**  
**Platform readiness for federated Option A L2:** **Moderate (~55%)**

---

## 5. Consumer demand analysis

### 5.1 Near-term consumers (0–12 months)

| Consumer | Need | Option A sufficient? |
|----------|------|-------------------|
| Dashboard QuickStats | Real-time counts | ✅ Yes — `dashboard-summary` |
| Business workspace page | Business overview | ✅ Yes — federation of `businessAnalyticsService` |
| Profile analytics | Personal usage | ✅ Yes — service extraction from controller |
| HR / module dashboards | Domain metrics | ✅ Yes — module-owned (unchanged) |
| Admin Portal | Operator BI | ✅ Yes — already L3 |

### 5.2 Medium-term consumers (12–24 months)

| Consumer | Need | Option A sufficient? |
|----------|------|-------------------|
| Executive enterprise panels | Cross-module trends over time | ⚠️ Partial — needs historical rollups |
| Relationship health dashboards | V_Link / share funnel metrics | ❌ No — event-derived rollups required |
| Workforce comms trend reports | Campaign reach over quarters | ⚠️ Partial — module may own; platform composes |
| AI trend summaries | Narrative from aggregates | ⚠️ Partial — needs bounded rollup APIs |
| Business Operations cross-module KPIs | BO domain composition | ⚠️ Partial — federation + selective materialization |

### 5.3 Long-term consumers (24–36 months)

| Consumer | Need | Option A sufficient? |
|----------|------|-------------------|
| Predictive forecasting (unwired engines) | Historical time series | ❌ No |
| Cross-tenant operator correlation | Platform growth analytics | ⚠️ Partial — admin layer exists |
| Context Graph relationship analytics | Association density, churn | ❌ No — event pipeline + R3 rollups |
| Regulatory / audit reporting | Long retention aggregates | ❌ No — R3 retention policy implies warehouse |
| Marketplace module analytics | Partner usage metering | ⚠️ Partial — `UsageRecord` exists |

---

## 6. Cost / complexity comparison

| Dimension | Option A | Option B (full) |
|-----------|----------|-----------------|
| Engineering (12 mo) | 3–5 weeks L2 hardening | 6–9 months platform build |
| Operational burden | Low — stateless reads | Medium-high — pipeline ops, backfill, drift |
| Schema surface | Minimal new tables | 10–20+ rollup models |
| Failure modes | Slow queries, coupling | Stale warehouse, event lag, reconciliation |
| Team skill | Module federation (proven) | Data engineering (not yet demonstrated) |
| Certification path | L2 CwF Q3 2026 | L3 platform 2027+ earliest |

---

## 7. Strategic option scoring

Weighted against Vssyl priorities (federation, certification velocity, AI adjacency, BO value):

| Criterion | Weight | Option A | Option B (full) | Hybrid C |
|-----------|--------|----------|-----------------|----------|
| Constitutional fit | 25% | 9 | 5 | 8 |
| Time to L2 value | 20% | 9 | 3 | 8 |
| Supports 2–3y AI vision | 15% | 5 | 9 | 8 |
| Supports BO / relationship analytics | 15% | 4 | 9 | 8 |
| Operational simplicity | 15% | 9 | 4 | 7 |
| Avoids rework | 10% | 6 | 7 | 9 |
| **Weighted score** | | **7.5** | **5.4** | **8.0** |

---

## 8. Required questions — strategic answers

### 1. Is Option A or Option B the better long-term architecture?

**Neither alone.** Option A is the better **near-term** architecture. Option B (full enterprise platform) is the better **long-term substrate for relationship analytics, historical trends, and AI consumption** — but only as a **derived rollup layer**, not a SoR replacement.

**Hybrid Option C** is the better **overall** long-term architecture for Vssyl.

### 2. Which option aligns best with Vssyl's platform vision?

**Hybrid C** aligns with:

- Tier 0 kernel + federated modules (Platform Standards)
- Context Graph as logical federation — not graph database
- Relationship Framework: event-derived analytics primary, warehouse derived
- Certification-first delivery — L2 before L3 platform investment
- Dashboard as composition host consuming capability APIs

Full Option B aligns only if scoped as **"derived analytics platform"** — not a product module or universal data lake.

### 3–5. What future capabilities require Option B?

See dedicated sections in [ANALYTICS_PLATFORM_VISION_2027.md](./ANALYTICS_PLATFORM_VISION_2027.md).

**Summary:**

| Domain | Requires full B? | Requires partial B? |
|--------|----------------|---------------------|
| AI Platform | Predictive forecasting, collective pattern trends | Trend summaries, bounded rollup context |
| Business Operations | Cross-tenant HR analytics (elevated cert) | Historical workforce KPIs, adoption funnels |
| Admin Portal | Advanced cohort analysis at scale | Mostly satisfied today — incremental warehouse for operator time series |

### 6. Would Context Graph benefit from Option B?

**Yes — partially.** Context Graph benefits from **event-derived relationship rollups** (association counts, attachment facet histograms, churn signals). It does **not** benefit from warehousing graph edges as authoritative truth — that violates F3 and AG2.

**Required:** Event pipeline → tenant-scoped relationship metric rollups → federation orchestrator reads rollups + adapters.

### 7. Would V_Link benefit from Option B?

**Yes — partially.** V_Link domain events (14 types) are ideal for event-derived metrics: shares, attachment types, container growth, revocation churn. On-demand Prisma counts do not scale for business dashboards.

**Not required:** Separate V_Link analytics SoR — metrics remain derived from events + association registry.

### 8. Would a warehouse become inevitable at scale?

**Yes — for derived rollups (R3 retention class), not for domain SoR.**

Triggers:
- Executive panels need 30/90/365-day trends (not point-in-time)
- Relationship analytics Phase 2B execution
- Operator BI at >100k MAU without query fan-out
- AI predictive engines need historical series

**Form:** Tenant-partitioned rollup tables in PostgreSQL (or BigQuery export for operator tier later) — **not** a separate analytics product database replacing modules.

### 9–11. Minimum viable platform, event model, storage model

See [ANALYTICS_WAREHOUSE_FEASIBILITY.md](./ANALYTICS_WAREHOUSE_FEASIBILITY.md) and [ANALYTICS_EVENT_PIPELINE_REVIEW.md](./ANALYTICS_EVENT_PIPELINE_REVIEW.md).

### 12. Certification path under Option B

See [ANALYTICS_CERTIFICATION_MODEL_REVIEW.md](./ANALYTICS_CERTIFICATION_MODEL_REVIEW.md).

### 13–14. Risks

See [ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md](./ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md) (Phase 0A) plus §9 below.

| Risk | Option A | Option B (full) |
|------|----------|-----------------|
| Query fan-out at scale | **High** | Low |
| Stale/incorrect aggregates | Low | **High** |
| Constitutional SoR drift | Low | **High** |
| Slow time-to-value | Low | **High** |
| Perpetual mock surfaces | **Medium** | Low |
| Platform team bandwidth | Low | **High** |
| Premature data engineering | Low | **High** |

### 15. Final recommendation

**Select Option C — Hybrid Phased Roadmap.**

| Horizon | Posture |
|---------|---------|
| **0–12 months** | Federated Capability L2 — module rollup APIs, unified service, PE parity, wire business workspace |
| **12–24 months** | Event-derived rollup layer — tenant materialized views, replace placeholder subscriber |
| **24–36 months** | Analytics Platform substrate — historical metrics, relationship analytics, AI consumption APIs |

Do **not** jump to full Option B in 2026. Do **not** remain pure Option A beyond 2027 if relationship analytics and executive trends are product commitments.

---

## 9. Future-state architecture diagram

```mermaid
flowchart TB
  subgraph sor [Module Systems of Record]
    DRIVE[Drive / File Hub]
    CHAT[Chat]
    CAL[Calendar]
    TODO[Todo]
    HR[HR]
    PLACE[Place]
    WC[Workforce Comms]
    VL[V_Link / Context Graph]
    BIZ[Business Admin]
  end

  subgraph events [Domain Events - R2]
    DEB[Domain Event Bus]
    MAE[Module Activity Events]
  end

  sor -->|authorize then emit| DEB
  sor -->|feed-visible actions| MAE

  subgraph pipeline [Analytics Event Pipeline - Phase 2+]
    SUB[Analytics Event Subscriber]
    PROC[Rollup Processors]
    INV[Invalidation / Reconciliation]
  end

  DEB --> SUB
  SUB --> PROC
  PROC --> INV

  subgraph storage [Analytics Storage - Derived Only]
    RT[Tenant Rollup Tables - R3]
    OPS[SystemMetrics / Operator TS]
    CACHE[Optional Redis Cache - L2]
  end

  PROC --> RT
  PROC --> OPS
  INV --> CACHE

  subgraph federation [Federation Layer - Always]
    SVC[Platform Analytics Service]
    MODAPI[Module Rollup APIs]
    FED[Federation Orchestrator]
  end

  RT --> SVC
  OPS --> SVC
  CACHE --> SVC
  MODAPI --> SVC
  sor -->|on-demand fallback| MODAPI
  FED --> SVC

  subgraph apis [Analytics APIs]
    DSUM[GET /dashboard-summary]
    TENANT[/api/analytics/*]
    REL[Relationship metrics APIs - future]
  end

  SVC --> apis

  subgraph consumers [Consumers]
    DASH[Dashboard - facade]
    ADMIN[Admin Portal - operator]
    AI[AI Platform - narrative context]
    BWS[Business Workspace]
    MODUI[Module Analytics UIs]
  end

  apis --> DASH
  apis --> BWS
  apis --> MODUI
  SVC --> ADMIN
  apis --> AI
  VL -.->|association events| DEB
  MAE -.->|not warehouse primary| SVC
```

**Legend:**
- **Solid lines** — target-state primary paths
- **Dashed** — secondary or constitutional boundary (activity ≠ analytics warehouse)
- **Phase 1 (L2)** — dashed path from SoR → MODAPI → SVC → APIs (no warehouse)
- **Phase 2+** — solid event → rollup → storage path activates

---

## 10. Decision record

| Decision | Outcome |
|----------|---------|
| Strategic architecture | **Option C — Hybrid Phased Roadmap** |
| Near-term (2026) | **Option A** federated L2 |
| Long-term (2027–2028) | **Selective Option B** derived platform substrate |
| Full enterprise analytics platform | **Deferred** — not 2026 scope |
| Product module L3 track | **Rejected** (unchanged from 0A) |

---

**Last updated:** 2026-06-22
