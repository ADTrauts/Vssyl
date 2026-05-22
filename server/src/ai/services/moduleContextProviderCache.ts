/**
 * Per-provider module context cache helpers (Phase 3B).
 */

export type ProviderCacheEntry = {
  data: unknown;
  cachedAt: string;
};

export type ProviderCacheStore = Record<string, ProviderCacheEntry>;

export function buildProviderCacheKey(providerName: string, scopeKey: string): string {
  return `${providerName}:${scopeKey}`;
}

export function resolveScopeKey(params?: Record<string, unknown>): string {
  const businessId = params?.businessId;
  if (typeof businessId === 'string' && businessId.length > 0) {
    return businessId;
  }

  const dashboardId = params?.dashboardId;
  if (typeof dashboardId === 'string' && dashboardId.length > 0) {
    return `dash:${dashboardId}`;
  }

  return 'personal';
}

export function readProviderCache(
  store: unknown,
  cacheKey: string,
  cacheDurationMs: number
): { data: unknown; cachedAt: Date } | null {
  if (!store || typeof store !== 'object') {
    return null;
  }

  const entry = (store as ProviderCacheStore)[cacheKey];
  if (!entry?.cachedAt || entry.data === undefined) {
    return null;
  }

  const cachedAt = new Date(entry.cachedAt);
  if (Number.isNaN(cachedAt.getTime())) {
    return null;
  }

  if (Date.now() - cachedAt.getTime() >= cacheDurationMs) {
    return null;
  }

  return { data: entry.data, cachedAt };
}

export function writeProviderCache(
  existing: unknown,
  cacheKey: string,
  data: unknown
): ProviderCacheStore {
  const store: ProviderCacheStore =
    existing && typeof existing === 'object'
      ? { ...(existing as ProviderCacheStore) }
      : {};

  store[cacheKey] = {
    data,
    cachedAt: new Date().toISOString(),
  };

  return store;
}
