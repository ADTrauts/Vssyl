# Relationship Automation Trigger Catalog

**Program:** Vssyl Relationship Framework  
**Phase:** 2C — Automation trigger constitutional architecture  
**Status:** Canonical catalog (future automation)  
**Date:** 2026-06-14  
**Event model:** [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md)  
**Safety:** [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md)

> **Scope:** Defines **trigger-eligible** relationship lifecycle changes for **future** automation, notifications, webhooks, AI signals, and index invalidation. **No** workflow engine, APIs, jobs, or UI in this phase.

---

## Purpose

Automation must react to **facts after authorized mutation** — not poll a universal relationship graph. This catalog maps **framework trigger concepts** to **concrete domain event types**, documents ownership and safety per trigger, and prevents unsafe automation before any engine is built.

**Does not:** Register new emitters, subscribers, or workflow definitions.

---

## How to read this catalog

### Framework concepts vs concrete events

Phase 1C established abstract vocabulary (`relationship.created`, …). Platform emits **concrete** types (`file.shared`, `vlink.entity.linked`, …) per [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md) E4.

| Layer | Example |
|-------|---------|
| **Framework concept** | `relationship.created` |
| **Concrete trigger** | `file.shared`, `vlink.entity.linked`, `business.member.added` |

Automation subscriptions bind to **concrete types** (or filtered concept groups), never a fictional universal `relationship.*` bus.

### Per-trigger fields

| Field | Meaning |
|-------|---------|
| **Definition** | What state change occurred |
| **Relationship class** | Taxonomy class from [RELATIONSHIP_TAXONOMY.md](./RELATIONSHIP_TAXONOMY.md) |
| **Owning system** | SoR emitter — only this system may emit |
| **Allowed consumers** | Future systems permitted to subscribe |
| **Forbidden consumers** | Systems that must not act on this trigger alone |
| **Required permission checks** | Checks before consumer **acts** (not before emit — emit follows successful authZ) |
| **AI visibility** | Whether/how twin may use trigger signal |
| **Audit requirements** | Activity, domain log, admin retention |
| **Safety constraints** | Non-negotiable automation guards |

---

## Trigger eligibility rules (global)

| # | Rule |
|---|------|
| T1 | **Emit only after** `authorize → execute → emit` succeeds |
| T2 | **Never emit** on rollback, failed PE, or speculative AI intent |
| T3 | **Metadata safe only** — ids, types, roles, timestamps — per event model |
| T4 | **Tenant scope required** on every payload |
| T5 | **Automation consumers derive or notify** — they do not become SoR |
| T6 | **Destructive automation** requires explicit user confirmation tier (see safety model) |
| T7 | **Tag triggers** are entity metadata changes — not relationship edges |

---

## Master concept index

| Framework concept | Primary relationship classes | Concrete event families |
|-------------------|------------------------------|-------------------------|
| `relationship.created` | Access grant, Association, Membership, Assignment, … | `*.shared`, `vlink.*.linked`, `*.member.added`, `*.assigned`, `notebook.link.created` |
| `relationship.updated` | Membership role, Association metadata, Participation | `vlink.updated`, `vlink.member.updated`, `*.event.updated`, `*.rsvpUpdated` |
| `relationship.archived` | Association (container) | `vlink.archived`, `notebook.link.archived` |
| `relationship.restored` | Entity + container restore | `*.restored`, `vlink.restored` |
| `relationship.deleted` | Terminal removal | `vlink.deleted`, `*.permanentlyDeleted`, membership remove |
| `relationship.unlinked` | Association removed; target survives | `vlink.entity.unlinked` |
| `relationship.visibility_changed` | Access grant, Follow visibility, publish | `file.unshared`, `notes.page.unshared`, `place.listing.published`, `place.follow_visibility.updated` |
| `relationship.membership_changed` | Membership | `vlink.member.*`, `business.member.*`, `place.community.joined/left` |
| `relationship.access_revoked` | Access grant, Membership revoke | `file.unshared`, `folder.unshared`, `notes.page.unshared`, `vlink.member.removed` |
| `relationship.tag_added` | Tag (metadata) | `*.updated` with tag diff metadata (planned); `notes.page.updated`, `todo.task.updated` today |
| `relationship.tag_removed` | Tag (metadata) | Same as tag_added — diff-based |
| `relationship.vlink_attached` | Association (membership on container) | `vlink.entity.linked` |
| `relationship.vlink_detached` | Association soft-unlink | `vlink.entity.unlinked` |

