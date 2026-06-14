# Relationship Audit and Retention Policy

**Program:** Vssyl Relationship Framework  
**Phase:** 1C — Lifecycle architecture  
**Status:** Canonical source of truth  
**Date:** 2026-06-14  
**Lifecycle:** [RELATIONSHIP_LIFECYCLE_MATRIX.md](./RELATIONSHIP_LIFECYCLE_MATRIX.md)  
**Cascades:** [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md)  
**Events:** [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md)

> **Scope:** Audit, retention, historical visibility, and compliance **expectations** for relationship data. Does not define storage implementation, cron jobs, or legal hold product features.

---

## Purpose

Relationship mutations often matter **after** the edge or entity is gone: who shared what, when a member was removed, whether AI grounded on confirmed links. This policy defines:

- What must be auditable  
- How long relationship **history** should survive  
- What remains visible to AI, search, and admins  
- What must **never** remain visible after deletion  

---

## Constitutional principles

| # | Principle |
|---|-----------|
| A1 | **Authorize → execute → emit** — no audit event on failed/unauthorized actions |
| A2 | **Activity vs analytics** — immutable activity describes what happened; analytics are derived |
| A3 | **Relationship row ≠ audit row** — soft-unlinked V_Link retains audit; notification row is not SoR |
| A4 | **Tenant isolation in audit** — cross-business leakage in logs is a P0 violation |
| A5 | **AI visibility ⊂ user visibility** — retention for AI never exceeds user authorization at query time |
| A6 | **Secrets never retained** in relationship audit metadata |

---

## Audit channels (existing platform)

| Channel | Owns | Relationship relevance |
|---------|------|------------------------|
| **Module activity** | `emitModuleActivityEvent` | User-visible feed: share, assign, trash, restore |
| **Domain events** | `emitDomainEvent` | Platform fan-out: `file.shared`, `vlink.entity.linked`, … |
| **V_Link activity** | `VLinkActivity` | Container-scoped immutable history |
| **Admin audit log** | Admin portal classifications | Governance actions (ownership transfer) |
| **Pipeline traces** | AI orchestration diagnostics | Why AI saw/did not see relationships |
| **Webhook delivery log** | `WebhookDeliveryAttempt` | Subscription delivery — not relationship SoR |

Phase 1C does **not** mandate a new unified relationship audit store.

---

## Retention tiers

| Tier | Duration (default expectation) | Applies to |
|------|-------------------------------|------------|
| **R0 — Operational** | Life of active edge | Active relationship rows |
| **R1 — Soft-delete grace** | Until restore window closes | `trashedAt` entities; soft-unlinked V_Link rows |
| **R2 — Audit retention** | **Indefinite** unless compliance program overrides | Domain events, module activity, V_Link activity |
| **R3 — Derived analytics** | Per warehouse policy (90d–7y typical) | Aggregates, BI — no PII in partner analytics |
| **R4 — Ephemeral** | Request/session only | `entityLinking` inference, resolver cache |
| **R5 — Purge on permanent delete** | Immediate to 30d async | Notification bodies, delivery logs (configurable) |

**Compliance note:** Enterprise/legal hold programs may extend R1/R5 — document as product overlay, not Phase 1C implementation.

---

## Per-class audit and retention

### Ownership

| Aspect | Policy |
|--------|--------|
| **Audit required** | Create, transfer, trash, permanent delete of entity |
| **Survives entity delete** | Yes — activity + domain events with entity id |
| **AI after delete** | **Never** — entity content unavailable; event metadata admin-only |
| **Search after delete** | Removed from search index; audit not in user search |

### Membership

| Aspect | Policy |
|--------|--------|
| **Audit required** | Add, remove, role change, accept invite |
| **Survives member remove** | Yes — `business.member.removed`, V_Link `member_removed` |
| **AI after remove** | Ex-member excluded from container providers immediately |
| **Search after remove** | Roster no longer lists member; audit admin-only |

### Assignment

