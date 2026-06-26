# Knowledge Neighborhood Standard

**Program:** Connected Knowledge Platform — Phase 1B (updated Phase 1C)  
**Date:** 2026-06-25  
**Status:** Canonical contract v1.0 — **Neighborhood Service read path active**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [KNOWLEDGE_BUNDLE_STANDARD.md](./KNOWLEDGE_BUNDLE_STANDARD.md)

---

## 1. Purpose

Define the **canonical grouped knowledge object** — a coherent understanding organized around an anchor entity.

> Knowledge Bundles describe evidence. Knowledge Neighborhoods describe understanding.

---

## 2. KnowledgeNeighborhood

```typescript
interface KnowledgeNeighborhood {
  neighborhoodId: string;              // kn-{bundleId}
  version: '1.0';
  convergedAt: string;
  anchor: RootRef;
  anchorNodeKey: string;
  neighborhoodType: KnowledgeNeighborhoodType;
  consumer: KnowledgeConsumerId;
  entities: KnowledgeNode[];
  relationships: KnowledgeEdge[];
  facts: ConvergedFact[];
  activity: KnowledgeNeighborhoodActivity;
  history: KnowledgeNeighborhoodHistory;
  summary: KnowledgeNeighborhoodSummary;
  provenanceSummary: KnowledgeNeighborhoodProvenanceSummary;
  consumerEligibility: ConsumerEligibility[];
  sourceBundles: KnowledgeBundle[];    // backward compatible
  diagnostics: KnowledgeConvergenceDiagnostics;
  trustTier: KnowledgeTier;
}
```

---

## 3. Neighborhood types

| Type | Anchor signal |
|------|---------------|
| `project` | V_Link container |
| `person` | `hr:employee_profile` |
| `business` | `business:business` |
| `place` | `place:listing` \| `place:meeting` |
| `asset` | `drive:file` |
| `customer` | Reserved — partner delegate Phase 2 |
| `entity` | Default for other module entities |

---

## 4. ConvergedFact

Extends `KnowledgeFact`:

| Field | Purpose |
|-------|---------|
| `corroborationCount` | Number of merged duplicate assertions |
| `mergedFromFactIds` | All source fact ids |
| `confidenceHistory` | C1–C4 values from merged sources |

---

## 5. Neighborhood contents

| Section | Source |
|---------|--------|
| **entities** | Deduped nodes from bundle |
| **relationships** | Conflict-resolved edges |
| **facts** | Merged memory + composed facts |
| **activity** | Context bundle stats (Phase 1B); kernel activity Phase 2 |
| **history** | Verification event aggregation |
| **summary** | Human-readable density summary |
| **provenanceSummary** | Origin + tier histogram |

---

## 6. Consumer eligibility

Same tier matrix as bundles. Neighborhood `trustTier` is the highest-authority tier present.

Pilot consumers receive full neighborhoods when `KNOWLEDGE_CONVERGENCE_ENABLED=true`.

---

## 7. Backward compatibility

| Consumer | Receives |
|----------|----------|
| Unmigrated | `sourceBundles[].contextBundle` |
| Phase 1A | `knowledgeBundles` on pipeline context |
| Phase 1B pilot | `knowledgeNeighborhoods` (+ bundles retained) |
| **Phase 1C** | **Knowledge Cards** via Neighborhood Service |

**Read entry point (Phase 1C):** `retrieveNeighborhoods()` in `knowledgeNeighborhoodService.ts` — see [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md).

**Presentation contract:** [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md).

---

## 8. Validation

Neighborhoods inherit bundle validation (KB-1–KB-5) via `sourceBundles`. Additional checks:

| Rule | Check |
|------|-------|
| KN-1 | `sourceBundles.length >= 1` |
| KN-2 | No L5 in relationships or facts |
| KN-3 | `summary` matches entity/edge/fact counts |
| KN-4 | `anchorNodeKey` matches anchor descriptor |

---

## 9. References

- [KNOWLEDGE_CONVERGENCE_ENGINE.md](./KNOWLEDGE_CONVERGENCE_ENGINE.md)
- [KNOWLEDGE_CONVERGENCE_DIAGNOSTICS.md](./KNOWLEDGE_CONVERGENCE_DIAGNOSTICS.md)
- [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md)
- [KNOWLEDGE_CARD_STANDARD.md](./KNOWLEDGE_CARD_STANDARD.md)
