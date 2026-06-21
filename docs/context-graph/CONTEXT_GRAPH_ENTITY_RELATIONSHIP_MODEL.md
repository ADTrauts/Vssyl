# Context Graph — Entity and Relationship Model

**Program:** Vssyl Context Graph Architecture  
**Phase:** 0A — Discovery  
**Date:** 2026-06-18  
**Status:** Constitutional architecture proposal — no schema

---

## Canonical model (recommended)

**Federated Context Graph** — module entities are nodes; V_Link is a typed association substrate; edges are classed per [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md).

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT GRAPH (logical)                   │
├─────────────────────────────────────────────────────────────┤
│  NODES                                                       │
│    EntityNode     = (moduleId, entityType, entityId)        │
│    ContainerNode  = vlink:{id}  [optional graph projection] │
├─────────────────────────────────────────────────────────────┤
│  EDGES (typed, multi-SoR)                                    │
│    VLinkEntity           Association (container → entity)    │
│    VLink nesting         Hierarchy (parent → child vlink)    │
│    NotebookLink          Operational association             │
│    TaskFileLink, etc.    Module operational                │
│    FilePermission        Access grant                      │
│    EmployeePosition      Hierarchy (business)                │
│    ManagerApprovalHierarchy  Hierarchy (approval)            │
│    UserMemoryFact        AI context (adjacent, not edge)     │
└─────────────────────────────────────────────────────────────┘
```

**No universal `ContextNode` table.** Node identity is the **platform entity descriptor contract**.

---

## Node types

### 1. Module entity nodes (primary)

| Descriptor | Example | SoR |
|------------|---------|-----|
| `drive:file:{id}` | Receipt PDF | `File` |
| `drive:folder:{id}` | Tax folder | `Folder` |
| `calendar:event:{id}` | QBR meeting | `Event` |
| `chat:conversation:{id}` | Project channel | `Conversation` |
| `todo:task:{id}` | Filing task | `Task` |
| `notes:page:{id}` | Meeting notes | `Note` |
| `place:listing:{id}` | Vendor listing | Place models |
| `hr:employee_profile:{id}` | Employee record | HR models |
| `business:position:{id}` | Job position | Org chart |

**Registration:** `registerPlatformEntities.ts` + manifest `entities[]`.

### 2. Container nodes (secondary)

| Descriptor | Example | SoR |
|------------|---------|-----|
| `vlink:{id}` | "2024 Tax Project" | `VLink` |

Container nodes participate in graph projection for:

- Nesting (`parentVLinkId`)
- Membership (`VLinkMember`)
- Attachment listing (`VLinkEntity`)

### 3. Lightweight nodes (bounded hydrate)

| Descriptor | Policy |
|------------|--------|
| `chat:message:{id}` | 1-hop only; no graph crawl |
| `todo:comment:{id}` | Parent task anchor |

### 4. Explicit non-nodes

| Artifact | Why not a graph node |
|----------|---------------------|
| Tags (`tags[]`) | Metadata on host node — not directed |
| `UserMemoryFact` | AI semantic memory — adjacent layer |
| Notifications | Delivery artifact — not relationship SoR |
| Pipeline trace records | Diagnostic — not user graph |

---

## Edge types

| Edge | Storage | Direction | Grants access? |
|------|---------|-----------|----------------|
| **VLinkEntity** | `vlink_entities` | Container → Entity | **No** |
| **VLink nest** | `v_links.parentVLinkId` | Parent → Child container | No |
| **VLinkMember** | `vlink_members` | Container → User | Container only |
| **NotebookLink** | `notebook_links` | Source → Target | No |
| **TaskDependency** | `task_dependencies` | Task → Task | No |
| **TaskFileLink** | `task_file_links` | Task → File | No |
| **FilePermission** | `file_permissions` | File → User | **Yes** |
| **EmployeePosition** | `employee_positions` | User → Position | Role-based |
| **ManagerApprovalHierarchy** | `manager_approval_hierarchies` | Employee → Manager | Workflow routing |

---

## Canonical object decision

| Option | Decision |
|--------|----------|
| A — V_Link is the graph node | **Rejected** |
| B — V_Link is only an edge | **Rejected** |
| C — ContextNode + V_Link relationship | **Accepted (federated)** |

### Implementation mapping for Option C

| Concept | Implementation (no new table) |
|---------|------------------------------|
| ContextNode | `PlatformEntityDescriptor` + hydrate adapter |
| ContextEdge | Existing relationship stores by class |
| V_Link role | Primary **cross-module Association** registry |
| Graph projection | Read orchestrator composes DTOs |

---

## Identity and aliasing

Normalize legacy aliases per [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md):

| VLinkEntityType | Canonical key |
|-----------------|---------------|
| FILE | `drive:file` |
| FOLDER | `drive:folder` |
| CALENDAR_EVENT | `calendar:event` |
| CHAT_CONVERSATION | `chat:conversation` |
| TASK / TODO | `todo:task` |
| NOTE | `notes:page` or `notebook:page` |

---

## Traversal rules (inherited)

From [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](../architecture/GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md):

| Rule | Value |
|------|-------|
| Default user depth | 1-hop |
| Max user depth | 2-hop (surface-specific) |
| V_Link attach-of-attach | **Forbidden** |
| AI graph summary depth | 1-hop |
| Hydrate batch size | 25 refs |

---

## Context bundle mapping

A **context bundle** is a logical composition — not necessarily a new entity:

| v1 proto-bundle | v2 formal bundle |
|-----------------|------------------|
| `VLink` container + attachments | `ContextBundle` descriptor referencing vlink id + hydrate policy |
| AI pipeline vlink items | Bundle slice for twin |
| Notebook page + links | Operational bundle |

**Recommendation:** Formalize bundle contract in Phase 0B without new Prisma models.

---

## Tags in the entity model

Tags attach to **entity nodes** as metadata arrays:

```
EntityNode(drive:file:abc)
  └── metadata.tags: ["tax", "2024"]
```

Tags do **not** create edges. Tag collision does **not** imply `related_to` edge.

---

**Last updated:** 2026-06-18
