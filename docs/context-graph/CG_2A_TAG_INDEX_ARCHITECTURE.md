# CG-2A — Tag Index Architecture

**Program:** Phase 2A — Tag Index Architecture & Runtime  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED**

---

## Purpose

Close **CG-F-005** by implementing a **read-only federated tag index** per Context Graph charter (RD-CG-004): tags are **metadata on module entities**, not graph nodes, edges, or V_Links.

---

## Constitutional model

```
┌─────────────────────────────────────────────────────────┐
│  Module SoR (Task.tags, Note.tags, Listing.tags)        │
│  — modules OWN tag assignment                           │
└───────────────────────────┬─────────────────────────────┘
                            │ read-only
┌───────────────────────────▼─────────────────────────────┐
│  ContextGraphTagProvider (per module)                     │
│  — PE-gated tag reads; no writes                          │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  tagIndexService (federated read aggregation)           │
│  — lookup by tag / entity / module                        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  HTTP: GET /api/context-graph/tags/*                      │
│  Bundle nodes: metadata.tags (not separate nodes)       │
└─────────────────────────────────────────────────────────┘
```

---

## What tags are NOT

| Misclassification | Rule |
|-------------------|------|
| Graph nodes | **Prohibited** — no tag vertices in bundles |
| Graph edges | **Prohibited** — tag collision ≠ relationship |
| V_Links | **Unchanged** — association containers separate |
| Platform SoR | **Prohibited** — Context Graph never writes tags |
| Synthetic entities | **Prohibited** — descriptors reference real module entities |

---

## Tag descriptor contract

Canonical `TagDescriptor` (`tagDescriptorTypes.ts`):

| Field | Description |
|-------|-------------|
| `tagId` | Deterministic federated id `{module}:{type}:{id}:{label}` |
| `tagLabel` | Normalized lowercase label |
| `sourceModule` | Owning module id |
| `sourceEntityType` | Host entity type |
| `sourceEntityId` | Host entity id |

**No standalone tag table.** `tagId` is an index key, not SoR identity.

---

## Tag providers (Phase 2A)

| Module | Entity types | SoR field |
|--------|--------------|-----------|
| `todo` | `task` | `Task.tags` |
| `notes` | `note` | `Note.tags` |
| `place` | `place_list` | `BusinessPlaceListing.tags` |

Additional modules register via `ContextGraphTagProvider` without schema migration.

---

## Adapter integration

Tag-capable adapters enrich `ContextGraphNode.metadata.tags` via `enrichNodeMetadataWithTags()` — **metadata array only**, never bundle nodes or edges.

---

## API surface

| Route | Purpose |
|-------|---------|
| `GET /api/context-graph/tags/search?tag=` | Cross-module lookup by label |
| `GET /api/context-graph/tags/by-entity?moduleId&entityType&entityId` | Tags on one entity |
| `GET /api/context-graph/tags/by-module?moduleId` | Module facet rollup (bounded scan) |

Header: `X-Context-Graph-Tag-Index-Version: 1.0`

---

## Related

- [CG_2A_TAG_INDEX_OPERATION_MATRIX.md](./CG_2A_TAG_INDEX_OPERATION_MATRIX.md)
- [CG_2A_TAG_INDEX_SECURITY_MODEL.md](./CG_2A_TAG_INDEX_SECURITY_MODEL.md)
- [docs/architecture/TAG_STRATEGY.md](../architecture/TAG_STRATEGY.md)

**Last updated:** 2026-06-19
