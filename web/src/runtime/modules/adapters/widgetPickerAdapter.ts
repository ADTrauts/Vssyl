import type { WidgetRegistryEntry } from '../../../components/dashboard/widgetRegistry';
import { getAvailableWidgets } from '../../../components/dashboard/widgetRegistry';
import type { LegacyDashboardContext } from '../contextMapping';
import { fromLegacyDashboardType } from '../contextMapping';
import {
  filterWidgetDefinitions,
  getWidgetDefinitionsFromRegistry,
  toLegacyWidgetRegistryEntry,
} from './fromWidgetRegistry';

/**
 * Read-only adapter for WidgetPicker: derives available widgets from module contracts
 * while preserving legacy WIDGET_REGISTRY entries for icons and categories.
 */
export function getWidgetPickerAvailableEntries(
  installedModuleIds: string[],
  dashboardType: LegacyDashboardContext = 'personal'
): WidgetRegistryEntry[] {
  const context = fromLegacyDashboardType(dashboardType);
  const definitions = getWidgetDefinitionsFromRegistry();
  const filtered = filterWidgetDefinitions(definitions, context, installedModuleIds);

  const legacyEntries = filtered
    .map((w) => toLegacyWidgetRegistryEntry(w))
    .filter((e): e is WidgetRegistryEntry => e !== undefined);

  if (legacyEntries.length > 0) {
    return legacyEntries;
  }

  return getAvailableWidgets(installedModuleIds, dashboardType);
}
