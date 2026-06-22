# Dashboard Module — Trust Model

**Program:** Dashboard Module Wave 3 — Phase 1 Trust & Authorization Charter  
**Date:** 2026-06-21  
**Status:** Governance charter — **not** implementation

**Baseline:** Phase 0A/0B · 17/27 G1–G9 · 42 operations · DASH-B1–B5 open

**Authority:** [moduleSpecs.md](../../memory-bank/moduleSpecs.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md), [DASHBOARD_TRUST_POLICY_REVIEW.md](./DASHBOARD_TRUST_POLICY_REVIEW.md)

---

## Purpose

Authoritative trust model for Dashboard modernization: PE, activity, domain events, notifications, and realtime requirements for all 42 operations.

---

## 1. Trust principles (inherited + module-specific)

| ID | Principle |
|----|-----------|
| **T1** | No persisted mutation without PE `allow` (or documented dual-enforcement equivalent) |
| **T2** | No successful authorized mutation without normalized module activity |
| **T3** | No user-visible metric without authorized module or platform capability source |
| **T4** | No fabricated fallback data on read failure |
| **T5** | Widget projections read via module APIs; Dashboard never owns foreign SoR |
| **T6** | AI context bounded to dashboard/widget metadata unless delegating to Analytics facade |
| **T7** | Activity ≠ Analytics — rollups live in Analytics capability, not activity log |
| **T8** | Domain events fan-out platform signals; they do not replace module activity |

---

## 2. Policy Engine taxonomy

### 2.1 Core actions (charter — to register in `policyActions.ts` at implementation)

| Action | Permission string | Resource type | Use |
|--------|-------------------|---------------|-----|
| **DASHBOARD_READ** | `dashboard:read` | `dashboard` | List, get, AI overview/widgets, file-summary read, sidebar get |
| **DASHBOARD_WRITE** | `dashboard:write` | `dashboard` | Create/update tab, layout, prefs, sidebar, widget CRUD, batch positions, trash restore |
| **DASHBOARD_DELETE** | `dashboard:delete` | `dashboard` | Hard delete tab, permanent purge (stricter than write where product requires) |
| **DASHBOARD_AI_READ** | `dashboard:ai.read` | `dashboard` | Optional alias — may collapse to `dashboard:read` if twin scope identical |

**Existing today:** `DASHBOARD_READ` only (`policyActions.ts`, `policyEngine.ts` L751).

**Charter additions:** `DASHBOARD_WRITE`, `DASHBOARD_DELETE` (or map delete to write with explicit handler check — decision at Package 1 implementation).

### 2.2 Scope dimensions (required on every PE call)

| Scope field | When required |
|-------------|---------------|
| `userId` | Always (actor) |
| `dashboardId` | Single-dashboard operations |
| `businessId` | Business-context dashboard |
| `householdId` | Household-context dashboard |
| `institutionId` | Educational-context dashboard |

**Fail-closed:** `TENANT_MISMATCH` when query scope disagrees with resource (existing test pattern).

### 2.3 Foreign-resource reads (AI / Analytics)

| Pattern | Rule |
|---------|------|
| Dashboard metadata only | `dashboard:read` on `dashboard` resource |
| Cross-module aggregates | **Forbidden** in Dashboard controller — delegate to Analytics capability API with its own PE |
| Module widget interiors | Module API enforces module PE; Dashboard host does not expand scope |

### 2.4 PE requirement by operation class

| Class | PE required |
|-------|-------------|
| Create | `dashboard:write` + membership for context-bound create |
| Read (tenant) | `dashboard:read` |
| Update | `dashboard:write` |
| Delete | `dashboard:delete` or `dashboard:write` + product guard |
| Execute (layout batch, template, migration) | `dashboard:write` |
| Personalize / Configure (persisted) | `dashboard:write` |
| Share | `dashboard:write` + future share policy (not implemented) |
| Client-only (edit mode toggle) | None |

**Count:** **24 operations** require PE (per Phase 0B matrix).

---

## 3. Activity taxonomy

### 3.1 Module id and envelope

- **moduleId:** `dashboard`
- **Envelope:** [moduleSpecs.md](../../memory-bank/moduleSpecs.md) normalized activity event
- **Emitter:** `dashboardActivityService` → `emitModuleActivityEvent` (charter — Package 1)

### 3.2 Activity actions (catalog authority in [DASHBOARD_ACTIVITY_MODEL.md](./DASHBOARD_ACTIVITY_MODEL.md))

| Action key | Category |
|------------|----------|
| `dashboard.create` | Lifecycle |
| `dashboard.update` | Lifecycle |
| `dashboard.delete` | Lifecycle |
| `dashboard.trash` | Lifecycle |
| `dashboard.restore` | Lifecycle |
| `widget.add` | Widget |
| `widget.update` | Widget |
| `widget.remove` | Widget |
| `widget.layout.batch_update` | Layout |
| `sidebar.customize` | Personalization |

