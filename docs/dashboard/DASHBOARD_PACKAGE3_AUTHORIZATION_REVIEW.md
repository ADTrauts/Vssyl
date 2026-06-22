# Dashboard Module — Package 3 Authorization Review

**Program:** Dashboard Module Wave 3 — Package 3 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance review only — **no implementation**

**Baseline:** Package 1 complete · Package 2 complete · **~22–23/27 (~81–85%)**

**Closed:** DASH-B1, B2, B3 (server), B4, B5, M2, M3, M8

**Inputs:** [DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md](./DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md), [DASHBOARD_ANALYTICS_DEPENDENCY_MATRIX.md](./DASHBOARD_ANALYTICS_DEPENDENCY_MATRIX.md), [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md), post–Package 2 codebase survey

---

## 1. Review purpose

Determine whether **Package 3 — Analytics Decoupling** is sufficiently defined to authorize engineering ACT, and whether **Analytics Capability** should formally own cross-module projections currently computed or hosted inside Dashboard.

---

## 2. Area A — Analytics ownership review

### 2.1 Surface inventory (current code)

| Surface | Location | Data behavior today | Constitutional owner |
|---------|----------|---------------------|----------------------|
| **QuickStats widget** | `QuickStatsWidget.tsx` | Client aggregates Chat + Todo + Calendar; storage **hardcoded 23%** | **Analytics** (rollup) · Dashboard (host) |
| **useDashboardStats** | `useDashboardStats.ts` | Duplicate client aggregate (header/grid) | **Analytics** |
| **AI quick-stats (A-02)** | `dashboardAIContextController.getDashboardQuickStats` | Metadata stub (`stub: true`, null fields) | **Analytics** |
| **ExecutiveAnalyticsPanel** | `enterprise/ExecutiveAnalyticsPanel.tsx` | Empty arrays post–P1 mock removal; not mounted in default path | **Analytics** · Dashboard (host) |
| **CrossModuleAnalyticsPanel** | `enterprise/CrossModuleAnalyticsPanel.tsx` | Same as executive — empty, unmounted | **Analytics** · Dashboard (host) |
| **EnhancedDashboardModule** | `enterprise/EnhancedDashboardModule.tsx` | Not mounted — `DashboardModuleWrapper` shows showcase only | **Analytics** · Dashboard (host) |
| **DashboardEnterpriseShowcase** | `enterprise/DashboardEnterpriseShowcase.tsx` | Marketing/demo — labeled upsell | **Out of scope** (demo) |

### 2.2 Ownership classification

| Class | Surfaces |
|-------|----------|
| **Analytics-owned (data SoR)** | Cross-module rollups: messages, tasks, events, storage %, executive KPIs, cross-module insights |
| **Dashboard-owned (composition)** | Widget rows, layout, picker, grid chrome, quicknotes/bookmarks config |
| **Shared (hybrid)** | quickstats widget shell, enterprise panel chrome, A-02 provider route registration |
| **Out of scope** | Admin Portal operator analytics; HR/scheduling module summaries; platform activity feed |

### 2.3 Required ownership answers

| # | Surface | Owner |
|---|---------|-------|
| 2 | QuickStats | **Analytics** (data) · **Dashboard** (widget host) |
| 3 | useDashboardStats | **Analytics** (same contract as QuickStats) |
| 4 | AI quick-stats | **Analytics** (facade/backend reads) · **Dashboard** (PE + route) |
| 5 | Enterprise analytics panels | **Analytics** (metrics) · **Dashboard** (UI host / feature gate) |

---

## 3. Area B — Widget boundary review

See [DASHBOARD_WIDGET_BOUNDARY_MATRIX.md](./DASHBOARD_WIDGET_BOUNDARY_MATRIX.md).

**Summary:** 13 registry widgets — **1 analytics widget** (quickstats), **10 module widgets**, **2 composition widgets** (quicknotes, bookmarks), **1 platform-activity hybrid** (activityfeed).

---

## 4. Area C — Analytics capability scope

See [DASHBOARD_ANALYTICS_CAPABILITY_REVIEW.md](./DASHBOARD_ANALYTICS_CAPABILITY_REVIEW.md).

**Determination:** Analytics should be a **formal platform capability** (derived reads, event subscribers, permission-gated rollups). Dashboard must **not** continue owning cross-module projection logic after Package 3.

**Existing partial capability:** `/api/analytics/personal`, `/modules/:moduleId`, `/export` in `analyticsController.ts` (L1, controller-heavy, no `dashboard-summary` contract).

---

## 5. Area D — Package 3 scope validation

### 5.1 In scope (authorized when ACT)

