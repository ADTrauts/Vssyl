# Tag Strategy

**Program:** Vssyl Relationship Framework  
**Phase:** 2A — Tag constitutional architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Authority:** [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) §Tag, [RELATIONSHIP_FRAMEWORK_INDEX.md](./RELATIONSHIP_FRAMEWORK_INDEX.md)

> **Scope:** Defines what tagging **is** in Vssyl and how it differs from relationships, V_Link, operational links, AI memory, and generic metadata. **No** platform Tag Layer implementation, APIs, schema, UI, or search engine in this phase.

---

## Executive summary

**A tag is a module-owned, non-directional label** attached to an entity (or AI context row) for **filtering, faceting, and in-module organization**. Tags are **metadata**, not relationships.

| Concept | Role |
|---------|------|
| **Tag** | Label on one entity — "how we describe this item here" |
| **Relationship** | Typed connection between entities or principals — "how things connect" |
| **V_Link** | User-curated **Association** container across modules — "this set belongs together for context" |
| **Operational link** | Module junction with workflow semantics — "this page spawns this task" |
| **AI memory** | Semantic fact or instruction for the twin — "what the AI should remember" |

**Phase 2A decision:** Tags remain **module-local** in storage. A future **Tag Index** (read-only federation layer) may mirror module tags for cross-module discovery — documented in [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md), not implemented here.

---

## What a tag is

### Definition

A **tag** is a user- or admin-assigned **string label** (or bounded vocabulary within a module) stored **on or with a single host record**, used to:

- Filter lists and boards within a module  
- Facet module-scoped search  
- Group UI views (e.g. task filters, note lists)  
- Support discovery facets where the module owns public catalog semantics (Place listings)

### Properties (constitutional)

| Property | Rule |
|----------|------|
| **Cardinality** | Zero to many tags per host entity |
| **Direction** | None — tags do not point at other entities |
| **Identity** | String equality within module scope (case policy = module-defined) |
| **Tenancy** | Inherits host entity tenant scope (`dashboardId`, `businessId`, …) |
| **Mutability** | Replace-on-write array or normalized tag assignment — module-owned |
| **Semantics** | Soft — no enforced ontology in v1 |

### Current platform examples (implementation reference only)

| Host | Field | Module |
|------|-------|--------|
| Task | `tags String[]` | todo |
| Note / page | `tags String[]` | notes |
| Business place listing | `tags String[]` | place |
| Place community | `tags String[]` | place |
| User AI context row | `tags String[]` | ai |
| Marketplace module record | `tags String[]` | business (modules) |
| Support KB articles | `tags String[]` | admin |

These are **examples of valid module-local tagging** — not a mandate for every module.

---

## What a tag is not

| Misclassification | Why it is not a tag | Correct class |
|-------------------|---------------------|---------------|
| V_Link membership | Grants container access (not label) | Membership |
| File share | Grants content access | Access grant |
| Task assignment | Delegates responsibility | Assignment |
| TaskFileLink | Connects two entities | Association / Reference |
| NotebookLink | Operational work edge | Association / Reference |
| UserMemoryFact | Semantic AI grounding | AI context |
| `Task.category` (single enum-like string) | Structured field, not multi-label facet | **Metadata** (module field — not Tag class unless exposed as tags[]) |
| `File.starred` | Boolean preference | Preference |
| `PlaceNode` graph edge | Layout / social graph | Preference / Association |
| Folder name | Hierarchy containment | Containment / Hierarchy |
| Event `location` string | Entity attribute | Metadata |
| Pipeline intent `category` | Admin catalog taxonomy | Platform config — not user tag |
| Hashtag in chat message body | Content, not indexed tag field | Communication content |

**Rule:** If the mechanism connects two records, grants access, or grounds AI as a **fact**, it is **not** a tag.

---

## Ownership model

### System of record

| Layer | Owner | Storage |
|-------|-------|---------|
| **Tag assignment (v1)** | **Module** that owns the host entity | Host row `tags[]` or module tag junction (module choice) |
| **Tag vocabulary** | Module product rules | No platform registry in v1 |
| **Cross-module tag identity** | **None in v1** | No global `Tag.id` |
| **Future tag index (read mirror)** | Platform search federation | Derived — not SoR |

Aligns with [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md): tags are **not** relationship SoR.

### Who may write tags

| Actor | Rule |
|-------|------|
| Entity owner / editor | May set tags on entities they can update (module PE) |
| Business admin | May set listing tags on Place storefront (business scope) |
| AI | **May suggest** tag strings — user confirms on entity update (no silent tag writes unless module AI action explicitly allows) |
| Platform | Does not assign user content tags in v1 |

### Module vs platform

```
Module owns: tag strings on module entities
Platform owns: (future) read index, facet API contract, governance docs
Platform does NOT own: tag mutation on module rows (except admin/support domains)
```

