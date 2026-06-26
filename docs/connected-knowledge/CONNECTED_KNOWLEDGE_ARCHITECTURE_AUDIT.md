# Connected Knowledge Platform — Architecture Audit

**Program:** Connected Knowledge Platform — Phase 0A (updated Phase 1A)  
**Date:** 2026-06-25  
**Status:** Phase 1A composition engine implemented — federation layer active

**Related:** [CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md](../context-graph/CONTEXT_GRAPH_ARCHITECTURE_AUDIT.md) (extends and supersedes for knowledge-layer scope)

---

## 1. Audit question

How do Vssyl's certified platform capabilities compose into a **Connected Knowledge Platform** — and what must **not** be rebuilt?

---

## 2. Target architecture (logical)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONSUMERS (entity-centric experiences)                                   │
│  AI Twin · Unified Search · Workspace hubs · Admin · Partner delegates   │
├─────────────────────────────────────────────────────────────────────────┤
│ CONNECTED KNOWLEDGE FEDERATION (Phase 1+ — extends Context Graph)        │
│  Bundle API · provenance · confidence · neighborhood · governance        │
├─────────────────────────────────────────────────────────────────────────┤
│ CERTIFIED ORCHESTRATION (as-built)                                       │
│  Context Graph L3 · V_Link SoR · AI Retrieval · Unified Search         │
├─────────────────────────────────────────────────────────────────────────┤
│ RUNTIME KERNEL                                                           │
│  Activity · Domain Events · Policy Engine · Platform Entities registry   │
├─────────────────────────────────────────────────────────────────────────┤
│ MODULE SYSTEMS OF RECORD                                                 │
│  Drive · Chat · Calendar · Todo · HR · Scheduling · Place · …            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Principle:** Connected Knowledge is a **consumption and governance layer** atop existing SoRs — not a new database tier.

---

## 3. Integration matrix (extended)

| System | Knowledge role | Must NOT become | Integration to Connected Knowledge |
|--------|----------------|-----------------|-----------------------------------|
| **Platform Entities** | Node keys | Entity storage | Registry drives all bundle node IDs |
| **V_Link** | Cross-module association SoR | Universal graph DB | Primary explicit edge source |
| **Context Graph** | Federation orchestrator | Edge persistence | **Phase 1A:** orchestrates Knowledge Composition Engine |
| **Unified Search** | Entity discovery | Relationship SoR | Supplies candidates + ranking hints |
| **AI Retrieval** | Ephemeral evidence | Silent edge writer | Feeds inference slice of bundle |
| **Platform Kernel** | Temporal audit | "What is connected" | Activity actions on link/unlink |
| **Domain Events** | Invalidation | Relationship storage | Re-fetch triggers on mutations |
| **AI Memory** | User facts | Graph edges | Prepended context slice in bundle |
| **Notifications** | Alert delivery | Knowledge | Subscribes to link/suggest events |
| **Dashboard** | Surfacing | SoR | Widgets consume bundle summaries |
| **Business Workspace** | Tenant router | Module SoR | Entity landing routes into federation |
| **Marketplace** | External SoR bridge | In-process resolver | Delegate contract for hydrate/access |

---

## 4. Consumption path audit (as-built)

### 4.1 AI Digital Life Twin

```
Intent → catalog sources → module providers
      → vlinkPipelineContextService (persisted)
      → aiRetrievalCapabilityService (evidence)
      → context graph bundle (anchor intents)
      → entityLinking (merge, ephemeral)
      → MemoryRetrievalService (facts)
      → grounding reconcile → prompt
```

| Issue | Severity |
|-------|----------|
| Three relatedness paths without unified provenance in prompt | **High** |
| Retrieval evidence not always bridged to graph bundle | **Medium** |
| Dedup between V_Link pipeline and graph adapter | **Medium** |
| Legacy activity reads in some context engines | **High** (ACT-R1) |

### 4.2 Unified Search

```
Query → searchProviderRegistry → module providers → ranked hits
```

| Issue | Severity |
|-------|----------|
| No relationship expansion in results | **Low** (by design) |
| BO modules missing providers | **High** for business knowledge |
| No provenance on "related" suggestions | **Medium** |

### 4.3 V_Link hub UI

```
User → /vlink → listVLinkEntities → vlinkEntityResolverService
```

