import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  executeGooglePlacesDetails,
  executeGooglePlacesTextSearch,
  resetGooglePlacesClientForTests,
  setGooglePlacesClientForTests,
} from '../googlePlacesAdapter';
import {
  GOOGLE_PLACES_DETAILS_FIELD_MASK,
  GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
} from '../googlePlacesFieldMasks';

describe('googlePlacesAdapter', () => {
  beforeEach(() => {
    resetGooglePlacesClientForTests();
  });

  it('normalizes Text Search results with field mask (no wildcard)', async () => {
    const searchText = vi.fn(async (_req, options) => {
      expect(options?.otherArgs?.headers?.['X-Goog-FieldMask']).toBe(
        GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK
      );
      expect(GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK).not.toContain('*');
      return [
        {
          places: [
            {
              id: 'places/ChIJTest',
              displayName: { text: 'Test Italian' },
              formattedAddress: '123 Main St, Buffalo, NY',
              primaryType: 'italian_restaurant',
              rating: 4.5,
              userRatingCount: 120,
              googleMapsUri: 'https://maps.google.com/?cid=1',
              businessStatus: 'OPERATIONAL',
            },
          ],
        },
        undefined,
        {},
      ];
    });

    setGooglePlacesClientForTests({
      searchText: searchText as unknown as import('../googlePlacesAdapter').GooglePlacesClientLike['searchText'],
      getPlace: vi.fn(),
    });

    const result = await executeGooglePlacesTextSearch({
      capabilityId: 'google_places_search',
      providerId: 'google_maps_platform',
      egressQuery: 'Italian restaurants in Buffalo, NY',
    });

    expect(result.success).toBe(true);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.externalId).toBe('places/ChIJTest');
    expect(result.evidence[0]?.title).toBe('Test Italian');
    expect(result.evidence[0]?.url).toContain('maps.google.com');
    expect(result.evidence[0]?.retrievedAt).toBeTruthy();
    expect(searchText).toHaveBeenCalledWith(
      expect.objectContaining({ textQuery: 'Italian restaurants in Buffalo, NY' }),
      expect.any(Object)
    );
  });

  it('returns provider_error on client failure', async () => {
    setGooglePlacesClientForTests({
      searchText: vi.fn(async () => {
        throw new Error('permission denied');
      }) as unknown as import('../googlePlacesAdapter').GooglePlacesClientLike['searchText'],
      getPlace: vi.fn() as unknown as import('../googlePlacesAdapter').GooglePlacesClientLike['getPlace'],
    });

    const result = await executeGooglePlacesTextSearch({
      capabilityId: 'google_places_search',
      providerId: 'google_maps_platform',
      egressQuery: 'coffee in Buffalo, NY',
    });

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('unauthorized');
    expect(result.evidence).toHaveLength(0);
  });

  it('Place Details uses details field mask', async () => {
    const getPlace = vi.fn(async (_req, options) => {
      expect(options?.otherArgs?.headers?.['X-Goog-FieldMask']).toBe(
        GOOGLE_PLACES_DETAILS_FIELD_MASK
      );
      return [
        {
          id: 'places/ChIJDetail',
          displayName: { text: 'Detail Place' },
          formattedAddress: '456 Oak Ave',
        },
        undefined,
        {},
      ];
    });
    setGooglePlacesClientForTests({
      searchText: vi.fn() as unknown as import('../googlePlacesAdapter').GooglePlacesClientLike['searchText'],
      getPlace: getPlace as unknown as import('../googlePlacesAdapter').GooglePlacesClientLike['getPlace'],
    });

    const result = await executeGooglePlacesDetails({
      capabilityId: 'google_place_details',
      providerId: 'google_maps_platform',
      egressQuery: 'places/ChIJDetail',
      placeResourceName: 'places/ChIJDetail',
    });

    expect(result.success).toBe(true);
    expect(result.evidence[0]?.title).toBe('Detail Place');
  });
});
