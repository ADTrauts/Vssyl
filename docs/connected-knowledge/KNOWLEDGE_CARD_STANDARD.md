# Knowledge Card Standard

**Program:** Connected Knowledge Platform — Phase 1C  
**Date:** 2026-06-25  
**Status:** Canonical presentation contract v1.0

**Authority:** [KNOWLEDGE_NEIGHBORHOOD_STANDARD.md](./KNOWLEDGE_NEIGHBORHOOD_STANDARD.md)

---

## 1. Purpose

Define the **canonical presentation contract** for rendering a Knowledge Neighborhood in any UI or AI consumer.

This is **not** a UI redesign. It is a portable read model that prevents duplicate knowledge assembly at render time.

---

## 2. KnowledgeCard

```typescript
interface KnowledgeCard {
  cardId: string;                    // kc-{neighborhoodId}
  version: '1.0';
  neighborhoodId: string;
  convergedAt: string;
  summary: KnowledgeNeighborhoodSummary;
  anchor: KnowledgeCardAnchor;
  entities: KnowledgeNode[];
  relationships: KnowledgeCardRelationship[];
  facts: KnowledgeCardFact[];
  activity: KnowledgeNeighborhoodActivity;
  history: KnowledgeNeighborhoodHistory;
  knowledgeLevels: KnowledgeCardKnowledgeLevels;
  provenance: KnowledgeNeighborhoodProvenanceSummary;
  suggestedRelationships: KnowledgeCardSuggestedRelationship[];
  diagnostics: KnowledgeCardDiagnostics;
}
```

---

## 3. Required sections

| Section | Content |
|---------|---------|
| **summary** | Human-readable neighborhood summary |
| **anchor** | Anchor entity title, type, trust tier |
| **entities** | Consumer-filtered entity nodes |
| **relationships** | Conflict-resolved edges with provenance + confidence |
| **facts** | Converged facts with corroboration metadata |
| **activity** | Recent action counts |
| **history** | Verification event aggregation |
| **knowledgeLevels** | Tier + confidence distribution |
| **provenance** | Origin + tier histogram |
| **suggestedRelationships** | L5 / suggestion_pending / superseded conflicts (not authoritative) |
| **diagnostics** | Size, age, density, consumer compatibility |

---

## 4. Suggested relationships

Suggested relationships are **explicitly separated** from authoritative neighborhood relationships:

| Reason | Source |
|--------|--------|
| `suggestion_pending` | V_Link suggestion queue |
| `l5_governance` | L5 tier edges in source bundles |
| `superseded_conflict` | Conflict losers from bundle diagnostics |

Project Assistant and AI consumers must **not** state suggested relationships as confirmed facts.

---

## 5. Consumer filtering

`toKnowledgeCard(neighborhood, { consumer })` applies tier eligibility from `consumerEligibility.ts`:

- L5 excluded for AI consumers (except governance surfaces)
- L4/L6 may require disclosure in downstream prompts

---

## 6. Mapping

```typescript
import { toKnowledgeCard, toKnowledgeCards } from 'server/src/knowledge/knowledgeCard';

const card = toKnowledgeCard(neighborhood, { consumer: 'project_assistant' });
```

No re-composition. No manual graph bundle reconstruction.

---

## 7. Validation

| Rule | Check |
|------|-------|
| KC-1 | `cardId` starts with `kc-` |
| KC-2 | `version === '1.0'` |
| KC-3 | `summary` counts align with filtered entities/relationships/facts |
| KC-4 | `anchor.nodeKey === neighborhood.anchorNodeKey` |
| KC-5 | Suggested relationships not duplicated in `relationships` |

---

## 8. References

- [KNOWLEDGE_NEIGHBORHOOD_SERVICE.md](./KNOWLEDGE_NEIGHBORHOOD_SERVICE.md)
- [KNOWLEDGE_CONSUMPTION_GUIDE.md](./KNOWLEDGE_CONSUMPTION_GUIDE.md)
