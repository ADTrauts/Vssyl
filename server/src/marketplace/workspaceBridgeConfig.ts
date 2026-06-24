/**
 * Feature flags for partner workspace embed + auth bridge (Phase 1B-C).
 */

export function isPartnerWorkspaceBridgeEnabled(): boolean {
  const flag = process.env.PARTNER_WORKSPACE_BRIDGE_ENABLED;
  return flag === 'true' || flag === '1';
}

export function getPartnerWorkspaceBridgeAllowlist(): Set<string> | null {
  const raw = process.env.PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST?.trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

export function isModuleAllowedForWorkspaceBridge(moduleId: string): boolean {
  if (!isPartnerWorkspaceBridgeEnabled()) {
    return false;
  }
  const allowlist = getPartnerWorkspaceBridgeAllowlist();
  if (!allowlist) {
    return true;
  }
  return allowlist.has(moduleId);
}

export function getWorkspaceBridgeJwtTtlSeconds(): number {
  const raw = process.env.PARTNER_WORKSPACE_BRIDGE_JWT_TTL_SECONDS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 30 && n <= 300) {
      return n;
    }
  }
  return 120;
}