---

## Catalog by framework concept

### `relationship.created`

**Definition:** A new relationship edge, grant, membership, assignment, or operational link exists after successful mutation.

| Field | Value |
|-------|-------|
| **Relationship classes** | Access grant, Association, Membership, Assignment, Attachment, Reference, Follow (on accept), Participation |
| **Owning system** | Module or platform SoR per [RELATIONSHIP_OWNERSHIP_MATRIX.md](./RELATIONSHIP_OWNERSHIP_MATRIX.md) |
| **Allowed consumers** | Notifications, webhooks, analytics, search index invalidation (add/refresh), AI suggestion correlation, activity feed, realtime socket |
| **Forbidden consumers** | Direct PE grant without module service; cross-tenant workflow propagation; auto V_Link from suggestion without accept |
| **Required permission checks** | Consumer actions that mutate SoR must re-check PE; notification targets must be event participants only |
| **AI visibility** | Signal for ambient suggestions — **re-fetch** via providers; not grounding fact until user confirms |
| **Audit requirements** | Module activity + domain event where adopted; V_LinkActivity for platform links |
| **Safety constraints** | No auto-share on create; no webhook payload with file/message body |

**Concrete triggers (representative):**

| Concrete type | Class | Owner | Trigger tier |
|---------------|-------|-------|--------------|
| `file.shared` | Access grant | Drive | Standard |
| `folder.shared` | Access grant | Drive | Standard |
| `notes.page.shared` | Access grant | Notes | Standard |
| `vlink.created` | Association + Ownership | Platform | Standard |
| `vlink.entity.linked` | Association | Platform | Standard |
| `vlink.member.added` | Membership | Platform | Standard |
| `business.member.added` | Membership | Business | Elevated (org) |
| `todo.task.assigned` | Assignment | Todo | Standard |
| `notebook.link.created` | Association / Reference | Notebook | Standard |
| `place.connection.accepted` | Follow / communication | Place | Standard |
| `place.community.joined` | Membership | Place | Standard |
| `calendar.event.created` | Participation (implicit attendees) | Calendar | Standard |

**Not trigger-eligible as `created`:** `vlink.suggestion.created` (pending — diagnostic only).

---

### `relationship.updated`

**Definition:** Relationship metadata, role, or non-terminal permission field changed; edge persists.

| Field | Value |
|-------|-------|
| **Relationship classes** | Membership, Association, Participation, Access grant (role change) |
| **Owning system** | Module / platform SoR |
| **Allowed consumers** | Notifications (role change), webhooks, analytics, realtime UI refresh, AI re-fetch signal |
| **Forbidden consumers** | Silent escalation to ADMIN role via automation |
| **Required permission checks** | Actor authorized at emit; consumer mutations re-check PE |
| **AI visibility** | Observe only — no role inference |
| **Audit requirements** | Domain + activity where adopted |
| **Safety constraints** | Role-downgrade notifications allowed; role-upgrade requires human actor at source |

**Concrete triggers:**

| Concrete type | Owner |
|---------------|-------|
| `vlink.updated` | Platform |
| `vlink.member.updated` | Platform |
| `business.updated` (membership context) | Business |
| `calendar.event.updated` | Calendar |
| `calendar.event.rsvpUpdated` | Calendar |
| `place.listing.updated` | Place |
| `todo.task.updated` (assignee change without assign event) | Todo |

---

### `relationship.archived`

**Definition:** Relationship or container intentionally retired without Global Trash on the edge row.

