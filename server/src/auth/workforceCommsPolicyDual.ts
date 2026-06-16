import { Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';
import type { AuthenticatedRequest } from '../middleware/workforceCommsPermissions';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type WorkforceCommsPolicyAction =
  | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ
  | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_CREATE
  | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE
  | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_PUBLISH
  | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE
  | typeof POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE
  | typeof POLICY_ACTIONS.WORKFORCE_ACK_MANAGE
  | typeof POLICY_ACTIONS.WORKFORCE_REPORT_READ
  | typeof POLICY_ACTIONS.WORKFORCE_BRIDGE_MANAGE;

export type WorkforceCommsPolicyResourceType = Extract<
  PolicyResourceType,
  'business' | 'workforce_communication' | 'workforce_campaign'
>;

export interface WorkforceCommsPolicyDualParams {
  userId: string;
  action: WorkforceCommsPolicyAction;
  businessId: string;
  resourceType?: WorkforceCommsPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkforceCommsPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export interface WorkforceCommsPolicyAccessResult {
  allowed: boolean;
  reason?: PolicyDenyReason | string;
  usedPolicyFallback?: boolean;
}

function resolveResourceId(params: WorkforceCommsPolicyDualParams): string {
  return params.resourceId ?? params.businessId;
}

function resolveResourceType(params: WorkforceCommsPolicyDualParams): WorkforceCommsPolicyResourceType {
  return params.resourceType ?? 'business';
}

/**
 * Dual enforcement for Workforce Communications mutations. Call after legacy middleware passes.
 * Security denies block; POLICY_NOT_IMPLEMENTED does not block (legacy remains authoritative).
 */
export async function evaluateWorkforceCommsPolicyDual(
  params: WorkforceCommsPolicyDualParams
): Promise<WorkforceCommsPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'workforce_comms', ...params.metadata },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Workforce comms policy denied (dual enforcement)', {
    operation: 'policy_workforce_comms_dual_enforce',
    userId: params.userId,
    businessId: params.businessId,
    action: params.action,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}

/**
 * Resolves access when legacy RBAC alone is insufficient.
 * Legacy allow → dual enforcement; legacy deny → policy engine fallback.
 */
export async function resolveWorkforceCommsPolicyAccess(params: {
  legacyAllowed: boolean;
  userId: string;
  action: WorkforceCommsPolicyAction;
  businessId: string;
  resourceType?: WorkforceCommsPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<WorkforceCommsPolicyAccessResult> {
  if (params.legacyAllowed) {
    const dual = await evaluateWorkforceCommsPolicyDual(params);
    return { allowed: !dual.blocked, reason: dual.reason };
  }

  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'workforce_comms', ...params.metadata },
  });

  return {
    allowed: decision.allow,
    reason: decision.reason,
    usedPolicyFallback: true,
  };
}

export interface WorkforceCommsPolicyMiddlewareOptions {
  resourceIdParam?: string;
  resourceType?: WorkforceCommsPolicyResourceType;
}

/**
 * Express middleware: runs after legacy workforce comms permission middleware.
 */
export function checkWorkforceCommsPolicy(
  action: WorkforceCommsPolicyAction,
  options?: WorkforceCommsPolicyMiddlewareOptions
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = req.user;
    const businessId = req.businessId;

    if (!user || !businessId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const paramKey = options?.resourceIdParam;
    const resourceId =
      paramKey && typeof req.params[paramKey] === 'string'
        ? req.params[paramKey]
        : businessId;

    const dual = await evaluateWorkforceCommsPolicyDual({
      userId: user.id,
      action,
      businessId,
      resourceType: options?.resourceType,
      resourceId,
    });

    if (dual.blocked) {
      res.status(403).json({
        message: 'Forbidden: Workforce communications policy denied',
        reason: dual.reason,
      });
      return;
    }

    next();
  };
}
