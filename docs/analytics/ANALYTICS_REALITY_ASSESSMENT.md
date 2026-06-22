# Analytics Capability — Reality Assessment

**Program:** Analytics Capability Phase 0A — Constitutional Discovery Audit  
**Date:** 2026-06-22  
**Status:** Discovery only — **no implementation, no certification, no ledger changes**

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1; [ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md](../workspace-review/ANALYTICS_DOMAIN_BOUNDARY_ANALYSIS.md); [DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md](../dashboard/DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md)

**Context:** Dashboard Module Wave 3 (Package 3) is complete and archived. Dashboard owns composition; Analytics owns projections, rollups, metrics, aggregates, and summaries.

---

## 1. Executive summary

Analytics in Vssyl is **not a single system** — it is a **federated constellation** of platform capability reads, operator admin services, module-local domain analytics, AI intelligence satellites, and stub product surfaces. There is **no canonical analytics warehouse**, **no materialized rollup pipeline**, and **no registered built-in module** for `analytics`.

Post Dashboard Package 3, the **first honest cross-module tenant contract** exists: `GET /api/analytics/dashboard-summary` via `analyticsDashboardSummaryService` and `dashboardAnalyticsFacade`. Everything else remains at L0–L2 maturity with significant duplication, orphan UIs, and unwired AI scaffold engines.

**Inventory count:** **47 distinct analytics-related systems** across 12 categories (see §3).

---

## 2. What Analytics is (working definition)

| Layer | Definition |
|-------|------------|
| **Platform Analytics Capability** | Tenant-scoped derived reads, cross-module rollups, permission-gated federation, future event-driven materialization |
| **Operator Analytics** | Platform MRR, growth, segments, BI insights — Admin Portal scope |
| **Module Domain Analytics** | Metrics owned by a module's SoR (HR attendance, chat message stats, place network) |
| **AI Analytics Satellites** | Learning, predictive, recommendation analytics under AI Platform |
| **Product Analytics Surfaces** | User-facing pages that consume the above — some real, many mock |

Analytics is **derived data** — never authoritative for domain state. Activity log is immutable events; analytics are computed projections.

---

## 3. Full inventory

### 3.1 Routes (tenant / platform read APIs)

| Mount | Method | Path | Controller / handler | Service | Maturity |
|-------|--------|------|---------------------|---------|----------|
| `/api/analytics` | GET | `/dashboard-summary` | `analyticsController.getDashboardSummary` | `analyticsDashboardSummaryService` | **L2 partial** |
| `/api/analytics` | GET | `/personal` | `getPersonalAnalytics` | Inline Prisma (Activity, File, ModuleInstallation) | L1 |
| `/api/analytics` | GET | `/modules/:moduleId` | `getModuleAnalytics` | Inline Prisma | L1 |
| `/api/analytics` | GET | `/export` | `exportAnalytics` | Inline Prisma | L1 |
| `/api/dashboard` | GET | `/ai/context/quick-stats` | `dashboardAIContextController` | `analyticsDashboardSummaryService.getDashboardAnalyticsSummaryForAI` | L2 |
| `/api/business` | GET | `/:id/analytics` | `businessController` | `businessAnalyticsService` | L2 |
| `/api/business` | GET | `/:id/module-analytics` | `businessController` | `businessAnalyticsService` | L2 |
| `/api/chat` | GET | `/analytics` | `chatController` | `chatAnalyticsService` | L2 |
| `/api/place` | GET | `/analytics` | `placeAnalyticsController` | `placeVisibilityService.getPersonalAnalytics` | L2 |
| `/api/place` | GET | `/ai/context/analytics` | `placeAnalyticsController` | `placeVisibilityService` | L3 module interior |
| `/api/hr` | GET | `/admin/analytics/onboarding` | `hrController` | `hrAnalyticsService` | L3 module interior |
| `/api/hr` | GET | `/admin/analytics/attendance` | `hrController` | `hrAnalyticsService` | L3 module interior |
| `/api/hr` | GET | `/admin/analytics/time-off` | `hrController` | `hrAnalyticsService` | L3 module interior |
| `/api/hr` | GET | `/dashboard-summary` | `hrController` | `hrAnalyticsSupportService` | L3 module interior |
| `/api/hr` | GET | `/admin/time-off/reports` | `hrController` | `hrAnalyticsSupportService` | L3 module interior |
| `/api/workforce-comms` | GET | `/admin/reports/*` | `workforceCommsAdminController` | `workforceReportingService` | L2 domain |
| `/api/developer` | GET | `/modules/:moduleId/analytics` | `developerPortalController` | `developerPortalService` | L1 |
| `/api/admin/logs` | GET | `/analytics` | `logController` | `logService` | L2 satellite |
| `/api/admin/modules/:moduleId/ai/analytics` | GET | — | inline | `ModuleAIContextService` | L2 satellite |
| `/api/business-ai` | GET | `/:businessId/analytics` | inline | `businessAIService` | L2 satellite |
| `/api/admin/business-ai` | GET | `/:businessAIId/analytics` | inline | Prisma aggregates | L1 |
| `/api/ai/intelligence` | GET | `/learning/analytics` | inline | `CentralizedLearningEngine` | L2 AI |
| `/api/ai/intelligence` | GET | `/predictive/analytics` | inline | `PredictiveIntelligenceEngine` | L2 AI |
| `/api/ai/intelligence` | GET | `/recommendations/analytics` | inline | `IntelligentRecommendationsEngine` | L2 AI |

