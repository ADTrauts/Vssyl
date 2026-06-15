# AI Relationship Analytics Boundary

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-4 — Relationship analytics constitutional architecture  
**Status:** Canonical AI boundary  
**Date:** 2026-06-14  
**Retrieval:** [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md)  
**Graph:** [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md)  
**Recommendations:** [AI_RECOMMENDATION_BOUNDARY.md](./AI_RECOMMENDATION_BOUNDARY.md)

> **Scope:** How AI uses relationship **analytics** — not relationship SoR.

---

## Core principle

**Analytics informs narrative; adapters and SoR inform truth.**

AI may describe trends from metrics; AI may **not** treat rollup rows as permission to access entities or as substitutes for confirmed relationships.

---

## AI may

| Action | Constraint |
|--------|------------|
| **Summarize trends** | "Shares increased 20% this month" — tenant scoped |
| **Explain metrics** | With confidence band + derivation type |
| **Identify patterns** | Fragmented V_Links, inactive containers — heuristic |
| **Suggest actions** | Via recommendation flow — not auto-exec |
| **Compare periods** | Event-derived metrics preferred |
| **Admin diagnostic narrative** | ADMIN role — audit logged |

---

## AI may not

| Action | Why |
|--------|-----|
| Treat analytics as relationship truth | SoR is module/platform tables |
| Create relationships from metrics | e.g. "high co-occurrence → auto link" |
| Infer hidden relationships | Fail-closed |
| Ground twin on warehouse row without adapter re-fetch | Stale / over-broad |
| Persist metric insight as UserMemoryFact without user confirm | Memory SoR |
| Use graph density alone to assert link exists | Projection ≠ SoR |
| Bypass PE via "analytics says you have access" | AP2 |
| Quote other users' private metric detail | Tenant isolation |

---

## Federation ordering (analytics placement)

```
1. UserMemoryFact
2. Persisted V_Link (resolver)
3. Module AI context providers
4. Operational links (Pattern C)
5. Recommendations (proposals)
6. Graph projection (explain)
7. Search hydrate
8. Analytics summaries (trends — narrative layer)
9. Domain event re-fetch signal
10. Inference (disclosed)
```

**Analytics at layer 8** — below confirmed relationships and proposals for **grounding**; may appear in **insights** blocks with disclaimer.

---

## Block format (conceptual)

AI context block for analytics:

```
## Relationship insights (derived metrics — not authoritative)
- derivation: event | snapshot | health_interpreter
- confidence: high | medium | low
- tenantScope: ...
- [bullets]
```

Twin must not cite analytics as proof of specific entity content.

---

## Interaction with recommendations

| Scenario | Rule |
|----------|------|
| Low V_Link utilization → suggest attach | Recommendation flow |
| High reject rate → tune rules | Admin/ML governance — Phase 3 |
| Health Inactive → suggest archive | User confirm — not auto |

Per [AI_RECOMMENDATION_BOUNDARY.md](./AI_RECOMMENDATION_BOUNDARY.md).

---

## Interaction with graph

| Scenario | Rule |
|----------|------|
| Fragmented + low graph density | Narrative only |
| AI draws graph from metrics | **Forbidden** — use adapter projection |
| Summarize visible graph | Per [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) |

---

## Health labels in AI

| Allowed | Forbidden |
|---------|-----------|
| "Some links may be orphaned" | "File X is orphaned" if file hidden |
| Suggest cleanup | Auto unlink |

Per [RELATIONSHIP_HEALTH_MODEL.md](./RELATIONSHIP_HEALTH_MODEL.md).

---

## Admin vs user twin

| Role | Analytics breadth |
|------|---------------------|
| User | Own/workspace aggregates |
| Business ADMIN | Business aggregates — k-anonymity |
| Platform admin | Cross-tenant PII-minimized — diagnostic mode |

---

## Anti-patterns

| Anti-pattern | Correct |
|--------------|---------|
| "Analytics shows you share 5 files with Jane" with filenames | Count only if visible via adapter |
| Auto V_Link from utilization metric | Suggest |
| Warehouse embedding search for relationships | Phase 3 charter — not grounding |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_ANALYTICS_MODEL.md](./RELATIONSHIP_ANALYTICS_MODEL.md) | Derivation |
| [ANALYTICS_PERMISSION_MODEL.md](./ANALYTICS_PERMISSION_MODEL.md) | Visibility |

**Last updated:** 2026-06-14
