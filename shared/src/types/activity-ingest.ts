import type { SearchTenantContext } from './search';

/** Locked contract version for partner activity ingest. */
export const ACTIVITY_INGEST_CONTRACT_VERSION = '1' as const;

export const ACTIVITY_INGEST_JWT_AUDIENCE = 'vssyl:activity-ingest:v1' as const;

export const ACTIVITY_INGEST_JWT_ISSUER = 'vssyl-platform' as const;

/** Manifest `activityIngest` block. */
export interface ActivityIngestManifestCapability {
  contractVersion: typeof ACTIVITY_INGEST_CONTRACT_VERSION;
  supportedContexts: SearchTenantContext[];
  entityTypes: string[];
  actionTypes: string[];
  maxMetadataBytes?: number;
  idempotencyRequired?: boolean;
}

export type ActivityIngestTenantScope = 'personal' | 'business' | 'household';

export type ActivityIngestVisibilityScope =
  | 'personal'
  | 'business'
  | 'household'
  | 'direct-share';

export type ActivityIngestSeverity = 'info' | 'notice' | 'important';

/** Partner → platform POST body. */
export interface PartnerActivityIngestRequest {
  contractVersion: typeof ACTIVITY_INGEST_CONTRACT_VERSION;
  idempotencyKey: string;
  occurredAt: string;
  action: string;
  actor: {
    userRef: string;
  };
  target: {
    type: string;
    id: string;
  };
  parent?: {
    type: string;
    id: string;
  };
  context: {
    scope: ActivityIngestTenantScope;
    businessId?: string;
    dashboardId?: string;
    householdId?: string;
  };
  visibility?: {
    scope: ActivityIngestVisibilityScope;
  };
  severity?: ActivityIngestSeverity;
  metadata?: Record<string, unknown>;
}

export interface PartnerActivityIngestSuccessResponse {
  success: true;
  contractVersion: typeof ACTIVITY_INGEST_CONTRACT_VERSION;
  eventId: string;
  accepted: true;
  duplicate?: boolean;
}

export type ActivityIngestErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ACTION'
  | 'UNKNOWN_ENTITY'
  | 'TENANT_MISMATCH'
  | 'RATE_LIMITED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INTERNAL_ERROR';

export interface PartnerActivityIngestErrorResponse {
  success: false;
  error: {
    code: ActivityIngestErrorCode;
    message: string;
  };
}

export type PartnerActivityIngestResponse =
  | PartnerActivityIngestSuccessResponse
  | PartnerActivityIngestErrorResponse;

/** Normalized payload passed to internal activity emitter. */
export interface NormalizedPartnerActivityPayload {
  eventId: string;
  actorUserId: string;
  moduleId: string;
  action: string;
  targetType: string;
  targetId: string;
  parentType?: string;
  parentId?: string;
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
  visibilityScope?: ActivityIngestVisibilityScope;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export interface ActivityIngestDiagnostics {
  outcome: 'success' | 'duplicate' | 'disabled' | 'validation_error' | 'error';
  durationMs: number;
  errorCode?: ActivityIngestErrorCode;
  errorMessage?: string;
}

export interface ActivityIngestIdempotencyResult {
  duplicate: boolean;
  eventId?: string;
  conflict?: boolean;
}

export interface ActivityIngestJwtClaims {
  sub: string;
  aud: typeof ACTIVITY_INGEST_JWT_AUDIENCE;
  iss: typeof ACTIVITY_INGEST_JWT_ISSUER;
  jti: string;
  moduleId: string;
  moduleVersionId: string;
  requestId: string;
  userRef: string;
  scope: ActivityIngestTenantScope;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  iat?: number;
  exp?: number;
}

export interface PartnerActivityIngestRegistration {
  moduleId: string;
  moduleName: string;
  moduleVersionId: string;
  semver: string;
  contractVersion: typeof ACTIVITY_INGEST_CONTRACT_VERSION;
  supportedContexts: SearchTenantContext[];
  entityTypes: string[];
  actionTypes: string[];
  maxMetadataBytes: number;
  idempotencyRequired: boolean;
  registeredAt: string;
  sandboxCertified?: boolean;
}

export interface ActivityIngestTokenResponse {
  token: string;
  expiresAt: string;
  ttlSeconds: number;
  requestId: string;
  jti: string;
}
