import type { PartnerActivityIngestRegistration } from 'vssyl-shared/types/activity-ingest';
import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'vssyl-shared/types/activity-ingest';
import { parseActivityIngestFromManifest } from './activityIngestManifest.js';
import { ingestPartnerActivity } from './partnerActivityIngestService.js';
import {
  issueActivityIngestJwt,
  resetActivityIngestJtiCache,
  verifyActivityIngestJwt,
} from './activityIngestJwt.js';

export interface ActivityIngestProbeResult {
  ok: boolean;
  moduleId: string;
  hasActivityCapability: boolean;
  hasActivityIngest: boolean;
  registered: boolean;
  validationErrors: string[];
  probeOutcome?: string;
  eventId?: string;
  duplicate?: boolean;
  durationMs?: number;
  errorMessage?: string;
}

export async function probeActivityIngest(params: {
  moduleId: string;
  manifest: Record<string, unknown>;
  registration?: PartnerActivityIngestRegistration;
  probeUserId: string;
  probeBusinessId?: string;
  executeLiveProbe?: boolean;
}): Promise<ActivityIngestProbeResult> {
  const { ingest, errors } = parseActivityIngestFromManifest(params.manifest);
  const caps = params.manifest.capabilities;
  const hasActivityCapability =
    Boolean(
      caps && typeof caps === 'object' && !Array.isArray(caps)
        ? (caps as Record<string, unknown>).activity === true
        : false
    ) ||
    (Array.isArray(params.manifest.capabilities) &&
      params.manifest.capabilities.some((c) => c === 'activity'));

  const base: ActivityIngestProbeResult = {
    ok: false,
    moduleId: params.moduleId,
    hasActivityCapability,
    hasActivityIngest: Boolean(ingest),
    registered: Boolean(params.registration),
    validationErrors: errors,
  };

  if (!hasActivityCapability) {
    return { ...base, ok: true };
  }

  if (!ingest || errors.length > 0) {
    return base;
  }

  if (!params.executeLiveProbe || !params.registration) {
    return { ...base, ok: true };
  }

  const businessId = params.probeBusinessId ?? 'sandbox-business-a';
  resetActivityIngestJtiCache();

  const issued = issueActivityIngestJwt({
    userId: params.probeUserId,
    moduleId: params.moduleId,
    moduleVersionId: params.registration.moduleVersionId,
    scope: 'business',
    businessId,
  });

  const verified = verifyActivityIngestJwt(issued.token);

  const sampleBody = {
    contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
    idempotencyKey: `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: new Date().toISOString(),
    action: params.registration.actionTypes[0] ?? 'create',
    actor: { userRef: params.probeUserId },
    target: {
      type: params.registration.entityTypes[0] ?? 'asset',
      id: 'probe-asset-1',
    },
    context: {
      scope: 'business',
      businessId,
    },
    metadata: { probe: true },
  };

  const { response, diagnostics } = await ingestPartnerActivity({
    urlModuleId: params.moduleId,
    claims: verified,
    registration: params.registration,
    body: sampleBody,
    probeMode: true,
  });

  return {
    ...base,
    ok: response.success,
    probeOutcome: diagnostics.outcome,
    eventId: response.success ? response.eventId : undefined,
    duplicate: response.success ? response.duplicate : undefined,
    durationMs: diagnostics.durationMs,
    errorMessage: response.success ? undefined : response.error.message,
  };
}
