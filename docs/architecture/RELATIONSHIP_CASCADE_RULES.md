# Relationship Cascade Rules

**Program:** Vssyl Relationship Framework  
**Phase:** 1C — Lifecycle architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Lifecycle matrix:** [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md)  
**Ownership:** [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md)

> **Scope:** Defines **cascade behavior** when entities or relationships are trashed, archived, or permanently deleted. Architecture only — no implementation.

---

## Cascade vocabulary

| Term | Meaning |
|------|---------|
| **Hard cascade** | Dependent rows deleted or irreversibly terminated in same transaction |
| **Soft cascade** | Dependent rows marked inactive, unlinked, or hidden — rows may remain |
| **Orphan allowed** | Edge may remain pointing at missing/inaccessible target — UI degrades |
| **Orphan forbidden** | Service must unlink, archive, or block delete until resolved |
| **Independent** | No automatic change to related relationship |

---

## Cascade decision framework

```
1. Identify system of record (Ownership Matrix)
2. Classify each related edge (Taxonomy)
3. Apply lifecycle matrix for trash vs permanent delete
4. Choose cascade type per edge class
5. Emit events after successful mutation (Event Model)
```

**Constitutional defaults:**

- **Access grants** do not auto-create on delete elsewhere  
- **V_Link membership** never cascades from entity delete  
- **Association** soft-unlinks on target **permanent** delete; persists on soft trash  
- **Permanent delete** requires explicit unlink/cascade policy per module  

---

## 1. Delete file (Drive)

**Entity:** `File`  
**SoR:** drive module

| Related relationship | Soft trash file | Permanent delete file | Cascade type |
|---------------------|-----------------|----------------------|--------------|
| File ownership | Row trashed with file | Row destroyed | Hard cascade (entity) |
| FilePermission (shares) | **Independent** — grant persists | **Hard cascade** or revoke — grants deleted with file | Soft trash: independent; Permanent: hard cascade |
| Folder containment | **Independent** — file trashed in place or moved first | Destroyed with file | Entity lifecycle |
| FileReference (chat attachments) | **Orphan allowed** — message shows degraded attachment | **Orphan allowed** or soft-hide — messages retained | Soft cascade UI |
| TaskFileLink | **Orphan allowed** | **Soft cascade** — unlink or orphan per todo policy | Todo module |
| NotebookLink → FILE | **Orphan allowed** — "file in trash" embed | **Orphan allowed** — embed "deleted" | Soft cascade UX |
| VLinkEntity (FILE) | **Independent** — link retained; resolver `restricted` | **Soft cascade** — `unlinkedAt` set (FH-3A) | Soft unlink |
| File activity / domain events | **Independent** — history retained | Audit retained (tombstone) | Retention policy |
| Starred preference | Trashed with entity visibility | Destroyed with file | Hard cascade |
| AI memory referencing file | **Independent** | **Independent** — memory may stale until user edits | Orphan allowed |

**V_Link membership:** **Independent** — deleting file does not affect any V_Link container or its members.

---

## 2. Delete folder (Drive)

**Entity:** `Folder`

| Related relationship | Soft trash folder | Permanent delete folder | Cascade type |
|---------------------|-------------------|------------------------|--------------|
| Child files/folders | **Soft cascade** — tree trash | **Hard cascade** — tree permanent delete + storage cleanup | Module trash service |
| FolderPermission | Same as file shares | Hard cascade on permanent delete | |
| VLinkEntity (FOLDER) | Link retained; restricted | Tree soft-unlink all folder + contained file links (FH-3A) | Soft unlink |
| V_Link membership | **Independent** | **Independent** | |

---

## 3. Delete task (Todo)

**Entity:** `Task`

| Related relationship | Soft trash task | Permanent delete task | Cascade type |
|---------------------|-----------------|----------------------|--------------|
| Task ownership / assignment | Trashed with task | Destroyed | Hard cascade |
| Task.tags | Trashed with task | Destroyed | Hard cascade |
| TaskDependency (in/out) | **Orphan allowed** — blocked semantics in UI | **Hard cascade** — dependency rows removed | Permanent: hard |
| Subtasks (`parentTaskId`) | **Soft cascade** — subtasks trashed with parent OR independent per product rule | **Hard cascade** — policy: trash subtree or reparent | Module policy |
| TaskFileLink | **Independent** | **Hard cascade** — link rows deleted | |
| TaskEventLink | **Independent** | **Hard cascade** | |
| NotebookLink → TASK | **Orphan allowed** | **Orphan allowed** or archive link — page unchanged | Soft UX |
| VLinkEntity (TASK/TODO) | Link retained; restricted | **Soft cascade** — `unlinkedAt` (todo lifecycle service) | Soft unlink |
| Notifications (todo_assigned) | **Independent** — historical | **Independent** | Delivery records |
| V_Link membership | **Independent** | **Independent** | |

