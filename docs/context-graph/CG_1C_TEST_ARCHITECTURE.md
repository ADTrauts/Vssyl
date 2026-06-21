# CG-1C — Context Graph Test Architecture

**Program:** Vssyl Context Graph  
**Phase:** 1C — Test & Certification Evidence  
**Date:** 2026-06-19  
**Status:** **ACTIVE** — certification evidence layer

---

## 1. Purpose

Define the test architecture for the federated Context Graph runtime (8 adapters, 11 entity types). CG-1C adds **evidence only** — no new adapters, APIs, or schema.

---

## 2. Test layering

```
┌─────────────────────────────────────────────────────────┐
│  L5  API integration (JWT, envelope, contract header)   │
│      context-graph.integration.test.ts                  │
├─────────────────────────────────────────────────────────┤
│  L4  Permission traversal matrix (CG-F-007)               │
│      traversalPermissionMatrix.test.ts                    │
├─────────────────────────────────────────────────────────┤
│  L3  Cross-adapter bundle traversal                     │
│      crossAdapterTraversal.test.ts                        │
├─────────────────────────────────────────────────────────┤
│  L2  Bundle contract + orchestrator parsers             │
│      bundleContract.test.ts, bundleResolver.test.ts     │
├─────────────────────────────────────────────────────────┤
│  L1  Adapter conformance (8/8)                          │
│      adapterConformance.test.ts, p1Adapters.test.ts     │
├─────────────────────────────────────────────────────────┤
│  L0  Registry, permission resolver, federation static   │
│      adapterRegistry.test.ts, permissionResolver.test.ts│
│      federationConstitutional.test.ts                   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Test inventory (CG-1C)

| Suite | File | Tests | Gates |
|-------|------|------:|-------|
| Adapter registry | `adapterRegistry.test.ts` | 7 | G3 |
| Adapter conformance | `adapterConformance.test.ts` | 25 | G3, G6 |
| P1 adapter smoke | `p1Adapters.test.ts` | 5 | G3 |
| Permission resolver | `permissionResolver.test.ts` | 3 | G1 |
| Bundle resolver | `bundleResolver.test.ts` | 3 | G6, G8 |
| Bundle contract | `bundleContract.test.ts` | 10 | G4, G6 |
| Cross-adapter traversal | `crossAdapterTraversal.test.ts` | 4 | G1, G6 |
| Traversal permission matrix | `traversalPermissionMatrix.test.ts` | 13 | G1, G6, CG-F-007 |
| Federation / constitutional | `federationConstitutional.test.ts` | 7 | G2 |
| API integration | `context-graph.integration.test.ts` | 5 | G4 |
| **Total** | | **82** | |

**Baseline (CG-1B):** 30 tests · **CG-1C cumulative:** 82 tests

---

## 4. Mock vs live policy

| Layer | Strategy |
|-------|----------|
| L0–L2 | Unit tests with mocked upstream `*VlinkAccessService` and registry mocks |
| L3–L4 | Bundle resolver with mocked adapters — validates orchestration + PE trimming |
| L5 | Supertest against Express router with mocked orchestrator + live JWT auth path |
| Live DB integration | Optional future CG-2 hardening — not required for 1C evidence gate |

**Rationale:** Federation logic under test is orchestrator + permission assembly; module SoR access is validated via adapter conformance mocks of canonical access services.

---

## 5. Coverage targets (CG-1C)

| Dimension | Target | Actual |
|-----------|--------|--------|
| Adapter coverage | 8/8 (100%) | **100%** |
| Entity type coverage | 11/11 (100%) | **100%** |
| Permission matrix scenarios | ≥10 | **13** |
| Bundle contract assertions | ≥8 | **10** |

---

## 6. Gate mapping

| Gate | Evidence source |
|------|-----------------|
| **G1** Permission Safety | `traversalPermissionMatrix`, `permissionResolver`, `crossAdapterTraversal` |
| **G2** SoR Preservation | `federationConstitutional` (no writes, no universal table) |
| **G3** Adapter Boundaries | `adapterConformance`, `adapterRegistry` |
| **G4** API Coherence | `bundleContract`, `context-graph.integration` |
| **G5** AI Grounding | Not in CG-1C scope — CG-F-006 open |
| **G6** Test Evidence | All suites — 82 tests |
| **G7** Documentation | CG-1C report package |
| **G8** Traversal Safety | `traversalPermissionMatrix` M10–M11, `bundleContract` depth cap |
| **G9** DX | Bundle API docs + adapter registry (partial) |

---

## 7. Non-goals

- No new test adapters or entity types
- No projection/neighborhood API tests (deferred CG-1B-prime)
- No AI pipeline bundle tests (deferred CG-1D)
- No load/perf tests at 100-node cap (G8 score-3 deferred)

**Last updated:** 2026-06-19
