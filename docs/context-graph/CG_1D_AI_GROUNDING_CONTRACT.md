# CG-1D — AI Grounding Contract

**Program:** CG-1D — AI Context Bundle Formalization  
**Date:** 2026-06-19  
**Status:** **RATIFIED** (implementation)

---

## Contract statement

> The AI Pipeline **may consume** formal Context Graph bundles (`ContextBundleDescriptor`) as **read-only, permission-filtered views**. The AI Pipeline **must not** own, persist, or mutate graph state. All federation reads flow through the **Context Graph Bundle Provider** into module SoR via adapters.

---

## Flow: Context Graph → AI Pipeline → Retrieval → Grounded response

```
1. RETRIEVAL TRIGGER
   Pipeline catalog source `graph_bundle` enabled
   + query signals (VL code, relationship intent, optional grounding rule)

2. BUNDLE RESOLUTION (Tier 0)
   graphBundlePipelineContextService
     → contextGraphBundleProvider.resolveVLinkBundlesForAi()
     → contextGraphOrchestrator.resolveVLinkBundle()
     → adapter registry (PE every hop)
   Output: ContextBundleDescriptor[] + ContextBundleAiGroundingPayload[]

3. PIPELINE ASSEMBLY
   ctxRecord.graphBundlePipelineContext stored
   assembleAIContext() injects "Context Graph Bundles (formal)" block
   provenance + permissionOutcome included in evidence

4. GROUNDED RESPONSE
   Model receives compact grounding payload
   Trace records source `graph_bundle`
   Response must not claim graph mutations occurred
```

---

## Ownership boundaries

| Layer | Owns graph state? | May write? | Access pattern |
|-------|-------------------|----------|----------------|
| Module SoR (drive, todo, etc.) | Yes — module data | Module routes only | Adapters delegate here |
| Context Graph orchestrator | No — composes views | **No** | Read federation |
| Bundle provider | No | **No** | Orchestrator only |
| AI pipeline | **No** | **No** | Provider + catalog |
| AI memory (`UserMemoryFact`) | User facts — not graph | Memory routes | Separate from graph |

---

## Permitted AI consumption

| Consumption | Allowed? |
|-------------|----------|
| V_Link implicit context (`vlink` source) | Yes — legacy |
| Formal context bundles (`graph_bundle`) | **Yes — constitutional** |
| Direct adapter/registry import in AI code | **No** |
| Graph DB / universal relationship table | **No** |
| AI memory as graph substitute | **No** |

---

## Permission guarantees

1. **Membership ≠ content access** — vlink membership required for container resolution; module PE filters each node
2. **Omitted nodes** — denied nodes excluded from bundle; counted in `composition.nodesOmitted`
3. **Restricted nodes** — title redacted; no sensitive URLs
4. **Suggestions excluded** — only ACTIVE vlinks with user membership

---

## HTTP contract

**Endpoint:** `POST /api/context-graph/ai/grounding-bundle`

**Auth:** JWT required

**Response envelope:**

```json
{
  "success": true,
  "data": {
    "consumer": "ai_pipeline",
    "bundles": [ "...ContextBundleDescriptor..." ],
    "groundingPayloads": [ "...ContextBundleAiGroundingPayload..." ],
    "estimatedTokens": 123
  },
  "meta": {
    "bundlesUsed": 1,
    "totalNodes": 5,
    "totalRestrictedNodes": 0,
    "totalOmittedNodes": 0
  }
}
```

---

## Certification evidence (CG-1D)

| Question | Answer |
|----------|--------|
| Does AI own graph state? | **No** |
| Can AI bypass permissions? | **No** — orchestrator PE; omitted/restricted nodes |
| Can AI mutate graph state? | **No** — read-only paths only |
| Is Context Graph still Tier 0? | **Yes** |
| Is AI a consumer only? | **Yes** |
| Is CG-F-006 closed? | **Yes** |

---

## Related

- [CG_1D_AI_CONTEXT_BUNDLE_ARCHITECTURE.md](./CG_1D_AI_CONTEXT_BUNDLE_ARCHITECTURE.md)
- [CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md](./CONTEXT_GRAPH_AI_INTEGRATION_ANALYSIS.md)
- [AI_PLATFORM_CONSTITUTION.md](../architecture/AI_PLATFORM_CONSTITUTION.md)

**Last updated:** 2026-06-19
