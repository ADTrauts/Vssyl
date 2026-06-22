# Analytics Capability — Phase 1 Scope Validation

**Program:** Analytics Capability — Constitutional Modernization  
**Phase:** 1 — Federated L2 Engineering  
**Date:** 2026-06-22  
**Status:** Scope validation — **governance only**

**Prerequisite:** [ANALYTICS_PHASE0B_RATIFICATION.md](./ANALYTICS_PHASE0B_RATIFICATION.md)

---

## 1. Scope validation objective

Validate and refine the proposed **Federated L2** package against Phase 0B ratified constraints. Determine what belongs in Phase 1, what is excluded, and what defers to Phase 2 (Event Pipeline) and Phase 3 (Historical Analytics).

---

## 2. Phase 1 — IN SCOPE

### 2.1 Unified analytics capability service

| Item | Detail |
|------|--------|
| **Deliverable** | `analyticsCapabilityService` (or unified facade over existing `analyticsDashboardSummaryService` + extracted personal/module/export logic) |
| **Location** | `server/src/services/analytics/` |
| **Behavior** | Single entry for all `/api/analytics/*` tenant capability reads |
| **Refactor** | Move inline Prisma from `analyticsController` into service methods |
| **Retain** | `analyticsDashboardSummaryService` as submodule or merge with clear method boundaries |

**Acceptance:** Zero inline Prisma in `analyticsController.ts` for capability routes.

### 2.2 Analytics ownership enforcement

| Item | Detail |
|------|--------|
| **Deliverable** | Capability ownership registry (mirrors `adminAnalyticsOwnership.ts` pattern) |
| **Locations** | `web/src/lib/analyticsCapabilityOwnership.ts` + `docs/analytics/ANALYTICS_CAPABILITY_OWNERSHIP_REGISTRY.md` |
| **Content** | Canonical vs satellite surfaces; owner class per API; consumer mapping |
| **Enforcement** | Static tests asserting Dashboard facade does not call module analytics APIs directly for cross-module metrics |

### 2.3 Removal of placeholder event subscriber

| Item | Detail |
|------|--------|
| **Deliverable** | Delete `analyticsDomainEventSubscriber.ts` placeholder registration |
| **Files** | `analyticsDomainEventSubscriber.ts`, `registerDomainEventSubscribers.ts` |
| **Replace with** | Nothing — federation-only until Phase 2 |
| **Documentation** | Update DOMAIN_EVENTS subscriber map in docs |

**Acceptance:** No `analytics_placeholder` subscriber in registry.

### 2.4 Dashboard analytics contract hardening

| Item | Detail |
|------|--------|
| **Deliverable** | Stable `dashboardAnalyticsFacade` + shared types; no Dashboard-side aggregation |
| **Verify** | `QuickStatsWidget`, `useDashboardStats`, `dashboardAIContextController` consume capability only |
| **Optional (K1-02)** | Wire `ExecutiveAnalyticsPanel` / `CrossModuleAnalyticsPanel` with feature flag OR permanent gate |
| **Out of scope** | Dashboard grid, widget registry, layout changes |

**Acceptance:** No new cross-module Prisma imports in `web/src/components/dashboard/`.

### 2.5 Business workspace analytics disposition

| Item | Detail |
|------|--------|
| **Problem** | `/business/:id/workspace/analytics` is L0 mock |
| **Option A (preferred)** | Wire to `businessAnalyticsService` + capability federation endpoint |
| **Option B** | Hide segment from `BusinessWorkspaceContent` until Phase 2 |
| **Kickoff** | K1-01 decision required before merge |

**Acceptance:** **No mock data** in product path — wire or hide.

### 2.6 Analytics API inventory cleanup

| Item | Detail |
|------|--------|
| **Deliverable** | Canonical API registry document + deprecation markers |
| **Canonical tenant APIs** | See §5 |
| **Cleanup actions** | Document satellite APIs (admin, module, AI); disposition orphans (`BusinessAnalyticsDashboard`, `ChatAnalytics`) per K1-04 |
| **Naming** | Resolve dual `PersonalAnalytics` type collision (platform vs Place) — document or rename DTOs |

### 2.7 PE parity review

