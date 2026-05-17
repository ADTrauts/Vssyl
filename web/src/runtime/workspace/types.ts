import type { ModuleDefinition, WidgetDefinition, WorkspaceContextType } from '../modules/types';

/** moduleId → granted permission names (e.g. view, write). */
export type PermissionSnapshot = Record<string, string[]>;

export interface WorkspaceRuntimeState {
  userId?: string;
  activeContextType: WorkspaceContextType;
  activeDashboardId?: string;
  activeBusinessId?: string;
  activeHouseholdId?: string;
  activeModuleId?: string;
  activeWidgetIds?: string[];
  availableModules: ModuleDefinition[];
  availableWidgets: WidgetDefinition[];
  permissionsLoading: boolean;
  error: string | null;
  /** Placeholder for future socket subscription keys. */
  realtimeSubscriptions?: string[];
  /** Placeholder for future Socket.IO room membership. */
  activeSocketRooms?: string[];
}

export interface WorkspaceRuntimeActions {
  setActiveModule: (moduleId: string | null) => void;
  getModulesForContext: (context?: WorkspaceContextType) => ModuleDefinition[];
  getWidgetsForContext: (context?: WorkspaceContextType) => WidgetDefinition[];
  canRenderModule: (moduleId: string) => boolean;
  canRenderWidget: (widgetId: string) => boolean;
  /** Join a Socket.IO room tracked by runtime (deduped). */
  subscribeRuntimeRoom: (roomKey: string) => void;
  /** Leave a tracked room and remove from runtime ownership. */
  unsubscribeRuntimeRoom: (roomKey: string) => void;
  /** Leave all tracked rooms (e.g. on context boundary change). */
  clearRuntimeSubscriptions: () => void;
}

export type WorkspaceRuntimeContextValue = WorkspaceRuntimeState & WorkspaceRuntimeActions;

export interface BuildWorkspaceRuntimeInput {
  userId?: string;
  activeContextType: WorkspaceContextType;
  activeDashboardId?: string;
  activeBusinessId?: string;
  activeHouseholdId?: string;
  activeModuleId?: string;
  activeWidgetIds?: string[];
  installedModuleIds?: string[];
  permissionSnapshot?: PermissionSnapshot;
  permissionsLoading?: boolean;
  error?: string | null;
  realtimeSubscriptions?: string[];
  activeSocketRooms?: string[];
}
