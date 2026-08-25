/**
 * Thin external READ contract — see docs/architecture/AI_EXTERNAL_CAPABILITY_MODEL.md
 */

export type ExternalReadCapabilityId =
  | 'google_places_search'
  | 'google_place_details';

export type ExternalReadProviderId = 'google_maps_platform';

export type ExternalEvidenceSourceKind = 'place' | 'web' | 'route' | 'geocode' | 'other';

export type ExternalReadFailureCode =
  | 'disabled'
  | 'policy_denied'
  | 'unauthorized'
  | 'rate_limited'
  | 'provider_error'
  | 'timeout'
  | 'no_results'
  | 'location_required'
  | 'invalid_request';

export interface ExternalReadLocationHint {
  city?: string;
  region?: string;
  countryCode?: string;
}

export interface ExternalReadRequest {
  capabilityId: ExternalReadCapabilityId;
  providerId: ExternalReadProviderId;
  /** Intentionally constructed provider query — never full Twin prompt. */
  egressQuery: string;
  locationHint?: ExternalReadLocationHint;
  maxResults?: number;
  /** Place Details only — Google place resource name e.g. places/ChIJ... */
  placeResourceName?: string;
}

export interface ExternalEvidenceItem {
  capabilityId: ExternalReadCapabilityId;
  provider: ExternalReadProviderId;
  sourceKind: ExternalEvidenceSourceKind;
  title: string;
  detail?: string;
  externalId?: string;
  url?: string;
  address?: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  retrievedAt: string;
}

export interface ExternalReadUsage {
  latencyMs: number;
  resultCount: number;
}

export interface ExternalReadResult {
  capabilityId: ExternalReadCapabilityId;
  providerId: ExternalReadProviderId;
  success: boolean;
  retrievedAt: string;
  failureCode?: ExternalReadFailureCode;
  failureMessage?: string;
  evidence: ExternalEvidenceItem[];
  usage?: ExternalReadUsage;
}
