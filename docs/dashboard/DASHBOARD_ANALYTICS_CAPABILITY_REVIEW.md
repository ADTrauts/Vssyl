# Dashboard Module — Analytics Capability Review

**Program:** Dashboard Module Wave 3 — Package 3 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

**Cross-reference:** [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md), [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md)

---

## 1. Determination: platform capability vs Dashboard ownership

| Question | Answer |
|----------|--------|
| Should Analytics be a formal platform capability? | **Yes** |
| Should Dashboard continue owning analytics projections? | **No** — host only |
| Is Analytics a true L3 module today? | **No** — pseudo-module / capability hybrid |

**Rationale:**

1. **Constitutional fit** — Cross-module rollups are derived reads with permission-gated federation; platform standards §0.1 lists `analytics` as runtime pseudo-module, not peer module like Chat or Drive.
2. **SoR clarity** — Dashboard owns `Widget` rows; Analytics owns **derived metrics** computed from module/platform sources — no analytics-specific warehouse models exist yet, but capability owns the **read contract**.
3. **Existing partial implementation** — `/api/analytics/personal`, module analytics, export routes already exist under platform namespace — immature (L1) but directionally correct.
4. **Separation charter AS-2** — Dashboard must consume, not compute.
5. **Admin Portal boundary** — Operator analytics (`adminAnalyticsService`) is separate; tenant product analytics is capability scope, not Admin Portal.

---

## 2. Analytics capability inventory (relevant to Dashboard P3)

| System | Maturity | Dashboard P3 relationship |
|--------|----------|---------------------------|
| `/api/analytics/personal` | L1 partial | **Extend** or add `dashboard-summary` variant |
| `/api/analytics/modules/:moduleId` | L1 partial | Reference pattern for module federation |
| `analyticsDomainEventSubscriber` | Placeholder | Future cache invalidation — not P3 blocker |
| `analytics` in `coreModuleRegistry` | L1 metadata | Registry alignment in P3 |
| Business `/workspace/analytics` page | L0 mock | **Separate program** — not Dashboard P3 |
| AI `server/src/ai/analytics/*` | L2 satellite | Out of Dashboard P3 |
| Admin Portal analytics | L3 CwF | Out of scope |

---

## 3. Capability responsibilities (formal)

| Responsibility | Owner | P3 minimum |
|----------------|-------|------------|
| Tenant-scoped dashboard summary DTO | Analytics Capability | **Required** for B3-full |
| PE / permission gate on rollup reads | Analytics Capability | **Required** — `dashboardId` + tenant context |
| Event-driven rollup invalidation | Analytics Capability | Deferred |
| Analytics warehouse / materialized views | Analytics Capability | Deferred |
| Widget UI chrome | Dashboard Module | Retained |
| Module domain summaries (HR, Scheduling) | Respective modules | Unchanged |

---

## 4. Recommended read API contract (charter — not implemented)

**Primary candidate:**

```
GET /api/analytics/dashboard-summary?dashboardId={id}
```

| Field | Source module |
|-------|---------------|
| `pendingTasks` | Todo rollup (tenant-scoped) |
| `unreadMessages` | Chat rollup |
| `upcomingEvents` | Calendar rollup |
| `storageUsedPercent` | Drive quota rollup |
| `degraded` | `true` when source unavailable |
| `asOf` | ISO timestamp |

**Alternative:** Extend `GET /api/analytics/personal` with `dashboardId` query — requires kickoff decision **K3-01**.

**Authorization:** Analytics read path must enforce same tenant context as Dashboard PE (`DASHBOARD_READ` or dedicated `ANALYTICS_READ` with dashboard scope).

---

## 5. Dashboard facade pattern (Package 3)

| Layer | Location | Role |
|-------|----------|------|
| **Client facade** | `web/src/.../dashboardAnalyticsFacade.ts` (new) | Single browser entry for widget + hook |
| **Server delegate** | Extend `dashboardAIContextService` or thin analytics adapter | A-02 server path |
| **Capability backend** | `analyticsController` → future `analyticsService` | Canonical rollup reads |

**Degraded mode policy (K3-03):** If capability endpoint returns partial data, facade surfaces `degraded: true` — **no client-side multi-module fallback**.

---

## 6. Why not keep projections in Dashboard?

| Risk | Impact |
|------|--------|
| Duplicate logic (widget + hook + A-02) | Drift, inconsistent KPIs |
| Client-side aggregation bypasses PE | G1/G3 certification failure |
| Dashboard becomes god-module for metrics | Blocks marketplace module parity |
| Violates activity vs analytics separation | moduleSpecs.md |

---

## 7. Separate Analytics program — scope

Dashboard Package 3 **does not** deliver full Analytics capability L3. A **parallel Analytics Capability Program** should cover:

| Track | Deliverables |
|-------|--------------|
| **Capability L2** | Canonical `analyticsService`; PE on all read paths; operation matrix |
| **Event pipeline** | Real `analyticsDomainEventSubscriber` rollups |
| **Business product surface** | Replace `/workspace/analytics` mock page |
| **Ledger classification** | Clarify pseudo-module vs capability in portfolio |
| **Certification** | Capability L3 WITH FINDINGS (separate from Dashboard) |

**Dashboard P3 dependency:** Capability must expose **minimum viable dashboard-summary** — may ship with empty/degraded responses while capability matures.

---

## 8. Kickoff decisions required

| ID | Decision | Options |
|----|----------|---------|
| **K3-01** | Summary API shape | New `dashboard-summary` vs extend `/personal` |
| **K3-02** | Enterprise panels | Facade wire vs permanent feature-off + waiver |
| **K3-03** | Degraded empty policy | Strict no-fallback vs time-boxed client aggregate |
| **K3-04** | Registry `quickstats` id | `capabilityId: analytics` vs rename to dashboard-hosted analytics widget |

---

## 9. Answer to required question 6

**Does Analytics become a platform capability?**

**Yes.** Package 3 formalizes consumption boundaries; a separate program matures the capability to L2/L3. Dashboard ceases owning rollup computation.

---

**Last updated:** 2026-06-21
