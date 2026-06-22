# Analytics Capability — Certification Readiness

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery only — **no certification authorized, no ledger changes**

**Cross-reference:** [ANALYTICS_CAPABILITY_CLASSIFICATION.md](./ANALYTICS_CAPABILITY_CLASSIFICATION.md), [ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md](./ANALYTICS_ARCHITECTURAL_RISK_MATRIX.md), [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)

---

## 1. Executive posture

| Question | Answer |
|----------|--------|
| Ready for L3 product module certification? | **No** |
| Ready for Platform Capability L2 charter? | **Yes — after Phase 0B scope lock** |
| Ready for certification start today? | **No** |
| Reference module potential? | **Consumer pattern only** (Dashboard facade); not reference producer |

**Current ledger row:** `analytics` — L1 Stabilizing, "Pseudo-module; subscriber stubs" — **accurate maturity, misleading class** (implies product module).

---

## 2. Maturity estimate by layer

| Layer | L1 | L2 | L3 | L4 | Current posture |
|-------|----|----|----|----|-----------------|
| **Platform Analytics Capability** | Partial | **Partial** | — | — | **~L1.5→L2 entry** |
| **Operator Analytics (Admin Portal)** | — | — | **CwF** | — | L3 via Admin Portal program |
| **Module Domain Analytics** | — | Partial | **CwF** (HR) | — | L2–L3 per module |
| **Product Surfaces** | Mock | Partial | — | — | L0–L1 business workspace |
| **AI Analytics Scaffold** | Unwired | — | — | — | L0 |
| **Event Pipeline** | Placeholder | — | — | — | L0 |

### Platform Capability readiness score (informal G1–G9 lens)

| Gate area | Score | Notes |
|-----------|-------|-------|
| G1 Scope & ownership | **Partial** | Hybrid model now documented; ledger misaligned |
| G2 Trust & authorization | **Partial** | PE on dashboard-summary; not on all paths |
| G3 Service boundaries | **Weak** | Prisma coupling; no unified service |
| G4 Activity vs analytics | **Partial** | Personal analytics reads Activity directly |
| G5 API contracts | **Partial** | dashboard-summary typed; legacy routes ad hoc |
| G6 Tests | **Partial** | `analyticsDashboardSummaryService.test.ts` exists |
| G7 Observability | **Weak** | Degraded flags good; no operation matrix |
| G8 Documentation | **Improving** | Phase 0A docs; Memory Bank stale |
| G9 Cross-module federation | **Partial** | Facade pattern established; coupling violations remain |

**Estimated readiness:** **~12–15/27 (~44–56%)** for Platform Capability L2 — **not L3 module range (~24/27)**.

---

## 3. L1–L4 posture by classification target

### 3.1 If pursued as Product Module L3 (not recommended)

| Level | Posture | Blockers |
|-------|---------|----------|
| L1 | Partial | Pseudo-module exists |
| L2 | **Blocked** | No owned entities, no manifest, no AI context |
| L3 | **Blocked** | Would require inventing module SoR |
| L4 | **N/A** | No reference path |

**Verdict:** **Do not pursue** L3 product module track without scope lock adding owned entities — contradicts derived-metrics nature.

### 3.2 If pursued as Platform Capability L2 (recommended)

| Level | Posture | Gap to close |
|-------|---------|--------------|
| L1 | **Met** | dashboard-summary contract, facade, tests |
| L2 | **In progress** | Service layer, PE parity, coupling remediation, event decision |
| L3 | Future | Materialized rollups, operation matrix, warehouse strategy |
| L4 | Future | Reference capability designation |

**Target:** Platform Capability **L2 Certified With Findings** — analogous to Search/Realtime audit charter pattern.

### 3.3 Operator Analytics (already certified)

Admin Portal Stage 0C delivered **L3 CwF** for operator analytics. No separate Analytics certification needed for admin surfaces — maintain as Admin Portal satellite.

---

## 4. Major blockers

| ID | Blocker | Severity | Phase to address |
|----|---------|----------|------------------|
| **B-01** | No unified analytics service layer | **Blocking** for L2 | Phase 1 |
| **B-02** | Chat/Todo Prisma coupling in capability service | **Blocking** for trust | Phase 1 |
| **B-03** | AP1–AP5 not enforced on all rollup paths | **Blocking** for L2 | Phase 1 |
| **B-04** | Placeholder event subscriber | **Blocking** for honesty | Phase 0B decision |
| **B-05** | Mock business workspace analytics page | **Blocking** for product surface | Phase 1 |
| **B-06** | No operation matrix | **Blocking** for certification | Phase 0B |
| **B-07** | Ledger product-module classification | **Governance** | Phase 0B |
| **B-08** | Unwired AI analytics Prisma scaffold | **Non-blocking** | AI Platform program |
| **B-09** | No materialization / cache strategy | **Non-blocking** for L2 | Phase 2+ |
| **B-10** | Memory Bank `analyticsProductContext.md` stale | **Documentation** | Phase 0B |

