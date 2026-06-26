# Entity Relationship Catalog

**Program:** Connected Knowledge Platform — Phase 0A  
**Date:** 2026-06-25  
**Status:** Canonical inventory for entity-centric knowledge assessment

**Taxonomy authority:** [RELATIONSHIP_TAXONOMY.md](../architecture/RELATIONSHIP_TAXONOMY.md)  
**Node identity:** [PLATFORM_ENTITY_MODEL.md](../architecture/PLATFORM_ENTITY_MODEL.md)  
**Prior inventory:** [CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md](../context-graph/CONTEXT_GRAPH_RELATIONSHIP_INVENTORY.md) (extended here for Connected Knowledge scope)

---

## 1. Identity contract

All knowledge-relevant entities resolve through:

```
nodeKey = {moduleId}:{entityType}:{entityId}
```

Container nodes (V_Link): `vlink:vlink:{vlinkId}`

No universal entity table. Modules own Prisma schemas.

---

## 2. Entity type catalog

### 2.1 People

| Entity | moduleId | entityType | SoR | V_Link | Search | Graph adapter |
|--------|----------|------------|-----|:------:|:------:|:-------------:|
| **User** | auth | user | `User` | ❌ enum only | partial (members) | ❌ |
| **Employee profile** | hr | employee_profile | HR models | ⚠️ lifecycle | ❌ | ⚠️ |
| **Business member** | business | member | `BusinessMember` | ❌ | partial | ❌ |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| User → Business | Membership | `BusinessMember` | ✅ |
| User → Household | Membership | `HouseholdMember` | ✅ |
| Employee → Position | Hierarchy | HR org chart | ✅ |
| Manager → Report | Hierarchy | `ManagerApprovalHierarchy` | ✅ |
| User → V_Link | Membership | `VLinkMember` | ✅ |
| User → Task | Assignment | Task assignee FK | ✅ |
| User → Event | Participation | Calendar attendees | ✅ |
| User → Conversation | Membership | `ConversationParticipant` | ✅ |
| User → File | Access grant | Drive share | ✅ |
| User ↔ User (implicit) | Inference | Chat co-participation | ❌ AI only |

**Gaps:** No linkable User node in V_Link; people discovery fragmented across Members, HR, Chat.

---

### 2.2 Projects

| Entity | moduleId | entityType | SoR | Notes |
|--------|----------|------------|-----|-------|
| **Todo project** | todo | project | `Project` | Containment for tasks — not cross-module hub |
| **V_Link hub** | vlink | vlink | `VLink` | De facto **user project container** |
| **Notebook** | notebook | page | Notebook models | Meeting workspace — partial V_Link |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| Task → Project | Containment | `Task.projectId` | ✅ |
| V_Link → *entities | Association | `VLinkEntity` | ✅ |
| V_Link → V_Link | Hierarchy | `parentVLinkId` | ✅ |
| Project ↔ File/Event | Association | Via V_Link only | ⚠️ manual |
| AI "project context" | Inference | Retrieval co-occurrence | ❌ ephemeral |

**Gaps:** No first-class **Project** platform entity spanning modules; users use V_Link or Todo project inconsistently.

---

### 2.3 Businesses

| Entity | moduleId | entityType | SoR | V_Link | Search |
|--------|----------|------------|-----|:------:|:------:|
| **Business** | business | business | `Business` | ❌ enum | partial |
| **Dashboard (business)** | dashboard | dashboard | `Dashboard` | ❌ | ✅ |
| **Position** | business | position | Org chart | ❌ | partial |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| Business → Dashboard | Ownership | `Dashboard.businessId` | ✅ |
| Business → Member | Membership | `BusinessMember` | ✅ |
| Business → Listing | Ownership | Place schema | ✅ |
| Business → Module install | Subscription | Module entitlements | ✅ |

---

### 2.4 Files

| Entity | moduleId | entityType | SoR | V_Link | Search | Graph |
|--------|----------|------------|-----|:------:|:------:|:-----:|
| **File** | drive | file | `File` | ✅ | ✅ | ✅ |
| **Folder** | drive | folder | `Folder` | ✅ | partial | ✅ |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| File → Folder | Hierarchy | `File.folderId` | ✅ |
| Folder → Folder | Hierarchy | `Folder.parentId` | ✅ |
| File → V_Link | Association | `VLinkEntity` | ✅ |
| File → Conversation | Attachment | Chat file refs | ✅ |
| File → Task | Reference | Todo file refs | ✅ module-local |
| User → File | Access grant | Share table | ✅ |
| File ↔ File (similar) | Inference | Search/AI | ❌ |

---

### 2.5 Tasks

