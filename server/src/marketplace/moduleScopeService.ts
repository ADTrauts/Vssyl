import type {
  ModuleInstallScope,
  ModuleScopeClassification,
  ModuleTenantContext,
  ResolvedModuleScope,
} from 'vssyl-shared/types/module-scope';
import {
  MODULE_SCOPE_CLASSIFICATIONS,
  MODULE_TENANT_CONTEXTS,
} from 'vssyl-shared/types/module-scope';
import { asRecordJson } from '../controllers/module/moduleShared.js';
import { getBuiltInModuleScope } from '../constants/builtInModuleScopes.js';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function isModuleScopeClassification(value: string): value is ModuleScopeClassification {
  return (MODULE_SCOPE_CLASSIFICATIONS as readonly string[]).includes(value);
}

function isTenantContext(value: string): value is ModuleTenantContext {
  return (MODULE_TENANT_CONTEXTS as readonly string[]).includes(value);
}

/** Infer scope from legacy supportedContexts when moduleScope is absent (runtime only). */
export function inferModuleScopeFromContexts(
  contexts: readonly string[]
): ModuleScopeClassification | null {
  const hasPersonal = contexts.includes('personal');
  const hasBusiness = contexts.includes('business');
  if (hasPersonal && hasBusiness) return 'both';
  if (hasBusiness) return 'business';
  if (hasPersonal) return 'personal';
  return null;
}

export function resolveSupportedContextsFromManifest(manifest: Record<string, unknown>): string[] {
  const explicit = asStringArray(manifest.supportedContexts);
  if (explicit.length > 0) return explicit;

  const features = asRecordJson(manifest.features);
  const fromFeatures = Object.keys(features).filter((k) => features[k] != null);
  if (fromFeatures.length > 0) return fromFeatures;

  const routes = asRecordJson(manifest.routes);
  const fromRoutes = Object.keys(routes).filter((k) => routes[k] != null);
  if (fromRoutes.length > 0) return fromRoutes;

  const frontend = asRecordJson(manifest.frontend);
  const inferred: string[] = [];
  if (frontend.personalUrl || frontend.entryUrl) inferred.push('personal');
  if (frontend.businessUrl) inferred.push('business');
  return inferred;
}

export function normalizeTenantContexts(raw: readonly string[]): ModuleTenantContext[] {
  const seen = new Set<ModuleTenantContext>();
  for (const value of raw) {
    if (isTenantContext(value)) {
      seen.add(value);
    }
  }
  return [...seen];
}

export interface ModuleScopeValidationOptions {
  moduleId?: string;
  /** Third-party certification requires explicit manifest.moduleScope. */
  requireExplicitScope?: boolean;
}

export interface ModuleScopeValidationResult {
  moduleScope: ModuleScopeClassification | null;
  supportedContexts: ModuleTenantContext[];
  errors: string[];
  warnings: string[];
}

export function expectedContextsForScope(
  moduleScope: ModuleScopeClassification
): ModuleTenantContext[] {
  switch (moduleScope) {
    case 'personal':
      return ['personal'];
    case 'business':
      return ['business'];
    case 'both':
      return ['personal', 'business'];
    case 'internal':
      return [];
    default:
      return [];
  }
}

export function validateModuleScopeAlignment(
  moduleScope: ModuleScopeClassification,
  supportedContexts: ModuleTenantContext[]
): string[] {
  const errors: string[] = [];
  const hasPersonal = supportedContexts.includes('personal');
  const hasBusiness = supportedContexts.includes('business');

  switch (moduleScope) {
    case 'personal':
      if (!hasPersonal) {
        errors.push('moduleScope personal requires supportedContexts to include personal');
      }
      if (hasBusiness) {
        errors.push('moduleScope personal must not include business in supportedContexts');
      }
      break;
    case 'business':
      if (!hasBusiness) {
        errors.push('moduleScope business requires supportedContexts to include business');
      }
      if (hasPersonal) {
        errors.push('moduleScope business must not include personal in supportedContexts');
      }
      break;
    case 'both':
      if (!hasPersonal || !hasBusiness) {
        errors.push('moduleScope both requires supportedContexts to include personal and business');
      }
      break;
    case 'internal':
      break;
    default:
      break;
  }

  return errors;
}

export function validateSubCapabilityContexts(
  moduleContexts: readonly ModuleTenantContext[],
  subContexts: readonly string[],
  label: string
): string | null {
  const invalid = subContexts.filter((c) => !isTenantContext(c));
  if (invalid.length > 0) {
    return `${label}.supportedContexts has invalid values: ${invalid.join(', ')}`;
  }

  const moduleSet = new Set(moduleContexts);
  const missing = subContexts.filter(
    (c) => isTenantContext(c) && !moduleSet.has(c)
  );
  if (missing.length > 0) {
    return `${label}.supportedContexts [${missing.join(', ')}] must be declared in manifest supportedContexts`;
  }

  return null;
}

