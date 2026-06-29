import type {
  ApplicationLifecycleCapabilities,
  ApplicationLifecycleMetadata,
  ModuleInstallScope,
  ModuleScopeClassification,
} from 'shared/types';
import {
  defaultLifecycleCapabilities,
  isCoreAppModuleId,
  isInstallableApp,
  isPlatformModuleId,
  isVisibleInModuleManager,
} from 'shared/types';
import type { Module, ModuleManifest } from '../api/modules';

export interface ModuleLifecycleInput {
  id: string;
  version?: string;
  manifest?: ModuleManifest;
  configured?: { enabled?: boolean; settings?: Record<string, unknown> };
  status?: 'installed' | 'available' | 'pending';
  isBuiltIn?: boolean;
  moduleScope?: ModuleScopeClassification | null;
  lifecycle?: ApplicationLifecycleMetadata;
}

export function manifestHasSettings(manifest?: ModuleManifest): boolean {
  if (!manifest?.settings) return false;
  return Object.keys(manifest.settings).length > 0;
}

export function moduleSupportsConfiguration(module: ModuleLifecycleInput): boolean {
  if (module.lifecycle?.supportsConfiguration != null) {
    return module.lifecycle.supportsConfiguration;
  }
  return manifestHasSettings(module.manifest);
}

export function moduleSupportsDashboardAssignment(module: ModuleLifecycleInput): boolean {
  if (module.lifecycle?.supportsDashboardAssignment != null) {
    return module.lifecycle.supportsDashboardAssignment;
  }
  if (isPlatformModuleId(module.id)) return false;
  return module.status === 'installed' || module.configured?.enabled !== false;
}

export function resolveApplicationLifecycleMetadata(
  module: ModuleLifecycleInput
): ApplicationLifecycleMetadata {
  const installedVersion = module.lifecycle?.installedVersion ?? module.version;
  const latestVersion = module.lifecycle?.latestVersion ?? module.version;
  const hasUpdate =
    module.lifecycle?.hasUpdate ??
    Boolean(
      installedVersion &&
        latestVersion &&
        installedVersion !== latestVersion &&
        module.status === 'installed'
    );

  return {
    installedVersion,
    latestVersion,
    hasUpdate,
    isEnabled: module.lifecycle?.isEnabled ?? module.configured?.enabled !== false,
    supportsConfiguration: moduleSupportsConfiguration(module),
    supportsDashboardAssignment: moduleSupportsDashboardAssignment(module),
  };
}

export function resolveApplicationLifecycleCapabilities(
  module: ModuleLifecycleInput,
  scope: ModuleInstallScope
): ApplicationLifecycleCapabilities {
  const metadata = resolveApplicationLifecycleMetadata(module);
  const base = defaultLifecycleCapabilities({
    scope,
    isCoreApp: isCoreAppModuleId(module.id),
    isPlatform: isPlatformModuleId(module.id),
    isInstalled: module.status === 'installed' || module.configured?.enabled !== false,
  });

  return {
    ...base,
    canConfigure: base.canConfigure && metadata.supportsConfiguration === true,
    canAssignToDashboard:
      base.canAssignToDashboard && metadata.supportsDashboardAssignment === true,
    canUninstall: base.canUninstall && !module.isBuiltIn,
  };
}

/** Dashboard picker: installed, enabled, assignable apps only — never marketplace catalog. */
export function filterModulesForDashboardPicker(
  modules: ModuleLifecycleInput[],
  browseScope: ModuleInstallScope
): ModuleLifecycleInput[] {
  return modules.filter((module) => {
    const moduleScope = module.moduleScope ?? null;
    if (!isVisibleInModuleManager(module.id, moduleScope, browseScope)) return false;
    if (isPlatformModuleId(module.id)) return false;
    if (module.configured?.enabled === false) return false;
    if (isCoreAppModuleId(module.id)) return true;
    return (
      module.status === 'installed' &&
      isInstallableApp(module.id, moduleScope, browseScope)
    );
  });
}

/** Additional (non-core) modules eligible for tab membership selection. */
export function filterAssignableModulesForTabPicker(
  modules: ModuleLifecycleInput[],
  browseScope: ModuleInstallScope
): ModuleLifecycleInput[] {
  return filterModulesForDashboardPicker(modules, browseScope).filter(
    (module) => !isCoreAppModuleId(module.id)
  );
}
