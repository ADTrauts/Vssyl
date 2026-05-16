'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../../contexts/DashboardContext';
import { fromLegacyDashboardType } from '../modules/contextMapping';
import type { ModuleDefinition, WidgetDefinition, WorkspaceContextType } from '../modules/types';
import type {
  BuildWorkspaceRuntimeInput,
  PermissionSnapshot,
  WorkspaceRuntimeContextValue,
} from './types';
import {
  buildWorkspaceRuntimeState,
  canRenderModuleWithPermissions,
  canRenderWidgetWithPermissions,
  deriveAvailableModules,
  deriveAvailableWidgets,
  setActiveModuleState,
} from './workspaceRuntimeHelpers';

const WorkspaceRuntimeContext = createContext<WorkspaceRuntimeContextValue | undefined>(
  undefined
);

export interface WorkspaceRuntimeProviderProps {
  children: ReactNode;
  /** Override auto-detected context (e.g. business workspace route). */
  contextType?: WorkspaceContextType;
  businessId?: string;
  householdId?: string;
  dashboardId?: string;
  installedModuleIds?: string[];
  permissionSnapshot?: PermissionSnapshot;
  permissionsLoading?: boolean;
  error?: string | null;
  initialModuleId?: string;
  realtimeSubscriptions?: string[];
  activeSocketRooms?: string[];
}

export function WorkspaceRuntimeProvider({
  children,
  contextType: contextTypeOverride,
  businessId,
  householdId,
  dashboardId,
  installedModuleIds = [],
  permissionSnapshot,
  permissionsLoading = false,
  error = null,
  initialModuleId,
  realtimeSubscriptions,
  activeSocketRooms,
}: WorkspaceRuntimeProviderProps) {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType } = useDashboard();

  const detectedContext: WorkspaceContextType = useMemo(() => {
    if (contextTypeOverride) return contextTypeOverride;
    if (businessId) return 'business';
    if (currentDashboard) {
      return fromLegacyDashboardType(getDashboardType(currentDashboard));
    }
    return 'personal';
  }, [contextTypeOverride, businessId, currentDashboard, getDashboardType]);

  const baseInput: BuildWorkspaceRuntimeInput = useMemo(
    () => ({
      userId: session?.user?.id,
      activeContextType: detectedContext,
      activeDashboardId: dashboardId ?? currentDashboard?.id,
      activeBusinessId: businessId,
      activeHouseholdId: householdId,
      activeModuleId: initialModuleId,
      installedModuleIds,
      permissionsLoading,
      error,
      realtimeSubscriptions,
      activeSocketRooms,
    }),
    [
      session?.user?.id,
      detectedContext,
      dashboardId,
      currentDashboard?.id,
      businessId,
      householdId,
      initialModuleId,
      installedModuleIds,
      permissionsLoading,
      error,
      realtimeSubscriptions,
      activeSocketRooms,
    ]
  );

  const [runtimeState, setRuntimeState] = useState(() =>
    buildWorkspaceRuntimeState(baseInput)
  );

  React.useEffect(() => {
    setRuntimeState(buildWorkspaceRuntimeState(baseInput));
  }, [baseInput]);

  const setActiveModule = useCallback((moduleId: string | null) => {
    setRuntimeState((prev) => setActiveModuleState(prev, moduleId));
  }, []);

  const getModulesForContextFn = useCallback(
    (context?: WorkspaceContextType): ModuleDefinition[] => {
      const ctx = context ?? runtimeState.activeContextType;
      return deriveAvailableModules(ctx, installedModuleIds);
    },
    [runtimeState.activeContextType, installedModuleIds]
  );

  const getWidgetsForContextFn = useCallback(
    (context?: WorkspaceContextType): WidgetDefinition[] => {
      const ctx = context ?? runtimeState.activeContextType;
      return deriveAvailableWidgets(ctx, installedModuleIds);
    },
    [runtimeState.activeContextType, installedModuleIds]
  );

  const canRenderModule = useCallback(
    (moduleId: string): boolean =>
      canRenderModuleWithPermissions(
        moduleId,
        runtimeState.activeContextType,
        permissionSnapshot,
        installedModuleIds
      ),
    [runtimeState.activeContextType, permissionSnapshot, installedModuleIds]
  );

  const canRenderWidget = useCallback(
    (widgetId: string): boolean =>
      canRenderWidgetWithPermissions(
        widgetId,
        runtimeState.activeContextType,
        permissionSnapshot,
        installedModuleIds
      ),
    [runtimeState.activeContextType, permissionSnapshot, installedModuleIds]
  );

  const value = useMemo<WorkspaceRuntimeContextValue>(
    () => ({
      ...runtimeState,
      setActiveModule,
      getModulesForContext: getModulesForContextFn,
      getWidgetsForContext: getWidgetsForContextFn,
      canRenderModule,
      canRenderWidget,
    }),
    [
      runtimeState,
      setActiveModule,
      getModulesForContextFn,
      getWidgetsForContextFn,
      canRenderModule,
      canRenderWidget,
    ]
  );

  return (
    <WorkspaceRuntimeContext.Provider value={value}>
      {children}
    </WorkspaceRuntimeContext.Provider>
  );
}

export function useWorkspaceRuntime(): WorkspaceRuntimeContextValue {
  const ctx = useContext(WorkspaceRuntimeContext);
  if (!ctx) {
    throw new Error('useWorkspaceRuntime must be used within WorkspaceRuntimeProvider');
  }
  return ctx;
}

/** Optional hook when provider is not mounted (read-only helpers only). */
export function useWorkspaceRuntimeOptional(): WorkspaceRuntimeContextValue | undefined {
  return useContext(WorkspaceRuntimeContext);
}
