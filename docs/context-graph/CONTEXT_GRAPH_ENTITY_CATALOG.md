# Context Graph — Entity Catalog

**Program:** Context Graph Phase 0A  
**Date:** 2026-06-23  
**Status:** Canonical inventory for graph node candidates

---

## Identity contract

All graph-relevant entities resolve through **`(moduleId, entityType, entityId)`** per [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md). No universal entity table.

**Node key format:** `{moduleId}:{entityType}:{entityId}`

---

## Tier 0 — Platform anchors

| Entity | moduleId | entityType | Ownership | Lifecycle | Relationship potential |
|--------|----------|------------|-----------|-----------|------------------------|
| **User** | auth | user | Self | Account lifecycle | Membership edges to business, household, V_Link |
| **Business** | business | business | Owner user | Create/archive | Roster, dashboard, module scope |
| **Household** | household | household | Owner user | Create/archive | Member edges |
| **Dashboard** | dashboard | dashboard | User / business / household | Trash, restore | **Containment** anchor for modules |
| **V_Link** | vlink | vlink | `ownerUserId` | Archive, trash, nest | **Hub node** + attachment edges |

---

## Module entities (registered)

| Entity | moduleId | entityType | Ownership | Lifecycle | Relationship potential |
|--------|----------|------------|-----------|-----------|------------------------|
| **File** | drive | file | `userId` + share grants | Trash, permanent delete | V_Link, folder hierarchy, chat attachment |
| **Folder** | drive | folder | `userId` | Trash, tree delete | Parent/child, V_Link |
| **Conversation** | chat | conversation | Creator + participants | Trash | V_Link, messages, file refs |
| **Message** | chat | message | Sender | Thread containment | Lightweight node |
| **Event** | calendar | event | Calendar owner | Trash | V_Link, attendees, recurrence parent |
| **Task** | todo | task | `createdById` | Trash | Project, assignee, deps, V_Link |
| **Project** | todo | project | Creator | Archive | Task containment |
| **Page (notes)** | notes | page | Owner + share | Trash (`deletedAt` legacy) | V_Link partial, notebook refs |
| **Page (notebook)** | notebook | page | Notebook scope | Trash | NotebookLink refs |
| **Listing** | place | listing | Business/community | Trash | V_Link, follow, discovery |
| **Meeting** | place | meeting | Place scope | Trash | V_Link, participation |

---

## Derived / ephemeral entities

| Entity | Source | Persisted? | Graph role |
|--------|--------|------------|------------|
| **Activity** | `ModuleActivityEvent` | Yes (immutable) | Temporal edge evidence |
| **Notification** | Notification service | Yes | Delivery — not relationship SoR |
| **AIRetrievalEvidence** | Retrieval adapter | No | Ephemeral discovery node refs |
| **VLinkSuggestion** | AI / system | Yes (pending) | **Not** graph edge until accepted |
| **AISuggestion** | AI | Yes (pending) | Recommendation — not SoR |
| **Search hit** | Unified Search | No | Candidate node for hydration |

---

## Context Graph adapter coverage

Registered in `server/src/context-graph/adapterRegistry.ts`:

| Adapter | moduleId | supportedEntityTypes |
|---------|----------|---------------------|
| vlink | vlink | vlink |
| drive | drive | file, folder |
| calendar | calendar | event |
| todo | todo | task, project |
| notes | notes | page |
| notebook | notebook | page |
| chat | chat | conversation |
| place | place | listing, meeting |

**Gaps:** HR, scheduling, workforce, business roster as graph nodes (advisory from CG program).

---

## Entity classes (constitutional)

| Class | Graph treatment |
|-------|-----------------|
| Full platform entity | Primary **Entity** node category |
| Lightweight | Bounded inclusion (messages, widgets) |
| Not an entity | Excluded from graph projection |

---

## Ownership summary

| Scope | Scoping fields | Graph implication |
|-------|----------------|-------------------|
| Personal | `dashboardId`, `userId` | Traversal must PE-check dashboard |
| Business | `dashboardId`, `businessId` | Business membership ≠ entity access |
| Household | `dashboardId`, `householdId` | Household roster edges |

---

## Lifecycle states (projection)

| State | Meaning |
|-------|---------|
| `active` | Normal traversal |
| `trashed` | Visible in trash contexts only |
| `archived` | V_Link / project archive |
| `restricted` | PE denied — redacted node |

---

## References

- [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)
- [GRAPH_NODE_AND_EDGE_MODEL.md](../architecture/GRAPH_NODE_AND_EDGE_MODEL.md)
- `server/src/startup/registerPlatformEntities.ts`

**Last updated:** 2026-06-23
