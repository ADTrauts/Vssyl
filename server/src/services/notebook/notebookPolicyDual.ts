import { logger } from '../../lib/logger';
import { authorize } from '../../auth/policyEngine';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import type { PolicyAction } from '../../auth/policyActions';
import type { PolicyDenyReason } from '../../auth/policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type NotebookLinkPolicyAction =
  | typeof POLICY_ACTIONS.NOTEBOOK_LINK_READ
  | typeof POLICY_ACTIONS.NOTEBOOK_LINK_WRITE;

export interface NotebookPolicyDualParams {
  userId: string;
  action: NotebookLinkPolicyAction;
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string };
}

export interface NotebookPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for NotebookLink mutations. Uses note resource type (page-scoped).
 * POLICY_NOT_IMPLEMENTED does not block — legacy page permissions remain authoritative.
 */
export async function evaluateNotebookLinkPolicyDual(
  params: NotebookPolicyDualParams
): Promise<NotebookPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'note',
    resourceId: params.resourceId,
    scope: params.scope,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  if (isSecurityDeny) {
    await logger.warn('Notebook link policy denied (dual enforcement)', {
      operation: 'policy_notebook_link_dual_enforce',
      userId: params.userId,
      action: params.action,
      resourceId: params.resourceId,
      reason,
      matchedPolicy: decision.matchedPolicy,
    });
    return { blocked: true, reason };
  }

  return { blocked: false, reason };
}
