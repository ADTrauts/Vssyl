# Knowledge Neighborhood Service

**Program:** Connected Knowledge Platform — Phase 1C  
**Date:** 2026-06-25  
**Status:** Shipped (feature-flagged)

**Authority:** [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md) · [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md)

---

## 1. Purpose

Establish **Knowledge Neighborhoods** as the platform's canonical **read model** for intelligent experiences.

> Compose once. Converge once. **Consume everywhere.**

The Neighborhood Service is the single entry point for retrieving neighborhoods — it does not duplicate composition or convergence logic.

---

## 2. Responsibilities

| Responsibility | Implementation |
|----------------|----------------|
| Retrieve neighborhoods | `retrieveNeighborhoods()` |
| Compose when required | Delegates to `orchestrateKnowledgeBundle()` |
| Cache appropriately | In-memory TTL cache (30s default) |
| Expose diagnostics | `buildNeighborhoodServiceDiagnostics()` |
| Bundle compatibility | Returns `bundles` + `sourceBundles` on neighborhoods |

---

## 3. Code location

| Component | Path |
|-----------|------|
| Service | `server/src/knowledge/knowledgeNeighborhoodService.ts` |
| Knowledge Card mapper | `server/src/knowledge/knowledgeCard.ts` |
| Project Assistant pilot | `server/src/knowledge/projectAssistantNeighborhoodConsumer.ts` |
| API handler | `server/src/controllers/contextGraphController.ts` → `postKnowledgeNeighborhoodHandler` |
| Pipeline patch | `server/src/ai/pipeline/pipelineGroundingRetrieval.ts` |
| AI assembly | `server/src/ai/context/AIContextAssembler.ts` |

---

## 4. API

### `POST /api/context-graph/knowledge/neighborhood`

Auth + tenant scope required.

**Response headers:**

- `X-Knowledge-Neighborhood-Contract-Version: 1.0`
- `X-Knowledge-Card-Contract-Version: 1.0`

**Response body:**

```json
{
  "success": true,
  "data": {
    "neighborhoods": [],
    "knowledgeCards": [],
    "bundles": [],
    "serviceDiagnostics": {},
    "operatorViews": [],
    "source": "orchestrated | pipeline_context | cache"
  }
}
```

---

## 5. Retrieval sources

| Source | When |
|--------|------|
| `pipeline_context` | Neighborhoods already on `graphBundlePipelineContext` |
| `cache` | TTL hit on prior read for same anchor + consumer |
| `orchestrated` | Full resolve → compose → converge via Context Graph |

---

## 6. Feature flags

Both required for neighborhood reads:

```bash
KNOWLEDGE_COMPOSITION_ENABLED=true
KNOWLEDGE_CONVERGENCE_ENABLED=true
```

---

## 7. Diagnostics

`serviceDiagnostics` includes:

| Field | Description |
|-------|-------------|
| `neighborhoodCount` | Number of neighborhoods returned |
| `neighborhoodSize` | Aggregate entities, relationships, facts |
| `compositionAgeMs` | Age of oldest source bundle composition |
| `knowledgeLevelDistribution` | L0–L6 tier histogram |
| `relationshipCount` | Total relationships |
| `factCount` | Total converged facts |
| `consumerCompatibility` | Per-neighborhood eligibility for consumer |
| `cacheHit` | Whether result came from cache |
| `bundlesRetained` | Bundle count for backward compatibility |

---

## 8. Cache policy

| Rule | Detail |
|------|--------|
| TTL | 30 seconds (in-process) |
| Key | `userId` + `consumer` + anchor identifier |
| Invalidation | TTL expiry; `clearNeighborhoodServiceCache()` for tests |
| Scope | Short-lived — not cross-request authoritative store |

Aligns with [KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md](./KNOWLEDGE_CONSUMPTION_ARCHITECTURE.md) §7.

---

## 9. Consumer integration

| Consumer | Phase 1C status |
|----------|-----------------|
| **Project Assistant** | ✅ Direct neighborhood consumption via Knowledge Cards |
| **Planning** | Neighborhoods on pipeline context; card mapping available |
| **Business Operations** | Same as planning |
| **API clients** | `POST /knowledge/neighborhood` |

---

## 10. References

- [KNOWLEDGE_CONSUMPTION_GUIDE.md](./KNOWLEDGE_CONSUMPTION_GUIDE.md)
- [CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md](./CONNECTED_KNOWLEDGE_PHASE_1C_CLOSEOUT.md)
