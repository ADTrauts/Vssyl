# Context Graph — Retrieval Inference Bridge

**Program:** Context Graph Phase 1A  
**Date:** 2026-06-23  
**Status:** Shipped (feature-flagged)

---

## Purpose

Unify **Search → Retrieval → Context Graph** consumption without new persistence. Retrieval evidence enriches graph bundle composition as **inference-only** nodes and edges.

---

## Architecture

```
Unified Search → AIRetrievalEvidence[]
                      ↓
         enrichBundlesWithRetrievalEvidence (additive)
                      ↓
         ContextBundleDescriptor (federation + inference)
                      ↓
         bundleToAiGroundingPayload → AI pipeline
```

**Federation bundles remain authoritative.** Inference never overrides V_Link or module SoR edges.

---

## Code locations

| Component | Path |
|-----------|------|
| Bridge core | `server/src/context-graph/retrievalBundleInferenceBridge.ts` |
| Pipeline hook | `server/src/context-graph/enrichGraphBundlesFromRetrieval.ts` |
| Config / flag | `server/src/context-graph/retrievalBundleBridgeConfig.ts` |
| Types | `server/src/context-graph/retrievalInferenceTypes.ts` |
| Pipeline wire | `server/src/ai/pipeline/pipelineGroundingRetrieval.ts` |

---

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED` | **false** | Must be `true` to activate bridge |
| `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED` | false | Retrieval must be on for pilot consumer |

**Pilot consumer:** `project_assistant` only (Phase 1A).

---

## Provenance standard

Every inferred node/edge carries `RetrievalInferenceProvenance`:

| Field | Value |
|-------|-------|
| `provenance` | Always `inference` |
| `source` | `ai_retrieval` |
| `retrievalOrigin` | Search module id |
| `confidence` | 0–1 (default 0.5 if absent) |
| `timestamp` | `evidence.retrievedAt` |
| `consumerIntent` | e.g. `project_assistant` |

**Governance rules:**

1. Inference **never** becomes source-of-truth.
2. No graph writes, no Prisma, no new tables.
3. `permissionsVerified: false` evidence excluded.
4. Minimum confidence: **0.2** (`RETRIEVAL_INFERENCE_MIN_CONFIDENCE`).
5. Duplicate SoR nodes skipped (dedup by entity key).
6. Bundle `permissionOutcome.gatesApplied` includes `inference_only` when enriched.

---

## Evidence eligibility

| Eligible for bundle | Retrieval-only |
|---------------------|----------------|
| `permissionsVerified: true` | Unverified permissions |
| confidence ≥ 0.2 | Low confidence |
| Valid entity ref | Malformed evidence |
| Not already in bundle | — |

---

## Enrichment modes

| Case | Behavior |
|------|----------|
| Existing federation bundle | Append inference nodes/edges to first bundle |
| No federation bundle | Create `ai_session` inference-only bundle |

---

## Phase 1B — Grounding reconcile

After bridge enrichment, `groundingReconcile.ts` deduplicates overlapping entities:

- V_Link explicit beats inference nodes and retrieval evidence
- Federation SoR beats inference
- Access conflicts skip unsafe merge

See [CONTEXT_GRAPH_GROUNDING_RECONCILE.md](./CONTEXT_GRAPH_GROUNDING_RECONCILE.md).

**Recommended pilot flags (local/dev validation — Phase 1C):**

```
AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true
CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=true
```

See [CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md](./CONTEXT_GRAPH_PROJECT_ASSISTANT_PILOT_VALIDATION.md).

**Production:** all default **off**. Do not enable without Phase 1C sign-off.

---

## Tests

`server/src/context-graph/__tests__/retrievalBundleInferenceBridge.test.ts`  
`server/src/ai/context/__tests__/groundingReconcile.test.ts`  
`server/src/ai/pipeline/__tests__/pipelineGroundingRetrieval.retrievalPilot.test.ts`

**Last updated:** 2026-06-23 (Phase 1C)
