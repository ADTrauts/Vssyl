'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useBusinessConfiguration } from '../../contexts/BusinessConfigurationContext';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { usePositionAwareModulesOptional } from '../../components/PositionAwareModuleProvider';
import { fromLegacyDashboardType } from '../modules/contextMapping';
import { normalizeModuleId } from '../modules/moduleRegistry';
import type { WorkspaceContextType } from '../modules/types';
import { WorkspaceRuntimeProvider } from './WorkspaceRuntimeContext';
import {
  buildPermissionSnapshotFromModulePermissions,
  buildPermissionSnapshotFromModules,
  buildPersonalPermissionSnapshot,
  type ModulePermissionSource,
} from './permissionSnapshotBridge';
import type { PermissionSnapshot } from './types';
import { PERSONAL_DEFAULT_MODULE_PERMISSIONS } from '../../lib/personalDashboardContracts';

const PERSONAL_DEFAULT_MODULES: ModulePermissionSource[] = PERSONAL_DEFAULT_MODULE_PERMISSIONS.map(
  (entry) => ({
    id: entry.id,
    permissions: [...entry.permissions],
  })
);

export interface WorkspaceRuntimeScopeBridgeProps {
  children: React.ReactNode;
  contextType?: WorkspaceContextType;
  businessId?: string;
  householdId?: string;
  dashboardId?: string;
  initialModuleId?: string;
}

function resolveHouseholdId(
  dashboard: ReturnType<typeof useDashboard>['currentDashboard']
): string | undefined {
  if (!dashboard || !('household' in dashboard)) return undefined;
  const household = (dashboard as { household?: { id: string } }).household;
  return household?.id;
}

function resolveBusinessIdFromDashboard(
  dashboard: ReturnType<typeof useDashboard>['currentDashboard']
): string | undefined {
  if (!dashboard || !('business' in dashboard)) return undefined;
  const business = (dashboard as { business?: { id: string } }).business;
  return business?.id;
}

export function WorkspaceRuntimeScopeBridge({
  children,
  contextType: contextTypeOverride,
  businessId: businessIdProp,
  householdId: householdIdProp,
  dashboardId: dashboardIdProp,
  initialModuleId,
}: WorkspaceRuntimeScopeBridgeProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType, loading: dashboardLoading } = useDashboard();
  const {
    configuration,
    loading: businessLoading,
    error: businessError,
    getEnabledModules,
    getModulesForUser,
  } = useBusinessConfiguration();
  const { currentBusinessId, isWorkAuthenticated } = useWorkAuth();
  const positionAware = usePositionAwareModulesOptional();

  const activeDashboardId = dashboardIdProp ?? currentDashboard?.id;
  const activeHouseholdId = householdIdProp ?? resolveHouseholdId(currentDashboard);

  const routeBusinessId = useMemo(() => {
    const match = pathname?.match(/^\/business\/([^/]+)/);
    return match?.[1];
  }, [pathname]);

  const activeBusinessId =
    businessIdProp ??
    routeBusinessId ??
    currentBusinessId ??
    resolveBusinessIdFromDashboard(currentDashboard);

  const activeContextType: WorkspaceContextType = useMemo(() => {
    if (contextTypeOverride) return contextTypeOverride;
    if (activeBusinessId && (pathname?.includes('/business/') || isWorkAuthenticated)) {
      return 'business';
    }
    if (currentDashboard) {
      return fromLegacyDashboardType(getDashboardType(currentDashboard));
    }
    return 'personal';
  }, [
    contextTypeOverride,
    activeBusinessId,
    pathname,
    isWorkAuthenticated,
    currentDashboard,
    getDashboardType,
  ]);

  const { installedModuleIds, permissionSnapshot } = useMemo((): {
    installedModuleIds: string[];
    permissionSnapshot: PermissionSnapshot;
  } => {
    const userId = session?.user?.id;

    if (activeContextType === 'business' && configuration) {
      const businessModules = userId ? getModulesForUser(userId) : getEnabledModules();
      const ids = businessModules.map((m) => normalizeModuleId(m.id));
      const snapshot = buildPermissionSnapshotFromModulePermissions(
        configuration.modulePermissions,
        ids
      );
      for (const mod of businessModules) {
        const id = normalizeModuleId(mod.id);
        const modulePerms = mod.permissions?.length ? mod.permissions : ['view'];
        const merged = new Set([...(snapshot[id] ?? []), ...modulePerms]);
        snapshot[id] = Array.from(merged);
      }
      return { installedModuleIds: ids, permissionSnapshot: snapshot };
    }

    if (positionAware) {
      const modules = positionAware.getFilteredModules();
      const ids = modules.map((m) => normalizeModuleId(m.id));
      return {
        installedModuleIds: ids,
        permissionSnapshot: buildPersonalPermissionSnapshot(
          modules.map((m) => ({ id: m.id, permissions: m.permissions ?? ['view'] }))
        ),
      };
    }

    return {
      installedModuleIds: PERSONAL_DEFAULT_MODULES.map((m) => normalizeModuleId(m.id)),
      permissionSnapshot: buildPermissionSnapshotFromModules(PERSONAL_DEFAULT_MODULES),
    };
  }, [
    activeContextType,
    configuration,
    session?.user?.id,
    getModulesForUser,
    getEnabledModules,
    positionAware,
  ]);

  const permissionsLoading = businessLoading || dashboardLoading;

  return (
    <WorkspaceRuntimeProvider
      contextType={activeContextType}
      businessId={activeBusinessId}
      householdId={activeHouseholdId}
      dashboardId={activeDashboardId}
      installedModuleIds={installedModuleIds}
      permissionSnapshot={permissionSnapshot}
      permissionsLoading={permissionsLoading}
      error={businessError}
      initialModuleId={initialModuleId}
      realtimeSubscriptions={[]}
      activeSocketRooms={[]}
    >
      {children}
    </WorkspaceRuntimeProvider>
  );
}
