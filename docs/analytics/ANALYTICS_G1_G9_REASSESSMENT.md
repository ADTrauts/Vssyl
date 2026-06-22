# Analytics Capability — G1–G9 Reassessment

**Program:** Analytics Capability — Certification Readiness Review  
**Review date:** 2026-06-22  
**Status:** Governance estimate — **not** formal certification scoring

**Scoring:** 3 = PASS · 2 = PARTIAL · 1 = FAIL (per gate)

**Classification target:** Platform Analytics Capability — **L2 WITH FINDINGS** (not L3 product module)

---

## 1. Scorecard

| Gate | Phase 0A | Post Phase 1 | Readiness review | Δ | Status | Evidence |
|------|----------|--------------|------------------|---|--------|----------|
| **G1 Scope & ownership** | 2 | 3 | **2** | — | **PARTIAL** | Hybrid model + registry; ledger misclassification (AN-M1) |
| **G2 Trust & authorization** | 2 | 3 | **3** | +1 | **PASS** | `analytics:read` 4/4; `analyticsPolicyDual` |
| **G3 Service boundaries** | 1 | 3 | **2** | +1 | **PARTIAL** | Capability service; Chat/Todo rollups; personal still reads Activity/Prisma (AN-M2) |
| **G4 Activity vs analytics** | 2 | 3 | **2** | — | **PARTIAL** | Read events wired; personal DTO derives from activity rows |
| **G5 API contracts** | 2 | 3 | **3** | +1 | **PASS** | Typed dashboard-summary; 4 canonical routes |
| **G6 Test evidence** | 2 | 3 | **2** | — | **PARTIAL** | Targeted unit tests; no HTTP matrix CI (AN-M4) |
| **G7 Observability** | 1 | 2 | **2** | +1 | **PARTIAL** | Operation matrix; degraded flags; no pipeline metrics |
| **G8 Documentation** | 2 | 3 | **3** | +1 | **PASS** | Phase 0A/0B + Phase 1 + readiness suite |
| **G9 Cross-module federation** | 2 | 3 | **3** | +1 | **PASS** | Facade; Chat/Todo contracts; honest enterprise degraded |

**Total: 21/27 (~78%)**

*Note: Readiness review applies conservative adjustment vs Phase 1 self-score on G1, G3, G4, G6 where residual majors remain.*

---

## 2. Band interpretation (Platform Capability)

| Range | Level | Analytics |
|-------|-------|-----------|
| 27/27 | Plain L2 (minimal findings) | Not eligible |
| **20–22** | **L2 WITH FINDINGS** | **✅ Candidate (21)** |
| 18–19 | L2 entry | Exceeded |
| ≤17 | L1 | Exceeded |

**L3 bands (23–27):** Not applicable — wrong certification class.

---

## 3. Gate detail

### G1 Scope & ownership — PARTIAL (2)

- Hybrid Domain classification ratified (Phase 0B)
- Ownership registry published (Phase 1)
- **Gap:** CERTIFICATION_LEDGER still lists pseudo-module posture (AN-M1)
- **Gap:** Satellites documented but not unified under capability charter enforcement

### G2 Trust & authorization — PASS (3)

- `analytics:read` on AC-01 through AC-04
- `analytics:admin` authorizer present
- Dual enforcement with security-deny blocking
- Dashboard summary delegates to dashboard read for tenant scope

### G3 Service boundaries — PARTIAL (2)

- `analyticsCapabilityService` canonical boundary
- Chat/Todo federation via rollup APIs (CV-01/02 closed)
- Controllers thin
- **Gap:** Personal capability still queries `activity`, `file`, `message` directly (acceptable federated L2 but not clean SoR separation — AN-M2)
- **Gap:** Calendar/Drive/Notification paths not named rollup contracts (AN-M6)

### G4 Activity vs analytics — PARTIAL (2)

- Capability read events: `analytics.personal.view`, `analytics.module.view`, `analytics.dashboard_summary.view`, `analytics.export`
- **Gap:** Personal analytics aggregates historical module activity — conflation at DTO layer (AN-M2); read events satisfy audit trail

### G5 API contracts — PASS (3)

- Shared types for dashboard summary
- Consistent `/api/analytics/*` canonical namespace
- Next.js proxy pattern preserved

### G6 Test evidence — PARTIAL (2)

- Unit tests: capability, activity, policy dual, dashboard summary, rollups, PE analytics
- Web: ownership registry, facade regression
- **Gap:** No automated HTTP operation-matrix suite (AN-M4)

### G7 Observability — PARTIAL (2)

- `degraded` / `degradedReasons` on dashboard summary
- Operation matrix published
- **Gap:** No event pipeline metrics; no cache invalidation signals (deferred Phase 2)

### G8 Documentation — PASS (3)

- Discovery (0A), strategy (0B), implementation (Phase 1), readiness (this review)
- Operation matrix and ownership model

### G9 Cross-module federation — PASS (3)

- Dashboard consumes via facade only
- Module rollup contracts for Chat/Todo
- Enterprise panels honest when data absent
- No mock cross-module metrics

---

## 4. Validation checklist (readiness analysis)

| Area | Validated | Score impact |
|------|-----------|--------------|
| Ownership boundaries | ✅ Registry + orphan removal | G1, G9 |
| Service boundaries | ✅ Capability layer; partial personal | G3 |
| PE coverage | ✅ Canonical 4/4 | G2 |
| Activity coverage | ✅ Canonical 4/4 | G4 |
| Documentation coverage | ✅ Full program docs | G8 |
| Trust model | ✅ Dual PE; no false pipeline | G2, G7 |
| Production posture | ✅ No mock; honest degraded | G9 |
| Operation matrix compliance | ✅ 10/10 canonical **C** | G7 |

---

## 5. Path to plain L2 (not recommended before Phase 2 planning)

| Gate | Uplift needed |
|------|---------------|
| G1 | Ledger reclassification governance |
| G3 | Personal rollup abstraction; formalize Calendar/Drive contracts |
| G4 | Separate personal metrics from raw activity reads |
| G6 | HTTP matrix integration suite |
| G7 | Optional cache observability |

Plain L2 (~24+/27 for capability) is **not required** before Phase 2; **L2 WITH FINDINGS** matches federated 2026 posture.

---

**Last updated:** 2026-06-22
