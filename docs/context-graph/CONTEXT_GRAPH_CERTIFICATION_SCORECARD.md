# Context Graph — Certification Scorecard

**Program:** CG-2 — Certification Evaluation · **Final score at CG-6 promotion: 25/27**  
**Date:** 2026-06-19  
**Surface:** Context Graph — Tier 0 Platform Capability  
**Framework:** G1–G9 (adapted platform subdomain gates)

---

## Executive score

| Metric | Value |
|--------|------:|
| **Total score (CG-6 / promoted)** | **25 / 27** |
| **Percentage** | **~93%** |
| **Blocking findings** | **0** |
| **Open majors** | **0** |
| **Awarded level** | **LEVEL 3 CERTIFIED** (promoted CG-6) |
| **Prior level** | LEVEL 3 CERTIFIED WITH FINDINGS (CG-3) |

---

## Gate scorecard

| Gate | Dimension | Score | Max | Status | Primary evidence |
|------|-----------|------:|----:|--------|------------------|
| **G1** | Authorization / Permission Safety | **3** | 3 | ✅ PASS | `traversalPermissionMatrix.test.ts` (13 scenarios); PE every hop |
| **G2** | Ownership / SoR Preservation | **3** | 3 | ✅ PASS | Read-only orchestrator; no universal table; static audit |
| **G3** | Service Boundaries / Adapters | **3** | 3 | ✅ PASS | 8/8 conformance; `ContextGraphAdapter` registry |
| **G4** | API Coherence | **2** | 3 | ⚠️ PARTIAL | Core bundle endpoints; ~40% full read contract |
| **G5** | Auditability / AI Grounding | **3** | 3 | ✅ PASS | CG-1D — `graph_bundle`, provider, grounding contract |
| **G6** | Test Evidence | **3** | 3 | ✅ PASS | 82 tests; matrix + conformance + contract suites |
| **G7** | Documentation | **3** | 3 | ✅ PASS | 0A→1C program package |
| **G8** | Production Safety / Traversal | **2** | 3 | ⚠️ PARTIAL | Depth/budget caps; no rate limits / load tests |
| **G9** | UX / Operator Surface | **2** | 3 | ⚠️ PARTIAL | Bundle API docs; no projection UX / onboarding guide |

---

## Score progression

| Milestone | Score | % |
|-----------|------:|--:|
| CG-0C (ratification, docs only) | 12/27 | 44% |
| CG-1A complete | ~19/27 | 70% |
| CG-1B complete | ~21/27 | 78% |
| CG-1C complete | 24/27 | 89% |
| **CG-2 evaluation (initial)** | **24/27** | **89%** |
| CG-1D + CG-2A remediation | 25/27 | 93% |
| **CG-6 promotion (final awarded)** | **25/27** | **93%** |

---

## Gate detail — pass criteria met

### G1 = 3

- [x] PE at every hydrate hop (adapter access services)
- [x] Membership ≠ content access (V_Link vs module PE)
- [x] Restricted placeholders consistent; denied omitted
- [x] Traversal redaction matrix (13 scenarios)

### G2 = 3

- [x] Read-only federation orchestrator
- [x] No universal relationship SoR
- [x] Module ownership intact

### G3 = 3

- [x] Formal adapter interface + registry
- [x] P0 + P1 modules (8 adapters) compliant
- [x] Batch/depth limits in types

### G6 = 3

- [x] ≥20 integration-level tests (82 total)
- [x] Traversal redaction matrix
- [x] Adapter contract tests all adapters

### G7 = 3

- [x] Charter, federation contract, operation matrix
- [x] Phase implementation reports (1A, 1B, 1C)
- [x] Test architecture document

---

## Gate detail — partial scores

### G4 = 2 (needs 3 for plain L3)

| Criterion | Status |
|-----------|--------|
| Core bundle endpoints | ✅ |
| Contract version header | ✅ |
| Full Phase 1 HTTP contract | ❌ neighborhood, projection deferred |
| Proxy verified | ✅ (integration tests) |

**Path to 3:** CG-1B-prime projection + entity context routes.

### G5 = 2 (needs 3 for plain L3)

| Criterion | Status |
|-----------|--------|
| Bundle format in runtime | ✅ |
| Provenance in descriptor | ✅ |
| Pipeline consumes formal bundle | ❌ CG-F-006 |
| Trace / catalog gating complete | ❌ |

**Path to 3:** CG-1D AI bundle formalization.

### G8 = 2 (needs 3 for plain L3)

| Criterion | Status |
|-----------|--------|
| Depth cap enforced | ✅ |
| Node/edge budget enforced | ✅ |
| Truncation metadata | ✅ |
| Rate limits | ❌ |
| 100-node load test | ❌ |

### G9 = 2 (needs 3 for plain L3)

| Criterion | Status |
|-----------|--------|
| Bundle API for internal consumers | ✅ |
| V_Link hub coherent | ✅ |
| Entity neighborhood UX | ❌ |
| Adapter onboarding guide | ❌ |

---

## Threshold matrix

| Level | Required | Actual | Met? |
|-------|----------|--------|------|
| NOT CERTIFIABLE | Blockers or G1/G2/G3 FAIL or <70% | 0 blockers; G1–G3 PASS; 89% | No |
| L3 WITH FINDINGS | ≥70%; ≤3 majors | 89%; 2 waivable majors | **Yes** |
| Plain L3 | ≥85%; ≤1 major | 2 majors | No |

---

## Certification disposition

| Field | Value |
|-------|-------|
| **Awarded designation** | **LEVEL 3 CERTIFIED** (promoted CG-6 2026-06-19) |
| **Ratified at** | LEVEL 3 CERTIFIED WITH FINDINGS (CG-3 2026-06-19) |
| **Promotion record** | [CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md](./CONTEXT_GRAPH_CERTIFICATION_PROMOTION_RECORD.md) |

**Last updated:** 2026-06-19 (CG-6)
