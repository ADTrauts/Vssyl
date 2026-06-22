# Analytics Capability — Certification Model Review

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock  
**Date:** 2026-06-22  
**Status:** Governance only — **no certification authorized, no ledger changes**

**Prior:** [ANALYTICS_CERTIFICATION_READINESS.md](./ANALYTICS_CERTIFICATION_READINESS.md) (Phase 0A)  
**Cross-reference:** [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md); Context Graph / Search platform capability precedents

---

## 1. Purpose

Phase 0A recommended **Platform Capability L2**. Phase 0B asks: how does certification change under **Option A (federated)**, **Option B (platform)**, and **Option C (hybrid phased)**?

This review defines certification tracks, levels, and gates — **without starting certification or updating the ledger**.

---

## 2. Certification class (unchanged from 0A)

| Track | Status |
|-------|--------|
| L3 Product Module (`analytics` id) | **Rejected permanently** unless council adds owned SoR (not recommended) |
| Platform Analytics Capability | **Canonical track** |
| Admin Portal Operator Analytics | **Certified** — maintain as satellite |
| Module Domain Analytics | **Certified per module** — HR, Chat, etc. |

**Ledger action (future governance):** Reclassify `analytics` row from "product module L1" to **"platform capability L1"**.

---

## 3. Certification tracks by strategic option

### 3.1 Option A — Federated Capability

| Level | Target date | Scope |
|-------|-------------|-------|
| **L2 CwF** | Q4 2026 | Federation service, module rollup APIs, PE parity, no mock surfaces |
| L3 | Not targeted | Insufficient without event pipeline |
| L4 | N/A | Reference capability — not applicable |

**G1–G9 threshold:** ≥20/27 (~74%) for L2 CwF

### 3.2 Option B — Enterprise Analytics Platform

| Level | Target date | Scope |
|-------|-------------|-------|
| L2 CwF | Q4 2026 | Prerequisite federation (same as A) |
| **L3 CwF** | Q2–Q3 2027 | Event pipeline, MVAP rollups, operation matrix |
| **L4** | 2028+ | Reference capability designation — analogous to File Hub for derived metrics |

**G1–G9 threshold:** ≥24/27 (~89%) for L3 CwF

### 3.3 Option C — Hybrid (recommended)

| Phase | Cert target | Date |
|-------|-------------|------|
| Phase 1 | **L2 CwF** — federated | Q4 2026 |
| Phase 2 | L3 CwF — with rollups | Q2–Q3 2027 |
| Phase 3 | L4 reference capability evaluation | 2028 council |

---

## 4. L2 certification model (Phase 1 — federated)

### 4.1 Scope in

| Area | Requirement |
|------|-------------|
| `analyticsDashboardSummaryService` | Module API decoupling (no direct Chat/Todo Prisma) |
| Unified `analyticsCapabilityService` | Personal, module, export, dashboard-summary |
| PE enforcement | AP1–AP5 on all `/api/analytics/*` reads |
| `dashboardAnalyticsFacade` contract | Stable — Dashboard remains consumer |
| Business workspace page | Wired or segment hidden — **no mock** |
| Placeholder subscriber | **Removed** |
| Operation matrix | Read operations documented |
| Tests | Contract tests on all capability endpoints |
| Degraded mode | Honest per-source flags |

### 4.2 Scope out

| Area | Deferred to L3 |
|------|----------------|
| Event-derived rollups | Phase 2 |
| Warehouse tables | Phase 2 |
| Relationship analytics | Phase 2B program |
| AI predictive consumption | AI Platform charter |
| Enterprise panel full wire | Product decision |

### 4.3 L2 gate checklist (informal G1–G9)

| Gate | L2 requirement |
|------|----------------|
| G1 Scope | Hybrid Domain charter ratified |
| G2 Trust | PE on all reads; tenant scope |
| G3 Service boundary | No controller Prisma; module APIs |
| G4 Activity separation | Personal analytics via service — not raw Activity conflation |
| G5 API contracts | Typed DTOs; OpenAPI or shared types |
| G6 Tests | Service + route contract tests |
| G7 Observability | Structured logging; degraded metrics |
| G8 Documentation | Operation matrix + Phase 0 docs |
| G9 Federation | Facade pattern; no god-table |

---

## 5. L3 certification model (Phase 2 — platform substrate)

### 5.1 Additional scope vs L2

