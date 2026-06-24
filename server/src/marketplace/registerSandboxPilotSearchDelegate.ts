import {
  SANDBOX_PILOT_ASSETS_MODULE_ID,
  SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
  SEARCH_DELEGATE_CONTRACT_VERSION,
} from 'shared/types/search-delegate';
import { registerPartnerSearchDelegate } from './searchDelegateRegistry.js';
import { isModuleAllowedForSearchDelegate, isPartnerSearchDelegateEnabled } from './searchDelegateConfig.js';

const SANDBOX_PILOT_MANIFEST_SNAPSHOT = {
  name: 'Vssyl Pilot Assets',
  version: '1.0.0',
  capabilities: { search: true },
  supportedContexts: ['business'],
  entities: [
    {
      type: 'asset',
      displayName: 'Asset',
      supportsSearch: true,
    },
  ],
  searchDelegate: {
    contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
    url: SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
    entityTypes: ['asset'],
    supportedContexts: ['business'],
    timeoutMs: 2500,
    maxResults: 10,
  },
};

/**
 * Registers the internal sandbox pilot delegate when feature flag + allowlist permit.
 * Called on server startup (non-blocking).
 */
export function registerSandboxPilotSearchDelegateOnStartup(): void {
  if (!isPartnerSearchDelegateEnabled()) {
    return;
  }
  if (!isModuleAllowedForSearchDelegate(SANDBOX_PILOT_ASSETS_MODULE_ID)) {
    return;
  }

  registerPartnerSearchDelegate({
    moduleId: SANDBOX_PILOT_ASSETS_MODULE_ID,
    moduleName: 'Vssyl Pilot Assets',
    moduleVersionId: 'sandbox-pilot-v1',
    semver: '1.0.0',
    delegateUrl: SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
    contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
    entityTypes: ['asset'],
    supportedContexts: ['business'],
    timeoutMs: 2500,
    maxResults: 10,
    registeredAt: new Date().toISOString(),
    sandboxCertified: true,
  });
}

export function getSandboxPilotManifestSnapshot(): Record<string, unknown> {
  return { ...SANDBOX_PILOT_MANIFEST_SNAPSHOT };
}
