# Context Graph — Certification Framework

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0B — Constitutional architecture  
**Date:** 2026-06-18  
**Status:** Framework definition — pre-certification  
**Authority:** Adapted G1–G9 (Admin Portal, Business Administration, Business Operations precedent)

---

## 1. Framework selection

| Framework | Applies | Notes |
|-----------|---------|-------|
| Module L1–L4 | **No** | Context Graph is Tier 0 capability — not marketplace module |
| Platform subdomain G1–G9 | **Yes** | This document |
| Control plane G1–G9 | **Partial** | Admin config surfaces only |

**Certification target:** **LEVEL 3 CERTIFIED** as Tier 0 platform capability (pending implementation + evaluation).

---

## 2. Domain gates (G1–G9)

| Gate | Name | Criterion (max 3) |
|------|------|-------------------|
| **G1** | Permission Safety | PE + visibility at every hydrate hop; membership ≠ access; redaction parity |
| **G2** | Source-of-Truth Preservation | No universal SoR table; federation read-only; module ownership intact |
| **G3** | Adapter Boundaries | Adapters read module SoR only; no cross-module Prisma; registry complete |
| **G4** | API Coherence | Read API contract implemented; V_Link CRUD remains separate; proxy consistent |
| **G5** | AI Grounding Safety | Precedence order; no pending suggestions; trace distinguishes sources |
| **G6** | Test Evidence | Integration tests: bundle compose, traversal caps, permission redaction |
| **G7** | Documentation | Charter, federation contract, adapter inventory, operation matrix current |
| **G8** | Performance / Traversal Safety | Depth caps enforced; batch limits; truncation metadata; rate limits |
| **G9** | UX / Developer Experience | Bundle API documented; V_Link hub coherent; adapter onboarding guide |

---

## 3. Gate rubric detail

### G1 — Permission Safety

| Score | Requirement |
|------:|-------------|
| 0 | Cross-module raw Prisma in graph path |
| 1 | PE on some paths only |
| 2 | PE on all paths; redaction inconsistent |
| 3 | PE every hop; membership ≠ access proven; restricted placeholders consistent |

### G2 — Source-of-Truth Preservation

| Score | Requirement |
|------:|-------------|
| 0 | Universal relationship table introduced |
| 1 | Orchestrator writes to foreign SoR |
| 2 | Read-only orchestrator; one derived store without invalidation |
| 3 | Read-only; no universal SoR; derived stores event-invalidated |

### G3 — Adapter Boundaries

| Score | Requirement |
|------:|-------------|
| 0 | No adapters |
| 1 | Ad hoc vlink resolvers only |
| 2 | ≥4 adapters; no formal registry |
| 3 | Registry + interface; P0 modules compliant; batch limits |

### G4 — API Coherence

| Score | Requirement |
|------:|-------------|
| 0 | No context-graph API |
| 1 | Partial endpoints; contract drift |
| 2 | Core bundle endpoints; contract mostly aligned |
| 3 | Full Phase 1 contract; versioning header; proxy verified |

### G5 — AI Grounding Safety

| Score | Requirement |
|------:|-------------|
| 0 | Inference as SoR; suggestions ground |
| 1 | V_Link only; no bundle format |
| 2 | Bundle format; precedence partial |
| 3 | Full precedence; provenance; catalog gating; trace complete |

### G6 — Test Evidence

| Score | Requirement |
|------:|-------------|
| 0 | No graph tests |
| 1 | V_Link tests only (legacy) |
| 2 | Bundle tests; permission tests partial |
| 3 | ≥20 integration tests; traversal redaction matrix; adapter contract tests |

### G7 — Documentation

| Score | Requirement |
|------:|-------------|
| 0 | Undocumented |
| 1 | 0A docs only |
| 2 | 0A + 0B; operation matrix partial |
| 3 | Full package; PLATFORM_ENTITY_MODEL synced; CERTIFICATION_LEDGER entry |

### G8 — Performance / Traversal Safety

