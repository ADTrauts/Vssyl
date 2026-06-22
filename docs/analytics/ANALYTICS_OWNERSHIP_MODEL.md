# Analytics Capability — Ownership Model

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Cross-reference:** [ANALYTICS_REALITY_ASSESSMENT.md](./ANALYTICS_REALITY_ASSESSMENT.md), [DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md](../dashboard/DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md), [ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md](../architecture/audits/ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md)

---

## 1. Ownership principles

| ID | Principle |
|----|-----------|
| **OW-1** | **Domain modules own domain metrics** — HR owns attendance; Chat owns message stats |
| **OW-2** | **Platform Analytics Capability owns cross-module tenant rollups** — dashboard summary, future event pipeline |
| **OW-3** | **Admin Portal owns operator/platform metrics** — MRR, growth, system health for admins |
| **OW-4** | **Dashboard owns composition only** — widgets, layouts, registry; consumes Analytics, never computes |
| **OW-5** | **Activity platform owns immutable event feed** — not analytics warehouse |
| **OW-6** | **AI Platform owns intelligence analytics** — learning, predictive, recommendation satellites |
| **OW-7** | **Analytics never grants access** — read-only consumer; PE must gate every path (AP5) |

---

## 2. Constitutional ownership matrix

### 2.1 By platform domain

| Domain | Owns | Does not own | Canonical entry |
|--------|------|--------------|-----------------|
| **Dashboard** | Widget rows, layout JSON, `widgetRegistry`, grid UX, sidebar customization, AI context for widget metadata | Cross-module rollups, metric computation, warehouse, operator BI | `dashboardService`, `widgetService` |
| **Analytics Capability** | `GET /api/analytics/dashboard-summary`, personal/module/export tenant APIs (immature), future event rollups, `analyticsDashboardSummaryService`, `dashboardAnalyticsFacade` contract | Widget chrome, admin operator metrics, module SoR, activity log | `/api/analytics/*` |
| **Admin Portal** | `adminAnalyticsService`, `/admin-portal/analytics`, BI insights tab, system/user/realtime metrics, exports, AB tests, segments | Business tenant product analytics, dashboard widget data | `/api/admin-portal/analytics*` |
| **Business Workspace** | Segment routing to analytics page (`case 'analytics'`) | Metric computation — shell is host only | `/business/:id/workspace/analytics` |
| **Business Operations** | HR, Scheduling domain analytics and dashboard-summary widgets | Cross-module enterprise rollups | `/api/hr/admin/analytics/*`, `/api/scheduling/dashboard-summary` |
| **AI Platform** | Learning/predictive/recommendation analytics APIs, `ModuleAIContextService` module metrics, unwired `ai/analytics/*` engines | Tenant dashboard quick stats (delegated to capability post P3) | `/api/ai/intelligence/*/analytics` |
| **Reporting** | Domain report generators (HR time-off reports, workforce comms reports) | Platform-wide report warehouse | Per-module report routes |
| **Exports** | Split — tenant `/api/analytics/export` (L1), admin `POST /analytics/export`, place `/api/place/export` | Unified export framework |
| **Platform Activity** | `/api/activity-feed`, module activity emissions | Analytics aggregates | `dashboardActivityService`, activity APIs |
| **Platform Ops** | `SystemMetrics` writes, performance/security/support satellites | Product analytics | `systemMonitoringService` |

### 2.2 By metric category

