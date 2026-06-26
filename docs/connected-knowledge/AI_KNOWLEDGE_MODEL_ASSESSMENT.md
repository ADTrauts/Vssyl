# AI Knowledge Model Assessment

**Program:** Connected Knowledge Platform — Phase 0A  
**Date:** 2026-06-25  
**Status:** Assessment only — **no AI pipeline changes**

**Authority:** [AI_PLATFORM_CONSTITUTION.md](../architecture/AI_PLATFORM_CONSTITUTION.md), [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md), [AI_CONTEXT_ASSEMBLY.md](../architecture/AI_CONTEXT_ASSEMBLY.md)

---

## 1. Assessment question

Does Vssyl AI **understand knowledge** — objects, relationships, history, causality, context — or does it **retrieve evidence** and synthesize answers?

---

## 2. Executive verdict

**Vssyl AI is an evidence-grounded retrieval and synthesis system.** It does not maintain a persistent knowledge graph, causal model, or entity-centric world state. It **composes context per request** from federated adapters with constitutional precedence rules.

| Dimension | Understanding level | Evidence |
|-----------|--------------------|---------|
| **Objects** | **Strong** | Module providers hydrate typed entities with PE |
| **Relationships (explicit)** | **Moderate** | V_Link pipeline + module FKs in providers |
| **Relationships (inferred)** | **Weak/ephemeral** | entityLinking, retrieval — per-turn only |
| **History** | **Moderate/fragmented** | Activity + module state; ACT-R1 read gaps |
| **Causality** | **Minimal** | No causal graph; narrative from LLM + activity |
| **Context** | **Strong assembly** | AIContextAssembler, catalog sources, grounding reconcile |
| **Knowledge persistence** | **Partial** | UserMemoryFact, V_Link — user-governed only |

**Separation line:** **Retrieval** = find and rank evidence for this turn. **Knowledge** = persisted, provenanced, permission-stable facts about entities and relationships.

---

## 3. What AI does today

### 3.1 Request pipeline (simplified)

```
User query
  → intent classification
  → catalog source selection (drive, chat, vlink, retrieval, …)
  → MemoryRetrievalService (UserMemoryFact)
  → module ContextProviders (Pattern A)
  → vlinkPipelineContextService (persisted associations)
  → aiRetrievalCapabilityService (search-backed evidence)
  → context graph bundle (anchor intents)
  → entityLinking.merge(persistedVLinks preferred)
  → grounding reconcile
  → LLM synthesis
```

### 3.2 Relationship precedence (constitutional)

| Rank | Source | Persistence |
|------|--------|-------------|
| 1 | UserMemoryFact | Persisted |
| 2 | Persisted V_Link | Persisted |
| 3 | Module AI providers | SoR |
| 4 | Operational links (notebook, todo refs) | Module SoR |
| 5 | Search / retrieval hydrate | Ephemeral |
| 6 | Domain event signal | Triggers re-fetch only |
| 7 | entityLinking inference | Ephemeral |

Lower layers **never override** higher for cross-module truth ([AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md)).

---

## 4. Capability-by-capability analysis

### 4.1 Objects

**Status: Strong**

AI receives structured entity payloads from module providers: files, tasks, events, conversations, HR records (when wired). Policy Engine and visibility services gate content.

**Limitation:** Object sets are **bounded per provider** (recent N, intent-scoped). AI does not hold full tenant inventory in context.

### 4.2 Relationships

**Status: Moderate for explicit; Weak for inferred**

| Type | AI behavior |
|------|-------------|
| V_Link attachments | Loaded via pipeline; resolver hydrates or redacts |
| Module FKs | Exposed in module provider shape (task→project, file→folder) |
| Shares / membership | Implicit via what user can see in providers |
| Retrieval co-occurrence | Evidence list — not stored as edges |
| entityLinking | Merges cross-module mentions — **ephemeral** |

**Gap:** AI cannot answer "what is permanently connected to X?" unless X is a V_Link hub or module exposes native edges. Cross-module project graphs are **reconstructed each turn**.

### 4.3 History

**Status: Moderate, fragmented**

| Source | Content |
|--------|---------|
| Module providers | Recent items, state snapshots |
| Activity context mappers | Normalized actions (when kernel read used) |
| Legacy reads | Stale or incomplete cross-module history (ACT-R1) |
| Chat messages | Bounded thread history |

**Gap:** No unified **temporal knowledge model** — AI infers "what changed" from snippets, not from authoritative event sourcing.

### 4.4 Causality

**Status: Minimal**

AI may narrate causality ("because you completed the task…") from:

- LLM world knowledge (ungrounded risk)
- Co-occurring evidence in context
- Activity verbs in feed snippets

There is **no** persisted causal edge (`caused_by`, `triggered`, `resulted_in`). Automation boundaries forbid treating inference as events ([AI_AUTOMATION_BOUNDARY.md](../architecture/AI_AUTOMATION_BOUNDARY.md)).

**Connected Knowledge implication:** Causality is **Phase 2+** — likely activity + state-change narrative, not graph edges in Phase 1.

### 4.5 Context

