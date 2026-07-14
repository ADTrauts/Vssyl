/**
 * Phase 3 — AI Intelligence Platform contracts.
 * Observational only: records, evaluations, root causes, correction routing,
 * regression cases, metrics, replay, and explainability.
 * Does not execute tools, route providers, or mutate Twin runtime.
 */

/** Canonical identifier for one AI interaction (observability hub). */
export type AIExecutionRecordId = string;

/** Surfaces that can produce an execution record (observe existing runtimes). */
export type AIExecutionSurface =
  | 'TWIN'
  | 'ACTION_EXECUTOR'
  | 'TEST_LAB'
  | 'BUSINESS_INTERACT'
  | 'OTHER';

/** Reconstructable timeline stages for one execution. */
export type AIExecutionTimelineStage =
  | 'REQUEST_RECEIVED'
  | 'INTENT'
  | 'CONTEXT_BUILT'
  | 'KNOWLEDGE_RETRIEVED'
  | 'PROMPT_BUILT'
  | 'PROVIDER_CALLED'
  | 'TOOL_PROPOSED'
  | 'APPROVAL'
  | 'EXECUTION'
  | 'ACTIVITY'
  | 'RESPONSE'
  | 'FEEDBACK'
  | 'EVALUATION';

export interface AIExecutionTimelineEvent {
  stage: AIExecutionTimelineStage;
  at: string; // ISO
  label?: string;
  detail?: Record<string, unknown>;
  /** Optional link to AIActionExecution.id for mutation stages */
  actionExecutionId?: string;
  approvalId?: string;
}

/**
 * Snapshot of linked artifacts for one execution.
 * Reuses existing stores — does not duplicate their payloads.
 */
export interface AIExecutionLinkedArtifacts {
  conversationHistoryId?: string;
  pipelineDiagnosticId?: string;
  conversationId?: string;
  requestId?: string;
  approvalIds?: string[];
  actionExecutionIds?: string[];
  activityIds?: string[];
  notificationIds?: string[];
  learningEventIds?: string[];
}

export interface AIExecutionUsageSnapshot {
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  provider?: string;
  model?: string;
}

