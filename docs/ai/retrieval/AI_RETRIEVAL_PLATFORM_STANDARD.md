# AI Retrieval Platform Standard

**Program:** AI Retrieval Adapter — Phase 2A  
**Version:** 1.0.0  
**Date:** 2026-06-23  
**Status:** Platform standard — binding for AI retrieval integrations  
**Constitutional authority:** [AI_RETRIEVAL_CONSTITUTION.md](./AI_RETRIEVAL_CONSTITUTION.md)

---

## 1. Standard scope

This standard defines **how Vssyl implements AI Retrieval** as platform infrastructure. It applies to:

- First-party AI pipeline consumers (`planning`, `workflow_action`, future intents)
- Digital Life Twin grounding paths
- Future marketplace AI modules with query-discovery
- Internal services — **not** browser clients

It does **not** define prompt templates, embedding models, semantic ranking, or Context Graph traversal.

---

## 2. Capability classification

| Attribute | Value |
|-----------|-------|
| **Class** | Platform Capability |
| **Id** | `ai_retrieval` |
| **Not** | Product module; not RAG; not vector search |
| **Certification** | L2 Certified With Findings (RD-AR-001) |
| **Architecture** | Option B Hybrid — Search for discovery |
| **Dependency** | `unified_search` (RD-US-001) |

---

## 3. Required runtime components

| Component | Path / artifact | Required |
|-----------|-----------------|----------|
| Capability service | `server/src/ai/retrieval/aiRetrievalCapabilityService.ts` | ✅ |
| Evidence mapper | `server/src/ai/retrieval/aiRetrievalEvidenceMapper.ts` | ✅ |
| Type contracts | `server/src/ai/retrieval/aiRetrievalTypes.ts` | ✅ |
| Consumer contract | `server/src/ai/retrieval/aiRetrievalConsumerContract.ts` | ✅ |
| Pipeline hook | `server/src/ai/retrieval/aiRetrievalPipelineHook.ts` | ✅ |
| Search dependency | `searchCapabilityService.executeGlobalSearch` | ✅ |
| Tests | `server/src/ai/retrieval/__tests__/` | ✅ |

---

## 4. Discovery API standard (internal)

### 4.1 Entry point

```typescript
discover(input: AIRetrievalDiscoverInput): Promise<AIRetrievalDiscoverResult>
```

### 4.2 Required input fields

| Field | Required | Notes |
|-------|:--------:|-------|
| `query` | ✅ | Min 2 characters |
| `userId` | ✅ | Authenticated actor |
| `intent` | ✅ for wired consumers | Consumer intent id |
| `dashboardId` / `businessId` / `householdId` | When scoped | Tenant context |
| `limit` | Optional | Default 10; max 25 |
| `moduleId` | Optional | Single-provider filter |

### 4.3 Prohibited patterns

- Direct `searchProviderRegistry` calls from AI consumers
- Direct visibility `searchAccessible*` from AI consumers for query-discovery
- Public HTTP route exposing `discover()`

---

## 5. Evidence standard

| Field | Rule |
|-------|------|
| `sourceType` | Always `'search'` |
| `sourceModule` | Matches Search `moduleId` |
| `entityId` / `entityType` | From `SearchResult` |
| `route` | Leading `/`; fallback `/{moduleId}/{entityId}` |
| `confidence` | `normalizeEvidenceConfidence(score)` — 0–1 |
| `permissionsVerified` | All permissions granted |
| `retrievedAt` | ISO-8601 at map time |

---

## 6. Diagnostics standard

Every `discover()` call **must** return `AIRetrievalDiagnostics` including:

| Field | Purpose |
|-------|---------|
| `retrievalPathway` | Always `'unified_search'` |
| `providersUsed` / `providerCount` | Search fan-out |
| `providerParticipation` | Evidence per provider |
| `retrievalSourceCounts` | Evidence per module |
| `evidenceCount` | Selected evidence size |
| `searchDurationMs` | Search orchestration time |
| `retrievalDurationMs` | Total adapter time |
| `permissionEnforcementStatus` | `enforced` \| `denied` \| `error` |

Diagnostics are **lightweight** — attached to request context; persistence is a separate policy decision (AR-M2).

---

## 7. Consumer wiring standard

### 7.1 Wired consumers (Phase 2A)

| Intent | Hook | Limit | Flag |
|--------|------|------:|------|
| `workflow_action` | `runPipelineRetrievalDiscovery` | 10 | `AI_RETRIEVAL_WORKFLOW_ACTION_ENABLED` |
| `planning` | `runPipelineRetrievalDiscovery` | 8 | `AI_RETRIEVAL_PLANNING_ENABLED` |

### 7.2 Wiring procedure for new consumers

1. Add intent to `RETRIEVAL_ADAPTER_CONSUMER_INTENTS` (with priority order).
2. Define limit in `CONSUMER_LIMITS`.
3. Add feature flag if needed.
4. Wire through pipeline hook or approved twin entry point.
5. Attach `_ai_retrieval_discovery` to module context patch.
6. Add tests per [AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md](./AI_RETRIEVAL_COMPLIANCE_REQUIREMENTS.md).
7. Update Readiness Matrix tier status.

### 7.3 Context attachment

```typescript
moduleContextsPatch._ai_retrieval_discovery = {
  intent: string;
  evidence: AIRetrievalEvidence[];
  diagnostics: AIRetrievalDiagnostics;
  pilotPhase: string;
};
```

Twin passes `aiRetrievalDiscovery` to request context for pipeline diagnostics.

---

## 8. Feature flag standard

| Variable | Default | Scope |
|----------|---------|-------|
| `AI_RETRIEVAL_DISCOVERY_ENABLED` | enabled | Global |
| `AI_RETRIEVAL_PLANNING_ENABLED` | enabled | Planning consumer |
| `AI_RETRIEVAL_WORKFLOW_ACTION_ENABLED` | enabled | Workflow action consumer |

Disabled flags **skip** adapter call — they do **not** silently enable shadow paths in wired consumers.

---

## 9. Failure handling standard

| Condition | Behavior |
|-----------|----------|
| Query &lt; 2 chars | Skip discovery; no error |
| `search:read` denied | Empty evidence; `denied` diagnostics |
| Search provider error | Logged; other providers continue (Search behavior) |
| Adapter exception | Logged; pipeline continues without evidence |

---

## 10. Versioning

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-23 | Phase 2A ratification — constitutional standard |

---

**Last updated:** 2026-06-23
