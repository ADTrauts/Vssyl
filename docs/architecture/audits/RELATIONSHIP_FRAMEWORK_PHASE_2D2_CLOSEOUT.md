# Relationship Framework — Phase 2D-2 Closeout

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph Visualization Contract  
**Status:** **Complete**  
**Date:** 2026-06-14  
**Prior phases:** 1A–1D, 2A–2C, 2D-1

> **Scope:** Constitutional graph visualization architecture only. No graph DB, persistence, services, APIs, UI, or schemas.

---

## Required report

| # | Topic | Section |
|---|-------|---------|
| 1 | Graph model summary | §1 |
| 2 | Projection rules | §2 |
| 3 | Visibility model summary | §3 |
| 4 | Traversal model summary | §4 |
| 5 | AI boundaries summary | §5 |
| 6 | Governance summary | §6 |
| 7 | Unresolved risks | §7 |
| 8 | Recommended next phase | §8 |

---

## Phase 2D-2 deliverables

| ID | Deliverable | Path | Status |
|----|-------------|------|--------|
| 2D2-1 | Graph visualization contract | [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](../RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md) | ✅ |
| 2D2-2 | Node and edge model | [GRAPH_NODE_AND_EDGE_MODEL.md](../GRAPH_NODE_AND_EDGE_MODEL.md) | ✅ |
| 2D2-3 | Permission and visibility | [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](../GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) | ✅ |
| 2D2-4 | Traversal and hydration | [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) | ✅ |
| 2D2-5 | AI graph interaction | [AI_GRAPH_INTERACTION_MODEL.md](../AI_GRAPH_INTERACTION_MODEL.md) | ✅ |
| 2D2-6 | Graph governance | [GRAPH_GOVERNANCE_AND_CERTIFICATION.md](../GRAPH_GOVERNANCE_AND_CERTIFICATION.md) | ✅ |
| 2D2-7 | Phase 2D-2 closeout | This document | ✅ |

---

## 1. Graph model summary

### Locked principles

| Principle | Statement |
|-----------|-----------|
| **Graph = read projection** | Built from adapters at request/session time |
| **Graph ≠ SoR** | Edges live in module tables + V_Link |
| **Graph ≠ write system** | Mutations only via module/platform APIs |
| **Graph ≠ relationship DB** | No universal GraphNode/GraphEdge store |
| **Federation constitutional** | Adapter fan-out — no cross-module SQL graph query |
| **Distinct surfaces** | Place Main Street ≠ V_Link hub ≠ Notebook links |

### Core concepts

Node, Edge, Container, Subgraph, Traversal — defined in visualization contract.

---

## 2. Projection rules

- Nodes/edges from **RelationshipReadDTO** + Pattern C hydrate  
- **Tag overlays** on nodes — not edges  
- **Suggestions/inference** dashed — `provenance ≠ sor`  
- Layout preference (Place coordinates) = **Preference** class — not semantic edge  
- Optional session cache — TTL + event invalidation — never authoritative  

---

## 3. Visibility model summary

**Fail-closed:** graph cannot show openable data user could not otherwise access.

- Same gates as search and adapters  
- V_Link: membership + **resolver** per attachment  
- Redacted placeholders certified for V_Link hub only  
- Cross-tenant forbidden  
- Aggregate counts without enumeration  

---

## 4. Traversal model summary

| Depth | Default |
|-------|---------|
| 1-hop | V_Link attachments, notebook links, deps |
| 2-hop | Certified surfaces only — hard node budget |
| N-hop | **Forbidden** user-facing (N>2) |

Flow: **Node → Read Adapter → Pattern C hydrate → Visibility gate → Projection**

Caps: 200 nodes, 500 edges, 8s request budget (defaults).

---

## 5. AI boundaries summary

| Allowed | Forbidden |
|---------|-----------|
| Summarize visible subgraph (depth 1, ≤50 nodes) | Auto-create relationships |
| Suggest links (pending) | Infer permissions |
| Explain taxonomy | Bypass visibility |
| Layer 4 optional context block | Graph overrides V_Link pipeline |

Precedence aligned with [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../AI_RELATIONSHIP_RETRIEVAL_MODEL.md) and [AI_AUTOMATION_BOUNDARY.md](../AI_AUTOMATION_BOUNDARY.md).

---

## 6. Governance summary

- **K7 graph providers** in registry model (`place.graph`, `vlink.graph`, …)  
- Certification **GV1–GV15** checklist  
- Levels G0–G3 maturity  
- Drift guards: no graph-only edges, adapter dependency list, no graph DB  

---

## 7. Unresolved risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| GV-R1 | Place `PlaceNode` layout confused with Follow SoR | Medium | GV10 Preference vs Follow docs |
| GV-R2 | Federated explorer scope creep | High | Depth 2 cap + anchor required |
| GV-R3 | UI caches graph as offline truth | Medium | TTL + invalidation mandatory |
| GV-R4 | React Flow persistence stores semantic edges | High | Governance PR checklist |
| GV-R5 | AI prompt includes truncated graph without flag | Low | Truncation metadata in AI block |
| GV-R6 | Batch hydrate APIs not built — N+1 perf | Medium | Implementation track |

---

## 8. Recommended next phase

**Not executed.** Architecture documentation only.

| Rank | Phase | Proposed deliverables |
|------|-------|----------------------|
| **2D-3 (recommended)** | **Recommendation Architecture** | `RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md` — proposals without SoR writes |
| **2D-4** | **Relationship Analytics Model** | `RELATIONSHIP_ANALYTICS_MODEL.md` — event-derived C0 metrics |

**Recommendation:** **2D-3 Recommendation Architecture** — completes consumer docs (search, automation, read, graph, recommend) under federation.

### Engineering (separate track)

- K7 graph provider registry runtime  
- Batch hydrate APIs  
- Federated explorer UI  
- Graph contract tests  

---

## Framework index update

Graph artifacts registered under **Phase 2D-2** in [RELATIONSHIP_FRAMEWORK_INDEX.md](../RELATIONSHIP_FRAMEWORK_INDEX.md).

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Graph as projection — not SoR | ✅ |
| Node/edge model with adapters | ✅ |
| Fail-closed visibility | ✅ |
| Traversal caps + hydration flow | ✅ |
| AI boundaries aligned | ✅ |
| Governance + certification | ✅ |
| No graph DB / universal store | ✅ |
| Phase 2D-3 recommended | ✅ |

---

## Next step

**Human gate:** Approve Phase 2D-3 (Recommendation Architecture).

**Do not execute Phase 2D-3** until explicitly requested.

---

**Last updated:** 2026-06-14