| Workstream | Deliverable |
|------------|-------------|
| **Facade** | `dashboardAnalyticsFacade` (web) + server delegate for A-02 |
| **Read API** | Extend or add tenant-scoped summary endpoint (`dashboardId` aware) |
| **Client consumers** | `QuickStatsWidget`, `useDashboardStats` → facade only |
| **AI A-02** | Remove stub; consume facade or documented degraded empty state |
| **Enterprise** | Wire panels to facade **or** document permanent feature-off + council waiver |
| **Hygiene** | Drive widget random share; QuickStats storage placeholder |
| **Registry** | Align `quickstats` pseudo-moduleId (DASH-M1 / DASH-A6) |
| **B3-full** | Close client aggregate violations |

### 5.2 Explicitly out of scope

| Item | Deferred to |
|------|-------------|
| Analytics warehouse / rollup tables | Analytics capability program |
| Full `analyticsDomainEventSubscriber` implementation | Analytics capability program |
| Business workspace `/workspace/analytics` page rewrite | Analytics product surface program |
| Certification award / ledger update | Governance gate |
| Package 4 (hub landing, advisory items) | Package 4 |
| Widget relocation to Analytics module package | Not required — host model retained |

### 5.3 Remaining DASH-B3 items

| Item | P2 | P3 action |
|------|-----|-----------|
| A-02 cross-module aggregates | Stub (no Prisma) | Facade-backed reads |
| Client multi-module aggregation | Open | Remove from QuickStats / hook |
| Controller/service foreign Prisma on aggregates | Closed (P2) | Verify only |

**Note:** DASH-B4 (ActivityFeed placeholder) is **closed in Package 1** — not a Package 3 analytics item. Activity feed remains **platform activity**, not Analytics.

### 5.4 Related findings in Package 3 charter

| ID | In P3? | Notes |
|----|--------|-------|
| **DASH-B3 full** | ✅ | Primary objective |
| **DASH-M6** | ✅ | quickstats / useDashboardStats dedup |
| **DASH-M1** | ✅ | Registry alignment |
| **DASH-A6** | ✅ | quickstats pseudo-moduleId |
| **DASH-M4** | 🟡 Stretch | Operation matrix tests — chartered P2 but not implemented; may land P3 or P4 |

---

## 6. Area E — Certification impact

See [DASHBOARD_PACKAGE3_CERTIFICATION_IMPACT.md](./DASHBOARD_PACKAGE3_CERTIFICATION_IMPACT.md).

---

## 7. Area F — Authorization posture

| Option | Verdict |
|--------|---------|
| **A — Authorize Package 3 (Conditional)** | **Recommended** |
| **B — Require Analytics Capability Audit first** | **Not required** — discovery audit exists; scope **lock** at kickoff suffices |

**Conditions (K3 kickoff):** See [DASHBOARD_PACKAGE3_AUTHORIZATION_DECISION.md](./DASHBOARD_PACKAGE3_AUTHORIZATION_DECISION.md).

---

## 8. Required questions — answers

| # | Question | Answer |
|---|----------|--------|
| 1 | Is Package 3 fully defined? | **Conditional yes (~82%)** — K3-01–K3-04 at kickoff |
| 2 | Who owns QuickStats? | **Analytics** (data) · **Dashboard** (host widget) |
| 3 | Who owns useDashboardStats? | **Analytics** (same summary contract) |
| 4 | Who owns AI quick stats? | **Analytics** · Dashboard hosts PE + route |
| 5 | Who owns enterprise analytics panels? | **Analytics** (metrics) · Dashboard (UI host) |
| 6 | Does Analytics become a platform capability? | **Yes** — formal class; not a peer L3 module today |
| 7 | Remaining DASH-B3 items? | A-02 facade; client aggregates; B3-full closure |
| 8 | Readiness after Package 3? | **~24/27 (~89%)** |
| 9 | Dashboard certification readiness? | **L3 WITH FINDINGS candidate** — not plain L3 |
| 10 | Need separate Analytics program? | **Yes** — capability maturity beyond Dashboard P3 facade |
| 11 | Authorization recommendation? | **Option A — Authorize (Conditional)** |
| 12 | Should implementation begin? | **Yes** — after K3 kickoff decisions recorded |

---

## 9. Risk summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| `/api/analytics/*` L1 quality blocks honest metrics | Medium | Facade degraded mode; extend API in parallel |
| Business tenant analytics undefined | Medium | K3-02 — enterprise panels stay gated until contract exists |
| Duplicate aggregation paths persist | Low | Single facade contract for widget + hook + A-02 |
| Analytics program scope creep into P3 | Medium | Charter scope lock — Dashboard consumes only |

---

**Last updated:** 2026-06-21
