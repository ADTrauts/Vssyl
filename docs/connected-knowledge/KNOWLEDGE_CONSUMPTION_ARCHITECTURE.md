# Knowledge Consumption Architecture

**Program:** Connected Knowledge Platform — Phase 0B (updated Phase 1C)  
**Date:** 2026-06-25  
**Status:** Phase 1C — Neighborhood Service + Knowledge Cards active for Project Assistant pilot

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md)

---

## 1. Purpose

Define **how each consumer treats knowledge tiers** — what may be read, displayed, ranked, traversed, or synthesized.

**Goal:** Unified knowledge consumption so AI, Search, Context Graph, and operator tools share the same rules.

---

## 2. Federation bundle contract (logical)

Phase 1 producers compose a **KnowledgeBundle** (extends Context Graph bundle descriptor):

```typescript
interface KnowledgeBundle {
  bundleId: string;
  composedAt: string;
  anchor?: NodeKey;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  facts: KnowledgeFact[];  // UserMemoryFact slice
  diagnostics?: {
    conflicts: ConflictRecord[];
    omittedUnauthorized: number;
    tierCounts: Record<string, number>;
  };
}

interface KnowledgeEdge {
  from: NodeKey;
  to: NodeKey;
  relationshipClass: string;
  provenance: KnowledgeProvenance;
  confidence: KnowledgeConfidence;
}
```

**Single composer:** Knowledge Composition Engine (`server/src/knowledge/`) — invoked by Context Graph orchestrator. Not per-consumer assembly.

**Conflict resolution:** Duplicate edges on the same `(from, to, relationshipClass)` are resolved by tier precedence in `conflictDetector.ts`; diagnostics record superseded assertions.

**CI validation:** `pnpm --filter vssyl-server validate:connected-knowledge` enforces KB-1–KB-5 bundle contract rules.

**Producers feed composer:** V_Link adapter, module adapters, retrieval bridge, **memory** (`MemoryRetrievalService`), partner delegate.

**Phase 1B convergence:** Composer output feeds [Knowledge Convergence Engine](./KNOWLEDGE_CONVERGENCE_ENGINE.md) → `KnowledgeNeighborhood`.

---

## 2b. Knowledge Neighborhood contract (Phase 1B)

Pilot consumers (`project_assistant`, `planning`, `business_operations`) receive `KnowledgeNeighborhood` on `graphBundlePipelineContext` when:

```bash
KNOWLEDGE_CONVERGENCE_ENABLED=true
```

Neighborhoods include converged facts, deduped entities, conflict-resolved relationships, summary, and convergence diagnostics. `sourceBundles` retains full KnowledgeBundle for backward compatibility.

See [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md).

---

## 2c. Neighborhood Service & Knowledge Cards (Phase 1C)

**Canonical read path:** `knowledgeNeighborhoodService.ts` → `retrieveNeighborhoods()`.

| Capability | Detail |
|------------|--------|
| Read model | `KnowledgeNeighborhood` |
| Presentation | `KnowledgeCard` via `toKnowledgeCard()` |
| Pilot consumer | `project_assistant` — direct consumption, no manual bundle reconstruction |
| API | `POST /api/context-graph/knowledge/neighborhood` returns cards + diagnostics |
| Cache | 30s in-process TTL |

See [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md), [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md), [KNOWLEDGE_CONSUMPTION_GUIDE.md](./KNOWLEDGE_CONSUMPTION_GUIDE.md).

**Consumer readiness (not migrated):** Workspace, Dashboard, Search, Business Operations — documented in consumption guide.

---

## 3. Consumer matrix

