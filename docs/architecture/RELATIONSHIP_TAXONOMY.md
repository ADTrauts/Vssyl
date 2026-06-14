# Relationship Taxonomy

**Program:** Vssyl Relationship Framework  
**Phase:** 1B — Constitutional architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §5, §21  
**Baseline:** [audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md](./audits/RELATIONSHIP_FRAMEWORK_BASELINE_AUDIT.md)

> **Scope:** Defines relationship **classes** and their constitutional rules. Does **not** define APIs, schemas, services, or a universal relationship store.

---

## How to use this document

1. Every new relationship mechanism in Vssyl must map to **exactly one primary class** (secondary classes allowed in metadata only).
2. If a proposed feature does not fit any class, **extend this taxonomy** via governance review — do not invent ad hoc stores.
3. **V_Link**, **tags**, and **operational module links** are different layers — see class definitions and anti-patterns.

---

## Constitutional principles

| Principle | Rule |
|-----------|------|
| **Module ownership** | Operational relationships live in module schemas unless explicitly Tier 0 (V_Link, notifications delivery, domain events). |
| **No god object** | No universal `relationships` table spanning all modules. |
| **Membership ≠ access** | Container membership (V_Link, calendar, chat) does not automatically grant content access to attached or related entities. |
| **Access grants are explicit** | File share, note share, and similar edges **do** grant content access — never conflate with association. |
| **AI reads; modules authorize** | AI consumes relationships through visibility services and resolvers — never raw cross-module Prisma. |
| **Tags are not relationships** | Tags are module-local metadata (see §Tag). |

---

## Class index

