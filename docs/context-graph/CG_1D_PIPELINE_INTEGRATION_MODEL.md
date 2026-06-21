# CG-1D — Pipeline Integration Model

**Program:** CG-1D — AI Context Bundle Formalization  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED**

---

## Integration flow

```
User query
    ↓
inferPipelineIntents()
    ↓
runPipelineGroundingRetrieval()
    ├── optionalSources includes graph_bundle? (planning, workflow, business, technical)
    ├── detectGraphBundleQuerySignals() — VL code / relationship keywords
    └── fetchGraphBundlePipelineContext()
            ├── prisma vLink discovery (membership-scoped IDs)
            └── resolveVLinkBundlesForAi() → ContextBundleDescriptor[]
    ↓
ctxRecord.graphBundlePipelineContext
    ↓
assembleAIContext() — "Context Graph Bundles (formal)" block
    ↓
Provider call + pipeline trace (source: graph_bundle)
```

---

## Catalog source: `graph_bundle`

| Field | Value |
|-------|-------|
| **ID** | `graph_bundle` |
| **Label** | Context Graph Bundles |
| **System protected** | Yes (`SYSTEM_CONTEXT_SOURCE_IDS`) |
| **Default enabled** | Yes |
| **wiredInTwin** | Yes |
| **Mapped tools** | `module_context` |

Reconciliation: `reconcileSystemPipelineContextSources()` idempotently inserts when missing (same pattern as `vlink`).

---

## Grounding rules

`graph_bundle` added as **optional** source on:

- `planning`
- `workflow_action`
- `business_operations`
- `technical_help`

Coexists with `vlink` — admins may disable either independently in pipeline catalog.

---

## Trigger conditions

`fetchGraphBundlePipelineContext` runs when:

1. Catalog source `graph_bundle` is **enabled**, AND
2. Any of:
   - Inferred intent optional sources include `graph_bundle`
   - Query references VL public code (`VL-123456`)
   - Relationship query signals (`linked`, `connected to`, `vlink`, etc.)
   - Intent boost from planning/workflow/business/technical intents

---

## Trace and diagnostics

| Surface | Behavior |
|---------|----------|
| `contextRetrieved` | `{ source: 'graph_bundle', provider: 'context_graph_bundle_provider', itemCount }` |
| `sourcesUsed` | includes `graph_bundle` when `bundlesUsed > 0` |
| Admin trace checklist | "Context Graph Bundles" row in `pipelineTraceInsights.ts` |
| Assembled evidence | `sourceType: 'graph_bundle'`, confidence `high` |

---

## HTTP grounding endpoint

**`POST /api/context-graph/ai/grounding-bundle`**

| Mode | Body | Response |
|------|------|----------|
| Batch vlinks | `{ vlinkIds: string[] }` | `{ bundles, groundingPayloads, estimatedTokens }` |
| Single root | `{ root, tenantScope, depth?, nodeBudget? }` | Single bundle + grounding payload |

- Requires JWT auth
- Consumer fixed to `ai_pipeline`
- Header: `X-Context-Graph-Contract-Version: 1.0`

---

## What was NOT changed

- `vlink` catalog source — retained for backward compatibility
- Module context providers — unchanged
- Entity linking — unchanged (vlink path still feeds `persistedVLinks`)
- Write paths — none added

---

## Related

- [CG_1D_AI_CONTEXT_BUNDLE_ARCHITECTURE.md](./CG_1D_AI_CONTEXT_BUNDLE_ARCHITECTURE.md)
- [AI_PLATFORM_OVERVIEW.md](../architecture/AI_PLATFORM_OVERVIEW.md)

**Last updated:** 2026-06-19
