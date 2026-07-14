/**
 * Phase 5B — Map observation events → execution timeline stages.
 */
import type { AIExecutionTimelineEvent, AIExecutionTimelineStage } from 'vssyl-shared';
import type { AIObservationEvent, AIObservationEventType } from 'vssyl-shared';
import { sortTimeline } from '../intelligence/executionTimeline';

const EVENT_TO_STAGE: Partial<Record<AIObservationEventType, AIExecutionTimelineStage>> = {
  ExecutionStarted: 'REQUEST_RECEIVED',
  ContextSelectionPlanned: 'CONTEXT_BUILT',
  ContextProviderStarted: 'CONTEXT_BUILT',
  ContextProviderCompleted: 'CONTEXT_BUILT',
  ContextProviderFailed: 'CONTEXT_BUILT',
  ContextBuilt: 'CONTEXT_BUILT',
  RetrievalStarted: 'KNOWLEDGE_RETRIEVED',
  RetrievalCompleted: 'KNOWLEDGE_RETRIEVED',
  RetrievalFailed: 'KNOWLEDGE_RETRIEVED',
  EvidenceBundleBuilt: 'KNOWLEDGE_RETRIEVED',
  KnowledgeRetrieved: 'KNOWLEDGE_RETRIEVED',
  GroundingStarted: 'PROMPT_BUILT',
  GroundingEvaluated: 'PROMPT_BUILT',
  EnforcementApplied: 'PROMPT_BUILT',
  ProviderSelected: 'PROVIDER_CALLED',
  ModelRoutingShadowCompared: 'PROVIDER_CALLED',
  ProviderCallStarted: 'PROVIDER_CALLED',
  ProviderCallCompleted: 'PROVIDER_CALLED',
  ProviderCallFailed: 'PROVIDER_CALLED',
  ProviderFallbackStarted: 'PROVIDER_CALLED',
  ProviderFallbackCompleted: 'PROVIDER_CALLED',
  ProviderCompleted: 'PROVIDER_CALLED',
  FileAnalysisStarted: 'CONTEXT_BUILT',
  FileAnalysisCompleted: 'CONTEXT_BUILT',
  FileIssueRecorded: 'CONTEXT_BUILT',
  VisionPrepared: 'PROVIDER_CALLED',
  VisionUsed: 'PROVIDER_CALLED',
  ToolProposed: 'TOOL_PROPOSED',
  ToolAuthorizationEvaluated: 'TOOL_PROPOSED',
  ApprovalRequested: 'APPROVAL',
  ApprovalGranted: 'APPROVAL',
  ApprovalRejected: 'APPROVAL',
  ApprovalExpired: 'APPROVAL',
  ActionExecutionStarted: 'EXECUTION',
  ActionExecutionCompleted: 'EXECUTION',
  ActionExecutionFailed: 'EXECUTION',
  ActionExecutionReplayed: 'EXECUTION',
  ResponseStarted: 'RESPONSE',
  ResponseReturned: 'RESPONSE',
  ExecutionCompleted: 'RESPONSE',
  ExecutionFailed: 'RESPONSE',
  ExecutionCancelled: 'RESPONSE',
  EvaluationAttached: 'EVALUATION',
  CorrectionAttached: 'EVALUATION',
  LearningSignalCreated: 'FEEDBACK',
  LearningProposalCreated: 'FEEDBACK',
  ExplicitMemoryRecorded: 'FEEDBACK',
  QueryBalanceChecked: 'REQUEST_RECEIVED',
  QueryBalanceConsumed: 'REQUEST_RECEIVED',
  UsageRecorded: 'REQUEST_RECEIVED',
  ConversationReasoningCompleted: 'INTENT',
  UnderstandingConfidenceEvaluated: 'INTENT',
};

export function timelineEventsFromObservation(
  events: AIObservationEvent[]
): AIExecutionTimelineEvent[] {
  const mapped: AIExecutionTimelineEvent[] = [];
  for (const event of events) {
    const stage = EVENT_TO_STAGE[event.type];
    if (!stage) continue;
    const meta = event.metadata ?? {};
    const at = event.emittedAt ?? event.timestamp ?? event.observedAt ?? new Date().toISOString();
    mapped.push({
      stage,
      at,
      label: event.type,
      detail: {
        observationType: event.type,
        eventId: event.eventId,
        sequenceNumber: event.sequenceNumber,
        sourceComponent: event.sourceComponent,
        ...meta,
      },
      actionExecutionId:
        typeof meta.actionExecutionId === 'string' ? meta.actionExecutionId : undefined,
      approvalId: typeof meta.approvalId === 'string' ? meta.approvalId : undefined,
    });
  }
  return sortTimeline(mapped);
}
