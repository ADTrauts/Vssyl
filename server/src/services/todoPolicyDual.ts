import { logger } from '../lib/logger';
import { authorize } from '../auth/policyEngine';
import { POLICY_ACTIONS } from '../auth/policyActions';
import type { PolicyAction } from '../auth/policyActions';
import type { PolicyDenyReason, PolicyResourceType } from '../auth/policyTypes';

const SECURITY_DENY_REASONS: PolicyDenyReason[] = [
  'INSUFFICIENT_ROLE',
  'TENANT_MISMATCH',
  'NOT_OWNER',
  'NOT_MEMBER',
];

export type TodoPolicyAction =
  | typeof POLICY_ACTIONS.TODO_TASK_READ
  | typeof POLICY_ACTIONS.TODO_PROJECT_READ
  | typeof POLICY_ACTIONS.TODO_TASK_CREATE
  | typeof POLICY_ACTIONS.TODO_TASK_UPDATE
  | typeof POLICY_ACTIONS.TODO_TASK_COMPLETE
  | typeof POLICY_ACTIONS.TODO_TASK_REOPEN
  | typeof POLICY_ACTIONS.TODO_TASK_DELETE
  | typeof POLICY_ACTIONS.TODO_TASK_ASSIGN;

export interface TodoPolicyDualParams {
  userId: string;
  action: TodoPolicyAction;
  resourceType: Extract<PolicyResourceType, 'task'>;
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string; householdId?: string };
  metadata?: Record<string, unknown>;
}

export interface TodoPolicyDualResult {
  blocked: boolean;
  reason?: PolicyDenyReason | string;
}

/**
 * Dual enforcement for Todo task mutations. Call after legacy permission checks pass.
 * Security denies block; POLICY_NOT_IMPLEMENTED does not block (legacy permission remains authoritative).
 */
export async function evaluateTodoPolicyDual(
  params: TodoPolicyDualParams
): Promise<TodoPolicyDualResult> {
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

  await logger.warn('Todo policy denied (dual enforcement)', {
    operation: 'policy_todo_dual_enforce',
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
