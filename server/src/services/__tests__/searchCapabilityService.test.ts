import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as searchPolicyDual from '../../auth/searchPolicyDual';
import {
  SearchAccessError,
  executeGlobalSearch,
} from '../searchCapabilityService';
import * as searchProviderRegistry from '../search/searchProviderRegistry';
import type { RegisteredSearchProvider } from 'vssyl-shared/types/search';

describe('searchCapabilityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(searchPolicyDual, 'evaluateSearchPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('rejects queries shorter than 2 characters', async () => {
    await expect(
      executeGlobalSearch({ userId: 'u1', query: 'a' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('denies when search policy blocks', async () => {
    vi.spyOn(searchPolicyDual, 'evaluateSearchPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    await expect(
      executeGlobalSearch({
        userId: 'u1',
        query: 'hello',
        filters: { context: { businessId: 'b-other' } },
      })
    ).rejects.toBeInstanceOf(SearchAccessError);
  });

  it('orchestrates ready providers and merges results', async () => {
    const mockProvider: RegisteredSearchProvider = {
      providerId: 'mock',
      moduleId: 'mock',
      moduleName: 'Mock',
      displayName: 'Mock',
      entityTypes: ['item'],
      supportedContexts: ['personal'],
      requiredPermission: 'search:read',
      searchMethod: 'visibility_service',
      readiness: 'ready',
      manifestSearchClaim: false,
      search: vi.fn().mockResolvedValue([
        {
          id: '1',
          title: 'Alpha',
          moduleId: 'mock',
          moduleName: 'Mock',
          url: '/mock/1',
          type: 'item',
          metadata: {},
          permissions: [{ type: 'read', granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.5,
        },
      ]),
    };

    vi.spyOn(searchProviderRegistry, 'getReadySearchProviders').mockReturnValue([mockProvider]);

    const result = await executeGlobalSearch({ userId: 'u1', query: 'alpha' });

    expect(result.results).toHaveLength(1);
    expect(result.meta.providersInvoked).toEqual(['mock']);
    expect(result.meta.resultCount).toBe(1);
  });

  it('filters to a single provider when moduleId is set', async () => {
    const calendarProvider: RegisteredSearchProvider = {
      providerId: 'calendar',
      moduleId: 'calendar',
      moduleName: 'Calendar',
      displayName: 'Calendar',
      entityTypes: ['calendar_event'],
      supportedContexts: ['personal', 'business'],
      requiredPermission: 'calendar:event.read',
      searchMethod: 'visibility_service',
      readiness: 'ready',
      manifestSearchClaim: true,
      search: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(searchProviderRegistry, 'getSearchProviderById').mockReturnValue(calendarProvider);

    await executeGlobalSearch({
      userId: 'u1',
      query: 'meeting',
      filters: { moduleId: 'calendar' },
    });

    expect(calendarProvider.search).toHaveBeenCalledWith('meeting', 'u1', {
      moduleId: 'calendar',
    });
  });

  it('returns empty when moduleId provider is missing', async () => {
    vi.spyOn(searchProviderRegistry, 'getSearchProviderById').mockReturnValue(undefined);

    const result = await executeGlobalSearch({
      userId: 'u1',
      query: 'meeting',
      filters: { moduleId: 'unknown' },
    });

    expect(result.results).toEqual([]);
    expect(result.meta.providerCount).toBe(0);
  });

  it('passes tenant context to policy dual', async () => {
    const policySpy = vi.spyOn(searchPolicyDual, 'evaluateSearchPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(searchProviderRegistry, 'getReadySearchProviders').mockReturnValue([]);

    await executeGlobalSearch({
      userId: 'u1',
      query: 'report',
      filters: {
        context: { businessId: 'biz-1', dashboardId: 'dash-1' },
      },
    });

    expect(policySpy).toHaveBeenCalledWith({
      userId: 'u1',
      scope: { businessId: 'biz-1', dashboardId: 'dash-1' },
      metadata: { operation: 'global_search' },
    });
  });
});
