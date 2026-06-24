# Context Graph — Project Assistant Pilot Validation

**Program:** Context Graph Phase 1C  
**Date:** 2026-06-23  
**Status:** Validation artifact

---

## Pilot stack

Three flags must be **explicitly true** together:

| Flag | Default | Role |
|------|---------|------|
| `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED` | off | Unified Search retrieval for `project_assistant` |
| `CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED` | off | Inference enrichment on graph bundles |
| `CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED` | off | Dedup authoritative vs inference |

**Helper:** `server/src/context-graph/projectAssistantPilotEnv.ts`

---

## Expected behavior (all flags on)

```
User query (project_assistant intent)
  → runPipelineRetrievalDiscovery()
  → enrichGraphBundlesFromRetrieval()     [bridge]
  → reconcileGroundingArtifacts()         [reconcile]
  → moduleContextsPatch + graphBundlePipelineContext → AI
```

| Stage | Output |
|-------|--------|
| Retrieval | `_ai_retrieval_discovery` + `projectProfile` |
| Bridge | `ai_session` or enriched bundle with `metadata.inference` |
| Reconcile | Deduped evidence; `_grounding_reconcile` diagnostics |
| Sources | `ai_retrieval`, `graph_bundle`, `retrieval_inference_bridge` |

---

## Fallback behavior

| Condition | Behavior |
|-----------|----------|
| Any flag off | That stage skipped; prior stages may still run |
| Retrieval off | No evidence patch; bridge/reconcile no-op |
| Bridge off | Evidence patch only; no inference bundle nodes |
| Reconcile off | Possible duplicate entity refs across sources |
| Non-`project_assistant` intent | Bridge + reconcile never run (pilot scope) |
| Missing `dashboardId` | Bridge skipped (tenant scope required) |
| Retrieval hook error | Logged; pipeline continues without retrieval |

---

## Failure modes

| Mode | Symptom | Mitigation |
|------|---------|------------|
| Search provider failure | Empty evidence | Check `permissionEnforcementStatus` in diagnostics |
| No V_Link membership | Empty federation bundle | Bridge creates `ai_session` from evidence |
| Access conflict | `skippedUnsafeMergeCount` > 0 | By design — no unsafe dedup |
| Intent misclassification | Bridge not triggered | Use project-scoped phrasing (see scenarios) |
| Flag partial enable | Incomplete stack | Enable all three or none for validation |

---

## Rollback path

1. Unset or set to `false` all three flags
2. Restart server (`pnpm dev`)
3. Verify: no `retrieval_inference_bridge` in sources; no `_grounding_reconcile` patch

**Production:** flags are unset by default — no rollback action required unless explicitly enabled.

---

## Validation scenarios

| # | Query (triggers `project_assistant`) | Verify |
|---|--------------------------------------|--------|
| 1 | "Help me understand everything related to this project" | Retrieval + bridge + reconcile |
| 2 | "What files, tasks, and messages are for this project?" | Cross-module evidence; dedup vs V_Link |
| 3 | "What is the project status and what changed recently?" | `projectProfile`; diagnostics |
| 4 | "Give me a project summary and context update" | Inference provenance on bundle nodes |

### Per-scenario checks

- [ ] `retrievalDiscovery.evidence.length` > 0
- [ ] `_ai_retrieval_discovery.projectProfile` present
- [ ] `graphBundlePipelineContext.bundlesUsed` > 0 (when bridge on)
- [ ] `_grounding_reconcile.duplicateCount` ≥ 0
- [ ] Explicit V_Link entity removed from evidence when reconcile on
- [ ] `metadata.inference.provenance === 'inference'` on surviving nodes
- [ ] No unrestricted content when V_Link marks `restricted`

---

## Diagnostics review

| Diagnostic | Location | Sufficient? |
|------------|----------|-------------|
| `aiRetrievalDiscovery` | `ctxRecord.aiRetrievalDiscovery` / patch | ✅ |
| `projectProfile` | `_ai_retrieval_discovery.projectProfile` | ✅ |
| `groundingReconcileDiagnostics` | result + `_grounding_reconcile` | ✅ |
| Inference provenance | bundle node `metadata.inference` | ✅ |
| `modulesContributingEvidence` | retrieval diagnostics | ✅ |
| `retrievalSourceDiversity` | `projectProfile` | ✅ |

**Admin review:** sufficient for dev/staging pilot. Production observability dashboard deferred.

---

## Local/dev enablement

Add to local `.env` (not production):

```bash
AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true
CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED=true
```

See `.env.example` commented section.

---

## Automated validation

`server/src/ai/pipeline/__tests__/pipelineGroundingRetrieval.projectAssistantPilot.test.ts` — 7 tests covering full stack, dedup, provenance, unsafe merge skip, rollback, scope.

**Last updated:** 2026-06-23
