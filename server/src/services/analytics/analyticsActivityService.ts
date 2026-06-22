import { emitModuleActivityEvent } from '../moduleActivityService';

export async function recordAnalyticsPersonalView(params: {
  actorUserId: string;
  timeRange: string;
  dashboardId?: string;
  businessId?: string | null;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'analytics',
    action: 'analytics.personal.view',
    targetType: 'analytics',
    targetId: params.actorUserId,
    dashboardId: params.dashboardId,
    businessId: params.businessId ?? undefined,
    visibilityScope: 'personal',
    metadata: {
      timeRange: params.timeRange,
    },
  });
}

export async function recordAnalyticsModuleView(params: {
  actorUserId: string;
  moduleId: string;
  timeRange: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'analytics',
    action: 'analytics.module.view',
    targetType: 'module',
    targetId: params.moduleId,
    visibilityScope: 'personal',
    metadata: {
      moduleId: params.moduleId,
      timeRange: params.timeRange,
    },
  });
}

export async function recordAnalyticsDashboardSummaryView(params: {
  actorUserId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  degraded: boolean;
}): Promise<void> {
  const visibilityScope = params.businessId
    ? 'business'
    : params.householdId
      ? 'household'
      : 'personal';

  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'analytics',
    action: 'analytics.dashboard_summary.view',
    targetType: 'dashboard',
    targetId: params.dashboardId,
    dashboardId: params.dashboardId,
    businessId: params.businessId ?? undefined,
    householdId: params.householdId ?? undefined,
    visibilityScope,
    metadata: {
      degraded: params.degraded,
    },
  });
}

export async function recordAnalyticsExport(params: {
  actorUserId: string;
  format: string;
  timeRange: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'analytics',
    action: 'analytics.export',
    targetType: 'analytics',
    targetId: params.actorUserId,
    visibilityScope: 'personal',
    metadata: {
      format: params.format,
      timeRange: params.timeRange,
    },
  });
}
