# Analytics Capability — Event Pipeline Review

**Program:** Analytics Capability Phase 0B — Strategic Scope Lock  
**Date:** 2026-06-22  
**Status:** Architecture review only — **no implementation**

**Authority:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md); [RELATIONSHIP_ANALYTICS_MODEL.md](../architecture/RELATIONSHIP_ANALYTICS_MODEL.md); [RELATIONSHIP_EVENT_MODEL.md](../architecture/RELATIONSHIP_EVENT_MODEL.md)

---

## 1. Executive conclusion

The current analytics event pipeline is a **placeholder** (`placeholderAnalyticsDomainEventConsumer`) registered on every domain event with **no persistence, no rollups, no invalidation**.

**Phase 0B decision:** The placeholder **must be removed or replaced** before L2 certification — it creates false maturity signal.

**Strategic path (Hybrid C):**
- **Phase 1 (2026):** Remove placeholder; federation-only reads
- **Phase 2 (2027):** Activate **minimal event-derived rollup pipeline** after Platform Activity + Domain Events taxonomy migration (portfolio #2)

---

## 2. Current state

| Component | Location | Behavior |
|-----------|----------|----------|
| Domain event bus | `emitDomainEvent`, `registerDomainEventSubscribers` | In-process fan-out after mutations |
| Analytics subscriber | `analyticsDomainEventSubscriber.ts` | Debug log only |
| Registration | `registerDomainEventSubscribers.ts` | `analytics_placeholder` on all events |
| AI consumer | `AIEventConsumer.ts` | Learning stubs — separate from analytics |
| Activity subscriber | `activityDomainEventSubscriber.ts` | Activity log path — **not analytics** |
| Module activity | `emitModuleActivityEvent` | Feed aggregation — **not primary analytics input** |

**Adopted domain event types (partial list):** `file.uploaded`, `file.shared`, `chat.message.sent`, `calendar.event.created`, `module.installed`, `business.member.added`, V_Link events (14 types), dashboard events (Package 2), etc.

**Gap:** Events are emitted; analytics does not consume them productively.

---

## 3. Required event model (target state)

### 3.1 Event classification for analytics

| Class | Source | Analytics use | Primary? |
|-------|--------|---------------|----------|
| **R2 — Domain events** | `emitDomainEvent` after authorized mutation | Count, funnel, time-series | **Yes** |
| **R2 — Module activity** | `emitModuleActivityEvent` | Secondary — feed-adjacent metrics only | No |
| **Adapter snapshots** | Scheduled/module read APIs | Point-in-time "current state" | Secondary |
| **Graph projections** | Session federation | Ephemeral — **not warehoused** | Tertiary |

Per RELATIONSHIP_ANALYTICS_MODEL: **Event-derived analytics is primary.**

### 3.2 Event envelope requirements

Analytics pipeline must consume the existing `DomainEvent` envelope:

| Field | Requirement |
|-------|-------------|
| `id` | Idempotency key for rollup writes |
| `type` | Maps to metric family registry |
| `action` | Funnel stage classification |
| `entityType` / `entityId` | Count keys — **no PII in rollup** |
| `dashboardId` | **Required** for tenant rollups — drop if missing |
| `businessId` / `householdId` | Tenant partition |
| `userId` (actor) | Attribution — hash or bucket for cross-user aggregates |
| `metadata` | Whitelist only — per `DOMAIN_EVENT_CONTRACTS` |
| `timestamp` | Time-series grain |

**Constitutional rules:**
- Emitter already authorized — analytics ingest does not re-authorize mutation
- Strip events missing tenant scope (AP tenant isolation)
- Never persist disallowed metadata keys

### 3.3 Metric family registry (governance — not implementation)

| Event type pattern | Metric family | Rollup grain |
|-------------------|---------------|--------------|
| `file.uploaded`, `file.shared`, `file.deleted` | `drive_activity` | dashboardId + day |
| `chat.message.sent` | `chat_activity` | dashboardId + day |
| `calendar.event.created` | `calendar_activity` | dashboardId + day |
| `module.installed`, `module.enabled` | `module_adoption` | businessId + module + day |
| `business.member.added`, `business.member.removed` | `workforce_growth` | businessId + day |
| `vlink.*` (14 types) | `association_activity` | businessId/dashboardId + day |
| `task.*` (when adopted) | `todo_activity` | dashboardId + day |

### 3.4 Events explicitly excluded from analytics warehouse

| Event / source | Reason |
|----------------|--------|
| `user.preference.updated` | Privacy — no behavioral warehouse |
| Raw module activity feed rows | Activity ≠ analytics |
| Session graph projection nodes | AG2 — no event backing |
| Failed / unauthorized mutations | Never emitted — N/A |

---

## 4. Pipeline architecture options

### Option A — Minimal (Phase 1 default)

```
Domain Event → (no analytics subscriber)
On-demand reads ← Module APIs / Prisma federation
```

**Action:** **Delete** `analytics_placeholder` subscriber.

### Option B — Inline rollup (Phase 2a)

```
Domain Event → analyticsSubscriber → upsert rollup row (sync)
```

| Pro | Con |
|-----|-----|
| Simple | Adds latency to mutation path |
| Immediate consistency | Subscriber failure handling |

**Verdict:** **Reject** for production — violates subscriber non-blocking principle.

### Option C — Async rollup (Phase 2 recommended)

```
Domain Event → analyticsSubscriber → enqueue rollup job
Platform cron / job runner → rollup processor → PostgreSQL R3 tables
Cache invalidation → dashboard-summary keys
```

| Pro | Con |
|-----|-----|
| Non-blocking emit path | Eventual consistency |
| Fits `platformCronJobs` pattern | Requires job registry (portfolio #7) |
| Reconciliation possible | Ops complexity |

**Verdict:** **Recommended** for Phase 2.

### Option D — Stream platform (deferred)

```
Domain Event → Pub/Sub → Dataflow → BigQuery
```

**Verdict:** **Defer to 2028+** — ops and cost disproportionate for current scale.

---

## 5. Subscriber design (Phase 2 target)

### 5.1 Responsibilities

| Responsibility | Owner |
|----------------|-------|
| Event filtering | Analytics subscriber — metric family registry |
| Idempotent rollup write | Rollup processor |
| Tenant scope validation | Subscriber — drop + alert |
| Cache invalidation | Subscriber or processor |
| Reconciliation | Scheduled job — compare rollup vs module API |
| Dead letter / replay | Platform job — from domain event log |

### 5.2 Failure handling

Per DOMAIN_EVENTS.md: subscriber failures **do not roll back mutations**.

| Failure | Behavior |
|---------|----------|
| Rollup write fails | Log + alert; event retained in domain event log for replay |
| Missing tenant scope | Drop + metric `analytics_event_dropped_total` |
| Unknown event type | Ignore (debug) |
| Processor lag | Serve stale rollup with `degraded: true` + `asOf` |

### 5.3 Relationship to module activity

| Path | Rule |
|------|------|
| Domain events | **Primary** analytics input |
| Module activity | Dashboard feed — analytics may count **event types** mirrored in domain events, not duplicate activity rows |
| Activity feed API | Consumer — not producer for warehouse |

---

## 6. Prerequisites (blockers)

| Prerequisite | Portfolio rank | Status | Blocks |
|--------------|----------------|--------|--------|
| Domain Events taxonomy expansion | #2 | L1 partial | Metric family registry |
| Platform Activity read migration | #2 | In progress | Honest R2 source |
| Platform Scheduler registry | #7 | L1 | Async rollup jobs |
| Remove placeholder subscriber | Analytics Phase 1 | Not done | L2 certification honesty |
| Module event adoption (task.*, etc.) | Ongoing | Partial | Complete dashboard metrics |

**Phase 2 event pipeline must not start before Domain Events taxonomy program delivers stable R2 contracts.**

---

## 7. Phase 1 interim decision (2026)

| Decision | Recommendation |
|----------|----------------|
| Placeholder subscriber | **Remove** in Phase 1 engineering (charter — not 0B implementation) |
| Sync rollup on emit | **Reject** |
| Event pipeline build | **Defer** to Phase 2 (2027) |
| Cache invalidation without events | TTL-only cache acceptable for L2 |

---

## 8. Event model summary (required question #10)

| Layer | Model |
|-------|-------|
| **Input** | `DomainEvent` envelope from `emitDomainEvent` (R2) |
| **Registry** | Metric family map: event type → rollup table + grain |
| **Processing** | Async job: idempotent upsert, tenant-partitioned |
| **Output** | R3 rollup rows + cache invalidation |
| **Read** | Platform analytics service merges rollups + module APIs + degraded flags |
| **Forbidden** | Activity log as warehouse; graph edge SoR; sync blocking writes |

---

## 9. Comparison to constitutional diagram

Aligns with RELATIONSHIP_ANALYTICS_MODEL ecosystem:

```
Module SoR → Domain Events → Aggregators → Warehouse/rollups → Consumers
```

Phase 1 stops at **Aggregators = on-demand federation**.  
Phase 2 activates **Warehouse/rollups = MVAP PostgreSQL tables**.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Placeholder forever | Phase 1 removal mandated |
| Event taxonomy drift | Contract-first in `domainEventRegistry.ts` |
| Double-count (event + activity) | Single primary input rule |
| PII in rollup metadata | Whitelist + AG9 schema review |
| Premature pipeline before federation L2 | Sequence: L2 federation first, pipeline second |

---

**Last updated:** 2026-06-22
