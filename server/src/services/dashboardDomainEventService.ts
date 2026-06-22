import {
  emitDashboardTabCreatedEvent,
  emitDashboardTabDeletedEvent,
  emitDashboardWidgetAddedEvent,
  emitDashboardWidgetRemovedEvent,
} from '../events/domainEventEmitters';

export type DashboardContextType = 'personal' | 'business' | 'household' | 'institution';

export function resolveDashboardContextType(dashboard: {
  businessId?: string | null;
  householdId?: string | null;
  institutionId?: string | null;
}): DashboardContextType {
  if (dashboard.businessId) return 'business';
  if (dashboard.householdId) return 'household';
  if (dashboard.institutionId) return 'institution';
  return 'personal';
}

export function recordDashboardTabCreatedDomainEvent(params: {
  actorUserId: string;
  dashboard: {
    id: string;
    name: string;
    businessId?: string | null;
    householdId?: string | null;
    institutionId?: string | null;
  };
}): void {
  emitDashboardTabCreatedEvent({
    actorUserId: params.actorUserId,
    dashboardId: params.dashboard.id,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    contextType: resolveDashboardContextType(params.dashboard),
    name: params.dashboard.name,
  });
}

export function recordDashboardTabDeletedDomainEvent(params: {
  actorUserId: string;
  dashboard: {
    id: string;
    businessId?: string | null;
    householdId?: string | null;
  };
  hardDelete?: boolean;
  fileAction?: string;
}): void {
  emitDashboardTabDeletedEvent({
    actorUserId: params.actorUserId,
    dashboardId: params.dashboard.id,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    hardDelete: params.hardDelete,
    fileAction: params.fileAction,
  });
}

export function recordDashboardWidgetAddedDomainEvent(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: {
    businessId?: string | null;
    householdId?: string | null;
  };
}): void {
  emitDashboardWidgetAddedEvent({
    actorUserId: params.actorUserId,
    widgetId: params.widget.id,
    dashboardId: params.widget.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    widgetType: params.widget.type,
  });
}

export function recordDashboardWidgetRemovedDomainEvent(params: {
  actorUserId: string;
  widget: { id: string; type: string; dashboardId: string };
  dashboard: {
    businessId?: string | null;
    householdId?: string | null;
  };
}): void {
  emitDashboardWidgetRemovedEvent({
    actorUserId: params.actorUserId,
    widgetId: params.widget.id,
    dashboardId: params.widget.dashboardId,
    businessId: params.dashboard.businessId,
    householdId: params.dashboard.householdId,
    widgetType: params.widget.type,
  });
}
