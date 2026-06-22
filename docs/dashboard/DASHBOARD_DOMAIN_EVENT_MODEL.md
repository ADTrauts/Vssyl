# Dashboard Module — Domain Event Model

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Governance charter — event taxonomy for `domainEventRegistry.ts`

**Related:** [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md), [DASHBOARD_TRUST_MODEL.md](./DASHBOARD_TRUST_MODEL.md)

---

## 1. Purpose

Define Dashboard domain events for platform fan-out. **Domain events supplement — never replace — module activity.**

---

## 2. Classification legend

| Class | Meaning |
|-------|---------|
| **Required** | Must emit for L2 readiness (Package 2) |
| **Optional** | Emit when Analytics/subscriber value justifies; L3 CwF |
| **Not needed** | Activity sufficient; no platform subscriber today |

---

## 3. Event catalog

| Event type | Entity | Trigger ops | Class | Metadata (recommended) |
|------------|--------|-------------|-------|------------------------|
| `dashboard.tab.created` | `dashboard` | D-03, D-09 | **Required** | `dashboardId`, `contextType`, `businessId?`, `userId` |
| `dashboard.tab.updated` | `dashboard` | D-05 | **Optional** | `dashboardId`, `fieldsChanged[]` |
| `dashboard.tab.deleted` | `dashboard` | D-06, D-07, D-12 | **Required** | `dashboardId`, `hardDelete` |
| `dashboard.tab.trashed` | `dashboard` | D-10 | **Optional** | `dashboardId`, `trashedAt` |
| `dashboard.tab.restored` | `dashboard` | D-11 | **Optional** | `dashboardId` |
| `dashboard.widget.added` | `widget` | W-01, W-05, W-06 | **Required** | `widgetId`, `widgetType`, `dashboardId` |
| `dashboard.widget.removed` | `widget` | W-03 | **Required** | `widgetId`, `widgetType`, `dashboardId` |
| `dashboard.widget.updated` | `widget` | W-02, S-05 | **Not needed** | — (activity covers) |
| `dashboard.widget.layout_updated` | `dashboard` | W-04 | **Optional** | `dashboardId`, `count` |
| `dashboard.sidebar.customized` | `dashboard` | S-02–S-04 | **Not needed** | — |

---

## 4. Required events summary (answer Q3)

**4 Required:**

1. `dashboard.tab.created`
2. `dashboard.tab.deleted`
3. `dashboard.widget.added`
4. `dashboard.widget.removed`

**4 Optional:** tab.updated, tab.trashed, tab.restored, widget.layout_updated

**3 Not needed:** widget.updated, sidebar.customized, share events (future)

---

## 5. Emitter placement (charter)

| Layer | Responsibility |
|-------|----------------|
| `dashboardService` / `widgetService` | Call `emitDashboardDomainEvent()` helper after mutation |
| `domainEventEmitters.ts` | Typed helpers per event |
| `domainEventRegistry.ts` | Contract registration **before** first emit |

**Not in:** controllers, AI context controller, client.

---

## 6. Subscriber map (charter — no new subscribers required for L2)

| Subscriber | Events | Action |
|------------|--------|--------|
| `activityDomainEventSubscriber` | All | Existing platform path |
| `analyticsDomainEventSubscriber` | widget.added/removed, tab.created | **Future** — invalidate rollup cache |
| `socketDomainEventSubscriber` | layout_updated (optional) | Room notify |
| `AIEventConsumer` | tab.created | Learning stub only — no auto-exec |

**L2 minimum:** Events emitted + logged; placeholder analytics subscriber unchanged OK.

---

## 7. Relationship to DASH-B1

Domain events **do not close** DASH-B1. Activity is mandatory independently.

---

## 8. Package assignment

| Package | Scope |
|---------|-------|
| **Package 1** | No domain events (activity only) |
| **Package 2** | Register 4 required events + emitters |
| **Package 3** | Optional events if Analytics subscriber activated |
| **Package 4** | Optional realtime subscriber on layout_updated |

---

## 9. Events explicitly excluded

| Excluded | Reason |
|----------|--------|
| `dashboard.quickstats.computed` | Analytics domain |
| `dashboard.ai.context_requested` | AI orchestration — not domain mutation |
| Calendar create side effect | Calendar module owns |
| Workspace seed | Workspace program |

---

**Last updated:** 2026-06-21