| Area | Requirement |
|------|-------------|
| Event pipeline | Active async rollup processor |
| MVAP storage | ≥3 tenant rollup families live |
| Reconciliation | Scheduled job — rollup vs module API |
| Historical metrics | 30/90-day trend APIs |
| Relationship metrics | Phase 2B minimum viable |
| Cache strategy | Event invalidation + TTL |
| R3 retention policy | Documented per metric family |
| Backfill | Replay from domain event log |

### 5.2 L3 gates beyond L2

| Gate | L3 requirement |
|------|----------------|
| G3 | Rollup processors isolated; no sync blocking |
| G4 | R2/R3 separation documented |
| G7 | Pipeline lag metrics; drop counters |
| G9 | Context Graph / V_Link metric supplier role |

### 5.3 L3 certification path under Option B

```
Phase 0A Discovery ✅
Phase 0B Scope Lock ✅ (this program)
Phase 1 Engineering → L2 candidacy
L2 Council Ratification (Q4 2026)
Phase 2 Engineering → event pipeline + MVAP
L3 Candidacy review (Q2 2027)
L3 Council Ratification (Q3 2027)
```

**Estimated duration:** 12–15 months from Phase 1 ACT to L3 CwF.

---

## 6. L4 reference capability (Phase 3 — optional)

| Criterion | Analytics L4 potential |
|-----------|------------------------|
| Other capabilities copy pattern | Dashboard facade consumer — **already documented** |
| Operation matrix complete | Required |
| Constitutional compliance | No SoR violations in audit |
| Cross-module federation exemplar | Module rollup API contract |

**L4 designation:** **"Analytics Federation Reference Capability"** — not Reference Module.

**Precedent:** Billing entitlements (#AP-BILL-1) as reference **capability** CwF — not product module.

---

## 7. What certification is NOT

| Misconception | Correction |
|---------------|------------|
| Certifying `analytics` pseudo-module as L3 product | Rejected |
| Re-certifying Admin Portal analytics | Unnecessary — L3 exists |
| Certifying HR analytics separately | HR module L3 covers interior |
| Wiring `ai/analytics/*` as cert gate | AI Platform dependency |
| Ledger update during Phase 0B | Explicitly excluded |

---

## 8. Certification dependencies

| Dependency | Blocks | Owner |
|------------|--------|-------|
| Dashboard L3 archived | No — consumer ready | ✅ Complete |
| Domain Events taxonomy | L3 pipeline | Platform #2 |
| Platform Scheduler | Async rollups | Platform #7 |
| Relationship Analytics 2B | L3 relationship metrics | Architecture |
| AI Platform stub policy | AI consumption APIs | Platform #3 |
| Business workspace mock | L2 honesty | Analytics Phase 1 |

---

## 9. Risk to certification by option

| Risk | Option A only | Option B jump |
|------|---------------|---------------|
| Perpetual L1 if mocks remain | Medium | Low |
| L2 without pipeline — is it honest? | **Yes** — federation is valid L2 | N/A |
| L3 without federation L2 | N/A | **High** — unstable foundation |
| Over-certification (L3 too early) | Low | **High** |
| Under-certification (stay L1) | Medium | Low |

**Hybrid C mitigates both** — L2 federation cert in 2026, L3 platform cert in 2027.

---

## 10. Certification model answers (required question #12)

**Under Option B (full platform):**

| Milestone | Class | Timing |
|-----------|-------|--------|
| L2 CwF | Federated capability | Q4 2026 (prerequisite — not skipped) |
| L3 CwF | Platform with rollups + pipeline | Q2–Q3 2027 |
| L4 | Reference capability | 2028 evaluation |

**Certification authority:** Architecture council — same as Context Graph, Search (planned), Realtime (planned).

**Not certifiable as:** Product module L3, Admin Portal sub-cert, Dashboard sub-cert.

---

## 11. Recommended certification sequence (Hybrid C)

| Quarter | Milestone |
|---------|-----------|
| **2026 Q3** | Phase 1 engineering ACT; operation matrix draft |
| **2026 Q4** | L2 CwF candidacy + council |
| **2027 Q1** | Event pipeline + MVAP engineering |
| **2027 Q2** | L3 readiness review |
| **2027 Q3** | L3 CwF candidacy (if pipeline + rollups meet gates) |
| **2028** | L4 reference evaluation; operator export optional |

---

**Last updated:** 2026-06-22
