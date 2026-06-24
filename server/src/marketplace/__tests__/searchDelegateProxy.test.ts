import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  proxyPartnerSearch,
  resetSearchDelegateCircuitBreakers,
} from '../searchDelegateProxy';
import { registerPartnerSearchDelegate, clearPartnerSearchDelegateRegistry } from '../searchDelegateRegistry';
import {
  SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
  SEARCH_DELEGATE_CONTRACT_VERSION,
} from 'shared/types/search-delegate';

const registration = {
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
};

describe('searchDelegateProxy', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    resetSearchDelegateCircuitBreakers();
    clearPartnerSearchDelegateRegistry();
    process.env.PARTNER_SEARCH_DELEGATE_ENABLED = 'true';
    process.env.PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST = 'vssyl-pilot-assets';
    registerPartnerSearchDelegate(registration);
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it('returns sandbox pilot results for matching business', async () => {
    const { results, diagnostics } = await proxyPartnerSearch({
      registration,
      query: 'forklift',
      userId: 'user-1',
      filters: { context: { businessId: 'sandbox-business-a' } },
    });

    expect(diagnostics.outcome).toBe('success');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].moduleId).toBe('vssyl-pilot-assets');
  });

  it('returns no cross-tenant results', async () => {
    const { results } = await proxyPartnerSearch({
      registration,
      query: 'forklift',
      userId: 'user-1',
      filters: { context: { businessId: 'sandbox-business-b' } },
    });

    const titles = results.map((r) => r.title);
    expect(titles.some((t) => t.includes('Forklift'))).toBe(false);
  });

  it('fail-open on disabled flag', async () => {
    process.env.PARTNER_SEARCH_DELEGATE_ENABLED = 'false';
    const { results, diagnostics } = await proxyPartnerSearch({
      registration,
      query: 'forklift',
      userId: 'user-1',
      filters: { context: { businessId: 'sandbox-business-a' } },
    });
    expect(results).toEqual([]);
    expect(diagnostics.outcome).toBe('disabled');
  });

  it('handles HTTP delegate failure without throwing', async () => {
    const httpRegistration = {
      ...registration,
      moduleId: 'http-partner',
      delegateUrl: 'https://partner.example.com/search',
    };
    process.env.PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST = 'http-partner';
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-min!!';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );

    const { results, diagnostics } = await proxyPartnerSearch({
      registration: httpRegistration,
      query: 'test',
      userId: 'user-1',
      filters: { context: { businessId: 'biz' } },
    });

    expect(results).toEqual([]);
    expect(['http_error', 'timeout']).toContain(diagnostics.outcome);
  });
});
