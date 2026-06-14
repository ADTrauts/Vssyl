# Automation Consumer Boundary

**Program:** Vssyl Relationship Framework  
**Phase:** 2C — Automation trigger constitutional architecture  
**Status:** Canonical consumer boundary  
**Date:** 2026-06-14  
**Catalog:** [RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md](./RELATIONSHIP_AUTOMATION_TRIGGER_CATALOG.md)  
**Safety:** [AUTOMATION_TRIGGER_SAFETY_MODEL.md](./AUTOMATION_TRIGGER_SAFETY_MODEL.md)

> **Scope:** Defines which **future systems** may consume relationship automation triggers and what each may do. **No** subscriber implementation in this phase.

---

## Purpose

Domain events fan out to many consumers today (activity, socket, AI stub, search stub). Phase 2C draws **hard boundaries** so new consumers do not violate ownership, permissions, or taxonomy.

**Consumer** = any process subscribing to relationship trigger-eligible domain events or derived webhook stream.

---

## Consumer taxonomy

| Class | Description | Mutates SoR? |
|-------|-------------|--------------|
| **C0 — Observer** | Log, aggregate, metrics | Never |
| **C1 — Derived view** | Index, cache, projection | Derived stores only |
| **C2 — Notifier** | Push, email, in-app notification | Notification rows only |
| **C3 — Integrator** | Webhook, partner API | External — not platform SoR |
| **C4 — Orchestrator** | Workflow / automation engine | Via module APIs only |
| **C5 — AI signal** | Suggestions, correlation | Suggestion rows — not relationships |

---

## Allowed future consumers

### Notifications (C2)

| Aspect | Rule |
|--------|------|
| **Purpose** | Inform users of relationship changes they care about |
| **Allowed triggers** | created, membership_changed, access_revoked, assigned, vlink_attached (optional), visibility_changed |
| **Allowed actions** | `NotificationService.createNotification` with `[module]_[event]` types |
| **Forbidden** | Notify users not in event tenant; expose full file/message body in payload |
| **Permission** | Recipient must be participant, member, or subscriber to entity |
| **Idempotency** | Dedupe by `(userId, domainEventId, notificationType)` |

### AI suggestions (C5)

| Aspect | Rule |
|--------|------|
| **Purpose** | Correlate events into actionable suggestions |
| **Allowed triggers** | Subset per [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) — e.g. `file.uploaded`, `chat.message.sent`, relationship created signals |
| **Allowed actions** | Create `AISuggestion`, `VLinkSuggestion` (pending); schedule correlation |
| **Forbidden** | Auto-accept suggestions; auto share/link/assign |
| **Permission** | Suggestion target actions re-check PE on user accept |

### Analytics (C0)

| Aspect | Rule |
|--------|------|
| **Purpose** | Aggregate relationship metrics |
| **Allowed triggers** | All trigger-eligible events |
| **Allowed actions** | Increment counters, warehouse append, BI export |
| **Forbidden** | Treat analytics table as relationship SoR; store message bodies |
| **Permission** | PII-minimized aggregates; business scope |

### Search index invalidation (C1)

| Aspect | Rule |
|--------|------|
| **Purpose** | Keep derived indexes consistent |
| **Allowed triggers** | Entity trash/restore/delete, visibility_changed, tag_added/removed, vlink_detached (container metadata) |
| **Allowed actions** | Purge/update derived index rows per [TAG_INDEX_CONTRACT.md](./TAG_INDEX_CONTRACT.md) |
| **Forbidden** | Index attachment content user cannot open; write tags to index from automation |
| **Permission** | Index partition by tenant |

Reference: `searchIndexDomainEventSubscriber` (stub today).

### Recommendations (C0 / C5)

| Aspect | Rule |
|--------|------|
| **Purpose** | Propose businesses, connections, content |
| **Allowed triggers** | Place connection, follow, listing published; optional cross-signal correlation |
| **Allowed actions** | Rank, surface proposals in discovery UI |
| **Forbidden** | Auto-follow; auto V_Link; write Relationship row without user |
| **Permission** | Public catalog vs private workspace partitions |

### Workflows (C4 — future)

| Aspect | Rule |
|--------|------|
| **Purpose** | User-defined multi-step automation |
| **Allowed triggers** | Per catalog tier T4 — created, updated, tag_added (narrow) |
| **Allowed actions** | Call module service APIs with acting user context |
| **Forbidden** | Raw Prisma on foreign module; D4 cascades; cross-tenant |
| **Permission** | PE re-check every write; confirmation tiers D2+ |

### Reminders (C2)

| Aspect | Rule |
|--------|------|
| **Purpose** | Time-based follow-ups tied to relationship context |
| **Allowed triggers** | `calendar.event.reminderDispatched`, task due (entity — not relationship class) |
| **Allowed actions** | Schedule notification |
| **Forbidden** | Create calendar events without user rule |

### Realtime / sockets (C2)

| Aspect | Rule |
|--------|------|
| **Purpose** | UI refresh |
| **Allowed triggers** | Most relationship events |
| **Allowed actions** | Room emit to proven membership |
| **Forbidden** | Cross-tenant room broadcast |

