# AI Discovery Adoption

**Program:** Platform Capability Adoption — Wave 3  
**Date:** 2026-06-25  
**Status:** Complete

---

## 1. Adoption checklist

| Requirement | Implementation |
|-------------|----------------|
| Route query-driven discovery through Retrieval Adapter | `runPipelineRetrievalDiscovery` → `discover()` |
| No direct Search calls from AI paths | Only `aiRetrievalCapabilityService` calls `executeGlobalSearch` |
| Named intent consumers wired | workflow_action, business_operations, project_assistant, local_discovery, planning |
| Query-native fallback | `general_discovery` via `detectQueryDiscoverySignals` |
| Search modules auto-participate | All ready providers in `searchProviderRegistry` |
| Context Graph consumes retrieval | `enrichGraphBundlesFromRetrieval` (flag-gated) |
| Grounding reconcile | `reconcileGroundingArtifacts` for all wired consumers (flag-gated) |
| Evidence source diagnostics | `buildPipelineEvidenceSourceDiagnostics` |

---

## 2. Intent inventory (Wave 3)

| Intent / pattern | Primary evidence path | Query-native? |
|------------------|----------------------|---------------|
| planning | Retrieval Adapter + optional recency providers | ✅ |
| project_assistant | Retrieval Adapter | ✅ (default on) |
| workflow_action | Retrieval Adapter | ✅ |
| business_operations | Retrieval Adapter + HR/scheduling providers | ✅ |
| local_discovery | Retrieval Adapter + place grounding | ✅ (default on) |
| research | `general_discovery` consumer | ✅ |
| find/search utterances | `general_discovery` consumer | ✅ |
| general_chat | Recency only unless find signals | Partial |
| emotional_support / personal_reflection | Recency / memory | Recency-first (by design) |

**Exceptions documented:** Emotional and reflective intents intentionally remain recency/memory-first — no parallel retrieval system added.

---

## 3. Code map

| File | Role |
|------|------|
| `aiRetrievalConsumerContract.ts` | Consumer priority, flags, `general_discovery` |
| `queryDiscoverySignals.ts` | Find-verb + entity detection |
| `aiRetrievalPipelineHook.ts` | Pipeline entry — calls `discover()` |
| `aiRetrievalCapabilityService.ts` | Unified Search delegate |
| `pipelineEvidenceSourceDiagnostics.ts` | Operator evidence breakdown |
| `pipelineGroundingRetrieval.ts` | Merges recency + retrieval + graph |
| `retrievalBundleBridgeConfig.ts` | Graph bridge for all wired consumers |
| `groundingReconcile.ts` | Dedup across evidence tiers |

---

## 4. Tests

| Suite | Coverage |
|-------|----------|
| `queryDiscoverySignals.test.ts` | Find patterns, module hints |
| `aiRetrievalConsumerContract.test.ts` | Priority, general_discovery, default flags |
| `aiRetrievalPipelineHook.test.ts` | Query-native hook invocation |
| `pipelineEvidenceSourceDiagnostics.test.ts` | Recency vs search vs graph buckets |
| `retrievalBundleInferenceBridge.test.ts` | Bridge for all consumers |
| `groundingReconcile.test.ts` | Reconcile scope |
| `pipelineGroundingRetrieval.retrievalPilot.test.ts` | End-to-end grounding integration |

**Last updated:** 2026-06-25
