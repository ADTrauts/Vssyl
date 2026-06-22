# Dashboard Module — Package 3 Authorization Decision

**Program:** Dashboard Module Wave 3 — Package 3 Authorization Review  
**Decision date:** 2026-06-21  
**Authority:** Constitutional governance review (Package 3 gate)  
**Status:** **Decision recorded — governance only**

---

## Decision

### **Option A — Authorize Package 3 (Conditional)**

Package 3 — Analytics Decoupling is **authorized to enter implementation** subject to four kickoff clarifications. A full **Analytics Capability Audit** is **not** required as a blocking gate — discovery audit already exists ([ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md)).

**Conditions (must be recorded before facade merges):**

| ID | Condition | Owner |
|----|-----------|-------|
| **K3-01** | Dashboard summary API contract (`GET /api/analytics/dashboard-summary` vs extend `/personal`) | Analytics Capability + Dashboard |
| **K3-02** | Enterprise panels disposition (facade wire vs permanent feature-off + council waiver) | Product + Dashboard |
| **K3-03** | Degraded-mode policy when capability partial (strict no client fallback) | Dashboard + Analytics |
| **K3-04** | `quickstats` registry classification (`capabilityId` vs pseudo-moduleId) | Platform runtime |

**Failure to record K3-01:** Facade implementation **blocked** — stub/degraded-only work may proceed in parallel.

---

## Rationale

### Why Option A

| Factor | Assessment |
|--------|------------|
| Charter completeness | **~82%** — objectives, surfaces, facade pattern defined |
| Package 2 foundation | Service boundaries, domain events, B3-server closed |
| Analytics discovery | Domain boundary analysis complete — capability class determined |
| Finding mapping | B3-full, M6, M1, A6 clearly scoped to P3 |
| Existing API partial | `/api/analytics/*` provides extension point |
| P1 trust posture | Mocks removed; safe to wire real or degraded reads |

### Why not Option B (Analytics Capability Audit first)

Option B would be warranted if:

- Analytics ownership were undefined — **resolved**: platform capability
- No existing read APIs — **`/api/analytics/personal` exists** (immature)
- Dashboard charter conflicted on B3-full — **resolved**: P2 server / P3 client split
- Enterprise panels still shipping mocks — **P1 gated off**

Remaining gap is **capability maturity**, not **ownership ambiguity**. Parallel Analytics Capability Program addresses maturity without blocking Dashboard facade work.

---

## Finding closure authorization

| Finding | Authorized to close in P3? | Condition |
|---------|---------------------------|-----------|
| **DASH-B3 full** | **Yes** | Facade + no client aggregation |
| **DASH-M6** | **Yes** | Single summary contract |
| **DASH-M1** | **Yes** | Registry alignment |
| **DASH-A6** | **Yes** | quickstats reclassification |
| **DASH-M4** | **Stretch** | Matrix tests — P3 or P4 |
| **DASH-B4/B5** | **No** — already closed P1 | Verify only |

---

## Authorization boundaries

### Permitted in Package 3 ACT

- Create `dashboardAnalyticsFacade` (client) + server delegate for A-02
- Add or extend Analytics read API for dashboard-scoped summary
- Refactor `QuickStatsWidget` and `useDashboardStats` to facade
- Remove hardcoded storage placeholder or mark `degraded`
- Drive widget hygiene (remove random share)
- Align `coreModuleRegistry` / `WIDGET_REGISTRY` for quickstats
- Facade integration tests
- Wire enterprise panels to facade **if K3-02 approves**

### Not permitted (out of scope)

- Certification award / ledger update
- Full analytics warehouse / materialized views
- Business workspace analytics page rewrite
- Widget relocation out of Dashboard grid
- Package 4 hub landing work
- Re-introduce client-side multi-module aggregation as fallback

### Parallel track (recommended, not blocking P3 ACT)

- Analytics Capability Program charter (L2 maturity)
- Real `analyticsDomainEventSubscriber` rollups
- Business tenant analytics product surface

---

## Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Package 3 fully defined? | **Conditional yes (~82%)** — K3-01–K3-04 at kickoff |
| 2 | Who owns QuickStats? | **Analytics** (data) · Dashboard (host) |
| 3 | Who owns useDashboardStats? | **Analytics** |
| 4 | Who owns AI quick stats? | **Analytics** · Dashboard route/PE |
| 5 | Who owns enterprise panels? | **Analytics** · Dashboard UI host |
| 6 | Does Analytics become a platform capability? | **Yes** |
| 7 | Remaining DASH-B3 items? | A-02 facade; client consumers; B3-full |
| 8 | Readiness after Package 3? | **~24/27 (~89%)** |
| 9 | Dashboard certification readiness? | **L3 WITH FINDINGS candidate** |
| 10 | Need separate Analytics program? | **Yes** — capability maturity beyond P3 |
| 11 | Authorization recommendation? | **Option A — Authorize (Conditional)** |
| 12 | Should implementation begin? | **Yes** — after K3 kickoff; parallel capability API work |

---

## Sign-off posture

| Gate | Status |
|------|--------|
| Package 1 complete | ✅ |
| Package 2 complete | ✅ |
| Analytics ownership defined | ✅ |
| Widget boundary matrix | ✅ |
| Certification impact estimated | ✅ |
| Implementation ACT | **Authorized (Conditional)** |

---

**Last updated:** 2026-06-21
