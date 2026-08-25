import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultCatalog } from '../defaultPipelineCatalog';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';
import {
  resetGooglePlacesClientForTests,
  setGooglePlacesClientForTests,
} from '../../external/googlePlacesAdapter';

const runGooglePlacesSearchForPipeline = vi.fn();

vi.mock('../../external/googlePlacesPipelineService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../external/googlePlacesPipelineService')>();
  return {
    ...actual,
    runGooglePlacesSearchForPipeline: (...args: unknown[]) => runGooglePlacesSearchForPipeline(...args),
  };
});

vi.mock('../../../services/geolocationService', () => ({
  geolocationService: {
    detectUserLocation: vi.fn(async () => ({
      success: true,
      data: {
        country: 'United States',
        region: 'New York',
        city: 'Buffalo',
        countryCode: 'US',
        regionCode: 'NY',
      },
    })),
  },
}));

describe('runPipelineGroundingRetrieval — Google Places', () => {
  beforeEach(() => {
    runGooglePlacesSearchForPipeline.mockReset();
    resetGooglePlacesClientForTests();
    setGooglePlacesClientForTests({
      searchText: vi.fn(),
      getPlace: vi.fn(),
    });
  });

  it('runs Google Places on local_discovery and attaches external evidence', async () => {
    runGooglePlacesSearchForPipeline.mockResolvedValue({
      egressQuery: 'Italian restaurants in Buffalo, New York',
      locationSource: 'coarse',
      result: {
        capabilityId: 'google_places_search',
        providerId: 'google_maps_platform',
        success: true,
        retrievedAt: new Date().toISOString(),
        evidence: [
          {
            capabilityId: 'google_places_search',
            provider: 'google_maps_platform',
            sourceKind: 'place',
            title: 'Trattoria Example',
            address: '1 Main St',
            externalId: 'places/ChIJ123',
            retrievedAt: new Date().toISOString(),
          },
        ],
        usage: { latencyMs: 10, resultCount: 1 },
      },
    });

    const catalog = getDefaultCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Find me a good Italian restaurant near me.',
      catalog,
      clientIp: '8.8.8.8',
    });

    expect(runGooglePlacesSearchForPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: 'Find me a good Italian restaurant near me.',
      })
    );
    expect(result.externalReadEvidence).toHaveLength(1);
    expect(result.sourcesUsed).toContain('google_places');
    expect(result.toolsUsed.some((t) => t.name === 'google_places_search' && t.success)).toBe(true);
  });

  it('marks googlePlacesUnavailable when external search fails', async () => {
    runGooglePlacesSearchForPipeline.mockResolvedValue({
      result: {
        capabilityId: 'google_places_search',
        providerId: 'google_maps_platform',
        success: false,
        retrievedAt: new Date().toISOString(),
        failureCode: 'provider_error',
        failureMessage: 'API unavailable',
        evidence: [],
      },
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Find coffee near me.',
      catalog: getDefaultCatalog(),
      clientIp: '8.8.8.8',
    });

    expect(result.googlePlacesUnavailable).toBe(true);
    expect(result.externalReadEvidence ?? []).toHaveLength(0);
  });
});
