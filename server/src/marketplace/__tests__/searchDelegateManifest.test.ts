import { describe, expect, it } from 'vitest';
import {
  parseSearchDelegateFromManifest,
  validateSearchDelegateHttpsUrl,
  isInternalSearchDelegateUrl,
} from '../searchDelegateManifest';
import { SEARCH_DELEGATE_CONTRACT_VERSION, SANDBOX_PILOT_INTERNAL_DELEGATE_URL } from 'shared/types/search-delegate';

describe('searchDelegateManifest', () => {
  it('parses valid search delegate manifest', () => {
    const { delegate, errors } = parseSearchDelegateFromManifest({
      capabilities: { search: true },
      entities: [{ type: 'asset', supportsSearch: true }],
      searchDelegate: {
        contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
        url: SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
        entityTypes: ['asset'],
        supportedContexts: ['business'],
      },
    });
    expect(errors).toEqual([]);
    expect(delegate?.url).toBe(SANDBOX_PILOT_INTERNAL_DELEGATE_URL);
  });

  it('rejects search capability without searchDelegate', () => {
    const { delegate, errors } = parseSearchDelegateFromManifest({
      capabilities: { search: true },
    });
    expect(delegate).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects private IP HTTPS urls', () => {
    const result = validateSearchDelegateHttpsUrl('https://192.168.1.1/search');
    expect(result.valid).toBe(false);
  });

  it('allows internal delegate urls', () => {
    expect(isInternalSearchDelegateUrl(SANDBOX_PILOT_INTERNAL_DELEGATE_URL)).toBe(true);
  });
});
