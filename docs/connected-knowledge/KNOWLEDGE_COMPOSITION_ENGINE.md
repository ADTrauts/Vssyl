# Knowledge Composition Engine

**Program:** Connected Knowledge Platform — Phase 1A (updated Phase 1B)  
**Date:** 2026-06-25  
**Status:** Implemented — convergence layer added Phase 1B

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_BUNDLE_STANDARD.md](./KNOWLEDGE_BUNDLE_STANDARD.md)

---

## 1. Purpose

The **Knowledge Composition Engine** is the canonical builder of governed **Knowledge Bundles**. It transforms platform evidence (Context Graph bundles, retrieval evidence, module adapters) into a single constitutional contract with provenance, confidence, trust, and consumer eligibility.

**Principle:** Compose once. Consume everywhere.

---

## 2. Architecture

```
Inputs                          Orchestration              Output
─────────────────────────────────────────────────────────────────────
Module adapters ──┐
V_Link adapter  ──┤  Context Graph          Knowledge Composition
Retrieval bridge──┤  Orchestrator  ──────► Engine  ──► KnowledgeBundle
Memory facts    ──┤  (resolveBundle)         (compose)
Partner delegate──┘
```

Context Graph **orchestrates** resolution; it does **not** independently map provenance. All constitutional mapping lives in `server/src/knowledge/`.

---

## 3. Implementation map

| Component | Path | Role |
|-----------|------|------|
| Types | `server/src/knowledge/knowledgeTypes.ts` | KnowledgeBundle contract |
| Composer | `server/src/knowledge/knowledgeComposer.ts` | Core compose logic |
| Orchestrator | `server/src/knowledge/knowledgeCompositionOrchestrator.ts` | CG integration + pipeline hook |
| Provenance mapper | `server/src/knowledge/provenanceMapper.ts` | As-built → constitutional |
| Confidence | `server/src/knowledge/confidenceAssigner.ts` | C1–C4 assignment |
| Trust | `server/src/knowledge/trustResolver.ts` | Tier trust labels |
| Eligibility | `server/src/knowledge/consumerEligibility.ts` | Consumer tier matrix |
| Diagnostics | `server/src/knowledge/knowledgeCompositionDiagnostics.ts` | Operator views |
| Config | `server/src/knowledge/knowledgeCompositionConfig.ts` | Feature flags |
| Conflict detector | `server/src/knowledge/conflictDetector.ts` | Tier precedence resolution |
| Bundle validation | `server/src/knowledge/knowledgeBundleValidation.ts` | KB-1–KB-5 CI checks |
| Memory compose helper | `server/src/knowledge/memoryFactComposeHelper.ts` | Pipeline memory → KnowledgeFact |

**Phase 1B convergence** (downstream of compose): see [KNOWLEDGE_CONVERGENCE_ENGINE.md](./KNOWLEDGE_CONVERGENCE_ENGINE.md).

---

## 4. Memory integration (Phase 1B)

`MemoryRetrievalService` facts are mapped via `memoryFactComposeHelper` before compose:

- Explicit memory → **L3** `user_memory_explicit`
- Learned memory → **L4** `user_memory_learned`

Memory never overwrites L0–L2 module or V_Link knowledge in convergence.

---

## 5. API surface

| Route | Method | Returns |
|-------|--------|---------|
| `/api/context-graph/knowledge/compose` | POST | KnowledgeBundle[] + diagnostics |
| `/api/context-graph/knowledge/diagnostics` | POST | Operator diagnostics from contextBundles[] |

All routes require JWT auth and tenant scope. Context Graph resolution runs PE gates before composition.

| `/api/context-graph/knowledge/neighborhood` | POST | KnowledgeNeighborhood[] (Phase 1B) |

---

## 6. Feature flag

```bash
KNOWLEDGE_COMPOSITION_ENABLED=true
```

When enabled, pilot consumers receive `knowledgeBundles` on `graphBundlePipelineContext`:

- `project_assistant`
- `planning`
- `business_operations`
- `local_discovery`

**Fallback:** `contextBundle` (ContextBundleDescriptor) remains on every KnowledgeBundle for consumers not yet migrated.

---

## 7. Pipeline integration

1. Context Graph resolves bundles (`resolveBundle` / `resolveVLinkBundle`)
2. Optional retrieval bridge enriches bundles (`enrichBundlesWithRetrievalEvidence`)
3. Knowledge Composition Engine composes (`composePipelineKnowledgeBundles`) — includes memory facts
4. Knowledge Convergence Engine produces neighborhoods when `KNOWLEDGE_CONVERGENCE_ENABLED=true`
5. Pilot consumers read `knowledgeNeighborhoods` (or `knowledgeBundles` fallback)

Pipeline trace records `knowledge_bundle` source when composition applies.

---

## 7. Non-goals (Phase 1A)

- No schema migration for provenance persistence
- No redesign of Search, AI providers, V_Link, or Platform Kernel
- No removal of existing consumer fallback paths

---

## 8. References

- [KNOWLEDGE_BUNDLE_STANDARD.md](./KNOWLEDGE_BUNDLE_STANDARD.md)
- [KNOWLEDGE_COMPOSITION_DIAGNOSTICS.md](./KNOWLEDGE_COMPOSITION_DIAGNOSTICS.md)
- [CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1A_CLOSEOUT.md)
- [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md)
