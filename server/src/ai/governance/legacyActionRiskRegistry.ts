/**
 * Risk declarations for ActionExecutor HIGH_RISK operations not yet Twin tools (Phase 2).
 */

import type { AIActionRiskCategory, AIActionRiskDeclaration } from 'vssyl-shared';
import { resolveApprovalRequired } from 'vssyl-shared';

export const ACTION_EXECUTOR_HIGH_RISK_OPERATIONS = [
  'share_file',
  'delete_file',
  'send_message',
  'delete_event',
  'delete_task',
  'publish_schedule',
  'approve_time_off',
  'terminate_employee',
  'send_email',
] as const;

export type ActionExecutorHighRiskOperation = (typeof ACTION_EXECUTOR_HIGH_RISK_OPERATIONS)[number];

const LEGACY_RISK: Record<ActionExecutorHighRiskOperation, AIActionRiskCategory> = {
  share_file: 'EXTERNAL_VISIBILITY',
  delete_file: 'DESTRUCTIVE',
  send_message: 'EXTERNAL_VISIBILITY',
  delete_event: 'DESTRUCTIVE',
  delete_task: 'DESTRUCTIVE',
  publish_schedule: 'CONSEQUENTIAL_REVERSIBLE',
  approve_time_off: 'FINANCIAL_OR_REGULATED',
  terminate_employee: 'IRREVERSIBLE_EXTERNAL',
  send_email: 'EXTERNAL_VISIBILITY',
};

export function getLegacyActionRisk(operation: string): AIActionRiskDeclaration {
  const riskCategory =
    (LEGACY_RISK as Record<string, AIActionRiskCategory>)[operation] ?? 'CONSEQUENTIAL_REVERSIBLE';
  return {
    canonicalName: `ae:${operation}`,
    domainOwner: 'action_executor',
    riskCategory,
    mutating: true,
    externalVisibility:
      riskCategory === 'EXTERNAL_VISIBILITY' || riskCategory === 'IRREVERSIBLE_EXTERNAL',
    reversible: riskCategory !== 'DESTRUCTIVE' && riskCategory !== 'IRREVERSIBLE_EXTERNAL',
    approvalPolicy: 'RISK_BASED',
    idempotencyRequired: true,
    auditRequired: true,
    businessScopeRequired:
      operation === 'approve_time_off' ||
      operation === 'terminate_employee' ||
      operation === 'publish_schedule',
  };
}

export function isHighRiskActionExecutorOperation(operation: string): boolean {
  return (ACTION_EXECUTOR_HIGH_RISK_OPERATIONS as readonly string[]).includes(operation);
}

export function legacyActionRequiresApproval(operation: string): boolean {
  return resolveApprovalRequired(getLegacyActionRisk(operation));
}
