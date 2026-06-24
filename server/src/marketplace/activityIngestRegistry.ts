import { createHash } from 'crypto';
import type { PartnerActivityIngestRegistration } from 'shared/types/activity-ingest';
import { logger } from '../lib/logger.js';
import {
  isModuleAllowedForActivityIngest,
  isPartnerActivityIngestEnabled,
  ACTIVITY_INGEST_IDEMPOTENCY_TTL_MS,
} from './activityIngestConfig.js';
import {
  isValidMarketplaceModuleIdForActivity,
  parseActivityIngestFromManifest,
} from './activityIngestManifest.js';

const registrationIndex = new Map<string, PartnerActivityIngestRegistration>();

export function clearPartnerActivityIngestRegistry(): void {
  registrationIndex.clear();
}

export function registerPartnerActivityIngest(
  registration: PartnerActivityIngestRegistration
): void {
  if (!isValidMarketplaceModuleIdForActivity(registration.moduleId)) {
    throw new Error(`Invalid moduleId for activity ingest: ${registration.moduleId}`);
  }
  registrationIndex.set(registration.moduleId, registration);
}

export function unregisterPartnerActivityIngest(moduleId: string): void {
  registrationIndex.delete(moduleId);
}

export function getPartnerActivityIngest(
  moduleId: string
): PartnerActivityIngestRegistration | undefined {
  return registrationIndex.get(moduleId);
}

export function listPartnerActivityIngests(): PartnerActivityIngestRegistration[] {
  return [...registrationIndex.values()];
}

export function getEnabledPartnerActivityIngests(): PartnerActivityIngestRegistration[] {
  if (!isPartnerActivityIngestEnabled()) {
    return [];
  }
  return listPartnerActivityIngests().filter((r) =>
    isModuleAllowedForActivityIngest(r.moduleId)
  );
}

export function isPartnerActivityIngestModuleEnabled(moduleId: string): boolean {
  return getEnabledPartnerActivityIngests().some((r) => r.moduleId === moduleId);
}

export interface LoadActivityIngestFromPublishedVersionParams {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifestSnapshot: Record<string, unknown>;
  moduleVersionId: string;
  semver: string;
  sandboxCertified?: boolean;
}

export function loadActivityIngestFromPublishedVersion(
  params: LoadActivityIngestFromPublishedVersionParams
): { loaded: boolean; errors: string[] } {
  const { moduleId, moduleStatus } = params;

  if (moduleStatus !== 'APPROVED') {
    unregisterPartnerActivityIngest(moduleId);
    return { loaded: false, errors: ['module_not_approved'] };
  }

  const { ingest, errors } = parseActivityIngestFromManifest(params.manifestSnapshot);
  if (!ingest) {
    unregisterPartnerActivityIngest(moduleId);
    if (errors.length === 0) {
      return { loaded: false, errors: [] };
    }
    return { loaded: false, errors };
  }

  if (!isModuleAllowedForActivityIngest(moduleId)) {
    unregisterPartnerActivityIngest(moduleId);
    return { loaded: false, errors: ['module_not_allowlisted'] };
  }

  registerPartnerActivityIngest({
    moduleId,
    moduleName: params.moduleName,
    moduleVersionId: params.moduleVersionId,
    semver: params.semver,
    contractVersion: ingest.contractVersion,
    supportedContexts: ingest.supportedContexts,
    entityTypes: ingest.entityTypes,
    actionTypes: ingest.actionTypes,
    maxMetadataBytes: ingest.maxMetadataBytes ?? 4096,
    idempotencyRequired: ingest.idempotencyRequired !== false,
    registeredAt: new Date().toISOString(),
    sandboxCertified: params.sandboxCertified,
  });

  void logger.info('Partner activity ingest registered', {
    operation: 'partner_activity_ingest_register',
    moduleId,
    entityTypes: ingest.entityTypes,
    actionTypes: ingest.actionTypes,
  });

  return { loaded: true, errors: [] };
}

export function syncPartnerActivityIngestForModule(params: {
  moduleId: string;
  moduleName: string;
  moduleStatus: string;
  manifest: Record<string, unknown>;
  publishedVersion?: {
    id: string;
    version: string;
    manifestSnapshot: Record<string, unknown>;
    scanPassed: boolean;
    certificationAllowsActivity: boolean;
  } | null;
}): void {
  if (!params.publishedVersion) {
    unregisterPartnerActivityIngest(params.moduleId);
    return;
  }

  if (!params.publishedVersion.scanPassed) {
    unregisterPartnerActivityIngest(params.moduleId);
    return;
  }

  if (!params.publishedVersion.certificationAllowsActivity) {
    unregisterPartnerActivityIngest(params.moduleId);
    return;
  }

  const manifest =
    params.publishedVersion.manifestSnapshot &&
    typeof params.publishedVersion.manifestSnapshot === 'object'
      ? params.publishedVersion.manifestSnapshot
      : params.manifest;

  loadActivityIngestFromPublishedVersion({
    moduleId: params.moduleId,
    moduleName: params.moduleName,
    moduleStatus: params.moduleStatus,
    manifestSnapshot: manifest,
    moduleVersionId: params.publishedVersion.id,
    semver: params.publishedVersion.version,
    sandboxCertified: true,
  });
}

/** In-memory idempotency store (pilot). */
const idempotencyIndex = new Map<
  string,
  { eventId: string; payloadHash: string; expiresAt: number }
>();

function idempotencyKey(moduleId: string, tenantKey: string, idempotencyKey: string): string {
  return `${moduleId}:${tenantKey}:${idempotencyKey}`;
}

function pruneIdempotency(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyIndex) {
    if (entry.expiresAt <= now) {
      idempotencyIndex.delete(key);
    }
  }
}

export function hashIngestPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function checkActivityIngestIdempotency(params: {
  moduleId: string;
  tenantKey: string;
  idempotencyKey: string;
  payloadHash: string;
}): { duplicate: boolean; eventId?: string; conflict?: boolean } {
  pruneIdempotency();
  const key = idempotencyKey(params.moduleId, params.tenantKey, params.idempotencyKey);
  const existing = idempotencyIndex.get(key);
  if (!existing) {
    return { duplicate: false };
  }
  if (existing.payloadHash !== params.payloadHash) {
    return { duplicate: false, conflict: true };
  }
  return { duplicate: true, eventId: existing.eventId };
}

export function storeActivityIngestIdempotency(params: {
  moduleId: string;
  tenantKey: string;
  idempotencyKey: string;
  payloadHash: string;
  eventId: string;
}): void {
  const key = idempotencyKey(params.moduleId, params.tenantKey, params.idempotencyKey);
  idempotencyIndex.set(key, {
    eventId: params.eventId,
    payloadHash: params.payloadHash,
    expiresAt: Date.now() + ACTIVITY_INGEST_IDEMPOTENCY_TTL_MS,
  });
}

export function resetActivityIngestIdempotencyStore(): void {
  idempotencyIndex.clear();
}

/** Simple per-minute rate limit (pilot). */
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

export function checkActivityIngestRateLimit(
  moduleId: string,
  tenantKey: string,
  limitPerMinute = 60
): boolean {
  const now = Date.now();
  const key = `${moduleId}:${tenantKey}`;
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= 60_000) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= limitPerMinute) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function resetActivityIngestRateLimits(): void {
  rateLimitBuckets.clear();
}
