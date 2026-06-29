import type { ModuleInstallScope } from 'shared/types';

export class ModuleManagerContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModuleManagerContextError';
  }
}

export type ResolvedModuleManagerContext =
  | { scope: 'personal' }
  | { scope: 'business'; businessId: string };

export function resolveModuleManagerContext(params: {
  pathname: string | null;
  businessIdFromRoute?: string | null;
}): ResolvedModuleManagerContext {
  const path = params.pathname ?? '';
  const businessRouteMatch = path.match(/^\/business\/([^/]+)/);
  const businessId = params.businessIdFromRoute ?? businessRouteMatch?.[1] ?? null;

  if (businessId) {
    return { scope: 'business', businessId };
  }

  return { scope: 'personal' };
}

export function assertModuleApiScope(
  opts?: { scope?: ModuleInstallScope; businessId?: string }
): { scope: ModuleInstallScope; businessId?: string } {
  const scope = opts?.scope ?? 'personal';
  if (scope === 'business') {
    if (!opts?.businessId) {
      throw new ModuleManagerContextError(
        'Select a business workspace to manage business applications.'
      );
    }
    return { scope: 'business', businessId: opts.businessId };
  }
  return { scope: 'personal' };
}

/** Remove legacy manual scope preferences from older Module Manager builds. */
export function migrateLegacyModuleManagerPreferences(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('modules:scope');
    localStorage.removeItem('modules:businessId');
  } catch {
    // non-critical
  }
}