| Metric category | Owner | Backend | Consumer surfaces |
|-----------------|-------|---------|-------------------|
| **Executive Metrics** | Analytics Capability (enterprise projection) | `analyticsDashboardSummaryService.buildEnterpriseProjection` → `businessAnalyticsService` | `ExecutiveAnalyticsPanel`, `EnhancedDashboardModule` |
| **Quick Stats** | Analytics Capability | `dashboard-summary` | `QuickStatsWidget`, `useDashboardStats`, AI quick-stats |
| **Cross-Module Rollups** | Analytics Capability | `enterprise.moduleRollups` in summary DTO | `CrossModuleAnalyticsPanel` |
| **Usage Metrics** | Platform metering + Admin Portal | `usageTrackingService`, `adminAnalyticsService` | Admin analytics, developer portal |
| **System Metrics** | Platform Ops / Admin Portal | `SystemMetrics`, `adminPerformanceService` | Admin performance page |
| **Audit Metrics** | Admin Portal (logs) + Account Platform | `logService.getLogAnalytics` | System logs, profile audit trail |
| **Business Projections** | Analytics Capability (federation) | `businessAnalyticsService` composed into summary | Enterprise panels, business profile |
| **Module Adoption** | Business domain + Analytics read | `businessAnalyticsService.getBusinessModuleAnalytics` | Business profile, orphaned `BusinessAnalyticsDashboard` |
| **HR Metrics** | HR module | `hrAnalyticsService`, `hrAnalyticsSupportService` | HR admin analytics, `HRWidget` |
| **Chat Metrics** | Chat module | `chatAnalyticsService` | `ChatAnalytics` (orphan) |
| **Place Metrics** | Place module | `placeVisibilityService` | `PlaceAnalyticsDashboard` |
| **Workforce Comms Metrics** | Workforce Comms module | `workforceReportingService` | Reporting panels |
| **AI Performance Metrics** | AI Platform | `ModuleAIPerformanceMetric`, intelligence engines | Admin AI pipeline, AI dashboards |
| **Relationship Metrics** | Platform Capability (future) | Spec in `RELATIONSHIP_ANALYTICS_MODEL.md` | Not implemented |

---

## 3. Consumer / producer map

### 3.1 Systems that **produce** analytics (compute derived metrics)

```
Module SoR ──────────────────────────────────────────────┐
  Chat, Todo, Calendar, Drive, Notifications, HR,       │
  Place, Workforce Comms, Business, AI intelligence      │
                                                         ▼
Platform Capability ── analyticsDashboardSummaryService ──► dashboard-summary DTO
Business domain ────── businessAnalyticsService ──────────► enterprise projection
Admin services ─────── adminAnalyticsService ───────────► operator metrics
Platform ops ───────── systemMonitoringService ─────────► SystemMetrics rows
AI learning ────────── CentralizedLearningEngine ───────► learning analytics
Domain events ──────── (placeholder only) ──────────────► (nothing persisted)
```

### 3.2 Systems that **consume** analytics

| Consumer | Consumes from | Contract |
|----------|---------------|----------|
| `QuickStatsWidget` | Analytics Capability | `dashboardAnalyticsFacade` |
| `useDashboardStats` / `DashboardHeader` | Analytics Capability | Facade → header stats |
| `dashboardAIContextController` | Analytics Capability | `getDashboardAnalyticsSummaryForAI` |
| `ExecutiveAnalyticsPanel` | Analytics Capability | `enterprise.metrics` |
| `CrossModuleAnalyticsPanel` | Analytics Capability | `enterprise.moduleRollups` |
| `HRWidget` | HR module | `/api/hr/dashboard-summary` |
| `SchedulingWidget` | Scheduling module | `/api/scheduling/dashboard-summary` |
| `ActivityFeedWidget` | Platform Activity | `/api/activity-feed` (not analytics) |
| Admin Portal pages | Admin Portal | `adminApiService` |
| Profile analytics page | Analytics Capability (personal) | `/api/analytics/personal` |
| Business workspace page | **Nothing** (mock) | — |
| Business profile tab | Business + Analytics federation | `/api/business/:id/analytics` |
| Place consumer UI | Place module | `/api/place/analytics` |
| AI intelligence UIs | AI Platform | `/api/ai/intelligence/*/analytics` |
| Dashboard module (host) | Analytics Capability | Facade only — no direct module API aggregation |

---

