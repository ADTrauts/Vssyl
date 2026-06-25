import type {
  ActivityIngestDiagnostics,
  ActivityIngestErrorCode,
  ActivityIngestJwtClaims,
  NormalizedPartnerActivityPayload,
  PartnerActivityIngestRequest,
  PartnerActivityIngestResponse,
  PartnerActivityIngestRegistration,
} from 'vssyl-shared/types/activity-ingest';
import { ACTIVITY_INGEST_CONTRACT_VERSION } from 'vssyl-shared/types/activity-ingest';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { emitModuleActivityEvent, type ActivityScope } from '../services/moduleActivityService.js';
import { evaluateBusinessModuleEntitlement } from '../services/businessModuleSubscriptionService.js';
import {
  ACTIVITY_INGEST_MAX_REQUEST_BYTES,
  ACTIVITY_INGEST_RATE_LIMIT_PER_MINUTE,
} from './activityIngestConfig.js';
import {
  actorRefMatchesUser,
  consumeActivityIngestJti,
} from './activityIngestJwt.js';
import {
  checkActivityIngestIdempotency,
  checkActivityIngestRateLimit,
  hashIngestPayload,
  storeActivityIngestIdempotency,
} from './activityIngestRegistry.js';

const UNSAFE_METADATA_KEYS = /password|secret|token|authorization|api[_-]?key|credential/i;

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
  maxBytes: number
): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (UNSAFE_METADATA_KEYS.test(key)) {
      continue;
    }
    if (typeof value === 'string' && value.length > 512) {
      cleaned[key] = value.slice(0, 512);
      continue;
    }
    cleaned[key] = value;
  }

  let serialized = JSON.stringify(cleaned);
  while (serialized.length > maxBytes && Object.keys(cleaned).length > 0) {
    const keys = Object.keys(cleaned);
    delete cleaned[keys[keys.length - 1]];
    serialized = JSON.stringify(cleaned);
  }

  return cleaned;
}

function errorResponse(
  code: ActivityIngestErrorCode,
  message: string
): PartnerActivityIngestResponse {
  return { success: false, error: { code, message } };
}

function tenantKeyFromClaims(claims: ActivityIngestJwtClaims): string {
  if (claims.businessId) return `business:${claims.businessId}`;
  if (claims.householdId) return `household:${claims.householdId}`;
  if (claims.dashboardId) return `dashboard:${claims.dashboardId}`;
  return `personal:${claims.sub}`;
}

export function validatePartnerActivityIngestRequest(
  body: unknown,
  registration: PartnerActivityIngestRegistration
): { ok: true; request: PartnerActivityIngestRequest } | { ok: false; code: ActivityIngestErrorCode; message: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'Request body must be an object' };
  }

  const raw = body as Record<string, unknown>;
  const serialized = JSON.stringify(raw);
  if (serialized.length > ACTIVITY_INGEST_MAX_REQUEST_BYTES) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'Request payload too large' };
  }

  if (raw.contractVersion !== ACTIVITY_INGEST_CONTRACT_VERSION) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'Invalid contractVersion' };
  }

  const idempotencyKey = typeof raw.idempotencyKey === 'string' ? raw.idempotencyKey.trim() : '';
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'idempotencyKey is required (max 128 chars)' };
  }

  const action = typeof raw.action === 'string' ? raw.action.trim() : '';
  if (!action || !registration.actionTypes.includes(action)) {
    return { ok: false, code: 'UNKNOWN_ACTION', message: `Unknown action: ${action || '(empty)'}` };
  }

  const actorRec =
    raw.actor && typeof raw.actor === 'object' && !Array.isArray(raw.actor)
      ? (raw.actor as Record<string, unknown>)
      : null;
  const userRef = typeof actorRec?.userRef === 'string' ? actorRec.userRef.trim() : '';
  if (!userRef) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'actor.userRef is required' };
  }

  const targetRec =
    raw.target && typeof raw.target === 'object' && !Array.isArray(raw.target)
      ? (raw.target as Record<string, unknown>)
      : null;
  const targetType = typeof targetRec?.type === 'string' ? targetRec.type.trim() : '';
  const targetId = typeof targetRec?.id === 'string' ? targetRec.id.trim() : '';
  if (!targetType || !targetId || targetId.length > 128) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'target.type and target.id are required' };
  }
  if (!registration.entityTypes.includes(targetType)) {
    return { ok: false, code: 'UNKNOWN_ENTITY', message: `Unknown entity type: ${targetType}` };
  }

  const contextRec =
    raw.context && typeof raw.context === 'object' && !Array.isArray(raw.context)
      ? (raw.context as Record<string, unknown>)
      : null;
  const scope = contextRec?.scope;
  if (scope !== 'personal' && scope !== 'business' && scope !== 'household') {
    return { ok: false, code: 'INVALID_REQUEST', message: 'context.scope is required' };
  }
  if (!registration.supportedContexts.includes(scope)) {
    return { ok: false, code: 'TENANT_MISMATCH', message: `Module does not support context scope: ${scope}` };
  }

  const occurredAt = typeof raw.occurredAt === 'string' ? raw.occurredAt : '';
  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) {
    return { ok: false, code: 'INVALID_REQUEST', message: 'occurredAt must be ISO-8601' };
  }

  let parent: PartnerActivityIngestRequest['parent'];
  if (raw.parent && typeof raw.parent === 'object' && !Array.isArray(raw.parent)) {
    const p = raw.parent as Record<string, unknown>;
    if (typeof p.type === 'string' && typeof p.id === 'string') {
      parent = { type: p.type.trim(), id: p.id.trim() };
    }
  }

  const visibilityRec =
    raw.visibility && typeof raw.visibility === 'object' && !Array.isArray(raw.visibility)
      ? (raw.visibility as Record<string, unknown>)
      : null;
  const visibilityScope = visibilityRec?.scope;

  const metadata =
    raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : undefined;

  return {
    ok: true,
    request: {
      contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
      idempotencyKey,
      occurredAt,
      action,
      actor: { userRef },
      target: { type: targetType, id: targetId },
      parent,
      context: {
        scope,
        businessId:
          typeof contextRec?.businessId === 'string' ? contextRec.businessId : undefined,
        dashboardId:
          typeof contextRec?.dashboardId === 'string' ? contextRec.dashboardId : undefined,
        householdId:
          typeof contextRec?.householdId === 'string' ? contextRec.householdId : undefined,
      },
      visibility:
        visibilityScope === 'personal' ||
        visibilityScope === 'business' ||
        visibilityScope === 'household' ||
        visibilityScope === 'direct-share'
          ? { scope: visibilityScope }
          : undefined,
      severity:
        raw.severity === 'info' || raw.severity === 'notice' || raw.severity === 'important'
          ? raw.severity
          : undefined,
      metadata,
    },
  };
}

