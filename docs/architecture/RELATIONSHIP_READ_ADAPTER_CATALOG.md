# Relationship Read Adapter Catalog

**Program:** Vssyl Relationship Framework  
**Phase:** 2D-1 — Read adapter constitutional architecture  
**Status:** Canonical catalog (future readers)  
**Date:** 2026-06-14  
**Federation:** [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md)  
**Ownership:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md)

> **Scope:** Catalog of **relationship read adapters** — how future platform features read relationship information without a universal relationship database. **No** services, APIs, schemas, or implementation in this phase.

---

## Purpose

A **read adapter** is the **authorized read delegate** for one relationship class (or narrow subclass) in one module. Adapters:

- Read from **system of record** only  
- Return **bounded DTOs** after visibility gates  
- Never mutate SoR  
- Register in the future [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md)

**Read adapter ≠ SearchProvider.** Search finds entities; adapters return **relationship edges and hydrated targets** for discovery, AI, analytics, and graph views.

---

## Catalog columns

| Column | Meaning |
|--------|---------|
| **SoR** | Authoritative store |
| **Adapter owner** | Team/service implementing read path |
| **Payload shape** | Constitutional DTO fields (conceptual) |
| **Visibility** | Gate before return |
| **AI** | Eligible for twin grounding (after gate) |
| **Search** | Eligible as relationship filter / hydrate input |
| **Analytics** | Eligible as event-derived or adapter snapshot |

**Legend:** ✅ Eligible · ⚠️ Conditional · ❌ Not eligible · 🔒 Metadata only

---

## Shared payload primitives (conceptual)

All adapters should return edges using a common **RelationshipReadDTO** envelope:

| Field | Purpose |
|-------|---------|
| `relationshipClass` | Taxonomy class |
| `relationshipId` | Edge row id when applicable |
| `source` | `{ moduleId, entityType, entityId }` |
| `target` | `{ moduleId, entityType, entityId }` or principal id |
| `direction` | `outbound` \| `inbound` \| `undirected` |
| `tenantScope` | dashboardId, businessId, householdId |
| `lifecycleState` | active, archived, trashed, revoked |
| `hydratedTarget` | Optional entity summary — **only if visibility passed** |
| `restrictedPlaceholder` | Boolean — target exists but denied |

**Forbidden in payload:** secrets, message bodies, file bytes, full permission blobs.

---

## 1. Ownership

| Field | Value |
|-------|-------|
| **SoR** | Entity row owner FK (`File.userId`, `Task.createdById`, `VLink.ownerUserId`, …) |
| **Adapter owner** | Owning **module** visibility service |
| **Payload shape** | `{ ownerUserId, entityRef, since }` — not a separate edge row |
| **Visibility** | Entity visible ⇒ owner id may appear; else omit |
| **AI** | ✅ Via module entity providers |
| **Search** | ⚠️ Owner filter on entity search only |
| **Analytics** | ✅ Aggregate counts — no cross-tenant owner graph |

**Adapters (reference):** `driveVisibilityService`, `todoVisibilityService`, `notesVisibilityService`, `vlinkPermissionService` (container owner)

---

## 2. Membership

| Field | Value |
|-------|-------|
| **SoR** | `BusinessMember`, `ConversationParticipant`, `CalendarMember`, `VLinkMember`, `PlaceCommunityMember`, `HouseholdMember` |
| **Adapter owner** | **Module** for module containers; **platform** for V_Link |
| **Payload shape** | `{ containerRef, memberUserId, role, joinedAt, leftAt?, isActive }` |
| **Visibility** | Caller must be member or ADMIN of container tenant |
| **AI** | ✅ Roster metadata for containers user belongs to — not foreign containers |
| **Search** | 🔒 Member search uses identity provider — not membership edge hits |
| **Analytics** | ✅ Member add/remove from domain events |

**Adapters:** `chatVisibilityService` (participants), `vlinkPermissionService` (V_Link members), business member list APIs, place community readers

**V_Link rule:** Membership grants **container** visibility — not attachment content.

---

## 3. Assignment

| Field | Value |
|-------|-------|
| **SoR** | `Task.assignedToId`, assignee history via activity |
| **Adapter owner** | **Todo** module |
| **Payload shape** | `{ taskRef, assigneeUserId, assignedByUserId?, assignedAt }` |
| **Visibility** | `todoVisibilityService` — task must be visible |
| **AI** | ✅ Todo providers export assignment on visible tasks |
| **Search** | ⚠️ Filter on entity search (`assignedTo=me`) |
| **Analytics** | ✅ `todo.task.assigned` events |

