/**
 * Google Maps Platform Places API (New) adapter — server-side READ only.
 * Auth: Application Default Credentials (Cloud Run service identity / local ADC).
 */

import { PlacesClient } from '@googlemaps/places';
import type { google } from '@googlemaps/places/build/protos/protos';
import { logger } from '../../lib/logger';
import type {
  ExternalEvidenceItem,
  ExternalReadFailureCode,
  ExternalReadRequest,
  ExternalReadResult,
} from './externalReadTypes';
import {
  GOOGLE_PLACES_DEFAULT_MAX_RESULTS,
  GOOGLE_PLACES_DETAILS_FIELD_MASK,
  GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
} from './googlePlacesFieldMasks';

export type GooglePlacesClientLike = Pick<PlacesClient, 'searchText' | 'getPlace'>;

let clientInstance: GooglePlacesClientLike | null = null;
let testClientOverride: GooglePlacesClientLike | null = null;

export function setGooglePlacesClientForTests(client: GooglePlacesClientLike | null): void {
  testClientOverride = client;
}

export function resetGooglePlacesClientForTests(): void {
  testClientOverride = null;
  clientInstance = null;
}

function getClient(): GooglePlacesClientLike {
  if (testClientOverride) return testClientOverride;
  if (!clientInstance) {
    clientInstance = new PlacesClient();
  }
  return clientInstance;
}

function displayNameText(
  displayName: google.maps.places.v1.IPlace['displayName'] | null | undefined
): string | undefined {
  if (!displayName) return undefined;
  if (typeof displayName.text === 'string' && displayName.text.trim()) {
    return displayName.text.trim();
  }
  return undefined;
}

function placeResourceName(placeId: string): string {
  return placeId.startsWith('places/') ? placeId : `places/${placeId}`;
}

function normalizePlaceToEvidence(
  place: google.maps.places.v1.IPlace,
  capabilityId: ExternalReadRequest['capabilityId'],
  retrievedAt: string
): ExternalEvidenceItem | null {
  const title = displayNameText(place.displayName);
  if (!title) return null;

  const externalId = place.id ?? place.name ?? undefined;
  const parts: string[] = [];
  if (place.primaryType) parts.push(String(place.primaryType));
  if (typeof place.rating === 'number') parts.push(`rating ${place.rating}`);
  if (typeof place.userRatingCount === 'number') parts.push(`${place.userRatingCount} reviews`);
  if (place.businessStatus) parts.push(String(place.businessStatus));

  return {
    capabilityId,
    provider: 'google_maps_platform',
    sourceKind: 'place',
    title,
    detail: parts.length > 0 ? parts.join(' · ') : undefined,
    externalId,
    url: typeof place.googleMapsUri === 'string' ? place.googleMapsUri : undefined,
    address: typeof place.formattedAddress === 'string' ? place.formattedAddress : undefined,
    primaryType: typeof place.primaryType === 'string' ? place.primaryType : undefined,
    rating: typeof place.rating === 'number' ? place.rating : undefined,
    userRatingCount:
      typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
    businessStatus:
      typeof place.businessStatus === 'string' ? place.businessStatus : undefined,
    retrievedAt,
  };
}

function classifyGoogleError(error: unknown): ExternalReadFailureCode {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = err.message.toLowerCase();
  if (msg.includes('permission') || msg.includes('403') || msg.includes('unauthenticated')) {
    return 'unauthorized';
  }
  if (msg.includes('quota') || msg.includes('429') || msg.includes('rate')) {
    return 'rate_limited';
  }
  if (msg.includes('timeout') || msg.includes('deadline')) {
    return 'timeout';
  }
  if (msg.includes('invalid') || msg.includes('400')) {
    return 'invalid_request';
  }
  return 'provider_error';
}

function failureResult(
  request: ExternalReadRequest,
  code: ExternalReadFailureCode,
  message: string,
  startedAt: number
): ExternalReadResult {
  return {
    capabilityId: request.capabilityId,
    providerId: request.providerId,
    success: false,
    retrievedAt: new Date().toISOString(),
    failureCode: code,
    failureMessage: message,
    evidence: [],
    usage: { latencyMs: Date.now() - startedAt, resultCount: 0 },
  };
}

