import type { PartnerSearchDelegateRegistration } from 'vssyl-shared/types/search-delegate';
import { logger } from '../lib/logger.js';
import {
  isModuleAllowedForSearchDelegate,
  isPartnerSearchDelegateEnabled,
} from './searchDelegateConfig.js';
import {
  isValidMarketplaceModuleId,
  parseSearchDelegateFromManifest,
  SEARCH_DELEGATE_DEFAULT_MAX_RESULTS,
  SEARCH_DELEGATE_DEFAULT_TIMEOUT_MS,
} from './searchDelegateManifest.js';

const delegateIndex = new Map<string, PartnerSearchDelegateRegistration>();

export function clearPartnerSearchDelegateRegistry(): void {
  delegateIndex.clear();
}

export function registerPartnerSearchDelegate(
  registration: PartnerSearchDelegateRegistration
): void {
  if (!isValidMarketplaceModuleId(registration.moduleId)) {
    throw new Error(`Invalid moduleId for search delegate: ${registration.moduleId}`);
  }
  delegateIndex.set(registration.moduleId, registration);
}

export function unregisterPartnerSearchDelegate(moduleId: string): void {
  delegateIndex.delete(moduleId);
}

export function getPartnerSearchDelegate(
  moduleId: string
): PartnerSearchDelegateRegistration | undefined {
  return delegateIndex.get(moduleId);
}

export function listPartnerSearchDelegates(): PartnerSearchDelegateRegistration[] {
  return [...delegateIndex.values()];
}

export function getEnabledPartnerSearchDelegates(): PartnerSearchDelegateRegistration[] {
  if (!isPartnerSearchDelegateEnabled()) {
    return [];
  }
  return listPartnerSearchDelegates().filter((d) =>
    isModuleAllowedForSearchDelegate(d.moduleId)
  );
}

export interface LoadSearchDelegateFromPublishedVersionParams {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifestSnapshot: Record<string, unknown>;
  moduleVersionId: string;
  semver: string;
  sandboxCertified?: boolean;
}

/**
 * Load or refresh delegate from published module version manifest.
 * Returns false when config invalid or module not eligible.
 */
export function loadSearchDelegateFromPublishedVersion(
  params: LoadSearchDelegateFromPublishedVersionParams
): { loaded: boolean; errors: string[] } {
  const { moduleId, moduleStatus } = params;

  if (moduleStatus !== 'APPROVED') {
    unregisterPartnerSearchDelegate(moduleId);
    return { loaded: false, errors: ['module_not_approved'] };
  }

  const { delegate, errors } = parseSearchDelegateFromManifest(params.manifestSnapshot);
  if (!delegate) {
    unregisterPartnerSearchDelegate(moduleId);
    if (errors.length === 0) {
      return { loaded: false, errors: [] };
    }
    return { loaded: false, errors };
  }

  if (errors.length > 0) {
    unregisterPartnerSearchDelegate(moduleId);
    return { loaded: false, errors };
  }

  const registration: PartnerSearchDelegateRegistration = {
    moduleId,
    moduleName: params.moduleName,
    moduleVersionId: params.moduleVersionId,
    semver: params.semver,
    delegateUrl: delegate.url,
    contractVersion: delegate.contractVersion,
    entityTypes: delegate.entityTypes,
    supportedContexts: delegate.supportedContexts,
    timeoutMs: delegate.timeoutMs ?? SEARCH_DELEGATE_DEFAULT_TIMEOUT_MS,
    maxResults: delegate.maxResults ?? SEARCH_DELEGATE_DEFAULT_MAX_RESULTS,
    registeredAt: new Date().toISOString(),
    sandboxCertified: params.sandboxCertified ?? false,
  };

  registerPartnerSearchDelegate(registration);

  void logger.info('Partner search delegate registered', {
    operation: 'partner_search_delegate_register',
    moduleId,
    moduleVersionId: params.moduleVersionId,
    delegateUrl: delegate.url.startsWith('vssyl-internal://') ? 'internal' : 'https',
  });

  return { loaded: true, errors: [] };
}

export function syncPartnerSearchDelegateForModule(params: {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifest: Record<string, unknown>;
  publishedVersion?: {
    id: string;
    version: string;
    manifestSnapshot: Record<string, unknown>;
    scanPassed: boolean;
    certificationAllowsSearch: boolean;
  } | null;
}): void {
  if (!params.publishedVersion) {
    unregisterPartnerSearchDelegate(params.moduleId);
    return;
  }

  if (!params.publishedVersion.scanPassed) {
    unregisterPartnerSearchDelegate(params.moduleId);
    return;
  }

  if (!params.publishedVersion.certificationAllowsSearch) {
    unregisterPartnerSearchDelegate(params.moduleId);
    return;
  }

  const manifest =
    params.publishedVersion.manifestSnapshot &&
    typeof params.publishedVersion.manifestSnapshot === 'object'
      ? (params.publishedVersion.manifestSnapshot as Record<string, unknown>)
      : params.manifest;

  loadSearchDelegateFromPublishedVersion({
    moduleId: params.moduleId,
    moduleName: params.moduleName,
    moduleStatus: params.moduleStatus,
    manifestSnapshot: manifest,
    moduleVersionId: params.publishedVersion.id,
    semver: params.publishedVersion.version,
    sandboxCertified: true,
  });
}
