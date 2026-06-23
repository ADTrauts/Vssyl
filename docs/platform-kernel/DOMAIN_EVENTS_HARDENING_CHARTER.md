# Domain Events Hardening Charter

**Program:** Platform Kernel Modernization — Wave 2 Package 2  
**Date:** 2026-06-23  
**Status:** Constitutional charter — **no implementation authorized**  
**Precondition:** ACT-R1 Activity read migration **complete** (PK-W3-IMP-1/3)

**Related:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md); [DOMAIN_EVENTS_AUDIT.md](./DOMAIN_EVENTS_AUDIT.md) (Wave 1)

---

## 1. Executive mandate

Establish the **authoritative future-state architecture** and **sequenced modernization program** for Platform Domain Events — the kernel's cross-cutting mutation fan-out layer.

Activity modernization closed the read-path debt. **Domain Events remain the primary kernel weakness**: strong taxonomy, uneven adoption, dishonest production stubs, and no durability/replay story.

This charter authorizes **governance and planning only**. Implementation requires a separate council/engineering authorization (PK-W3-DE-* packages).

---

## 2. Current state (post ACT-R1)

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| Taxonomy / registry | **L2** | 180 typed contracts; sanitization; registry tests |
| Emit adoption | **L1–L2** | L3 modules strong; HR gap; registry >> verified emit sites |
| Bus / transport | **L1** | In-process `EventEmitter`; no queue |
| Subscribers | **L1** | 7 real handlers + **2 production stubs** |
| Durability / replay | **L0** | Log mirror only; no re-delivery |
| Documentation | **L2** | `DOMAIN_EVENTS.md`; no subscriber operation matrix |

**Blended honest rating:** **L1** (stubs in production registry block L2 honesty).

**Platform Activity (sibling):** **L2 candidate** after ACT-R1 — kernel combined posture **L1–L2**.

---

## 3. Future-state architecture (target L2)

### 3.1 Principles

1. **Emit after success** — `authorize → execute → emitDomainEvent` (never on failure).
2. **Registry-first** — new types require `DOMAIN_EVENT_CONTRACTS` before emit.
3. **Module facades** — each major module exposes `*DomainEventService.ts` (or documented platform-emitter delegation for Drive).
4. **Subscriber honesty** — no registered no-op stubs in production without explicit feature-flag gating.
5. **Activity vs domain events** — feed-visible actions use `emitModuleActivityEvent`; cross-cutting facts use `emitDomainEvent`. Dual emission is valid when both contracts apply.
6. **Fault isolation** — subscriber failures never roll back mutations (current behavior preserved).

### 3.2 Target read/write model (L2)

```
Mutation (module service)
  → *DomainEventService / domainEventEmitters
  → emitDomainEvent (sanitize)
  → domainEventBus (in-process)
  → subscribers (documented matrix)
  → activity subscriber → Log domain_event_recorded
```

**L2 does not require** out-of-process queues or replay APIs. **L3 does.**

### 3.3 Target subscriber registry (L2)

| Subscriber | L2 disposition |
|------------|----------------|
| `activity` | Retain — audit mirror |
| `socket` | Retain — actor realtime |
| `notification` | Retain + expand mapping (phased) |
| `ai_event_consumer` | Retain — document narrow scope |
| `webhook_subscriptions` | Retain |
| `calendar_dashboard_bootstrap` | Retain |
| `workspace_dashboard_seed` | Retain |
| `search_index_stub` | **Remove from default registry** OR gate behind `SEARCH_INDEX_V2` flag |
| `workflow_router_stub` | **Remove from default registry** OR gate behind `WORKFLOW_ROUTER` flag |

---

## 4. Required questions (charter answers)

