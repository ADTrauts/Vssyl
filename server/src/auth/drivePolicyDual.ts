import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
];

export type DrivePolicyAction =
  | typeof POLICY_ACTIONS.FILE_UPDATE
  | typeof POLICY_ACTIONS.FILE_DELETE
  | typeof POLICY_ACTIONS.FILE_MOVE
  | typeof POLICY_ACTIONS.FILE_UPLOAD
  | typeof POLICY_ACTIONS.FILE_SHARE
  | typeof POLICY_ACTIONS.FOLDER_UPDATE
  | typeof POLICY_ACTIONS.FOLDER_DELETE
  | typeof POLICY_ACTIONS.FOLDER_CREATE
  | typeof POLICY_ACTIONS.FOLDER_SHARE;

export interface DrivePolicyDualParams {
  userId: string;
  action: DrivePolicyAction;
  resourceType: Extract<PolicyResourceType, 'file' | 'folder'>;
  resourceId: string;
  scope?: { dashboardId?: string };
  metadata?: Record<string, unknown>;
}

export interface DrivePolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Drive write/delete mutations. Call after legacy canWrite* checks pass.
 */
export async function evaluateDrivePolicyDual(
  params: DrivePolicyDualParams
): Promise<DrivePolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Drive policy denied (dual enforcement)', {
    operation: 'policy_legacy_dual_enforce',
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
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
