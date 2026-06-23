# Domain Event Subscriber Audit

**Program:** Platform Kernel — Wave 2 Package 2  
**Date:** 2026-06-23  
**Status:** Governance audit — **no code changes**

**Registration site:** `server/src/events/registerDomainEventSubscribers.ts`  
**Startup:** `server/src/index.ts` (idempotent, once per process)

---

## 1. Summary

| Classification | Count | IDs |
|----------------|------:|-----|
| **Production** | 3 | activity, socket, webhook_subscriptions |
| **Partial** | 4 | notification, ai_event_consumer, calendar_dashboard_bootstrap, workspace_dashboard_seed |
| **Stub** | 2 | search_index_stub, workflow_router_stub |
| **Dead** | 0 | *(legacy `analyticsDomainEventSubscriber` removed from registry; doc drift only)* |
| **Total registered** | **9** | |

---

## 2. Full subscriber inventory

| # | Registry name | Handler | File | Class | Event scope | Production impact |
|---|---------------|---------|------|-------|-------------|-------------------|
| 1 | `activity` | `recordDomainEventToActivityLog` | `subscribers/activityDomainEventSubscriber.ts` | **Production** | All events | Persists `Log.operation = domain_event_recorded` |
| 2 | `socket` | `broadcastDomainEventOnSocket` | `subscribers/socketDomainEventSubscriber.ts` | **Production** | All events | `platform:domain_event` to **actor only** |
| 3 | `notification` | `notificationDomainEventConsumer` | `subscribers/notificationDomainEventSubscriber.ts` | **Partial** | 3 types | `FILE_SHARED`, `BUSINESS_MEMBER_ADDED`, `MODULE_INSTALLED` |
| 4 | `ai_event_consumer` | `consumeDomainEventForAI` | `ai/consumers/AIEventConsumer.ts` | **Partial** | 6 types | Learning stub + ambient suggestion scheduling |
| 5 | `webhook_subscriptions` | `deliverDomainEventToWebhooks` | `subscribers/webhookDomainEventSubscriber.ts` | **Production** | Subscription-filtered | External HTTP delivery |
| 6 | `search_index_stub` | `searchIndexDomainEventConsumer` | `subscribers/searchIndexDomainEventSubscriber.ts` | **Stub** | All (no-op) | Debug log only |
| 7 | `workflow_router_stub` | `routeDomainEventToWorkflows` | `workflows/domainEventWorkflowRouter.ts` | **Stub** | All (no-op) | Debug log only |
| 8 | `calendar_dashboard_bootstrap` | `calendarDashboardTabCreatedConsumer` | `subscribers/calendarDashboardDomainEventSubscriber.ts` | **Partial** | `DASHBOARD_TAB_CREATED` (personal) | Calendar bootstrap |
| 9 | `workspace_dashboard_seed` | `workspaceDashboardTabCreatedConsumer` | `subscribers/workspaceDashboardDomainEventSubscriber.ts` | **Partial** | `DASHBOARD_TAB_CREATED` (business) | Workspace module seed |

---

## 3. Subscriber honesty review

### 3.1 Production-ready (core platform)

| Subscriber | G8 evidence | Notes |
|------------|-------------|-------|
| **activity** | Persists structured audit row; failure logged | Canonical durability mirror today |
| **socket** | Actor-scoped emit via `chatSocketService` | Realtime adjunct — not Realtime certification |
| **webhook_subscriptions** | Async delivery; errors isolated | Latency blast radius — monitor in DE-1 |

### 3.2 Partial (functional but narrow)

| Subscriber | Gap | L2 action |
|------------|-----|-----------|
| **notification** | 177/180 types unmapped | Document explicit mapping table; expand high-value types in DE-3 |
| **ai_event_consumer** | 6/180 types consumed | Document as intentional narrow AI surface; expand in AI program |
| **calendar_dashboard_bootstrap** | Single type + context filter | Accept as specialized consumer — document in matrix |
| **workspace_dashboard_seed** | Single type + context filter | Accept as specialized consumer — document in matrix |

### 3.3 Stubs (dishonest in production)

| Subscriber | Current behavior | Constitutional future | Disposition |
|------------|------------------|----------------------|-------------|
| **search_index_stub** | `logger.debug` only | **Search v2** unified index consumer | **Remove** from default registry; register when Search program delivers |
| **workflow_router_stub** | `logger.debug` only | **Workflow router** invoking canonical services | **Remove** from default registry; register when Workflow program delivers |

**Rationale:** Registered stubs imply platform capabilities that do not exist — violates G3 service boundaries and G8 production safety honesty.

### 3.4 Dead / orphaned references

| Item | Status |
|------|--------|
| `analyticsDomainEventSubscriber` | **Not registered** — remove from stale `DOMAIN_EVENTS.md` subscriber table in implementation wave |
| `notification_placeholder` | Renamed to production `notification` — doc drift only |

---

## 4. Disposition plan

| Action | Subscriber | Priority | Package |
|--------|------------|----------|---------|
| **Unregister** | `search_index_stub` | P0 | PK-W3-DE-1 |
| **Unregister** | `workflow_router_stub` | P0 | PK-W3-DE-1 |
| **Document matrix** | All retained subscribers | P0 | PK-W3-DE-1 |
| **Feature-flag optional** | Stubs (if teams want dev hooks) | P1 | PK-W3-DE-1 |
| **Expand mappings** | notification, AI | P2 | PK-W3-DE-3 |
| **Implement** | search index consumer | P4 | Search program |
| **Implement** | workflow router | P4 | Workflow program |

---

## 5. Failure / ordering model (current)

```
subscribeDomainEvents callback
  → runSubscriber (per handler, isolated try/catch)
  → sequential await per subscriber registration order
```

| Risk | Severity | L2 mitigation |
|------|----------|---------------|
| Slow webhook HTTP blocks emit return | Medium | Document; consider fire-and-forget wrapper in DE-3 |
| AI learning stub awaits on hot path | Low | Already async for ambient; document 6-type scope |
| No retry on subscriber failure | Medium | Accept for L2; replay/queue for L3 |

---

## 6. Subscriber operation matrix (target — DE-1 deliverable)

| Subscriber | Owner | Input | Output | Failure mode | Idempotent |
|------------|-------|-------|--------|--------------|------------|
| activity | Platform Kernel | `DomainEvent` | `Log` row | Log error | Yes (by event id in metadata) |
| socket | Platform Realtime | `DomainEvent` | Socket emit | Log error | N/A |
| notification | Notifications | `DomainEvent` | `Notification` rows | Log error | Partial |
| ai_event_consumer | AI Platform | `DomainEvent` | Learning stub + suggestion job | Log error | Yes (domainEventId) |
| webhook_subscriptions | Platform Integrations | `DomainEvent` | HTTP POST | Log error | Subscription-dependent |
| calendar_dashboard_bootstrap | Calendar + Dashboard | `DASHBOARD_TAB_CREATED` | Calendar seed | Log error | Service-level |
| workspace_dashboard_seed | Workspace Runtime | `DASHBOARD_TAB_CREATED` | Module seed | Log error | Seeder idempotent |

---

**Last updated:** 2026-06-23