---

## 4. Delete calendar event

**Entity:** `Event`

| Related relationship | Soft trash event | Permanent delete event | Cascade type |
|---------------------|------------------|------------------------|--------------|
| EventAttendee | Rows retained | **Hard cascade** — attendees deleted | Permanent: hard |
| Event recurrence instances | **Soft cascade** — instance trash rules | Series policy — single instance vs series | Calendar module |
| TaskEventLink | **Independent** | **Hard cascade** or orphan | Todo bridge |
| NotebookLink AGENDA → event | **Orphan allowed** | **Orphan allowed** / archive | Soft UX |
| PlaceMeetingPlace.eventId | **Independent** — reference may stale | Null reference or soft cascade | Reference |
| VLinkEntity (CALENDAR_EVENT) | Link retained; restricted | **Soft cascade** — unlink (calendar lifecycle service) | Soft unlink |
| V_Link membership | **Independent** | **Independent** | |

---

## 5. Delete conversation (Chat)

**Entity:** `Conversation`

| Related relationship | Soft trash conversation | Permanent delete conversation | Cascade type |
|---------------------|-------------------------|-------------------------------|--------------|
| ConversationParticipant | **Soft cascade** — deactivate / freeze | **Hard cascade** — participants deleted | |
| Messages | Hidden from active lists | **Hard cascade** — messages deleted | |
| FileReference on messages | **Independent** — files unchanged | **Independent** | Attachment rule |
| VLinkEntity (CHAT_CONVERSATION) | Link retained; restricted | **Soft cascade** — unlink | Soft unlink |
| Socket room membership | **Soft cascade** — disconnect | **Independent** — runtime | |
| V_Link membership | **Independent** | **Independent** | |

**Delete single message:** **Independent** for conversation, participants, V_Link — message `deletedAt` only.

---

## 6. Delete note / notebook page

**Entity:** `Note` (page)

| Related relationship | Soft trash note | Permanent delete note | Cascade type |
|---------------------|-----------------|----------------------|--------------|
| NoteShare | **Independent** — grant persists on trashed note | **Hard cascade** | Permanent: hard |
| Note.tags | Trashed with note | Destroyed | Hard cascade |
| NotebookLink from PAGE | **Soft cascade** — links hidden | **Orphan allowed** or archive all outbound links | Notebook policy |
| VLinkEntity (NOTE) | Partial resolver; restricted | **Soft cascade** — unlink when lifecycle exists | Target state |
| V_Link membership | **Independent** | **Independent** | |

**Notes migration note:** Until `trashedAt` unified, `deletedAt` path must follow same cascade **intent** as Global Trash.

---

## 7. Delete V_Link container

**Entity:** `VLink`

| Related relationship | Archive vlink | Soft delete vlink | Permanent delete vlink |
|---------------------|---------------|-------------------|------------------------|
| VLinkMember | **Independent** — retained | Retained or soft cascade per policy | **Hard cascade** |
| VLinkEntity attachments | **Independent** — entities unchanged | **Independent** | **Soft cascade** — unlink all OR hard delete rows |
| VLink children (nest) | **Soft cascade** — subtree archive default | **Orphan forbidden** — block if active children unless reparent | Reparent or cascade |
| VLinkSuggestion | **Independent** | Expire/reject pending | **Hard cascade** |
| VLinkActivity | **Independent** | Retained | Retained per audit policy |
| Linked module entities | **Independent** — files/tasks/etc. unchanged | **Independent** | **Independent** |

**Constitutional:** Deleting V_Link **never** deletes linked module entities.

---

## 8. Delete business

**Entity:** `Business`

