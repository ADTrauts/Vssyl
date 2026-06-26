# Knowledge Convergence Engine

**Program:** Connected Knowledge Platform — Phase 1B  
**Date:** 2026-06-25  
**Status:** Implemented

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md)

---

## 1. Purpose

The **Knowledge Convergence Engine** transforms composed **Knowledge Bundles** into unified **Knowledge Neighborhoods** — coherent understanding around entities, not additive evidence lists.

**Principles:** Compose once. Converge once. Consume everywhere. Never lose provenance. Never silently overwrite authoritative knowledge.

---

## 2. Architecture

```
KnowledgeBundle(s)     Memory facts (L3/L4)
        │                      │
        └──────────┬───────────┘
                   ▼
        Knowledge Convergence Engine
         • dedupe nodes
         • resolve edge conflicts (tier precedence)
         • merge duplicate facts
         • corroborate evidence
         • build summary + diagnostics
                   ▼
           KnowledgeNeighborhood
```

Composition remains in `knowledgeComposer.ts`. Convergence is **additive** — bundles are retained on `sourceBundles` for backward compatibility.

---

## 3. Implementation map

| Component | Path | Role |
|-----------|------|------|
| Convergence engine | `knowledgeConvergenceEngine.ts` | Neighborhood builder |
| Fact convergence | `factConvergence.ts` | Merge duplicate facts |
| Conflict detector | `conflictDetector.ts` | Edge tier precedence (reused) |
| Memory compose | `memoryFactComposeHelper.ts` | Pipeline memory → KnowledgeFact |
| Convergence diagnostics | `knowledgeConvergenceDiagnostics.ts` | Operator views |
| Config | `knowledgeConvergenceConfig.ts` | Feature flags + pilot consumers |

---

## 4. Convergence rules

| Rule | Behavior |
|------|----------|
| **KC-1** | Higher tier (lower L number) wins on duplicate edges/facts |
| **KC-2** | L0–L2 never overwritten by L4–L6 duplicates |
| **KC-3** | Corroboration increases `corroborationCount` and `confidenceHistory` |
| **KC-4** | Loser provenance preserved in `mergedFromFactIds` / verification history |
| **KC-5** | L5 edges never enter neighborhoods (same as bundles) |
| **KC-6** | Explicit memory (L3) participates without downgrading module facts |

---

## 5. Feature flags

```bash
KNOWLEDGE_COMPOSITION_ENABLED=true   # required
KNOWLEDGE_CONVERGENCE_ENABLED=true   # Phase 1B
```

### Pilot consumers (convergence)

- `project_assistant`
- `planning`
- `business_operations`

(`local_discovery` receives bundles only — Phase 1A pilot without convergence.)

---

## 6. API surface

| Route | Method | Returns |
|-------|--------|---------|
| `/api/context-graph/knowledge/neighborhood` | POST | KnowledgeNeighborhood[] + bundles fallback |
| `/api/context-graph/knowledge/compose` | POST | Bundles + neighborhoods when convergence enabled |

---

## 7. Pipeline integration

When convergence enabled, `graphBundlePipelineContext` includes:

- `knowledgeNeighborhoods`
- `knowledgeConvergenceDiagnostics`
- `knowledgeConvergenceApplied`

Pipeline trace adds `knowledge_neighborhood` source.

Memory facts are retrieved via `MemoryRetrievalService` and mapped through `memoryFactComposeHelper` before compose/converge.

---

## 8. References

- [KNOWLEDGE_COMPOSITION_ENGINE.md](./KNOWLEDGE_COMPOSITION_ENGINE.md)
- [KNOWLEDGE_CONVERGENCE_DIAGNOSTICS.md](./KNOWLEDGE_CONVERGENCE_DIAGNOSTICS.md)
- [CONNECTED_KNOWLEDGE_PHASE_1B_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1B_CLOSEOUT.md)