| Aspect | Policy |
|--------|--------|
| **Audit required** | Assign, reassign, unassign |
| **Survives task delete** | Activity retains assignee id in metadata |
| **AI after delete** | Task providers exclude trashed/deleted tasks |
| **Search after delete** | Task removed; assignment history not user-searchable |

### Access grant

| Aspect | Policy |
|--------|--------|
| **Audit required** | Share, unshare, permission change |
| **Survives revoke** | **Yes** — `file.shared`, `file.unshared`, share activity |
| **Survives entity permanent delete** | Audit yes; grant row deleted |
| **AI after revoke** | Immediate exclusion from visibility service |
| **Search after revoke** | Shared item drops from recipient search |

### Association (V_Link, NotebookLink, TaskFileLink)

| Aspect | Policy |
|--------|--------|
| **Audit required** | Link, unlink, accept/reject suggestion |
| **V_Link soft-unlink** | **Row retained** with `unlinkedAt`; `VLinkActivity` + `vlink.entity.unlinked` |
| **Survives target trash** | Edge retained; audit unchanged |
| **Survives target permanent delete** | Soft-unlink audit; no entity content in audit metadata |
| **AI after target delete** | Resolver excludes or redacts; no filename/title leak for restricted |
| **Search** | V_Link title searchable; restricted entity titles **never** in search |

### Reference

| Aspect | Policy |
|--------|--------|
| **Audit required** | Create/remove reference on governed paths |
| **Survives target delete** | Orphan reference may exist; audit of original link retained |
| **AI** | Dereference fails closed — no target content |

### Attachment

| Aspect | Policy |
|--------|--------|
| **Audit required** | Message send with attachment metadata |
| **Survives file delete** | Message audit retains file id; not file bytes |
| **AI** | No file analysis without Drive visibility |

### Dependency

| Aspect | Policy |
|--------|--------|
| **Audit required** | Add/remove dependency |
| **Survives task delete** | Dependency row deleted on permanent delete; activity may retain ids |

### Hierarchy / containment

| Aspect | Policy |
|--------|--------|
| **Audit required** | Reparent, move, nest |
| **Survives delete** | Move events retain prior parent id in metadata |

### Participation

| Aspect | Policy |
|--------|--------|
| **Audit required** | RSVP, invite, remove attendee |
| **Survives event delete** | Attendee rows deleted; calendar activity/events retain history |

### Follow

| Aspect | Policy |
|--------|--------|
| **Audit required** | Follow/unfollow in Place activity feed |
| **Survives listing delete** | Follow row may delete or orphan per Place policy |

### Subscription

| Aspect | Policy |
|--------|--------|
| **Audit required** | Webhook create/delete; delivery attempts |
| **Retention** | Delivery log R5; subscription secret **never** in audit |

### Visibility settings

| Aspect | Policy |
|--------|--------|
| **Audit required** | Optional — privacy toggle |
| **AI** | Must re-read settings each orchestration — no stale cache across sessions |

### Communication

| Aspect | Policy |
|--------|--------|
| **Audit required** | Send, edit, delete message; trash conversation |
| **Survives message delete** | `chat.message.sent` domain event; soft-deleted message policy module-specific |
| **AI** | Deleted messages excluded from recent context |

### Tag

| Aspect | Policy |
|--------|--------|
| **Audit required** | Optional in entity update activity |
| **Survives entity delete** | Tags destroyed with entity; not separately retained |

### Preference

| Aspect | Policy |
|--------|--------|
| **Audit required** | Not required |
| **Retention** | Low priority |

### AI context

| Aspect | Policy |
|--------|--------|
| **Audit required** | Create, trash, promote memory; V_Link suggestion accept/reject |
| **Survives user delete** | Memory trashed/deleted per AI policy |
| **Inference** | **R4 ephemeral** — trace may note inference occurred without storing edge |
| **Pending suggestions** | **Never visible to AI**; audit accept/reject only |

---

## Historical visibility matrix

