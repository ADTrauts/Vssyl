# Relationship Lifecycle Matrix

**Program:** Vssyl Relationship Framework  
**Phase:** 1C — Lifecycle architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Taxonomy:** [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md)  
**Ownership:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md)  
**Cascades:** [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md)

> **Scope:** Defines **expected lifecycle behavior** per relationship class. Does not specify APIs, services, or schema migrations.

---

## Platform lifecycle states

Vssyl uses **platform-wide state vocabulary** ([VSSYL_PLATFORM_STANDARDS](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §18). Not every class uses every state.

| State | Meaning | Primary fields / markers |
|-------|---------|--------------------------|
| **Active** | Normal operation | Default rows; `status: ACTIVE` (V_Link) |
| **Archived** | Intentional retirement without Global Trash | V_Link `archivedAt`; NotebookLink `archivedAt` |
| **Trashed** | Global Trash soft delete | Entity `trashedAt` |
| **Restored** | Return from trash or archive to active | Clear trash/archive timestamps |
| **Soft-unlinked** | Relationship edge retired; audit retained | V_Link `VLinkEntity.unlinkedAt` |
| **Revoked** | Access or membership explicitly removed | Delete share row; `leftAt` on participant |
| **Expired** | Time-bound invalidation | V_Link suggestion EXPIRED; memory `expiresAt` |
| **Permanently deleted** | Row removed or tombstoned | Hard delete + async storage cleanup |
| **Orphaned** | Edge remains; target missing or inaccessible | Allowed only where documented below |

**Legend for matrix columns:**

| Column | Meaning |
|--------|---------|
| **Creation** | How edge comes into existence |
| **Update** | Mutable fields and governance |
| **Archive** | Non-trash retirement path |
| **Trash** | Global Trash involvement |
| **Restore** | Reversal path |
| **Delete** | Terminal removal |
| **Audit retention** | What history survives |
| **AI visibility** | Twin/search exposure rules |
| **Search visibility** | Index and discoverability |

---

## 1. Ownership

**Examples:** `File.userId`, `Task.createdById`, `VLink.ownerUserId`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Set at entity create; immutable except governed transfer |
| **Update** | **Transfer** only via explicit flows (V_Link admin transfer, business governance) — not implicit from links |
| **Archive** | N/A — ownership is property of entity, not archived separately |
| **Trash** | Ownership row trashed **with entity** (Global Trash on entity) |
| **Restore** | Owner unchanged on entity restore |
| **Delete** | Ownership ends when entity permanently deleted |
| **Audit retention** | Activity + domain events retain prior owner in metadata where emitted |
| **AI visibility** | AI sees ownership only via module visibility — not inferred from V_Link |
| **Search visibility** | Owner-scoped search filters; no public owner graph |

---

## 2. Membership

**Examples:** `BusinessMember`, `ConversationParticipant`, `VLinkMember`, `CalendarMember`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Invite + accept or system add; `joinedAt` / `acceptedAt` |
| **Update** | Role change (EDITOR→VIEWER); flags on business member |
| **Archive** | V_Link container archive does **not** auto-remove members — container archived as unit |
| **Trash** | Container trash (conversation `trashedAt`) — membership frozen/deactivated, not separate trash row |
| **Restore** | Container restore reactivates membership per module rules |
| **Delete** | **Revoke:** `leftAt`, `isActive: false`, or row delete per module; V_Link member DELETE |
| **Audit retention** | Member add/remove events + activity; historical membership in audit |
| **AI visibility** | Active membership only for container-scoped providers; left members excluded |
| **Search visibility** | Roster UIs; not federated as global graph |

**V_Link special case:** Membership grants **container** visibility only — never linked entity content.

---

## 3. Assignment

**Examples:** `Task.assignedToId`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Set on create or assign action; may notify assignee |
| **Update** | Reassign clears prior assignee; history via activity/events |
| **Archive** | N/A |
| **Trash** | Assignment persists on soft-trashed task until permanent delete |
| **Restore** | Assignment unchanged on task restore |
| **Delete** | Cleared or destroyed with task permanent delete |
| **Audit retention** | Assign/reassign in module activity + optional domain event |
| **AI visibility** | Todo providers show assignment when task visible |
| **Search visibility** | Task search filters by assignee |

---

## 4. Access grant

**Examples:** `FilePermission`, `FolderPermission`, `NoteShare`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Explicit grant by owner; PE check |
| **Update** | Permission level change (read→write) |
| **Archive** | N/A |
| **Trash** | Grant persists while entity trashed — collaborator trash visibility per module model |
| **Restore** | Grant unchanged unless revoked during trash period |
| **Delete** | **Revoke** deletes grant row; emit unshare event |
| **Audit retention** | Share/unshare activity + `file.shared` / `file.unshared` domain events |
| **AI visibility** | Shared content included in visibility service when grant active |
| **Search visibility** | Shared items appear in authorized user search |

---

## 5. Association

**Examples:** `VLinkEntity`, `NotebookLink` (REFERENCE), `TaskFileLink`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Manual, AI-accepted, or system (documented); idempotent where unique constraint exists |
| **Update** | Metadata/json only; primary vlink uniqueness enforced for V_Link PRIMARY |
| **Archive** | **NotebookLink:** `archivedAt` — target entity unchanged. **V_Link entity:** soft-unlink optional UX; container archive separate |
| **Trash** | **Target trashed:** edge **retained**; resolver returns `restricted`. **Source trashed:** module-specific (Notebook page trash hides links) |
| **Restore** | Edge active; resolver returns `full` when permissions allow |
| **Delete** | **V_Link:** `unlinkedAt` on permanent delete of **target**; row retained for audit. **NotebookLink:** archive or delete link row only |
| **Audit retention** | V_Link activity + `vlink.entity.*` events; NotebookLink audit via notebook activity |
| **AI visibility** | Confirmed V_Link only; trashed targets redacted; NotebookLink via hydrate |
| **Search visibility** | V_Link container searchable; restricted entity titles omitted from global search |

---

## 6. Reference

**Examples:** `Message.replyToId`, `PlaceMeetingPlace.eventId`, `TaskEventLink`, NotebookLink EMBED/AGENDA

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Set when linking records; validate target exists |
| **Update** | Repoint reference (change linked event) — governed mutation |
| **Archive** | NotebookLink `archivedAt`; scalar FK references cleared only on explicit unlink |
| **Trash** | Reference **persists**; dereference UI shows degraded state ("in trash", "deleted") |
| **Restore** | Reference valid again if target restored |
| **Delete** | Remove reference row or null FK; **do not** delete target |
| **Audit retention** | Module activity on link/unlink |
| **AI visibility** | Include only if both ends visible to user |
| **Search visibility** | Usually not indexed as standalone edge |

---

## 7. Attachment

**Examples:** `FileReference` (message ↔ file)

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Atomic with message send |
| **Update** | Immutable attachment set post-send (edit message policy module-specific) |
| **Archive** | N/A |
| **Trash** | Message soft-delete hides attachment in UI; file trash independent |
| **Restore** | Message restore restores attachment visibility |
| **Delete** | Cascade delete attachment junction with message hard delete; **never** hard-delete file from chat delete alone |
| **Audit retention** | Message send events |
| **AI visibility** | File via Drive visibility when analyzing conversation |
| **Search visibility** | File search independent; chat search may index attachment metadata for members |

---

## 8. Dependency

**Examples:** `TaskDependency`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Explicit add; cycle detection where required |
| **Update** | Change blocking task — rare; usually delete + recreate |
| **Archive** | N/A |
| **Trash** | Dependency **persists** if either task trashed — show blocked state or hide per UX |
| **Restore** | Dependency active again |
| **Delete** | Remove dependency row when either task permanently deleted or explicit unlink |
| **Audit retention** | Todo activity |
| **AI visibility** | In task overview when tasks visible |
| **Search visibility** | Not typically indexed |

---

## 9. Parent / child (hierarchy)

**Examples:** `Folder.parentId`, `Task.parentTaskId`, `VLink.parentVLinkId`, `Event.parentEventId`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Set parent on create or reparent action |
| **Update** | Reparent with cycle prevention (V_Link, folders) |
| **Archive** | V_Link parent archive may archive subtree by policy |
| **Trash** | Child trash independent unless module cascades (folder tree trash) |
| **Restore** | Parent restore may offer "restore children" (V_Link policy) |
| **Delete** | **V_Link:** block parent delete with active children unless reparent/archive subtree. **Folder:** tree trash rules in Drive |
| **Audit retention** | Move/reparent events |
| **AI visibility** | Hierarchical lists in module providers |
| **Search visibility** | Path/breadcrumb in entity search |

---

## 10. Containment

**Examples:** `File.folderId`, `Message.conversationId`, `Event.calendarId`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Entity created inside container scope |
| **Update** | **Move** between containers — governed (move file, move event) |
| **Archive** | N/A |
| **Trash** | Trashing container may cascade to children per module (folder+files) |
| **Restore** | Container restore may restore children |
| **Delete** | Permanent delete of container requires child handling policy |
| **Audit retention** | Container membership + move events |
| **AI visibility** | Scoped by container tenant |
| **Search visibility** | Scoped by dashboard/business |

---

## 11. Participation

**Examples:** `EventAttendee`, `PlaceMeetingInvite`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Invite or self-RSVP |
| **Update** | RSVP status change |
| **Archive** | N/A |
| **Trash** | Event trash — attendees retained on row; display as cancelled/trashed |
| **Restore** | Attendee list restored with event |
| **Delete** | Remove attendee row or cascade on event permanent delete |
| **Audit retention** | RSVP + event lifecycle events |
| **AI visibility** | Calendar providers when attendee-visible |
| **Search visibility** | Attendee search within calendar scope |

---

## 12. Follow

**Examples:** `BusinessFollow`, Place follow graph

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | User-initiated follow |
| **Update** | N/A or visibility overlay update |
| **Archive** | N/A |
| **Trash** | Target business listing trashed — follow row may persist; discovery hides target |
| **Restore** | Follow unchanged |
| **Delete** | Unfollow deletes row |
| **Audit retention** | Place activity feed items (FOLLOWED/UNFOLLOWED) |
| **AI visibility** | Place connection providers |
| **Search visibility** | Follow affects Place graph, not module workspace search |

---

## 13. Subscription

**Examples:** `WebhookSubscription`, `PushSubscription`, socket room join

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Register endpoint or device |
| **Update** | Event filter list, endpoint URL rotation |
| **Archive** | N/A |
| **Trash** | N/A |
| **Restore** | N/A |
| **Delete** | Unsubscribe / delete subscription row |
| **Audit retention** | Delivery attempt logs; webhook dead-letter |
| **AI visibility** | **None** — not grounding input |
| **Search visibility** | **None** |

---

## 14. Visibility

**Examples:** `PlaceFollowVisibility`, `PlaceSettings.neighborhoodVisibility`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Default on place setup |
| **Update** | User toggles disclosure rules |
| **Archive** | N/A |
| **Trash** | N/A |
| **Restore** | N/A |
| **Delete** | Revert to default or delete overlay row |
| **Audit retention** | Optional privacy change audit |
| **AI visibility** | Place providers respect before exposing graph |
| **Search visibility** | Controls graph render — not search index directly |

---

## 15. Communication

**Examples:** `Conversation`, `Message`, `Thread`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Conversation + participants; messages append-only stream |
| **Update** | Message edit (`editedAt`); metadata updates |
| **Archive** | N/A at platform level |
| **Trash** | Conversation `trashedAt`; message-level `deletedAt` for retraction |
| **Restore** | Conversation restore from Global Trash |
| **Delete** | Permanent delete conversation cascades messages; message delete ≠ conversation delete |
| **Audit retention** | Module activity; domain `chat.message.sent`; read receipts optional |
| **AI visibility** | Participant-scoped recent/unread providers |
| **Search visibility** | Member-scoped chat search |

---

## 16. Tag

**Examples:** `Task.tags`, `Note.tags`, listing tags

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | Set on entity create/update |
| **Update** | Replace array on entity patch |
| **Archive** | N/A |
| **Trash** | Tags trash **with entity** |
| **Restore** | Tags restore with entity |
| **Delete** | Tags destroyed with entity permanent delete |
| **Audit retention** | Optional in update activity metadata |
| **AI visibility** | Only if module provider exports tags |
| **Search visibility** | Module-local tag filter/search only |

---

## 17. Preference

**Examples:** `File.starred`, `PinnedColleague`, `PlaceNode` layout

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | User toggles preference |
| **Update** | Toggle or reorder |
| **Archive** | N/A |
| **Trash** | Entity trash — starred state irrelevant until restore |
| **Restore** | Preference persists on user record |
| **Delete** | Delete preference row or reset default |
| **Audit retention** | Minimal — not compliance-critical |
| **AI visibility** | May boost ranking in providers — not structural edge |
| **Search visibility** | Filter only (starred files) |

---

## 18. AI context

**Examples:** `UserMemoryFact`, `UserAIContext`, `VLinkSuggestion` (pending), inferred `entityLinking`

| Lifecycle | Expected behavior |
|-----------|-------------------|
| **Creation** | User explicit, promoted from chat, or AI suggestion accept |
| **Update** | Edit content, priority, active flag |
| **Archive** | Deactivate `UserAIContext.active`; dismiss suggestions |
| **Trash** | `UserMemoryFact.trashedAt`; excluded from retrieval |
| **Restore** | Memory restore clears trash |
| **Delete** | Hard delete or expire (`expiresAt`) |
| **Audit retention** | Pipeline traces; admin diagnostics — not user-facing graph |
| **AI visibility** | **Explicit memory:** yes when active. **Persisted V_Link:** via vlink source. **Inference:** request only — never stored as fact without confirmation. **Pending suggestion:** **never** |
| **Search visibility** | Custom context UI only; not global search |

---

## Cross-class lifecycle interactions (summary)

| Trigger | Association (V_Link) | Access grant | Membership | NotebookLink |
|---------|---------------------|--------------|------------|--------------|
| Entity soft trash | Edge kept; restricted | Grant kept | Container trash rules | Link hidden; archived optional |
| Entity permanent delete | Soft-unlink (`unlinkedAt`) | Revoke or cascade delete | N/A | Archive or orphan per policy |
| V_Link archive | Container archived; entities stay linked | N/A | Members retained | Independent |
| Business member removed | No effect on V_Link | No auto-revoke unless policy | Revoke | Independent |

Detailed cascades: [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md)

---

## Governance

| Change | Gate |
|--------|------|
| New lifecycle state for a class | Update this matrix + cascade rules |
| Module deviates from matrix | Document certified exception in module audit |
| AI visibility exception | Architecture + AI platform review |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md) | Entity-delete cascades |
| [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](./RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) | Retention |
| [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md) | Event vocabulary |
| [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) | Trash canonical rules |

**Last updated:** 2026-06-14
