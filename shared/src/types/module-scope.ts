/** Canonical marketplace module scope classification (Phase 1B-E.5-F). */
export const MODULE_SCOPE_CLASSIFICATIONS = [
  'personal',
  'business',
  'both',
  'internal',
] as const;

export type ModuleScopeClassification = (typeof MODULE_SCOPE_CLASSIFICATIONS)[number];

/** Install / marketplace browse scope (household deferred). */
export const MODULE_INSTALL_SCOPES = ['personal', 'business'] as const;

export type ModuleInstallScope = (typeof MODULE_INSTALL_SCOPES)[number];

/** Tenant contexts declared in manifest and sub-capability blocks. */
export const MODULE_TENANT_CONTEXTS = ['personal', 'business', 'household'] as const;

export type ModuleTenantContext = (typeof MODULE_TENANT_CONTEXTS)[number];

export interface ResolvedModuleScope {
  moduleScope: ModuleScopeClassification;
  supportedContexts: ModuleTenantContext[];
}
