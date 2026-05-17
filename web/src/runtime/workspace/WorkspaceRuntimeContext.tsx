'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { getRealtimeSocket } from '@/lib/realtimeClient';
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
import { buildWorkspaceRuntimeScopeKey } from './workspaceRuntimeScopeKey';
import {
  emitJoinRuntimeRoom,
  emitLeaveRuntimeRoom,
  leaveAllRuntimeRooms,
  logRuntimeRealtimeDebug,
} from './runtimeRealtime';
import { WorkspaceRealtimeLifecycle } from './WorkspaceRealtimeLifecycle';

const EMPTY_REALTIME: string[] = [];

const WorkspaceRuntimeContext = createContext<WorkspaceRuntimeContextValue | undefined>(
  undefined
);

export interface WorkspaceRuntimeProviderProps {
  children: ReactNode;
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

  const scopeKey = useMemo(
    () =>
      buildWorkspaceRuntimeScopeKey({
        activeContextType: detectedContext,
        activeDashboardId: dashboardId ?? currentDashboard?.id,
        activeBusinessId: businessId,
        activeHouseholdId: householdId,
      }),
    [detectedContext, dashboardId, currentDashboard?.id, businessId, householdId]
  );

  const prevScopeKeyRef = useRef(scopeKey);
  const activeRoomsRef = useRef<string[]>([]);

  const baseInput: BuildWorkspaceRuntimeInput = useMemo(
    () => ({
      userId: session?.user?.id,
      activeContextType: detectedContext,
      activeDashboardId: dashboardId ?? currentDashboard?.id,
      activeBusinessId: businessId,
      activeHouseholdId: householdId,
      activeModuleId: initialModuleId,
      installedModuleIds,
      permissionSnapshot,
      permissionsLoading,
      error,
      realtimeSubscriptions: realtimeSubscriptions ?? EMPTY_REALTIME,
      activeSocketRooms: activeSocketRooms ?? EMPTY_REALTIME,
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
      permissionSnapshot,
      permissionsLoading,
      error,
      realtimeSubscriptions,
      activeSocketRooms,
    ]
  );

  const [runtimeState, setRuntimeState] = useState(() =>
    buildWorkspaceRuntimeState(baseInput)
  );

  const clearRuntimeSubscriptions = useCallback(() => {
    const rooms = [...activeRoomsRef.current];
    leaveAllRuntimeRooms(getRealtimeSocket(), rooms);
    activeRoomsRef.current = [];
    setRuntimeState((prev) => ({
      ...prev,
      realtimeSubscriptions: EMPTY_REALTIME,
      activeSocketRooms: EMPTY_REALTIME,
    }));
    logRuntimeRealtimeDebug('clear_runtime_subscriptions', {
      roomsCleared: rooms.length,
    });
  }, []);

  const subscribeRuntimeRoom = useCallback((roomKey: string) => {
    if (!roomKey) return;
    if (activeRoomsRef.current.includes(roomKey)) {
      return;
    }
    const socket = getRealtimeSocket();
    if (socket) {
      emitJoinRuntimeRoom(socket, roomKey);
    }
    activeRoomsRef.current = [...activeRoomsRef.current, roomKey];
    setRuntimeState((prev) => ({
      ...prev,
      realtimeSubscriptions: [...(prev.realtimeSubscriptions ?? []), roomKey],
      activeSocketRooms: [...activeRoomsRef.current],
    }));
    logRuntimeRealtimeDebug('subscribe_runtime_room', {
      roomKey,
      totalRooms: activeRoomsRef.current.length,
    });
  }, []);

  const unsubscribeRuntimeRoom = useCallback((roomKey: string) => {
    if (!roomKey || !activeRoomsRef.current.includes(roomKey)) {
      return;
    }
    const socket = getRealtimeSocket();
    if (socket) {
      emitLeaveRuntimeRoom(socket, roomKey);
    }
    activeRoomsRef.current = activeRoomsRef.current.filter((k) => k !== roomKey);
    setRuntimeState((prev) => ({
      ...prev,
      realtimeSubscriptions: (prev.realtimeSubscriptions ?? []).filter((k) => k !== roomKey),
      activeSocketRooms: [...activeRoomsRef.current],
    }));
    logRuntimeRealtimeDebug('unsubscribe_runtime_room', {
      roomKey,
      totalRooms: activeRoomsRef.current.length,
    });
  }, []);

  React.useEffect(() => {
    const scopeChanged = prevScopeKeyRef.current !== scopeKey;
    prevScopeKeyRef.current = scopeKey;

    if (scopeChanged) {
      clearRuntimeSubscriptions();
    }

    setRuntimeState((prev) => {
      if (!scopeChanged) {
        return buildWorkspaceRuntimeState({
          ...baseInput,
          activeModuleId: prev.activeModuleId,
          realtimeSubscriptions: prev.realtimeSubscriptions ?? EMPTY_REALTIME,
          activeSocketRooms: prev.activeSocketRooms ?? EMPTY_REALTIME,
        });
      }
      return buildWorkspaceRuntimeState({
        ...baseInput,
        activeModuleId: undefined,
        realtimeSubscriptions: EMPTY_REALTIME,
        activeSocketRooms: EMPTY_REALTIME,
      });
    });
  }, [baseInput, scopeKey, clearRuntimeSubscriptions]);

  const setActiveModule = useCallback((moduleId: string | null) => {
    setRuntimeState((prev) => setActiveModuleState(prev, moduleId));
  }, []);

  const getModulesForContextFn = useCallback(
    (context?: WorkspaceContextType): ModuleDefinition[] => {
      const ctx = context ?? runtimeState.activeContextType;
      if (ctx === runtimeState.activeContextType) {
        return runtimeState.availableModules;
      }
      const raw = deriveAvailableModules(ctx, installedModuleIds);
      if (!permissionSnapshot) return raw;
      return raw.filter((mod) =>
        canRenderModuleWithPermissions(mod.id, ctx, permissionSnapshot, installedModuleIds)
      );
    },
    [
      runtimeState.activeContextType,
      runtimeState.availableModules,
      installedModuleIds,
      permissionSnapshot,
    ]
  );

  const getWidgetsForContextFn = useCallback(
    (context?: WorkspaceContextType): WidgetDefinition[] => {
      const ctx = context ?? runtimeState.activeContextType;
      if (ctx === runtimeState.activeContextType) {
        return runtimeState.availableWidgets;
      }
      const raw = deriveAvailableWidgets(ctx, installedModuleIds);
      if (!permissionSnapshot) return raw;
      return raw.filter((widget) =>
        canRenderWidgetWithPermissions(widget.id, ctx, permissionSnapshot, installedModuleIds)
      );
    },
    [
      runtimeState.activeContextType,
      runtimeState.availableWidgets,
      installedModuleIds,
      permissionSnapshot,
    ]
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
      subscribeRuntimeRoom,
      unsubscribeRuntimeRoom,
      clearRuntimeSubscriptions,
    }),
    [
      runtimeState,
      setActiveModule,
      getModulesForContextFn,
      getWidgetsForContextFn,
      canRenderModule,
      canRenderWidget,
      subscribeRuntimeRoom,
      unsubscribeRuntimeRoom,
      clearRuntimeSubscriptions,
    ]
  );

  return (
    <WorkspaceRuntimeContext.Provider value={value}>
      <WorkspaceRealtimeLifecycle />
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

export function useWorkspaceRuntimeOptional(): WorkspaceRuntimeContextValue | undefined {
  return useContext(WorkspaceRuntimeContext);
}
