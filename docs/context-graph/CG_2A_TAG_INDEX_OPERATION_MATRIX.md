# CG-2A — Tag Index Operation Matrix

**Program:** Phase 2A — Tag Index Architecture & Runtime  
**Date:** 2026-06-19  
**Status:** **IMPLEMENTED**

---

## Operations

| ID | Operation | HTTP | Auth | Mutates tags? | Owner |
|----|-----------|------|------|---------------|-------|
| CG-TI-001 | Search by tag label | `GET /tags/search` | JWT | **No** | Tag index (read) |
| CG-TI-002 | Lookup by entity | `GET /tags/by-entity` | JWT | **No** | Tag index (read) |
| CG-TI-003 | Lookup by module | `GET /tags/by-module` | JWT | **No** | Tag index (read) |
| CG-TI-004 | Provider read (internal) | — | userId | **No** | Module via provider |
| CG-TI-005 | Bundle metadata.tags | via bundle resolve | JWT | **No** | Adapter enrichment |

---

## CG-TI-001 — Search by tag

| Field | Value |
|-------|-------|
| **Input** | `tag` or `q`, optional `dashboardId`, `businessId`, `householdId`, `limit` |
| **Process** | Parallel `searchByTagLabel` on all registered providers → merge dedupe |
| **Output** | `TagIndexSearchResult` with `descriptors[]` |
| **Budget** | Default 25, max 50 |
| **PE** | Each hit re-validated via module access service |

---

## CG-TI-002 — Lookup by entity

| Field | Value |
|-------|-------|
| **Input** | `moduleId`, `entityType`, `entityId` |
| **Process** | `getTagProviderForEntity` → `getTagsForEntity` |
| **Output** | `TagIndexEntityResult` |
| **PE** | Provider uses same path as V_Link access services |

---

## CG-TI-003 — Lookup by module

| Field | Value |
|-------|-------|
| **Input** | `moduleId`, tenant scope, `limit` |
| **Process** | Bounded scan of recent tagged entities → `getTagsForEntity` per entity |
| **Output** | `TagIndexModuleResult` |
| **Budget** | 30 entities scanned max |

---

## Explicitly prohibited operations

| Operation | Status |
|-----------|--------|
| Create tag | **NOT IMPLEMENTED** — module APIs only |
| Update tag | **NOT IMPLEMENTED** |
| Delete tag | **NOT IMPLEMENTED** |
| Tag as graph node | **NOT IMPLEMENTED** |
| Tag as edge | **NOT IMPLEMENTED** |
| Tag pipeline catalog source | **Deferred** — not CG-2A scope |
| Persistent index table | **NOT IMPLEMENTED** — derived read at query time |

---

## Provider registry

| Provider | Module | Entity types |
|----------|--------|--------------|
| `todoTagProvider` | todo | task |
| `notesTagProvider` | notes | note |
| `placeTagProvider` | place | place_list |

---

## Finding closure mapping

| Finding | Operation evidence |
|---------|-------------------|
| **CG-F-005** | CG-TI-001 through CG-TI-005 |

**Last updated:** 2026-06-19
