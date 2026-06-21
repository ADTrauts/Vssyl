# Context Graph — Reference Comparison

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Internal platform comparison — no external product copying

---

## Purpose

Compare V_Link / Context Graph against certified and reference Vssyl platform capabilities to identify reuse patterns, boundaries, and gaps.

---

## Comparison matrix

| Capability | Tier | Graph role | Maturity | Reuse for Context Graph |
|------------|------|------------|----------|-------------------------|
| **V_Link** | Tier 0 | Association substrate | Production | **Primary foundation** |
| **Org Chart (#OC-1)** | BA platform | Hierarchy nodes | L3 certified | Business identity adapter |
| **Approval Hierarchy (#OC-3)** | BA platform | Workflow edges | L3 certified | Routing edges — orthogonal |
| **Permission Sets (#OC-2)** | BA platform | Access policy | L3 certified | PE on nodes — not edges |
| **File Hub** | Reference impl | Entity node pattern | L3 ~87% | Hydrate + access grant model |
| **AI Pipeline context** | Tier 0 | Consumer | Production | Flagship graph consumer |
| **Relationship Framework** | Tier 0 | Constitutional | Phase 2D docs | **Governing taxonomy** |
| **Tag Strategy** | Tier 0 | Node metadata | Phase 2A docs | Metadata layer — not nodes |
| **NotebookLink** | Module | Operational edges | Production | Secondary edge SoR |
| **Admin Portal** | Platform | Graph admin/config | L3 certified | Pipeline source governance |

---

## V_Link (baseline)

| Dimension | Assessment |
|-----------|------------|
| **What it provides** | Cross-module association containers + AI grounding |
| **What it lacks** | Federation orchestrator, graph API, full resolver coverage |
| **Context Graph relationship** | **Evolve into association registry** — not replace |
| **Certification** | Tier 0 — not separately ledgered; Relationship Framework audited |

**Key reuse:** `vlinkEntityResolverService`, `vlinkPipelineContextService`, permission model, domain events.

---

## Org Chart (#OC-1) — Reference Platform Capability With Findings

| Dimension | Assessment |
|-----------|------------|
| **Node types** | Tier, department, position, employee assignment |
| **Edge types** | `EmployeePosition` (user → position), hierarchy containment |
| **Graph class** | Hierarchy + Membership |
| **V_Link overlap** | V_Link may **reference** positions — org chart owns SoR |
| **Reuse pattern** | Business-scoped hierarchy adapter for graph projection |

**Boundary:** Org chart is **authoritative for workforce identity** — Context Graph reads via adapter; does not store duplicate hierarchy.

---

## Approval Hierarchy (#OC-3) — Reference Platform Capability With Findings

| Dimension | Assessment |
|-----------|------------|
| **Edge type** | `ManagerApprovalHierarchy` (employee → manager chain) |
| **Graph class** | Hierarchy (workflow routing) |
| **V_Link overlap** | None — different semantic |
| **Reuse pattern** | Workflow intent adapter; approval routing queries |

**Boundary:** Approval hierarchy routes **decisions** — not user-curated context grouping. Do not conflate with V_Link associations.

---

## Permission Sets (#OC-2) — Reference Platform Capability With Findings

| Dimension | Assessment |
|-----------|------------|
| **Role** | Module access gating via PE |
| **Graph class** | Access policy on nodes |
| **V_Link overlap** | Governs whether user can link/hydrate entity |
| **Reuse pattern** | PE checkpoint in federation orchestrator |

**Boundary:** Permissions govern **access** — not **association**. A user may lack file access but still see "restricted" in vlink list.

---

## File Hub — Reference Implementation

| Dimension | Assessment |
|-----------|------------|
| **Node types** | File, folder |
| **Edge types** | Folder containment, FilePermission (access grant) |
| **V_Link integration** | ✅ Reference path — `driveVlinkAccessService` |
| **Reuse pattern** | Gold-standard entity node + lifecycle unlink + trash |

**Lessons for Context Graph:**

1. Dedicated `*VlinkAccessService` per module
2. Lifecycle unlink on permanent delete
3. PE dual evaluation before link
4. Normalized activity + domain events (File Hub pattern)

---

## AI Pipeline context sources

| Dimension | Assessment |
|-----------|------------|
| **V_Link source** | id `vlink` — first-class catalog entry |
| **Other sources** | Module providers, memory, place, location |
| **Graph relationship** | Pipeline is **consumer #1** of Context Graph |
| **Reuse pattern** | Extend catalog with `graph_bundle` source (future) |

**Precedence:** Memory > V_Link > module providers > inference ([AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md)).

---

## Business Administration ownership model

| Pattern | Context Graph adoption |
|---------|------------------------|
| Service decomposition | Federation orchestrator as platform service |
| Activity + domain events | V_Link already emits — extend to graph invalidation |
| PE dual evaluation | Required at every hydrate hop |
| Platform capability vs module | Context Graph = Tier 0 capability |

---

## Relationship Framework (constitutional)

| Artifact | Context Graph use |
|----------|-------------------|
| [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md) | Edge classification |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](../architecture/RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | Federation rules |
| [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) | Traversal caps |
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](../architecture/RELATIONSHIP_READ_ADAPTER_CATALOG.md) | Adapter inventory |
| [TAG_STRATEGY.md](../architecture/TAG_STRATEGY.md) | Tag as metadata |

**Do not duplicate** — Context Graph program extends Relationship Framework Phase 2D+ into operational architecture.

---

## Gap vs reference capabilities

| Reference provides | Context Graph still needs |
|--------------------|---------------------------|
| V_Link associations | Federation orchestrator service |
| Org chart hierarchy | Org chart graph adapter |
| File Hub entity pattern | NOTE dedicated access service |
| AI pipeline consumption | Context bundle formalization |
| Relationship Framework docs | Graph read API contract |
| Tag Strategy | Tag index (read mirror) |

---

## Strategic alignment

| Question | Answer |
|----------|--------|
| Copy File Hub patterns? | **Yes** — for module resolver completeness |
| Merge with Org Chart? | **No** — adapter read only |
| Replace V_Link with new system? | **No** — evolve V_Link |
| Compete with NotebookLink? | **No** — complementary edge classes |

---

**Last updated:** 2026-06-18
