import { Response, NextFunction, Request } from 'express';
import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';
import { getUserFromRequest } from '../middleware/auth';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type BusinessAdminPolicyAction =
  | typeof POLICY_ACTIONS.BUSINESS_CREATE
  | typeof POLICY_ACTIONS.BUSINESS_UPDATE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_INVITE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION;

export interface BusinessAdminPolicyDualParams {
  userId: string;
  action: BusinessAdminPolicyAction;
  businessId?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessAdminPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export async function evaluateBusinessAdminPolicyDual(
  params: BusinessAdminPolicyDualParams
): Promise<BusinessAdminPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'business',
    resourceId: params.businessId,
    scope: params.businessId ? { businessId: params.businessId } : undefined,
    metadata: { moduleId: 'business_admin', ...params.metadata },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Business admin policy denied (dual enforcement)', {
    operation: 'policy_business_admin_dual_enforce',
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

export interface BusinessPolicyMiddlewareOptions {
  businessIdParam?: string;
  resolveBusinessId?: (req: Request) => Promise<string | undefined> | string | undefined;
  metadata?: (req: Request) => Record<string, unknown> | undefined;
}

/**
 * Route-level PE dual for `/api/business` mutations.
 */
export function checkBusinessPolicy(
  action: BusinessAdminPolicyAction,
  options?: BusinessPolicyMiddlewareOptions
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let businessId: string | undefined;
    if (options?.resolveBusinessId) {
      businessId = await options.resolveBusinessId(req);
    } else if (options?.businessIdParam) {
      const raw = req.params[options.businessIdParam];
      businessId = typeof raw === 'string' ? raw : undefined;
    }

    const dual = await evaluateBusinessAdminPolicyDual({
      userId: user.id,
      action,
      businessId,
      metadata: options?.metadata?.(req),
    });

    if (dual.blocked) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: dual.reason,
      });
      return;
    }

    next();
  };
}