| Issue | Severity |
|-------|----------|
| Only surfaces V_Link attachments — not module-native edges | **Medium** |
| No AI suggestion review in unified governance view | **Medium** |
| Notebook/Notes gaps | **High** |

### 4.4 Activity feed / timeline

```
activityFeedController → platformActivityQueryService (migrating)
                     → legacy fallbacks (partial)
```

| Issue | Severity |
|-------|----------|
| Incomplete kernel read migration | **High** |
| Link/unlink events not consistently in cross-module feed | **Medium** |

---

## 5. Duplication hotspots

| Hotspot | Paths | Recommended convergence |
|---------|-------|----------------------|
| V_Link reads | Pipeline service, graph adapter, hub API | Single `readVLinkNeighborhood()` internal contract |
| Related entities for AI | Retrieval, entityLinking, graph | Federation bundle with `edge.provenance` |
| Entity registration | Registry, enum, manifest | CI validation via Platform Controller |
| Project context | V_Link hub, Todo project, AI reconstruction | Document V_Link as cross-module hub; Todo as task containment |

---

## 6. Gap analysis vs Connected Knowledge target

| Requirement | As-built (Phase 1A) | Remaining gap |
|-------------|---------------------|---------------|
| Single bundle shape for consumers | ✅ `KnowledgeBundle` via composer for pilot 4 + API | Search hints + all consumers |
| Provenance on every edge | ✅ Mapped at compose time | Persisted provenance in SoR (optional) |
| Confidence visualization | ✅ C1–C4 on edges; pipeline diagnostics | User-facing badges (Phase 1B) |
| Entity neighborhood API | Compose API only | `GET /knowledge/neighborhood/:nodeKey` (Phase 1B) |
| Partner entities | Blocked | Delegate spec |
| Custom entities | None | Governance program |
| Causal narrative | Activity only | Phase 2+ |

---

## 7. Security and trust boundaries

| Boundary | Rule |
|----------|------|
| Federation read | Every hop through module adapter + PE |
| Inference | Hydrate re-check before prompt inclusion |
| V_Link | Membership ≠ attachment access (unchanged) |
| Partner delegate | Platform stores edge; partner validates access on hydrate |
| Cross-tenant | dashboardId + businessId scope on all reads |

Aligns with [backend-trust-boundaries.mdc](../../.cursor/rules/backend-trust-boundaries.mdc).

---

## 8. Relationship to Context Graph program

| Context Graph (certified) | Connected Knowledge (this program) |
|---------------------------|-------------------------------------|
| Federation for AI bundles | Federation for **all knowledge consumers** |
| 8 adapters | Complete adapter coverage + partner |
| Bundle descriptor spec | + provenance/confidence extensions |
| L3 certification | Extends charter — **not a competing program** |

**Naming:** Avoid "V_Graph" as separate product. Use **Connected Knowledge Platform** as program name; **Context Graph** remains the orchestration engine.

---

## 9. Phase sequencing (architecture-only)

| Phase | Focus | Builds on |
|-------|-------|-----------|
| **0A** | Reality assessment | ✅ This deliverable set |
| **0B** | Charter + provenance constitution | Relationship Framework |
| **1A** | Consumption convergence | Context Graph bridge completion | ✅ Knowledge Composition Engine |
| **1B** | Neighborhood API + governance UI spec | V_Link evolution |
| **2A** | Partner delegate | Marketplace architecture |
| **2B** | Entity-primary UX | Reference Workspace |

**No schema work in 0A/0B.**

---

## 10. Audit verdict

| Question | Answer |
|----------|--------|
| Rebuild graph storage? | **No** |
| Replace V_Link? | **No — evolve** |
| Replace Context Graph? | **No — extend** |
| New platform capability certification? | **Yes — Connected Knowledge as Tier 0 program after 0B** |
| Blocker before Phase 1? | Adoption ACT-R1 + retrieval/graph dedup spec — **1A composition unblocked** |

---

## 11. References

- [AI_KNOWLEDGE_MODEL_ASSESSMENT.md](./AI_KNOWLEDGE_MODEL_ASSESSMENT.md)
- [VLINK_EVOLUTION_STRATEGY.md](./VLINK_EVOLUTION_STRATEGY.md)
- [CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md](./CONNECTED_KNOWLEDGE_STRATEGIC_POSITIONING.md)