export async function executeGooglePlacesTextSearch(
  request: ExternalReadRequest
): Promise<ExternalReadResult> {
  const startedAt = Date.now();
  const retrievedAt = new Date().toISOString();
  const egressQuery = request.egressQuery.trim();
  if (!egressQuery) {
    return failureResult(request, 'invalid_request', 'Empty egress query', startedAt);
  }

  const maxResults = Math.min(
    Math.max(request.maxResults ?? GOOGLE_PLACES_DEFAULT_MAX_RESULTS, 1),
    GOOGLE_PLACES_DEFAULT_MAX_RESULTS
  );

  try {
    const client = getClient();
    const [response] = await client.searchText(
      {
        textQuery: egressQuery,
        maxResultCount: maxResults,
      },
      {
        otherArgs: {
          headers: {
            'X-Goog-FieldMask': GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
          },
        },
      }
    );

    const places = response.places ?? [];
    const evidence: ExternalEvidenceItem[] = [];
    for (const place of places) {
      const item = normalizePlaceToEvidence(place, 'google_places_search', retrievedAt);
      if (item) evidence.push(item);
    }

    if (evidence.length === 0) {
      return failureResult(request, 'no_results', 'No places matched the search', startedAt);
    }

    return {
      capabilityId: request.capabilityId,
      providerId: request.providerId,
      success: true,
      retrievedAt,
      evidence,
      usage: { latencyMs: Date.now() - startedAt, resultCount: evidence.length },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const code = classifyGoogleError(error);
    void logger.warn('Google Places Text Search failed', {
      operation: 'google_places_text_search',
      failureCode: code,
      error: { message: err.message },
    });
    return failureResult(request, code, err.message, startedAt);
  }
}

export async function executeGooglePlacesDetails(
  request: ExternalReadRequest
): Promise<ExternalReadResult> {
  const startedAt = Date.now();
  const retrievedAt = new Date().toISOString();
  const resourceName = request.placeResourceName?.trim();
  if (!resourceName) {
    return failureResult(request, 'invalid_request', 'placeResourceName is required', startedAt);
  }

  try {
    const client = getClient();
    const [place] = await client.getPlace(
      { name: placeResourceName(resourceName) },
      {
        otherArgs: {
          headers: {
            'X-Goog-FieldMask': GOOGLE_PLACES_DETAILS_FIELD_MASK,
          },
        },
      }
    );

    const item = normalizePlaceToEvidence(place, 'google_place_details', retrievedAt);
    if (!item) {
      return failureResult(request, 'no_results', 'Place details returned no usable name', startedAt);
    }

    return {
      capabilityId: request.capabilityId,
      providerId: request.providerId,
      success: true,
      retrievedAt,
      evidence: [item],
      usage: { latencyMs: Date.now() - startedAt, resultCount: 1 },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const code = classifyGoogleError(error);
    void logger.warn('Google Places Details failed', {
      operation: 'google_places_details',
      failureCode: code,
      error: { message: err.message },
    });
    return failureResult(request, code, err.message, startedAt);
  }
}

export async function executeExternalRead(request: ExternalReadRequest): Promise<ExternalReadResult> {
  switch (request.capabilityId) {
    case 'google_places_search':
      return executeGooglePlacesTextSearch(request);
    case 'google_place_details':
      return executeGooglePlacesDetails(request);
    case 'web_search': {
      const { executeWebSearch } = await import('./webSearchAdapter.js');
      return executeWebSearch(request);
    }
    default:
      return {
        capabilityId: request.capabilityId,
        providerId: request.providerId,
        success: false,
        retrievedAt: new Date().toISOString(),
        failureCode: 'invalid_request',
        failureMessage: `Unsupported capability: ${request.capabilityId}`,
        evidence: [],
      };
  }
}
