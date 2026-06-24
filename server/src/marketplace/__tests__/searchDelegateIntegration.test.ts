import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import * as searchPolicyDual from '../../auth/searchPolicyDual';
import * as searchProviderRegistry from '../../services/search/searchProviderRegistry';
import { executeGlobalSearch } from '../../services/searchCapabilityService';
import { buildPartnerSearchProvider } from '../buildPartnerSearchProvider';
import {
  clearPartnerSearchDelegateRegistry,
  registerPartnerSearchDelegate,
} from '../searchDelegateRegistry';
import {
  SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
  SEARCH_DELEGATE_CONTRACT_VERSION,
} from 'shared/types/search-delegate';

describe('search delegate unified search integration', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    clearPartnerSearchDelegateRegistry();
    process.env.PARTNER_SEARCH_DELEGATE_ENABLED = 'true';
    process.env.PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST = 'vssyl-pilot-assets';
    vi.spyOn(searchPolicyDual, 'evaluateSearchPolicyDual').mockResolvedValue({ blocked: false });

    registerPartnerSearchDelegate({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot Assets',
      moduleVersionId: 'v1',
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
  });

  afterEach(() => {
    process.env = { ...envBackup };
    clearPartnerSearchDelegateRegistry();
  });

  it('includes partner results in global search when filtering by moduleId', async () => {
    const result = await executeGlobalSearch({
      userId: 'user-1',
      query: 'forklift',
      filters: {
        moduleId: 'vssyl-pilot-assets',
        context: { businessId: 'sandbox-business-a' },
      },
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((r) => r.moduleId === 'vssyl-pilot-assets')).toBe(true);
    expect(result.meta.providersInvoked).toContain('vssyl-pilot-assets');
  });

  it('merges partner provider in full search fan-out', async () => {
    const partnerProvider = buildPartnerSearchProvider({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot Assets',
      moduleVersionId: 'v1',
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
    vi.spyOn(searchProviderRegistry, 'getReadySearchProviders').mockReturnValue([partnerProvider]);

    const result = await executeGlobalSearch({
      userId: 'user-1',
      query: 'forklift',
      filters: {
        context: { businessId: 'sandbox-business-a' },
      },
    });

    expect(result.meta.providersInvoked).toContain('vssyl-pilot-assets');
    const partnerHits = result.results.filter((r) => r.moduleId === 'vssyl-pilot-assets');
    expect(partnerHits.length).toBeGreaterThan(0);
  });
});
