# Dashboard Module — Package 2 Domain Event Review

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

**Authority:** [DASHBOARD_DOMAIN_EVENT_MODEL.md](./DASHBOARD_DOMAIN_EVENT_MODEL.md), [DOMAIN_EVENTS.md](../architecture/DOMAIN_EVENTS.md)

---

## 1. Current state

| Check | Status |
|-------|--------|
| Dashboard types in `domainEventRegistry.ts` | **None registered** |
| Dashboard emitters in `domainEventEmitters.ts` | **None** |
| Module activity (Package 1) | ✅ 16/16 mutations |
| Domain events in services | **0** |

**Package 1 correctly emitted activity only** — no domain event regression.

---

## 2. Required events (answer Q6 — minimum)

| # | Event type | Entity | Trigger ops | Emitter service |
|---|------------|--------|-------------|-----------------|
| 1 | `dashboard.tab.created` | `dashboard` | D-03, D-09, D-02 ensure-default | `dashboardService` after create |
| 2 | `dashboard.tab.deleted` | `dashboard` | D-06, D-07, D-12 | `dashboardService` / trash service |
| 3 | `dashboard.widget.added` | `widget` | W-01, W-05, W-06 | `widgetService` |
| 4 | `dashboard.widget.removed` | `widget` | W-03 | `widgetService` |

### Recommended metadata

| Event | Metadata |
|-------|----------|
| `tab.created` | `dashboardId`, `contextType`, `businessId?`, `householdId?`, `userId` |
| `tab.deleted` | `dashboardId`, `hardDelete`, `fileAction?` |
| `widget.added` | `widgetId`, `widgetType`, `dashboardId` |
| `widget.removed` | `widgetId`, `widgetType`, `dashboardId` |

### Registration requirement

Register all 4 in `domainEventRegistry.ts` **before** first `emitDomainEvent` — platform fail-closed pattern.

---

## 3. Optional events (P2 may defer; P3/P4)

| Event | Trigger | Value | Package |
|-------|---------|-------|---------|
| `dashboard.tab.updated` | D-05 | Analytics cache invalidation | P3 optional |
| `dashboard.tab.trashed` | D-10 | Trash index fan-out | P2 optional |
| `dashboard.tab.restored` | D-11 | Trash index fan-out | P2 optional |
| `dashboard.widget.layout_updated` | W-04 | Realtime grid refresh | P4 optional |

**Governance recommendation:** Implement **required 4 only** in P2 ACT; optional events do not block authorization.

---

## 4. Events that should remain absent

| Excluded event | Reason |
|----------------|--------|
| `dashboard.widget.updated` | Activity `widget.update` sufficient |
| `dashboard.sidebar.customized` | Activity `sidebar.customize` sufficient |
| `dashboard.quickstats.computed` | Analytics domain |
| `dashboard.ai.context_requested` | Read path — not domain mutation |
| `calendar.created` (from old dashboard path) | Calendar module owns |
| `workspace.seeded` | Workspace program — not dashboard event type |
| Share events (`dashboard.share`) | Future — not implemented |

---

## 5. Lifecycle coverage map

### Dashboard tab lifecycle

| Op | Activity (P1 ✅) | Domain event (P2) |
|----|------------------|-------------------|
| D-02 ensure-default | `dashboard.create` | `tab.created` |
| D-03 create | `dashboard.create` | `tab.created` |
| D-05 update | `dashboard.update` | optional `tab.updated` |
| D-06 delete | `dashboard.delete` | `tab.deleted` |
| D-07 delete+files | `dashboard.delete` | `tab.deleted` |
| D-09 ensure business | `dashboard.create` | `tab.created` |
| D-10 trash | `dashboard.trash` | optional `tab.trashed` |
| D-11 restore | `dashboard.restore` | optional `tab.restored` |
| D-12 purge | `dashboard.delete` | `tab.deleted` |

### Widget lifecycle

| Op | Activity | Domain event |
|----|----------|--------------|
| W-01 add | `widget.add` | `widget.added` |
| W-02 update | `widget.update` | **none** |
| W-03 remove | `widget.remove` | `widget.removed` |
| W-04 batch layout | `widget.layout.batch_update` | optional `layout_updated` |
| W-05/W-06 multi-add | `widget.add` × N | `widget.added` × N |

### Layout / personalization

| Op | Domain event |
|----|--------------|
| W-04 | Optional only — high volume; activity sufficient for audit |
| S-02–S-04 | **Absent** — activity only |

---

## 6. Emitter architecture (charter)

```
authorize → service.execute → activity → domain event (optional fan-out)
```

| Rule | Detail |
|------|--------|
| Order | Activity **before** domain event (both after success) |
| Failure | **Never** emit on failed/unauthorized |
| Location | Services only — not controllers |
| Subscriber | No new subscribers required for L2 |

---

## 7. Subscriber impact (P2)

| Subscriber | P2 change |
|------------|-----------|
| `activityDomainEventSubscriber` | Existing — no change |
| `analyticsDomainEventSubscriber` | Placeholder OK — may log `tab.created` |
| `socketDomainEventSubscriber` | No change unless optional layout event |
| **New: workspace seed handler** | **Recommended** — subscribe `tab.created` (business context) |

---

## 8. Testing requirements (charter)

| Test | Scope |
|------|-------|
| Registry | 4 types `isRegisteredDomainEventType` |
| Emit | Integration per mutation path (min 4) |
| Ordering | Activity emitted before domain event |
| Failure | No emit on 403/404 |

Closes **TP-DE-01** and supports **DASH-M4** matrix evidence.

---

## 9. Domain event vs DASH-B3

Domain events **do not close DASH-B3**. They enable decoupling (calendar/seed subscribers) but B3 closure is **service boundary + Prisma removal**.

---

**Last updated:** 2026-06-21
