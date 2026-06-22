import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type DashboardPolicyAction =
  | typeof POLICY_ACTIONS.DASHBOARD_READ
  | typeof POLICY_ACTIONS.DASHBOARD_WRITE
  | typeof POLICY_ACTIONS.DASHBOARD_DELETE;

export interface DashboardPolicyDualParams {
  userId: string;
  action: DashboardPolicyAction;
  resourceId: string;
  scope?: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
    institutionId?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DashboardPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export async function evaluateDashboardPolicyDual(
  params: DashboardPolicyDualParams
): Promise<DashboardPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'dashboard',
    resourceId: params.resourceId,
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Dashboard policy denied (dual enforcement)', {
    operation: 'policy_dashboard_dual_enforce',
    userId: params.userId,
    action: params.action,
    resourceId: params.resourceId,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}

export async function requireDashboardPolicy(
  params: DashboardPolicyDualParams
): Promise<DashboardPolicyDualResult> {
  return evaluateDashboardPolicyDual(params);
}
