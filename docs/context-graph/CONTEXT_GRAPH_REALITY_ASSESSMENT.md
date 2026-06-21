# Context Graph — Reality Assessment

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery and reality assessment  
**Date:** 2026-06-18  
**Status:** Discovery artifact — no implementation

---

## Executive finding

**V_Link is not merely a linking feature.** It is already a **Tier 0 platform primitive** — a scoped, nestable **association container** with membership, polymorphic cross-module attachments, AI pipeline integration, domain events, and a permission model that separates container access from entity content access.

**However, V_Link is also not yet a full Context Graph.** It lacks:

- Federated read orchestration across all relationship classes
- Graph projection / traversal API (constitutional docs exist; no runtime)
- Context bundle composition beyond AI pipeline prepass
- Realtime graph invalidation
- Unified node identity across module SoRs
- Cross-module tag index

The strategic question is therefore **evolution, not invention**: extend V_Link and the Relationship Framework into a **canonical Context Graph and Knowledge Layer** without violating module ownership or creating a universal entity table.

---

## Question 1 — What is V_Link today?

| Dimension | Reality |
|-----------|---------|
| **Constitutional class** | Association (+ Membership on container) |
| **Tier** | Tier 0 platform layer — not a marketplace module |
| **Primary artifact** | `VLink` container + `VLinkEntity` attachments |
| **User value** | Cross-module "project context" grouping for humans and AI |
| **AI role** | First-class pipeline source `vlink`; `persistedVLinks` in entity linking |
| **Access model** | Membership grants **container** visibility; entity content requires module PE |
| **Maturity** | Production-shipped; ~18 entity types resolved; 6 advisories in relationship docs |

**Verdict:** V_Link is the **seed substrate** of the Context Graph — not the complete graph.

---

## Question 2 — Graph candidate inventory

See [CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md](./CONTEXT_GRAPH_CURRENT_STATE_INVENTORY.md) §12.

| Metric | Count |
|--------|------:|
| `VLinkEntityType` enum values | 25 |
| Production-active resolver types | ~18 |
| Platform registry entity keys | 17 |
| Additional relationship-relevant entity categories | ~29 |
| **Distinct graph candidate node types** | **~45–50** |

---

## Question 3 — Canonical object architecture

### Options evaluated

| Option | Description | Fit with Vssyl constitution |
|--------|-------------|----------------------------|
| **A** | V_Link is the graph node | ❌ Collapses module entities into container; loses module SoR |
| **B** | V_Link becomes edge only | ❌ Destroys container semantics, nesting, membership, public code |
| **C** | New ContextNode + V_Link as relationship | ⚠️ Correct **conceptually**; literal universal table **forbidden** |

### Recommendation: **Conceptual Option C — Federated implementation**

Adopt **Option C as the architecture model**, implemented via **federation** (not a new `ContextNode` Prisma table):

| Graph role | Canonical identity | SoR |
|------------|-------------------|-----|
| **Entity node** | `(moduleId, entityType, entityId)` | Owning module Prisma model |
| **Container node** | `vlink:{vlinkId}` | `VLink` table |
| **Association edge** | `VLinkEntity` row | Platform vlink schema |
| **Operational edge** | Module junction (NotebookLink, TaskFileLink, …) | Owning module |
| **Hierarchy edge** | Org chart, approval hierarchy, folder tree | Owning module / BA platform |

**V_Link evolves** from "linking UI" to **primary cross-module association edge registry** — while module entities remain the authoritative nodes.

Do **not** demote V_Link to a simple pairwise edge (Option B). Do **not** treat V_Link containers as the only graph nodes (Option A).

---

## Question 4 — Tags analysis

| Option | Assessment |
|--------|------------|
| **A. Tags as graph node aliases** | ❌ Semantic collapse — tags have no target entity |
| **B. Tags as metadata on graph nodes** | ✅ **Recommended** — aligns with [TAG_STRATEGY.md](../architecture/TAG_STRATEGY.md) |
| **C. Tags as separate graph entity** | ❌ Over-engineered for v1; no global `Tag.id` exists |
| **D. Tags should not exist** | ❌ Six modules already use `tags[]`; Place discovery depends on them |

### Recommendation: **Option B**

- Tags remain **module-local SoR** on host entities
- Graph hydration includes tags **with entity node** (Pattern A)
- Future **Tag Index** (read-only federation mirror) enables cross-module facet search — not a graph node type
- AI must **not** infer relationships from tag string collision