export interface AIExecutionRecordSnapshot {
  id: AIExecutionRecordId;
  userId: string;
  businessId?: string;
  surface: AIExecutionSurface;
  userQuery?: string;
  aiResponseSummary?: string;
  provider?: string;
  model?: string;
  routingSummary?: Record<string, unknown>;
  linked: AIExecutionLinkedArtifacts;
  timeline: AIExecutionTimelineEvent[];
  usage?: AIExecutionUsageSnapshot;
  errorSummary?: string;
  diagnosticsSummary?: Record<string, unknown>;
  learningSignalsSummary?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

/** Evaluation labels — never auto-mutate runtime. */
export type AIEvaluationLabel =
  | 'HELPFUL'
  | 'INCORRECT'
  | 'UNSAFE'
  | 'INCOMPLETE'
  | 'WRONG_SOURCE'
  | 'WRONG_RETRIEVAL'
  | 'WRONG_TOOL'
  | 'WRONG_MEMORY'
  | 'WRONG_REASONING'
  | 'WRONG_PERMISSION'
  | 'WRONG_BUSINESS_DATA'
  | 'OTHER';

export type AIEvaluatorRole =
  | 'USER'
  | 'BUSINESS_ADMIN'
  | 'VSSYL_OPERATOR'
  | 'SYSTEM';

export interface AIEvaluationInput {
  executionRecordId: AIExecutionRecordId;
  evaluatorRole: AIEvaluatorRole;
  evaluatorUserId?: string;
  labels: AIEvaluationLabel[];
  score?: number; // optional 0–1 or 1–10; caller-defined scale in notes
  notes?: string;
  rootCauses?: AIRootCauseCode[];
}

export type AIRootCauseCode =
  | 'PROVIDER'
  | 'PROMPT'
  | 'RETRIEVAL'
  | 'KNOWLEDGE'
  | 'CONTEXT'
  | 'GROUNDING'
  | 'BUSINESS_DATA'
  | 'PERSONAL_MEMORY'
  | 'TOOL'
  | 'APPROVAL'
  | 'AUTHORIZATION'
  | 'SOURCE_OF_RECORD'
  | 'HALLUCINATION'
  | 'MISSING_CONTEXT'
  | 'AMBIGUOUS_PROMPT'
  | 'USER_ERROR'
  | 'ROUTING'
  | 'OTHER';

/** Where a correction should be handled — not auto-applied. */
export type AICorrectionDestination =
  | 'CALENDAR_MODULE'
  | 'DRIVE_MODULE'
  | 'CHAT_MODULE'
  | 'TODO_MODULE'
  | 'HR_MODULE'
  | 'MEMORY_REVIEW'
  | 'PERSONAL_MEMORY'
  | 'BUSINESS_ADMIN'
  | 'KNOWLEDGE_ENGINE'
  | 'PROMPT_POLICY'
  | 'TOOL_OWNER'
  | 'ROUTING_POLICY'
  | 'GROUNDING_POLICY'
  | 'AUTHORIZATION_POLICY'
  | 'APPROVAL_POLICY'
  | 'SOURCE_OF_RECORD_OWNER'
  | 'USER_EDUCATION'
  | 'OPERATOR_TRIAGE'
  | 'NONE';

export type AICorrectionRouteStatus =
  | 'OPEN'
  | 'ROUTED'
  | 'IN_PROGRESS'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'RESOLVED'
  | 'DEFERRED'
  | 'WONT_FIX'
  | 'DUPLICATE'
  | 'NOT_REPRODUCIBLE'
  | 'NEEDS_INFORMATION'
  | 'ARCHIVED'
  | 'REJECTED';

export interface AICorrectionRoutePlan {
  rootCause: AIRootCauseCode;
  destinations: AICorrectionDestination[];
  rationale: string;
}

export interface AIRegressionCaseExpectation {
  expectedBehavior?: string;
  expectedSources?: string[];
  expectedTools?: string[];
  expectedPermissions?: string[];
  expectedGrounding?: string;
  expectedUncertainty?: string;
  expectedResponseProperties?: Record<string, unknown>;
}

export interface AIRegressionCaseInput {
  executionRecordId: AIExecutionRecordId;
  title: string;
  originalRequest: string;
  expectations: AIRegressionCaseExpectation;
  evaluationId?: string;
  correctionRouteId?: string;
  tags?: string[];
}

export type AIRegressionCaseStatus = 'DRAFT' | 'ACTIVE' | 'PASSING' | 'FAILING' | 'RETIRED';

/** Replay contract — design only; no executor in Phase 3. */
export interface AIExecutionReplayRequest {
  executionRecordId: AIExecutionRecordId;
  mode: 'IDENTICAL' | 'DIFFERENT_PROVIDER' | 'DIFFERENT_PROMPT_POLICY' | 'DIFFERENT_MODEL';
  providerOverride?: string;
  modelOverride?: string;
  promptPolicyVersionOverride?: string;
  /** When true, must not mutate production data — replay sandboxes only. */
  dryRun: true;
  /** Replay must still use AIActionExecution for any mutating tools. */
  respectGovernedExecution: true;
}

export interface AIExecutionReplayContract {
  version: 'phase3-v1';
  description: string;
  requestShape: AIExecutionReplayRequest;
  constraints: string[];
  nonGoals: string[];
}

/** Explainability — architecture decisions, not private chain-of-thought. */
export interface AIExecutionExplanation {
  executionRecordId: AIExecutionRecordId;
  whyThisAnswer: string;
  sourcesUsed: string[];
  toolsUsed: string[];
  whyToolNotUsed?: string[];
  whyMemoryNotUsed?: string[];
  whyApprovalRequired?: string[];
  whyProviderSelected?: string;
  groundingNotes?: string[];
  /** Explicit fence: never include raw model CoT / private reasoning. */
  excludesPrivateReasoning: true;
}

/** Metric definitions (no charting). */
export type AIPlatformMetricId =
  | 'hallucination_rate'
  | 'correction_rate'
  | 'approval_rate'
  | 'tool_success_rate'
  | 'tool_failure_rate'
  | 'provider_quality_score'
  | 'provider_latency_p50_ms'
  | 'provider_latency_p95_ms'
  | 'retrieval_failure_rate'
  | 'grounding_failure_rate'
  | 'conversation_quality_score'
  | 'evaluation_score_avg'
  | 'business_satisfaction_avg'
  | 'memory_correction_rate'
  | 'knowledge_promotion_rate'
  | 'regression_pass_rate';

export interface AIPlatformMetricDefinition {
  id: AIPlatformMetricId;
  name: string;
  description: string;
  unit: 'ratio' | 'score' | 'milliseconds' | 'count';
  /** How numerator/denominator are derived from intelligence stores. */
  aggregation: string;
  /** Knowledge must stay scoped — metrics never promote private facts. */
  knowledgeScoped: true;
}

export const AI_PLATFORM_METRIC_DEFINITIONS: readonly AIPlatformMetricDefinition[] = [
  {
    id: 'hallucination_rate',
    name: 'Hallucination rate',
    description: 'Share of evaluations with HALLUCINATION root cause or UNSAFE/INCORRECT + grounding failure signals.',
    unit: 'ratio',
    aggregation: 'count(evals with rootCause HALLUCINATION) / count(evals)',
    knowledgeScoped: true,
  },
  {
    id: 'correction_rate',
    name: 'Correction rate',
    description: 'Share of executions that received a non-HELPFUL evaluation or correction route.',
    unit: 'ratio',
    aggregation: 'count(executions with correction) / count(executions)',
    knowledgeScoped: true,
  },
  {
    id: 'approval_rate',
    name: 'Approval rate',
    description: 'Share of mutating tool proposals that entered AWAITING_APPROVAL.',
    unit: 'ratio',
    aggregation: 'count(timeline APPROVAL) / count(timeline TOOL_PROPOSED)',
    knowledgeScoped: true,
  },
  {
    id: 'tool_success_rate',
    name: 'Tool success rate',
    description: 'Share of linked AIActionExecution rows completed successfully.',
    unit: 'ratio',
    aggregation: 'count(actionExecutions COMPLETED) / count(actionExecutions)',
    knowledgeScoped: true,
  },
  {
    id: 'tool_failure_rate',
    name: 'Tool failure rate',
    description: 'Share of linked AIActionExecution rows FAILED or REJECTED.',
    unit: 'ratio',
    aggregation: 'count(FAILED|REJECTED) / count(actionExecutions)',
    knowledgeScoped: true,
  },
  {
    id: 'provider_quality_score',
    name: 'Provider quality score',
    description: 'Average evaluation score grouped by provider.',
    unit: 'score',
    aggregation: 'avg(evaluation.score) by provider',
    knowledgeScoped: true,
  },
  {
    id: 'provider_latency_p50_ms',
    name: 'Provider latency p50',
    description: 'Median latencyMs from usage snapshot by provider.',
    unit: 'milliseconds',
    aggregation: 'percentile_50(usage.latencyMs) by provider',
    knowledgeScoped: true,
  },
  {
    id: 'provider_latency_p95_ms',
    name: 'Provider latency p95',
    description: 'p95 latencyMs from usage snapshot by provider.',
    unit: 'milliseconds',
    aggregation: 'percentile_95(usage.latencyMs) by provider',
    knowledgeScoped: true,
  },
  {
    id: 'retrieval_failure_rate',
    name: 'Retrieval failure rate',
    description: 'Share of evaluations with WRONG_RETRIEVAL or root cause RETRIEVAL.',
    unit: 'ratio',
    aggregation: 'count(retrieval failures) / count(evals with retrieval attempted)',
    knowledgeScoped: true,
  },
  {
    id: 'grounding_failure_rate',
    name: 'Grounding failure rate',
    description: 'Share of evaluations with GROUNDING root cause or grounding diagnostics issues.',
    unit: 'ratio',
    aggregation: 'count(grounding failures) / count(evals)',
    knowledgeScoped: true,
  },
  {
    id: 'conversation_quality_score',
    name: 'Conversation quality score',
    description: 'Average USER evaluation score per conversation.',
    unit: 'score',
    aggregation: 'avg(USER evaluation.score) by conversationId',
    knowledgeScoped: true,
  },
  {
    id: 'evaluation_score_avg',
    name: 'Evaluation score average',
    description: 'Mean evaluation score across all evaluator roles.',
    unit: 'score',
    aggregation: 'avg(evaluation.score)',
    knowledgeScoped: true,
  },
  {
    id: 'business_satisfaction_avg',
    name: 'Business satisfaction average',
    description: 'Mean BUSINESS_ADMIN evaluation score.',
    unit: 'score',
    aggregation: 'avg(score where evaluatorRole=BUSINESS_ADMIN)',
    knowledgeScoped: true,
  },
  {
    id: 'memory_correction_rate',
    name: 'Memory correction rate',
    description: 'Share of corrections routed to MEMORY_REVIEW or PERSONAL_MEMORY.',
    unit: 'ratio',
    aggregation: 'count(routes to memory) / count(correction routes)',
    knowledgeScoped: true,
  },
  {
    id: 'knowledge_promotion_rate',
    name: 'Knowledge promotion rate',
    description: 'Platform intelligence promotions only — never copies user knowledge globally. Counts operator-approved knowledge-engine corrections.',
    unit: 'ratio',
    aggregation: 'count(KNOWLEDGE_ENGINE resolved) / count(KNOWLEDGE_ENGINE routes)',
    knowledgeScoped: true,
  },
  {
    id: 'regression_pass_rate',
    name: 'Regression pass rate',
    description: 'Share of ACTIVE regression cases marked PASSING (CI not wired in Phase 3).',
    unit: 'ratio',
    aggregation: 'count(PASSING) / count(ACTIVE|PASSING|FAILING)',
    knowledgeScoped: true,
  },
] as const;

/** Default timeline order for reconstruction. */
export const AI_EXECUTION_TIMELINE_ORDER: readonly AIExecutionTimelineStage[] = [
  'REQUEST_RECEIVED',
  'INTENT',
  'CONTEXT_BUILT',
  'KNOWLEDGE_RETRIEVED',
  'PROMPT_BUILT',
  'PROVIDER_CALLED',
  'TOOL_PROPOSED',
  'APPROVAL',
  'EXECUTION',
  'ACTIVITY',
  'RESPONSE',
  'FEEDBACK',
  'EVALUATION',
] as const;
