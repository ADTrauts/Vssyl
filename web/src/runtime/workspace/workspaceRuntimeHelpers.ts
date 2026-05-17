import { getWidgetDefinitionsFromRegistry, filterWidgetDefinitions } from '../modules/adapters/fromWidgetRegistry';
import { getModulesForContext, normalizeModuleId } from '../modules/moduleRegistry';
import { supportsContext } from '../modules/contextMapping';
import type { ModuleDefinition, WidgetDefinition, WorkspaceContextType } from '../modules/types';
import type {
  BuildWorkspaceRuntimeInput,
  PermissionSnapshot,
  WorkspaceRuntimeState,
} from './types';

function hasRequiredPermissions(
  required: string[],
  moduleId: string,
  snapshot: PermissionSnapshot | undefined
): boolean {
  if (required.length === 0) return true;
  if (!snapshot) return true;
  const granted = snapshot[normalizeModuleId(moduleId)] ?? [];
  return required.every((p) => granted.includes(p));
}

export function deriveAvailableModules(
  context: WorkspaceContextType,
  installedModuleIds: string[] = []
): ModuleDefinition[] {
  return getModulesForContext(context, { installedModuleIds });
}

export function deriveAvailableWidgets(
  context: WorkspaceContextType,
  installedModuleIds: string[] = []
): WidgetDefinition[] {
  const definitions = getWidgetDefinitionsFromRegistry();
  return filterWidgetDefinitions(definitions, context, installedModuleIds);
}

export function filterModulesByPermissionSnapshot(
  modules: ModuleDefinition[],
  snapshot: PermissionSnapshot | undefined
): ModuleDefinition[] {
  if (!snapshot) return modules;
  return modules.filter((mod) =>
    hasRequiredPermissions(mod.requiredPermissions, mod.id, snapshot)
  );
}

export function filterWidgetsByPermissionSnapshot(
  widgets: WidgetDefinition[],
  snapshot: PermissionSnapshot | undefined
): WidgetDefinition[] {
  if (!snapshot) return widgets;
  return widgets.filter((widget) =>
    hasRequiredPermissions(widget.requiredPermissions, widget.moduleId, snapshot)
  );
}

export function canRenderModuleWithPermissions(
  moduleId: string,
  context: WorkspaceContextType,
  snapshot: PermissionSnapshot | undefined,
  installedModuleIds: string[] = []
): boolean {
  const normalized = normalizeModuleId(moduleId);
  const mod = getModulesForContext(context, { installedModuleIds }).find(
    (m) => m.id === normalized
  );
  if (!mod) return false;
  if (mod.status === 'disabled') return false;
  if (!supportsContext(mod.supportedContexts, context)) return false;
  return hasRequiredPermissions(mod.requiredPermissions, mod.id, snapshot);
}

export function canRenderWidgetWithPermissions(
  widgetId: string,
  context: WorkspaceContextType,
  snapshot: PermissionSnapshot | undefined,
  installedModuleIds: string[] = []
): boolean {
  const widgets = deriveAvailableWidgets(context, installedModuleIds);
  const widget = widgets.find((w) => w.id === widgetId);
  if (!widget) return false;
  if (!supportsContext(widget.supportedContexts, context)) return false;
  return hasRequiredPermissions(widget.requiredPermissions, widget.moduleId, snapshot);
}

export function buildWorkspaceRuntimeState(
  input: BuildWorkspaceRuntimeInput
): WorkspaceRuntimeState {
  const installed = input.installedModuleIds ?? [];
  const snapshot = input.permissionSnapshot;
  const rawModules = deriveAvailableModules(input.activeContextType, installed);
  const rawWidgets = deriveAvailableWidgets(input.activeContextType, installed);
  return {
    userId: input.userId,
    activeContextType: input.activeContextType,
    activeDashboardId: input.activeDashboardId,
    activeBusinessId: input.activeBusinessId,
    activeHouseholdId: input.activeHouseholdId,
    activeModuleId: input.activeModuleId,
    activeWidgetIds: input.activeWidgetIds,
    availableModules: filterModulesByPermissionSnapshot(rawModules, snapshot),
    availableWidgets: filterWidgetsByPermissionSnapshot(rawWidgets, snapshot),
    permissionsLoading: input.permissionsLoading ?? false,
    error: input.error ?? null,
    realtimeSubscriptions: input.realtimeSubscriptions,
    activeSocketRooms: input.activeSocketRooms,
  };
}

export function setActiveModuleState(
  state: WorkspaceRuntimeState,
  moduleId: string | null
): WorkspaceRuntimeState {
  return {
    ...state,
    activeModuleId: moduleId ?? undefined,
  };
}