| Score | Requirement |
|------:|-------------|
| 0 | Unbounded traversal |
| 1 | Depth cap undocumented in runtime |
| 2 | Caps enforced; truncation partial |
| 3 | Depth + node + token budgets; rate limits; perf tests on 100-node cap |

### G9 — UX / Developer Experience

| Score | Requirement |
|------:|-------------|
| 0 | No developer docs |
| 1 | V_Link hub only |
| 2 | Bundle API for internal consumers |
| 3 | Hub + entity neighborhood; module adapter onboarding guide; UX tokens on graph surfaces |

---

## 4. Current vs post-Phase 1 scoring (projected)

### 4.1 Current (Phase 0B — 2026-06-18)

| Gate | Score | Max | Status |
|------|------:|----:|--------|
| G1 | 2 | 3 | PARTIAL — vlink PE strong; no traversal suite |
| G2 | 2 | 3 | PARTIAL — no orchestrator; no universal table |
| G3 | 1 | 3 | **FAIL** — ad hoc adapters |
| G4 | 0 | 3 | **FAIL** — no context-graph API |
| G5 | 2 | 3 | PARTIAL — vlink pipeline; no bundle |
| G6 | 1 | 3 | **FAIL** — vlink tests only |
| G7 | 2 | 3 | PARTIAL — 0A+0B docs |
| G8 | 1 | 3 | **FAIL** — caps in docs only |
| G9 | 1 | 3 | **FAIL** — V_Link hub; no graph API |
| **Total** | **12** | **27** | **~44%** |

### 4.2 Post-Phase 1A–1C (projected)

| Gate | Score | Status |
|------|------:|--------|
| G1 | 3 | PASS |
| G2 | 3 | PASS |
| G3 | 2 | PARTIAL |
| G4 | 2 | PARTIAL |
| G5 | 3 | PASS |
| G6 | 2 | PARTIAL |
| G7 | 3 | PASS |
| G8 | 2 | PARTIAL |
| G9 | 2 | PARTIAL |
| **Total** | **22** | **~81%** |

### 4.3 Post-Phase 2A–2B + certification (projected)

| Gate | Score | Status |
|------|------:|--------|
| G1–G9 | 23–25 | READY FOR REVIEW |

---

## 5. Thresholds

| Level | Requirement |
|-------|-------------|
| **NOT READY** | <70% or G1/G2/G3 FAIL or any blocking finding |
| **L3 WITH FINDINGS** | ≥70%, zero blockers, ≤3 open majors |
| **READY FOR REVIEW** | ≥85%, G1≥2, G2≥2, G5≥2, G6≥2 |
| **LEVEL 3 CERTIFIED** | ≥85%, zero blockers, ≤1 open major (waivable) |

---

## 6. Certification path

| Stage | Package | Outcome |
|-------|---------|---------|
| 0A | Discovery | ✅ Complete |
| 0B | Constitutional architecture | ✅ This package |
| 1A–1C | Federation + API + AI bundle | Implementation |
| 1D | NOTE resolver | Parallel remediation |
| 2A–2B | Tag index + visualization | Enhancement |
| **CG-2** | Certification evaluation | Scorecard |
| **CG-3** | Council ratification | L3 designation |
| **CG-6** | Ledger promotion | CERTIFICATION_LEDGER entry |

**Expected path:** L3 WITH FINDINGS after Phase 1 → plain L3 after Phase 2 advisories closed.

---

## 7. Evidence requirements (Phase 3)

| Evidence | Gate |
|----------|------|
| Traversal permission integration tests | G1, G6 |
| Orchestrator read-only audit | G2 |
| Adapter registry manifest | G3 |
| API contract conformance tests | G4 |
| Pipeline trace with `graph_bundle` | G5 |
| Load test 100-node cap | G8 |
| Hub bundle UX screenshot / QA matrix | G9 |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_FINDINGS_REGISTER.md](./CONTEXT_GRAPH_FINDINGS_REGISTER.md) | Open findings |
| [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) | Platform ledger |

**Last updated:** 2026-06-18