| Class | Grants content access? | Platform-first? |
|-------|------------------------|-----------------|
| [Ownership](#ownership) | Yes (control) | Module |
| [Membership](#membership) | Sometimes | Mixed |
| [Assignment](#assignment) | Sometimes (role-based) | Module |
| [Access grant](#access-grant) | **Yes** | Module + PE |
| [Association](#association) | No | V_Link / Notebook |
| [Reference](#reference) | No | Module |
| [Attachment](#attachment) | No (target module decides) | Module |
| [Dependency](#dependency) | No | Module |
| [Parent / child (hierarchy)](#parent--child-hierarchy) | Inherited | Module / V_Link |
| [Containment](#containment) | Inherited | Module |
| [Participation](#participation) | Sometimes | Module |
| [Follow](#follow) | No | Place / Business |
| [Subscription](#subscription) | No | Platform / Business |
| [Visibility](#visibility) | No (controls discovery) | Place / module |
| [Communication](#communication) | Via membership | Chat |
| [Tag](#tag) | No | Module-local |
| [AI context](#ai-context) | No (user authority) | AI + V_Link |
| [Preference](#preference) | No | UX / module |

---

## Ownership

### Definition

Canonical **creator or owner** of an entity record. Establishes default control, trash authority, and primary permission subject for Policy Engine evaluation.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| File / folder owner (`userId`) | `File`, `Folder` | drive |
| Task creator (`createdById`) | `Task` | todo |
| Note creator | `Note` | notes |
| V_Link owner (`ownerUserId`) | `VLink` | platform (vlink) |
| Calendar via calendar membership OWNER | `Calendar`, `CalendarMember` | calendar |
| Business entity owner | `Business` (org record) | business |

### Permission implications

- Owner is default **full control** subject unless PE denies.
- Ownership transfer (business admin, V_Link force-transfer) is a governed mutation — not a separate relationship class.
- Ownership does **not** automatically propagate to unrelated entities linked by association.

### AI implications

- AI may summarize owned entities when module visibility services allow.
- Ownership alone does not expose entities in cross-module graphs without resolver pass.

### Storage pattern

Scalar FK on entity row (`userId`, `createdById`, `ownerUserId`) or container membership role OWNER.

### Anti-patterns

- Treating V_Link membership as ownership of linked files.
- Inferring ownership from association or tags.
- AI writing entity rows without canonical service ownership checks.

---

## Membership

### Definition

User (or principal) **belongs to a container**. May grant access **to the container's own content**, not necessarily to entities merely linked or referenced from it.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Business member | `BusinessMember` | business |
| Household member | `HouseholdMember` | household |
| Conversation participant | `ConversationParticipant` | chat |
| Calendar member | `CalendarMember` | calendar |
| V_Link member | `VLinkMember` | platform (vlink) |
| Place community member | `PlaceCommunityMember` | place |

### Permission implications

| Membership type | Container access | Linked entity access |
|-----------------|------------------|---------------------|
| Chat participant | Messages in conversation | Drive files via separate resolver |
| V_Link member | Vlink title, code, metadata, member list | **No** — module resolver required |
| Business member | Org features per role | Module-scoped (drive, todo, etc.) |
| Calendar member | Calendar/events per role | N/A |

### AI implications

- Module providers scope lists by membership (e.g. recent conversations).
- V_Link pipeline includes only **confirmed** vlinks where user is member.

### Storage pattern

Junction table: `(containerId, userId, role, …)` with tenant scoping on container.

### Anti-patterns

- Granting file read because user is on a V_Link that links the file.
- Single global `memberships` table replacing module containers.
- Skipping `isActive` / `leftAt` checks on chat or business membership.

---

## Assignment

### Definition

**Responsibility delegated** to a user for an entity or workflow step. Distinct from ownership; may imply task execution rights only.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Task assignee (`assignedToId`) | `Task` | todo |
| Future: ticket assignee, shift assignee | module-specific | hr / scheduling |

### Permission implications

- Assignee receives module-defined write scope (complete task, update status) — not owner-level delete unless policy allows.
- Assignment does not grant access to arbitrarily linked files without Drive/Todo visibility.

### AI implications

- Todo providers expose assigned tasks via `todoVisibilityService`.
- AI actions that reassign must use canonical todo services + PE.

### Storage pattern

Nullable FK `assignedToId` on entity or assignment junction with effective dates.

### Anti-patterns

- Using assignment as a substitute for file share.
- Notebook UI mutating assignment without Todo service.

---

## Access grant

### Definition

**Explicit permission** for another user to read or write **entity content**. Always affirmative; revocable; distinct from association.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| File share | `FilePermission` | drive |
| Folder share | `FolderPermission` | drive |
| Note share | `NoteShare` | notes |

### Permission implications

- **Grants content access** — constitutional opposite of V_Link association.
- Evaluated via module helpers + Policy Engine (`FILE_READ`, `FILE_SHARE`, etc.).
- Revoke must emit activity/events per module contract.

### AI implications

- `driveVisibilityService` includes shared files for AI context.
- AI `share_file` tool uses `grantFileSharePermission` — same path as HTTP.

### Storage pattern

Junction with capability flags (`canRead`, `canWrite`) or role string (`viewer` / `editor`).

### Anti-patterns

- Creating V_Link link instead of share when collaborator needs file content.
- Bypassing PE on share grant.
- Assuming business membership equals file share.

---

## Association

### Definition

**Semantic grouping** of entities without transferring permissions. User- or system-curated "these items belong together" for discovery, context, and AI grounding.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| V_Link entity attachment | `VLinkEntity` | platform (vlink) |
| NotebookLink REFERENCE | `NotebookLink` | notebook |
| Task ↔ file (operational association) | `TaskFileLink` | todo |

### Permission implications

- **Does not grant access** (V_Link constitutional rule).
- Hydration always calls target module visibility/resolver.
- Restricted placeholders when viewer lacks target access.

### AI implications

- Persisted V_Links preferred over inference in `entityLinking.ts`.
- Pending V_Link suggestions **never** ground twin.
- NotebookLink payloads filtered through target module before embed.

### Storage pattern

Polymorphic junction: `(sourceContainer or vlinkId, entityType, entityId, relationType, …)`.

### Anti-patterns

- Universal association table replacing module operational links.
- Auto-creating associations without user approval (except documented system sources).
- Using association for access control.

---

## Reference

### Definition

**Pointer** from one record to another without embedding content. Target module enforces access on dereference.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Message reply (`replyToId`) | `Message` | chat |
| Place meeting → calendar event | `PlaceMeetingPlace.eventId` | place |
| NotebookLink EMBED / AGENDA | `NotebookLink` | notebook |
| Task ↔ event bridge | `TaskEventLink` | todo |

### Permission implications

- No implicit access; open/target resolves via module PE.
- Broken references (trashed target) show degraded UI — not permission escalation.

### AI implications

- References may appear in module context if both ends visible.
- Not a substitute for V_Link cross-module grouping.

### Storage pattern

FK or polymorphic `(targetType, targetId)` on source record or link row.

### Anti-patterns

- Dereference without visibility service.
- Reference counted as V_Link without user curation.

---

## Attachment

### Definition

**Binary or media binding** of a platform entity to a host record (typically message-hosted file).

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Chat file attachment | `FileReference` (message ↔ file) | chat (edge) + drive (entity) |

### Permission implications

- Conversation membership required to see attachment metadata in chat.
- File bytes governed by Drive permissions on open/download.

### AI implications

- Vision pipeline uses Drive visibility for attachment analysis.
- Attachment edge alone does not bypass file PE.

### Storage pattern

Junction `(hostId, fileId)` with cascade rules on host delete.

### Anti-patterns

- Storing duplicate file metadata in chat without File Hub as system of record.
- AI reading file bytes without `driveVisibilityService`.

---

## Dependency

### Definition

**Ordering or blocking constraint** between entities of the same domain. Directed; often prevents state transitions until satisfied.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Task dependency | `TaskDependency` | todo |

### Permission implications

- Visible to users who can view both tasks; mutate via Todo PE.
- Does not cross module permission boundaries.

### AI implications

- Exposed in todo overview providers when visibility allows.
- AI must not create dependencies bypassing `todoService`.

### Storage pattern

Directed edge `(dependentTaskId, blockingTaskId)` or equivalent.

### Anti-patterns

- Modeling file↔task dependency only in V_Link without `TaskFileLink` when operational semantics needed.
- Cross-tenant dependency edges.

---

## Parent / child (hierarchy)

### Definition

**Tree structure** where child lifecycle and visibility inherit from parent context (with module-specific rules).

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Folder tree | `Folder.parentId` | drive |
| Task subtasks | `Task.parentTaskId` | todo |
| V_Link nesting | `VLink.parentVLinkId` | platform (vlink) |
| Event recurrence | `Event.parentEventId` | calendar |
| Note folders | `NoteFolder` | notes |

### Permission implications

- Child access typically derived from parent container + shares.
- V_Link parent does not expose inaccessible child **entity content**.
- Delete-parent rules vary (V_Link blocks with active children).

### AI implications

- Hierarchy exposed as structured lists in module providers — not flattened into global graph.

### Storage pattern

Self-referential FK on same entity type; cycle detection in service layer for V_Link.

### Anti-patterns

- Duplicating folder hierarchy in V_Link as primary organization.
- Unbounded deep nesting without archive/trash policy.

---

## Containment

### Definition

Entity **lives inside** a scoped container whose tenant and permission context apply. Stronger than reference — child does not exist outside container semantics.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| File in folder | `File.folderId` | drive |
| Note in folder | `Note.folderId` | notes |
| Message in conversation | `Message.conversationId` | chat |
| Event on calendar | `Event.calendarId` | calendar |
| Widget on dashboard | `DashboardWidget` | dashboard |

### Permission implications

- Container scope (`dashboardId`, `businessId`) mandatory on queries.
- Moving between containers is a governed mutation (move file, reschedule event).

### AI implications

- Tenant scoping on all containment reads.

### Storage pattern

Required or optional FK to container entity.

### Anti-patterns

- Cross-dashboard containment without explicit move + authZ.
- Treating V_Link as containment for files (files remain in Drive).

---

## Participation

### Definition

User involvement in an **event or meeting** with RSVP or invite status — not full container membership.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Calendar attendee | `EventAttendee` | calendar |
| Place meeting invite | `PlaceMeetingInvite` | place |

### Permission implications

- May grant read to specific event instance without calendar admin role.
- RSVP mutations through calendar/place services only.

### AI implications

- Calendar providers include attendee-visible events.
- Participation edges not merged into V_Link unless user explicitly links.

### Storage pattern

Junction with response status enum; may include email for external attendees.

### Anti-patterns

- Confusing attendee with calendar OWNER membership.
- V_Link membership substituting for event invite.

---

## Follow

### Definition

**Asymmetric interest** from user toward entity (typically business/listing). Used for discovery and social graph — not collaboration access.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Business follow | `BusinessFollow` | place / business |
| Place follow visibility | `PlaceFollowVisibility` | place |

### Permission implications

- Does not grant business workspace or file access.
- Visibility of follow to others is user-controlled.

### AI implications

- Place providers (`place_connections`, discoveries) consume follow graph.
- Not used for twin grounding of private business data.

### Storage pattern

`(userId, targetEntityId)` unique junction; optional visibility overlay.

### Anti-patterns

- Follow as substitute for BusinessMember invitation.
- Cross-user follow exposing private module data.

---

## Subscription

### Definition

Registration to receive **events or notifications** when something happens. Consumer-side — not semantic link between two user-facing entities.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Webhook subscription | `WebhookSubscription` | platform (business admin) |
| Push subscription | `PushSubscription` | platform (auth) |
| Socket room join | runtime | realtime |

### Permission implications

- Business ADMIN for webhook CRUD.
- Socket join requires proven membership on target room.

### AI implications

- Not inputs to twin grounding directly.
- Automation (future) may react to domain events — not relationship federation.

### Storage pattern

Subscriber record + event type filter + delivery log.

### Anti-patterns

- Webhook payload including data user could not read via API.
- Treating notification rows as authoritative relationship graph.

---

## Visibility

### Definition

**Discovery and disclosure policy** — who can see that a relationship or graph edge exists (not necessarily target content).

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Place neighborhood visibility | `PlaceSettings.neighborhoodVisibility` | place |
| Follow visibility override | `PlaceFollowVisibility` | place |
| Place location privacy | `PlaceLocationPrivacy` | place |

### Permission implications

- Controls graph **rendering** on Main Street and social surfaces.
- Fail closed when visibility denies.

### AI implications

- Place context respects privacy flags before exposing connection graph.

### Storage pattern

Settings row or per-edge visibility flag.

### Anti-patterns

- Using visibility to grant content access.
- leaking hidden follows via search index.

---

## Communication

### Definition

**Interactive messaging channel** between participants. Combines containment (conversation) + membership + message reference/attachment edges.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Conversation + messages | `Conversation`, `Message` | chat |
| Thread | `Thread` | chat |
| Typing / read receipts | runtime + `ReadReceipt` | chat |

### Permission implications

- Active participant required for read/write/socket.
- `assertActiveConversationMember` pattern mandatory.

### AI implications

- Recent/unread providers participant-scoped.
- Message content never leaked via V_Link alone.

### Storage pattern

Container + participant junction + message stream.

### Anti-patterns

- Socket join without membership check.
- AI summarizing conversations user is not in.

---

## Tag

### Definition

**Module-local label** for filter, search facet, or UI organization. No direction, no lifecycle contract, no cross-module identity in v1.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Task tags | `Task.tags String[]` | todo |
| Note tags | `Note.tags` | notes |
| Listing tags | `BusinessPlaceListing.tags` | place |
| AI custom context tags | `UserAIContext.tags` | ai |

### Permission implications

- Visible only within module visibility of host entity.
- Tags do not grant access.

### AI implications

- Included only if module provider exports them.
- **Not** a pipeline context source class (unlike V_Link).

### Storage pattern

Scalar array on entity or JSON metadata — module-owned.

### Anti-patterns

- Platform-wide tag table in Phase 1–2 without taxonomy charter.
- Replacing V_Link grouping with tags.
- Treating tags as access control lists.

---

## AI context

### Definition

**Grounding and memory edges** used by the twin pipeline — confirmed user memory, persisted V_Links, or ephemeral inference. Not a substitute for module permissions.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| User memory fact | `UserMemoryFact` | ai |
| User AI context row | `UserAIContext` | ai |
| Persisted V_Link in pipeline | `VLinkEntity` via `vlinkPipelineContextService` | platform + ai |
| Inferred entity link | ephemeral in `entityLinking.ts` | ai |

### Permission implications

- AI inherits **user authority** — same visibility as user.
- Unapproved suggestions excluded.

### AI implications

- Precedence: **persisted V_Link > module context > inference**.
- Catalog source `vlink` optional per intent.
- Pending `VLinkSuggestion` never grounds.

### Storage pattern

Dedicated AI tables + platform V_Link store; inference is request-scoped only.

### Anti-patterns

- Persisting inferred links without user confirmation when presented as fact.
- Raw Prisma cross-module reads for grounding.
- Conflating `AISuggestion` (ambient actions) with V_Link suggestions.

---

## Preference

### Definition

**UI or ordering state** without semantic relationship between distinct entities. User-specific; low governance.

### Examples

| Example | Storage | Owner module |
|---------|---------|--------------|
| Starred file | `File.starred` | drive |
| Pinned note | `Note.pinned` | notes |
| Pinned colleague | `PinnedColleague` | business |
| Place node layout | `PlaceNode.positionX/Y` | place |

### Permission implications

- Owner/pinner only unless module says otherwise.

### AI implications

- May boost ranking in module providers — not cross-module graph edges.

### Storage pattern

Boolean or ordering field on entity or user preference junction.

### Anti-patterns

- Using preference flags as sharing mechanism.
- Syncing preferences across tenants.

---

## Cross-class composition matrix

Real features often combine classes. Document **primary** class + secondary in product specs.

| User action | Primary class | Secondary | System of record |
|-------------|---------------|-----------|------------------|
| Share file with colleague | Access grant | Notification | `FilePermission` |
| Add file to V_Link | Association | — | `VLinkEntity` |
| Assign task | Assignment | Notification | `Task.assignedToId` |
| Link task to file in Todo | Association / Reference | — | `TaskFileLink` |
| Link page to task in Notebook | Reference / Association | — | `NotebookLink` |
| Invite to meeting | Participation | Notification | `EventAttendee` |
| Follow business on Place | Follow | Visibility | `BusinessFollow` |
| Join business workspace | Membership | — | `BusinessMember` |
| Tag task `#urgent` | Tag | — | `Task.tags` |
| AI remembers user preference | AI context | Tag (optional) | `UserMemoryFact` |

---

## Governance

| Action | Gate |
|--------|------|
| Add new relationship class | Architecture review + update this document |
| Add V_Link entity type | Resolver + lifecycle + manifest + taxonomy mapping |
| Add cross-module link table | Must map to class; justify vs V_Link / NotebookLink |
| Promote tags to platform layer | Phase 1C+ decision — not in taxonomy v1 scope |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) | Who owns each concrete relationship |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | How readers consume relationships |
| [V_LINK.md](./V_LINK.md) | V_Link layer (association container) |
| [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | Notebook vs V_Link split |

**Last updated:** 2026-06-14
