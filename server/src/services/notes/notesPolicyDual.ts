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

export type NotesPolicyAction =
  | typeof POLICY_ACTIONS.NOTES_PAGE_READ
  | typeof POLICY_ACTIONS.NOTES_PAGE_CREATE
  | typeof POLICY_ACTIONS.NOTES_PAGE_UPDATE
  | typeof POLICY_ACTIONS.NOTES_PAGE_DELETE
  | typeof POLICY_ACTIONS.NOTES_PAGE_RESTORE
  | typeof POLICY_ACTIONS.NOTES_PAGE_PERMANENT_DELETE
  | typeof POLICY_ACTIONS.NOTES_PAGE_SHARE
  | typeof POLICY_ACTIONS.NOTE_CREATE
  | typeof POLICY_ACTIONS.NOTE_UPDATE
  | typeof POLICY_ACTIONS.NOTE_DELETE;

export interface NotesPolicyDualParams {
  userId: string;
  action: NotesPolicyAction;
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string };
  metadata?: Record<string, unknown>;
}

export interface NotesPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Notes/Page mutations. Security denies block;
 * POLICY_NOT_IMPLEMENTED does not block (legacy permission remains authoritative).
 */
export async function evaluateNotesPolicyDual(
  params: NotesPolicyDualParams
): Promise<NotesPolicyDualResult> {
  const decision = await authorize({
    userId: params.userId,
    action: params.action as PolicyAction,
    resourceType: 'note',
    resourceId: params.resourceId,
    scope: params.scope,
    metadata: params.metadata,
  });

  if (decision.allow) {
    return { blocked: false };
  }

  const reason = decision.reason ?? 'POLICY_NOT_IMPLEMENTED';
  const isSecurityDeny = SECURITY_DENY_REASONS.includes(reason as PolicyDenyReason);

  await logger.warn('Notes policy denied (dual enforcement)', {
    operation: 'policy_notes_dual_enforce',
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
