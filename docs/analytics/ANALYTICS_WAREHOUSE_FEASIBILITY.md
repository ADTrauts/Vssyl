# Analytics Capability — Warehouse Feasibility

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock  
**Date:** 2026-06-22  
**Status:** Feasibility analysis only — **no schema changes, no implementation**

**Authority:** [RELATIONSHIP_ANALYTICS_MODEL.md](../architecture/RELATIONSHIP_ANALYTICS_MODEL.md); [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](../architecture/RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md); [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md)

---

## 1. Executive conclusion

A **full enterprise analytics warehouse** (separate data lake, ETL platform, BI server) is **not feasible or desirable** for Vssyl in the 2026–2027 horizon.

A **minimum viable derived rollup store** (tenant-partitioned PostgreSQL tables, optional Redis cache) is **feasible, constitutional, and becomes inevitable** as relationship analytics, executive trends, and operator scale mature.

**Recommendation:** Plan **MVAP** (Minimum Viable Analytics Platform storage) in Phase 2 (2027); remain federation-only in Phase 1 (2026).

---

## 2. Warehouse inevitability analysis

### 2.1 When federation breaks down

| Trigger | Threshold (est.) | Symptom | Warehouse need |
|---------|------------------|---------|----------------|
| Dashboard summary fan-out | >5 module calls per request | p95 > 500ms | Cache or materialized counts |
| Executive 90-day trends | Any | On-demand scan of Activity/events | R3 rollup tables |
| Relationship funnel metrics | Phase 2B launch | Event replay too expensive | Event-derived rollups |
| Operator MAU growth | >50k–100k users | Admin query timeouts | Operator TS expansion |
| AI predictive baselines | AI Platform L3 | No historical series | Metric time-series store |
| Compliance retention | R3 policy active | Ephemeral aggregates lost | Persisted derived rollups |

**Verdict:** Warehouse (as **derived rollup store**) becomes **inevitable** — estimated **12–18 months** after event pipeline activation, not immediately.

### 2.2 When warehouse is NOT needed

| Scenario | Approach |
|----------|----------|
| QuickStats point-in-time counts | Federation + module APIs + optional 60s cache |
| HR attendance dashboard | Module interior — no platform warehouse |
| Admin MRR today | `adminAnalyticsService` direct aggregates |
| Chat analytics page | `chatAnalyticsService` — module scoped |
| Personal profile analytics | User-scoped Activity reads (service-layer) |

---

## 3. Minimum viable analytics platform architecture (MVAP)

### 3.1 Layers

| Layer | Component | Phase |
|-------|-----------|-------|
| **L0** | Module SoR (unchanged) | Always |
| **L1** | Module rollup APIs | Phase 1 (2026) |
| **L2** | Platform analytics service (`analyticsCapabilityService`) | Phase 1 |
| **L3** | Event subscriber + rollup processors | Phase 2 (2027) |
| **L4** | Derived storage (R3 tables) | Phase 2 |
| **L5** | Optional Redis cache (hot counts) | Phase 1–2 |
| **L6** | Read APIs + PE gates | Phase 1–2 |

**MVAP excludes:** Separate warehouse DB, Kafka/PubSub, BigQuery (operator tier optional 2028+), unwired AI analytics Prisma models.

### 3.2 MVAP storage model

#### Tier 1 — Hot cache (optional, Phase 1)

| Attribute | Value |
|-----------|-------|
| **Technology** | Redis or in-process TTL cache |
| **Contents** | `dashboard-summary` per `dashboardId` |
| **TTL** | 30–120 seconds |
| **Invalidation** | Domain events (Phase 2) or manual |
| **Tenant scope** | Key = `dashboardId` + metric family |

#### Tier 2 — Tenant rollup tables (Phase 2)

| Attribute | Value |
|-----------|-------|
| **Technology** | PostgreSQL (existing Prisma module) |
| **Schema location** | `prisma/modules/platform/analyticsRollups.prisma` (future — not created in 0B) |
| **Partition key** | `dashboardId`, `businessId`, `householdId` |
| **Grain** | Daily + current-snapshot rows |
| **PII** | **Forbidden** in rollup schema (AG9) |
| **Retention** | R3: 90d–7y by tier per RELATIONSHIP_METRICS_CATALOG |

**Proposed rollup families (governance — not schema):**

| Rollup family | Source events | Grain |
|---------------|---------------|-------|
| `dashboard_activity_daily` | `file.*`, `chat.message.sent`, `calendar.event.created` | dashboardId + day |
| `module_adoption_daily` | `module.installed`, `module.enabled` | businessId + module + day |
| `vlink_association_daily` | V_Link domain events | businessId/dashboardId + day |
| `storage_usage_snapshot` | Drive aggregates | dashboardId + asOf |
| `notification_unread_snapshot` | Notification events | dashboardId + asOf |

