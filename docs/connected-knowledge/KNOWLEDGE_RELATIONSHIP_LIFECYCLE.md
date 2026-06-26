# Knowledge Relationship Lifecycle

**Program:** Connected Knowledge Platform — Phase 0B  
**Date:** 2026-06-25  
**Status:** Constitutional lifecycle — **no implementation**

**Authority:** [KNOWLEDGE_CONSTITUTION.md](./KNOWLEDGE_CONSTITUTION.md) · [RELATIONSHIP_LIFECYCLE_MATRIX.md](../architecture/RELATIONSHIP_LIFECYCLE_MATRIX.md)

---

## 1. Purpose

Define **state transitions** for knowledge — how evidence becomes governed relationships and how relationships age, archive, and revoke.

Complements Relationship Framework lifecycle with **knowledge tier promotion** semantics.

---

## 2. Lifecycle states (knowledge edge)

| State | Tier | Description |
|-------|:----:|-------------|
| **evidence** | L6 | Transient retrieval/search hit |
| **inferred** | L4 | Request-scoped synthesis |
| **suggested** | L5 | Pending user governance |
| **active** | L2–L3 | Persisted governed knowledge |
| **degraded** | L1/L2 | Partner unverified or stale hydrate |
| **archived** | L2–L3 | Container archived; edges persist but hidden from default views |
| **revoked** | — | Partner or admin revoked — not visible |
| **removed** | — | Unlinked or entity deleted |

---

## 3. Master transition diagram

```
                    ┌──────────────────────────────────────┐
                    │     TRANSIENT RETRIEVAL EVIDENCE (L6) │
                    └───────────────┬──────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      AI INFERENCE (L4)         │◄── entityLinking / synthesis
                    └───────────────┬───────────────┘
                                    │ propose
                    ┌───────────────▼───────────────┐
                    │   SUGGESTED KNOWLEDGE (L5)     │◄── VLinkSuggestion PENDING
                    └───────┬───────────────┬───────┘
                            │ accept        │ reject
              ┌─────────────▼───┐           └──► [destroyed]
              │                 │
    ┌─────────▼─────────┐  ┌────▼────────────────┐
    │ CONFIRMED AI (L3) │  │ EXPLICIT USER (L2)  │◄── manual link / module FK
    └─────────┬─────────┘  └──────┬──────────────┘
              │                   │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │  ACTIVE KNOWLEDGE  │
              └─────────┬─────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐
    │ archive │   │ degraded  │  │ removed │
    └─────────┘   └─────┬─────┘  └─────────┘
                        │ revalidate
                        └──► active
```

---

## 4. Transition table

| From | Event | To | Tier change | Actor |
|------|-------|-----|-------------|-------|
| L6 evidence | `propose_suggestion` | L5 suggested | L6→L5 | system/AI |
| L6 evidence | `user_manual_link` | L2 active | L6→L2 | user |
| L4 inferred | `propose_suggestion` | L5 suggested | L4→L5 | system/AI |
| L4 inferred | `request_end` | (destroyed) | — | system |
| L5 suggested | `user_accept` | L3 active | L5→L3 | user |
| L5 suggested | `user_reject` | (destroyed) | — | user |
| L5 suggested | `ttl_expire` | (destroyed) | — | system |
| L2 active | `user_unlink` | removed | — | user |
| L2 active | `entity_delete` | removed (soft unlink) | — | lifecycle hook |
| L3 active | `user_unlink` | removed | — | user |
| L2–L3 | `vlink_archive` | archived | tier unchanged | user |
| L1 active | `delegate_fail` | degraded | confidence C4 | system |
| L1 degraded | `delegate_ok` | active | confidence C1 | partner |
| L1/L2 | `partner_revoke` | revoked | — | partner |
| archived | `vlink_restore` | active | — | user |
| removed | — | — | terminal | — |

---

## 5. Promotion rules (evidence → knowledge)

