# Domain Event Replay Review

**Program:** Platform Kernel — Wave 2 Package 2  
**Date:** 2026-06-23  
**Status:** Governance analysis — **no implementation**

---

## 1. Current durability model

| Mechanism | Exists | Role |
|-----------|:------:|------|
| In-process `domainEventBus` | ✅ | Ephemeral fan-out |
| `domain_event_recorded` Log rows | ✅ | Audit mirror (activity subscriber) |
| Out-of-process queue | ❌ | — |
| Dead-letter queue | ❌ | — |
| Subscriber retry | ❌ | Failures logged only |
| Admin replay API | ❌ | — |
| Re-emit from Log | ❌ | Not implemented |

**Implication:** Domain events are **signals**, not an event-sourcing store. The Log mirror supports audit and future replay **source material** but is not a replay engine today.

---

## 2. Failure modes without replay

| Scenario | Impact | Current mitigation |
|----------|--------|-------------------|
| Process crash after DB commit, before subscribers | Lost fan-out for that emit | None — **gap** |
| Subscriber throws mid-chain | Later subscribers still run; failed one skipped | Isolated try/catch |
| Webhook delivery failure | External system misses event | Log only |
| AI learning stub failure | Missing learning signal | Log only |
| Socket disconnect | Actor misses realtime event | Client refresh |

**L2 assessment:** Acceptable with documented limits + subscriber honesty.  
**L3 assessment:** **Not acceptable** without durability and recovery.

---

## 3. Replay necessity by maturity tier

| Tier | Replay required? | Rationale |
|------|------------------|-----------|
| **L1** (current honest) | No | Audit mirror emerging |
| **L2 candidate** | **No** | Honest subscriber registry + adoption + operation matrix sufficient |
| **L2 certified** | **No** | Certification checklist (Wave 1) did not list replay as L2 gate |
| **L3** | **Yes** | Durability story mandatory — subscriber recovery, webhook reliability, ops diagnostics |
| **L4** | Partial | Full event sourcing / rebuild — **not kernel infrastructure goal** |

### Formal answers

| Question | Answer |
|----------|--------|
| Is replay required for L2? | **No** |
| Is replay required for L3? | **Yes** |
| Is replay required for L4? | **Partial** — only if kernel designated reference implementation (unlikely) |

---

## 4. Replay design options (L3 horizon — not authorized)

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Log re-emit** | Admin API reads `domain_event_recorded`, re-publishes to bus | Low infra; uses existing mirror | Not transactional with emit; schema coupling |
| **B. Transactional outbox** | Outbox table in same TX as mutation; worker publishes | Strong durability | Schema + worker infra |
| **C. Message queue** | Publish to Pub/Sub / Redis stream | Scalable fan-out | New operational surface |
| **D. Hybrid** | Outbox + queue for external consumers | Best for webhooks | Highest complexity |

**Charter recommendation for L3:** **Option D-lite** — transactional outbox for platform subscribers + async queue for webhooks. **Defer decision** to PK-W5-DE-4 planning.

---

## 5. Timing recommendation

| Phase | Replay work |
|-------|-------------|
| **PK-W3-DE-1** (Subscriber honesty) | **None** |
| **PK-W3-DE-2** (Adoption) | **None** |
| **PK-W3-DE-3** (Consumer expansion) | **None** |
| **PK-W5-DE-4** (L3 durability) | Design + implement outbox/replay |
| **Search / Workflow programs** | May require indexed event consumption — coordinate with DE-4 |

**Verdict:** **Replay should wait** until L2 certification candidacy is achieved and L3 program authorized.

---

## 6. What L2 requires instead of replay

| Requirement | Deliverable |
|-------------|-------------|
| Audit trail | `domain_event_recorded` Log rows (existing) |
| Subscriber honesty | Remove/gate stubs (DE-1) |
| Documented failure model | Subscriber operation matrix (DE-1) |
| Adoption completeness | HR facade + registry audit (DE-2) |
| Test coverage | Subscriber integration tests per retained consumer |
| No false capabilities | Search/workflow stubs unregistered |

---

## 7. Replay API scope sketch (L3 — future only)

| Capability | Purpose |
|------------|---------|
| `POST /api/admin/domain-events/replay` | Re-drive subscribers for event id range |
| `GET /api/admin/domain-events/dead-letter` | List failed subscriber deliveries |
| Idempotency keys | Prevent duplicate notifications/webhooks on replay |

**Out of scope for all Wave 2/3 DE packages.**

---

## 8. Relationship to Platform Activity

| Layer | Replay |
|-------|--------|
| **Activity** (`module_activity_event`) | Read via `platformActivityQueryService` — **no replay needed** for L2; historical Log rows are SoT |
| **Domain Events** | Emit-time fan-out — replay relevant for **missed subscribers**, not for activity feed reads |

Activity and Domain Events replay concerns are **orthogonal**. ACT-R1 closed activity **read** debt; DE replay addresses **write-time fan-out durability**.

---

**Last updated:** 2026-06-23
