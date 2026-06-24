# Business Operations — Retrieval Adoption

**Program:** AI Retrieval Adapter — Phase 2B-1  
**Date:** 2026-06-23  
**Status:** Adoption complete  
**Integration path:** `business_operations` pipeline intent → operational planning

---

## 1. Integration summary

| Attribute | Value |
|-----------|-------|
| **Consumer intent** | `business_operations` |
| **Entry point** | `runPipelineRetrievalDiscovery` in `pipelineGroundingRetrieval` |
| **Priority** | `workflow_action` > `business_operations` > `planning` |
| **Limit** | 10 evidence items |
| **Feature flag** | `AI_RETRIEVAL_BUSINESS_OPERATIONS_ENABLED` (default: enabled) |
| **Pilot phase tag** | `2B-1` |

---

## 2. Behavior

When a user message triggers `business_operations` intent (and no higher-priority consumer intent):

1. Existing grounding runs unchanged (HR, scheduling, workforce comms providers).
2. Adapter calls `discover()` with `businessId` + `dashboardId` from twin context.
3. Unified Search fans out across ready providers scoped to business tenant.
4. Evidence attaches to `_ai_retrieval_discovery` with `operationalProfile`.
5. Twin receives `aiRetrievalDiscovery` for pipeline diagnostics.

**Additive only** — providers and V_Link/graph bundle paths are preserved.

---

## 3. Evidence utilization findings

| Metric | Observation |
|--------|-------------|
| **Provider participation** | Full Search fan-out (up to 9 providers); business-scoped hits favor `member`, `todo`, `calendar`, `chat`, `drive` |
| **Evidence counts** | Limit 10; typical operational queries return 0–8 hits depending on query specificity |
| **Retrieval usefulness** | High for entity discovery ("find team policy doc", "employees named X"); complements HR rollups |
| **Context completeness** | Provider rollups + Search evidence = hybrid coverage per Option B architecture |
| **Permission safety** | `permissionsVerified` on each evidence item; deny returns empty evidence |

### Expected module contribution (operational queries)

| Module | Typical evidence role |
|--------|----------------------|
| `member` | Team member discovery |
| `todo` | Operational tasks |
| `calendar` | Meetings and events |
| `chat` | Workforce conversations |
| `drive` | Policy documents, reports |
| `notes` | Operational notes |

HR/scheduling **rollups** remain provider-only (headcount, coverage) — not duplicated by Search.

---

## 4. Diagnostics (Phase 2B-1 expansion)

### Standard fields (all consumers)

`retrievalPathway`, `providerParticipation`, `retrievalSourceCounts`, `evidenceCount`, `searchDurationMs`, `retrievalDurationMs`, `searchContext`

### Business Operations fields

| Field | Location | Purpose |
|-------|----------|---------|
| `consumerDomain` | `AIRetrievalDiagnostics` | `'business_operations'` |
| `modulesContributingEvidence` | `AIRetrievalDiagnostics` | Module ids with ≥1 evidence |
| `operationalProfile` | `_ai_retrieval_discovery` patch | Domain, modules, scope, duration |

```typescript
operationalProfile: {
  domain: 'business_operations';
  modulesContributing: string[];
  contextScope?: { businessId?, dashboardId?, householdId? };
  retrievalDurationMs: number;
}
```

---

## 5. Example trigger queries

| Query | Intent | Expected retrieval |
|-------|--------|-------------------|
| "How is our team utilization this quarter?" | business_operations | member + todo evidence |
| "What are our business KPIs for the workforce?" | business_operations | drive + member + chat |
| "Show company policy on time off" | business_operations | drive + notes search hits |
| "Our employees quarterly results" | business_operations | member + drive |

---

## 6. Feature flags

| Variable | Default | Effect |
|----------|---------|--------|
| `AI_RETRIEVAL_DISCOVERY_ENABLED` | enabled | Global opt-out |
| `AI_RETRIEVAL_BUSINESS_OPERATIONS_ENABLED` | enabled | Business ops consumer |

---

## 7. Out of scope (this phase)

- Staffing action executor migration
- Scheduling intent as separate consumer
- Admin diagnostics UI
- Audit persistence
- Token budgeting

---

**Last updated:** 2026-06-23
