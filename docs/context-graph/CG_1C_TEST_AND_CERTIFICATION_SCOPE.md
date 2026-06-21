# CG-1C — Test & Certification Scope

**Program:** Vssyl Context Graph  
**Phase:** 1C — Test & Certification Evidence (authorized, not started)  
**Date:** 2026-06-19  
**Authority:** [CG_1C_AUTHORIZATION_RECOMMENDATION.md](./CG_1C_AUTHORIZATION_RECOMMENDATION.md)  
**Status:** Scope definition — **no implementation**

---

## 1. Purpose

Define the test and certification evidence package for the existing federated Context Graph runtime (8 adapters, 11 entity types). CG-1C **does not add adapters, APIs, schema, or UI**.

**Baseline (CG-1B):** 30 tests · G1–G9 ~21/27 (~78%) · CG-F-007 partial · CG-F-006 open

**Target (CG-1C):** ≥40 tests · G1–G9 ~24/27 (~89%) · CG-F-007 closed · CG-2 evaluation ready

---

## 2. In scope

### 2.1 Test architecture

| Deliverable | Description |
|-------------|-------------|
| `CONTEXT_GRAPH_TEST_ARCHITECTURE.md` | Layering: unit → adapter conformance → bundle integration → API → permission matrix |
| Test inventory map | Maps suites to gates G1, G3, G4, G6, G8 |
| Mock vs live policy | When DB-backed integration required vs adapter mocks |

### 2.2 Adapter conformance tests

One conformance suite per adapter verifying contract methods:

| Adapter | Methods under test | Min tests |
|---------|-------------------|----------:|
| vlink | getNode, getNeighbors, getPermissions, getSummary | 3 |
| drive | file + folder paths | 4 |
| calendar | event path | 2 |
| todo | task path | 2 |
| notes | note + notebook.link neighbors | 3 |
| notebook | notebook_page, notebook, neighbors | 3 |
| chat | conversation; deny path | 2 |
| place | place_list, place; place_review null | 3 |

**Target:** ≥22 new or consolidated conformance assertions

### 2.3 Permission traversal matrix (CG-F-007)

≥10 integration scenarios covering:

| # | Scenario | Adapters involved |
|---|----------|-------------------|
| 1 | V_Link member, denied drive attachment | vlink → drive |
| 2 | V_Link member, denied note attachment | vlink → notes |
| 3 | V_Link member, denied chat attachment | vlink → chat |
| 4 | Note → drive via notebook.link, file denied | notes → drive |
| 5 | Note → calendar via notebook.link | notes → calendar |
| 6 | Note → todo via notebook.link | notes → todo |
| 7 | Note → chat via notebook.link | notes → chat |
| 8 | Restricted node in bundle (not omitted) | any |
| 9 | Denied node omitted (count in meta) | any |
| 10 | Depth cap — no 3-hop leakage | orchestrator |
| 11 | Node budget truncation | orchestrator |
| 12 | Non-member V_Link root forbidden | vlink |

### 2.4 Bundle consistency tests

| Test area | Validates |
|-----------|-----------|
| Descriptor shape | `ContextBundleDescriptor` v1.0 fields |
| Deduplication | Same entity ref once in `nodes[]` |
| Provenance | Per-adapter source counts |
| permissionOutcome | gatesApplied, omittedNodes, restrictedNodes |
| Contract header | `X-Context-Graph-Contract-Version: 1.0` |
| tenantScope | Required on POST resolve |

### 2.5 Operation matrix validation

Cross-check [CONTEXT_GRAPH_OPERATION_MATRIX.md](./CONTEXT_GRAPH_OPERATION_MATRIX.md) against runtime:

| Operation | Expected state post-1B |
|-----------|------------------------|
| Bundle resolve (entity root) | Implemented |
| V_Link bundle | Implemented |
| Entity neighborhood GET | **Not implemented** — document as deferred (1B-prime) |
| Projection GET | **Not implemented** — document as deferred |
| Adapter registry list | Runtime via `listRegisteredAdapters` |
| Write/mutation | **Prohibited** — confirm absent |

Output: `CG_1C_OPERATION_MATRIX_VALIDATION.md`

### 2.6 Findings review

| Finding | CG-1C action |
|---------|--------------|
| CG-F-004 | Confirm graph-path closed; document lifecycle/manifest residual |
| CG-F-006 | Document open; waivable at CG-2 if CG-1D deferred |
| CG-F-007 | **Target closure** via traversal matrix |
| CG-F-008 | Confirm deferred (projection) |
| CG-F-009 | Confirm CHAT_THREAD deferred |
| CG-F-010 | Confirm partial closure (NotebookLink edges) |

Output: findings register addendum or updated register section

### 2.7 Readiness scorecard update

Re-score G1–G9 per [CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md](./CONTEXT_GRAPH_CERTIFICATION_FRAMEWORK.md) with CG-1C evidence.

**Projected post-1C:**

| Gate | Current (1B) | Target (1C) |
|------|-------------|-------------|
| G1 | 2 | **3** |
| G2 | 3 | 3 |
| G3 | 3 | 3 |
| G4 | 2 | **2–3** |
| G5 | 2 | 2 (unchanged — no AI bundle in 1C) |
| G6 | 2 | **3** |
| G7 | 3 | 3 |
| G8 | 2 | 2 |
| G9 | 2 | 2 |
| **Total** | ~21 | **~24** |

---

## 3. Out of scope (explicit)

| Non-goal | Deferred to |
|----------|-------------|
| New adapters | Not planned in Phase 1 |
| HR / Scheduling / WF / BA / Admin adapters | CG-2+ / never Tier 0 |
| AI Memory adapter | CG-1D or never |
| Tag index | Phase 2A |
| Graph UI | Phase 2B |
| Projection API | CG-1B-prime |
| Neighborhood API | CG-1B-prime |
| AI pipeline bundle migration | CG-1D (CG-F-006) |
| Ledger row | CG-2 minimum |
| Certification award | CG-2 evaluation |

---

## 4. Deliverable documents (CG-1C)

| Document | Purpose |
|----------|---------|
| `CONTEXT_GRAPH_TEST_ARCHITECTURE.md` | Test layering and policies |
| `CG_1C_OPERATION_MATRIX_VALIDATION.md` | Matrix vs runtime |
| `CG_1C_TRAVERSAL_PERMISSION_MATRIX.md` | CG-F-007 evidence |
| `CG_1C_READINESS_SCORECARD.md` | Updated G1–G9 |
| `CG_1C_IMPLEMENTATION_REPORT.md` | Phase closeout |
| `CG_1C_FINDINGS_REVIEW.md` | Closure recommendations |

---

## 5. Test file targets (implementation hint — not authorized now)

| Path | Purpose |
|------|---------|
| `server/src/context-graph/__tests__/adapterConformance.test.ts` | All 8 adapters |
| `server/src/context-graph/__tests__/traversalPermissionMatrix.test.ts` | CG-F-007 |
| `server/src/context-graph/__tests__/bundleContract.test.ts` | Descriptor consistency |
| Extend `crossAdapterTraversal.test.ts` | Additional paths |

---

## 6. Exit criteria summary

| Metric | Target |
|--------|--------|
| Adapters with conformance coverage | 8/8 |
| Traversal permission scenarios | ≥10 PASS |
| Total context-graph tests | ≥40 |
| CG-F-007 | Closed |
| G6 | Score 3 |
| G1–G9 | ≥24/27 |
| Constitutional re-audit | PASS |

---

## 7. Stop condition

Scope definition complete. **No test implementation** until separate ACT mode charter with `Mode: ACT` and CG-1C package.

**Last updated:** 2026-06-19