| Field | Value |
|-------|-------|
| **Relationship classes** | Association (V_Link container, NotebookLink) |
| **Owning system** | Platform (V_Link), Notebook module |
| **Allowed consumers** | Notifications (members), search index (exclude container default), analytics, hub UI refresh |
| **Forbidden consumers** | Auto permanent delete; cascade archive to linked entity content |
| **Required permission checks** | V_Link EDITOR+ at source; consumer read membership |
| **AI visibility** | Archived V_Link excluded from pipeline context |
| **Audit requirements** | `vlink.archived`, `notebook.link.archived`, VLinkActivity |
| **Safety constraints** | Archive ≠ trash on attachments; entities retain own lifecycle |

**Concrete triggers:** `vlink.archived`, `notebook.link.archived`

---

### `relationship.restored`

**Definition:** Entity or container returned from trash or archive to active state.

| Field | Value |
|-------|-------|
| **Relationship classes** | All entity-bound classes; V_Link container |
| **Owning system** | Module / platform |
| **Allowed consumers** | Search re-index, notifications, analytics, activity feed |
| **Forbidden consumers** | Auto-restore shares without explicit restore semantics |
| **Required permission checks** | User could restore per module trash rules |
| **AI visibility** | Re-eligible for providers after visibility re-check |
| **Audit requirements** | Restore events + activity |
| **Safety constraints** | Restored entity does not auto-regrant revoked shares |

**Concrete triggers:** `file.restored`, `folder.restored`, `todo.task.restored`, `notes.page.restored`, `vlink.restored`, `chat.conversation.restored`, `calendar.event.restored`, `place.listing.restored`

---

### `relationship.deleted`

**Definition:** Terminal removal of relationship edge or container; or permanent entity delete causing edge destruction.

| Field | Value |
|-------|-------|
| **Relationship classes** | All — terminal state |
| **Owning system** | Module / platform |
| **Allowed consumers** | Search purge, analytics, webhooks, audit retention jobs, storage cleanup orchestration |
| **Forbidden consumers** | Silent cascade delete of unrelated entities; cross-module hard delete without cascade rules |
| **Required permission checks** | Permanent delete authority at source |
| **AI visibility** | **Excluded** from grounding after delete per audit policy |
| **Audit requirements** | Domain event + tombstone retention tier |
| **Safety constraints** | Follow [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md); V_Link soft-unlink on entity permanent delete |

**Concrete triggers:** `vlink.deleted`, `*.permanentlyDeleted`, `business.member.removed`, `chat.conversation.permanentlyDeleted`, `file.deleted` (soft — see lifecycle), `todo.task.permanentlyDeleted`

**Tier:** Destructive — automation workflows require **confirmation tier D2+** (see safety model).

---

### `relationship.unlinked`

**Definition:** Association edge removed; **target entity may still exist** (V_Link attachment, operational unlink).

| Field | Value |
|-------|-------|
| **Relationship classes** | Association |
| **Owning system** | Platform (`VLinkEntity`), modules for operational links |
| **Allowed consumers** | V_Link hub refresh, search (no attachment leak), analytics, AI context invalidation |
| **Forbidden consumers** | Delete target entity; revoke file share (different class) |
| **Required permission checks** | Unlink authority at source |
| **AI visibility** | Remove from V_Link pipeline context immediately |
| **Audit requirements** | `vlink.entity.unlinked`, VLinkActivity |
| **Safety constraints** | Unlink ≠ access revoke |

**Concrete triggers:** `vlink.entity.unlinked` (+ future `notebook.link.removed` when defined)

---

### `relationship.visibility_changed`

**Definition:** Who can see or discover a relationship or public catalog entity changed without full delete.

| Field | Value |
|-------|-------|
| **Relationship classes** | Access grant, Follow visibility, Place publish, Membership visibility flags |
| **Owning system** | Module SoR |
| **Allowed consumers** | Notifications, search index visibilityClass update, webhooks, Place explore refresh |
| **Forbidden consumers** | Expand access without module service |
| **Required permission checks** | Grant/revoke authority at source; index consumer updates partition only |
| **AI visibility** | Re-fetch visibility via module service — not event payload alone |
| **Audit requirements** | Share/unshare/publish events |
| **Safety constraints** | Public catalog change must not expose private workspace tags |