| Consumer | Role | Bundle access | May use L0–L3 | May use L4 | May use L5 | May use L6 |
|----------|------|---------------|:-------------:|:----------:|:----------:|:----------:|
| **AI Twin** | Synthesize + ground | Full compose + **neighborhood + Knowledge Card** (project_assistant pilot) | ✅ | ✅ disclose | ❌ | ✅ disclose |
| **Context Graph** | Composer | N/A | ✅ | ✅ | ❌ | ✅ |
| **Unified Search** | Entity discovery | Node list + hints | ✅ entities | ❌ edges | ❌ | ⚠️ hints only |
| **AI Retrieval** | Evidence producer | Writes L6 to composer input | ✅ hydrate | ❌ | ❌ | ✅ output |
| **Platform Controller** | Operator diagnostics | Read bundle diagnostics | ✅ | ✅ debug | ✅ queues | ✅ debug |
| **Notifications** | Event delivery | None — reacts to mutations | N/A | N/A | N/A | N/A |
| **Marketplace runtime** | Partner iframe | Delegate only | ✅ partner nodes | ❌ | ❌ | ❌ |
| **Dashboard** | Summaries | Subset via facade | ✅ | ❌ | ❌ | ❌ |
| **Business Workspace** | Entity landing | Neighborhood API subset | ✅ | ❌ | ❌ | ❌ |
| **V_Link hub UI** | Governance | L2–L3 + L5 queue | ✅ | ❌ | ✅ review | ❌ |
| **Activity feed** | Timeline | Activity envelope — not bundle | Audit only | N/A | N/A | N/A |

---

## 4. Consumer rules (detailed)

### 4.1 AI Twin

| Rule | Detail |
|------|--------|
| **Compose via** | Context Graph + pipeline merge |
| **Authoritative synthesis** | L0–L3 only as statements of fact |
| **L4** | May ground; must qualify language |
| **L6** | Evidence citations only; no "you linked" language |
| **L5** | Excluded from prompt |
| **Precedence** | Tier > confidence; persisted V_Link > retrieval |
| **Dedup** | Same edge from pipeline + graph → single bundle edge |

Aligns with [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md).

### 4.2 Context Graph (composer)

| Rule | Detail |
|------|--------|
| **Owns** | Bundle composition, conflict resolution, provenance mapping |
| **Inputs** | Module adapters, V_Link, retrieval bridge, memory, partner |
| **Hop budget** | L0–L3: policy default 3; L4: 1; L6: 0 persistent |
| **Output** | KnowledgeBundle to authorized consumers |
| **Must not** | Persist new edges; upgrade tiers |

### 4.3 Unified Search

| Rule | Detail |
|------|--------|
| **Primary** | Find entities (nodes) |
| **Relationship hints** | Optional `relatedTo` hints at C4 — not edges in index |
| **May not** | Store relationship SoR |
| **Hydrate** | Every hit re-checks PE before promotion to bundle |
| **L6 usage** | Internal ranking only unless passed to composer |

### 4.4 AI Retrieval

| Rule | Detail |
|------|--------|
| **Output** | L6 evidence records with provenance |
| **Feeds** | Composer input channel — not twin directly (Phase 1 convergence) |
| **May not** | Auto-create V_Link or memory |
| **Search delegate** | Evidence inherits `retrieval_evidence` origin |

### 4.5 Platform Controller

| Rule | Detail |
|------|--------|
| **Displays** | Adoption + knowledge diagnostics |
| **May show** | L5 queues count, provenance completeness, tier histograms |
| **May not** | Override module SoR |

### 4.6 Notifications

| Rule | Detail |
|------|--------|
| **Triggers** | `vlink_suggestion_created`, link/unlink events |
| **Payload** | Entity refs — not full bundle |
| **Does not** | Define or store knowledge |

### 4.7 Marketplace

| Rule | Detail |
|------|--------|
| **Partner iframe** | No bundle access |
| **Delegate** | Partner supplies L1 node hydration |
| **Platform** | Stores association edges with partner provenance |

### 4.8 Dashboard

| Rule | Detail |
|------|--------|
| **Widgets** | L2–L3 summaries only (e.g., recent hubs, confirmed links) |
| **No** | Inference or search hints in widget data |
| **Future** | Activity widget uses kernel reads — audit not graph |

### 4.9 Business Workspace

