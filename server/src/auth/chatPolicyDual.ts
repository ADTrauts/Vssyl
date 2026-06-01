import { logger } from '../lib/logger';
import { authorize } from './policyEngine';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyAction } from './policyActions';
import type { PolicyDenyReason, PolicyResourceType } from './policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type ChatPolicyAction =
  | typeof POLICY_ACTIONS.CHAT_CONVERSATION_READ
  | typeof POLICY_ACTIONS.CHAT_CONVERSATION_CREATE
  | typeof POLICY_ACTIONS.CHAT_CONVERSATION_TRASH
  | typeof POLICY_ACTIONS.CHAT_CONVERSATION_RESTORE
  | typeof POLICY_ACTIONS.CHAT_CONVERSATION_PERMANENT_DELETE
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_CREATE
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_READ
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_TRASH
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_RESTORE
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_PERMANENT_DELETE
  | typeof POLICY_ACTIONS.CHAT_MESSAGE_REACT
  | typeof POLICY_ACTIONS.CHAT_THREAD_CREATE;

export interface ChatPolicyDualParams {
  userId: string;
  action: ChatPolicyAction;
  resourceType: Extract<PolicyResourceType, 'conversation' | 'message'>;
  resourceId: string;
  scope?: { dashboardId?: string };
  metadata?: Record<string, unknown>;
}

export interface ChatPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Chat mutations. Call after legacy participant checks pass.
 */
export async function evaluateChatPolicyDual(
  params: ChatPolicyDualParams
): Promise<ChatPolicyDualResult> {
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

  await logger.warn('Chat policy denied (dual enforcement)', {
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
