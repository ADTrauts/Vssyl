/**
 * Dashboard tab module membership — single source of truth for what belongs on a tab.
 * Sidebar customization only controls presentation (order, folders, collapsed, pins).
 */

import type { Dashboard } from 'shared/types';
import type { LeftSidebarConfig, SidebarFolder } from '../types/sidebar';

/** Platform core apps — always on every personal dashboard tab. */
export const DASHBOARD_TAB_CORE_MODULE_IDS = ['drive', 'chat', 'calendar'] as const;

/** Implicit shell module — always available, never user-selectable. */
export const DASHBOARD_TAB_IMPLICIT_MODULE_ID = 'dashboard' as const;

/**
 * Module set for the original/main personal dashboard tab (matches PERSONAL_LEFT_DEFAULTS).
 * Preserves today's sidebar appearance for existing users.
 */
export const DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS = [
  DASHBOARD_TAB_IMPLICIT_MODULE_ID,
  ...DASHBOARD_TAB_CORE_MODULE_IDS,
  'connections',
  'todo',
] as const;

export interface DashboardTabPreferences {
  selectedModuleIds?: string[];
  sidebarCustomization?: {
    leftSidebar?: Record<string, LeftSidebarConfig>;
  };
}

export interface ResolveSelectedModuleIdsOptions {
  isMainPersonalTab?: boolean;
  widgetTypes?: string[];
}

