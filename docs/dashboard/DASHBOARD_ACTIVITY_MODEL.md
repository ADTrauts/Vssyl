# Dashboard Module — Activity Model

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Governance charter — authoritative activity catalog

**Closes:** DASH-B1 (when implemented per Package 1)

---

## 1. Purpose

Define required module activity actions for Dashboard lifecycle, widgets, layout, personalization, and future sharing. Maps to 16 mutation operations in Phase 0B matrix.

---

## 2. Emitter architecture (charter)

| Component | Role |
|-----------|------|
| `dashboardActivityService.ts` | Canonical emitter — **Package 1** |
| `emitModuleActivityEvent` | Platform activity log |
| Controllers | **Must not** emit directly |

**Lifecycle:** `authorize → execute → emitModuleActivityEvent → (optional) domain event`

---

## 3. Activity action catalog

### 3.1 Dashboard lifecycle

| Action | Trigger ops | Target type | Target id | Required metadata |
|--------|-------------|-------------|-----------|-----------------|
| `dashboard.create` | D-02, D-03, D-09 | `dashboard` | new id | `name`, `contextType`, `businessId?`, `householdId?`, `institutionId?` |
| `dashboard.update` | D-05 | `dashboard` | id | changed fields: `name`, `layout`, `preferences` (keys only, not full JSON blob) |
| `dashboard.delete` | D-06, D-07, D-12 | `dashboard` | id | `hardDelete`, `fileAction?` |
| `dashboard.trash` | D-10 | `dashboard` | id | `trashedAt` |
| `dashboard.restore` | D-11 | `dashboard` | id | — |

### 3.2 Widget lifecycle

| Action | Trigger ops | Target type | Target id | Required metadata |
|--------|-------------|-------------|-----------|-----------------|
| `widget.add` | W-01, W-05*, W-06* | `widget` | new id | `widgetType`, `dashboardId` |
| `widget.update` | W-02, S-05 | `widget` | id | `widgetType?`, `configKeys?`, `positionChanged?` |
| `widget.remove` | W-03 | `widget` | id | `widgetType`, `dashboardId` |
| `widget.layout.batch_update` | W-04 | `dashboard` | dashboardId | `widgetCount`, `positionCount` |

*W-05/W-06: emit one `widget.add` per widget created (preferred) OR single `dashboard.update` with `widgetsAdded: string[]` — charter selects **per-widget** for audit granularity.

### 3.3 Layout changes

| Action | Trigger | Notes |
|--------|---------|-------|
| `widget.layout.batch_update` | W-04, debounced grid save | Coalesce rapid drags into one event per save |
| `dashboard.update` | D-05 when `layout` JSON changes | Alternative if batch API not used |

**Rule:** Do not double-emit batch + update for same user action — pick one path in implementation.

### 3.4 Personalization

| Action | Trigger ops | Target | Metadata |
|--------|-------------|--------|----------|
| `sidebar.customize` | S-02, S-03, S-04 | `dashboard` | `scope`: tab/sidebar/global, `leftChanged`, `rightChanged` |

### 3.5 Sharing (future)

| Action | Trigger | Status |
|--------|---------|--------|
| `dashboard.share` | X-01 | **Not needed today** — catalog slot |
| `dashboard.share.revoke` | future | Not needed |

---

## 4. Normalized envelope (per operation)

```typescript
// Charter shape — aligns with moduleSpecs.md
{
  action: 'widget.add',           // from catalog §3
  target: { type: 'widget', id: widgetId },
  parent: { type: 'dashboard', id: dashboardId },
  context: {
    moduleId: 'dashboard',
    dashboardId,
    businessId?, householdId?, institutionId?
  },
  visibility: { scope: 'personal' | 'business' | 'household' },
  metadata: { widgetType: 'chat' }
}
```

---

## 5. Operation → activity mapping (16 required)

| Op ID | Activity action(s) |
|-------|-------------------|
| D-02 | `dashboard.create` |
| D-03 | `dashboard.create` |
| D-05 | `dashboard.update` |
| D-06 | `dashboard.delete` |
| D-07 | `dashboard.delete` |
| D-09 | `dashboard.create` |
| D-10 | `dashboard.trash` |
| D-11 | `dashboard.restore` |
| D-12 | `dashboard.delete` |
| W-01 | `widget.add` |
| W-02 | `widget.update` |
| W-03 | `widget.remove` |
| W-04 | `widget.layout.batch_update` |
| W-05 | `widget.add` × N |
| W-06 | `widget.add` × N |
| S-02, S-03, S-04 | `sidebar.customize` |
| S-05 | `widget.update` (optional — charter: **yes** when persisted) |

---

## 6. What does NOT emit activity

| Operation | Reason |
|-----------|--------|
| All Read ops (D-01, D-04, D-08, A-*, C-*, S-01, W-07, P-*) | Read-only |
| S-06 edit mode | Client ephemeral |
| Module widget interior reads | Module-owned |
| Failed / unauthorized mutations | moduleSpecs.md — never emit on failure |

---

## 7. Activity vs Analytics

| Do emit in activity | Do NOT store in activity |
|---------------------|--------------------------|
| "User added chat widget" | Quick stats counts |
| "User deleted dashboard tab" | Cross-module KPI rollups |
| "Sidebar customized" | Enterprise productivity score |

---

## 8. What closes DASH-B1 (answer Q7)

| Requirement | Package |
|-------------|---------|
| Create `dashboardActivityService` with catalog actions §3 | Package 1 |
| Wire all 16 mutation paths through service after success | Package 1 |
| Integration tests asserting emit on create/update/delete widget | Package 1 |
| Remove silent D-02 without activity OR move auto-create out of GET | Package 1 |

**Acceptance:** 16/16 mutation ops emit · 0 emits on failure · G2 → PASS

---

## 9. Required activity actions summary (answer Q2)

**10 distinct action keys:** `dashboard.create`, `dashboard.update`, `dashboard.delete`, `dashboard.trash`, `dashboard.restore`, `widget.add`, `widget.update`, `widget.remove`, `widget.layout.batch_update`, `sidebar.customize`

**Plus 2 future:** `dashboard.share`, `dashboard.share.revoke`

---

**Last updated:** 2026-06-21
