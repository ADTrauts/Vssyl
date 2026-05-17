import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import type { PolicyAction } from './policyActions';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'NOT_MEMBER',
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
];

export type BusinessMemberPolicyAction =
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_INVITE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_RESEND_INVITE
  | typeof POLICY_ACTIONS.BUSINESS_MEMBER_CANCEL_INVITE;

export interface BusinessMemberPolicyDualParams {
  userId: string;
  businessId: string;
  action: BusinessMemberPolicyAction;
  metadata?: Record<string, unknown>;
}

export interface BusinessMemberPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement: call after legacy business member checks pass.
 * Blocks on policy security denies; logs when policy disagrees with legacy allow.
 */
export async function evaluateBusinessMemberPolicyDual(
  params: BusinessMemberPolicyDualParams
): Promise<BusinessMemberPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'business',
    resourceId: params.businessId,
    scope: { businessId: params.businessId },
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Business member policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
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