### 3.2 Admin Portal routes (operator analytics)

Registered under `/api/admin-portal` via `adminPortalRoutes.analyticsOps.ts` and `adminPortalRoutes.platform.ts`.

| Method | Path | Service | Role |
|--------|------|---------|------|
| GET | `/analytics` | `adminAnalyticsService.getAnalytics` | **Canonical** operator overview |
| GET | `/analytics/system` | `getSystemMetricsForTimeRange` | Canonical |
| GET | `/analytics/users` | `getUserAnalyticsGrouped` | Canonical |
| GET | `/analytics/realtime` | `getRealTimeMetrics` | Canonical |
| POST | `/analytics/export` | `exportAnalytics` | Canonical |
| POST | `/analytics/custom-report` | `generateCustomReport` | Canonical |
| GET | `/dashboard/stats` | `getDashboardStatsWithTrends` | Satellite summary |
| GET | `/business-intelligence` | `getBusinessIntelligence` | Insights tab data |
| GET | `/business-intelligence/*` | AB tests, segments, predictive, competitive | Insights satellites |
| GET | `/support/analytics` | `adminSupportService` | Satellite |
| GET | `/performance/metrics` | `adminPerformanceService` | Infra satellite |
| GET | `/performance/analytics` | `adminPerformanceService` | Infra satellite |
| GET | `/modules/analytics` | `adminModuleGovernanceService` | Module governance satellite |
| GET | `/security/metrics` | `adminSecurityService` | Security satellite |
| GET | `/ai-pipeline/suggestions/metrics` | `suggestionFunnelMetrics` | AI control plane |

**Canonical UI:** `/admin-portal/analytics` (+ `?tab=insights`). Registry: `web/src/lib/adminAnalyticsOwnership.ts`.

### 3.3 Services

| Service | Path | Responsibility | Owner class |
|---------|------|----------------|-------------|
| `analyticsDashboardSummaryService` | `server/src/services/analytics/` | **Canonical tenant dashboard rollup** — chat, todo, calendar, drive, notifications, enterprise projection | Platform Capability |
| `adminAnalyticsService` | `server/src/services/admin/` | Operator platform BI, system/user metrics, exports, AB tests | Admin Portal |
| `businessAnalyticsService` | `server/src/services/business/` | Business member/file/conversation/storage counts | Business domain (feeds capability) |
| `chatAnalyticsService` | `server/src/services/` | Chat message/conversation aggregates | Chat module |
| `hrAnalyticsService` | `server/src/services/` | HR onboarding, attendance, time-off | HR module |
| `hrAnalyticsSupportService` | `server/src/services/` | HR dashboard summary + time-off reports | HR module |
| `placeVisibilityService` | `server/src/services/place/` | Place network/spending/engagement rollups | Place module |
| `workforceReportingService` | `server/src/services/` | Workforce comms engagement reports | Workforce Comms |
| `developerPortalService` | `server/src/services/` | Module install/usage for developers | Developer Portal |
| `logService` | `server/src/services/` | Log volume/severity aggregates | Admin satellite |
| `systemMonitoringService` | `server/src/services/` | **Writes** `SystemMetrics` rows | Platform ops |
| `usageTrackingService` | `server/src/services/` | Feature usage via `UsageRecord` aggregates | Platform metering |
| `adminSupportService` | `server/src/services/admin/` | Support ticket analytics | Admin satellite |
| `adminPerformanceService` | `server/src/services/admin/` | Infra performance metrics | Admin satellite |
| `adminModuleGovernanceService` | `server/src/services/admin/` | Module/developer stats | Admin satellite |
| `adminSecurityService` | `server/src/services/admin/` | Security metrics | Admin satellite |
| `ModuleAIContextService` | `server/src/ai/services/` | Per-module AI query/latency metrics | AI Platform |