#### Tier 3 — Operator time series (existing + extend)

| Model | Status | Extension |
|-------|--------|-----------|
| `SystemMetrics` | **Active** | Continue |
| `SupportAnalytics` | Schema exists | Activate writes |
| `UsageRecord` | Active | Aggregate jobs |
| `ModuleAIPerformanceMetric` | Active | Trend queries |

#### Tier 4 — Operator export (optional 2028+)

| Attribute | Value |
|-----------|-------|
| **Technology** | BigQuery or GCS parquet export |
| **Scope** | PII-minimized operator aggregates only |
| **Trigger** | Admin scale SLO breach |

### 3.3 What NOT to store

| Forbidden | Reason |
|-----------|--------|
| Authoritative relationship edges | F3 — no graph SoR warehouse |
| Message bodies, file content | AP4, redaction rules |
| Per-user private entity lists | Enumeration risk |
| Activity log duplicate as analytics SoR | moduleSpecs separation |
| Session graph projections | AG2 — no event backing |

---

## 4. Existing schema inventory vs MVAP

| Model | Current state | MVAP disposition |
|-------|---------------|------------------|
| `SystemMetrics` | Active | **Retain** — operator TS |
| `SupportAnalytics` | Dormant | **Activate** in Phase 2 |
| `UsageRecord` | Active | **Retain** |
| `PlaceAnalyticsSnapshot` | Zero writes | **Repurpose or delete** in Phase 2 charter |
| `DataStream`, `DataPoint`, `RealTimeMetric` | Unwired AI scaffold | **Do not wire** without AI Platform charter |
| `Forecast`, `Anomaly`, `BusinessMetric` | Unwired | **Defer** to AI Platform 2028+ |
| `RealTimeAlert` | Unwired | **Defer** |

**Feasibility of reusing AI analytics Prisma module:** **Low** — models designed for stream/forecast platform, not tenant rollup MVAP. **Recommend new focused rollup module** rather than activating scaffold.

---

## 5. Reconciliation and drift

| Concern | MVAP strategy |
|---------|---------------|
| Rollup vs on-demand mismatch | Periodic reconciliation job compares rollup to module API |
| Event missed | Backfill from R2 event log (domain event persistence) |
| Stale cache | TTL + event invalidation |
| Tenant scope leak | Partition key enforced at write; PE at read |
| Adapter denies list | Rollup must not exceed adapter visibility (AP stale rule) |

---

## 6. Cost and ops feasibility

| Approach | Eng effort | Ops burden | Fit |
|----------|------------|------------|-----|
| Federation only (A) | Low | Low | 2026 ✅ |
| MVAP PostgreSQL rollups | Medium (8–12 weeks) | Medium | 2027 ✅ |
| Redis cache layer | Low (1–2 weeks) | Low | 2026 optional ✅ |
| Full separate warehouse DB | High | High | ❌ Overkill |
| BigQuery operator lake | Medium-high | Medium | 2028 optional |
| Activate `ai/analytics` schema | High | High | ❌ Wrong abstraction |

**Team feasibility:** Vssyl has proven **Prisma + Cloud Run + platform cron** patterns. MVAP rollups fit existing stack. Separate data platform does not.

---

## 7. Constitutional compliance checklist

| Rule | MVAP compliance |
|------|-----------------|
| Analytics observes — does not own SoR | ✅ Rollups derived only |
| No universal edge warehouse | ✅ Counts/histograms only |
| R2 → R3 retention | ✅ Rebuild from events |
| AP1–AP5 | ✅ PE on read; PII-free schema |
| Activity ≠ analytics | ✅ Separate tables from Activity |
| Partner analytics ≠ activity substitute | ✅ Certification gate |

---

## 8. Phased storage roadmap

| Phase | Storage | Deliverable |
|-------|---------|-------------|
| **1 (2026 H2)** | None required; optional Redis | L2 federation |
| **2 (2027 H1)** | Tenant rollup tables (3–5 families) | Event pipeline live |
| **2 (2027 H2)** | Activate `SupportAnalytics`; repurpose Place snapshot | Operator honesty |
| **3 (2028)** | Operator export optional; AI time series | L3 platform CwF |

---

## 9. Feasibility verdict

| Question | Answer |
|----------|--------|
| Is full enterprise warehouse feasible now? | **No** — premature, constitutional risk, ops burden |
| Is MVAP rollup store feasible? | **Yes** — 2027 with event pipeline prerequisite |
| Is warehouse inevitable at scale? | **Yes** — for R3 derived rollups, not domain SoR |
| Minimum storage model? | PostgreSQL tenant rollups + optional Redis + existing operator TS |

---

**Last updated:** 2026-06-22
