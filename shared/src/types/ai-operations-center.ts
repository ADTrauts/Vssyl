/**
 * Phase 4 — AI Operations Center product contracts.
 * Consumes Phase 3 intelligence models; no duplicate storage.
 */

export type AIOperationsRole =
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_OPERATOR'
  | 'BUSINESS_ADMIN'
  | 'BUSINESS_AI_MANAGER'
  | 'READ_ONLY_AUDITOR'
  | 'SUPPORT_ENGINEER';

export type AIOperationsPermission =
  | 'operations:read'
  | 'operations:write'
  | 'executions:read'
  | 'executions:search'
  | 'evaluations:read'
  | 'evaluations:write'
  | 'evaluations:assign'
  | 'evaluations:bulk'
  | 'root_causes:read'
  | 'root_causes:write'
  | 'corrections:read'
  | 'corrections:write'
  | 'corrections:assign'
  | 'regressions:read'
  | 'regressions:write'
  | 'metrics:read'
  | 'explainability:read'
  | 'replay:prepare'
  | 'settings:read';

export type AIEvaluationWorkflowStatus =
  // Phase 4 (retained)
  | 'PENDING'
  | 'REVIEWED'
  | 'ASSIGNED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ARCHIVED'
  // Phase 6 lifecycle (extends same field — no parallel system)
  | 'NEW'
  | 'TRIAGED'
  | 'UNDER_REVIEW'
  | 'ROOT_CAUSE_CONFIRMED'
  | 'CORRECTION_CREATED'
  | 'CORRECTION_APPROVED'
  | 'IMPLEMENTED'
  | 'REGRESSION_CREATED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'DUPLICATE'
  | 'CANCELLED'
  | 'DEFERRED'
  | 'NEEDS_INFORMATION'
  | 'NOT_REPRODUCIBLE';

/** Normalize legacy Phase 4 statuses into Phase 6 lifecycle vocabulary for display. */
export function normalizeEvaluationWorkflowStatus(
  status: string
): AIEvaluationWorkflowStatus {
  if (status === 'PENDING') return 'NEW';
  if (status === 'ASSIGNED') return 'TRIAGED';
  if (status === 'REVIEWED') return 'UNDER_REVIEW';
  if (status === 'RESOLVED') return 'CLOSED';
  return status as AIEvaluationWorkflowStatus;
}

export type AIRootCauseReviewStatus = 'SUGGESTED' | 'APPROVED' | 'REJECTED';

export type AICorrectionRoutingApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type AIOperationsPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Internal work-item kinds generated from accepted corrections (no external ticketing). */
export type AICorrectionWorkItemKind =
  | 'ENGINEERING'
  | 'KNOWLEDGE_REVIEW'
  | 'BUSINESS_REVIEW'
  | 'CUSTOMER_REVIEW'
  | 'PROMPT_REVIEW'
  | 'PROVIDER_REVIEW'
  | 'TOOL_REVIEW'
  | 'GROUNDING_REVIEW'
  | 'CONTEXT_PROVIDER_REVIEW'
  | 'MEMORY_REVIEW'
  | 'OPERATOR_TRIAGE';