| Rule | Detail |
|------|--------|
| **Entity landing** | Neighborhood API — L2–L3 edges |
| **Module routing** | Falls through to module SoR detail |
| **BO modules** | Same rules when adoption complete |

### 4.10 Relationship traversal

| Rule | Detail |
|------|--------|
| **Engine** | Context Graph orchestrator |
| **Authorization** | PE per hop |
| **Tier expansion** | L4/L6 do not expand persisted graph |
| **Cycles** | Detect and cap — V_Link nest depth limit |

---

## 5. Consumption flow (target)

```
                    ┌─────────────────┐
  Module adapters ──┤                 │
  V_Link adapter  ──┤  Context Graph  ├──► KnowledgeBundle ──► AI Twin
  Retrieval bridge──┤  Composer       │                    └──► Dashboard
  Memory adapter  ──┤                 │                    └──► Workspace API
  Partner delegate──┤                 │
                    └────────▲────────┘
                             │
              L6 evidence ───┘
              Search hints ──┘ (C4 only)
```

---

## 6. When consumers may use each knowledge class

| Class | Definition | Consumers |
|-------|------------|-----------|
| **Authoritative knowledge** | L0–L2 | All except raw notification payload |
| **Confirmed knowledge** | L3 | All user-facing |
| **Inferred knowledge** | L4 | AI (disclosed), operator debug |
| **Suggested knowledge** | L5 | V_Link governance UI, notifications, operator |
| **Transient evidence** | L6 | AI (disclosed), retrieval diagnostics, search internal |

---

## 7. Caching rules

| Cache | Allowed | Invalidation |
|-------|---------|--------------|
| Hydrated node payload | ✅ short TTL | Domain event per module |
| Bundle snapshot | ✅ request scope | No cross-request cache L4/L6 |
| L2–L3 edge list per anchor | ✅ TTL | V_Link + module events |
| Search index | ✅ | Not knowledge — separate contract |

---

## 8. API surface (Phase 1A–1C)

| Endpoint | Consumer | Returns | Status |
|----------|----------|---------|:------:|
| `POST /api/context-graph/knowledge/compose` | AI, internal | Full KnowledgeBundle | ✅ |
| `POST /api/context-graph/knowledge/diagnostics` | Platform Controller | Tier stats | ✅ |
| `POST /api/context-graph/knowledge/neighborhood` | Workspace, API, Project Assistant | Neighborhoods + **Knowledge Cards** + diagnostics | ✅ |
| `GET /api/knowledge/suggestions` | V_Link UI | L5 only | Phase 2 |

All routes: auth + tenant scope + PE.

---

## 9. Migration from as-built (Phase 1A progress)

| Current path | Target | Phase 1A |
|--------------|--------|:--------:|
| `vlinkPipelineContextService` parallel to graph | Composer input | Partial — graph path converged |
| `entityLinking` post-compose | Composer L4 slice | Planned |
| Retrieval direct to twin | Via composer L6 | ✅ bridge + compose |
| Search unrelated to graph | Hint channel only | Unchanged |
| `graphBundlePipelineContext.bundles` | `knowledgeBundles` for pilots | ✅ with fallback |

---

## 10. Anti-patterns

| Anti-pattern | Violation |
|--------------|-----------|
| Twin bypasses composer | KC-9 |
| Search stores edges | KC-1 |
| Dashboard shows retrieval as links | L6 in widget |
| Widget invents confidence | Assigner rules |
| Partner reads full bundle | Marketplace boundary |

---

## 11. References

- [KNOWLEDGE_COMPOSITION_ENGINE.md](./KNOWLEDGE_COMPOSITION_ENGINE.md)
- [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md)
- [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md)
- [KNOWLEDGE_CONSUMPTION_GUIDE.md](./KNOWLEDGE_CONSUMPTION_GUIDE.md)
- [CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md)
- [CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md)
- [CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md](../context-graph/CONTEXT_GRAPH_BUNDLE_DESCRIPTOR_SPEC.md)
