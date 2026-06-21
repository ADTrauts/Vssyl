import { Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';
import type { AuthenticatedRequest } from '../middleware/schedulingPermissions';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type SchedulingPolicyAction =
  | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_READ
  | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_WRITE
  | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE
  | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_PUBLISH
  | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_READ
  | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_WRITE
  | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_ASSIGN
  | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_CLAIM
  | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_DELETE
  | typeof POLICY_ACTIONS.SCHEDULING_SWAP_MANAGE
  | typeof POLICY_ACTIONS.SCHEDULING_SWAP_REQUEST
  | typeof POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE
  | typeof POLICY_ACTIONS.SCHEDULING_STATION_WRITE;

export type SchedulingPolicyResourceType = Extract<PolicyResourceType, 'business' | 'schedule' | 'shift'>;

export interface SchedulingPolicyDualParams {
  userId: string;
  action: SchedulingPolicyAction;
  businessId: string;
  resourceType?: SchedulingPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface SchedulingPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export interface SchedulingPolicyAccessResult {
  allowed: boolean;
  reason?: PolicyDenyReason | string;
  usedPolicyFallback?: boolean;
}

function resolveResourceId(params: SchedulingPolicyDualParams): string {
  return params.resourceId ?? params.businessId;
}

function resolveResourceType(params: SchedulingPolicyDualParams): SchedulingPolicyResourceType {
  return params.resourceType ?? 'business';
}

/**
 * Dual enforcement for Scheduling mutations. Call after legacy scheduling middleware passes.
 * Security denies block; POLICY_NOT_IMPLEMENTED does not block (legacy remains authoritative).
 */
export async function evaluateSchedulingPolicyDual(
  params: SchedulingPolicyDualParams
): Promise<SchedulingPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'scheduling', ...params.metadata },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Scheduling policy denied (dual enforcement)', {
    operation: 'policy_scheduling_dual_enforce',
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
export async function resolveSchedulingPolicyAccess(params: {
  legacyAllowed: boolean;
  userId: string;
  action: SchedulingPolicyAction;
  businessId: string;
  resourceType?: SchedulingPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<SchedulingPolicyAccessResult> {
  if (params.legacyAllowed) {
    const dual = await evaluateSchedulingPolicyDual(params);
    return { allowed: !dual.blocked, reason: dual.reason };
  }

  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'scheduling', ...params.metadata },
  });

  return {
    allowed: decision.allow,
    reason: decision.reason,
    usedPolicyFallback: true,
  };
}

export interface SchedulingPolicyMiddlewareOptions {
  resourceIdParam?: string;
  resourceType?: SchedulingPolicyResourceType;
}

/**
 * Express middleware: runs after legacy scheduling permission middleware.
 */
export function checkSchedulingPolicy(
  action: SchedulingPolicyAction,
  options?: SchedulingPolicyMiddlewareOptions
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

    const dual = await evaluateSchedulingPolicyDual({
      userId: user.id,
      action,
      businessId,
      resourceType: options?.resourceType,
      resourceId,
    });

    if (dual.blocked) {
      res.status(403).json({
        message: 'Forbidden: Scheduling policy denied',
        reason: dual.reason,
      });
      return;
    }

    next();
  };
}
