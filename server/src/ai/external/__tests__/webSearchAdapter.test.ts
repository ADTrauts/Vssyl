import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executeWebSearch,
  resetTavilyClientForTests,
  setTavilyApiKeyForTests,
  setTavilySearchForTests,
} from '../webSearchAdapter';
import { WEB_SEARCH_DEPTH, WEB_SEARCH_DEFAULT_MAX_RESULTS } from '../webSearchConstants';

describe('webSearchAdapter', () => {
  beforeEach(() => {
    resetTavilyClientForTests();
    setTavilyApiKeyForTests('test-key');
  });

  it('normalizes search results with depth basic and bounded count', async () => {
    const search = vi.fn(async ({ query, maxResults }) => {
      expect(query).toBe('average mortgage rates United States');
      expect(maxResults).toBe(WEB_SEARCH_DEFAULT_MAX_RESULTS);
      return {
        status: 200,
        body: {
          results: [
            {
              title: 'Mortgage rates update',
              url: 'https://example.com/rates',
              content: 'Average 30-year fixed rate is 6.42% this week.',
              score: 0.9,
              published_date: '2026-08-25',
            },
            {
              title: 'Missing url ignored',
              content: 'no url',
            },
          ],
          usage: { credits: 1 },
        },
      };
    });
    setTavilySearchForTests(search);

    const result = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'average mortgage rates United States',
    });

    expect(result.success).toBe(true);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.title).toBe('Mortgage rates update');
    expect(result.evidence[0]?.url).toBe('https://example.com/rates');
    expect(result.evidence[0]?.detail).toContain('6.42%');
    expect(result.evidence[0]?.domain).toBe('example.com');
    expect(result.evidence[0]?.rank).toBe(1);
    expect(result.evidence[0]?.publishedAt).toBe('2026-08-25');
    expect(result.evidence[0]?.retrievedAt).toBeTruthy();
    expect(result.evidence[0]?.sourceKind).toBe('web');
    expect(result.usage?.billedUnits).toBe(1);
    expect(JSON.stringify(result)).not.toContain('raw_content');
    expect(WEB_SEARCH_DEPTH).toBe('basic');
  });

  it('returns configuration_missing when API key absent', async () => {
    setTavilyApiKeyForTests(null);
    const search = vi.fn();
    setTavilySearchForTests(search);

    const result = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'OpenAI news today',
    });

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('configuration_missing');
    expect(search).not.toHaveBeenCalled();
  });

  it('maps auth failure', async () => {
    setTavilySearchForTests(async () => ({ status: 401, body: null, errorText: 'unauthorized' }));
    const result = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'news',
    });
    expect(result.failureCode).toBe('unauthorized');
  });

  it('maps rate limit', async () => {
    setTavilySearchForTests(async () => ({ status: 429, body: null }));
    const result = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'news',
    });
    expect(result.failureCode).toBe('rate_limited');
  });

  it('maps timeout', async () => {
    setTavilySearchForTests(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    });
    const result = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'news',
    });
    expect(result.failureCode).toBe('timeout');
  });

  it('maps provider error and no results', async () => {
    setTavilySearchForTests(async () => ({ status: 500, body: null }));
    const provider = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'news',
    });
    expect(provider.failureCode).toBe('provider_error');

    setTavilySearchForTests(async () => ({ status: 200, body: { results: [] } }));
    const empty = await executeWebSearch({
      capabilityId: 'web_search',
      providerId: 'tavily',
      egressQuery: 'news',
    });
    expect(empty.failureCode).toBe('no_results');
  });
});
