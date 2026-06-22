# Dashboard Module — Package 2 Domain Event Report

**Program:** Dashboard Module Wave 3 — Package 2  
**Date:** 2026-06-21  
**Status:** Implementation complete

---

## 1. Events implemented

| Type constant | Wire type | Contract owner |
|---------------|-----------|----------------|
| `DASHBOARD_TAB_CREATED` | `dashboard.tab.created` | Dashboard module |
| `DASHBOARD_TAB_DELETED` | `dashboard.tab.deleted` | Dashboard module |
| `DASHBOARD_WIDGET_ADDED` | `dashboard.widget.added` | Dashboard module |
| `DASHBOARD_WIDGET_REMOVED` | `dashboard.widget.removed` | Dashboard module |

**Registry:** `server/src/events/domainEventRegistry.ts`  
**Emitters:** `server/src/events/domainEventEmitters.ts`  
**Module helpers:** `server/src/services/dashboardDomainEventService.ts`

---

## 2. Emission order (constitutional)

All dashboard mutations follow:

```
authorize (controller PE) → execute (service) → emit module activity → emit domain event
```

Domain events are **never** emitted on failed or unauthorized paths.

---

## 3. Event catalog

### `dashboard.tab.created`

| Field | Source |
|-------|--------|
| `actorUserId` | Creating user |
| `dashboardId` | New dashboard row |
| `businessId` / `householdId` | Context IDs when set |
| `contextType` | `personal` \| `business` \| `household` \| `institution` |
| `name` | Dashboard display name |

**Emitted from:** `dashboardService.createDashboard` (new rows only — not idempotent returns)

**Consumers (Package 2):**

| Subscriber | Module | Behavior |
|------------|--------|----------|
| `calendarDashboardTabCreatedConsumer` | Calendar | `ensurePersonalPrimaryCalendarForUser` when `contextType === 'personal'` |
| `workspaceDashboardTabCreatedConsumer` | Workspace | `seedBusinessWorkspaceResources` when `contextType === 'business'` |
| Platform stubs | Platform | activity log, socket, notifications, analytics placeholder, AI, webhooks, search, workflows |

### `dashboard.tab.deleted`

| Field | Source |
|-------|--------|
| `actorUserId` | Deleting user |
| `dashboardId` | Removed tab |
| `businessId` / `householdId` | Context |
| `hardDelete` | `true` for permanent paths |
| `fileAction` | Optional Drive migration type |

**Emitted from:**

- `dashboardService.deleteDashboard` (hard delete path)
- `dashboardTrashService` permanent purge (D-12)

**Consumers (P2):** Platform stubs only. Chat cleanup is **not** post-delete async — see K2-04 sync pre-delete in `chatDashboardLifecycleService`.

### `dashboard.widget.added`

| Field | Source |
|-------|--------|
| `widgetId`, `widgetType`, `dashboardId` | New widget |
| `businessId` / `householdId` | Dashboard context |

**Emitted from:** `widgetService.createWidget` after `recordWidgetAdded`

### `dashboard.widget.removed`

| Field | Source |
|-------|--------|
| `widgetId`, `widgetType`, `dashboardId` | Removed widget |
| `businessId` / `householdId` | Dashboard context |

**Emitted from:** `widgetService.deleteWidget` after `recordWidgetRemoved`

---

## 4. Subscriber registration

`registerDomainEventSubscribers()` in `server/src/events/registerDomainEventSubscribers.ts`:

```text
calendar_dashboard_bootstrap  → calendarDashboardTabCreatedConsumer
workspace_dashboard_seed      → workspaceDashboardTabCreatedConsumer
```

Both subscribe to the global domain event bus alongside existing platform consumers.

---

## 5. Kickoff alignment

| Decision | Event role |
|----------|------------|
| **K2-01** | Calendar bootstrap triggered by `dashboard.tab.created` (personal) |
| **K2-02** | Workspace seed triggered by `dashboard.tab.created` (business) |
| **K2-04** | Tab delete does **not** use async Chat subscriber — FK-safe sync cleanup instead |

---

## 6. Event vs activity

| Concern | Channel |
|---------|---------|
| Immutable module feed / audit | `dashboardActivityService` → module activity log |
| Cross-module decoupling | Domain event bus |
| Analytics derived metrics | **Not** domain events — Package 3 Analytics capability |

Domain events **do not** close full DASH-B3; they enable M2/M3 decoupling.

---

## 7. Test evidence

| Test | Assertion |
|------|-----------|
| `dashboardDomainEvents.test.ts` | All 4 types registered in `DOMAIN_EVENT_TYPES` |
| `dashboardDomainEventService.test.ts` | Helpers call correct emitters with metadata |

---

## 8. Future consumers (out of scope)

| Consumer | Package |
|----------|---------|
| Analytics capability rollup | Package 3 |
| Search index real implementation | Platform backlog |
| Webhook partner notifications | Platform backlog |

---

## 9. Files touched

**Created:** `dashboardDomainEventService.ts`, `calendarDashboardDomainEventSubscriber.ts`, `workspaceDashboardDomainEventSubscriber.ts`

**Modified:** `domainEventRegistry.ts`, `domainEventEmitters.ts`, `registerDomainEventSubscribers.ts`, `dashboardService.ts`, `widgetService.ts`, `dashboardTrashService.ts`
