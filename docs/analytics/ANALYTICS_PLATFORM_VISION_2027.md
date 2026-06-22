# Analytics Platform Vision 2027

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock  
**Date:** 2026-06-22  
**Horizon:** 2026–2028 (12–24 month primary; 36 month outlook)  
**Status:** Vision document only — **no implementation**

**Cross-reference:** [ANALYTICS_STRATEGIC_ARCHITECTURE_REVIEW.md](./ANALYTICS_STRATEGIC_ARCHITECTURE_REVIEW.md); [PLATFORM_PORTFOLIO_REFRESH_2026.md](../platform-portfolio/PLATFORM_PORTFOLIO_REFRESH_2026.md)

---

## 1. Vision statement

By **2027**, Vssyl Analytics is a **Tier 0 derived-metrics platform capability** that:

1. **Federates** module-owned domain analytics into honest tenant contracts
2. **Materializes** high-value rollups from domain events where on-demand reads fail scale or history requirements
3. **Never owns** domain state — warehouse rows are revocable interpretations (R3), rebuildable from R2 events
4. **Feeds** Dashboard, Business Workspace, Admin Portal, AI Platform, and Context Graph consumers through stable read APIs
5. **Certifies** as Platform Capability **L2 CwF (2026)** → **L3 CwF (2027–2028)** — not a product module

> Analytics is the platform's **observation layer** — not a second product suite competing with modules.

---

## 2. Target-state capability map (2027)

| Capability | 2026 (Phase 1) | 2027 (Phase 2) | 2028 (Phase 3) |
|------------|----------------|----------------|----------------|
| Dashboard summary | Live federated | + cache / rollup | + trend deltas |
| Business workspace analytics | Wired, honest | Historical trends | Segment drill-down |
| Module rollup APIs | Chat, Todo extracted | All P3 modules | Standard contract |
| Event pipeline | Placeholder removed | Active subscriber | Backfill + reconciliation |
| Tenant rollups | None | Core metrics materialized | Relationship metrics |
| Operator warehouse | `SystemMetrics` | Expanded operator TS | Optional export |
| AI consumption | Quick-stats | Trend summary APIs | Predictive input series |
| Relationship analytics | Spec only | Phase 2B execution | Health interpreter |
| Reporting / export | L1 tenant export | Governed export | Scheduled reports |
| Forecasting | Unwired scaffold | — | AI Platform charter |

---

## 3. Future AI capabilities requiring platform evolution (Option B elements)

Full Option B is **not** required for most AI features. The following require **derived rollup substrate** beyond pure federation:

| AI capability | Federation (A) enough? | Platform evolution needed |
|---------------|------------------------|----------------------------|
| Dashboard AI quick-stats | ✅ Today | Cache optional |
| AI twin trend narrative ("your team shared 40% more files") | ❌ | 30/90-day event-derived rollups |
| Predictive intelligence forecasts | ❌ | Historical time series (R3) |
| Collective pattern analysis | ⚠️ Partial | `GlobalPattern` already exists — needs honest event input |
| Relationship-aware AI summaries | ❌ | V_Link / share funnel rollups |
| Module AI context providers | ✅ | Module-owned — unchanged |
| Context Graph bundle enrichment | ⚠️ Partial | Association density metrics as narrative adjunct |
| Anomaly detection (unwired engine) | ❌ | Baseline time series + materialized metrics |
| Business AI digital twin analytics | ⚠️ Partial | `BusinessAIUsageMetric` exists — extend not replace |

**AI boundary (constitutional):** AI consumes analytics as **narrative context** — never as permission grant or relationship SoR ([AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md](../architecture/AI_RELATIONSHIP_ANALYTICS_BOUNDARY.md)).

**Minimum AI platform dependency:** Event-derived tenant rollups exposed via bounded read APIs — not full enterprise warehouse.

---

## 4. Future Business Operations capabilities requiring platform evolution

Business Operations (HR, Scheduling, Workforce Comms) is **L3 CwF** with **domain-owned analytics interiors**. Platform evolution is needed for **cross-module BO composition**, not HR attendance charts.

| BO capability | Owner today | Requires Option B? |
|---------------|-------------|-------------------|
| HR onboarding / attendance / time-off dashboards | HR module | **No** — domain interior |
| Scheduling utilization metrics | Scheduling module | **No** |
| Workforce comms campaign reports | Workforce Comms | **No** — domain interior |
| Cross-module workforce KPIs ("productivity index") | Unowned | **Yes** — federated + materialized |
| Business adoption funnel (module installs over time) | Partial (`businessAnalyticsService`) | **Yes** — event-derived |
| BO executive dashboard in workspace | Mock / partial | **Yes** — capability composition |
| Elevated HR cross-employee analytics | HR + elevated cert | **Yes** — k-anonymity rollups, audit |
| Compliance reporting (retention policies) | Spec (R3) | **Yes** — warehouse retention class |

**BO principle:** Modules keep domain SoR analytics. Platform capability adds **composition layer** for business workspace executive view and cross-module adoption — not absorption of HR analytics services.

---

## 5. Future Admin Portal capabilities requiring platform evolution

