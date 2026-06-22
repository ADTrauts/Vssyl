# Dashboard Module — Analytics Contract Report

**Program:** Dashboard Module Wave 3 — Package 3  
**Date:** 2026-06-21

---

## 1. Endpoint

```
GET /api/analytics/dashboard-summary?dashboardId={uuid}
```

| Property | Value |
|----------|-------|
| Auth | JWT (`authenticateJWT` on `/api/analytics`) |
| Authorization | `DASHBOARD_READ` via `evaluateDashboardPolicyDual` |
| Owner | **Analytics Capability** |
| Implementation | `analyticsDashboardSummaryService.ts` |

---

## 2. Response shape

```typescript
{
  success: true,
  data: {
    dashboardId: string;
    businessId: string | null;
    asOf: string;
    degraded: boolean;
    degradedReasons: string[];
    summary: {
      unreadMessages: number | null;
      pendingTasks: number | null;
      upcomingEvents: number | null;
      storageUsedPercent: number | null;
      unreadNotifications: number | null;
    };
    sources: {
      chat: 'ok' | 'degraded' | 'unavailable';
      todo: 'ok' | 'degraded' | 'unavailable';
      calendar: 'ok' | 'degraded' | 'unavailable';
      drive: 'ok' | 'degraded' | 'unavailable';
      notifications: 'ok' | 'degraded' | 'unavailable';
    };
    enterprise: EnterpriseAnalyticsProjection | null;
  },
  metadata: {
    provider: 'analytics',
    endpoint: 'dashboard-summary',
    degraded: boolean,
    asOf: string
  }
}
```

Types: `shared/src/types/analyticsDashboardSummary.ts`

---

## 3. Rollup sources

| Metric | Source module/service |
|--------|----------------------|
| `unreadMessages` | Chat — dashboard-scoped conversations + read receipts |
| `pendingTasks` | Todo — `Task` count `TODO` / `IN_PROGRESS` |
| `upcomingEvents` | Calendar — `listEventsInRange` (today) |
| `storageUsedPercent` | Drive — `aggregateAccessibleDriveStorageForAIContext` vs 10GB cap |
| `unreadNotifications` | Notifications — `NotificationService.getUnreadCount` |
| `enterprise.*` | Business — `getBusinessAnalytics` when dashboard has `businessId` |

---

## 4. AI quick-stats (A-02)

| Property | Value |
|----------|-------|
| Route | `GET /api/dashboard/ai/context/quick-stats` (Dashboard module surface) |
| Data | `getDashboardAnalyticsSummaryForAI` → same rollups |
| Metadata | `provider: 'analytics'`, `degraded`, `asOf` — **no stub flag** |

---

## 5. Error responses

| Code | Condition |
|------|-----------|
| 400 | Missing `dashboardId` |
| 401 | Unauthenticated |
| 403 | Policy denied |
| 404 | Dashboard not found for user |
| 500 | Unexpected server error |

---

## 6. Consumers

| Consumer | Integration |
|----------|-------------|
| `dashboardAnalyticsFacade` | Browser via Next.js `/api` proxy |
| `web/src/api/analytics.ts` | `authenticatedApiCall` wrapper |
| A-02 AI provider | Server-side service delegate |

---

## 7. Future Analytics Capability work (out of P3)

- Dedicated `analyticsService` layer (thin controller today)
- Domain event-driven cache invalidation
- Business workspace `/workspace/analytics` page
- PE action `ANALYTICS_READ` distinct from dashboard read

---

**Last updated:** 2026-06-21