## 4. Boundary decisions (post Dashboard Wave 3)

| Question | Owner | Evidence |
|----------|-------|----------|
| Who owns QuickStats data? | **Analytics Capability** | Package 3 facade + `dashboard-summary` |
| Who owns QuickStats widget chrome? | **Dashboard** | `QuickStatsWidget`, registry |
| Who owns AI quick-stats aggregate? | **Analytics Capability** | `dashboardAIContextController` uses summary service |
| Who owns enterprise BI panels data? | **Analytics Capability** | `enterprise` projection in summary |
| Who owns enterprise panel UI? | **Dashboard** | Enterprise components |
| Who owns operator MRR/growth charts? | **Admin Portal** | Stage 0C canonical path |
| Who owns HR attendance charts? | **HR module** | Domain service |
| Who owns activity feed? | **Platform Activity** | Not analytics |
| Who owns `analytics` pseudo-module route? | **Unowned product surface** — should be capability-backed or deferred | Mock page today |

---

## 5. Violations and leaks (current state)

| Violation | Severity | Location | Remediation direction |
|-----------|----------|----------|----------------------|
| Business workspace analytics mock | **Major** | `workspace/analytics/page.tsx` | Wire to capability + business APIs or hide segment |
| `analyticsController` inline Prisma | **Major** | personal/module/export handlers | Extract to capability service layer |
| Placeholder event subscriber forever | **Major** | `analyticsDomainEventSubscriber.ts` | Activate pipeline or remove registration |
| Dual `PersonalAnalytics` types | **Moderate** | `api/analytics.ts` vs `api/placeAnalytics.ts` | Namespace or rename DTOs |
| Orphan analytics components | **Moderate** | `BusinessAnalyticsDashboard`, `ChatAnalytics` | Mount or delete |
| Enterprise panels unwired | **Moderate** | `DashboardModuleWrapper` | Product decision — wire or permanent gate |
| `analytics` ledger row as product module | **Governance** | CERTIFICATION_LEDGER | Reclassify to platform capability (future governance pass) |
| Memory Bank claims all ❌ | **Documentation** | `analyticsProductContext.md` | Update in Phase 0B+ |

---

## 6. Target ownership model (constitutional)

```
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN PORTAL (L3 CwF)                                             │
│ Operator metrics · MRR · growth · system health · BI insights     │
│ adminAnalyticsService · /admin-portal/analytics                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PLATFORM ANALYTICS CAPABILITY (L1→L2 target)                      │
│ Cross-module tenant rollups · event pipeline · permission gates     │
│ analyticsDashboardSummaryService · /api/analytics/*                 │
│ ANALYTICS_PERMISSION_MODEL enforcement                            │
└──────────────────────────────────────────────────────────────────┘
         │ federates                    │ federates
         ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────────────────┐
│ MODULE DOMAIN       │    │ BUSINESS TENANT PRODUCT SURFACE       │
│ ANALYTICS           │    │ /workspace/analytics (capability-backed)│
│ HR · Chat · Place · │    │ Business profile analytics tab        │
│ Workforce · etc.    │    └──────────────────────────────────────┘
└─────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
         ┌──────────────────────────────────────┐
         │ DASHBOARD MODULE (L3 CwF)             │
         │ Widget host · facade consumer only    │
         │ quickstats · enterprise panels        │
         └──────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ AI PLATFORM (L2) — intelligence analytics satellites              │
│ Learning · predictive · recommendation · module AI performance    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Ownership answers (required questions subset)

| # | Question | Answer |
|---|----------|--------|
| 2 | Who owns Analytics? | **Split:** Platform Capability (tenant rollups), Admin Portal (operator), modules (domain), AI Platform (intelligence) |
| 3 | Is Analytics a module? | **No** — pseudo-module registry entry only |
| 4 | Is Analytics a platform capability? | **Yes** — primary class for cross-module tenant analytics |

---

**Last updated:** 2026-06-22