| Consumer | Active relationships | Soft-trashed entity edges | Soft-unlinked / revoked | Permanent delete |
|----------|---------------------|---------------------------|-------------------------|------------------|
| **Owner UI** | Full | Degraded + restore affordance | Hidden or historical tab | Gone |
| **Collaborator UI** | Per grant/membership | Per module trash model | Revoked grants hidden | Gone |
| **Admin audit** | Full metadata (no secrets) | Full | Full | Event tombstone |
| **AI twin** | Visibility service | Restricted/redacted | Excluded | **Excluded** |
| **Global search** | Authorized hits | Policy per module | N/A | Removed |
| **Analytics** | Derived from events | Event stream only | Event stream | Aggregates only |
| **Partner webhook** | Payload at event time | Event if subscribed | Event if subscribed | No retroactive payload |

---

## What must survive deletion

| Data | Survive permanent entity delete? | Rationale |
|------|-----------------------------------|-----------|
| Domain event record | **Yes** | Platform audit trail |
| Module activity entry | **Yes** | User/org activity feed history |
| VLinkActivity | **Yes** | Container audit |
| VLinkEntity row (unlinked) | **Yes** (soft-unlinked) | Link history without content leak |
| FilePermission row | **No** | Access grant terminates with entity |
| Notification row | **Optional R5** | UX history; not SoR |
| UserMemoryFact about deleted entity | **User must update** — stale ok until trash | AI quality |
| Inferred entity link | **No** | Never persisted |

---

## What must never remain visible

| Data | After action | Rule |
|------|--------------|------|
| File content | Revoke share | Recipient AI + UI deny |
| Event title | V_Link member without calendar access | Redacted placeholder only |
| Chat message body | User leaves conversation | Socket + API deny |
| Pending V_Link suggestion | Any | Excluded from AI grounding |
| Cross-tenant edge | Any | Fail closed |
| Webhook signing secret | Any audit | Forbidden |
| Restricted entity filename in search | V_Link search | Type label only |

---

## Compliance implications (architectural)

| Topic | Expectation |
|-------|-------------|
| **Right to erasure** | Permanent delete cascades per [RELATIONSHIP_CASCADE_RULES.md](./RELATIONSHIP_CASCADE_RULES.md); audit may retain **metadata** tombstones — legal review for jurisdiction |
| **Access reviews** | Business membership audit via `BusinessMember` history + events |
| **Sharing audit** | File/note share events satisfy "who had access" questions |
| **AI explainability** | Pipeline traces document relationship sources used — not user-facing by default |
| **Data minimization** | Relationship audit metadata: ids + action + timestamp — not full content payloads |
| **Retention schedules** | R5 purge jobs for notifications/delivery logs — document before implementation |

---

## AI-specific retention rules

```
At orchestration time:
  1. Load only active, authorized relationship edges
  2. Apply resolver for association lists
  3. Exclude trashed entities unless module explicitly includes trashed scope
  4. Exclude soft-unlinked V_LinkEntity (unlinkedAt IS NOT NULL)
  5. Exclude pending VLinkSuggestion
  6. Do not persist inference as UserMemoryFact without user promotion
```

| Source | Retained for future AI sessions? |
|--------|----------------------------------|
| UserMemoryFact (explicit) | Yes until trash/expire |
| Confirmed V_Link | Yes while link active (not unlinked) |
| Module provider snapshot | Cache TTL only (R4) |
| entityLinking inference | **No** |
| Pipeline trace | Admin diagnostics R2 |

---

## Governance

| Change | Gate |
|--------|------|
| Shorten R2 audit retention | Compliance + architecture review |
| New relationship class audit rule | Update lifecycle matrix + this doc |
| AI visibility exception | AI Platform Constitution review |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [RELATIONSHIP_EVENT_MODEL.md](./RELATIONSHIP_EVENT_MODEL.md) | Event vocabulary |
| [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | Platform event bus |
| [GLOBAL_TRASH.md](./GLOBAL_TRASH.md) | Trash retention window |

**Last updated:** 2026-06-14