**Adapters:** `todoVisibilityService.listTasks`, todo AI context providers

---

## 4. Access grant

| Field | Value |
|-------|-------|
| **SoR** | `FilePermission`, `FolderPermission`, `NoteShare`, … |
| **Adapter owner** | **Granting module** (Drive, Notes) |
| **Payload shape** | `{ grantRef, resourceRef, granteeUserId, permissionLevel, grantedAt, revokedAt? }` |
| **Visibility** | Resource owner, grantee, or PE share-read |
| **AI** | ✅ Only if grantee is acting user or AI runs as authorized viewer |
| **Search** | ⚠️ "Shared with me" via entity search — not standalone grant row in global UI v1 |
| **Analytics** | ✅ `file.shared` / `file.unshared` |

**Adapters:** `driveVisibilityService` (shared files), `notesVisibilityService` (shared notes)

**Anti-pattern:** V_Link membership as access grant.

---

## 5. Association (V_Link)

| Field | Value |
|-------|-------|
| **SoR** | `VLink`, `VLinkEntity`, `VLinkMember` |
| **Adapter owner** | **Platform** — `vlinkService`, `vlinkEntityResolverService`, `vlinkPipelineContextService` |
| **Payload shape** | Container: `{ vlinkId, title, scope, memberRole }`; Attachment: `{ vlinkId, entityRef, linkSource, unlinkedAt?, resolveStatus }` |
| **Visibility** | `vlinkPermissionService` + per-entity `*VlinkAccessService` |
| **AI** | ✅ Confirmed links via pipeline + resolver — **not** pending suggestions |
| **Search** | ✅ Container via `vlinkSearchProvider`; attachments **metadata only** |
| **Analytics** | ✅ `vlink.entity.linked` / `vlink.entity.unlinked` |

**Adapters:** `listVLinkEntities`, `resolveEntityAccess`, `fetchVLinkPipelineContext`, `searchVLinksForUser`

**NotebookLink:** Separate adapter — operational association, not V_Link (see Reference).

---

## 6. Reference

| Field | Value |
|-------|-------|
| **SoR** | `Message.replyToId`, `TaskEventLink`, `NotebookLink` (cross-ref), calendar bridges |
| **Adapter owner** | **Source module** of reference |
| **Payload shape** | `{ sourceRef, targetRef, referenceKind, createdAt }` |
| **Visibility** | Source visible + **target hydrate** via Pattern C |
| **AI** | ✅ When both endpoints visible after hydrate |
| **Search** | ⚠️ Future relationship search — hydrate to entity hit |
| **Analytics** | ⚠️ Partial — `notebook.link.created` |

**Adapters:** `notebookLinkService.listLinks`, todo TaskEventLink readers, chat message thread readers

---

## 7. Attachment

| Field | Value |
|-------|-------|
| **SoR** | `FileReference` (chat), message attachments, drive containment of binary |
| **Adapter owner** | **Chat** for message attachment; **Drive** for file open |
| **Payload shape** | `{ hostRef, attachmentRef, mimeHint?, attachedAt }` |
| **Visibility** | Chat participant + **Drive visibility on open/hydrate** |
| **AI** | ✅ File analysis only through Drive gate |
| **Search** | ⚠️ Message hit — not attachment row |
| **Analytics** | ✅ Via `chat.message.sent` metadata |

**Adapters:** `chatVisibilityService`, `driveVisibilityService` on hydrate

---

## 8. Dependency

| Field | Value |
|-------|-------|
| **SoR** | `TaskDependency` |
| **Adapter owner** | **Todo** |
| **Payload shape** | `{ taskRef, dependsOnTaskRef, dependencyType }` |
| **Visibility** | Both tasks visible to user |
| **AI** | ✅ Todo overview / gantt providers |
| **Search** | ❌ Global v1 — module panel only |
| **Analytics** | ⚠️ Activity-only today |

**Adapters:** Todo dependency list inside `todoVisibilityService`

---

## 9. Hierarchy

| Field | Value |
|-------|-------|
| **SoR** | `Folder.parentId`, `Task.parentTaskId`, `Event.parentEventId`, `VLink.parentVLinkId`, `Thread` in chat |
| **Adapter owner** | **Module** owning hierarchy; platform for V_Link nest |
| **Payload shape** | `{ childRef, parentRef, depth?, sortOrder? }` |
| **Visibility** | Child or parent visible per module tree rules |
| **AI** | ✅ Bounded depth (≤3) in providers |
| **Search** | ⚠️ Folder path in Drive search metadata |
| **Analytics** | ⚠️ Derived from entity structure |

