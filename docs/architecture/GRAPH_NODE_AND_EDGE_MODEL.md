# Graph Node and Edge Model

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-2 — Graph visualization constitutional architecture  
**Status:** Canonical projection model  
**Date:** 2026-06-14  
**Contract:** [RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md](./RELATIONSHIP_GRAPH_VISUALIZATION_CONTRACT.md)  
**Taxonomy:** [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md)

> **Scope:** Canonical **graph projection** node and edge categories — visual meaning, adapter source, visibility, AI eligibility. **Not** a schema or API spec.

---

## Projection DTO envelope (conceptual)

### GraphNode

| Field | Purpose |
|-------|---------|
| `nodeId` | Stable within projection: `{moduleId}:{entityType}:{entityId}` |
| `category` | Node category (below) |
| `label` | Display string or redacted token |
| `taxonomyClasses` | Primary entity classes on node |
| `tenantScope` | dashboardId, businessId, … |
| `lifecycleState` | active, trashed, archived, restricted |
| `tags[]` | Overlay badges — optional |
| `deepLink` | Module URL if openable |
| `sourceAdapterId` | Registry provider id |
| `layoutHint` | x, y — preference only |

### GraphEdge

| Field | Purpose |
|-------|---------|
| `edgeId` | `{relationshipClass}:{relationshipId}` or synthetic for scalar ownership |
| `relationshipClass` | Taxonomy class |
| `sourceNodeId`, `targetNodeId` | Directed per class rules |
| `label` | Optional role (EDITOR, assignee, …) |
| `lifecycleState` | active, revoked, archived |
| `provenance` | `sor` \| `suggestion` \| `inference` |
| `sourceAdapterId` | Registry provider id |

**provenance:** Only `sor` edges are solid lines. `suggestion` / `inference` dashed — not counted as relationships.

---

## Node categories

### Entity (generic)

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Openable module record |
| **Source adapter** | Module K1 `{module}.visibility` |
| **Visibility** | Module visibility service |
| **AI** | ✅ If entity in provider bundle |
| **Examples** | Generic fallback for typed entities below |

---

### Container

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Grouping hub — members inside, attachments linked |
| **Source adapter** | `vlink.platform`, conversation/calendar/project readers |
| **Visibility** | Membership on container |
| **AI** | ✅ Container metadata; attachments via resolver |
| **Examples** | V_Link, conversation (as container), task project |

---

### User

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Person principal |
| **Source adapter** | `business.members`, chat participant lists, member search |
| **Visibility** | Shared org, connection accepted, or container co-member |
| **AI** | 🔒 Roster metadata — no private profile fields |
| **Examples** | Assignee, attendee, V_Link member |

---

### Business

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Organization node |
| **Source adapter** | Business module readers |
| **Visibility** | Member or public catalog |
| **AI** | ✅ Business context provider scope |
| **Examples** | Workspace root, listing owner |

---

### Household

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Household workspace container |
| **Source adapter** | Household membership readers |
| **Visibility** | Household member |
| **AI** | ⚠️ Scoped providers only |
| **Examples** | Household dashboard anchor |

---

### Conversation

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Chat container |
| **Source adapter** | `chat.visibility` |
| **Visibility** | Participant only |
| **AI** | ✅ Recent conversation providers |
| **Examples** | DM, channel |

---

### Task

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Todo entity |
| **Source adapter** | `todo.visibility` |
| **Visibility** | `todoVisibilityService` |
| **AI** | ✅ Todo providers |
| **Tags** | Overlay on node |

---

### File

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Drive file/folder |
| **Source adapter** | `drive.visibility` |
| **Visibility** | `driveVisibilityService` |
| **AI** | ✅ When share/owner visible |
| **Examples** | File, folder |

---

### Calendar Event

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Scheduled event |
| **Source adapter** | Calendar event readers |
| **Visibility** | Calendar membership + attendee rules |
| **AI** | ✅ Upcoming/today providers |

---

### Place Listing

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Public or business catalog listing |
| **Source adapter** | `place.visibility` |
| **Visibility** | Publish + explore rules |
| **AI** | ✅ Public catalog context |
| **Tags** | Overlay — public facet only in federated graph |

---

### AI Context

| Aspect | Value |
|--------|-------|
| **Visual meaning** | Memory fact or custom context row (optional admin/explain UI) |
| **Source adapter** | `ai.memory` |
| **Visibility** | User-only (+ business scope where applicable) |
| **AI** | ✅ Memory retrieval — **not** shown in shared team graphs by default |
| **Note** | Usually excluded from team federated explorer |