### Webhooks (C3)

| Aspect | Rule |
|--------|------|
| **Purpose** | Business integrations |
| **Allowed triggers** | Subscription-filtered registry types |
| **Allowed actions** | Signed HTTPS POST with safe metadata |
| **Forbidden** | Secrets in payload; types user did not subscribe |
| **Permission** | `WebhookSubscription` business ADMIN registration |

### Activity feed (C0 / C2)

| Aspect | Rule |
|--------|------|
| **Purpose** | Normalized module activity |
| **Allowed triggers** | Domain events via `activityDomainEventSubscriber` |
| **Allowed actions** | Activity log append |
| **Forbidden** | Duplicate as second SoR for relationship |

---

## Forbidden or restricted consumers

### Direct permission mutation

| Pattern | Verdict |
|---------|---------|
| Subscriber inserts `FilePermission` on `file.uploaded` | ❌ **Forbidden** without user-initiated workflow + PE |
| Subscriber adds `VLinkMember` on `business.member.added` | ❌ **Forbidden** |
| Subscriber grants share because AI suggested | ❌ **Forbidden** — user accept via module API |

**Exception:** Platform emitters during authorized request path — not automation consumer.

### Silent destructive actions

| Pattern | Verdict |
|---------|---------|
| Auto permanent delete on `business.member.removed` | ❌ **Forbidden** (D4) |
| Auto bulk unshare on offboarding without D3 confirm | ❌ **Restricted** |
| Purge derived index on delete | ✅ Allowed (C1) |

### Cross-tenant propagation

| Pattern | Verdict |
|---------|---------|
| Copy event to partner business webhook wrong id | ❌ **Forbidden** |
| Global rule matching all dashboards | ❌ **Forbidden** without admin partition |

### AI auto-write without approval

| Pattern | Verdict |
|---------|---------|
| AI creates share on `chat.message.sent` | ❌ **Forbidden** |
| AI accepts `vlink.suggestion` | ❌ **Forbidden** |
| AI writes tags on `todo.task.created` | ❌ **Restricted** — user confirm per TAG_STRATEGY |

### Inference as trigger

| Pattern | Verdict |
|---------|---------|
| `entityLinking` output fires synthetic domain event | ❌ **Forbidden** |
| Pending suggestion treated as `relationship.created` | ❌ **Forbidden** |

### Universal relationship store writer

| Pattern | Verdict |
|---------|---------|
| Consumer writes edge table mirroring all events | ❌ **Forbidden** as SoR — analytics derivative only |

---

## Consumer registration model (conceptual)

Future automation platform should register:

| Field | Purpose |
|-------|---------|
| `consumerId` | Stable identifier |
| `consumerClass` | C0–C5 |
| `subscribedTypes` | Concrete domain event types |
| `tenantScope` | businessId / dashboardId binding |
| `idempotencyStrategy` | dedupe key definition |
| `maxTier` | Highest trigger tier (T0–T5) allowed |
| `mutatesSor` | boolean — requires PE re-check path |

Third-party modules: **C0/C2 only** via platform webhook — not in-process bus for marketplace partners per third-party module rules.

---

## Existing consumers (implementation reference)

| Consumer | Class | Status |
|----------|-------|--------|
| `activityDomainEventSubscriber` | C0/C2 | ✅ Active |
| `socketDomainEventSubscriber` | C2 | ✅ Active |
| `notificationDomainEventSubscriber` | C2 | Placeholder |
| `analyticsDomainEventSubscriber` | C0 | Placeholder |
| `AIEventConsumer` | C5 | ✅ Active (subset) |
| `searchIndexDomainEventSubscriber` | C1 | Stub |

Phase 2C does not change these — documents boundaries for expansion.

---

## Decision matrix

| Consumer wants to… | Allowed? | Class | Condition |
|--------------------|----------|-------|-----------|
| Notify assignee on `todo.task.assigned` | ✅ | C2 | Assignee in tenant |
| Delete file on `vlink.entity.unlinked` | ❌ | — | Wrong cascade |
| Invalidate tag index on `notes.page.updated` | ✅ | C1 | Tag diff or full re-ingest |
| Webhook partner on `file.shared` | ✅ | C3 | Subscription + signed |
| Workflow: add to V_Link on upload | ⚠️ | C4 | User rule D2 + link PE |
| AI suggest V_Link after chat file | ✅ | C5 | User accept |
| Analytics count shares | ✅ | C0 | Aggregate |
| Store edges in new global table | ❌ | — | ADR rejected |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [AI_AUTOMATION_BOUNDARY.md](./AI_AUTOMATION_BOUNDARY.md) | AI consumer detail |
| [RELATIONSHIP_READ_FEDERATION_CONTRACT.md](./RELATIONSHIP_READ_FEDERATION_CONTRACT.md) | Pattern D |
| [DOMAIN_EVENTS.md](./DOMAIN_EVENTS.md) | Subscriber map |

**Last updated:** 2026-06-14
