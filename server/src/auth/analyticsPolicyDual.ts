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

export type AnalyticsPolicyAction =
  | typeof POLICY_ACTIONS.ANALYTICS_READ
  | typeof POLICY_ACTIONS.ANALYTICS_ADMIN;

export interface AnalyticsPolicyDualParams {
  userId: string;
  action: AnalyticsPolicyAction;
  resourceId?: string;
  scope?: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface AnalyticsPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export async function evaluateAnalyticsPolicyDual(
  params: AnalyticsPolicyDualParams
): Promise<AnalyticsPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'analytics',
    resourceId: params.resourceId,
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Analytics policy denied (dual enforcement)', {
    operation: 'policy_analytics_dual_enforce',
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