export type AICorrectionWorkItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface AICorrectionWorkItemView {
  id: string;
  correctionRouteId: string;
  kind: AICorrectionWorkItemKind;
  destination: string;
  status: AICorrectionWorkItemStatus;
  title: string;
  assignedOwnerId?: string;
  history: AIOperationsAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AIOperationsComment {
  id: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface AIOperationsAuditEntry {
  at: string;
  actorUserId: string;
  action: string;
  detail?: Record<string, unknown>;
}

export interface AIOperationsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AIOperationsListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  userId?: string;
  businessId?: string;
  provider?: string;
  surface?: string;
  conversationId?: string;
  executionId?: string;
  dateFrom?: string;
  dateTo?: string;
  workflowStatus?: AIEvaluationWorkflowStatus;
  priority?: AIOperationsPriority;
  assignedToUserId?: string;
  correctionStatus?: string;
  regressionStatus?: string;
}

export interface AIExecutionListItem {
  id: string;
  userId: string;
  businessId?: string;
  surface: string;
  userQuery?: string;
  provider?: string;
  model?: string;
  createdAt: string;
  completedAt?: string;
  evaluationCount: number;
  hasOpenEvaluation: boolean;
  hasApproval: boolean;
  errorSummary?: string;
}

export interface AIExecutionDetailView {
  record: import('./ai-intelligence-platform').AIExecutionRecordSnapshot;
  evaluations: AIOperationsEvaluationView[];
  corrections: AIOperationsCorrectionView[];
  regressions: AIOperationsRegressionView[];
  linkedActionExecutions: AIOperationsActionExecutionSummary[];
  promptSummary?: string;
  contextProviders?: string[];
  retrievedSources?: string[];
  diagnostics?: Record<string, unknown>;
  /** Phase 5 — redacted observation event log (live from Runtime Observation Layer) */
  observationEvents?: import('./ai-runtime-observation').AIObservationEvent[];
  /** Phase 5B observation lifecycle state */
  observationState?: string;
  deliveryGuarantee?: string;
  missingTerminalWarning?: boolean;
}

export interface AIOperationsActionExecutionSummary {
  id: string;
  actionName: string;
  status: string;
  riskCategory: string;
  approvalId?: string;
  executed: boolean;
  completedAt?: string;
}

export interface AIOperationsEvaluationView {
  id: string;
  executionRecordId: string;
  evaluatorRole: string;
  labels: string[];
  score?: number;
  notes?: string;
  workflowStatus: AIEvaluationWorkflowStatus;
  /** Phase 6 display-normalized status */
  lifecycleStatus?: AIEvaluationWorkflowStatus;
  assignedToUserId?: string;
  priority?: AIOperationsPriority;
  severity?: string;
  confidence?: number;
  resolutionCode?: string;
  comments: AIOperationsComment[];
  history: AIOperationsAuditEntry[];
  rootCauses: AIOperationsRootCauseView[];
  createdAt: string;
  updatedAt: string;
}

export interface AIOperationsRootCauseView {
  id: string;
  code: string;
  notes?: string;
  reviewStatus: AIRootCauseReviewStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  confidence?: number;
  ownerUserId?: string;
  history: AIOperationsAuditEntry[];
}

export interface AIOperationsCorrectionView {
  id: string;
  executionRecordId: string;
  evaluationId?: string;
  rootCauseCode: string;
  destinations: string[];
  overrideDestinations?: string[];
  status: string;
  routingApprovalStatus: AICorrectionRoutingApprovalStatus;
  assignedOwnerId?: string;
  rationale?: string;
  comments: AIOperationsComment[];
  history?: AIOperationsAuditEntry[];
  workItems?: AICorrectionWorkItemView[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AIOperationsWorkflowReport {
  window: { from: string; to: string };
  openEvaluations: number;
  evaluationsByStatus: Record<string, number>;
  averageResolutionTimeHours: number | null;
  correctionsByDestination: Record<string, number>;
  correctionsByStatus: Record<string, number>;
  rootCausesByCode: Record<string, number>;
  labelTrends: Record<string, number>;
  providerTrends: Record<string, number>;
  workItemsOpen: number;
  regressionsLinked: number;
}

export interface AIOperationsRegressionView {
  id: string;
  executionRecordId: string;
  title: string;
  originalRequest: string;
  status: string;
  ownerUserId?: string;
  priority?: AIOperationsPriority;
  tags: string[];
  expectations: Record<string, unknown>;
  history: AIOperationsAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AIOperationsMetricsResponse {
  window: { from: string; to: string };
  metrics: Array<{
    id: string;
    name: string;
    value: number | null;
    unit: string;
    numerator?: number;
    denominator?: number;
  }>;
  executionVolume: number;
}

export interface AIReplayPreparationRequest {
  executionRecordId: string;
  mode: 'IDENTICAL' | 'DIFFERENT_PROVIDER' | 'DIFFERENT_PROMPT_POLICY' | 'DIFFERENT_MODEL';
  providerOverride?: string;
  modelOverride?: string;
  promptPolicyVersionOverride?: string;
}

export interface AIReplayPreparationPreview {
  executionRecordId: string;
  current: {
    provider?: string;
    model?: string;
    promptPolicyVersion?: string;
    userQuery?: string;
    surface: string;
  };
  proposed: {
    provider?: string;
    model?: string;
    promptPolicyVersion?: string;
    mode: AIReplayPreparationRequest['mode'];
  };
  differences: string[];
  canExecute: false;
  message: string;
}

export interface AIOperationsOverview {
  executionCount: number;
  pendingEvaluations: number;
  openCorrections: number;
  activeRegressions: number;
  recentMetrics: AIOperationsMetricsResponse['metrics'];
}