export function normalizePartnerActivityPayload(params: {
  request: PartnerActivityIngestRequest;
  claims: ActivityIngestJwtClaims;
  registration: PartnerActivityIngestRegistration;
  eventId: string;
}): NormalizedPartnerActivityPayload {
  const { request, claims, registration } = params;
  const sanitized = sanitizeMetadata(request.metadata, registration.maxMetadataBytes);

  return {
    eventId: params.eventId,
    actorUserId: claims.sub,
    moduleId: claims.moduleId,
    action: request.action,
    targetType: request.target.type,
    targetId: request.target.id,
    parentType: request.parent?.type,
    parentId: request.parent?.id,
    dashboardId: claims.dashboardId ?? request.context.dashboardId ?? null,
    businessId: claims.businessId ?? request.context.businessId ?? null,
    householdId: claims.householdId ?? request.context.householdId ?? null,
    visibilityScope: (request.visibility?.scope ?? request.context.scope) as ActivityScope,
    occurredAt: request.occurredAt,
    metadata: {
      ...sanitized,
      partnerOrigin: true,
      sourceModuleId: claims.moduleId,
      idempotencyKey: request.idempotencyKey,
      severity: request.severity ?? 'info',
      occurredAt: request.occurredAt,
      ingestRequestId: claims.requestId,
    },
  };
}

async function verifyTenantEntitlement(params: {
  claims: ActivityIngestJwtClaims;
  moduleId: string;
}): Promise<{ ok: true } | { ok: false; code: ActivityIngestErrorCode; message: string }> {
  const { claims, moduleId } = params;

  if (claims.scope === 'business') {
    if (!claims.businessId) {
      return { ok: false, code: 'TENANT_MISMATCH', message: 'businessId required in token' };
    }
    const membership = await prisma.businessMember.findFirst({
      where: { businessId: claims.businessId, userId: claims.sub, isActive: true },
    });
    if (!membership) {
      return { ok: false, code: 'FORBIDDEN', message: 'Not a member of this business' };
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        businessInstallations: { where: { businessId: claims.businessId }, take: 1 },
      },
    });
    if (!mod || mod.status !== 'APPROVED') {
      return { ok: false, code: 'FORBIDDEN', message: 'Module not approved' };
    }

    const entitlement = await evaluateBusinessModuleEntitlement({
      businessId: claims.businessId,
      moduleId,
      module: {
        pricingTier: mod.pricingTier,
        isProprietary: mod.isProprietary,
        status: mod.status,
      },
      installation: mod.businessInstallations[0] ?? null,
      userId: claims.sub,
    });
    if (!entitlement.allowed) {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: entitlement.reason ?? 'Entitlement denied',
      };
    }

    return { ok: true };
  }

  const installation = await prisma.moduleInstallation.findFirst({
    where: { moduleId, userId: claims.sub, enabled: true },
  });
  if (!installation) {
    return { ok: false, code: 'FORBIDDEN', message: 'Module not installed for user' };
  }

  return { ok: true };
}

