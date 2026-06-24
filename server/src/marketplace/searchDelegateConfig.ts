/**
 * Feature flags and allowlists for partner search delegates (Phase 1B-B).
 */

export function isPartnerSearchDelegateEnabled(): boolean {
  const flag = process.env.PARTNER_SEARCH_DELEGATE_ENABLED;
  return flag === 'true' || flag === '1';
}

export function getPartnerSearchDelegateAllowlist(): Set<string> | null {
  const raw = process.env.PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST?.trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

export function isModuleAllowedForSearchDelegate(moduleId: string): boolean {
  if (!isPartnerSearchDelegateEnabled()) {
    return false;
  }
  const allowlist = getPartnerSearchDelegateAllowlist();
  if (!allowlist) {
    return true;
  }
  return allowlist.has(moduleId);
}

export function getSearchDelegatePlatformMaxTimeoutMs(): number {
  const raw = process.env.PARTNER_SEARCH_DELEGATE_MAX_TIMEOUT_MS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 500) {
      return Math.min(n, 5000);
    }
  }
  return 3000;
}
