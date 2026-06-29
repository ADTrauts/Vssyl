import type { ModuleInstallScope, ModuleScopeClassification } from './module-scope';

/**
 * Canonical Vssyl module product layers (Module Manager + Marketplace).
 *
 * | Module            | Platform | Core App | Installable | Business only |
 * |-------------------|----------|----------|-------------|---------------|
 * | dashboard         | yes      | no       | no          | no            |
 * | vlink             | yes      | no       | no          | no            |
 * | place             | yes      | no       | no          | no            |
 * | drive             | no       | yes      | no          | no            |
 * | chat              | no       | yes      | no          | no            |
 * | calendar          | no       | yes      | no          | no            |
 * | todo              | no       | no       | yes         | no            |
 * | notes             | no       | no       | yes         | no            |
 * | notebook          | no       | no       | yes         | no            |
 * | hr                | no       | no       | yes         | yes           |
 * | scheduling        | no       | no       | yes         | yes           |
 * | workforce_comms   | no       | no       | yes         | yes           |
 */

/** Layer 1 — platform capabilities (never install/manage). */
export const PLATFORM_MODULE_IDS = ['dashboard', 'vlink', 'place'] as const;

/** Layer 2 — always-included core applications. */
export const CORE_APP_MODULE_IDS = ['drive', 'chat', 'calendar'] as const;

/** Layer 3 — business-workspace installable apps (personal scope excludes these). */
export const BUSINESS_ONLY_INSTALLABLE_MODULE_IDS = [
  'hr',
  'scheduling',
  'workforce_comms',
] as const;

export type PlatformModuleId = (typeof PLATFORM_MODULE_IDS)[number];
export type CoreAppModuleId = (typeof CORE_APP_MODULE_IDS)[number];

export function isPlatformModuleId(moduleId: string): boolean {
  return (PLATFORM_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isCoreAppModuleId(moduleId: string): boolean {
  return (CORE_APP_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isBusinessOnlyInstallableModuleId(moduleId: string): boolean {
  return (BUSINESS_ONLY_INSTALLABLE_MODULE_IDS as readonly string[]).includes(moduleId);
}

function scopeSupportsBrowse(
  moduleScope: ModuleScopeClassification | null,
  browseScope: ModuleInstallScope
): boolean {
  if (!moduleScope || moduleScope === 'internal') return false;
  if (moduleScope === 'both') return true;
  return moduleScope === browseScope;
}

/** Layer 1 hidden; core + installable apps matching browse scope. */
export function isVisibleInModuleManager(
  moduleId: string,
  moduleScope: ModuleScopeClassification | null,
  browseScope: ModuleInstallScope
): boolean {
  if (isPlatformModuleId(moduleId)) return false;
  if (moduleScope === 'internal') return false;
  if (isCoreAppModuleId(moduleId)) return true;
  if (browseScope === 'personal' && isBusinessOnlyInstallableModuleId(moduleId)) {
    return false;
  }
  return scopeSupportsBrowse(moduleScope, browseScope);
}

/** Marketplace excludes platform + core apps; installable scope matches browse context. */
export function isVisibleInMarketplace(
  moduleId: string,
  moduleScope: ModuleScopeClassification | null,
  browseScope: ModuleInstallScope
): boolean {
  if (isPlatformModuleId(moduleId)) return false;
  if (isCoreAppModuleId(moduleId)) return false;
  if (moduleScope === 'internal') return false;
  if (browseScope === 'personal' && isBusinessOnlyInstallableModuleId(moduleId)) {
    return false;
  }
  return scopeSupportsBrowse(moduleScope, browseScope);
}

export function isInstallableApp(
  moduleId: string,
  moduleScope: ModuleScopeClassification | null,
  browseScope: ModuleInstallScope
): boolean {
  if (isPlatformModuleId(moduleId) || isCoreAppModuleId(moduleId)) return false;
  return isVisibleInModuleManager(moduleId, moduleScope, browseScope);
}

export interface ModuleCatalogPartition<T extends { id: string }> {
  coreApps: T[];
  installedApps: T[];
}

export function partitionModuleCatalog<T extends { id: string }>(
  modules: T[],
  browseScope: ModuleInstallScope,
  getScope: (module: T) => ModuleScopeClassification | null = () => null
): ModuleCatalogPartition<T> {
  const coreApps: T[] = [];
  const installedApps: T[] = [];

  for (const module of modules) {
    const moduleScope = getScope(module);
    if (!isVisibleInModuleManager(module.id, moduleScope, browseScope)) continue;
    if (isCoreAppModuleId(module.id)) {
      coreApps.push(module);
    } else if (isInstallableApp(module.id, moduleScope, browseScope)) {
      installedApps.push(module);
    }
  }

  const coreOrder = CORE_APP_MODULE_IDS as readonly string[];
  coreApps.sort((a, b) => coreOrder.indexOf(a.id) - coreOrder.indexOf(b.id));

  return { coreApps, installedApps };
}
