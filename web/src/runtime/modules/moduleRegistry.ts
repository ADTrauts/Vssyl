import { CORE_MODULE_BY_ID, CORE_MODULE_DEFINITIONS } from './coreModuleRegistry';
import { supportsContext } from './contextMapping';
import type { ModuleDefinition, WorkspaceContextType } from './types';

export function normalizeModuleId(rawId: string): string {
  const id = rawId.toLowerCase().trim();
  if (
    id === 'hr' ||
    id.startsWith('hr-') ||
    id.startsWith('hr_') ||
    (id.includes('hr') && id.includes('manage'))
  ) {
    return 'hr';
  }
  if (
    id === 'scheduling' ||
    id.startsWith('scheduling') ||
    id.includes('schedule') ||
    id.includes('schedule-builder')
  ) {
    return 'scheduling';
  }
  if (
    id === 'workforce_comms' ||
    id === 'workforce-comms' ||
    id.startsWith('workforce_comms') ||
    id.startsWith('workforce-comms')
  ) {
    return 'workforce_comms';
  }
  if (id === 'calendar' || id.startsWith('cal')) return 'calendar';
  if (id === 'drive' || id.includes('drive')) return 'drive';
  if (id === 'chat' || id.includes('chat')) return 'chat';
  if (id === 'members' || id === 'connections' || id.includes('member')) return 'members';
  if (id === 'admin') return 'admin';
  if (id === 'analytics') return 'analytics';
  if (id === 'activityfeed' || id === 'activity-feed') return 'activityfeed';
  if (id === 'quickstats' || id === 'quick-stats') return 'quickstats';
  if (id === 'quicknotes' || id === 'quick-notes') return 'quicknotes';
  if (id === 'notes') return 'notebook';
  return id;
}

export function getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
  return CORE_MODULE_BY_ID[normalizeModuleId(moduleId)];
}

export function getAllModuleDefinitions(): ModuleDefinition[] {
  return [...CORE_MODULE_DEFINITIONS];
}

export function getModulesForContext(
  context: WorkspaceContextType,
  options?: {
    includeDisabled?: boolean;
    installedModuleIds?: string[];
  }
): ModuleDefinition[] {
  const installedSet = options?.installedModuleIds
    ? new Set(options.installedModuleIds.map((id) => normalizeModuleId(id)))
    : null;

  return CORE_MODULE_DEFINITIONS.filter((module) => {
    if (!supportsContext(module.supportedContexts, context)) return false;
    if (module.status === 'disabled' && !options?.includeDisabled) return false;
    if (installedSet && module.isCore !== true && !installedSet.has(module.id)) {
      return false;
    }
    return true;
  });
}

export function getModuleDisplayName(moduleId: string): string {
  const def = getModuleDefinition(moduleId);
  if (def?.name) return def.name;
  const normalized = normalizeModuleId(moduleId);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getUnknownModuleFallback(moduleId: string): Pick<ModuleDefinition, 'id' | 'name'> {
  const normalized = normalizeModuleId(moduleId);
  return {
    id: normalized,
    name: getModuleDisplayName(normalized),
  };
}
