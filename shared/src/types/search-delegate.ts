import type { SearchContextScope, SearchTenantContext } from './search';

export type { SearchTenantContext };

/** Locked contract version for partner HTTP search delegates. */
export const SEARCH_DELEGATE_CONTRACT_VERSION = '1' as const;

export const SEARCH_DELEGATE_JWT_AUDIENCE = 'vssyl:search-delegate:v1' as const;

export const SEARCH_DELEGATE_JWT_ISSUER = 'vssyl-platform' as const;

/** Internal sandbox URL — resolved in-process, no outbound HTTP. */
export const VSSYL_INTERNAL_SEARCH_DELEGATE_PREFIX = 'vssyl-internal://' as const;

export const SANDBOX_PILOT_ASSETS_MODULE_ID = 'vssyl-pilot-assets' as const;

export const SANDBOX_PILOT_INTERNAL_DELEGATE_URL =
  `${VSSYL_INTERNAL_SEARCH_DELEGATE_PREFIX}sandbox/${SANDBOX_PILOT_ASSETS_MODULE_ID}/search` as const;

/** Manifest `searchDelegate` block (ModuleVersion.manifestSnapshot). */
export interface SearchDelegateManifestCapability {
  contractVersion: typeof SEARCH_DELEGATE_CONTRACT_VERSION;
  url: string;
  entityTypes: string[];
  supportedContexts: SearchTenantContext[];
  timeoutMs?: number;
  maxResults?: number;
}

/** Platform → partner POST body. */
export interface PartnerSearchDelegateRequest {
  contractVersion: typeof SEARCH_DELEGATE_CONTRACT_VERSION;
  query: string;
  userId: string;
  context: SearchContextScope;
  moduleId: string;
  filters?: {
    type?: string;
    dateRange?: { start: string; end: string };
    pinned?: boolean;
  };
  limit: number;
  requestId: string;
}

/** Partner result row before platform normalization. */
export interface PartnerSearchResultItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  relevanceScore?: number;
  lastModified?: string;
  metadata?: Record<string, unknown>;
  permissions: Array<{
    type: 'read' | 'write' | 'admin';
    granted: boolean;
  }>;
}

export interface PartnerSearchDelegateSuccessResponse {
  success: true;
  contractVersion: typeof SEARCH_DELEGATE_CONTRACT_VERSION;
  results: PartnerSearchResultItem[];
  meta?: {
    durationMs?: number;
    totalMatches?: number;
    truncated?: boolean;
  };
}

export interface PartnerSearchDelegateErrorResponse {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_REQUEST' | 'INTERNAL_ERROR';
    message: string;
  };
}

export type PartnerSearchDelegateResponse =
  | PartnerSearchDelegateSuccessResponse
  | PartnerSearchDelegateErrorResponse;

export interface SearchDelegateJwtClaims {
  sub: string;
  aud: typeof SEARCH_DELEGATE_JWT_AUDIENCE;
  iss: typeof SEARCH_DELEGATE_JWT_ISSUER;
  moduleId: string;
  moduleVersionId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  requestId: string;
  /** SHA-256 hex of userId for audit without repeating sub in logs */
  userRef: string;
}

export interface PartnerSearchDelegateRegistration {
  moduleId: string;
  moduleName: string;
  moduleVersionId: string;
  semver: string;
  delegateUrl: string;
  contractVersion: typeof SEARCH_DELEGATE_CONTRACT_VERSION;
  entityTypes: string[];
  supportedContexts: SearchTenantContext[];
  timeoutMs: number;
  maxResults: number;
  registeredAt: string;
  sandboxCertified: boolean;
}

export interface SearchDelegateProxyDiagnostics {
  moduleId: string;
  requestId: string;
  delegateUrl: string;
  durationMs: number;
  httpStatus?: number;
  resultCount: number;
  droppedCount: number;
  outcome: 'success' | 'timeout' | 'http_error' | 'schema_error' | 'circuit_open' | 'disabled';
  errorMessage?: string;
}
