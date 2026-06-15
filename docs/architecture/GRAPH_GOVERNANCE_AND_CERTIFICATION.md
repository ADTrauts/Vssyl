# Graph Governance and Certification

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph visualization constitutional architecture  
**Status:** Canonical governance  
**Date:** 2026-06-14  
**Adapter governance:** [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md)  
**Registry:** [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md)

> **Scope:** Certification, ownership, versioning, and drift prevention for graph providers and projections. **No** tooling implementation.

---

## Purpose

Graph features tempt teams to **persist layout as semantics**, **skip adapters**, or **store edges locally**. Governance ensures graph providers remain **projections of certified read adapters**.

---

## Graph provider ownership

| Surface | Owner | Registry kind |
|---------|-------|---------------|
| Place Main Street | Place module | `place.graph` (K7) |
| V_Link hub tree | Platform V_Link | `vlink.graph` (K7) |
| Notebook link rail | Notebook module | `notebook.graph` (K7) |
| Federated explorer (future) | Platform architecture | `platform.graph.explorer` (K7) |
| Admin diagnostic graph (future) | Platform admin | `admin.graph.diagnostic` (K7) |

**Accountability:** Graph provider owner certifies adapter delegation — not independent SoR.

---

## Certification requirements

Before a graph provider (K7) is **certified active**:

| # | Requirement | Evidence |
|---|-------------|----------|
| GV1 | Declares **surface type** (Place, V_Link, federated, …) | Contract doc |
| GV2 | **No graph DB** or universal edge table | Architecture review |
| GV3 | All nodes/edges from **registered adapters** K1–K4 | Registry links |
| GV4 | Respects **maxDepth, maxNodes, maxEdges** | Traversal model |
| GV5 | **Fail-closed** visibility — [GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md](./GRAPH_PERMISSION_AND_VISIBILITY_MODEL.md) | Test plan |
| GV6 | **provenance** on edges — sor vs suggestion | Node/edge model |
| GV7 | Tags as **overlays** — not edges | TAG_STRATEGY |
| GV8 | V_Link uses **resolver** — membership ≠ access | V_LINK.md |
| GV9 | AI supply obeys [AI_GRAPH_INTERACTION_MODEL.md](./AI_GRAPH_INTERACTION_MODEL.md) | AI review |
| GV10 | Layout preference distinguished from **Association** | Taxonomy |
| GV11 | Operation matrix / module audit row updated | Audit doc |
| GV12 | No writes except documented Preference fields | PR review |

### Federated explorer additional

| # | Requirement |
|---|-------------|
| GV13 | Parallel fan-out — no cross-module SQL join |
| GV14 | Taxonomy legend in UX spec |
| GV15 | Truncation metadata returned |

---

## Versioning

| Artifact | Version field |
|----------|---------------|
| Graph projection envelope | `projectionSchemaVersion` |
| Graph provider entry | `graphProviderVersion` |
| Adapter dependency | `permissionContractVersion` per adapter |

### Compatibility

| Change | Breaking? |
|--------|-----------|
| Add optional node field | No — minor |
| Remove node field | Yes |
| Tighten maxNodes | No — security |
| Loosen visibility | **Yes** — security review |
| New edge class styling | No — if adapter-backed |

---

## Deprecation

| Rule | Detail |
|------|--------|
| Graph provider ids immutable | Deprecate with successor |
| Removing surface | One release deprecated minimum |
| Legacy Place graph API | Must map to adapter-backed projection before removal |

---

## Drift prevention

| Drift risk | Guard |
|------------|-------|
| Graph-specific truth store | GV2 — CI lint (future) forbids GraphEdge models |
| Graph-only relationships | Edges must exist in adapter catalog SoR |
| Adapter bypass in UI | K7 must declare `adapterDependencies[]` |
| React Flow node ids ≠ entity ids | Map through canonical `nodeId` format |
| Stale projection cache as UX SoR | TTL + event invalidation required |
| Unified Place+V_Link without legend | GV14 — product review |

### Registry entry (K7 conceptual)

| Field | Purpose |
|-------|---------|
| `graphProviderId` | e.g. `vlink.graph` |
| `surface` | vlink_hub, place_main_street, federated_explorer |
| `adapterDependencies` | List of K1–K4 ids |
| `defaultMaxDepth` | From traversal model |
| `allowedRelationshipClasses` | Edge filter |
| `aiEligible` | boolean |
| `writesLayoutPreference` | boolean |

---

## Testing expectations (future)

| Theme | Assert |
|-------|--------|
| Denied user | Empty or member-only subgraph |
| V_Link restricted | Placeholder — no title |
| Depth cap | Truncation flag |
| Suggestion edges | Not solid; AI not fact |
| Cross-tenant anchor | Error / empty |
| Adapter timeout | Partial graph |

Contract tests: graph provider → mocks adapters — never Prisma in graph layer tests.

---

## Documentation obligations

| Change | Docs |
|--------|------|
| New graph surface | This phase docs + provider registry |
| New edge class in graph | Taxonomy + adapter catalog |
| AI graph block | AI_GRAPH_INTERACTION_MODEL + provider matrix |

---

## Certification levels

| Level | Meaning |
|-------|---------|
| **G0** | Ad hoc UI graph — undocumented |
| **G1** | Documented surface (Place, V_Link hub) |
| **G2** | GV1–GV12 certified |
| **G3** | G2 + contract tests + AI integration |

Phase 2D-2 sets **G1** baseline; new surfaces target **G2**.

---

## PR checklist

- [ ] No graph DB / universal edge table  
- [ ] Adapter dependencies listed  
- [ ] Traversal caps declared  
- [ ] Visibility fail-closed  
- [ ] Tags overlays not edges  
- [ ] AI provenance rules  
- [ ] Federation ADR still satisfied  

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md) | Program index |
| [SEARCH_ARCHITECTURE_DECISION_RECORD.md](./SEARCH_ARCHITECTURE_DECISION_RECORD.md) | No graph SoR ADR |

**Last updated:** 2026-06-14
