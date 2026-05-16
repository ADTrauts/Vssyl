import {
  WIDGET_REGISTRY,
  type WidgetRegistryEntry,
} from '../../../components/dashboard/widgetRegistry';
import { fromLegacyDashboardType, supportsContext } from '../contextMapping';
import { normalizeModuleId } from '../moduleRegistry';
import type { WidgetDefinition, WorkspaceContextType } from '../types';

const DEFAULT_WIDGET_SIZE = { w: 4, h: 3 };
const DEFAULT_ALLOWED_SIZES: WidgetDefinition['allowedSizes'] = ['sm', 'md', 'lg'];

function mapRegistryEntryToWidgetDefinition(entry: WidgetRegistryEntry): WidgetDefinition {
  const supportedContexts: WorkspaceContextType[] = entry.contexts
    ? entry.contexts.map((c) => fromLegacyDashboardType(c))
    : ['personal', 'business', 'household', 'education'];

  return {
    id: entry.id,
    moduleId: normalizeModuleId(entry.moduleId),
    name: entry.name,
    description: entry.description,
    supportedContexts,
    requiredPermissions: entry.alwaysAvailable ? [] : ['view'],
    defaultSize: DEFAULT_WIDGET_SIZE,
    allowedSizes: DEFAULT_ALLOWED_SIZES,
    componentKey: entry.id,
    refreshMode: entry.id === 'activityfeed' ? 'socket' : 'manual',
  };
}

/** All widget contracts derived from the legacy WIDGET_REGISTRY (read-only adapter). */
export function getWidgetDefinitionsFromRegistry(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).map(mapRegistryEntryToWidgetDefinition);
}

export function getWidgetDefinitionById(widgetId: string): WidgetDefinition | undefined {
  const entry = WIDGET_REGISTRY[widgetId];
  if (!entry) return undefined;
  return mapRegistryEntryToWidgetDefinition(entry);
}

export function filterWidgetDefinitions(
  definitions: WidgetDefinition[],
  context: WorkspaceContextType,
  installedModuleIds: string[]
): WidgetDefinition[] {
  const installedSet = new Set(installedModuleIds.map((id) => normalizeModuleId(id)));
  const legacyAlwaysAvailable = new Set(
    Object.values(WIDGET_REGISTRY)
      .filter((e) => e.alwaysAvailable)
      .map((e) => e.id)
  );

  return definitions.filter((widget) => {
    if (!supportsContext(widget.supportedContexts, context)) return false;
    const installed =
      legacyAlwaysAvailable.has(widget.id) ||
      installedSet.has(widget.moduleId) ||
      installedSet.has(widget.id);
    return installed;
  });
}

/** Map contract widget back to legacy picker entry (preserves icon/color for UI). */
export function toLegacyWidgetRegistryEntry(
  widget: WidgetDefinition
): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY[widget.componentKey];
}