**Gap:** No unified `analyticsService` facade. `analyticsController` still uses inline Prisma for personal/module/export paths.

### 3.4 Controllers

| Controller | Analytics handlers |
|------------|-------------------|
| `analyticsController.ts` | `getPersonalAnalytics`, `getModuleAnalytics`, `getDashboardSummary`, `exportAnalytics` |
| `dashboardAIContextController.ts` | `getDashboardQuickStats` (capability-backed) |
| `businessController.ts` | `getBusinessAnalytics`, `getBusinessModuleAnalytics` |
| `chatController.ts` | `getChatAnalytics` |
| `placeAnalyticsController.ts` | `getPersonalAnalytics`, `getPlaceAnalyticsContext` |
| `hrController.ts` | Onboarding, attendance, time-off analytics, dashboard summary, reports |
| `developerPortalController.ts` | `getModuleAnalytics` |
| `logController.ts` | `getLogAnalytics` |
| `workforceCommsAdminController.ts` | Summary, communications, campaigns, acknowledgements reports |

Admin portal routes use **inline handlers** — no dedicated `adminAnalyticsController`.

### 3.5 Frontend — API clients

| File | Endpoints | UI consumers |
|------|-----------|--------------|
| `web/src/api/analytics.ts` | `/api/analytics/personal`, `/modules/:id`, `/export`, `/dashboard-summary` | Profile page, facade, QuickStats |
| `web/src/api/hrAnalytics.ts` | `/api/hr/admin/analytics/*` | HR analytics dashboards |
| `web/src/api/placeAnalytics.ts` | `/api/place/analytics`, feed, export | PlaceAnalyticsDashboard |
| `web/src/api/business.ts` | `/api/business/:id/analytics`, `module-analytics` | Business profile, orphaned BusinessAnalyticsDashboard |
| `web/src/api/workforceComms.ts` | `/api/workforce-comms/admin/reports/*` | Workforce reporting panels |
| `web/src/lib/adminApiService.ts` | `/api/admin-portal/analytics*`, `/business-intelligence` | Admin portal pages |
| `web/src/api/developerPortal.ts` | Module analytics | Developer portal |
| `web/src/api/logs.ts` | `/api/admin/logs/analytics` | System logs page |

### 3.6 Frontend — hooks

| Hook | Path | Consumes | Status |
|------|------|----------|--------|
| `useDashboardStats` | `web/src/hooks/useDashboardStats.ts` | `dashboardAnalyticsFacade` → `/api/analytics/dashboard-summary` | **Live** — Package 3 |

No other dedicated `useAnalytics*` hooks. Surfaces use inline `useState`/`useEffect`.

### 3.7 Frontend — widgets and panels

| Component | Path | Data source | Maturity |
|-----------|------|-------------|----------|
| `QuickStatsWidget` | `web/src/components/widgets/` | `dashboardAnalyticsFacade` | **L2** — capability-backed |
| `ActivityFeedWidget` | `web/src/components/widgets/` | `/api/activity-feed` (activity, not analytics) | L3 — platform activity |
| `HRWidget` | `web/src/components/widgets/` | `/api/hr/dashboard-summary` | L3 — module API |
| `SchedulingWidget` | `web/src/components/widgets/` | `/api/scheduling/dashboard-summary` | L3 — module API |
| `ExecutiveAnalyticsPanel` | `web/src/components/dashboard/enterprise/` | `summary.enterprise.metrics` via facade | L2 partial |
| `CrossModuleAnalyticsPanel` | `web/src/components/dashboard/enterprise/` | `summary.enterprise.moduleRollups` | L2 partial — UI placeholders remain |
| `EnhancedDashboardModule` | `web/src/components/dashboard/enterprise/` | Facade enterprise projection | L2 — **unwired** from callers |
| `CalendarAnalyticsPanel` | `web/src/components/calendar/enterprise/` | **Mock data only** | L0 |
| `PersonalStatsWidget` | `web/src/components/business/widgets/` | **Mock/setTimeout** | L0 |

