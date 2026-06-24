# Context Graph — Grounding Path Inventory

**Program:** Context Graph Phase 1B  
**Date:** 2026-06-23  
**Status:** Inventory artifact

---

## Purpose

Catalog all grounding inputs injected into AI prompt/context assembly that may overlap after Phase 1A retrieval bridge.

---

## Pipeline grounding flow

```
runPipelineGroundingRetrieval()
  → module context orchestrator
  → V_Link pipeline context
  → graph_bundle pipeline context
  → AI Retrieval discovery
  → retrieval inference bridge (1A)
  → grounding reconcile (1B)
  → merged into DigitalLifeTwinCore moduleContexts
```

---

## Grounding inputs

| Path | Artifact | Storage key / field | Tier |
|------|----------|---------------------|------|
| **V_Link grounding** | `VLinkPipelineContextResult` | `ctxRecord.vlinkPipelineContext` | SoR (explicit) |
| **graph_bundle** | `GraphBundlePipelineContextResult` | `ctxRecord.graphBundlePipelineContext` | Federation SoR |
| **Retrieval inference nodes** | `ContextBundleDescriptor.nodes` with `metadata.inference` | Inside graph bundle | Inference |
| **ai_retrieval_discovery** | Evidence + diagnostics patch | `moduleContextsPatch._ai_retrieval_discovery` | Discovery |
| **Context providers** | Per-module summaries | `moduleContextsPatch[moduleId]` | Module narrative |
| **Memory / preferences** | User memory facts | Memory retrieval path | User explicit |
| **Activity context** | Notifications / activity feeds | `notifications_activity` source | Temporal signal |
| **Location** | Geolocation summary | `_pipeline_grounding.locationSummary` | Ambient |

---

## Overlap vectors (Phase 1B targets)

| Overlap | Example |
|---------|---------|
| V_Link linked entity ↔ retrieval evidence | Same file in hub + search hit |
| graph_bundle attachment ↔ retrieval evidence | Federation node + evidence row |
| graph_bundle inference node ↔ V_Link explicit | Inferred file already in hub |
| graph_bundle inference ↔ retrieval evidence | Bridge duplicate before reconcile |

**Not deduped in 1B:** context provider narrative summaries (may add value beyond entity refs).

---

## Consumer scope

Phase 1B reconcile pilot: **`project_assistant`** only.

---

## References

- `server/src/ai/pipeline/pipelineGroundingRetrieval.ts`
- `server/src/ai/context/groundingReconcile.ts`
- [CONTEXT_GRAPH_GROUNDING_RECONCILE.md](./CONTEXT_GRAPH_GROUNDING_RECONCILE.md)

**Last updated:** 2026-06-23