| Item | Detail |
|------|--------|
| **Deliverable** | PE gate on all `/api/analytics/*` reads |
| **Current** | `dashboard-summary` uses `evaluateDashboardPolicyDual(DASHBOARD_READ)` |
| **Gap** | `/personal`, `/modules/:id`, `/export` — auth only |
| **Action** | Define read policy actions; enforce tenant scope; fail-closed |
| **Reference** | [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md) AP1–AP5 |

### 2.8 Activity vs analytics review

| Item | Detail |
|------|--------|
| **Problem** | `getPersonalAnalytics` reads `Activity` model directly |
| **Action** | Extract to service; document as **derived read** not activity feed substitute |
| **Rule** | Personal analytics must not expose activity rows beyond aggregated summaries |
| **Out of scope** | Activity platform migration (portfolio #2) |

### 2.9 Domain event review

| Item | Detail |
|------|--------|
| **Action** | Remove placeholder subscriber (§2.3) |
| **Document** | Phase 2 event pipeline prerequisites in operation matrix |
| **Out of scope** | New event types, rollup processors, metric family registry implementation |

### 2.10 Module rollup API decoupling

| Item | Detail |
|------|--------|
| **Problem** | `analyticsDashboardSummaryService` uses direct Chat/Todo Prisma |
| **Deliverable** | Module-owned rollup methods exposed via service APIs |
| **Minimum** | Chat unread count API; Todo pending task count API |
| **Acceptance** | Capability service calls module APIs — no direct `prisma.message` / `prisma.task` in analytics capability layer |

**Existing acceptable patterns:** Calendar `listEventsInRange`, Drive visibility adapter, `NotificationService`, `businessAnalyticsService`.

### 2.11 Operation matrix

| Item | Detail |
|------|--------|
| **Deliverable** | `docs/analytics/ANALYTICS_OPERATION_MATRIX.md` |
| **Content** | Read operations, PE actions, owner, source module, degraded behavior |
| **Minimum rows** | 4 capability routes + AI quick-stats path |

### 2.12 Contract tests

| Item | Detail |
|------|--------|
| **Extend** | `analyticsDashboardSummaryService.test.ts` |
| **Add** | Personal, module, export service tests; route integration tests; ownership registry tests |
| **Add** | Facade ownership test (no module API bypass for quickstats) |

### 2.13 Optional — performance cache

| Item | Detail |
|------|--------|
| **Deliverable** | TTL cache for `dashboard-summary` (in-process or Redis) |
| **Kickoff** | K1-05 — optional, not blocking L2 candidacy |
| **Constraint** | Cache is not warehouse — ephemeral only |

---

## 3. Phase 1 — OUT OF SCOPE

| Item | Reason | Deferred to |
|------|--------|-------------|
| Analytics warehouse / MVAP tables | SB-05 | Phase 2 |
| Event-derived rollup pipeline | SB-06 | Phase 2 |
| Async rollup processors | SB-06 | Phase 2 |
| Prisma schema for rollups | SB-05 | Phase 2 |
| Relationship analytics metrics | Prerequisite pipeline | Phase 2–3 |
| Historical trend APIs (30/90/365d) | Requires rollups | Phase 3 |
| AI trend consumption APIs | Requires history | Phase 3 |
| Wiring `ai/analytics/*` engines | AI Platform charter | Phase 3 |
| L2 certification ceremony | Separate candidacy | Post-Phase 1 governance |
| Ledger reclassification | Governance proposal only | Phase 1 doc — not ledger ACT |
| Admin Portal analytics changes | Separate L3 program | N/A |
| Module domain analytics interiors (HR, Place) | Module-owned | N/A |
| Enterprise panel full product launch | K1-02 optional | Phase 1 optional / Phase 3 |
| BigQuery / operator export | Scale | 2028 |
| Context Graph metric supplier | Pipeline | Phase 2–3 |
| New `/api/analytics/*` routes beyond cleanup | Scope control | Phase 2+ |

---

## 4. Deferral map

### Phase 2 — Event Pipeline + MVAP (2027)

| Item |
|------|
| Async analytics event subscriber |
| Rollup processors (platform cron jobs) |
| PostgreSQL tenant rollup tables (3–5 families) |
| Cache invalidation on domain events |
| Reconciliation jobs |
| V_Link metric families |
| Metric family registry implementation |
| Re-activate analytics subscriber (production implementation) |

**Prerequisites:** Platform Activity migration, Domain Events taxonomy, Platform Scheduler registry.

### Phase 3 — Historical Analytics + AI Consumption (2027–2028)

| Item |
|------|
| Historical trend APIs |
| Executive panel full wire (if gated in Phase 1) |
| Relationship analytics Phase 2B execution |
| AI bounded trend consumption endpoints |
| Context Graph metric supplier integration |
| `SupportAnalytics` activation |
| L3 CwF certification candidacy |
| L4 reference capability evaluation |

---

## 5. Canonical APIs (Phase 1)

### 5.1 Platform Analytics Capability — canonical

| Method | Path | Owner | Phase 1 action |
|--------|------|-------|----------------|
| GET | `/api/analytics/dashboard-summary` | Platform Capability | Harden — module API decoupling |
| GET | `/api/analytics/personal` | Platform Capability | Service extraction + PE |
| GET | `/api/analytics/modules/:moduleId` | Platform Capability | Service extraction + PE |
| GET | `/api/analytics/export` | Platform Capability | Service extraction + PE |
| GET | `/api/dashboard/ai/context/quick-stats` | Platform Capability (via Dashboard route) | Verify capability-backed |

### 5.2 Satellite — documented, not migrated

| Namespace | Owner |
|-----------|-------|
| `/api/admin-portal/analytics*` | Admin Portal |
| `/api/business/:id/analytics` | Business domain (feeds capability) |
| `/api/chat/analytics` | Chat module |
| `/api/hr/admin/analytics/*` | HR module |
| `/api/place/analytics` | Place module |
| `/api/ai/intelligence/*/analytics` | AI Platform |

### 5.3 Client canonical entry

| Asset | Role |
|-------|------|
| `web/src/lib/dashboardAnalyticsFacade.ts` | Dashboard consumer — **do not bypass** |
| `web/src/api/analytics.ts` | Capability API client |

---

## 6. Required services (Phase 1)

| Service | Action | Required? |
|---------|--------|-----------|
| `analyticsCapabilityService` | **Create / unify** | **Yes** |
| `analyticsDashboardSummaryService` | Refactor — decouple Prisma | **Yes** |
| `analyticsPersonalService` (or methods on capability service) | Extract from controller | **Yes** |
| `chatAnalyticsService` | Add rollup method for unread counts | **Yes** — coordination |
| Todo module service | Add pending task count rollup | **Yes** — coordination |
| `businessAnalyticsService` | Consume as-is for enterprise projection | **Yes** — no change |
| `adminAnalyticsService` | Out of scope | No |
| `analyticsDomainEventSubscriber` | **Remove** | **Yes** |

---

## 7. Mock and placeholder removal checklist

| System | Phase 1 action |
|--------|----------------|
| `placeholderAnalyticsDomainEventConsumer` | **Remove** |
| Business workspace analytics mock page | **Wire or hide** |
| `CalendarAnalyticsPanel` mock | Document as module interior deferred — **not Phase 1** unless Calendar team acts |
| `PersonalStatsWidget` mock | Document — Business front-page; **optional** Phase 1 hygiene |
| `CrossModuleAnalyticsPanel` placeholder UI cells | Replace with honest empty/degraded OR gate panel |
| Orphan `BusinessAnalyticsDashboard` | Mount or delete (K1-04) |
| Orphan `ChatAnalytics` | Mount or delete (K1-04) |

---

## 8. Scope validation verdict

| Question | Answer |
|----------|--------|
| Is Phase 1 scope bounded? | **Yes** — federation L2 hardening only |
| Are SB-05 / SB-06 respected? | **Yes** — no warehouse, no pipeline |
| Hidden scope creep risks? | Enterprise panel wire, Redis infra — kickoff gated |
| Sufficient for L2 candidacy prep? | **Yes** — post-Phase 1 expected ~20–22/27 |

**Scope validation:** **APPROVED**

---

**Last updated:** 2026-06-22
