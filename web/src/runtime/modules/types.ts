/**
 * Workspace runtime module contracts.
 * Module = capability; widget = projection (see docs/architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md).
 */

export type WorkspaceContextType =
  | 'personal'
  | 'business'
  | 'household'
  | 'education'
  | 'admin';

export type ModuleSource = 'core' | 'marketplace' | 'custom';

export type ModuleStatus = 'active' | 'beta' | 'disabled' | 'experimental';

export type ModuleCapability =
  | 'read'
  | 'write'
  | 'realtime'
  | 'ai'
  | 'analytics'
  | 'notifications'
  | 'admin'
  | 'vlink'
  | 'trash'
  | 'search'
  | 'businessWorkspace'
  | 'globalActivity';

export type WidgetRefreshMode = 'manual' | 'polling' | 'socket' | 'cache';

export type WidgetSizePreset = 'sm' | 'md' | 'lg';

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetVisibilityRules {
  /** Feature flag keys — all must be enabled when set. */
  featureFlags?: string[];
  /** Minimum business tier id (placeholder for future gating). */
  minBusinessTier?: string;
}

export interface WidgetDefinition {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  supportedContexts: WorkspaceContextType[];
  requiredPermissions: string[];
  defaultSize: WidgetSize;
  allowedSizes: WidgetSizePreset[];
  /** Legacy widget type key consumed by WidgetShell / DashboardClient. */
  componentKey: string;
  dataRequirements?: string[];
  refreshMode?: WidgetRefreshMode;
  visibilityRules?: WidgetVisibilityRules;
}

export interface RouteDefinition {
  path?: string;
  routeKey: string;
  label: string;
  context: WorkspaceContextType;
  requiredPermissions: string[];
  moduleId: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  /** Icon key aligned with MODULE_ICONS / legacy sidebar. */
  icon?: string;
  supportedContexts: WorkspaceContextType[];
  requiredPermissions: string[];
  featureFlags?: string[];
  widgets: string[];
  routes: RouteDefinition[];
  defaultRoute?: string;
  category?: 'core' | 'productivity' | 'communication' | 'business' | 'utility' | 'admin';
  isCore?: boolean;
  isBusinessScoped?: boolean;
  source?: ModuleSource;
  capabilities?: ModuleCapability[];
  status?: ModuleStatus;
}