| Entity | moduleId | entityType | SoR | V_Link | Search |
|--------|----------|------------|-----|:------:|:------:|
| **Task** | todo | task | `Task` | ✅ | ✅ |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| Task → Project | Containment | FK | ✅ |
| Task → User | Assignment | assignee FKs | ✅ |
| Task → Task | Dependency | deps table | ✅ |
| Task → V_Link | Association | `VLinkEntity` | ✅ |
| Task → File | Reference | module refs | ✅ |
| Task → Event | Association | V_Link only | ⚠️ |

---

### 2.6 Meetings

| Entity | moduleId | entityType | SoR | V_Link | Search |
|--------|----------|------------|-----|:------:|:------:|
| **Calendar event** | calendar | event | `Event` | ✅ | ✅ |
| **Place meeting** | place | meeting | Place models | ✅ | partial |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| Event → Calendar | Containment | FK | ✅ |
| Attendee → Event | Participation | attendees | ✅ |
| Event → Event | Hierarchy | recurrence parent | ✅ |
| Event → V_Link | Association | `VLinkEntity` | ✅ |
| Event → Notebook page | Association | V_Link / manual | ⚠️ |
| Meeting → Listing | Reference | Place schema | ✅ |

---

### 2.7 Messages

| Entity | moduleId | entityType | SoR | Graph node? |
|--------|----------|------------|-----|:-----------:|
| **Conversation** | chat | conversation | `Conversation` | ✅ full |
| **Message** | chat | message | `Message` | ⚠️ lightweight 1-hop |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| Message → Conversation | Containment | FK | ✅ |
| Conversation → File | Attachment | refs | ✅ |
| Conversation → V_Link | Association | `VLinkEntity` | ✅ |
| Message → Entity mention | Inference | AI parsing | ❌ |
| CHAT_THREAD | — | — | ❌ deferred |

---

### 2.8 Places

| Entity | moduleId | entityType | SoR | V_Link | Search |
|--------|----------|------------|-----|:------:|:------:|
| **Listing** | place | listing | Place | ✅ | partial |
| **Meeting** | place | meeting | Place | ✅ | partial |

**Relationship patterns:**

| Relationship | Class | Storage | Explicit? |
|--------------|-------|---------|:---------:|
| User → Listing | Follow | `place_connections` | ✅ |
| Listing → Business | Ownership | schema | ✅ |
| Listing → V_Link | Association | `VLinkEntity` | ✅ |
| Discovery → Listing | Inference | search/retrieval | ❌ |

---

### 2.9 Assets

| Concept | Vssyl mapping | Status |
|---------|---------------|--------|
| Physical assets | Not a first-class entity | ❌ Gap |
| Drive files as assets | `drive:file` | ✅ |
| HR equipment (future) | Undefined | ❌ |
| Place listings as venues | `place:listing` | ✅ |

**Gap:** No platform **Asset** entity type; files and listings substitute partially.

---

### 2.10 Processes

| Concept | Vssyl mapping | Status |
|---------|---------------|--------|
| Approval workflows | `ManagerApprovalHierarchy`, Policy Engine | ✅ operational, not graph edges |
| Onboarding journey | `hr:onboarding_journey` | ✅ registered, limited graph |
| Scheduling shifts | `scheduling:shift` | ✅ registered, no V_Link |
| Automation rules | AI automation boundary | ⚠️ ephemeral triggers |

**Gap:** **Process** is not a graph node; workflows are PE + module state, not federated relationships.

---

### 2.11 External partner entities

| Concept | Storage | Status |
|---------|---------|--------|
| `MODULE_ENTITY` / `PARTNER_ENTITY` | V_Link enum placeholder | ❌ no resolver |
| Partner manifest `entities[]` | Certification only | ⚠️ documented |
| Delegate hydrate | Not implemented | ❌ |

See [VLINK_PARTICIPATION_ARCHITECTURE.md](../marketplace/VLINK_PARTICIPATION_ARCHITECTURE.md).

---

### 2.12 Custom entities

| Mechanism | Status |
|-----------|--------|
| User-defined types | ❌ Not supported |
| V_Link metadata JSON | ⚠️ unstructured |
| Business-defined schemas | ❌ Requires module or partner |

**Gap:** Custom entities are a **Phase 2+ governance** topic — delegate + manifest extension, not ad hoc tables.

---

## 3. Relationship dimensions

### 3.1 Explicit relationships

Persisted in module SoR or V_Link. Authoritative for federation.

Examples: `VLinkEntity`, `Task.projectId`, `BusinessMember`, Drive share, `place_connections`.

### 3.2 Implicit relationships

Derivable from co-location or context without stored edge.

Examples: same V_Link membership (users see same hub, not automatically "related"), same business dashboard scope, co-attendance on event.

