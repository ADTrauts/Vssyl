# AI Retrieval — Phase 1A Closeout

**Program:** AI Retrieval Adapter — Phase 1A Capability Service & Search Discovery Pilot  
**Date:** 2026-06-23  
**Status:** **Complete** — foundation shipped; pilot active  
**Prerequisite:** Unified Search L2 CwF (RD-US-001)

---

## Executive summary

Phase 1A establishes the **Retrieval Adapter** as an internal platform capability. AI can now perform permission-safe discovery through **Unified Search** without replacing existing context providers, tools, or grounding paths.

**Pilot consumer:** `planning` intent in `pipelineGroundingRetrieval` (opt-out via `AI_RETRIEVAL_DISCOVERY_ENABLED=false`).

---

## Deliverables

| # | Deliverable | Location | Status |
|---|-------------|----------|:------:|
| 1 | AI Retrieval Capability Service | `server/src/ai/retrieval/aiRetrievalCapabilityService.ts` | ✅ |
| 2 | Evidence mapper | `server/src/ai/retrieval/aiRetrievalEvidenceMapper.ts` | ✅ |
| 3 | Type contracts | `server/src/ai/retrieval/aiRetrievalTypes.ts` | ✅ |
| 4 | Search integration | `discover()` → `executeGlobalSearch()` | ✅ |
| 5 | Retrieval diagnostics | `AIRetrievalDiagnostics` | ✅ |
| 6 | Planning intent pilot | `pipelineGroundingRetrieval.ts` | ✅ |
| 7 | Twin context passthrough | `DigitalLifeTwinCore.ts` → `aiRetrievalDiscovery` | ✅ |
| 8 | Tests | `server/src/ai/retrieval/__tests__/` + pilot test | ✅ |
| 9 | Documentation | This file + Phase 0A doc updates | ✅ |

---

## Architecture (as-built)

```
User
  ↓
AI (Digital Life Twin)
  ↓
pipelineGroundingRetrieval (planning intent)
  ↓
aiRetrievalCapabilityService.discover()
  ↓
searchCapabilityService.executeGlobalSearch()
  ↓
Search Provider Registry (9 providers)
  ↓
AIRetrievalEvidence[] + AIRetrievalDiagnostics
  ↓
moduleContextsPatch._ai_retrieval_discovery
```

**Not in scope:** vector search, embeddings, RAG, prompt redesign, provider rewrites, full migration.

---

## API contract (internal only)

```typescript
discover({
  query: string;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  intent?: string;
  limit?: number;      // default 10, max 25
  moduleId?: string;   // optional single-provider filter
}): Promise<{
  evidence: AIRetrievalEvidence[];
  diagnostics: AIRetrievalDiagnostics;
}>
```

### Evidence shape

```typescript
{
  sourceType: 'search';
  sourceModule: string;
  entityId: string;
  entityType: string;
  title: string;
  summary?: string;
  score?: number;
  route: string;
  permissionsVerified: boolean;
}
```

### Diagnostics shape

Captures: query, intent, providers used, provider count, results returned/selected, retrieval duration, search context scope, permission enforcement status (`enforced` | `denied` | `error`).

---

## Permission & tenancy

- **Policy:** `search:read` via `evaluateSearchPolicyDual` (inherited from Search capability).
- **Tenant scope:** `filters.context` carries `dashboardId`, `businessId`, `householdId`.
- **Provider permissions:** Each search provider enforces module-specific visibility delegates.
- **No bypass:** Adapter does not call visibility services directly — Search is authoritative.

---

## Pilot behavior

| Condition | Behavior |
|-----------|----------|
| `planning` intent detected | `discover()` runs with user message as query |
| `AI_RETRIEVAL_DISCOVERY_ENABLED=false` | Pilot skipped |
| Query &lt; 2 chars | Pilot skipped |
| Search denied (403) | Empty evidence; diagnostics `permissionEnforcementStatus: denied` |
| Other intents | No adapter call — existing paths unchanged |

Evidence is attached to `moduleContextsPatch._ai_retrieval_discovery` and `ctxRecord.aiRetrievalDiscovery` for downstream assembly/diagnostics.

---

## Place duplication review (Phase 1A)

| Path | Status after 1A |
|------|-----------------|
| Context provider `place_discoveries` | **Unchanged** — curated summaries |
| Tool `search_places` | **Unchanged** — direct `placeVisibilityService` |
| Unified Search place provider | **Unchanged** — same delegate |

**Decision:** No consolidation in 1A. All three paths share `searchListingsForUser` at the visibility layer. Routing `search_places` through the adapter would add `search:read` gating — behavior change, not low-risk. **Defer to Phase 1B** with explicit migration plan.

---

## Tests

| Suite | Coverage |
|-------|----------|
| `aiRetrievalEvidenceMapper.test.ts` | Field mapping, permission flag |
| `aiRetrievalCapabilityService.test.ts` | Search integration, tenant scope, module filter, denial, limit cap |
| `pipelineGroundingRetrieval.retrievalPilot.test.ts` | Planning pilot on/off, context attachment |

**Result:** 12 tests passing.

---

## Acceptance criteria

| Criterion | Met? |
|-----------|:----:|
| `aiRetrievalCapabilityService` exists | ✅ |
| Retrieval Adapter consumes Unified Search | ✅ |
| SearchResult → Evidence mapping | ✅ |
| Retrieval diagnostics | ✅ |
| One AI path uses Retrieval Adapter | ✅ (`planning`) |
| Existing AI functionality stable | ✅ (additive pilot) |
| No retrieval regressions | ✅ |
| Tests pass | ✅ |
| Documentation updated | ✅ |

---

## Gaps closed / remaining

| Gap (Phase 0A) | Phase 1A |
|----------------|----------|
| SA-01 No AI → Search call path | **Closed** — pilot path |
| SA-02 No result → context mapper | **Closed** — evidence mapper |
| SA-03 Intent routing undefined | **Partial** — planning only |
| SA-04 No unified audit trail | **Partial** — diagnostics object |
| SA-05 Place triple path | **Documented** — deferred |
| SA-06 No token budget on search hits | **Open** — limit cap only |

---

## Phase 2A recommendations

1. Expand pilot intents (`workflow_action`, `research`).
2. Place tool → adapter migration with `search:read` parity test.
3. Token budget / evidence ranking for prompt assembly.
4. Retrieval diagnostics in admin pipeline UI.
5. Begin `ai_retrieval` capability certification (G1–G9).

---

**Last updated:** 2026-06-23

---

## Phase 1B supersession note

Phase 1B expanded the pilot to **`workflow_action`** + **`planning`**, introduced the [Consumer Standard](./AI_RETRIEVAL_CONSUMER_STANDARD.md), standardized evidence/diagnostics, and published the [Readiness Matrix](./AI_RETRIEVAL_READINESS_MATRIX.md).

See [AI_RETRIEVAL_PHASE_1B_CLOSEOUT.md](./AI_RETRIEVAL_PHASE_1B_CLOSEOUT.md).
