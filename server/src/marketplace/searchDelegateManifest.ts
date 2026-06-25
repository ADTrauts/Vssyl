import {
  SEARCH_DELEGATE_CONTRACT_VERSION,
  VSSYL_INTERNAL_SEARCH_DELEGATE_PREFIX,
  type SearchDelegateManifestCapability,
  type SearchTenantContext,
} from 'vssyl-shared/types/search-delegate';

export const SEARCH_DELEGATE_PLATFORM_MAX_TIMEOUT_MS = 3000;
export const SEARCH_DELEGATE_DEFAULT_TIMEOUT_MS = 2500;
export const SEARCH_DELEGATE_DEFAULT_MAX_RESULTS = 10;
export const SEARCH_DELEGATE_ABSOLUTE_MAX_RESULTS = 25;

const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{1,62}$/;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function declaresSearchCapability(manifest: Record<string, unknown>): boolean {
  const caps = asRecord(manifest.capabilities);
  if (caps?.search === true) return true;
  if (Array.isArray(manifest.capabilities)) {
    return manifest.capabilities.some(
      (c) => typeof c === 'string' && c.toLowerCase() === 'search'
    );
  }
  return false;
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) {
    return true;
  }
  return false;
}

export function isInternalSearchDelegateUrl(url: string): boolean {
  return url.startsWith(VSSYL_INTERNAL_SEARCH_DELEGATE_PREFIX);
}

export function validateSearchDelegateHttpsUrl(url: string): { valid: boolean; error?: string } {
  if (isInternalSearchDelegateUrl(url)) {
    return { valid: true };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'searchDelegate.url must use HTTPS' };
    }
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      return { valid: false, error: 'searchDelegate.url must not target private or local addresses' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'searchDelegate.url is not a valid URL' };
  }
}

export function parseSearchDelegateFromManifest(
  manifest: Record<string, unknown>
): { delegate: SearchDelegateManifestCapability | null; errors: string[] } {
  const errors: string[] = [];

  if (!declaresSearchCapability(manifest)) {
    return { delegate: null, errors: [] };
  }

  const raw = asRecord(manifest.searchDelegate);
  if (!raw) {
    errors.push('capabilities.search requires searchDelegate block');
    return { delegate: null, errors };
  }

  const contractVersion = raw.contractVersion;
  if (contractVersion !== SEARCH_DELEGATE_CONTRACT_VERSION) {
    errors.push(`searchDelegate.contractVersion must be "${SEARCH_DELEGATE_CONTRACT_VERSION}"`);
  }

  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!url) {
    errors.push('searchDelegate.url is required');
  } else {
    const urlCheck = validateSearchDelegateHttpsUrl(url);
    if (!urlCheck.valid && urlCheck.error) {
      errors.push(urlCheck.error);
    }
  }

  const entityTypes = asStringArray(raw.entityTypes);
  if (entityTypes.length === 0) {
    errors.push('searchDelegate.entityTypes must be a non-empty array');
  }

  const supportedContexts = asStringArray(raw.supportedContexts).filter(
    (c): c is SearchTenantContext =>
      c === 'personal' || c === 'business' || c === 'household'
  );
  if (supportedContexts.length === 0) {
    errors.push('searchDelegate.supportedContexts must include personal, business, and/or household');
  }

  const manifestEntities = asStringArray(
    Array.isArray(manifest.entities)
      ? (manifest.entities as unknown[])
          .map((e) => {
            const rec = asRecord(e);
            if (!rec || rec.supportsSearch !== true) return null;
            return typeof rec.type === 'string' ? rec.type : null;
          })
          .filter((t): t is string => typeof t === 'string')
      : []
  );

  for (const et of entityTypes) {
    if (manifestEntities.length > 0 && !manifestEntities.includes(et)) {
      errors.push(
        `searchDelegate.entityTypes "${et}" must match an entities[].type with supportsSearch: true`
      );
    }
  }

  let timeoutMs = SEARCH_DELEGATE_DEFAULT_TIMEOUT_MS;
  if (typeof raw.timeoutMs === 'number' && Number.isFinite(raw.timeoutMs)) {
    timeoutMs = Math.min(
      SEARCH_DELEGATE_PLATFORM_MAX_TIMEOUT_MS,
      Math.max(500, Math.floor(raw.timeoutMs))
    );
  }

  let maxResults = SEARCH_DELEGATE_DEFAULT_MAX_RESULTS;
  if (typeof raw.maxResults === 'number' && Number.isFinite(raw.maxResults)) {
    maxResults = Math.min(
      SEARCH_DELEGATE_ABSOLUTE_MAX_RESULTS,
      Math.max(1, Math.floor(raw.maxResults))
    );
  }

  if (errors.length > 0) {
    return { delegate: null, errors };
  }

  return {
    delegate: {
      contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
      url,
      entityTypes,
      supportedContexts,
      timeoutMs,
      maxResults,
    },
    errors: [],
  };
}

export function isValidMarketplaceModuleId(moduleId: string): boolean {
  return MODULE_ID_PATTERN.test(moduleId);
}