export async function ingestPartnerActivity(params: {
  urlModuleId: string;
  claims: ActivityIngestJwtClaims;
  registration: PartnerActivityIngestRegistration;
  body: unknown;
  /** Admin probe only — skips entitlement and rate limit. */
  probeMode?: boolean;
}): Promise<{ response: PartnerActivityIngestResponse; diagnostics: ActivityIngestDiagnostics }> {
  const started = Date.now();

  if (params.urlModuleId !== params.claims.moduleId) {
    return {
      response: errorResponse('FORBIDDEN', 'moduleId mismatch'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'FORBIDDEN',
        errorMessage: 'moduleId mismatch',
      },
    };
  }

  const validated = validatePartnerActivityIngestRequest(params.body, params.registration);
  if (!validated.ok) {
    return {
      response: errorResponse(validated.code, validated.message),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: validated.code,
        errorMessage: validated.message,
      },
    };
  }

  const request = validated.request;

  if (!actorRefMatchesUser(request.actor.userRef, params.claims.sub)) {
    return {
      response: errorResponse('FORBIDDEN', 'actor.userRef does not match token subject'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'FORBIDDEN',
        errorMessage: 'actor mismatch',
      },
    };
  }

  if (request.context.scope !== params.claims.scope) {
    return {
      response: errorResponse('TENANT_MISMATCH', 'context.scope does not match token scope'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'TENANT_MISMATCH',
      },
    };
  }

  if (
    params.claims.businessId &&
    request.context.businessId &&
    request.context.businessId !== params.claims.businessId
  ) {
    return {
      response: errorResponse('TENANT_MISMATCH', 'context.businessId does not match token'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'TENANT_MISMATCH',
      },
    };
  }

  const entitlement = params.probeMode
    ? { ok: true as const }
    : await verifyTenantEntitlement({
        claims: params.claims,
        moduleId: params.claims.moduleId,
      });
  if (!entitlement.ok) {
    return {
      response: errorResponse(entitlement.code, entitlement.message),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: entitlement.code,
        errorMessage: entitlement.message,
      },
    };
  }

  const tenantKey = tenantKeyFromClaims(params.claims);
  if (
    !params.probeMode &&
    !checkActivityIngestRateLimit(params.claims.moduleId, tenantKey, ACTIVITY_INGEST_RATE_LIMIT_PER_MINUTE)
  ) {
    return {
      response: errorResponse('RATE_LIMITED', 'Rate limit exceeded'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'RATE_LIMITED',
      },
    };
  }

  const payloadHash = hashIngestPayload(request);
  const idempotency = checkActivityIngestIdempotency({
    moduleId: params.claims.moduleId,
    tenantKey,
    idempotencyKey: request.idempotencyKey,
    payloadHash,
  });

  if (idempotency.conflict) {
    return {
      response: errorResponse('IDEMPOTENCY_CONFLICT', 'Idempotency key reused with different payload'),
      diagnostics: {
        outcome: 'validation_error',
        durationMs: Date.now() - started,
        errorCode: 'IDEMPOTENCY_CONFLICT',
      },
    };
  }

  if (idempotency.duplicate && idempotency.eventId) {
    consumeActivityIngestJti(params.claims.jti);
    return {
      response: {
        success: true,
        contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
        eventId: idempotency.eventId,
        accepted: true,
        duplicate: true,
      },
      diagnostics: { outcome: 'duplicate', durationMs: Date.now() - started },
    };
  }

  const normalized = normalizePartnerActivityPayload({
    request,
    claims: params.claims,
    registration: params.registration,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  });

  try {
    const eventId = await emitModuleActivityEvent({
      actorUserId: normalized.actorUserId,
      moduleId: normalized.moduleId,
      action: normalized.action,
      targetType: normalized.targetType,
      targetId: normalized.targetId,
      parentType: normalized.parentType,
      parentId: normalized.parentId,
      dashboardId: normalized.dashboardId,
      businessId: normalized.businessId,
      householdId: normalized.householdId,
      visibilityScope: normalized.visibilityScope,
      metadata: normalized.metadata,
    });

    storeActivityIngestIdempotency({
      moduleId: params.claims.moduleId,
      tenantKey,
      idempotencyKey: request.idempotencyKey,
      payloadHash,
      eventId,
    });

    consumeActivityIngestJti(params.claims.jti);

    void logger.info('Partner activity ingest accepted', {
      operation: 'partner_activity_ingest_accepted',
      moduleId: params.claims.moduleId,
      action: request.action,
      eventId,
      businessId: normalized.businessId ?? undefined,
    });

    return {
      response: {
        success: true,
        contractVersion: ACTIVITY_INGEST_CONTRACT_VERSION,
        eventId,
        accepted: true,
      },
      diagnostics: { outcome: 'success', durationMs: Date.now() - started },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Partner activity ingest failed', {
      operation: 'partner_activity_ingest_rejected',
      moduleId: params.claims.moduleId,
      error: { message: err.message, stack: err.stack },
    });
    return {
      response: errorResponse('INTERNAL_ERROR', 'Failed to persist activity'),
      diagnostics: {
        outcome: 'error',
        durationMs: Date.now() - started,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: err.message,
      },
    };
  }
}