export function validateModuleScopeManifest(
  manifest: Record<string, unknown>,
  options: ModuleScopeValidationOptions = {}
): ModuleScopeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawScope = typeof manifest.moduleScope === 'string' ? manifest.moduleScope.trim() : '';
  const rawContexts = resolveSupportedContextsFromManifest(manifest);
  const supportedContexts = normalizeTenantContexts(rawContexts);

  const invalidContexts = rawContexts.filter((c) => !isTenantContext(c));
  if (invalidContexts.length > 0) {
    errors.push(
      `supportedContexts contains invalid values: ${invalidContexts.join(', ')}. Allowed: personal, business, household`
    );
  }

  let moduleScope: ModuleScopeClassification | null = null;

  if (rawScope) {
    if (!isModuleScopeClassification(rawScope)) {
      errors.push(
        `moduleScope must be one of: ${MODULE_SCOPE_CLASSIFICATIONS.join(', ')}`
      );
    } else {
      moduleScope = rawScope;
    }
  } else if (options.moduleId) {
    const builtInScope = getBuiltInModuleScope(options.moduleId);
    if (builtInScope) {
      moduleScope = builtInScope;
      if (supportedContexts.length === 0) {
        warnings.push('Built-in module missing supportedContexts; using built-in scope map');
      }
    }
  }

  if (!moduleScope && options.requireExplicitScope) {
    errors.push('manifest.moduleScope is required (personal | business | both | internal)');
  } else if (!moduleScope) {
    const inferred = inferModuleScopeFromContexts(supportedContexts);
    if (inferred) {
      moduleScope = inferred;
      warnings.push('moduleScope inferred from supportedContexts — declare moduleScope explicitly');
    } else if (supportedContexts.length === 0) {
      errors.push('supportedContexts must declare at least one tenant context');
    } else {
      errors.push('unable to resolve moduleScope from supportedContexts');
    }
  }

  if (moduleScope && moduleScope !== 'internal' && supportedContexts.length === 0) {
    errors.push('supportedContexts (or features/routes) must declare at least one context');
  }

  if (moduleScope) {
    errors.push(...validateModuleScopeAlignment(moduleScope, supportedContexts));
  }

  return { moduleScope, supportedContexts, errors, warnings };
}

export function resolveEffectiveModuleScope(
  manifest: Record<string, unknown>,
  moduleId?: string
): ResolvedModuleScope | null {
  const result = validateModuleScopeManifest(manifest, { moduleId, requireExplicitScope: false });
  if (result.errors.length > 0 || !result.moduleScope) {
    return null;
  }
  return {
    moduleScope: result.moduleScope,
    supportedContexts: result.supportedContexts,
  };
}

export function moduleScopeSupportsInstall(
  moduleScope: ModuleScopeClassification,
  installScope: ModuleInstallScope
): boolean {
  if (moduleScope === 'internal') return false;
  if (moduleScope === 'both') return true;
  return moduleScope === installScope;
}

export function moduleScopeVisibleInMarketplace(
  moduleScope: ModuleScopeClassification,
  browseScope: ModuleInstallScope
): boolean {
  if (moduleScope === 'internal') return false;
  return moduleScopeSupportsInstall(moduleScope, browseScope);
}

export function assertModuleInstallScopeAllowed(params: {
  manifest: Record<string, unknown>;
  moduleId: string;
  installScope: ModuleInstallScope;
}): { allowed: boolean; reason?: string; moduleScope?: ModuleScopeClassification } {
  const resolved = resolveEffectiveModuleScope(params.manifest, params.moduleId);
  if (!resolved) {
    return { allowed: false, reason: 'Module scope could not be resolved from manifest' };
  }

  if (!moduleScopeSupportsInstall(resolved.moduleScope, params.installScope)) {
    return {
      allowed: false,
      reason: `Module scope "${resolved.moduleScope}" does not support ${params.installScope} installation`,
      moduleScope: resolved.moduleScope,
    };
  }

  return { allowed: true, moduleScope: resolved.moduleScope };
}

export function builtInModuleAvailableForPersonalScope(moduleId: string): boolean {
  const scope = getBuiltInModuleScope(moduleId);
  if (!scope) return false;
  return moduleScopeSupportsInstall(scope, 'personal');
}
