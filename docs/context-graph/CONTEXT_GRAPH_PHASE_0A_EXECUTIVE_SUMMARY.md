# Context Graph — Phase 0A Executive Summary

**Program:** Context Graph Phase 0A — Reality Assessment & Relationship Discovery  
**Date:** 2026-06-23  
**Status:** **Complete** (discovery only — no implementation)

---

## Bottom line

**Vssyl already contains a partial Context Graph.** The platform has moved past V_Link foundations into a **certified Relationship Platform** (Context Graph L3, RD-CG-010) with eight federation adapters, bundle resolution for AI, and a federated tag index. AI Retrieval adoption across five consumers now provides the **first production dataset** showing which relationships are **persisted** (V_Link, module FKs) versus **repeatedly reconstructed** (search evidence, cross-module project context).

Phase 0A confirms: **the work ahead is unification of consumption paths**, not invention of graph infrastructure.

---

## Graph maturity

| Metric | Value |
|--------|-------|
| **Current level** | **3.5** (Relationship Platform → Graph Ready) |
| **Target level** | **4** — Graph Ready (unified AI + Search + federation) |
| **Certified Context Graph** | L3 CwF (separate program scale) |
| **Primary blockers** | Retrieval↔bundle bridge; parallel grounding paths; NOTE V_Link gap |

### Maturity scale

| Level | Status |
|-------|--------|
| 0 — No relationships | ❌ |
| 1 — Ad hoc | ✅ Historical |
| 2 — V_Link foundations | ✅ |
| 3 — Relationship platform | ✅ **Current baseline** |
| 4 — Graph ready | ⚠️ Partial |
| 5 — Certified graph capability | ⚠️ L3 certified; full convergence pending |

---

## Relationship inventory (summary)

| Category | Count (representative) | SoR |
|----------|------------------------|-----|
| V_Link attachments | 8+ entity types | `VLinkEntity` |
| Module-native edges | 15+ patterns | Module Prisma |
| Access grants | Drive, notes, calendar shares | Module tables |
| Membership | Business, household, V_Link, chat | Mixed |
| Ephemeral (retrieval/search) | 5 consumer profiles | None |

**Full inventory:** [CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md](./CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md)

---

## Existing foundations

| Foundation | Evidence |
|------------|----------|
| **V_Link** | 5 Prisma models, 23 API routes, 20 services |
| **Platform entities** | Registry in `registerPlatformEntities.ts` |
| **Relationship taxonomy** | 16+ constitutional classes |
| **Context Graph federation** | `server/src/context-graph/*`, 8 adapters |
| **AI graph bundles** | `graph_bundle` pipeline source (CG-1D) |
| **Tag index** | Federated read API (CG-2A) |
| **Unified Search** | Certified; provider registry |
| **AI Retrieval** | 5 consumers; 47 tests passing |
| **Read adapter catalog** | Constitutional federation docs |

---

## V_Link role

**Hybrid node + edge model:**

- **VLink container** = navigable graph **node** (hub)
- **VLinkEntity** = cross-module **edge** (association)
- **VLinkMember** = membership edge (container visibility, not content access)

V_Link is the **primary cross-module association substrate**. It is not the entire graph.

---

## AI discovery findings

| Consumer | Search alone sufficient? | Top traversal need |
|----------|--------------------------|-------------------|
| planning | Moderate | Task/event containment |
| workflow_action | Low | Attachment + action targets |
| business_operations | Moderate | Business scope bundle |
| **project_assistant** | **No** | Cross-module project hub |
| local_discovery | Good for Place | Business↔listing context |

**Strongest graph candidates:** project_assistant cross-module bundles; workflow attachment edges; retrieval evidence co-occurrence (inference only).

**Detail:** [CONTEXT_GRAPH_AI_DISCOVERY_ANALYSIS.md](./CONTEXT_GRAPH_AI_DISCOVERY_ANALYSIS.md)

---

## Architectural risks

| Risk | Severity |
|------|----------|
| Retrieval rediscovers same relationships every request | Major |
| Parallel grounding (vlink / graph_bundle / retrieval) | Moderate |
| Search index mistaken for SoR | Major (mitigated by framework) |
| Auto-persist inference as V_Link | Major (forbidden) |
| Incomplete NOTE / dashboard V_Link coverage | Moderate |

---

## Recommendation

**D — Hybrid:** Relationship federation layer above module entities, with **V_Link as association SoR** and **Context Graph as certified orchestration capability**. AI Retrieval and Unified Search feed **discovery/inference** into bundle composition — they do not replace persisted edges.

**Detail:** [CONTEXT_GRAPH_STRATEGIC_POSITIONING.md](./CONTEXT_GRAPH_STRATEGIC_POSITIONING.md)

---

## Phase 1 roadmap (proposed — not authorized)

| Phase | Focus | Out of scope |
|-------|-------|--------------|
| **1A — Consumption bridge** | Map retrieval evidence → bundle inference edges; grounding reconcile dedup | New tables |
| **1B — Traversal API** | Bounded read API per existing contract | Graph DB |
| **1C — project_assistant pilot** | Enable opt-in; measure federation depth vs search-only | Auto V_Link |
| **1D — SC-M4 council** | Search convergence register; Place path decision | Search rewrite |
| **1E — NOTE V_Link** | Close resolver gap per entity truth table | V_Link redesign |

---

## Deliverables (Phase 0A)

| Document | Status |
|----------|--------|
| [CONTEXT_GRAPH_REALITY_ASSESSMENT.md](./CONTEXT_GRAPH_REALITY_ASSESSMENT.md) | ✅ |
| [CONTEXT_GRAPH_ENTITY_CATALOG.md](./CONTEXT_GRAPH_ENTITY_CATALOG.md) | ✅ |
| [CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md](./CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md) | ✅ |
| [CONTEXT_GRAPH_AI_DISCOVERY_ANALYSIS.md](./CONTEXT_GRAPH_AI_DISCOVERY_ANALYSIS.md) | ✅ |
| [CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md](./CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md) | ✅ |
| [CONTEXT_GRAPH_STRATEGIC_POSITIONING.md](./CONTEXT_GRAPH_STRATEGIC_POSITIONING.md) | ✅ |
| **This executive summary** | ✅ |

---

## Central question — answered

> What relationships already exist across Vssyl, and how should AI, Search, and Retrieval use them?

**Relationships exist** across module schemas, V_Link, operational refs, activity, and ephemeral search/retrieval discovery. **AI should consume** them through the federation stack (adapters → bundles → grounding reconcile) with persisted V_Link and module edges as truth, search/retrieval as discovery with `inference` provenance, and domain events as invalidation signals only.

**No graph tables. No V_Link redesign. No traversal APIs in Phase 0A.**

---

**Last updated:** 2026-06-23