**Widget registry:** `quickstats` tagged `capabilityId: 'analytics'` in `widgetRegistry.ts`.

### 3.8 Frontend — pages

| Page | Route | Data reality |
|------|-------|--------------|
| Admin Platform Analytics | `/admin-portal/analytics` | **Live** — `adminApiService.getAnalytics` |
| Admin BI Insights tab | `/admin-portal/analytics?tab=insights` | **Live** — `getBusinessIntelligence` |
| Profile analytics | `/profile/analytics` | **Live** — `/api/analytics/personal` |
| Business workspace analytics | `/business/:id/workspace/analytics` | **L0 mock** — TODO API |
| Business profile analytics tab | `/business/:id/profile` | **Live** — `businessAPI.getBusinessAnalytics` |
| HR analytics hub | `/business/:id/admin/hr/analytics` | **Live** — HR dashboards |
| Place analytics tab | Place consumer experience | **Live** — `placeAnalytics.getPersonalAnalytics` |
| Workforce reporting | Workforce comms views | **Live** — report APIs |
| AI intelligence dashboards | AI module surfaces | **Live** — `/api/ai/intelligence/*/analytics` |

### 3.9 Orphan / unwired components

| Component | Issue |
|-----------|-------|
| `BusinessAnalyticsDashboard.tsx` | No mount point found — calls live APIs but unused |
| `ChatAnalytics.tsx` | No mount point found |
| `fetchEnterpriseAnalyticsProjection` | Defined in facade, never called |
| `enableEnterpriseAnalytics` on `DashboardModuleWrapper` | Never passed `true` |

### 3.10 Runtime registry

| Entry | File | Notes |
|-------|------|-------|
| `analytics` pseudo-module | `coreModuleRegistry.ts` | Business-scoped route to `/workspace/analytics` — **not** `registerBuiltInModules` |
| `quickstats` | `coreModuleRegistry.ts` | Widget capability; data owned by Analytics (K3-04) |

### 3.11 Event consumers

| Subscriber | Path | Status |
|------------|------|--------|
| `placeholderAnalyticsDomainEventConsumer` | `analyticsDomainEventSubscriber.ts` | **Placeholder** — debug log only; registered on all domain events |
| `AIEventConsumer` | `server/src/ai/consumers/` | AI learning — not analytics pipeline |

**No analytics materialization from domain events exists.**

### 3.12 Scheduled jobs / warehouse behavior

| Job | Path | Analytics relevance |
|-----|------|---------------------|
| `platformCronJobs` | `server/src/jobs/platformCronJobs.ts` | **No analytics rollup jobs** |
| `ai_provider_sync` | platform cron | Feeds usage metrics |
| `PatternAnalysisScheduler` | `server/src/ai/learning/` | Opt-in AI collective patterns |
| `systemMonitoringService` | writes `SystemMetrics` | Only persisted time-series actively written |

**Rollups are on-demand** in `analyticsDashboardSummaryService` (direct Prisma + module service calls). No materialized views, no snapshot jobs.

### 3.13 Prisma models (analytics-related)

| Model | Status |
|-------|--------|
| `SystemMetrics` | **Active** — admin analytics + monitoring |
| `SupportAnalytics` | Schema present — admin support rollups |
| `UsageRecord` | Active — feature metering |
| `ModuleAIPerformanceMetric` | Active — module AI metrics |
| `BusinessAIUsageMetric` | Active — business AI usage |
| `PlaceAnalyticsSnapshot` | **Schema only** — zero server writes |
| `DataStream`, `DataPoint`, `RealTimeMetric`, `Forecast`, `Anomaly`, `BusinessMetric`, `KPIDashboard`, etc. | **Scaffold** — AI analytics package models, unwired |
| `UserAnalytics`, `BusinessIntelligence` | **Do not exist** as Prisma models |

### 3.14 AI analytics engines