Admin Portal operator analytics is **already L3 CwF**. Option B elements are **incremental**, not greenfield.

| Admin capability | Today | 2027 need | Option B element |
|------------------|-------|-----------|------------------|
| Platform MRR / growth | Live | Scale | Operator time-series expansion |
| User segments / AB tests | Live | Scale | None — service exists |
| BI insights tab | Live | Richer models | Derived cohort warehouse |
| Real-time metrics | Live | Higher cardinality | Stream aggregation (optional) |
| Module governance analytics | Satellite | Unified | Cross-module install funnel |
| AI pipeline funnel metrics | Live | Trend history | Event-derived rollup |
| Support analytics | `SupportAnalytics` model | Honest writes | Activate schema |
| Cross-tenant relationship health | Not built | Phase 2B+ | PII-minimized operator rollups |

**Admin Portal does not need a separate "analytics platform"** — it needs **`adminAnalyticsService` to consume platform rollup layer** where query fan-out exceeds SLO.

---

## 6. Context Graph benefit analysis

Context Graph (L3 CwF) is a **federation orchestrator** — modules = nodes, V_Link = edges, projections = derived.

| Context Graph need | Federation (A) | Platform evolution (B partial) |
|--------------------|----------------|--------------------------------|
| AI context bundles | ✅ Adapters today | Rollups as optional bundle facets |
| Graph read API (0B+) | ✅ Adapter-backed | — |
| Association density metrics | ❌ On-demand expensive | Event-derived counts |
| Relationship health scores | ❌ Spec only | Health interpreter on rollups |
| Churn / growth signals | ❌ | V_Link event funnel |
| Tag facet popularity | ⚠️ Adapter snapshot | Materialized public facets only |

**Verdict:** Context Graph **benefits from event-derived rollups** but **must not** warehouse graph edges as truth. Analytics serves Context Graph as **metric supplier** — not graph SoR.

**Integration pattern:**

```
V_Link events → Analytics rollup processor → relationship_metric_rollups
                                                      ↓
                              Context Graph federation orchestrator (read)
                                                      ↓
                                    AI bundle / Business dashboard
```

---

## 7. V_Link benefit analysis

| V_Link metric family | Derivation | Option A | Option B partial |
|---------------------|------------|----------|----------------|
| Active associations per tenant | Event: `vlink.*` | Slow adapter scan | ✅ Event count |
| Attachment type histogram | Event metadata | Adapter snapshot | ✅ Rollup |
| Share / revoke churn | Events | ❌ | ✅ Time series |
| Container membership growth | Events | ❌ | ✅ |
| Cross-module link density | Federation | Session projection | ⚠️ Rollup without edge SoR |

**Verdict:** V_Link is the **highest-value event analytics consumer** after core dashboard metrics. Phase 2B relationship analytics **requires** partial Option B.

---

## 8. Platform positioning in Tier 0 kernel

```
Tier 0 Runtime Kernel (2027 target)
├── Workspace / Dashboard shell
├── Policy Engine
├── Domain Events (R2)
├── Module Activity
├── Context Graph (federation)
├── Search (planned audit)
├── Realtime (planned audit)
└── Analytics Capability ← derived observation layer
         ├── Federation service (L2)
         ├── Rollup processors (L2+)
         └── Derived storage R3 (L3)
```

Analytics sits **adjacent to Domain Events** — consuming R2, producing R3 — never writing back to module SoR.

---

## 9. What we will NOT build (2027 exclusions)

| Exclusion | Rationale |
|-----------|-----------|
| Universal graph warehouse | Constitutional violation (F3) |
| Analytics as marketplace module | Hybrid Domain — not product module |
| Separate analytics database product | Ops complexity; PostgreSQL rollups sufficient |
| Replacing module analytics interiors | OW-1 domain ownership |
| Wiring all `ai/analytics/*` scaffold engines | AI Platform charter required |
| Real-time stream processing platform | `RealTimeAnalyticsEngine` unwired — defer |
| Partner analytics as activity substitute | moduleSpecs certification rule |

---

## 10. Success criteria (2027)

| Metric | Target |
|--------|--------|
| Platform Capability certification | L2 CwF (2026) → L3 CwF (2027) |
| Mock analytics surfaces | **Zero** in product paths |
| Dashboard summary p95 latency | < 300ms with cache/rollup |
| Event-derived rollup coverage | Core 10 metric families |
| Relationship analytics | Phase 2B charter executed |
| AI trend APIs | 3+ bounded consumer endpoints |
| Constitutional violations | 0 SoR substitution findings |

---

## 11. Alignment with portfolio priorities

| Portfolio rank | Analytics vision alignment |
|----------------|---------------------------|
| #1 Analytics Wave 3 | Phase 1 L2 federation (2026) |
| #2 Platform Activity + Events | **Prerequisite** for Phase 2 rollups |
| #3 AI stub policy | Prerequisite for AI analytics consumption |
| #5 Search Phase 2B | Parallel — search ≠ analytics warehouse |
| Context Graph advisories | Fed by relationship rollups (2027) |

---

**Last updated:** 2026-06-22