**Status: Strong assembly, not strong memory**

`AIContextAssembler` + `DigitalLifeTwinService` + grounding reconcile produce rich **per-request** context. UserMemoryFact adds durable user statements. V_Link adds durable associations.

**Gap:** Session continuity depends on memory facts and V_Link — not on automatic learning of relationships from usage.

---

## 5. AI Retrieval vs genuine knowledge

| Criterion | AI Retrieval | Genuine knowledge |
|-----------|--------------|-------------------|
| **Persistence** | Per request | Survives requests |
| **Provenance** | Trace diagnostics | Stored on edge/fact |
| **User governance** | None required | Accept/reject/edit |
| **Permission model** | Re-check on hydrate | Stable authorized view |
| **Cross-turn consistency** | May vary | Same neighborhood |
| **Partner entities** | Not supported | Delegate SoR |

### What retrieval provides

- Query-relevant **evidence candidates** via Unified Search delegate
- Intent-scoped discovery (5 consumer profiles certified)
- Diagnostics for operator/debug surfaces

### What retrieval does not provide

- Authoritative relationship store
- Confidence-weighted knowledge base
- Entity-centric reasoning graph
- Automatic promotion to V_Link (requires user accept)

---

## 6. AI Memory (`UserMemoryFact`) assessment

| Aspect | Role in knowledge model |
|--------|-------------------------|
| Storage | `user_memory_facts` — scoped personal/business |
| Retrieval | `MemoryRetrievalService` — scored relevance |
| Provenance | `explicit` vs `inferred` tiers; expiry |
| Graph relationship | **Adjacent** — facts about user preferences, not edges |

**Gap:** Facts are not anchored to `nodeKey` consistently. Linking memory to entities would strengthen knowledge without conflating with V_Link.

---

## 7. V_Link suggestions workflow

| Stage | Knowledge status |
|-------|------------------|
| `VLinkSuggestion` PENDING | **Not knowledge** — excluded from pipeline |
| User ACCEPTED | Becomes `VLinkEntity` — **knowledge** |
| User REJECTED | Not knowledge |
| AI auto-link without accept | **Constitutionally forbidden** |

This is the **correct bridge** from retrieval to knowledge — underutilized in product surfacing.

---

## 8. Context Graph contribution

For anchor intents, Context Graph produces **federation bundles** merging:

- V_Link adapter (SoR)
- Module adapters (SoR)
- Tag index (metadata overlay)
- Retrieval inference bridge (pilot: `project_assistant`)

**Assessment:** Closest current path to **knowledge bundle** — but consumer scope is limited and provenance metadata is incomplete in user-visible form.

---

## 9. Failure modes (knowledge trust)

| Failure | User impact | Root cause |
|---------|-------------|------------|
| "Related files" differ each ask | Distrust AI | Ephemeral retrieval without persistence |
| AI cites module AI can't see in search | Fragmentation | Adoption gaps |
| Suggestion feels like fact | Over-trust | Inference not labeled in UI |
| V_Link hub incomplete | Wrong project picture | Manual linking burden |
| HR/scheduling invisible | Business knowledge gap | No search/retrieval providers |

---

## 10. Target AI knowledge model (strategic — not implemented)

### Layer 0 — Evidence (current, keep)

Retrieval + search + entityLinking — ephemeral, disclosed as inference.

### Layer 1 — Persisted knowledge (extend)

- V_Link associations (expand coverage)
- Module native edges (via providers)
- UserMemoryFact (entity-anchored)

### Layer 2 — Federation bundle (extend Context Graph)

Single `KnowledgeBundle` shape:

```typescript
interface KnowledgeEdge {
  from: NodeKey;
  to: NodeKey;
  class: RelationshipClass;
  provenance: 'module_native' | 'manual' | 'ai_accepted' | 'inference';
  confidence: 'certain' | 'likely' | 'inferred';
  sourceSystem: string;
}
```

### Layer 3 — Causal narrative (future)

Activity stream + state transitions — narrative generation, not edge SoR.

### Layer 4 — Reasoning (out of scope)

No autonomous graph mutation; no silent learning loops per AI_AUTOMATION_BOUNDARY.

---

## 11. Recommendations

| # | Recommendation | Phase |
|---|----------------|-------|
| 1 | Unify provenance in twin traces and UI badges | 0B |
| 2 | Complete retrieval → graph bridge for all anchor intents | 1A |
| 3 | Promote V_Link suggestion UX as knowledge governance | 1B |
| 4 | Anchor UserMemoryFact to nodeKey where applicable | 1B |
| 5 | Do not add "AI knowledge graph" Prisma models | Ongoing |
| 6 | Causal layer spec after ACT-R1 complete | 2 |

---

## 12. References

- [AI_RETRIEVAL_PHASE_0A_EXECUTIVE_SUMMARY.md](../ai/retrieval/AI_RETRIEVAL_PHASE_0A_EXECUTIVE_SUMMARY.md)
- [CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md](../context-graph/CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md)
- [ENTITY_RELATIONSHIP_CATALOG.md](./ENTITY_RELATIONSHIP_CATALOG.md)
