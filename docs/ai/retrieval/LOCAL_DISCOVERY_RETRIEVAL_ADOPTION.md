# Local Discovery — Retrieval Adoption

**Program:** AI Retrieval Adapter — Phase 2B-3  
**Date:** 2026-06-23  
**Status:** Adoption complete

---

## 1. Integration summary

| Attribute | Value |
|-----------|-------|
| **Consumer intent** | `local_discovery` (existing pipeline intent) |
| **Entry point** | `runPipelineRetrievalDiscovery` |
| **Priority** | `workflow_action` > `business_operations` > `project_assistant` > **`local_discovery`** > `planning` |
| **Limit** | 12 evidence items |
| **Feature flag** | `AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED=true` (**opt-in**, default off) |

---

## 2. Enabling retrieval

```bash
AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED=true
```

---

## 3. Place alignment review (documentation only)

### Current architecture

| Layer | Implementation | PE / visibility |
|-------|----------------|-----------------|
| **Unified Search** | `placeSearchProvider` → `searchListingsForUser` | `search:read` + place read |
| **AI tool** | `search_places` → `placeAIActionService` | Direct visibility — no `search:read` |
| **Context provider** | `place_discoveries` | Curated discoveries endpoint |
| **Retrieval Adapter** | `discover()` → full Search fan-out | Inherits `search:read` |

### Overlap analysis

| Comparison | Overlap | Risk |
|------------|---------|------|
| Tool vs Search provider | Same `searchListingsForUser` delegate | Medium — different PE gates |
| Provider vs Search | Different purpose (curated vs query) | Low |
| Adapter vs tool | Adapter uses Search orchestration | Low when flag on — additive |

### Future consolidation candidates (not implemented)

1. Route `search_places` tool through adapter with `moduleId: 'place'` — closes triple path
2. Document PE parity before tool migration
3. Keep `place_discoveries` as Tier C summary provider

---

## 4. Discovery evidence review

### Module contribution (typical local discovery queries)

| Module | Contribution | Usefulness |
|--------|:------------:|------------|
| **Place** | High | Primary listing discovery |
| **Calendar** | Medium | Local events/workshops |
| **V_Link** | Low–Medium | Linked local entities |
| **Chat** | Low | Prior local conversations |
| **Drive** | Low | Saved local guides |
| **Todo** | Low | Local activity tasks |
| **Notes** | Low | Local notes |
| **Member** | Low | Business local context |
| **Dashboard** | Low | Workspace artifacts |

### Metrics

| Metric | Observation |
|--------|-------------|
| **retrievalSourceDiversity** | 1–4 modules typical; higher when query spans platform + place |
| **placeEvidenceCount** | Tracked in `discoveryProfile` |
| **Recommendation impact** | Adapter evidence supplements location + place provider — does not replace web_search |

---

## 5. Diagnostics

| Field | Location |
|-------|----------|
| `consumerDomain` | `'local_discovery'` |
| `retrievalSourceDiversity` | Diagnostics |
| `discoveryProfile` | Context patch |

```typescript
discoveryProfile: {
  domain: 'local_discovery';
  modulesContributing: string[];
  retrievalSourceDiversity: number;
  placeEvidenceCount: number;
  contextScope?: SearchContextScope;
  retrievalDurationMs: number;
  evidenceUtilization: { evidenceCount; providerCount };
}
```

---

## 6. SC-M4 impact (assessment only)

| Question | Answer |
|----------|--------|
| Material advance? | **Yes** — fifth consumer; first external-leaning discovery path via Search |
| Place triple path closed? | **No** — documented only |
| SC-M4 closed? | **No** |
| Recommendation | Council review with parallel-path register; do not self-certify Search |

---

**Last updated:** 2026-06-23