---

## Lifecycle

Tags follow **host entity lifecycle** per [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md) §Tag.

| Event | Tag behavior |
|-------|--------------|
| **Create entity** | Tags optional on create |
| **Update entity** | Tags replaced or merged per module API |
| **Archive** (NotebookLink, V_Link) | N/A — tags on entities unchanged |
| **Trash entity** | Tags trash **with** entity (same row) |
| **Restore entity** | Tags restore with entity |
| **Permanent delete** | Tags destroyed with entity row |
| **Rename tag string** | Module updates all hosts or orphan old string — module policy |

Tags have **no independent trash, archive, or audit row** in v1. Tag history may appear in entity update activity only.

---

## Visibility

| Surface | Visibility rule |
|---------|-----------------|
| Module UI lists | Visible if user can read host entity |
| Module search | Facet only hits entities user can already search |
| Cross-module search (future) | Only via federated index with same PE gate on host |
| AI twin | Only if module provider exports tags in visibility-scoped payload |
| Public Place discovery | Listing tags visible when listing published + explore rules |
| Other users' personal task tags | **Hidden** — tenant + entity scope |

Tags never **expand** visibility beyond the host entity's permission model.

---

## Permissions

| Action | Policy |
|--------|--------|
| Read tags | Same as read host entity |
| Write tags | Same as update host entity (or stricter module rule) |
| Tag as access control | **Forbidden** — use shares, membership, PE |
| Tag revealing cross-tenant data | **Forbidden** |
| Admin/support tags | Admin module scope only |

Tags do not appear in Policy Engine as a separate resource type in v1. PE evaluates **host entity** update/read.

---

## Inheritance

| Scenario | Inheritance rule |
|----------|----------------|
| File in folder | Tags do **not** inherit from folder — file tags independent |
| Task subtask | **Module default:** subtask tags independent unless product copies parent |
| Note in folder | Independent unless module implements folder-default tags (not required) |
| Business listing vs Business record | Listing tags independent from org metadata |
| V_Link container | V_Link has **no entity tags** in v1 — linked entities keep their own tags |
| AI UserAIContext | Tags on context row only — not inherited from scoped entity |

**Constitutional default:** **No automatic tag inheritance** unless a module documents explicit UX (e.g. "inherit project tag on subtask create").

---

## Anti-patterns

| Anti-pattern | Why forbidden | Use instead |
|--------------|---------------|-------------|
| Global `tags` table with cross-module assignments | God object; breaks ownership | Module-local + future read index |
| Tags instead of V_Link for cross-module grouping | No membership model, wrong semantics | V_Link Association |
| Tags instead of file share | No access grant | FilePermission |
| Tags instead of task assignment | No assignee semantics | `assignedToId` |
| Tags as ACL ("#confidential" grants access) | Security bypass | PE + shares |
| Same tag string = same entity globally | False equivalence | V_Link or explicit link |
| AI persists inferred tags as facts without user confirm | Grounding pollution | UserMemoryFact with promotion flow |
| Duplicating listing tags into UserMemoryFact | Redundant SoR | Place provider at query time |
| Chat hashtags without index contract | Unbounded content scrape | Explicit message metadata if product requires |
| Platform-normalized ontology forced on all modules | Product mismatch | Module vocab + optional Place discovery facets |

---

## Relationship to other metadata

| Mechanism | Tag? | Notes |
|-----------|------|-------|
| `Task.category` | No — single structured metadata field | May coexist with tags[] |
| `UserMemoryFact.category` | No — AI taxonomy enum | Distinct from UserAIContext.tags |
| Calendar color / calendar name | No | Presentation + containment |
| Drive `type` MIME | No | System metadata |
| Place `PlaceInterest.category` | No — interest preference | Not entity tag |
| Analytics widget `tags Json` | No — internal BI metadata | Partner/module analytics boundary |

When in doubt: **multi-value user labels for filter** → Tag class; **single structured field or system field** → metadata.

---

## Future platform Tag Layer (not Phase 2A)

Documented for alignment only — **do not implement** without Phase 2B+ gate:

- Read-only **Tag Index** fed by module events or ETL  
- Normalized facet API for global search  
- Optional namespace prefix (`todo:urgent`) — governance TBD  
- No write path except through module SoR  

See [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [TAG_OWNERSHIP_AND_SCOPE_MATRIX.md](./TAG_OWNERSHIP_AND_SCOPE_MATRIX.md) | Per-module allow/recommend/forbid |
| [TAG_RELATIONSHIP_BOUNDARY_REVIEW.md](./TAG_RELATIONSHIP_BOUNDARY_REVIEW.md) | Tag vs V_Link vs links |
| [TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md](./TAG_SEARCH_AND_DISCOVERY_GUIDELINES.md) | Federation + AI + search |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | Read patterns |

**Last updated:** 2026-06-14