| Related relationship | Business deactivated | Business permanent delete | Cascade type |
|---------------------|---------------------|---------------------------|--------------|
| BusinessMember | **Soft cascade** — `leftAt` / inactive | **Hard cascade** — policy + legal hold | Governance |
| BusinessInvitation | **Hard cascade** — expire pending | **Hard cascade** | |
| BusinessFollow | **Independent** | **Hard cascade** or orphan listings | Place module |
| BusinessPlaceListing | **Soft cascade** — unpublish/trash | **Hard cascade** | Place |
| WebhookSubscription | **Hard cascade** | **Hard cascade** | |
| Module data (drive, todo, …) | **Orphan forbidden** — block or migrate | **Hard cascade** or export gate — **never silent** | Tier 1 policy |
| V_Link (BUSINESS scope) | **Soft cascade** — archive business vlinks | **Hard cascade** or transfer ownership | Platform |
| Notifications | **Independent** — historical | Retention per policy | |
| UserMemoryFact (business scope) | **Independent** | **Soft cascade** — trash or anonymize | AI policy |

**Place relationships:** Main Street nodes referencing business — **soft cascade** hide; permanent delete removes listing, nodes degrade.

---

## 9. Delete user account

**Entity:** `User` (governance — high risk)

| Related relationship | Account deactivated | Account permanent delete |
|---------------------|---------------------|--------------------------|
| BusinessMember | **Soft cascade** — deactivate | **Hard cascade** or anonymize |
| ConversationParticipant | **Soft cascade** — leave conversations | Anonymize or hard cascade |
| File ownership | **Orphan forbidden** — transfer or delete content first | Policy-driven |
| VLinkMember / VLink owner | Transfer or delete vlinks first | **Hard cascade** after transfer |
| Relationship (user-user) | **Soft cascade** — block | **Hard cascade** |
| UserMemoryFact | **Soft cascade** — deactivate | **Hard cascade** / anonymize |
| Notifications | **Independent** | Retention then purge |

Account delete requires **explicit governance matrix** — out of scope for module-level implementation in Phase 1C except: **no silent orphan of access grants across tenants**.

---

## 10. NotebookLink unlink (not entity delete)

**Action:** User unlinks page from file (Phase 5 behavior)

| Target | Effect | Cascade type |
|--------|--------|--------------|
| File | **Independent** — unchanged | |
| Page | **Independent** | |
| NotebookLink row | **Archive** (`archivedAt`) or delete | Soft cascade link only |

---

## Cascade matrix (by taxonomy class)

| Taxonomy class | Default on target soft trash | Default on target permanent delete |
|----------------|------------------------------|-----------------------------------|
| Ownership | Trashes with entity | Hard cascade |
| Membership | Deactivate with container | Hard cascade |
| Assignment | Persists | Hard cascade |
| Access grant | Independent | Hard cascade |
| Association (V_Link) | **Independent** (restricted) | **Soft-unlink** |
| Association (module) | Orphan allowed | Hard cascade or orphan |
| Reference | Orphan allowed | Orphan or null FK |
| Attachment | Degraded UI | Orphan if message kept |
| Dependency | Orphan allowed | Hard cascade |
| Hierarchy | Module-specific tree | Module-specific |
| Containment | May trash children | Hard cascade children |
| Participation | Persists | Hard cascade |
| Follow | Independent | Hard cascade or independent |
| Subscription | Independent | Independent |
| Visibility | Independent | Independent |
| Communication | Trashes with container | Hard cascade messages |
| Tag | Trashes with entity | Hard cascade |
| Preference | Independent | Hard cascade with entity or user |
| AI context | Independent | Trash memory rows |

---

## Blocked deletes (orphan forbidden)

| Operation | Block condition | Required user action |
|-----------|-----------------|----------------------|
| V_Link parent delete | Active child vlinks | Archive subtree, reparent, or cancel |
| Folder delete (Drive) | Non-empty without recursive flag | Confirm tree delete or cancel |
| Business delete | Active members + data | Export, transfer, or admin cascade approval |
| User delete | Owned files without successor | Transfer ownership |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md) | Per-class lifecycle |
| [RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md](./RELATIONSHIP_AUDIT_AND_RETENTION_POLICY.md) | What survives cascades |
| [NOTEBOOK_RELATIONSHIP_MODEL.md](./NOTEBOOK_RELATIONSHIP_MODEL.md) | Notebook unlink semantics |

**Last updated:** 2026-06-14
