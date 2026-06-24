# AI Retrieval — Phase 1B Closeout

**Program:** AI Retrieval Adapter — Phase 1B Workflow Action Expansion & Retrieval Standardization  
**Date:** 2026-06-23  
**Status:** **Complete**  
**Prerequisite:** Phase 1A closeout

---

## Executive summary

Phase 1B expands the Retrieval Adapter from a single-intent pilot to **shared AI infrastructure** with two wired consumers (`planning`, `workflow_action`), a formal **Consumer Standard**, standardized evidence/diagnostics, and a **Readiness Matrix** for future migration.

No broad AI migration, prompt redesign, or vector/semantic work was performed.

---

## Deliverables

| # | Deliverable | Location | Status |
|---|-------------|----------|:------:|
| 1 | Workflow action pilot | `aiRetrievalPipelineHook.ts` + consumer contract | ✅ |
| 2 | Consumer Standard | `docs/ai/retrieval/AI_RETRIEVAL_CONSUMER_STANDARD.md` | ✅ |
| 3 | Evidence standardization | `aiRetrievalTypes.ts`, `aiRetrievalEvidenceMapper.ts` | ✅ |
| 4 | Diagnostics expansion | `AIRetrievalDiagnostics` extended fields | ✅ |
| 5 | Readiness Matrix | `AI_RETRIEVAL_READINESS_MATRIX.md` | ✅ |
| 6 | SC-M4 reassessment | Section below | ✅ |
| 7 | Tests | 24 tests passing | ✅ |

---

## Code changes

### New files

| File | Role |
|------|------|
| `aiRetrievalConsumerContract.ts` | Intent priority, limits, feature flags |
| `aiRetrievalPipelineHook.ts` | Shared pipeline integration hook |

### Modified files

| File | Change |
|------|--------|
| `aiRetrievalTypes.ts` | `confidence`, `retrievedAt`, expanded diagnostics |
| `aiRetrievalEvidenceMapper.ts` | Route normalization, source counts |
| `aiRetrievalCapabilityService.ts` | Split search/retrieval timing, diagnostics |
| `pipelineGroundingRetrieval.ts` | Uses `runPipelineRetrievalDiscovery` |

### Feature flags

| Variable | Default | Effect |
|----------|---------|--------|
| `AI_RETRIEVAL_DISCOVERY_ENABLED` | enabled | Global opt-out |
| `AI_RETRIEVAL_PLANNING_ENABLED` | enabled | Planning consumer |
| `AI_RETRIEVAL_WORKFLOW_ACTION_ENABLED` | enabled | Workflow action consumer |

---

## Wired consumers

```
User message
  ↓
inferPipelineIntents()
  ↓
resolveRetrievalConsumerIntent()  [workflow_action > planning]
  ↓
runPipelineRetrievalDiscovery()
  ↓
discover() → executeGlobalSearch()
  ↓
Evidence + Diagnostics → _ai_retrieval_discovery
```

When both `workflow_action` and `planning` match, **workflow_action** wins (higher priority).

---

## Evidence standardization (1B)

| Field | Standard |
|-------|----------|
| `sourceType` | Always `'search'` |
| `sourceModule` | Matches Search `moduleId` |
| `route` | Leading `/`; fallback `/{moduleId}/{entityId}` |
| `confidence` | 0–1 from `relevanceScore` |
| `permissionsVerified` | All permissions must be granted |
| `retrievedAt` | ISO-8601 at mapping time |

---

## Diagnostics expansion (1B)

New fields: `retrievalPathway`, `retrievalSourceCounts`, `providerParticipation`, `evidenceCount`, `searchDurationMs` (separate from `retrievalDurationMs`).

---

## SC-M4 reassessment (assessment only — not self-certification)

**Finding (RD-US-001):** SC-M4 — *AI retrieval uses parallel paths, not search delegates.*

### Material progress in Phase 1B

| Criterion | Phase 1A | Phase 1B |
|-----------|----------|----------|
| AI → Search call path | Planning only | Planning + workflow_action |
| Result → evidence mapper | ✅ | Standardized |
| Intent routing | Partial | Two consumers + priority |
| Audit/diagnostics | Partial | Expanded lightweight diagnostics |
| Parallel paths eliminated | No | No — by design |

### Assessment verdict

| Question | Answer |
|----------|--------|
| Does 1B materially close SC-M4? | **Partially** — proves pattern on two high-value intents |
| Is SC-M4 fully closed? | **No** — ~30+ context providers and tools remain parallel |
| Recommend certification action? | **Defer closure** — council should re-evaluate after Phase 2A (`business_operations`, Place tool migration) |
| Regression risk to Search cert? | **Low** — adapter consumes Search; does not modify Search |

**Recommendation:** Record SC-M4 as **in progress** with evidence of adapter adoption. Full closure requires Tier A/B migrations per Readiness Matrix — not self-certified in this phase.

---

## Tests

| Suite | Tests |
|-------|------:|
| `aiRetrievalConsumerContract.test.ts` | 6 |
| `aiRetrievalEvidenceMapper.test.ts` | 5 |
| `aiRetrievalCapabilityService.test.ts` | 6 |
| `aiRetrievalPipelineHook.test.ts` | 4 |
| `pipelineGroundingRetrieval.retrievalPilot.test.ts` | 3 |
| **Total** | **24** |

Coverage: workflow_action, planning, feature flags, evidence/diagnostics, permission denial, tenant scope, failure handling.

---

## Acceptance criteria

| Criterion | Met? |
|-----------|:----:|
| `workflow_action` uses Retrieval Adapter | ✅ |
| `planning` remains operational | ✅ |
| Retrieval Consumer Standard exists | ✅ |
| Evidence format standardized | ✅ |
| Diagnostics expanded | ✅ |
| Readiness Matrix exists | ✅ |
| Search alignment reassessed | ✅ |
| Tests pass | ✅ |
| Documentation updated | ✅ |

---

## Phase 2A recommendations

1. Wire `business_operations` and `local_discovery` consumers.
2. Migrate `search_places` tool through adapter (`moduleId: 'place'`).
3. Token budget for evidence in prompt assembly.
4. Admin diagnostics UI for `aiRetrievalDiscovery`.
5. Council review of SC-M4 partial closure.

---

**Last updated:** 2026-06-23