### 3.3 Activity requirement by operation class

| Class | Activity required |
|-------|-------------------|
| Create / Update / Delete (persisted) | **Yes** — after successful mutation only |
| Execute (multi-widget template, build-out) | **Yes** — per widget or single batch event (charter: one `widget.add` per widget OR one `dashboard.update` with metadata) |
| Personalize (sidebar) | **Yes** |
| Configure (widget.config) | **Optional** — charter: emit `widget.update` when config persisted |
| Read | **No** |
| Share (future) | **Yes** |

**Count:** **16 operations** require activity (Phase 0B matrix).

### 3.4 Visibility scope

| Dashboard context | activity.visibility.scope |
|-------------------|---------------------------|
| Personal tab | `personal` |
| Business tab | `business` |
| Household tab | `household` |
| Educational tab | `personal` or `household` per product rule |

---

## 4. Domain event taxonomy

### 4.1 Registry namespace (charter — Package 2+)

| Event type | Entity | Required? |
|------------|--------|-----------|
| `dashboard.tab.created` | `dashboard` | **Required** |
| `dashboard.tab.updated` | `dashboard` | Optional |
| `dashboard.tab.deleted` | `dashboard` | **Required** |
| `dashboard.tab.trashed` | `dashboard` | Optional |
| `dashboard.tab.restored` | `dashboard` | Optional |
| `dashboard.widget.added` | `widget` | **Required** |
| `dashboard.widget.removed` | `widget` | **Required** |
| `dashboard.widget.layout_updated` | `dashboard` | Optional |
| `dashboard.sidebar.customized` | `dashboard` | Not needed (activity sufficient) |

**Count:** **4 Required** · **4 Optional** · **1 Not needed** at charter level.

**Rule:** Emit only after DB success + PE + activity path initiated; subscriber failure does not roll back.

### 4.2 Subscribers (future — not Dashboard-owned)

| Subscriber | Interest |
|------------|----------|
| Analytics placeholder | Rollup invalidation signals |
| AI consumer | Layout change signals (no auto-exec) |
| Socket (optional) | Multi-device grid refresh (Package 4+) |

---

## 5. Notification requirements

| Scenario | Required? | Type (future) | Package |
|----------|-----------|---------------|---------|
| Dashboard shared with user | Yes (when built) | `dashboard_shared` | Post-L3 |
| Dashboard deleted with files migrated | Optional | `dashboard_deleted` | Advisory |
| Widget added/removed | No | — | — |
| Enterprise mock alerts | **Remove** — not real notifications | — | Package 1 |
| Sidebar customized | No | — | — |

**Charter:** No notification manifest changes until Share feature chartered. Package 1 removes fake alert UX from enterprise panels.

---

## 6. Realtime requirements

| Scenario | Required? | Owner |
|----------|-----------|-------|
| Grid layout sync across devices | Optional (L3+) | Dashboard module via `realtimeClient` room `dashboard:{dashboardId}` |
| Widget interior live data | No — module widgets | Chat, notifications modules |
| Activity feed refresh | Optional poll + socket debounce | Platform activity |
| AI context cache invalidation | No | Context provider TTL |

**Charter:** Realtime is **not** L2 blocking. Document optional room contract in Package 4.

---

## 7. Trust classification (data fidelity)

| Surface | Charter disposition |
|---------|---------------------|
| Module projection widgets | Trusted when API-backed |
| quickstats / useDashboardStats | Delegate to Analytics — Package 3 |
| activityfeed | Empty state on failure — Package 1 |
| Enterprise panels | Feature-gate or Analytics delegate — Package 1/3 |
| DriveWidget random share | Remove simulation — Package 3 hygiene |

---

## 8. Operation-level trust map (summary)

Full matrix: [DASHBOARD_OPERATION_MATRIX.md](./DASHBOARD_OPERATION_MATRIX.md)

| Trust dimension | Ops requiring | Compliant today |
|-----------------|---------------|-----------------|
| PE | 24 | 1 |
| Activity | 16 | 0 |
| Domain event (required subset) | 4 | 0 |
| Data trust (no mock) | 18 read surfaces | ~12 |

---

## 9. Finding closure mapping

| Finding | Trust model section |
|---------|---------------------|
| DASH-B1 | §3 Activity taxonomy |
| DASH-B2 | §2 PE taxonomy |
| DASH-B3 | §2.3 Foreign reads + §4 Analytics separation |
| DASH-B4 | §7 activityfeed — T4 |
| DASH-B5 | §7 enterprise — T3 |

---

**Last updated:** 2026-06-21
