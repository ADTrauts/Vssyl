# AI Retrieval — Phase 2B-2 Closeout

**Program:** AI Retrieval Adapter — Phase 2B-2 Project Assistant Adoption  
**Date:** 2026-06-23  
**Status:** **Complete**

---

## Executive summary

Phase 2B-2 introduces the **`project_assistant`** pipeline intent and wires it as the fourth Retrieval Adapter consumer. This validates cross-module discovery — the closest existing workflow to Vssyl's contextual intelligence vision.

**Rollout:** Opt-in via `AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED=true` (default off).

---

## Deliverables

| # | Deliverable | Status |
|---|-------------|:------:|
| 1 | Project Assistant inventory | ✅ |
| 2 | `project_assistant` intent + consumer wired | ✅ |
| 3 | Cross-module evidence review | ✅ |
| 4 | Diagnostics (`consumerDomain`, `retrievalSourceDiversity`, `projectProfile`) | ✅ |
| 5 | Readiness matrix updated | ✅ |
| 6 | SC-M4 assessment | ✅ |
| 7 | Tests (46 passing in retrieval suite) | ✅ |

---

## Code changes

| Area | Change |
|------|--------|
| `inferPipelineIntents.ts` | `PROJECT_ASSISTANT` regex |
| `pipelineRegistryIds.ts` | System intent id |
| `pipelineCatalogDefaults.ts` | Intent + grounding rule |
| `pipelineGroundingRuleReconcile.ts` | V_Link/graph_bundle optional |
| `pipelineGroundingRetrieval.ts` | V_Link/graph intent boost |
| `aiRetrievalConsumerContract.ts` | Wired consumer; opt-in flag |
| `aiRetrievalCapabilityService.ts` | `retrievalSourceDiversity` |
| `aiRetrievalContextPatch.ts` | `projectProfile` patch builder |
| `aiRetrievalTypes.ts` | `retrievalSourceDiversity` field |

### Wired consumers (after 2B-2)

| Priority | Intent | Flag default |
|----------|--------|--------------|
| 1 | `workflow_action` | on |
| 2 | `business_operations` | on |
| 3 | `project_assistant` | **off (opt-in)** |
| 4 | `planning` | on |

---

## Acceptance criteria

| Criterion | Met? |
|-----------|:----:|
| Project Assistant consumes Retrieval Adapter | ✅ |
| Existing behavior stable | ✅ |
| Diagnostics emitted | ✅ |
| Cross-module evidence generated | ✅ |
| Tests pass | ✅ |
| Documentation updated | ✅ |

---

## Phase 2B-3 recommendations

1. Enable `project_assistant` by default after production validation
2. Wire `scheduling` consumer (query-shaped subset)
3. Staffing action path review (deferred)
4. `local_discovery` with `moduleId: 'place'`

---

**Last updated:** 2026-06-23
