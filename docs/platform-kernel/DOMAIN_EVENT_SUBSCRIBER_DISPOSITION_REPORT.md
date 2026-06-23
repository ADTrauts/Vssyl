# Domain Event Subscriber Disposition Report

**Program:** PK-W3-DE-1  
**Date:** 2026-06-23  
**Status:** **Complete**

---

## 1. Pre-package state (validated)

| Classification | Count | IDs |
|----------------|------:|-----|
| Production | 3 | activity, socket, webhook_subscriptions |
| Partial | 4 | notification, ai_event_consumer, calendar_dashboard_bootstrap, workspace_dashboard_seed |
| Stub | 2 | search_index_stub, workflow_router_stub |
| Dead | 0 | — |
| **Total registered** | **9** | |

Audit findings from W2-P2 **confirmed** in code review.

---

## 2. Disposition actions

| Subscriber | Pre | Post (default) | Action |
|------------|-----|----------------|--------|
| `activity` | Active | **Active** | Retain |
| `socket` | Active | **Active** | Retain |
| `notification` | Active | **Active** | Retain |
| `ai_event_consumer` | Active | **Active** | Retain |
| `webhook_subscriptions` | Active | **Active** | Retain |
| `calendar_dashboard_bootstrap` | Active | **Active** | Retain |
| `workspace_dashboard_seed` | Active | **Active** | Retain |
| `search_index_stub` | Active (dishonest) | **Inactive** | **Removed from default registration**; opt-in flag |
| `workflow_router_stub` | Active (dishonest) | **Inactive** | **Removed from default registration**; opt-in flag |

---

## 3. Feature-flag disposition (stubs)

| Subscriber | Env variable | Default | Purpose |
|------------|--------------|---------|---------|
| `search_index_stub` | `DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED` | **off** | Dev hook until Search v2 consumer ships |
| `workflow_router_stub` | `DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED` | **off** | Dev hook until Workflow router ships |

**Implementation:** `registrable: false` + `optionalDevFlag: true` in operation matrix; `resolveActiveDomainEventSubscribers()` gates registration.

---

## 4. Removed vs feature-flagged

| Outcome | Subscribers |
|---------|-------------|
| **Removed from production** | Both stubs (default process) |
| **Feature-flagged** | Both stubs (explicit opt-in only) |

Charter preferred outcome satisfied: **no fake production subscribers** after this package.

---

## 5. Retained subscriber summary

| ID | Class | Owner |
|----|-------|-------|
| activity | Production | Platform Kernel |
| socket | Production | Platform Kernel / Realtime |
| webhook_subscriptions | Production | Platform Integrations |
| notification | Partial | Notifications Platform |
| ai_event_consumer | Partial | AI Platform |
| calendar_dashboard_bootstrap | Partial | Calendar + Dashboard |
| workspace_dashboard_seed | Partial | Workspace Runtime |

---

## 6. Dead / doc drift resolved

| Item | Disposition |
|------|-------------|
| `analyticsDomainEventSubscriber` | Confirmed not registered — removed from `DOMAIN_EVENTS.md` |
| `notification_placeholder` | Renamed to `notification` in architecture doc |

---

**Last updated:** 2026-06-23