---

## Edge categories

Visual styling guidance (implementation-agnostic):

| Class | Line style | Direction | Color family (conceptual) |
|-------|------------|-----------|---------------------------|
| Ownership | Thin solid | → entity | Neutral |
| Membership | Dashed box edge | User → container | Blue |
| Assignment | Solid arrow | Task → user | Orange |
| Access grant | Solid key | Resource → user | Green |
| Association | Solid | Container ↔ entity | Purple |
| Reference | Dotted arrow | Source → target | Grey |
| Attachment | Paperclip | Host → file | Grey |
| Dependency | Arrow | Task → task | Amber |
| Participation | Arrow | Event → user | Teal |
| Follow | Arrow | User → business/user | Pink |
| Subscription | None in graph v1 | N/A | N/A — config not edge |

Hierarchy and containment often render as **parent-child** nesting rather than separate edges — declare in subgraph legend.

---

## Edge category detail

### Ownership

| Field | Value |
|-------|-------|
| **Visual** | Owner badge on entity node — optional edge to User |
| **Adapter** | Entity reader exposes `ownerUserId` |
| **Visibility** | Entity visible |
| **AI** | ✅ |

### Membership

| Field | Value |
|-------|-------|
| **Visual** | User inside container boundary |
| **Adapter** | `vlink.platform`, chat, business, place community |
| **Visibility** | Container member list gate |
| **AI** | ✅ Roster metadata |

### Assignment

| Field | Value |
|-------|-------|
| **Visual** | Arrow task → assignee |
| **Adapter** | `todo.visibility` |
| **Visibility** | Task visible |
| **AI** | ✅ |

### Association

| Field | Value |
|-------|-------|
| **Visual** | Container to entity (V_Link) or undirected project link |
| **Adapter** | `vlink.resolver`, `notebook.links` |
| **Visibility** | Pattern C — **target hydrate** |
| **AI** | ✅ Confirmed V_Link only |

### Reference

| Field | Value |
|-------|-------|
| **Visual** | Dotted cross-link (NotebookLink, reply, TaskEventLink) |
| **Adapter** | `notebook.links`, todo/calendar bridges |
| **Visibility** | Source + target hydrate |
| **AI** | ✅ Both visible |

### Attachment

| Field | Value |
|-------|-------|
| **Visual** | Message/file clip |
| **Adapter** | Chat + Drive hydrate |
| **Visibility** | Participant + file gate |
| **AI** | ✅ File analysis path |

### Dependency

| Field | Value |
|-------|-------|
| **Visual** | Task → task blocker arrow |
| **Adapter** | `todo.visibility` |
| **Visibility** | Both tasks visible |
| **AI** | ✅ |

### Participation

| Field | Value |
|-------|-------|
| **Visual** | Event → attendee |
| **Adapter** | Calendar / place meeting readers |
| **Visibility** | Organizer/attendee scope |
| **AI** | ✅ |

### Follow

| Field | Value |
|-------|-------|
| **Visual** | User → business listing |
| **Adapter** | `place.visibility`, connection service |
| **Visibility** | Follow privacy + connection status |
| **AI** | ✅ Place connections provider |

### Subscription

| Field | Value |
|-------|-------|
| **Visual** | **Not rendered** as graph edge in v1 |
| **Adapter** | Webhook/notification config — separate admin UI |
| **Visibility** | ADMIN |
| **AI** | ❌ |

---

## Tag overlays (not edges)

| Rule | Detail |
|------|--------|
| Render | Chip list on entity node |
| Source | Host `tags[]` via entity adapter |
| Federated | Module badge on chip if cross-module |
| Forbidden | Edge from `#urgent` node to tasks |

---

## AI-derived suggestions (not SoR edges)

| Element | Rendering |
|---------|-------------|
| V_Link suggestion | Dashed edge `provenance: suggestion` |
| AI inferred link | Dashed `provenance: inference` |
| Accepted | Re-fetch adapters → solid `provenance: sor` |

---

## Node/edge cardinality limits (default)

| Limit | Value |
|-------|-------|
| Max nodes per subgraph | 200 |
| Max edges per subgraph | 500 |
| Max label length | 120 chars |
| Max tags shown | 8 per node |

Overrides require graph provider certification.

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_READ_ADAPTER_CATALOG.md](./RELATIONSHIP_READ_ADAPTER_CATALOG.md) | Adapter index |
| [GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md](./GRAPH_TRAVERSAL_AND_HYDRATION_MODEL.md) | Expansion rules |

**Last updated:** 2026-06-14
