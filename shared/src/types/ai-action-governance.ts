/**
 * Provider-independent AI action / tool governance types (Phase 1–2).
 * Runtime policy lives in server; this module is the shared contract.
 */

export type AIActionRiskCategory =
  | 'READ_ONLY'
  | 'LOW_RISK_REVERSIBLE'
  | 'CONSEQUENTIAL_REVERSIBLE'
  | 'EXTERNAL_VISIBILITY'
  | 'DESTRUCTIVE'
  | 'FINANCIAL_OR_REGULATED'
  | 'IRREVERSIBLE_EXTERNAL';

export type AIActionApprovalPolicy = 'NEVER' | 'RISK_BASED' | 'ALWAYS';

/** Canonical execution lifecycle statuses (Phase 2 event model). */
export type AIActionExecutionStatus =
  | 'PROPOSED'
  | 'AUTHORIZED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'REVERSED'
  | 'CANCELLED';

/** Discrete lifecycle events that map onto AIActionExecutionStatus transitions. */
export type AIExecutionEventType =
  | 'PROPOSED'
  | 'AUTHORIZED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export interface AIActionRiskDeclaration {
  canonicalName: string;
  domainOwner: string;
  riskCategory: AIActionRiskCategory;
  mutating: boolean;
  externalVisibility: boolean;
  reversible: boolean;
  approvalPolicy: AIActionApprovalPolicy;
  idempotencyRequired: boolean;
  auditRequired: boolean;
  businessScopeRequired: boolean;
}

export interface AIActionExecutionResult {
  executionId: string;
  actionName: string;
  status: AIActionExecutionStatus;
  riskCategory: AIActionRiskCategory;
  approvalRequired: boolean;
  approvalId?: string;
  authorized: boolean;
  executed: boolean;
  idempotentReplay: boolean;
  result?: Record<string, unknown>;
  error?: string;
  activityId?: string;
  createdAt: string;
  completedAt?: string;
}

/** Resolve whether approval is required given declaration + RISK_BASED defaults. */
export function resolveApprovalRequired(declaration: AIActionRiskDeclaration): boolean {
  if (declaration.approvalPolicy === 'ALWAYS') return true;
  if (declaration.approvalPolicy === 'NEVER') return false;
  // RISK_BASED
  switch (declaration.riskCategory) {
    case 'READ_ONLY':
    case 'LOW_RISK_REVERSIBLE':
      return false;
    case 'CONSEQUENTIAL_REVERSIBLE':
    case 'EXTERNAL_VISIBILITY':
    case 'DESTRUCTIVE':
    case 'FINANCIAL_OR_REGULATED':
    case 'IRREVERSIBLE_EXTERNAL':
      return true;
    default:
      return true;
  }
}

/** Map a lifecycle event to the durable execution status. */
export function statusFromExecutionEvent(event: AIExecutionEventType): AIActionExecutionStatus {
  return event;
}

/**
 * Normalize a legacy ActionExecutor-shaped result into the canonical contract
 * when an executionId / approvalId is already known.
 */
export function toCanonicalExecutionResult(input: {
  executionId: string;
  actionName: string;
  success: boolean;
  riskCategory: AIActionRiskCategory;
  approvalRequired: boolean;
  approvalId?: string;
  authorized?: boolean;
  executed?: boolean;
  idempotentReplay?: boolean;
  result?: Record<string, unknown>;
  error?: string;
  activityId?: string;
  status?: AIActionExecutionStatus;
  createdAt?: string;
  completedAt?: string;
}): AIActionExecutionResult {
  const status =
    input.status ??
    (input.approvalRequired && !input.executed && input.approvalId
      ? 'AWAITING_APPROVAL'
      : input.success
        ? 'COMPLETED'
        : 'FAILED');
  return {
    executionId: input.executionId,
    actionName: input.actionName,
    status,
    riskCategory: input.riskCategory,
    approvalRequired: input.approvalRequired,
    approvalId: input.approvalId,
    authorized: input.authorized ?? true,
    executed: input.executed ?? status === 'COMPLETED',
    idempotentReplay: input.idempotentReplay ?? false,
    result: input.result,
    error: input.error,
    activityId: input.activityId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    completedAt: input.completedAt,
  };
}
