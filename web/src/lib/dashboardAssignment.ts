import type { Dashboard } from 'shared/types';
import { isCoreAppModuleId } from 'shared/types';
import { resolveSelectedModuleIds } from './dashboardTabModules';

export interface DashboardAssignmentRef {
  dashboardId: string;
  dashboardName: string;
  isAssigned: boolean;
}

/** Whether a personal dashboard tab includes the application in selectedModuleIds. */
export function dashboardUsesModule(dashboard: Dashboard, moduleId: string): boolean {
  if (isCoreAppModuleId(moduleId)) {
    const scoped = dashboard as Dashboard & { businessId?: string | null };
    return !scoped.businessId;
  }
  const ids = resolveSelectedModuleIds(dashboard);
  return ids.includes(moduleId);
}

export function findPersonalDashboardAssignments(
  dashboards: Dashboard[],
  moduleId: string
): DashboardAssignmentRef[] {
  return dashboards.map((dashboard) => ({
    dashboardId: dashboard.id,
    dashboardName: dashboard.name,
    isAssigned: dashboardUsesModule(dashboard, moduleId),
  }));
}

export function summarizeAssignedDashboardNames(refs: DashboardAssignmentRef[]): string[] {
  return refs.filter((ref) => ref.isAssigned).map((ref) => ref.dashboardName);
}
