import { emitModuleActivityEvent } from './moduleActivityService';

export interface DashboardActivityContext {
  id: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  institutionId?: string | null;
}

function resolveVisibilityScope(ctx: DashboardActivityContext): 'personal' | 'business' | 'household' {
  if (ctx.businessId) return 'business';
  if (ctx.householdId) return 'household';
  return 'personal';
}

function contextFromDashboard(dashboard: {
  id: string;
  businessId?: string | null;
  householdId?: string | null;
  institutionId?: string | null;
}): DashboardActivityContext {
  return {
    id: dashboard.id,
    dashboardId: dashboard.id,
    businessId: dashboard.businessId,
    householdId: dashboard.householdId,
    institutionId: dashboard.institutionId,
  };
}

export async function recordDashboardCreated(params: {
  actorUserId: string;
  dashboard: {
    id: string;
    name: string;
    businessId?: string | null;
    householdId?: string | null;
    institutionId?: string | null;
  };
  contextType?: 'personal' | 'business' | 'household' | 'institution';
}): Promise<void> {
  const ctx = contextFromDashboard(params.dashboard);
  const contextType =
    params.contextType ??
    (params.dashboard.businessId
      ? 'business'
      : params.dashboard.householdId
        ? 'household'
        : params.dashboard.institutionId
          ? 'institution'
          : 'personal');

  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'dashboard.create',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: ctx.dashboardId,
    businessId: ctx.businessId,
    householdId: ctx.householdId,
    visibilityScope: resolveVisibilityScope(ctx),
    metadata: {
      name: params.dashboard.name,
      contextType,
      businessId: ctx.businessId ?? undefined,
      householdId: ctx.householdId ?? undefined,
      institutionId: ctx.institutionId ?? undefined,
    },
  });
}

export async function recordDashboardUpdated(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
  changedFields: string[];
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'dashboard.update',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: { changedFields: params.changedFields },
  });
}

export async function recordDashboardDeleted(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
  hardDelete?: boolean;
  fileAction?: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'dashboard.delete',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: {
      hardDelete: params.hardDelete ?? false,
      fileAction: params.fileAction,
    },
  });
}

export async function recordDashboardTrashed(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
  trashedAt: Date;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'dashboard.trash',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: { trashedAt: params.trashedAt.toISOString() },
  });
}

export async function recordDashboardRestored(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'dashboard.restore',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
  });
}

export async function recordWidgetAdded(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: DashboardActivityContext;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'widget.add',
    targetType: 'widget',
    targetId: params.widget.id,
    parentType: 'dashboard',
    parentId: params.dashboard.dashboardId,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: { widgetType: params.widget.type, dashboardId: params.widget.dashboardId },
  });
}

export async function recordWidgetUpdated(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: DashboardActivityContext;
  configKeys?: string[];
  positionChanged?: boolean;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'widget.update',
    targetType: 'widget',
    targetId: params.widget.id,
    parentType: 'dashboard',
    parentId: params.dashboard.dashboardId,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: {
      widgetType: params.widget.type,
      dashboardId: params.widget.dashboardId,
      configKeys: params.configKeys,
      positionChanged: params.positionChanged,
    },
  });
}

export async function recordWidgetRemoved(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: DashboardActivityContext;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'widget.remove',
    targetType: 'widget',
    targetId: params.widget.id,
    parentType: 'dashboard',
    parentId: params.dashboard.dashboardId,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: { widgetType: params.widget.type, dashboardId: params.widget.dashboardId },
  });
}

export async function recordWidgetLayoutBatchUpdate(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
  widgetCount: number;
  positionCount: number;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'widget.layout.batch_update',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: {
      widgetCount: params.widgetCount,
      positionCount: params.positionCount,
    },
  });
}

export async function recordSidebarCustomized(params: {
  actorUserId: string;
  dashboard: DashboardActivityContext & { id: string };
  scope: 'tab' | 'sidebar' | 'global' | 'save';
  leftChanged?: boolean;
  rightChanged?: boolean;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'dashboard',
    action: 'sidebar.customize',
    targetType: 'dashboard',
    targetId: params.dashboard.id,
    dashboardId: params.dashboard.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    visibilityScope: resolveVisibilityScope(params.dashboard),
    metadata: {
      scope: params.scope,
      leftChanged: params.leftChanged,
      rightChanged: params.rightChanged,
    },
  });
}

export { contextFromDashboard };
