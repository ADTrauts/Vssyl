# Dashboard Module — Analytics Boundary Analysis

**Program:** Dashboard Module Wave 3 — Phase 0A Constitutional Audit  
**Assessment date:** 2026-06-21  
**Status:** Discovery only

**Prior authority:** [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md)

---

## Purpose

Using Analytics domain findings, determine what Dashboard functionality belongs to Analytics, what stays outside Dashboard, and whether Dashboard should consume Analytics rather than generating analytics.

---

## 1. Executive determination

Dashboard should **consume** Platform Analytics Capability for cross-module rollups. It should **not** generate, warehouse, or mock analytics.

Today Dashboard **violates** this boundary in four places: Quick Stats widget/hook, AI quick-stats provider, Activity Feed placeholder fallback, and Enterprise analytics panels.

---

## 2. Boundary matrix (authoritative)

| Capability | Correct owner | Dashboard role today | Correct Dashboard role |
|------------|---------------|----------------------|------------------------|
| Cross-module tenant rollups | **Platform Analytics Capability** | Client aggregation in QuickStats | **Consume** `/api/analytics/*` or capability facade |
| Activity timeline read | **Platform activity / feed API** | ActivityFeedWidget host | **Consume** `/api/activity-feed` — no placeholders |
| AI bounded stats for twin | **Dashboard AI context service** delegating to Analytics | Direct Prisma in controller | **Delegate** — no foreign Prisma |
| Operator MRR/growth/BI | **Admin Portal** | None | None |
| HR attendance/time-off analytics | **HR module** | HR widget summary only | **Consume** `/api/hr/dashboard-summary` ✅ |
| Scheduling coverage metrics | **Scheduling module** | Scheduling widget | **Consume** module API ✅ |
| Chat analytics | **Chat module** | Via chat widget (conversations) | Module widget only |
| Place network analytics | **Place module** | None on dashboard grid | Module AI context only |
| Business workspace page analytics | **Analytics product surface** | Not in Dashboard module (separate route mock) | Out of scope |
| Enterprise executive metrics | **Analytics Capability** | Mock in `ExecutiveAnalyticsPanel` | **Consume** or hide until real |
| Cross-module enterprise insights | **Analytics Capability** | Mock in `CrossModuleAnalyticsPanel` | **Consume** or hide until real |
| Widget layout analytics (meta) | **Dashboard module** | AI overview provider ✅ | **Own** — widget counts/types only |
| Bookmarks/quick notes counts | **Dashboard module** | widget.config | **Own** — composition metadata |

---

## 3. Dashboard functionality that belongs to Analytics

| Current Dashboard artifact | Why it belongs to Analytics | Severity |
|----------------------------|----------------------------|----------|
| `QuickStatsWidget` multi-module fetch + merge | Derived rollup across Chat/Todo/Calendar/Drive | **Major** |
| `useDashboardStats` hook | Same aggregation at grid level | **Major** |
| `getDashboardQuickStats` AI provider | Cross-module Prisma aggregate (tasks, files, notifications) | **Blocking** |
| `ExecutiveAnalyticsPanel` mock metrics | Business intelligence surface | **Blocking** (trust) |
| `CrossModuleAnalyticsPanel` mock insights | Cross-module analytics product | **Blocking** (trust) |
| `EnhancedDashboardModule` quickMetrics state | Generated client metrics | **Major** |
| `ActivityFeedWidget` `generatePlaceholderActivities()` | Fake analytics/activity when API fails | **Blocking** (trust) |

---

## 4. Analytics functionality that must remain outside Dashboard

| Surface | Owner | Must not move into Dashboard |
|---------|-------|------------------------------|
| `/admin-portal/analytics` | Admin Portal | Operator metrics |
| `adminAnalyticsService` | Admin Portal | Platform MRR, segments, exports |
| `/api/analytics/personal`, `/modules/:id` | Platform capability | Canonical tenant analytics API |
| `analyticsDomainEventSubscriber` | Platform pipeline | Event ingestion |
| HR analytics dashboards | HR module | Domain SoR |
| `/business/:id/workspace/analytics` | Analytics product surface | Full-page business analytics (when built) |
| Relationship analytics models | Platform architecture | AP1–AP5 permission model |

---

## 5. Should Dashboard consume Analytics?

**Yes — for any cross-module metric or rollup.**

### Recommended consumption pattern (future — not implementation)

```
Dashboard widget / AI context
        │
        ▼
dashboardAnalyticsFacade (module boundary)
        │
        ▼
Platform Analytics Capability API
        │
        ├──► module-derived rollups (tenant-scoped, PE-gated)
        └──► activity feed adapter (read-only)
```

### What Dashboard continues to own without Analytics

- Widget type counts and layout summary (AI overview provider — metadata only)
- Widget-local config analytics (bookmark count, note count in config JSON)
- Picker/install eligibility (manifest + registry — not metrics)

---

## 6. Activity vs Analytics separation

Per [moduleSpecs.md](../../memory-bank/moduleSpecs.md):

| Type | Dashboard today | Correct |
|------|-----------------|---------|
| **Activity** | ActivityFeedWidget reads `/api/activity-feed` | ✅ Host only |
| **Analytics** | QuickStats, enterprise panels compute/display trends | ❌ Must not substitute activity log or invent metrics |

**Violation:** Placeholder activities on feed failure blur activity and analytics and violate trust.

---

## 7. Personal vs business analytics boundary

| Context | Dashboard analytics behavior | Owner |
|---------|---------------------------|-------|
| Personal grid | QuickStats aggregates user-global counts | Should scope by `dashboardId` via Analytics capability |
| Business grid | HR/scheduling widgets use `businessId` | ✅ Module APIs |
| Business enterprise | Mock executive dashboards | Must use Analytics capability or feature-off |

---

## 8. Dependency sequencing

| Prerequisite | Reason |
|--------------|--------|
| Analytics scope lock | Avoid building second analytics SoR in Dashboard |
| Platform Activity read honesty | ActivityFeedWidget depends on real feed |
| Domain Events taxonomy (partial) | Analytics subscriber currently placeholder |

Dashboard Wave 3 **can** proceed on widget/registry/services without waiting for Analytics L3 — but **must not** expand mock analytics; should flag enterprise/quickstats for delegation charter.

---

## 9. Phase 0A recommendations (governance only)

1. **Freeze** new Dashboard-native analytics features
2. **Classify** QuickStats + enterprise panels as **Analytics delegation backlog**
3. **Remove placeholder policy** for ActivityFeed (document as blocking finding)
4. **Keep** HR/Scheduling widget summaries as module API consumption — correct pattern
5. **Do not** merge business workspace `/workspace/analytics` page into Dashboard module without Analytics scope lock

---

**Last updated:** 2026-06-21