**Concrete triggers:** `file.unshared`, `folder.unshared`, `notes.page.unshared`, `place.listing.published`, `place.follow_visibility.updated`, `place.listing.updated` (visibility fields)

---

### `relationship.membership_changed`

**Definition:** Participant added, removed, or role changed in a container (V_Link, business, community, conversation).

| Field | Value |
|-------|-------|
| **Relationship classes** | Membership |
| **Owning system** | Platform / module |
| **Allowed consumers** | Notifications, realtime, webhooks, analytics |
| **Forbidden consumers** | Auto-add user to V_Link without invite accept; cross-business member injection |
| **Required permission checks** | Inviter authority; target user consent where required |
| **AI visibility** | Member list metadata for containers user belongs to — via provider re-fetch |
| **Audit requirements** | Member add/remove/update events |
| **Safety constraints** | Membership ≠ entity access on V_Link attachments |

**Concrete triggers:** `vlink.member.added`, `vlink.member.updated`, `vlink.member.removed`, `business.member.added`, `business.member.removed`, `place.community.joined`, `place.community.left`, `chat.conversation.created` (initial participants)

---

### `relationship.access_revoked`

**Definition:** Explicit termination of access grant or membership — distinct from entity trash.

| Field | Value |
|-------|-------|
| **Relationship classes** | Access grant, Membership (revoke) |
| **Owning system** | Module / platform |
| **Allowed consumers** | Notifications (affected user), search invalidate, webhooks, session refresh hints |
| **Forbidden consumers** | Delete entity; unlink V_Link as substitute for unshare |
| **Required permission checks** | Revoker authority |
| **AI visibility** | Immediate exclusion from share-scoped providers |
| **Audit requirements** | Unshare / member remove events |
| **Safety constraints** | Notify affected parties where product requires |

**Concrete triggers:** `file.unshared`, `folder.unshared`, `notes.page.unshared`, `vlink.member.removed`, `business.member.removed`

---

### `relationship.tag_added` / `relationship.tag_removed`

**Definition:** Module-local tag string added or removed on host entity — **metadata change**, not a relationship edge.

| Field | Value |
|-------|-------|
| **Relationship class** | Tag (taxonomy metadata class) |
| **Owning system** | Module hosting `tags[]` |
| **Allowed consumers** | Tag Index invalidation (future), module UI refresh, analytics aggregates, AI tag suggestion correlation |
| **Forbidden consumers** | Create V_Link; grant access; persist UserMemoryFact from tag alone |
| **Required permission checks** | Entity update permission at source |
| **AI visibility** | Tags on visible entities via provider only — not standalone automation fact |
| **Audit requirements** | Optional tag diff in `*.updated` metadata; entity activity |
| **Safety constraints** | No global tag SoR write from automation; chat hashtags **not eligible** v1 |

**Concrete triggers (today):** `todo.task.updated`, `notes.page.updated`, `place.listing.updated` — **when metadata includes tag diff** (standardization gap — see § Gaps)

**Planned (documentation target):** `todo.task.tags_changed`, `notes.page.tags_changed` — optional dedicated types in future registry amendment

---

### `relationship.vlink_attached`

**Definition:** Entity attached to V_Link container (`VLinkEntity` created, active).

| Field | Value |
|-------|-------|
| **Relationship class** | Association |
| **Owning system** | Platform `vlinkService` |
| **Allowed consumers** | V_Link hub UI, notifications (optional), search (container only), AI pipeline invalidation, analytics |
| **Forbidden consumers** | Index attachment body; auto-grant file read; workflow that treats attach as share |
| **Required permission checks** | `userCanLinkEntity` + V_Link EDITOR+ at emit |
| **AI visibility** | Re-fetch via `vlinkPipelineContextService` + resolver — not event as SoR |
| **Audit requirements** | `vlink.entity.linked`, VLinkActivity |
| **Safety constraints** | Attach ≠ access; pending suggestions excluded |

**Concrete trigger:** `vlink.entity.linked`

---

### `relationship.vlink_detached`

