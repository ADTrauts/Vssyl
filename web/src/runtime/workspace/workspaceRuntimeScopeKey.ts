import type { WorkspaceContextType } from '../modules/types';

export interface WorkspaceRuntimeScope {
  activeContextType: WorkspaceContextType;
  activeDashboardId?: string;
  activeBusinessId?: string;
  activeHouseholdId?: string;
}

/** Stable key for detecting tenant/context boundary changes. */
export function buildWorkspaceRuntimeScopeKey(scope: WorkspaceRuntimeScope): string {
  return [
    scope.activeContextType,
    scope.activeDashboardId ?? '',
    scope.activeBusinessId ?? '',
    scope.activeHouseholdId ?? '',
  ].join('|');
}