| # | Question | Answer |
|---|----------|--------|
| 1 | How many domain event types exist? | **180** (`DOMAIN_EVENT_TYPES` / `DOMAIN_EVENT_CONTRACTS`) |
| 2 | How many active subscribers exist? | **9** registered in `registerDomainEventSubscribers.ts` |
| 3 | Which subscribers are production-ready? | **5 full:** activity, socket, webhook; **2 narrow:** dashboard bootstrap, workspace seed; **2 partial:** notification (3 types), AI (6 types) |
| 4 | Which subscribers are stubs? | **`search_index_stub`**, **`workflow_router_stub`** |
| 5 | Which subscribers should be removed? | **Both stubs** from default production registration (or feature-flag only) |
| 6 | Which subscribers should be implemented? | Search index consumer (**Search program**); workflow router (**Workflow program**); expanded notification + AI mappings (kernel-adjacent) |
| 7 | Does `search_index_stub` have a constitutional future? | **Yes, deferred** — belongs to **Search modernization**, not kernel L2. Kernel must not pretend it exists. |
| 8 | Does `workflow_router_stub` have a constitutional future? | **Yes, deferred** — belongs to **Workflow / Tier-4 automation** program. Unregister until canonical router ships. |
| 9 | Which modules lack domain event facades? | **HR** (critical); **Analytics** (intentional activity-only); **Admin Portal** (consumer-only surface); **Drive** (uses platform `domainEventEmitters` — document as delegated facade) |
| 10 | Which modules emit activity but not domain events? | **HR** (all paths); **Analytics** (view telemetry — OK); partial **Business** activity-only helpers alongside controller domain emits |
| 11 | Is replay required for L2? | **No** |
| 12 | Is replay required for L3? | **Yes** — durability + subscriber recovery story required |
| 13 | Updated Domain Events maturity? | **L1** honest; **L2 candidate** after subscriber honesty + adoption audit |
| 14 | Earliest certification posture? | **Domain Events L2 evaluation** after PK-W3-DE-1 + DE-2 (~post-hardening G-score ~78%+) |
| 15 | Recommended implementation package? | **PK-W3-DE-1** Subscriber Honesty + Operation Matrix (see modernization program) |

---

## 5. Formal decision

### **Ratified: Option D — Hybrid sequencing**

| Phase | Focus | Rationale |
|-------|-------|-----------|
| **DE-1** | **Subscriber hardening first** | Fastest honesty gain; unblocks L2 G3/G8 |
| **DE-2** | **Adoption closure** | HR facade + registry-vs-emit CI audit |
| **DE-3** | **Consumer expansion** | Notification/AI mapping (optional L2+) |
| **DE-4 (L3)** | **Durability / replay** | Queue or outbox; admin replay API — **not L2** |

**Rejected for L2 path:**
- **Option A only** — ignores HR adoption debt.
- **Option B Replay first** — over-engineers before subscriber honesty.
- **Option C Adoption only** — leaves stub dishonesty in production registry.

---

## 6. Stop conditions (honored)

- No subscriber implementation
- No replay APIs
- No queues / storage
- No Activity changes
- No Search / Realtime implementation
- No certification execution

---

## 7. Deliverables map

| Document | Purpose |
|----------|---------|
| [DOMAIN_EVENT_SUBSCRIBER_AUDIT.md](./DOMAIN_EVENT_SUBSCRIBER_AUDIT.md) | Subscriber inventory + classification |
| [DOMAIN_EVENT_ADOPTION_MATRIX.md](./DOMAIN_EVENT_ADOPTION_MATRIX.md) | Per-module facade/emission/gaps |
| [DOMAIN_EVENT_REPLAY_REVIEW.md](./DOMAIN_EVENT_REPLAY_REVIEW.md) | Replay necessity by maturity tier |
| [DOMAIN_EVENT_MODERNIZATION_PROGRAM.md](./DOMAIN_EVENT_MODERNIZATION_PROGRAM.md) | Implementation packages + sequencing |
| [PLATFORM_KERNEL_W2P2_EXECUTIVE_SUMMARY.md](./PLATFORM_KERNEL_W2P2_EXECUTIVE_SUMMARY.md) | Leadership summary |

---

## 8. Success criteria

- [x] Complete modernization charter produced
- [x] Stub disposition decided (remove or gate — not retain as silent no-ops)
- [x] Replay timing decided (L3, not L2)
- [x] Fastest L2 path identified (subscriber honesty + adoption)
- [x] Certification impact assessed (G1–G9)

---

**Last updated:** 2026-06-23