**Definition:** Entity detached from V_Link (`unlinkedAt` set or row removed per lifecycle).

| Field | Value |
|-------|-------|
| **Relationship class** | Association |
| **Owning system** | Platform |
| **Allowed consumers** | Hub refresh, search, AI invalidation, analytics |
| **Forbidden consumers** | Trash entity; revoke shares |
| **Required permission checks** | Unlink authority |
| **AI visibility** | Remove from vlink context |
| **Audit requirements** | `vlink.entity.unlinked` |
| **Safety constraints** | Permanent entity delete emits unlink — consumer must handle idempotent duplicate |

**Concrete trigger:** `vlink.entity.unlinked`

---

## Domain quick reference

| Domain | Created | Revoked / visibility | Deleted / trash | V_Link | Tags |
|--------|---------|----------------------|-----------------|--------|------|
| **Drive** | `file.shared`, `folder.shared` | `file.unshared` | `file.deleted`, `*.permanentlyDeleted` | via platform | N/A v1 |
| **Chat** | `chat.message.sent`, `chat.conversation.created` | participant leave (activity) | `chat.conversation.trashed` | via platform | Forbidden v1 |
| **Calendar** | `calendar.event.created` | RSVP updates | `calendar.event.trashed` | via platform | N/A v1 |
| **Todo** | `todo.task.assigned` | `todo.task.unassigned` | `todo.task.trashed` | via platform | `todo.task.updated` |
| **Notes** | `notes.page.shared`, `notebook.link.created` | `notes.page.unshared` | `notes.page.trashed` | via platform | `notes.page.updated` |
| **Place** | `place.connection.accepted`, `place.community.joined` | visibility updates | listing trash/delete | via platform | listing `updated` |
| **Business** | `business.member.added` | `business.member.removed` | — | via platform | N/A |
| **V_Link** | `vlink.created`, `vlink.entity.linked`, `vlink.member.added` | member removed | `vlink.deleted`, `vlink.entity.unlinked` | native | N/A |

---

## Trigger tiers (automation severity)

| Tier | Concepts | Default automation posture |
|------|----------|----------------------------|
| **T0 — Observability** | All triggers | Analytics, audit, debug — no side effects |
| **T1 — Notify / refresh** | created, updated, membership_changed | Notifications, sockets, index invalidate |
| **T2 — Suggest** | created, vlink_attached, tag_added | AI suggestions — user accept required |
| **T3 — External webhook** | created, access_revoked, deleted (business scope) | Webhook delivery — signed, tenant-scoped |
| **T4 — Workflow (future)** | created, updated | Module service calls only — confirmation rules apply |
| **T5 — Destructive** | deleted, access_revoked (bulk) | **Human confirmation required** — no AI auto-exec |

---

## Non-trigger-eligible events

| Event / signal | Why excluded |
|--------------|--------------|
| `vlink.suggestion.created` | Pending — not persisted relationship |
| Query-time `entityLinking` inference | Ephemeral — not SoR |
| Failed authorization attempts | No mutation |
| Module activity without domain event | May duplicate — subscribe to domain when available |
| Chat hashtag token match | Not tag SoR |
| Webhook delivery log rows | Delivery artifact — not relationship |
| Search index internal rows | Derived — not lifecycle |

---

## Gaps (documentation — not Phase 2C implementation)

| Gap | Recommendation |
|-----|----------------|
| Tag diff not standardized on `*.updated` | Add optional `tagsAdded`/`tagsRemoved` metadata contract |
| TaskFileLink / TaskDependency | Optional `todo.task.file_linked`, `todo.dependency.added` |
| Attendee-only calendar invite | `calendar.attendee.added` when automating |
| NotebookLink delete | `notebook.link.removed` symmetry with created |
| Unified admin concept → type map UI | Derive from this catalog |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md) | Safety rules |
| [AUTOMATION_CONSUMER_BOUNDARY.md](./AUTOMATION_CONSUMER_BOUNDARY.md) | Who may consume |
| [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) | AI-specific rules |
| [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | Registry implementation |

**Last updated:** 2026-06-14
