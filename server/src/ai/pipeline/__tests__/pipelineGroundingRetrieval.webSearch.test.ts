import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultCatalog } from '../defaultPipelineCatalog';

vi.mock('../../external/webSearchPipelineService', () => ({
  runWebSearchForPipeline: vi.fn(),
}));

vi.mock('../../external/googlePlacesPipelineService', async () => {
  const actual = await vi.importActual<
    typeof import('../../external/googlePlacesPipelineService')
  >('../../external/googlePlacesPipelineService');
  return {
    ...actual,
    runGooglePlacesSearchForPipeline: vi.fn(),
  };
});

vi.mock('../../../services/geolocationService', () => ({
  geolocationService: {
    getLocationFromIP: vi.fn().mockResolvedValue(null),
  },
}));

import { runWebSearchForPipeline } from '../../external/webSearchPipelineService';
import { runGooglePlacesSearchForPipeline } from '../../external/googlePlacesPipelineService';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';

describe('pipelineGroundingRetrieval — web_search', () => {
  beforeEach(() => {
    vi.mocked(runWebSearchForPipeline).mockReset();
    vi.mocked(runGooglePlacesSearchForPipeline).mockReset();
  });

  it('runs web search for live/current need and merges evidence', async () => {
    vi.mocked(runWebSearchForPipeline).mockResolvedValue({
      egressQuery: 'mortgage rates today',
      result: {
        capabilityId: 'web_search',
        providerId: 'tavily',
        success: true,
        retrievedAt: '2026-08-26T12:00:00.000Z',
        evidence: [
          {
            capabilityId: 'web_search',
            provider: 'tavily',
            sourceKind: 'web',
            title: 'Rates today',
            url: 'https://example.com/rates',
            detail: 'Average 6.4%',
            retrievedAt: '2026-08-26T12:00:00.000Z',
            rank: 1,
            domain: 'example.com',
          },
        ],
      },
    });

    const catalog = getDefaultCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'What are mortgage rates today?',
      catalog,
    });

    expect(runWebSearchForPipeline).toHaveBeenCalledTimes(1);
    expect(result.sourcesUsed).toContain('web_search');
    expect(result.toolsUsed.some((t) => t.name === 'web_search' && t.success)).toBe(true);
    expect(result.externalReadEvidence?.[0]?.url).toBe('https://example.com/rates');
    expect(result.webSearchUnavailable).toBeFalsy();
  });

  it('marks webSearchUnavailable and requiredSourceFailures on failure', async () => {
    vi.mocked(runWebSearchForPipeline).mockResolvedValue({
      result: {
        capabilityId: 'web_search',
        providerId: 'tavily',
        success: false,
        retrievedAt: '2026-08-26T12:00:00.000Z',
        failureCode: 'provider_error',
        evidence: [],
      },
    });

    const catalog = getDefaultCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: "What's happening with OpenAI today?",
      catalog,
    });

    expect(result.webSearchUnavailable).toBe(true);
    expect(result.requiredSourceFailures).toContain('web_search');
    expect(result.toolsUsed.some((t) => t.name === 'web_search' && !t.success)).toBe(true);
  });

  it('does not run web search for stable general questions', async () => {
    const catalog = getDefaultCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'What is EBITDA?',
      catalog,
    });
    expect(runWebSearchForPipeline).not.toHaveBeenCalled();
  });

  it('can combine Places and web evidence without overwrite', async () => {
    vi.mocked(runGooglePlacesSearchForPipeline).mockResolvedValue({
      egressQuery: 'Italian restaurants in Buffalo, NY',
      locationSource: 'explicit',
      result: {
        capabilityId: 'google_places_search',
        providerId: 'google_maps_platform',
        success: true,
        retrievedAt: '2026-08-26T12:00:00.000Z',
        evidence: [
          {
            capabilityId: 'google_places_search',
            provider: 'google_maps_platform',
            sourceKind: 'place',
            title: 'Tappo',
            address: 'Buffalo',
            retrievedAt: '2026-08-26T12:00:00.000Z',
          },
        ],
      },
    });
    vi.mocked(runWebSearchForPipeline).mockResolvedValue({
      egressQuery: 'Tappo restaurant reviews today',
      result: {
        capabilityId: 'web_search',
        providerId: 'tavily',
        success: true,
        retrievedAt: '2026-08-26T12:00:00.000Z',
        evidence: [
          {
            capabilityId: 'web_search',
            provider: 'tavily',
            sourceKind: 'web',
            title: 'Review',
            url: 'https://example.com/review',
            detail: 'Great pasta',
            retrievedAt: '2026-08-26T12:00:00.000Z',
            rank: 1,
            domain: 'example.com',
          },
        ],
      },
    });

    const catalog = getDefaultCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'Find Italian near me and what are people saying today?',
      catalog,
      clientIp: '1.2.3.4',
    });

    const kinds = (result.externalReadEvidence ?? []).map((e) => e.sourceKind);
    expect(kinds).toContain('place');
    expect(kinds).toContain('web');
  });
});
