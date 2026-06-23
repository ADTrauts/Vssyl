# Domain Event Operation Matrix

**Program:** Platform Kernel — PK-W3-DE-1  
**Date:** 2026-06-23  
**Status:** **Authoritative baseline** (runtime + docs)

**Code source of truth:** `server/src/events/domainEventOperationMatrix.ts`  
**Registration:** `server/src/events/registerDomainEventSubscribers.ts`

---

## 1. Subscriber matrix

| ID | Class | Owner | Handler | Event scope | Production |
|----|-------|-------|---------|-------------|:----------:|
| `activity` | Production | Platform Kernel | `recordDomainEventToActivityLog` | All | ✅ |
| `socket` | Production | Platform Kernel / Realtime | `broadcastDomainEventOnSocket` | All | ✅ |
| `notification` | Partial | Notifications Platform | `notificationDomainEventConsumer` | 3 types | ✅ |
| `ai_event_consumer` | Partial | AI Platform | `consumeDomainEventForAI` | 6 types | ✅ |
| `webhook_subscriptions` | Production | Platform Integrations | `deliverDomainEventToWebhooks` | Subscription-filtered | ✅ |
| `calendar_dashboard_bootstrap` | Partial | Calendar + Dashboard | `calendarDashboardTabCreatedConsumer` | `dashboard.tab.created` (personal) | ✅ |
| `workspace_dashboard_seed` | Partial | Workspace Runtime | `workspaceDashboardTabCreatedConsumer` | `dashboard.tab.created` (business) | ✅ |
| `search_index_stub` | Stub | Search Program (future) | `searchIndexDomainEventConsumer` | n/a | ❌ default |
| `workflow_router_stub` | Stub | Workflow Program (future) | `routeDomainEventToWorkflows` | n/a | ❌ default |

**Production active count:** **7** (default process)

### Stub opt-in flags (default off)

| ID | Environment variable |
|----|---------------------|
| `search_index_stub` | `DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED` |
| `workflow_router_stub` | `DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED` |

Accepted values: `true`, `1`, `yes`

---

## 2. Emitter ownership

| ID | Owner | Source | Modules |
|----|-------|--------|---------|
| `platform_emitters` | Platform Kernel | `events/domainEventEmitters.ts` | drive, chat, calendar, todo, platform, business |
| `vlink_emitters` | V_Link Program | `events/vlinkDomainEventEmitters.ts` | vlink |
| `module_domain_event_services` | Module owners | `services/*DomainEventService.ts` | chat, calendar, todo, notes, notebook, place, dashboard, scheduling, workforce_comms, orgchart, approval_hierarchy, account |
| `inline_account_settings` | Account Platform | settings + preference services | account, platform |

**Registry:** 180 types in `DOMAIN_EVENT_TYPES` / `DOMAIN_EVENT_CONTRACTS`

---

## 3. Module participation

| Module | Facade | Domain events | Module activity | Notes |
|--------|--------|:-------------:|:---------------:|-------|
| chat | `chatDomainEventService.ts` | ✅ | ✅ | |
| calendar | `calendarDomainEventService.ts` | ✅ | ✅ | |
| drive | `domainEventEmitters` (delegated) | ✅ | ✅ | |
| dashboard | `dashboardDomainEventService.ts` | ✅ | ✅ | |
| account | billing + entitlement services | ✅ | ✅ | |
| place | `placeDomainEventService.ts` | ✅ | ✅ | |
| todo | `todoDomainEventService.ts` | ✅ | ✅ | |
| notebook | `notebookLinkDomainEventService.ts` | ✅ | ✅ | |
| scheduling | `schedulingDomainEventService.ts` | ✅ | ✅ | |
| hr | `hrDomainEventService.ts` | ✅ | ✅ | |
| workforce_comms | `workforceDomainEventService.ts` | ✅ | ✅ | |
| orgchart | `business/orgChartDomainEventService.ts` | ✅ | ✅ | |
| approval_hierarchy | `business/approvalHierarchyDomainEventService.ts` | ✅ | ✅ | |
| analytics | — | ❌ | ✅ | Activity-only (exempt) |
| admin_portal | — | ❌ | ❌ | Consumer-only |

---

## 4. Runtime validation

```typescript
import { validateDomainEventOperationMatrix } from 'server/src/events/domainEventOperationMatrix';

const result = validateDomainEventOperationMatrix();
// result.valid — matrix integrity + no dishonest stub registration
// result.activeSubscriberIds — current process subscriber ids
```

Called at `registerDomainEventSubscribers()` startup. Validation failures are logged (`domain_event_matrix_validation_error`).

### Validation rules

1. Unique subscriber IDs
2. Every subscriber has `owner`, `constitutionalPurpose`, `handler`, `sourceFile`
3. No stub with `registrable: true` in active set
4. Every emitter ownership record has `owner` + `source`

---

## 5. Fan-out order (active subscribers)

1. activity  
2. socket  
3. notification  
4. ai_event_consumer  
5. webhook_subscriptions  
6. calendar_dashboard_bootstrap  
7. workspace_dashboard_seed  
8. *(optional)* search_index_stub  
9. *(optional)* workflow_router_stub  

Each handler isolated via `runSubscriber` try/catch.

---

## 6. Certification baseline

This matrix is the **DE L2 certification baseline** for:

- G3 Service boundaries (honest subscriber registry)
- G5 Ownership (documented owners)
- G7 Documentation (matrix + architecture sync)
- G8 Production safety (no fake subscribers)

---

**Last updated:** 2026-06-23