---

## 5. Certification path (recommended)

### Phase 0A — Constitutional Discovery (this program)

- ✅ Inventory complete
- ✅ Ownership model defined
- ✅ Hybrid classification ratified
- ✅ Risk matrix documented
- ❌ No ledger update
- ❌ No certification start

### Phase 0B — Scope Lock & Charter (recommended next)

| Deliverable | Purpose |
|-------------|---------|
| Analytics Capability Charter | L2 scope, in/out boundaries |
| Operation matrix draft | Read operations with PE actions |
| Event pipeline decision | Activate subscriber or remove |
| Ledger classification proposal | Reclassify from product module to platform capability |
| Memory Bank refresh | Update `analyticsProductContext.md` |

**Duration estimate:** 1–2 weeks governance

### Phase 1 — Trust & Service Boundary (engineering)

| Work item | Purpose |
|-----------|---------|
| Extract `analyticsPersonalService` from controller | Service boundary |
| Module rollup APIs for chat/todo counts | Decouple Prisma |
| Wire or hide business workspace page | Remove mock |
| PE audit on all `/api/analytics/*` | AP2 compliance |
| Event subscriber: implement or delete | Pipeline honesty |

**Duration estimate:** 3–5 weeks engineering

### Phase 2 — Federation Hardening

| Work item | Purpose |
|-----------|---------|
| Enterprise panel product decision | Wire or permanent gate |
| DTO namespace collision fix | Place vs platform PersonalAnalytics |
| Orphan component disposition | Mount or delete |
| Optional cache layer | Performance |

### Phase 3 — L2 Certification candidacy

| Requirement | Target |
|-------------|--------|
| Operation matrix complete | All read ops documented |
| G1–G9 assessment | ≥20/27 for L2 CwF |
| Tests on all capability endpoints | Contract tests |
| No mock product paths | Honest degraded mode |

**Not in scope for L2:** Warehouse, relationship analytics Phase 2B, AI scaffold wiring.

---

## 6. Reference potential

| Pattern | Reference eligibility | Notes |
|---------|----------------------|-------|
| **Dashboard consumes Analytics via facade** | ✅ **Already in REFERENCE_MODULE_CATALOG** | Post Dashboard L3 — consumer pattern |
| **Analytics Capability as reference producer** | ❌ **Not eligible today** | No operation matrix, coupling violations |
| **Chat module analytics extraction** | ✅ Module interior reference | `chatAnalyticsService` Wave 1E pattern |
| **Admin Portal operator analytics** | ✅ Admin Portal reference | Stage 0C ownership registry |

**Recommendation:** Do **not** pursue Analytics as Reference Module #N. Instead:

1. Document **capability consumer pattern** via Dashboard (done)
2. Pursue **Platform Capability L2** designation after charter
3. Use **module-local analytics** (HR, Chat) as federation exemplars

---

## 7. Comparison to Dashboard certification

| Dimension | Dashboard (archived L3) | Analytics Capability |
|-----------|---------------------------|----------------------|
| Owned entities | `Widget`, `Dashboard` rows | **None** |
| Certification class | Product module L3 CwF | Platform capability L2 target |
| Pre-certification program | Wave 3 Packages 1–3 | **Phase 0A discovery only** |
| Canonical contract | Widget composition | `dashboard-summary` (single endpoint) |
| Trust remediation | PE + activity on mutations | PE on reads only (so far) |
| Readiness at cert | ~24/27 (~89%) | ~12–15/27 (~44–56%) |

Dashboard Wave 3 **unblocked** Analytics by establishing the facade contract. Analytics must **not** piggyback Dashboard's L3 certificate.

---

## 8. Certification feasibility summary

| Track | Feasible? | Timeline | Prerequisites |
|-------|-----------|----------|---------------|
| L3 Product Module | **No** | — | Would require owned SoR — architectural mismatch |
| Platform Capability L2 CwF | **Yes** | Q3 2026 realistic | Phase 0B charter + Phase 1 trust work |
| Platform Capability L3 | **Deferred** | 2027+ | Warehouse, event pipeline, operation matrix at scale |
| Operator Analytics re-cert | **Not needed** | — | Maintained under Admin Portal |
| Combined Dashboard+Analytics cert | **Rejected** | — | Independent programs |

---

## 9. Required question answers

| # | Question | Answer |
|---|----------|--------|
| 7 | Current maturity? | **L1.5→L2 entry** for Platform Capability; L0 mock surfaces; L3 CwF for operator via Admin Portal |
| 8 | Largest architectural risks? | Prisma coupling, permission model unenforced, placeholder event pipeline, mock product surface |
| 9 | Certification path? | **Platform Capability L2** via Phase 0B charter → Phase 1 trust → L2 candidacy — **not** L3 product module |

---

**Last updated:** 2026-06-22