**Adapters:** Drive folder tree, todo subtask lists, vlink hub tree, calendar recurrence expansion

---

## 10. Containment

| Field | Value |
|-------|-------|
| **SoR** | `File.folderId`, `Event.calendarId`, `Note.folderId`, `TaskProject`, `Conversation` as message container |
| **Adapter owner** | **Module** |
| **Payload shape** | `{ containerRef, containedRef }` |
| **Visibility** | Container membership / ownership rules |
| **AI** | ✅ Scoped lists (calendar events, project tasks) |
| **Search** | ⚠️ Implicit in entity location |
| **Analytics** | ✅ Entity create events |

**Adapters:** Module list APIs scoped by container id

---

## 11. Participation

| Field | Value |
|-------|-------|
| **SoR** | `EventAttendee`, `PlaceMeetingInvite`, meeting RSVP |
| **Adapter owner** | **Calendar**, **Place** |
| **Payload shape** | `{ eventRef, participantUserId, rsvpStatus, role? }` |
| **Visibility** | Organizer, attendee self, or calendar member |
| **AI** | ✅ Calendar providers (`upcoming_events`, attendee scope) |
| **Search** | ⚠️ Event entity search |
| **Analytics** | ✅ RSVP domain events |

**Adapters:** Calendar event detail readers, place meeting services

---

## 12. Follow

| Field | Value |
|-------|-------|
| **SoR** | `BusinessFollow`, `Relationship` (Place connection accepted) |
| **Adapter owner** | **Place** / business social |
| **Payload shape** | `{ followerUserId, followedBusinessId | userId, status, followedAt }` |
| **Visibility** | Public catalog + connection privacy rules |
| **AI** | ✅ `place_connections` provider |
| **Search** | ⚠️ Discovery — not global edge hit |
| **Analytics** | ✅ Connection events |

**Adapters:** `placeConnectionService`, place graph readers

---

## 13. Subscription

| Field | Value |
|-------|-------|
| **SoR** | `WebhookSubscription`, notification prefs, `WebhookSubscription` delivery (not edge SoR) |
| **Adapter owner** | **Platform** (webhooks), module (notification prefs) |
| **Payload shape** | `{ subscriberRef, eventTypes[], tenantScope }` — delivery logs separate |
| **Visibility** | Business ADMIN for webhooks; user for own prefs |
| **AI** | ❌ Not relationship grounding |
| **Search** | ❌ |
| **Analytics** | ✅ Delivery metrics |

**Adapters:** `webhookSubscriptionService` — read subscription config only

**Note:** Domain event **fan-out** is platform subscription mechanism — adapters read config, not duplicate events as relationships.

---

## 14. Visibility

| Field | Value |
|-------|-------|
| **SoR** | `PlaceFollowVisibility`, listing publish flags, share scope |
| **Adapter owner** | **Place**, module publish services |
| **Payload shape** | `{ entityRef, visibilityClass, publishedAt?, audienceScope }` |
| **Visibility** | Owner + public catalog rules |
| **AI** | ✅ Public listing context only when published |
| **Search** | ✅ `placeVisibilityService` publish filter |
| **Analytics** | ✅ `place.listing.published` |

**Adapters:** `placeVisibilityService`, listing publish readers

---

## 15. Communication

| Field | Value |
|-------|-------|
| **SoR** | `Message`, `Conversation`, `Relationship` (DM connection) |
| **Adapter owner** | **Chat**, Place connections |
| **Payload shape** | `{ conversationRef, messageRef?, participants[], sentAt? }` |
| **Visibility** | **Participant-only** — `chatVisibilityService` |
| **AI** | ✅ Recent conversation providers — bounded messages |
| **Search** | ✅ `chatSearchProvider` |
| **Analytics** | ✅ Message sent events — aggregates only |

**Adapters:** `chatVisibilityService`, `searchAccessibleChat`

---

## 16. Tag

| Field | Value |
|-------|-------|
| **SoR** | Host row `tags[]` — **not** relationship edge |
| **Adapter owner** | **Module** hosting tags |
| **Payload shape** | `{ hostRef, tags: string[] }` — metadata on entity DTO |
| **Visibility** | Host entity visibility |
| **AI** | ⚠️ Exported in provider if entity visible — not standalone |
| **Search** | ⚠️ Tag facet via [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md) |
| **Analytics** | ✅ Facet aggregates — public catalog only cross-user |

