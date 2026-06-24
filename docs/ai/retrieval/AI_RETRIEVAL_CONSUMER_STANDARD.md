# AI Retrieval — Consumer Standard

**Program:** AI Retrieval Adapter — Phase 1B  
**Date:** 2026-06-23  
**Status:** Normative contract for AI retrieval integrations  
**Authority:** Internal platform standard — not a public API

---

## 1. Purpose

Define the **required contract** for any AI path that consumes the Retrieval Adapter. Future intents (`business_operations`, `scheduling`, `local_discovery`, `project_assistant`) must conform before wiring.

**Canonical flow:**

```
AI Consumer (intent-detected path)
  ↓
aiRetrievalCapabilityService.discover()
  ↓
searchCapabilityService.executeGlobalSearch()
  ↓
AIRetrievalEvidence[] + AIRetrievalDiagnostics
  ↓
Reasoning / generation (unchanged)
```

---

## 2. Wired consumers (Phase 1B)

| Intent | Entry point | Limit | Feature flag |
|--------|-------------|------:|--------------|
| `workflow_action` | `runPipelineRetrievalDiscovery` | 10 | `AI_RETRIEVAL_WORKFLOW_ACTION_ENABLED` |
| `planning` | `runPipelineRetrievalDiscovery` | 8 | `AI_RETRIEVAL_PLANNING_ENABLED` |

**Global opt-out:** `AI_RETRIEVAL_DISCOVERY_ENABLED=false`

**Priority:** When multiple consumer intents match, `workflow_action` wins over `planning`.

**Code reference:** `server/src/ai/retrieval/aiRetrievalConsumerContract.ts`

---

## 3. Required inputs

Every `discover()` call must provide:

| Field | Required | Notes |
|-------|:--------:|-------|
| `query` | ✅ | User message or extracted query; min 2 chars |
| `userId` | ✅ | Authenticated subject |
| `intent` | ✅ for wired paths | Consumer intent id |
| `dashboardId` | When in personal/business workspace | Tenant scope |
| `businessId` | When in business context | Tenant scope |
| `householdId` | When in household context | Tenant scope |
| `limit` | Optional | Default 10; max 25 |
| `moduleId` | Optional | Single-provider filter only |

**Prohibited:** Direct visibility service calls for query-driven discovery when adapter is wired.

---

## 4. Required outputs

### Evidence (`AIRetrievalEvidence`)

| Field | Requirement |
|-------|-------------|
| `sourceType` | Always `'search'` |
| `sourceModule` | Search provider module id |
| `entityId` | Stable entity identifier |
| `entityType` | Provider entity type |
| `title` | Human-readable label |
| `summary` | Optional description |
| `score` | Raw relevance when available |
| `confidence` | Normalized 0–1 when score present |
| `route` | Non-empty deep link; leading `/` |
| `permissionsVerified` | `true` only when all permissions granted |
| `retrievedAt` | ISO-8601 timestamp |

### Diagnostics (`AIRetrievalDiagnostics`)

| Field | Requirement |
|-------|-------------|
| `retrievalPathway` | Always `'unified_search'` |
| `providersUsed` | Provider ids invoked by Search |
| `providerCount` | Count of providers in fan-out |
| `providerParticipation` | Evidence count per provider |
| `retrievalSourceCounts` | Evidence count per source module |
| `resultsReturned` | Total search hits before limit |
| `resultsSelected` | Evidence count after limit |
| `evidenceCount` | Same as `resultsSelected` |
| `searchDurationMs` | Time in `executeGlobalSearch` |
| `retrievalDurationMs` | Total adapter time |
| `searchContext` | Tenant scope applied |
| `permissionEnforcementStatus` | `enforced` \| `denied` \| `error` |

---

## 5. Permission expectations

1. **Adapter never bypasses Search** — all discovery goes through `executeGlobalSearch`.
2. **`search:read`** enforced via `evaluateSearchPolicyDual`.
3. **Module delegates** enforce entity-level visibility inside providers.
4. **Denied access** returns empty evidence with `permissionEnforcementStatus: 'denied'` — never partial unauthorized entities.
5. **Tenant isolation** — `businessId`, `dashboardId`, `householdId` passed as `filters.context`.

---

## 6. Integration pattern for new consumers

1. Add intent to `RETRIEVAL_ADAPTER_PLANNED_INTENTS` or promote to `RETRIEVAL_ADAPTER_CONSUMER_INTENTS`.
2. Define per-intent limit in `CONSUMER_LIMITS`.
3. Add per-intent feature flag if needed.
4. Wire via `runPipelineRetrievalDiscovery` or direct `discover()` from an approved AI entry point.
5. Attach evidence to module context patch (`_ai_retrieval_discovery`) — do not replace existing providers.
6. Add tests: permission denial, tenant scope, diagnostics, feature flag.
7. Update [AI_RETRIEVAL_READINESS_MATRIX.md](./AI_RETRIEVAL_READINESS_MATRIX.md).

---

## 7. Planned consumers (not yet wired)

| Intent | Expected entry | Notes |
|--------|----------------|-------|
| `business_operations` | Pipeline grounding or twin | Business KPI / workforce queries |
| `scheduling` | Pipeline grounding | Calendar-heavy discovery |
| `local_discovery` | Pipeline grounding | Place module filter likely |
| `project_assistant` | Twin or orchestrator | Cross-module project entities |

---

## 8. Anti-patterns

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Direct Prisma in twin for discovery | Violates AI-2 |
| Duplicate search logic in consumer | Bypasses Search certification |
| Replacing context providers with Search | Summaries ≠ discovery |
| Embeddings / vector in adapter | Out of scope until later phase |
| Public HTTP exposure of `discover()` | Internal capability only |

---

**Last updated:** 2026-06-23
