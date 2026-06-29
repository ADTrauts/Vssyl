import type { ModuleInstallScope } from './module-scope';

/**
 * Canonical application lifecycle stages.
 *
 * Marketplace → Install → Configure → Enable → Dashboard Assignment → Use → Update → Disable → Uninstall
 */
export const APPLICATION_LIFECYCLE_STAGES = [
  'marketplace',
  'installed',
  'configure',
  'enable',
  'dashboard_assignment',
  'use',
  'update',
  'disable',
  'uninstall',
] as const;

export type ApplicationLifecycleStage = (typeof APPLICATION_LIFECYCLE_STAGES)[number];

/** Surface that owns each lifecycle stage (navigation consistency). */
export const LIFECYCLE_STAGE_OWNER = {
  marketplace: 'marketplace',
  installed: 'application_manager',
  configure: 'application_manager',
  enable: 'application_manager',
  dashboard_assignment: 'dashboard_picker',
  use: 'module_runtime',
  update: 'marketplace',
  disable: 'application_manager',
  uninstall: 'application_manager',
} as const;

export type LifecycleStageOwner = (typeof LIFECYCLE_STAGE_OWNER)[ApplicationLifecycleStage];

/** Future-ready metadata carried on manifests and installation records. */
export interface ApplicationLifecycleMetadata {
  installedVersion?: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  isEnabled?: boolean;
  supportsConfiguration?: boolean;
  supportsDashboardAssignment?: boolean;
}

/** Resolved capabilities for UI (hide stages not yet implemented). */
export interface ApplicationLifecycleCapabilities {
  canConfigure: boolean;
  canAssignToDashboard: boolean;
  canDisable: boolean;
  canUpdate: boolean;
  canUninstall: boolean;
  canOpen: boolean;
}

export interface ApplicationLifecycleContext {
  scope: ModuleInstallScope;
  isCoreApp?: boolean;
  isPlatform?: boolean;
  isInstalled?: boolean;
}

export function defaultLifecycleCapabilities(
  context: ApplicationLifecycleContext
): ApplicationLifecycleCapabilities {
  const installed = context.isInstalled !== false;
  const isCore = context.isCoreApp === true;
  const isPlatform = context.isPlatform === true;

  return {
    canConfigure: installed && !isPlatform,
    canAssignToDashboard: installed && !isPlatform,
    canDisable: false,
    canUpdate: false,
    canUninstall: installed && !isCore && !isPlatform,
    canOpen: installed && !isPlatform,
  };
}
