# Knowledge Convergence Diagnostics

**Program:** Connected Knowledge Platform — Phase 1B  
**Date:** 2026-06-25  
**Status:** Implemented

---

## 1. Per-neighborhood diagnostics

```typescript
interface KnowledgeConvergenceDiagnostics {
  mergedFacts: number;
  duplicateFactsRemoved: number;
  corroboratedEdges: number;
  conflicts: ConflictRecord[];
  duplicateReduction: { nodes: number; edges: number; facts: number };
  knowledgeDensity: number;           // (edges + facts) / nodes
  tierCounts: Record<KnowledgeTier, number>;
  confidenceDistribution: Record<KnowledgeConfidence, number>;
  convergenceDurationMs: number;
}
```

---

## 2. Aggregate diagnostics

Returned on pipeline context as `knowledgeConvergenceDiagnostics`:

| Field | Description |
|-------|-------------|
| `neighborhoodsConverged` | Count of neighborhoods produced |
| `totalMergedFacts` | Facts merged across neighborhoods |
| `totalDuplicateFactsRemoved` | Duplicate fact rows eliminated |
| `totalCorroboratedEdges` | Edges deduped by conflict resolution |
| `convergenceDurationMs` | Wall-clock converge time |

---

## 3. Access paths

### API

`POST /api/context-graph/knowledge/neighborhood`

Response includes `operatorViews` with convergence diagnostics per neighborhood.

### Pipeline trace

```json
{
  "source": "knowledge_neighborhood",
  "provider": "knowledge_convergence_engine",
  "itemCount": 1
}
```

`graphBundlePipelineContext.knowledgeConvergenceDiagnostics` carries aggregate stats.

---

## 4. Operator checklist

| Signal | Healthy | Investigate |
|--------|---------|-------------|
| `duplicateFactsRemoved` | Low–moderate | High — noisy memory or retrieval |
| `conflicts` | Empty or L6→L2 expected | Unexpected L2↔L2 same key |
| `knowledgeDensity` | 0.5–3 typical | 0 — empty neighborhood |
| `mergedFacts` | Matches user memory usage | Spike without memory input |
| `convergenceDurationMs` | < 30ms | Adapter or large bundle |

---

## 5. References

- [KNOWLEDGE_CONVERGENCE_ENGINE.md](./KNOWLEDGE_CONVERGENCE_ENGINE.md)
- [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md)
