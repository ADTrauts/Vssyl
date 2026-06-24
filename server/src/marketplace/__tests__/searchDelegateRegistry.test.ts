import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  clearPartnerSearchDelegateRegistry,
  registerPartnerSearchDelegate,
  getEnabledPartnerSearchDelegates,
  loadSearchDelegateFromPublishedVersion,
} from '../searchDelegateRegistry';
import { SANDBOX_PILOT_INTERNAL_DELEGATE_URL, SEARCH_DELEGATE_CONTRACT_VERSION } from 'shared/types/search-delegate';

describe('searchDelegateRegistry', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    clearPartnerSearchDelegateRegistry();
    process.env.PARTNER_SEARCH_DELEGATE_ENABLED = 'true';
    process.env.PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST = 'vssyl-pilot-assets';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    clearPartnerSearchDelegateRegistry();
  });

  it('registers and lists enabled delegates', () => {
    registerPartnerSearchDelegate({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
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

    expect(getEnabledPartnerSearchDelegates()).toHaveLength(1);
  });

  it('rejects invalid manifest on load', () => {
    const result = loadSearchDelegateFromPublishedVersion({
      moduleId: 'bad-module',
      moduleName: 'Bad',
      moduleStatus: 'APPROVED',
      moduleVersionId: 'v1',
      semver: '1.0.0',
      manifestSnapshot: {
        capabilities: { search: true },
      },
    });
    expect(result.loaded).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fails closed when feature flag disabled', () => {
    process.env.PARTNER_SEARCH_DELEGATE_ENABLED = 'false';
    registerPartnerSearchDelegate({
      moduleId: 'vssyl-pilot-assets',
      moduleName: 'Pilot',
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
    expect(getEnabledPartnerSearchDelegates()).toHaveLength(0);
  });
});
