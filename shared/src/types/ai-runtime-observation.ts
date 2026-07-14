/**
 * Phase 5 / 5B — Runtime Observation event contracts.
 * Twin emits these; observation consumes them. Twin must not import AIExecutionRecord.
 */

/** Schema version for observation event envelope (bump on breaking envelope changes). */
export const AI_OBSERVATION_EVENT_SCHEMA_VERSION = 2 as const;

export type AIObservationEventType =
  // Request lifecycle
  | 'ExecutionStarted'
  | 'ResponseStarted'
  | 'ResponseReturned'
  | 'ExecutionCompleted'
  | 'ExecutionFailed'
  | 'ExecutionCancelled'
  // Understanding
  | 'ConversationReasoningCompleted'
  | 'UnderstandingConfidenceEvaluated'
  // Context
  | 'ContextSelectionPlanned'
  | 'ContextProviderStarted'
  | 'ContextProviderCompleted'
  | 'ContextProviderFailed'
  | 'ContextBuilt'
  // Retrieval
  | 'RetrievalStarted'
  | 'RetrievalCompleted'
  | 'RetrievalFailed'
  | 'EvidenceBundleBuilt'
  | 'KnowledgeRetrieved'
  // Grounding
  | 'GroundingStarted'
  | 'GroundingEvaluated'
  | 'EnforcementApplied'
  // Provider
  | 'ProviderSelected'
  | 'ProviderCallStarted'
  | 'ProviderCallCompleted'
  | 'ProviderCallFailed'
  | 'ProviderFallbackStarted'
  | 'ProviderFallbackCompleted'
  | 'ProviderCompleted' // legacy Phase 5 alias retained
  /** Phase 7 — shadow router vs current selection (observe-only) */
  | 'ModelRoutingShadowCompared'
  // Files / vision
  | 'FileAnalysisStarted'
  | 'FileAnalysisCompleted'
  | 'FileIssueRecorded'
  | 'VisionPrepared'
  | 'VisionUsed'
  // Tools / actions
  | 'ToolProposed'
  | 'ToolAuthorizationEvaluated'
  | 'ApprovalRequested'
  | 'ApprovalGranted'
  | 'ApprovalRejected'
  | 'ApprovalExpired'
  | 'ActionExecutionStarted'
  | 'ActionExecutionCompleted'
  | 'ActionExecutionFailed'
  | 'ActionExecutionReplayed'
  // Knowledge / learning
  | 'ExplicitMemoryRecorded'
  | 'LearningSignalCreated'
  | 'LearningProposalCreated'
  // Billing / usage
  | 'QueryBalanceChecked'
  | 'QueryBalanceConsumed'
  | 'UsageRecorded'
  // Operator attach (observe-only)
  | 'EvaluationAttached'
  | 'CorrectionAttached';

export type AIObservationSurface =
  | 'TWIN'
  | 'ACTION_EXECUTOR'
  | 'TEST_LAB'
  | 'BUSINESS_INTERACT'
  | 'GOVERNANCE'
  | 'OTHER';

export type AIObservationDeliveryClass = 'DURABLE_BOUNDED' | 'ASYNC_AT_LEAST_ONCE';

export type AIObservationRetentionClass = 'HOT' | 'ARCHIVE' | 'PURGE_ELIGIBLE';

/** Observation-side turn lifecycle (not AIActionExecution status). */
export type AIObservationExecutionState =
  | 'STARTED'
  | 'CONTEXT_BUILDING'
  | 'RETRIEVING'
  | 'GROUNDING'
  | 'PROVIDER_RUNNING'
  | 'AWAITING_TOOL'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING_ACTION'
  | 'RESPONDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIAL';

export type AIObservationHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'DISABLED';

export interface AIObservationEvent {
  /** Stable identity across retries — unique in store */
  eventId: string;
  /** Schema version of this envelope */
  eventVersion: number;
  /** Correlation id for the turn (Twin requestId) */
  requestId: string;
  /** Hub id once known */
  executionRecordId?: string;
  /** Alias used in docs: executionId === executionRecordId */
  executionId?: string;
  /** Monotonic-ish ordering key within requestId */
  sequenceNumber: number;
  /** Emitter wall clock */
  emittedAt: string;
  /** Collector observe clock */
  observedAt?: string;
  /** @deprecated Phase 5 field — prefer emittedAt */
  timestamp?: string;
  type: AIObservationEventType;
  eventType?: AIObservationEventType; // alias
  surface: AIObservationSurface;
  sourceComponent?: string;
  conversationId?: string;
  userId: string;
  businessId?: string;
  deliveryClass?: AIObservationDeliveryClass;
  retentionClass?: AIObservationRetentionClass;
  correlationIds?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface AIObservationEmitInput {
  requestId: string;
  type: AIObservationEventType;
  /** Stable across retries when provided */
  eventId?: string;
  eventVersion?: number;
  sequenceNumber?: number;
  surface?: AIObservationSurface;
  sourceComponent?: string;
  conversationId?: string;
  userId: string;
  businessId?: string | null;
  metadata?: Record<string, unknown>;
  /** @deprecated use emittedAt */
  timestamp?: string;
  emittedAt?: string;
  deliveryClass?: AIObservationDeliveryClass;
  retentionClass?: AIObservationRetentionClass;
  correlationIds?: Record<string, string>;
  /** Extra key folded into deterministic eventId when eventId omitted */
  idempotencyKey?: string;
}

export interface AIObservationHealthSnapshot {
  status: AIObservationHealthStatus;
  enabled: boolean;
  deliveryGuarantee: string;
  emitted: number;
  persisted: number;
  dropped: number;
  duplicates: number;
  redactionFailures: number;
  persistenceFailures: number;
  persistenceTimeouts: number;
  queueDepth: number;
  bufferedRequestCount: number;
  avgCollectorLatencyMs: number;
  avgFlushLatencyMs: number;
  executionsMissingTerminal: number;
  timelineRebuildFailures: number;
  retentionBacklog: number;
  redactionEnabled: boolean;
}

/** Retention policy definition. */
export interface AIObservationRetentionPolicy {
  version: 'phase5b-v1';
  hotRetentionDays: number;
  archiveAfterDays: number;
  purgeAfterDays: number;
  exportSupported: boolean;
  /** Cron may exist but remains disabled until explicitly enabled */
  scheduledJobsImplemented: boolean;
  scheduledJobsEnabledByDefault: false;
  notes: string[];
}

export const AI_OBSERVATION_RETENTION_POLICY: AIObservationRetentionPolicy = {
  version: 'phase5b-v1',
  hotRetentionDays: 30,
  archiveAfterDays: 90,
  purgeAfterDays: 365,
  exportSupported: true,
  scheduledJobsImplemented: true,
  scheduledJobsEnabledByDefault: false,
  notes: [
    'Hot store: AIObservationEvent rows + AIExecutionRecord hub summary',
    'Phase 5 JSON observationEventsJson retained for backward compatibility / rebuild cache',
    'Archive/purge via observationRetentionService; cron disabled unless AI_OBSERVATION_RETENTION_CRON_ENABLED=true',
    'Admin dry-run purge available on operations API',
    'Knowledge stays scoped; observation must not promote private knowledge globally',
  ],
};

export const AI_OBSERVATION_DELIVERY_GUARANTEE_LABEL =
  'Hybrid: durable terminals (bounded) · at-least-once mid-events';
