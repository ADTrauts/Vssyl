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

export type OrgChartPolicyAction =
  | typeof POLICY_ACTIONS.ORGCHART_TIER_WRITE
  | typeof POLICY_ACTIONS.ORGCHART_DEPARTMENT_WRITE
  | typeof POLICY_ACTIONS.ORGCHART_POSITION_WRITE
  | typeof POLICY_ACTIONS.ORGCHART_STRUCTURE_INITIALIZE
  | typeof POLICY_ACTIONS.ORGCHART_PERMISSION_SET_WRITE
  | typeof POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN
  | typeof POLICY_ACTIONS.ORGCHART_PERMISSION_READ
  | typeof POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_READ
  | typeof POLICY_ACTIONS.ORGCHART_APPROVAL_HIERARCHY_WRITE;

export interface OrgChartPolicyDualParams {
  userId: string;
  action: OrgChartPolicyAction;
  businessId: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface OrgChartPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for org-chart mutations. Call after legacy org-chart middleware passes.
 */
export async function evaluateOrgChartPolicyDual(
  params: OrgChartPolicyDualParams
): Promise<OrgChartPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'business',
    resourceId: params.resourceId ?? params.businessId,
    scope: { businessId: params.businessId },
    metadata: { moduleId: 'org_chart', ...params.metadata },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Org chart policy denied (dual enforcement)', {
    operation: 'policy_orgchart_dual_enforce',
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

export interface OrgChartAuthenticatedRequest extends Request {
  orgChartBusinessId?: string;
}

/**
 * Express middleware: runs after legacy org-chart permission middleware.
 * Requires `req.orgChartBusinessId` set by `orgChartPermissions` helpers.
 */
export function checkOrgChartPolicy(action: OrgChartPolicyAction) {
  return async (req: OrgChartAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = getUserFromRequest(req);
    const businessId = req.orgChartBusinessId;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!businessId) {
      res.status(403).json({ error: 'Insufficient permissions to modify org chart' });
      return;
    }

    const dual = await evaluateOrgChartPolicyDual({
      userId: user.id,
      action,
      businessId,
    });

    if (dual.blocked) {
      res.status(403).json({
        error: 'Insufficient permissions to modify org chart',
        reason: dual.reason,
      });
      return;
    }

    next();
  };
}
