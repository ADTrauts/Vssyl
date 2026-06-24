import { describe, expect, it } from 'vitest';
import { normalizePartnerSearchResults } from '../searchDelegateNormalizer';
import type { PartnerSearchDelegateRegistration } from 'shared/types/search-delegate';

const registration: PartnerSearchDelegateRegistration = {
  moduleId: 'vssyl-pilot-assets',
  moduleName: 'Pilot Assets',
  moduleVersionId: 'v1',
  semver: '1.0.0',
  delegateUrl: 'vssyl-internal://sandbox/vssyl-pilot-assets/search',
  contractVersion: '1',
  entityTypes: ['asset'],
  supportedContexts: ['business'],
  timeoutMs: 2500,
  maxResults: 10,
  registeredAt: new Date().toISOString(),
  sandboxCertified: true,
};

describe('searchDelegateNormalizer', () => {
  it('normalizes valid items and pins moduleId', () => {
    const { results, droppedCount } = normalizePartnerSearchResults({
      registration,
      limit: 10,
      items: [
        {
          id: 'ast_1',
          title: 'Forklift',
          type: 'asset',
          url: '/business/biz/workspace/vssyl-pilot-assets?entity=ast_1',
          permissions: [{ type: 'read', granted: true }],
          moduleId: 'wrong-id',
        } as unknown as import('shared/types/search-delegate').PartnerSearchResultItem,
      ],
    });

    expect(droppedCount).toBe(0);
    expect(results[0].moduleId).toBe('vssyl-pilot-assets');
    expect(results[0].moduleName).toBe('Pilot Assets');
  });

  it('drops items without read permission', () => {
    const { results, droppedCount } = normalizePartnerSearchResults({
      registration,
      limit: 10,
      items: [
        {
          id: 'ast_1',
          title: 'Forklift',
          type: 'asset',
          url: '/x',
          permissions: [{ type: 'read', granted: false }],
        },
      ],
    });
    expect(results).toHaveLength(0);
    expect(droppedCount).toBe(1);
  });

  it('drops invalid entity types', () => {
    const { results } = normalizePartnerSearchResults({
      registration,
      limit: 10,
      items: [
        {
          id: 'x',
          title: 'Bad',
          type: 'unknown',
          url: '/x',
          permissions: [{ type: 'read', granted: true }],
        },
      ],
    });
    expect(results).toHaveLength(0);
  });
});
