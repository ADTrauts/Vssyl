# Context Graph — Grounding Reconcile

**Program:** Context Graph Phase 1B  
**Date:** 2026-06-23  
**Status:** Shipped (feature-flagged)

---

## Purpose

Deduplicate overlapping AI grounding inputs across V_Link, graph bundles, retrieval inference, and retrieval evidence — without rewriting the prompt system or replacing grounding sources.

---

## Source priority (authoritative wins)

| Rank | Tier | Source |
|------|------|--------|
| 1 | `vlink_explicit` | V_Link linked entities + containers |
| 2 | `graph_bundle_sor` | Federation bundle nodes (non-inference) |
| 3 | `context_provider` | Module provider summaries (preserved) |
| 4 | `retrieval_evidence` | `_ai_retrieval_discovery.evidence` |
| 5 | `graph_bundle_inference` | Bridge inference nodes/edges |

**Rules:**

- Explicit V_Link beats inferred association
- Inference never becomes source-of-truth
- Context provider summaries remain unless exact entity duplicate in evidence
- Provenance is recorded in diagnostics — not discarded
- Access conflicts skip unsafe merge (no permission leakage)

---

## Dedup keys

| Key format | Example |
|------------|---------|
| Platform entity | `{moduleId}:{entityType}:{entityId}` (lowercase) |
| V_Link container | `vlink:container:{vlinkId}` |
| Inferred node | Same entity key + `metadata.inference` |
| Inferred edge | Target entity key + `relationshipClass: inference` |

---

## Implementation

| Component | Path |
|-----------|------|
| Reconcile utility | `server/src/ai/context/groundingReconcile.ts` |
| Pipeline wire | `server/src/ai/pipeline/pipelineGroundingRetrieval.ts` |

### Feature flag

```
CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=false   # set true for pilot
```

**Pilot:** `project_assistant` only.

**Recommended pilot stack (local/dev — Phase 1C):**

```
CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=true
CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true
```

See [CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md](./CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md). **Production defaults remain off.**

---

## Diagnostics

Emitted on `GroundingReconcileDiagnostics` and `moduleContextsPatch._grounding_reconcile`:

| Field | Meaning |
|-------|---------|
| `preReconcileCount` | Total entity refs across sources |
| `postReconcileCount` | After dedup |
| `duplicateCount` | Removed duplicates |
| `sourcePriorityApplied` | `{lower}->{higher}:{key}` decisions |
| `provenanceMergedCount` | Superseded inference/evidence tracked |
| `skippedUnsafeMergeCount` | Access conflict — kept both |

Also available on `PipelineGroundingRetrievalResult.groundingReconcileDiagnostics`.

---

## Actions performed

1. Build authority index from V_Link + federation SoR nodes
2. Filter retrieval evidence superseded by authority
3. Prune inference bundle nodes/edges superseded by authority
4. Patch `_ai_retrieval_discovery.evidence` in module context
5. Attach diagnostics patch

**No graph writes. No prompt rewrite.**

---

## Tests

- `server/src/ai/context/__tests__/groundingReconcile.test.ts`
- `server/src/ai/pipeline/__tests__/pipelineGroundingRetrieval.retrievalPilot.test.ts`

`server/src/ai/pipeline/__tests__/pipelineGroundingRetrieval.projectAssistantPilot.test.ts`

**Last updated:** 2026-06-23 (Phase 1C)