**Adapters:** Module entity readers — **not** a cross-module tag graph adapter

**Anti-pattern:** Tag read adapter that returns edges between entities.

---

## 17. AI context

| Field | Value |
|-------|-------|
| **SoR** | `UserMemoryFact`, `UserAIContext`, ephemeral `entityLinking` |
| **Adapter owner** | **AI module**; inference request-scoped |
| **Payload shape** | Memory: `{ factId, category, content, scope }`; Inference: `{ linkedEntities[], confidence, ephemeral: true }` |
| **Visibility** | User scope (+ business where applicable) |
| **AI** | ✅ Memory in assembler; inference disclosed, not SoR |
| **Search** | ❌ |
| **Analytics** | ⚠️ Diagnostic only |

**Adapters:** `MemoryRetrievalService`, `entityLinking.ts`, `UserAIContext` APIs

**Excluded:** `VLinkSuggestion`, `AISuggestion` until accepted.

---

## 18. Preference

| Field | Value |
|-------|-------|
| **SoR** | `File.starred`, `PinnedColleague`, `PlaceInterest`, `PlaceNode` layout |
| **Adapter owner** | **Module** / Place |
| **Payload shape** | `{ userId, targetRef, preferenceKind, value }` |
| **Visibility** | **Owner-only** unless shared UX |
| **AI** | ⚠️ Optional in recent/pinned providers |
| **Search** | ⚠️ Pinned filter in module search |
| **Analytics** | ✅ Aggregates |

**Adapters:** Drive starred lists, place graph layout APIs, business pinned colleague

---

## Cross-module read orchestration

| Use case | Pattern | Adapters involved |
|----------|---------|-------------------|
| V_Link hub attachments | B + C | `listVLinkEntities` → `*VlinkAccessService` |
| Notebook page links | C | `notebookLinkService` → target module hydrate |
| "Related to task" panel | E + C | Event hint → parallel adapter fan-out |
| AI twin context | A + B | Module providers + `vlinkPipelineContextService` |
| Global "what links here" | E | Parallel adapters — merge in UI |

See [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md).

---

## Adapter index (implementation reference)

| Adapter id | Class(es) | Owner |
|------------|-----------|-------|
| `drive.visibility` | Ownership, access, hierarchy, containment | File Hub |
| `drive.vlinkAccess` | Association hydrate | File Hub |
| `chat.visibility` | Membership, communication, attachment | Chat |
| `chat.vlinkAccess` | Association hydrate | Chat |
| `calendar.vlinkAccess` | Association hydrate | Calendar |
| `todo.visibility` | Ownership, assignment, dependency, tag | Todo |
| `todo.vlinkAccess` | Association hydrate | Todo |
| `notes.visibility` | Ownership, access, tag | Notes |
| `notebook.links` | Reference, association (operational) | Notebook |
| `place.visibility` | Follow, visibility, tag, membership | Place |
| `place.vlinkAccess` | Association hydrate | Place |
| `vlink.platform` | Association, membership, hierarchy | Platform |
| `vlink.resolver` | Association hydrate (all types) | Platform |
| `vlink.pipeline` | Association (AI bundle) | Platform |
| `business.members` | Membership | Business |
| `ai.memory` | AI context | AI |

Future registry formalizes ids — [RELATIONSHIP_PROVIDER_REGISTRY.md](./RELATIONSHIP_PROVIDER_REGISTRY.md).

---

## Anti-patterns

| Anti-pattern | Correct adapter path |
|--------------|---------------------|
| Universal `RelationshipReadService` SQL join | Parallel module adapters |
| Graph DB as read SoR | Derived projection only (2D-2) |
| V_Link adapter returns file content | Resolver + Drive hydrate |
| Tag adapter links two entities | Host metadata only |
| Analytics table as edge SoR | Event-derived metrics |
| Raw Prisma in AI consumer | Module visibility adapter |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_HYDRATION_PATTERNS.md](./RELATIONSHIP_HYDRATION_PATTERNS.md) | Patterns A–E |
| [AI_RELATIONSHIP_RETRIEVAL_MODEL.md](./AI_RELATIONSHIP_RETRIEVAL_MODEL.md) | AI ordering |
| [READ_ADAPTER_GOVERNANCE.md](./READ_ADAPTER_GOVERNANCE.md) | Certification |

**Last updated:** 2026-06-14