| Engine | Path | Wired? |
|--------|------|--------|
| `RealTimeAnalyticsEngine` | `server/src/ai/analytics/` | **No** |
| `BusinessIntelligenceEngine` | `server/src/ai/analytics/` | **No** |
| `AIPoweredInsightsEngine` | `server/src/ai/analytics/` | **No** |
| `PredictiveIntelligenceEngine` (analytics pkg) | `server/src/ai/analytics/` | **No** |
| `PredictiveIntelligenceEngine` (intelligence) | `server/src/ai/intelligence/` | **Yes** — user API |
| `CentralizedLearningEngine` | `server/src/ai/learning/` | **Yes** — learning analytics |
| `PredictiveAnalyticsEngine` | `server/src/ai/learning/` | Used by learning engine |

### 3.15 Constitutional / governance docs

| Document | Role |
|----------|------|
| `ANALYTICS_PERMISSION_MODEL.md` | AP1–AP5 fail-closed rules — **spec only**, partial code enforcement |
| `RELATIONSHIP_ANALYTICS_MODEL.md` | Derivation methods — warehouse marked **future** |
| `RELATIONSHIP_ANALYTICS_GOVERNANCE.md` | Federation patterns |
| `DASHBOARD_ANALYTICS_SEPARATION_CHARTER.md` | AS-1–AS-6 ownership principles |
| `ADMIN_PORTAL_ANALYTICS_*` audits | Operator analytics L3 CwF (Stage 0C) |
| `memory-bank/analyticsProductContext.md` | **Stale** — all features marked ❌ planned |

---

## 4. Maturity snapshot by system class

| Class | Representative systems | Maturity | Notes |
|-------|------------------------|----------|-------|
| Platform Capability (tenant rollup) | `dashboard-summary`, facade | **L2 partial** | First honest contract post P3 |
| Platform Capability (personal) | `/api/analytics/personal` | **L1** | Controller inline Prisma |
| Operator Analytics | Admin Portal + `adminAnalyticsService` | **L3 CwF** | Certified satellite of Admin Portal |
| Module Domain | HR, Chat, Place, Workforce Comms | **L2–L3** | Correct ownership pattern |
| Product Surface (business) | `/workspace/analytics` | **L0 mock** | Constitutional leak |
| AI Scaffold | `server/src/ai/analytics/*` | **L0 unwired** | Large Prisma surface, no routes |
| Event Pipeline | Domain event subscriber | **L0 placeholder** | Must activate or delete |
| Warehouse / rollups | — | **Not built** | On-demand queries only |

---

## 5. Dashboard Package 3 impact (completed)

| Deliverable | Status |
|-------------|--------|
| `analyticsDashboardSummaryService` | **Shipped** |
| `GET /api/analytics/dashboard-summary` | **Shipped** |
| `dashboardAnalyticsFacade` | **Shipped** |
| `QuickStatsWidget` / `useDashboardStats` refactored | **Shipped** |
| AI quick-stats via capability | **Shipped** |
| Enterprise panels capability-backed | **Partial** — data path exists; UI gated/unwired |
| Analytics warehouse | **Not in scope** |
| Business workspace page | **Not in scope** — still mock |

---

## 6. Discovery findings (top 10)

1. **No true analytics module** — pseudo-module registry entry without manifest, AI context, or built-in registration.
2. **Federated, not unified** — 15+ services compute metrics independently; no shared analytics layer.
3. **First canonical tenant contract exists** — `dashboard-summary` is the reference pattern for cross-module reads.
4. **Operator analytics is mature** — Admin Portal L3 CwF; distinct from tenant capability.
5. **Event pipeline is fiction** — placeholder subscriber on every domain event with no persistence.
6. **AI analytics scaffold is large but dead** — 12+ Prisma models, 4 engines, zero production wiring.
7. **Mock surfaces persist** — business workspace analytics, calendar enterprise panel, personal stats widget.
8. **Orphan components** — `BusinessAnalyticsDashboard`, `ChatAnalytics` have APIs but no UI mount.
9. **Permission model documented but not enforced** — AP1–AP5 not systematically applied across rollup paths.
10. **Memory Bank drift** — `analyticsProductContext.md` claims all features ❌; reality is partial L1–L2 with one L2 contract.

---

**Last updated:** 2026-06-22
