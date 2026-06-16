import { Response, NextFunction } from 'express';
import { Request } from 'express';
import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type HRPolicyAction =
  | typeof POLICY_ACTIONS.HR_EMPLOYEE_READ
  | typeof POLICY_ACTIONS.HR_EMPLOYEE_WRITE
  | typeof POLICY_ACTIONS.HR_EMPLOYEE_DELETE
  | typeof POLICY_ACTIONS.HR_EMPLOYEE_TERMINATE
  | typeof POLICY_ACTIONS.HR_EMPLOYEE_IMPORT
  | typeof POLICY_ACTIONS.HR_TIME_OFF_READ
  | typeof POLICY_ACTIONS.HR_TIME_OFF_REQUEST
  | typeof POLICY_ACTIONS.HR_TIME_OFF_APPROVE
  | typeof POLICY_ACTIONS.HR_TIME_OFF_DENY
  | typeof POLICY_ACTIONS.HR_ONBOARDING_MANAGE
  | typeof POLICY_ACTIONS.HR_ONBOARDING_CREATE
  | typeof POLICY_ACTIONS.HR_ONBOARDING_UPDATE
  | typeof POLICY_ACTIONS.HR_ONBOARDING_COMPLETE
  | typeof POLICY_ACTIONS.HR_ATTENDANCE_MANAGE
  | typeof POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_CREATE
  | typeof POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_UPDATE
  | typeof POLICY_ACTIONS.HR_SETTINGS_WRITE;

export type HRPolicyResourceType = Extract<
  PolicyResourceType,
  'business' | 'hr_employee' | 'time_off_request' | 'attendance_exception' | 'onboarding_journey'
>;

export interface HRPolicyDualParams {
  userId: string;
  action: HRPolicyAction;
  businessId: string;
  resourceType?: HRPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface HRPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export interface HRPolicyAccessResult {
  allowed: boolean;
  reason?: PolicyDenyReason | string;
  usedPolicyFallback?: boolean;
}

function resolveBusinessIdFromRequest(req: Request): string | undefined {
  const businessIdParam = req.query.businessId;
  const businessIdBody = req.body?.businessId;

  if (typeof businessIdParam === 'string') return businessIdParam;
  if (typeof businessIdBody === 'string') return businessIdBody;
  return undefined;
}

function resolveResourceId(params: HRPolicyDualParams): string {
  return params.resourceId ?? params.businessId;
}

function resolveResourceType(params: HRPolicyDualParams): HRPolicyResourceType {
  return params.resourceType ?? 'business';
}

/**
 * Dual enforcement for HR mutations. Call after legacy HR middleware passes.
 */
export async function evaluateHRPolicyDual(
  params: HRPolicyDualParams
): Promise<HRPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'hr', ...params.metadata },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('HR policy denied (dual enforcement)', {
    operation: 'policy_hr_dual_enforce',
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

export async function resolveHRPolicyAccess(params: {
  legacyAllowed: boolean;
  userId: string;
  action: HRPolicyAction;
  businessId: string;
  resourceType?: HRPolicyResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<HRPolicyAccessResult> {
  if (params.legacyAllowed) {
    const dual = await evaluateHRPolicyDual(params);
    return { allowed: !dual.blocked, reason: dual.reason };
  }

  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: resolveResourceType(params),
    resourceId: resolveResourceId(params),
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'hr', ...params.metadata },
  });

  return {
    allowed: decision.allow,
    reason: decision.reason,
    usedPolicyFallback: true,
  };
}

export interface HRPolicyMiddlewareOptions {
  resourceIdParam?: string;
  resourceType?: HRPolicyResourceType;
}

export function checkHRPolicy(action: HRPolicyAction, options?: HRPolicyMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    const businessId = resolveBusinessIdFromRequest(req);

    if (!user || !businessId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const paramKey = options?.resourceIdParam;
    const resourceId =
      paramKey && typeof req.params[paramKey] === 'string'
        ? req.params[paramKey]
        : businessId;

    const dual = await evaluateHRPolicyDual({
      userId: user.id,
      action,
      businessId,
      resourceType: options?.resourceType,
      resourceId,
    });

    if (dual.blocked) {
      res.status(403).json({
        error: 'HR policy denied',
        reason: dual.reason,
      });
      return;
    }

    next();
  };
}
