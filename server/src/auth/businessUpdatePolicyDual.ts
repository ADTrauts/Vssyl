import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'NOT_MEMBER',
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
];

export interface BusinessUpdatePolicyDualParams {
  userId: string;
  businessId: string;
}

export interface BusinessUpdatePolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for business profile/settings/branding updates.
 * Call after legacy canManage checks pass.
 */
export async function evaluateBusinessUpdatePolicyDual(
  params: BusinessUpdatePolicyDualParams
): Promise<BusinessUpdatePolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.BUSINESS_UPDATE,
    resourceType: 'business',
    resourceId: params.businessId,
    scope: { businessId: params.businessId },
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Business update policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.BUSINESS_UPDATE,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}
