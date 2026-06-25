/**
 * Platform Controller API path aliases (Phase 1B).
 * Maps canonical `/api/admin-portal/*` prefixes to existing satellite mounts
 * without backend refactors. Used by the Next.js API proxy only.
 */

const ALIAS_PREFIXES: Array<{ from: string; to: string }> = [
  { from: '/api/admin-portal/providers', to: '/api/admin/ai-providers' },
  { from: '/api/admin-portal/overrides', to: '/api/admin-override' },
  { from: '/api/admin-portal/modules/ai', to: '/api/admin/modules/ai' },
];

/**
 * Resolve approved Platform Controller API aliases before proxying to Express.
 * Unmatched paths pass through unchanged.
 */
export function resolvePlatformControllerApiAlias(pathname: string): string {
  for (const { from, to } of ALIAS_PREFIXES) {
    if (pathname === from || pathname.startsWith(`${from}/`)) {
      return `${to}${pathname.slice(from.length)}`;
    }
  }
  return pathname;
}

export const PLATFORM_CONTROLLER_API_ALIASES = ALIAS_PREFIXES;
