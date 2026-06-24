/**
 * Feature flags and allowlists for partner activity ingest (Phase 1B-F).
 */

export function isPartnerActivityIngestEnabled(): boolean {
  const flag = process.env.PARTNER_ACTIVITY_INGEST_ENABLED;
  return flag === 'true' || flag === '1';
}

export function getPartnerActivityIngestAllowlist(): Set<string> | null {
  const raw = process.env.PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST?.trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

export function isModuleAllowedForActivityIngest(moduleId: string): boolean {
  if (!isPartnerActivityIngestEnabled()) {
    return false;
  }
  const allowlist = getPartnerActivityIngestAllowlist();
  if (!allowlist) {
    return true;
  }
  return allowlist.has(moduleId);
}

export function getActivityIngestJwtTtlSeconds(): number {
  const raw = process.env.PARTNER_ACTIVITY_INGEST_JWT_TTL_SECONDS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 60 && n <= 120) {
      return n;
    }
  }
  return 90;
}

export const ACTIVITY_INGEST_DEFAULT_MAX_METADATA_BYTES = 4096;
export const ACTIVITY_INGEST_MAX_REQUEST_BYTES = 8192;
export const ACTIVITY_INGEST_RATE_LIMIT_PER_MINUTE = 60;
export const ACTIVITY_INGEST_IDEMPOTENCY_TTL_MS = 72 * 60 * 60 * 1000;
