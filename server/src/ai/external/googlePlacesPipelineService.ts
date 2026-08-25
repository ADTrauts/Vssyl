/**
 * Pipeline-facing Google Places external READ orchestration.
 */

import type { LocationData } from '../../services/geolocationService';
import { logger } from '../../lib/logger';
import { buildGooglePlacesEgressQuery } from './buildGooglePlacesEgressQuery';
import { assertBusinessExternalReadAllowed } from './externalReadGovernance';
import { executeExternalRead } from './googlePlacesAdapter';
import type { ExternalEvidenceItem, ExternalReadResult } from './externalReadTypes';

export interface RunGooglePlacesSearchInput {
  userId: string;
  userMessage: string;
  businessId?: string;
  coarseLocation?: LocationData | null;
}

export interface RunGooglePlacesSearchOutput {
  result: ExternalReadResult;
  egressQuery?: string;
  locationSource?: 'explicit' | 'coarse';
}

export async function runGooglePlacesSearchForPipeline(
  input: RunGooglePlacesSearchInput
): Promise<RunGooglePlacesSearchOutput> {
  const gate = await assertBusinessExternalReadAllowed({
    userId: input.userId,
    businessId: input.businessId,
  });

  if (!gate.allowed) {
    const message =
      gate.reason === 'business_external_api_denied'
        ? 'Business policy disallows external API access'
        : 'External read not authorized';
    return {
      result: {
        capabilityId: 'google_places_search',
        providerId: 'google_maps_platform',
        success: false,
        retrievedAt: new Date().toISOString(),
        failureCode: gate.reason === 'business_external_api_denied' ? 'policy_denied' : 'unauthorized',
        failureMessage: message,
        evidence: [],
      },
    };
  }

  const egressOutcome = buildGooglePlacesEgressQuery(input.userMessage, input.coarseLocation ?? null);
  if ('needsClarification' in egressOutcome) {
    return {
      result: {
        capabilityId: 'google_places_search',
        providerId: 'google_maps_platform',
        success: false,
        retrievedAt: new Date().toISOString(),
        failureCode: 'location_required',
        failureMessage: 'Location could not be resolved for place search',
        evidence: [],
      },
    };
  }

  void logger.debug('Google Places egress query constructed', {
    operation: 'google_places_egress',
    locationSource: egressOutcome.locationSource,
    queryLength: egressOutcome.egressQuery.length,
  });

  const result = await executeExternalRead({
    capabilityId: 'google_places_search',
    providerId: 'google_maps_platform',
    egressQuery: egressOutcome.egressQuery,
    locationHint: input.coarseLocation
      ? {
          city: input.coarseLocation.city,
          region: input.coarseLocation.region,
          countryCode: input.coarseLocation.countryCode,
        }
      : undefined,
  });

  return {
    result,
    egressQuery: egressOutcome.egressQuery,
    locationSource: egressOutcome.locationSource,
  };
}

export async function runGooglePlacesDetailsForTool(input: {
  userId: string;
  businessId?: string | null;
  placeId: string;
}): Promise<ExternalReadResult> {
  const gate = await assertBusinessExternalReadAllowed({
    userId: input.userId,
    businessId: input.businessId ?? undefined,
  });

  if (!gate.allowed) {
    return {
      capabilityId: 'google_place_details',
      providerId: 'google_maps_platform',
      success: false,
      retrievedAt: new Date().toISOString(),
      failureCode: gate.reason === 'business_external_api_denied' ? 'policy_denied' : 'unauthorized',
      failureMessage: 'External read not authorized for this workspace',
      evidence: [],
    };
  }

  return executeExternalRead({
    capabilityId: 'google_place_details',
    providerId: 'google_maps_platform',
    egressQuery: input.placeId,
    placeResourceName: input.placeId,
  });
}

export function mergeExternalEvidence(
  existing: ExternalEvidenceItem[] | undefined,
  incoming: ExternalEvidenceItem[]
): ExternalEvidenceItem[] {
  return [...(existing ?? []), ...incoming];
}