| Rule ID | Rule |
|---------|------|
| **KL-1** | L6 → L2 allowed only via `user_manual_link` or module persist — not automation |
| **KL-2** | L6 → L3 allowed only via `user_accept` on suggestion with provenance chain |
| **KL-3** | L4 → L2/L3 requires L5 or direct user action — no skip |
| **KL-4** | Retrieval batch accept creates one `VLinkEntity` per accepted pair |
| **KL-5** | Promotion records `verificationHistory` per provenance standard |

---

## 6. Module-native lifecycle

Module FK edges (containment, assignment) are **born at L2** — no promotion path.

| Event | Effect |
|-------|--------|
| Task moved to project | New L2 edge |
| Task deleted | Edge removed |
| File trashed | V_Link soft-unlink; module edges persist until permanent delete |

Module lifecycle **does not** pass through L5/L6.

---

## 7. User memory fact lifecycle

| State | Tier |
|-------|:----:|
| Created explicit | L3 C1 |
| Created by learning | L4 C3 |
| User edits to save | L3 C1 |
| Expiry reached | removed |
| User deletes | removed |

Memory facts are **not** relationship edges — parallel lifecycle.

---

## 8. Partner edge lifecycle

| State | Condition |
|-------|-----------|
| active L1 | Delegate hydrate + accessCheck pass |
| degraded | TTL exceeded or intermittent failure |
| revoked | Partner `revoke` webhook or cert suspension |
| removed | User unlinks or partner entity deleted notification |

Platform stores edge; partner owns entity truth.

---

## 9. Archive vs trash vs unlink

| Action | V_Link container | VLinkEntity | Module entity |
|--------|------------------|-------------|---------------|
| **Archive V_Link** | ARCHIVED | persist, hidden default | unchanged |
| **Trash entity** | link persists | `unlinkedAt` on permanent delete | trashedAt |
| **Unlink** | active | `unlinkedAt` set | unchanged |
| **Global trash restore** | — | re-link optional | restored |

Unchanged from [RELATIONSHIP_CASCADE_RULES.md](../architecture/RELATIONSHIP_CASCADE_RULES.md).

---

## 10. Historical archive

**Historical archive** = knowledge no longer in default federation views but retained in SoR for audit/compliance.

| Artifact | Archive behavior |
|----------|------------------|
| Archived V_Link | Edges queryable with `includeArchived` |
| Activity | Immutable — always historical |
| Revoked partner edge | Retained in SoR with revoked flag — not in bundle |
| Rejected suggestion | Not retained (destroyed) |
| L6/L4 | Never archived — never stored |

---

## 11. Notifications at lifecycle boundaries

| Transition | Notification type (example) |
|------------|----------------------------|
| L5 created | `vlink_suggestion_created` |
| L5 → L3 | `vlink_entity_linked` |
| L2 unlink | `vlink_entity_unlinked` |
| L1 revoked | `partner_knowledge_revoked` (future) |

Notifications announce transitions — they do not constitute knowledge.

---

## 12. Domain events

| Event | Lifecycle effect |
|-------|------------------|
| `vlink.entity.linked` | Invalidate bundle cache |
| `vlink.suggestion.created` | No bundle change until accept |
| `drive.file.permanently_deleted` | Trigger unlink hook |
| `partner.entity.revoked` | Move edge to revoked |

Events signal **re-fetch** — not storage.

---

## 13. Forbidden transitions

| Transition | Reason |
|------------|--------|
| L6 → L3 without L5 accept | KL-2 |
| Auto L6 → L2 on high search rank | KL-1 |
| L5 → active without user | KC-2 |
| Revived rejected suggestion | Must create new L5 |
| Inference → module FK | Module service only |

---

## 14. References

- [KNOWLEDGE_TRUST_MODEL.md](./KNOWLEDGE_TRUST_MODEL.md)
- [VLINK_EVOLUTION_STRATEGY.md](./VLINK_EVOLUTION_STRATEGY.md)
- [KNOWLEDGE_PROVENANCE_STANDARD.md](./KNOWLEDGE_PROVENANCE_STANDARD.md)
