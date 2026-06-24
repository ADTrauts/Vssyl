# Context Graph — Relationship Inventory

**Program:** Context Graph Phase 0A  
**Date:** 2026-06-23  
**Status:** Entity A → Entity B inventory with enforcement source

**Taxonomy authority:** [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md)

---

## Legend

| Column | Meaning |
|--------|---------|
| **Source** | System of record or derived layer |
| **Enforcement** | Where authorization is applied |
| **Class** | Taxonomy class |

---

## Cross-module association (V_Link)

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| V_Link | File | Association | `VLinkEntity` | `driveVlinkAccessService` + PE |
| V_Link | Folder | Association | `VLinkEntity` | drive access service |
| V_Link | Event | Association | `VLinkEntity` | `calendarVlinkAccessService` |
| V_Link | Conversation | Association | `VLinkEntity` | `chatVlinkAccessService` |
| V_Link | Task | Association | `VLinkEntity` | `todoVlinkAccessService` |
| V_Link | Listing / Meeting | Association | `VLinkEntity` | `placeVlinkAccessService` |
| V_Link | V_Link (child) | Hierarchy | `VLink.parentVLinkId` | `vlinkPermissionService` |
| User | V_Link | Membership | `VLinkMember` | Container visibility only |
| Entity | V_Link (reverse) | Association | `GET /entity/:type/:id` | Resolver + PE |

---

## Module-native edges

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| File | Folder | Hierarchy | `File.folderId` | Drive visibility |
| Folder | Folder | Hierarchy | `Folder.parentId` | Drive visibility |
| Task | Project | Containment | `Task.projectId` | Todo PE |
| Task | Task | Dependency | `Task` deps | Todo PE |
| Task | User | Assignment | assignee FKs | Todo PE |
| Event | Event | Hierarchy | `Event.parentEventId` | Calendar PE |
| Conversation | File | Attachment | chat file refs | Chat + Drive hydrate |
| Page | Page | Reference | NotebookLink | Notebook adapter |
| Listing | Business | Ownership | Place schema | Place PE |
| User | Business | Membership | `BusinessMember` | Business PE |
| User | Household | Membership | `HouseholdMember` | Household PE |
| Dashboard | Business/Household/User | Ownership | `Dashboard` FKs | Workspace runtime |

---

## Access grant edges (content access)

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| User | File | Access grant | Drive share | Drive PE + share table |
| User | Page | Access grant | Notes share | Notes PE |
| User | Calendar | Membership | `CalendarMember` | Calendar PE |
| User | Conversation | Membership | `ConversationParticipant` | Chat visibility |

**Note:** Access grants **do** grant content access. V_Link membership **does not**.

---

## Activity and events

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| Actor | Entity | Activity | `ModuleActivityEvent` | Activity read PE |
| Domain event | Subscribers | Signal | Event bus | Subscriber authZ |

Domain events **trigger re-fetch** — they are not relationship SoR ([AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md) AI-6).

---

## Search and retrieval (derived, ephemeral)

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| Query context | Search hit | Inference | Unified Search providers | `search:read` + module hydrate |
| Pipeline intent | Evidence entity | Inference | `aiRetrievalCapabilityService` | Consumer PE + search gate |
| Anchor entity | Related hit | Inference | Co-occurrence in evidence set | Ephemeral — not persisted |

**Provenance:** `inference` — dashed edges in graph projection; never override persisted V_Link.

---

## Place and discovery

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| User | Listing | Follow | `place_connections` | Place PE |
| Business | Listing | Ownership | Place business scope | Place PE |
| Discovery query | Listing | Inference | Search + retrieval | `local_discovery` consumer |

---

## Chat, calendar, task associations (operational)

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| Message | Conversation | Containment | Chat schema | Chat PE |
| Event | Calendar | Containment | Calendar schema | Calendar PE |
| Attendee | Event | Participation | Calendar attendees | Calendar PE |
| Task | Dashboard | Containment | Todo scope | Dashboard + business scope |

---

## Repeatedly reconstructed (not stored as edges)

| Pattern | Consumers | Why reconstructed |
|---------|-----------|-------------------|
| File ↔ Task ↔ Event co-mention | `project_assistant`, `planning` | No unified project graph edge |
| Business docs ↔ operations | `business_operations` | Cross-module search only |
| Place ↔ user context | `local_discovery` | Discovery is query-time |
| Workflow entity bundle | `workflow_action` | Action context assembled per turn |
| Tag co-occurrence | Search, tag index | Tags are metadata, not edges |

---

## Context Graph bundle edges

| From | To | Class | Source | Enforcement |
|------|-----|-------|--------|-------------|
| Anchor | Module entity | Federation | `contextGraphOrchestrator` | `permissionResolver` per hop |
| V_Link anchor | Attachments | Association | `vlinkContextGraphAdapter` | Adapter + module hydrate |
| Anchor | Tag overlay | Tag (metadata) | `tagIndexService` | Read-only index |

---

## Anti-patterns (constitutional)

| Anti-pattern | Status |
|--------------|--------|
| Universal `relationships` table | ❌ Forbidden |
| V_Link membership → file content | ❌ Forbidden |
| Search index as SoR | ❌ Forbidden |
| Auto-persist retrieval evidence as V_Link | ❌ Forbidden without user accept |
| Pending suggestion as solid graph edge | ❌ Forbidden |

---

## References

- [RELATIONSHIP_READ_ADAPTER_CATALOG.md](../architecture/RELATIONSHIP_READ_ADAPTER_CATALOG.md)
- [V_LINK.md](../architecture/V_LINK.md)
- [CONTEXT_GRAPH_REALITY_ASSESSMENT.md](./CONTEXT_GRAPH_REALITY_ASSESSMENT.md)

**Last updated:** 2026-06-23
