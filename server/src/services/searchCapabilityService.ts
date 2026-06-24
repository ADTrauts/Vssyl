import { logger } from '../lib/logger';
import { evaluateSearchPolicyDual } from '../auth/searchPolicyDual';
import type {
  GlobalSearchResponseMeta,
  SearchFilters,
  SearchResult,
} from 'shared/types/search';
import {
  getReadySearchProviders,
  getSearchProviderById,
} from './search/searchProviderRegistry';

export class SearchAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 = 403
  ) {
    super(message);
    this.name = 'SearchAccessError';
  }
}

export interface GlobalSearchInput {
  userId: string;
  query: string;
  filters?: SearchFilters;
}

export interface GlobalSearchResult {
  results: SearchResult[];
  meta: GlobalSearchResponseMeta;
}

const MIN_QUERY_LENGTH = 2;

export async function executeGlobalSearch(input: GlobalSearchInput): Promise<GlobalSearchResult> {
  const trimmedQuery = input.query?.trim() ?? '';

  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    throw new SearchAccessError('Query must be at least 2 characters', 400);
  }

  const scope = input.filters?.context;

  const policy = await evaluateSearchPolicyDual({
    userId: input.userId,
    scope,
    metadata: { operation: 'global_search' },
  });

  if (policy.blocked) {
    throw new SearchAccessError('Access denied', 403);
  }

  const providers = resolveProvidersForFilters(input.filters);
  const results: SearchResult[] = [];
  const providersInvoked: string[] = [];

  for (const provider of providers) {
    providersInvoked.push(provider.providerId);
    try {
      const providerResults = await provider.search(trimmedQuery, input.userId, input.filters);
      results.push(...providerResults);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Search provider failed', {
        operation: 'search_provider_error',
        providerId: provider.providerId,
        userId: input.userId,
        error: { message: err.message, stack: err.stack },
      });
    }
  }

  results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return {
    results,
    meta: {
      query: trimmedQuery,
      providerCount: providers.length,
      resultCount: results.length,
      providersInvoked,
    },
  };
}

function resolveProvidersForFilters(filters?: SearchFilters) {
  if (filters?.moduleId) {
    const provider = getSearchProviderById(filters.moduleId);
    if (!provider || provider.readiness !== 'ready') {
      return [];
    }
    return [provider];
  }

  return getReadySearchProviders();
}

export async function getSearchSuggestionsForUser(
  userId: string,
  query: string
): Promise<Array<Record<string, unknown>>> {
  const policy = await evaluateSearchPolicyDual({
    userId,
    metadata: { operation: 'search_suggestions' },
  });

  if (policy.blocked) {
    throw new SearchAccessError('Access denied', 403);
  }

  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  return [
    { text: trimmed, type: 'query' },
    { text: `${trimmed} in drive`, type: 'query', moduleId: 'drive' },
    { text: `${trimmed} in chat`, type: 'query', moduleId: 'chat' },
    { text: `${trimmed} in calendar`, type: 'query', moduleId: 'calendar' },
    { text: `${trimmed} in todo`, type: 'query', moduleId: 'todo' },
    { text: `${trimmed} in notes`, type: 'query', moduleId: 'notes' },
  ];
}