function uniqueOrdered(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/** Core + implicit dashboard; deduped; dashboard always first when present. */
export function normalizeSelectedModuleIds(moduleIds: string[]): string[] {
  const withoutDashboard = moduleIds.filter(
    (id) => id !== DASHBOARD_TAB_IMPLICIT_MODULE_ID
  );
  const extras = withoutDashboard.filter(
    (id) => !(DASHBOARD_TAB_CORE_MODULE_IDS as readonly string[]).includes(id)
  );
  return uniqueOrdered([
    DASHBOARD_TAB_IMPLICIT_MODULE_ID,
    ...DASHBOARD_TAB_CORE_MODULE_IDS,
    ...extras,
  ]);
}

export function isCoreModuleId(moduleId: string): boolean {
  return (DASHBOARD_TAB_CORE_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isImplicitModuleId(moduleId: string): boolean {
  return moduleId === DASHBOARD_TAB_IMPLICIT_MODULE_ID;
}

export function isLockedTabModuleId(moduleId: string): boolean {
  return isCoreModuleId(moduleId) || isImplicitModuleId(moduleId);
}

/** Modules referenced in a tab's left sidebar config. */
export function extractModuleIdsFromSidebarConfig(
  config: LeftSidebarConfig | null | undefined
): string[] {
  if (!config) return [];
  const ids: string[] = [];
  for (const folder of config.folders) {
    for (const m of folder.modules) {
      ids.push(m.id);
    }
  }
  for (const m of config.looseModules) {
    ids.push(m.id);
  }
  return ids;
}

function readPreferences(dashboard: Dashboard | null | undefined): DashboardTabPreferences {
  if (!dashboard?.preferences || typeof dashboard.preferences !== 'object') {
    return {};
  }
  return dashboard.preferences as DashboardTabPreferences;
}

/**
 * Resolve selected module ids for a dashboard tab.
 * Legacy fallback when preferences.selectedModuleIds is absent.
 */
export function resolveSelectedModuleIds(
  dashboard: Dashboard | null | undefined,
  options: ResolveSelectedModuleIdsOptions = {}
): string[] {
  const prefs = readPreferences(dashboard);
  if (prefs.selectedModuleIds && prefs.selectedModuleIds.length > 0) {
    return normalizeSelectedModuleIds(prefs.selectedModuleIds);
  }

  if (options.isMainPersonalTab) {
    return [...DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS];
  }

  const widgetTypes =
    options.widgetTypes ?? dashboard?.widgets?.map((w) => w.type) ?? [];

  const legacyIds: string[] = [
    DASHBOARD_TAB_IMPLICIT_MODULE_ID,
    ...DASHBOARD_TAB_CORE_MODULE_IDS,
  ];

  if (widgetTypes.length > 0) {
    legacyIds.push(...widgetTypes);
  }

  const tabId = dashboard?.id;
  if (tabId && prefs.sidebarCustomization?.leftSidebar?.[tabId]) {
    legacyIds.push(
      ...extractModuleIdsFromSidebarConfig(prefs.sidebarCustomization.leftSidebar[tabId])
    );
  }

  return normalizeSelectedModuleIds(legacyIds);
}

export interface ModuleWithId {
  id: string;
}

/** Intersection of globally available modules and tab membership. */
export function filterModulesForTab<T extends ModuleWithId>(
  allModules: T[],
  selectedModuleIds: string[]
): T[] {
  const allowed = new Set(selectedModuleIds);
  return allModules.filter((m) => allowed.has(m.id));
}

/**
 * Default left sidebar layout from selected modules only (no global module list).
 * Matches main personal tab structure when ids align with DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS.
 */
export function buildDefaultLeftSidebarFromSelected(
  selectedModuleIds: string[],
  context: 'personal' | 'business' = 'personal'
): LeftSidebarConfig {
  const selected = new Set(normalizeSelectedModuleIds(selectedModuleIds));

  if (context === 'business') {
    const folders = [
      {
        id: 'communication',
        name: 'Communication',
        icon: 'message-square',
        modules: [
          { id: 'chat', order: 0 },
          { id: 'calendar', order: 1 },
        ].filter((m) => selected.has(m.id)),
        collapsed: false,
        order: 0,
      },
    ].filter((f) => f.modules.length > 0);

    const looseModules: Array<{ id: string; order: number }> = [];
    if (selected.has(DASHBOARD_TAB_IMPLICIT_MODULE_ID)) {
      looseModules.push({ id: DASHBOARD_TAB_IMPLICIT_MODULE_ID, order: 0 });
    }
    let order = 1;
    for (const id of Array.from(selected)) {
      if (
        id === DASHBOARD_TAB_IMPLICIT_MODULE_ID ||
        id === 'chat' ||
        id === 'calendar'
      ) {
        continue;
      }
      looseModules.push({ id, order: order++ });
    }

    return { folders, looseModules };
  }

  const coreFolderModules = DASHBOARD_TAB_CORE_MODULE_IDS.map((id, order) => ({
    id,
    order,
  })).filter((m) => selected.has(m.id));

  const folders: SidebarFolder[] =
    coreFolderModules.length > 0
      ? [
          {
            id: 'core-apps',
            name: 'Core Apps',
            icon: 'grid',
            modules: coreFolderModules,
            collapsed: false,
            order: 0,
          },
        ]
      : [];

  const folderModuleIds = new Set<string>(
    folders.flatMap((f) => f.modules.map((m) => m.id))
  );

  const looseModules: Array<{ id: string; order: number }> = [];
  let looseOrder = 0;

  if (selected.has(DASHBOARD_TAB_IMPLICIT_MODULE_ID)) {
    looseModules.push({
      id: DASHBOARD_TAB_IMPLICIT_MODULE_ID,
      order: looseOrder++,
    });
  }

  const isMainShape =
    selected.has('connections') &&
    selected.has('todo') &&
    selected.size >= DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS.length;

  if (isMainShape && selected.has('connections')) {
    folders.push({
      id: 'social',
      name: 'Social',
      icon: 'users',
      modules: [{ id: 'connections', order: 0 }],
      collapsed: false,
      order: 1,
    });
    folderModuleIds.add('connections');
  }

  for (const id of Array.from(selected)) {
    if (folderModuleIds.has(id) || id === DASHBOARD_TAB_IMPLICIT_MODULE_ID) {
      continue;
    }
    looseModules.push({ id, order: looseOrder++ });
  }

  return { folders, looseModules };
}

/** Oldest personal dashboard tab (main tab) by createdAt. */
export function getMainPersonalDashboardId(
  personalDashboards: Array<{ id: string; createdAt: string }>
): string | null {
  if (personalDashboards.length === 0) return null;
  const sorted = [...personalDashboards].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return sorted[0]?.id ?? null;
}

export function getAdditionalSelectableModuleIds(
  selectedModuleIds: string[]
): string[] {
  return normalizeSelectedModuleIds(selectedModuleIds).filter(
    (id) => !isLockedTabModuleId(id)
  );
}
