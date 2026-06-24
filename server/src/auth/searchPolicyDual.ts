import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason } from './policyTypes';
import type { SearchContextScope } from 'shared/types/search';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export interface SearchPolicyDualParams {
  userId: string;
  scope?: SearchContextScope;
  metadata?: Record<string, unknown>;
}

export interface SearchPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

export async function evaluateSearchPolicyDual(
  params: SearchPolicyDualParams
): Promise<SearchPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: POLICY_ACTIONS.SEARCH_READ as PolicyAction,
    resourceType: 'search',
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Search policy denied (dual enforcement)', {
    operation: 'policy_search_dual_enforce',
    userId: params.userId,
    scope: params.scope,
    reason,
    matchedPolicy: decision.matchedPolicy,
    blockRequest: isSecurityDeny,
  });

  if (isSecurityDeny) {
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}