### 3.3 AI-inferred relationships

| Source | Persistence | Precedence |
|--------|-------------|------------|
| `entityLinking.ts` | Ephemeral per request | Lowest |
| AI Retrieval evidence | Ephemeral per request | Low |
| Search co-occurrence | Ephemeral | Low |
| `VLinkSuggestion` | Pending until accept | Becomes explicit |
| `UserMemoryFact` | Persisted fact | Adjacent — not edge |

**Rule:** Inference never overrides explicit V_Link or module FK ([AI_RELATIONSHIP_RETRIEVAL_MODEL.md](../architecture/AI_RELATIONSHIP_RETRIEVAL_MODEL.md) AI-8).

### 3.4 Missing relationship types (platform-wide)

| Missing type | Example use | Recommended owner |
|--------------|-------------|-------------------|
| **Person ↔ Person** (collaboration) | "Works with" | Inference + optional V_Link |
| **Entity ↔ Process instance** | "This file started approval X" | Module + activity |
| **Cross-BO rollup** | "All HR items for project hub" | V_Link + federation |
| **Temporal "followed"** | "User viewed this" | Preference class — not graph |
| **Causal** | "Because task completed, event scheduled" | Phase 2+ narrative layer |
| **Partner ↔ Platform entity** | CRM deal ↔ File | Partner delegate |

---

## 4. Relationship lifecycle

| Phase | V_Link | Module FK | Inference | UserMemoryFact |
|-------|--------|-----------|-----------|----------------|
| **Create** | `linkEntityToVLink` + PE | Module service | Per request | `createUserMemoryFact` |
| **Suggest** | `VLinkSuggestion` PENDING | — | AI only | — |
| **Confirm** | ACCEPTED → `VLinkEntity` | — | User accept | explicit provenance |
| **Update** | metadata, primary flag | Module update | — | patch fact |
| **Soft remove** | `unlinkedAt` | trash | — | expiry |
| **Archive** | V_Link ARCHIVED | module archive | — | — |
| **Permanent delete** | cascade unlink | module delete + lifecycle hooks | — | delete fact |

**Cascade:** [RELATIONSHIP_CASCADE_RULES.md](../architecture/RELATIONSHIP_CASCADE_RULES.md) — entity permanent delete soft-unlinks V_Link attachments.

---

## 5. Ownership

| Layer | Owner |
|-------|-------|
| Module entity rows | Module team / schema |
| V_Link container + attachments | Platform (vlink service) |
| Federation bundle | Context Graph orchestrator |
| Inference edges | Nobody — ephemeral |
| User memory facts | User + `userMemoryFactService` |
| Activity records | Emitting module (normalized envelope) |

---

## 6. Permissions

| Relationship class | Enforcement point |
|------------------|-------------------|
| Association (V_Link) | `vlinkPermissionService` + `*VlinkAccessService` |
| Access grant | Module PE (Drive, Notes) |
| Membership | Container PE |
| Module FK edges | Module PE on read |
| Federation hop | `permissionResolver` per adapter |
| Inference | Re-check on hydrate — never bypass PE |

**Constitutional:** V_Link membership does **not** grant attachment content access.

---

## 7. Confidence and provenance (current vs target)

### Current (`VLinkEntity.source`)

| Value | Meaning |
|-------|---------|
| `MANUAL` | User linked |
| `AI_SUGGESTED` | Accepted suggestion |
| (inference) | Not stored on edge |

### Target (Phase 0B — not implemented)

| Field | Purpose |
|-------|---------|
| `provenance` | `module_native` \| `manual` \| `ai_accepted` \| `import` \| `partner` |
| `confidence` | `certain` \| `likely` \| `inferred` |
| `confirmedAt` | User or system confirmation timestamp |
| `confirmedById` | Actor |
| `evidenceRef` | Optional retrieval trace id for audit |

---

## 8. Anti-patterns

| Anti-pattern | Status |
|--------------|--------|
| Universal `relationships` table | ❌ Forbidden |
| Search hit → auto V_Link | ❌ Forbidden |
| Pending suggestion in solid graph | ❌ Forbidden |
| Activity log as edge SoR | ❌ Forbidden |
| Tags as graph edges | ❌ Forbidden per taxonomy |
| Partner in-process Prisma | ❌ Forbidden |

---

## 9. References

- [CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md](./CONNECTED_KNOWLEDGE_ARCHITECTURE_AUDIT.md)
- [VLINK_EVOLUTION_STRATEGY.md](./VLINK_EVOLUTION_STRATEGY.md)
- [GRAPH_NODE_AND_EDGE_MODEL.md](../architecture/GRAPH_NODE_AND_EDGE_MODEL.md)
