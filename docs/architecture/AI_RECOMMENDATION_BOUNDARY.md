# AI Recommendation Boundary

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-3 — Recommendation constitutional architecture  
**Status:** Canonical AI boundary  
**Date:** 2026-06-14  
**Retrieval:** [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md)  
**Automation:** [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md)  
**Graph:** [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md)

> **Scope:** How AI participates in relationship recommendations. **No** pipeline changes in this phase.

---

## Purpose

AI is a primary **surfacing** channel for recommendations — must remain **proposal-only** with clear boundaries from relationships, permissions, and graph projections.

---

## AI may

| Action | Constraint |
|--------|------------|
| **Surface recommendations** | AISuggestion, VLinkSuggestion cards — permission-filtered |
| **Explain recommendations** | reasonText from signal model — no hidden data quotes |
| **Draft V_Link suggestions** | Creates **pending** `VLinkSuggestion` — not `VLinkEntity` |
| **Draft NotebookLink / share / assign** | UI draft — user confirms module API |
| **Correlate domain events** | T2 automation tier — async |
| **Rank within candidate set** | Explainable bands — governance certified |
| **Use visible graph (depth 1)** | Dashed edges — supplemental |
| **Disclose inference** | "AI noticed…" — low confidence |

---

## AI may not

| Action | Why |
|--------|-----|
| Create relationships automatically | User authority |
| Accept own suggestions | Accept is user gesture |
| Bypass visibility for candidates | PE fail-closed |
| Infer hidden entity titles into reasonText | Privacy |
| Persist tag co-occurrence as V_Link | Semantic collapse |
| Write UserMemoryFact from recommendation alone | Memory SoR |
| Solid graph edges from inference | Graph provenance |
| Auto-run destructive follow-ups | Automation D2+ |
| Use embedding neighbors without adapter-visible candidates | ML governance |
| Ground twin on pending suggestions | Excluded from pipeline |

---

## Alignment with retrieval precedence

```
UserMemoryFact
  → Persisted V_Link (confirmed)
  → Module AI providers
  → Visible recommendations (proposal cards — NOT grounding facts)
  → Graph projection (explain)
  → Search hydrate
  → Event re-fetch signal
  → Inference (disclosed)
```

**Recommendations sit above inference but below confirmed V_Link for grounding truth.**

Pending recommendations **never** inject into `vlinkPipelineContextService`.

---

## V_Link suggestions (AI-specific)

| Stage | AI role |
|-------|---------|
| Create | `VLinkSuggestion` row — owner/editor review queue |
| Display | Hub suggestions tab |
| Accept | **User** or editor — `vlinkService.linkEntity` |
| Reject | User — no SoR edge |
| Grounding | **Excluded** until accepted |

Events: `vlink.suggestion.created` — diagnostic — not `relationship.vlink_attached`.

---

## Ambient AI suggestions

Reference: `ambientSuggestionService`, `SuggestionCorrelationService`, `AISuggestion`.

| Rule | Detail |
|------|--------|
| Async from domain events | Non-blocking |
| Frequency caps | Safety model |
| Accept path | Module-specific — may open dialog |
| Dismiss | Preference — reduce future signals |

---

## Graph + AI

| Allowed | Forbidden |
|---------|-----------|
| Summarize visible dashed + solid | Mutate graph to add solid edge |
| Suggest link between visible nodes | Deep graph mine for hidden nodes |
| Explain taxonomy on graph | Graph as SoR in prompt |

Per [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md).

---

## Automation overlap

| Tier | AI role |
|------|---------|
| T0–T1 | Observe events |
| T2 | Correlate → suggest |
| T3+ | **No** auto webhook from AI rank |
| T5 | AI excluded |

Per [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md).

---

## Explainability in AI copy

AI natural language must:

- Cite **signal family** in plain language  
- Not claim relationship exists before accept  
- Use "suggest", "consider", "you might want" — not "I linked"  

---

## Expansion process

New AI recommendation type requires:

1. Signal family in [RECOMMENDATION_SIGNAL_MODEL.md](./RECOMMENDATION_SIGNAL_MODEL.md)  
2. Permission rules in [RECOMMENDATION_PERMISSION_MODEL.md](./RECOMMENDATION_PERMISSION_MODEL.md)  
3. Lifecycle states in [RECOMMENDATION_LIFECYCLE_MODEL.md](./RECOMMENDATION_LIFECYCLE_MODEL.md)  
4. Governance certification in [RECOMMENDATION_GOVERNANCE.md](./RECOMMENDATION_GOVERNANCE.md)  
5. Update AI_CONTEXT_PROVIDER_MATRIX if provider-facing  

---

## Anti-patterns

| Anti-pattern | Correct |
|--------------|---------|
| Twin says "I shared the file" after suggest | "I can help you share…" |
| Auto-accept VLinkSuggestion on high confidence | User accept |
| Recommendation in grounding block as fact | Separate proposals section |
| Chat message → auto NotebookLink | Suggest only |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md](./RELATIONSHIP_RECOMMENDATION_ARCHITECTURE.md) | Ecosystem |
| [RECOMMENDATION_LIFECYCLE_MODEL.md](./RECOMMENDATION_LIFECYCLE_MODEL.md) | States |

**Last updated:** 2026-06-14
