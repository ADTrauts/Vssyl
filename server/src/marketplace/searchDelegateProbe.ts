import type { PartnerSearchDelegateRegistration } from 'shared/types/search-delegate';
import { proxyPartnerSearch } from './searchDelegateProxy.js';
import { parseSearchDelegateFromManifest } from './searchDelegateManifest.js';

export interface SearchDelegateProbeResult {
  ok: boolean;
  moduleId: string;
  hasSearchCapability: boolean;
  hasSearchDelegate: boolean;
  delegateUrl?: string;
  validationErrors: string[];
  probeOutcome?: string;
  resultCount?: number;
  durationMs?: number;
  errorMessage?: string;
}

/**
 * Admin / certification probe — sample query against delegate (or validation only).
 */
export async function probeSearchDelegate(params: {
  moduleId: string;
  manifest: Record<string, unknown>;
  registration?: PartnerSearchDelegateRegistration;
  probeUserId: string;
  probeBusinessId?: string;
  executeLiveProbe?: boolean;
}): Promise<SearchDelegateProbeResult> {
  const { delegate, errors } = parseSearchDelegateFromManifest(params.manifest);
  const hasSearchCapability =
    Boolean(params.manifest.capabilities && typeof params.manifest.capabilities === 'object'
      ? (params.manifest.capabilities as Record<string, unknown>).search === true
      : false) ||
    (Array.isArray(params.manifest.capabilities) &&
      params.manifest.capabilities.some((c) => c === 'search'));

  const base: SearchDelegateProbeResult = {
    ok: false,
    moduleId: params.moduleId,
    hasSearchCapability,
    hasSearchDelegate: Boolean(delegate),
    delegateUrl: delegate?.url,
    validationErrors: errors,
  };

  if (!hasSearchCapability) {
    return { ...base, ok: true };
  }

  if (!delegate || errors.length > 0) {
    return base;
  }

  if (!params.executeLiveProbe || !params.registration) {
    return { ...base, ok: true };
  }

  const { results, diagnostics } = await proxyPartnerSearch({
    registration: params.registration,
    query: 'test',
    userId: params.probeUserId,
    filters: {
      context: {
        businessId: params.probeBusinessId,
      },
    },
  });

  const ok = diagnostics.outcome === 'success' || diagnostics.outcome === 'disabled';

  return {
    ...base,
    ok,
    probeOutcome: diagnostics.outcome,
    resultCount: results.length,
    durationMs: diagnostics.durationMs,
    errorMessage: diagnostics.errorMessage,
  };
}