---

## Question 5 — AI architecture (analysis only)

AI should consume the graph through **layered federation**, not raw traversal:

```
1. UserMemoryFact          — explicit durable facts
2. Persisted V_Link        — confirmed cross-module associations
3. Module AI providers     — entity-scoped context
4. Operational links       — NotebookLink, task deps (intent-gated)
5. Context bundles         — composed views (future logical API)
6. Search hydrate          — PE re-check required
7. Inference               — ephemeral; never SoR
```

| Consumption pattern | Mechanism | Status |
|--------------------|-----------|--------|
| Graph nodes | Module providers + resolver hydrate | ✅ Partial |
| Graph relationships | `vlinkPipelineContextService`, adapters | ✅ Partial |
| Context bundles | V_Link container ≈ proto-bundle | ⚠️ Implicit only |
| Memory structures | `UserMemoryFact`, `UserAIContext` | ✅ Separate SoR |

**No implementation in Phase 0A.** See [CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md](./CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md).

---

## Question 6 — Permission architecture

| Scope | Graph rule |
|-------|------------|
| **Personal** | `dashboardId` scope; user membership on V_Link; module PE on attachments |
| **Business** | `dashboardId` + `businessId`; business member checks on resolvers |
| **Household** | `dashboardId` + `householdId` |
| **Shared** | V_Link membership shares **container metadata only** — not entity content |
| **Public** | No anonymous V_Link access in v1; Place listing tags are module-public |
| **Membership-based** | `VLinkMember` roles; module participant tables for entity content |

**Non-negotiable preserved:** V_Link membership ≠ entity access grant.

---

## Question 7 — Platform scope classification

| Option | Assessment |
|--------|------------|
| **A. Module feature** | ❌ V_Link is already Tier 0 — not marketplace module |
| **B. Platform capability** | ✅ Primary classification |
| **C. AI subsystem only** | ❌ Serves humans, search, automation — not AI-only |
| **D. Core platform layer** | ✅ Co-classification with Tier 0 primitives |

### Recommendation: **B + D**

**Context Graph = Core Platform Capability (Tier 0)** — peer to V_Link, Policy Engine, Domain Events, Workspace Runtime. AI is a **primary consumer**, not the owner.

---

## Question 8 — Future capability mapping

| Capability | Belongs in graph? | Natural home |
|------------|-------------------|--------------|
| **Knowledge graph** | ✅ Yes | Federated read + V_Link associations |
| **AI memory** | ⚠️ Adjacent | `UserMemoryFact` — not graph edge |
| **Context bundles** | ✅ Yes | V_Link containers → formalized bundle contract |
| **Workflow relationships** | ⚠️ Partial | Module operational links + approval hierarchy |
| **Analytics correlation** | ✅ Yes | Derived views — not SoR |
| **Cross-module intelligence** | ✅ Yes | Pipeline + federation orchestrator |
| **Search enrichment** | ✅ Yes | Relationship-aware hydrate (Pattern C) |

---

## Gap analysis

| Gap | Severity | Notes |
|-----|----------|-------|
| No graph traversal API | Major | Constitutional docs exist ([GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md)) |
| No federation read orchestrator service | Major | Logical contract only |
| NOTE resolver partial | Moderate | Inline Prisma; no dedicated access service |
| No vlink realtime | Low | Acceptable for v1 |
| No cross-module tag index | Moderate | Documented future in Tag Strategy |
| Parallel association stores | Moderate | V_Link + NotebookLink + module links |
| Activity not in module envelope | Low | Container-local only |

---

## Implementation recommendation

| Question | Answer |
|----------|--------|
| Should Context Graph proceed? | **Yes — phased** |
| Start with runtime? | **No** — Phase 0B constitutional architecture first |
| Rename V_Link? | **No** — evolve semantics; V_Link remains user-facing brand |
| New universal table? | **No** — federation over existing SoRs |

---

## Related deliverables

| Document | Purpose |
|----------|---------|
| [CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md](./CONTEXT_GRAPH_PLATFORM_ARCHITECTURE.md) | Target architecture |
| [CONTEXT_GRAPH_ENTITY_RELATIONSHIP_MODEL.md](./CONTEXT_GRAPH_ENTITY_RELATIONSHIP_MODEL.md) | Node/edge model detail |
| [CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md](./CONTEXT_GRAPH_MODERNIZATION_ROADMAP.md) | Phase 0B+ scope |

**Last updated:** 2026-06-18
