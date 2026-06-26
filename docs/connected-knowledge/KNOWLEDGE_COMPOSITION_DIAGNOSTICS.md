# Knowledge Composition Diagnostics

**Program:** Connected Knowledge Platform — Phase 1A  
**Date:** 2026-06-25  
**Status:** Implemented

---

## 1. Purpose

Expose **operator-visible diagnostics** for Knowledge Bundle composition — sources, tiers, confidence, provenance completeness, eligibility, size, and duration.

---

## 2. Per-bundle diagnostics

```typescript
interface KnowledgeBundleDiagnostics {
  compositionSources: Array<{
    system: string;
    adapterId?: string;
    recordsRead: number;
    recordsUsed: number;
  }>;
  tierCounts: Record<KnowledgeTier, number>;
  confidenceDistribution: Record<KnowledgeConfidence, number>;
  provenanceSummary: {
    origins: Record<string, number>;
    completeEdges: number;
    incompleteEdges: number;
  };
  consumerEligibilitySummary: Record<string, number>;
  bundleSize: { nodes: number; edges: number; facts: number };
  compositionDurationMs: number;
  conflicts: ConflictRecord[];
  omittedUnauthorized: number;
}
```

---

## 3. Aggregate diagnostics

Returned when composing multiple bundles (pipeline or batch API):

| Field | Description |
|-------|-------------|
| `bundlesComposed` | Count of KnowledgeBundles produced |
| `totalNodes` / `totalEdges` / `totalFacts` | Element counts |
| `tierCounts` | Histogram L0–L6 |
| `confidenceDistribution` | Histogram C1–C4 |
| `compositionSources` | Merged adapter/source read counts |
| `compositionDurationMs` | Wall-clock compose time |
| `consumer` | Target consumer id |

---

## 4. Access paths

### API

`POST /api/context-graph/knowledge/diagnostics`

Body:

```json
{
  "consumer": "project_assistant",
  "contextBundles": [ /* ContextBundleDescriptor[] */ ]
}
```

### Pipeline trace

When `KNOWLEDGE_COMPOSITION_ENABLED=true`, pipeline grounding adds:

```json
{
  "source": "knowledge_bundle",
  "provider": "knowledge_composition_engine",
  "itemCount": 1
}
```

`graphBundlePipelineContext.knowledgeCompositionDiagnostics` carries aggregate stats.

---

## 5. Operator checklist

| Signal | Healthy | Investigate |
|--------|---------|-------------|
| `incompleteEdges > 0` | 0 | Provenance mapping gap |
| `omittedUnauthorized` | Low | PE or membership issue |
| `tierCounts.L6` high | Expected for retrieval-heavy intents | Unexpected for hub-only queries |
| `compositionDurationMs` | < 50ms typical | Adapter latency or budget overflow |
| `conflicts` | Empty or documented | Tier precedence violation |

---

## 6. References

- [KNOWLEDGE_COMPOSITION_ENGINE.md](./KNOWLEDGE_COMPOSITION_ENGINE.md)
- [KNOWLEDGE_BUNDLE_STANDARD.md](./KNOWLEDGE_BUNDLE_STANDARD.md)
