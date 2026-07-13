/**
 * Phase 3 — Timeline builders (pure). Reconstructable execution timeline.
 */
import {
  AI_EXECUTION_TIMELINE_ORDER,
  type AIExecutionTimelineEvent,
  type AIExecutionTimelineStage,
} from 'vssyl-shared';

export interface TimelineSeed {
  requestReceivedAt?: string;
  intentAt?: string;
  intentLabels?: string[];
  contextBuiltAt?: string;
  knowledgeRetrievedAt?: string;
  knowledgeSummary?: Record<string, unknown>;
  promptBuiltAt?: string;
  providerCalledAt?: string;
  provider?: string;
  model?: string;
  toolProposedAt?: string;
  tools?: string[];
  approvalAt?: string;
  approvalId?: string;
  executionAt?: string;
  actionExecutionIds?: string[];
  activityAt?: string;
  activityIds?: string[];
  responseAt?: string;
  feedbackAt?: string;
  evaluationAt?: string;
}

function pushIf(
  events: AIExecutionTimelineEvent[],
  stage: AIExecutionTimelineStage,
  at: string | undefined,
  detail?: Record<string, unknown>,
  extra?: Partial<AIExecutionTimelineEvent>
): void {
  if (!at) return;
  events.push({
    stage,
    at,
    detail,
    ...extra,
  });
}

/** Build a timeline from known stage timestamps (observer input). */
export function buildExecutionTimeline(seed: TimelineSeed): AIExecutionTimelineEvent[] {
  const events: AIExecutionTimelineEvent[] = [];
  pushIf(events, 'REQUEST_RECEIVED', seed.requestReceivedAt);
  pushIf(events, 'INTENT', seed.intentAt, seed.intentLabels ? { intents: seed.intentLabels } : undefined);
  pushIf(events, 'CONTEXT_BUILT', seed.contextBuiltAt);
  pushIf(events, 'KNOWLEDGE_RETRIEVED', seed.knowledgeRetrievedAt, seed.knowledgeSummary);
  pushIf(events, 'PROMPT_BUILT', seed.promptBuiltAt);
  pushIf(events, 'PROVIDER_CALLED', seed.providerCalledAt, {
    provider: seed.provider,
    model: seed.model,
  });
  pushIf(events, 'TOOL_PROPOSED', seed.toolProposedAt, seed.tools ? { tools: seed.tools } : undefined);
  pushIf(events, 'APPROVAL', seed.approvalAt, undefined, { approvalId: seed.approvalId });
  pushIf(
    events,
    'EXECUTION',
    seed.executionAt,
    seed.actionExecutionIds ? { actionExecutionIds: seed.actionExecutionIds } : undefined,
    seed.actionExecutionIds?.[0] ? { actionExecutionId: seed.actionExecutionIds[0] } : undefined
  );
  pushIf(events, 'ACTIVITY', seed.activityAt, seed.activityIds ? { activityIds: seed.activityIds } : undefined);
  pushIf(events, 'RESPONSE', seed.responseAt);
  pushIf(events, 'FEEDBACK', seed.feedbackAt);
  pushIf(events, 'EVALUATION', seed.evaluationAt);
  return sortTimeline(events);
}

export function sortTimeline(events: AIExecutionTimelineEvent[]): AIExecutionTimelineEvent[] {
  const order = new Map(AI_EXECUTION_TIMELINE_ORDER.map((s, i) => [s, i]));
  return [...events].sort((a, b) => {
    const byTime = a.at.localeCompare(b.at);
    if (byTime !== 0) return byTime;
    return (order.get(a.stage) ?? 99) - (order.get(b.stage) ?? 99);
  });
}

export function appendTimelineEvent(
  events: AIExecutionTimelineEvent[],
  event: AIExecutionTimelineEvent
): AIExecutionTimelineEvent[] {
  return sortTimeline([...events, event]);
}

/** Minimal timeline for a completed Twin-like turn without tool use. */
export function buildSimpleTurnTimeline(params: {
  startedAt: string;
  completedAt: string;
  provider?: string;
  model?: string;
  intents?: string[];
}): AIExecutionTimelineEvent[] {
  return buildExecutionTimeline({
    requestReceivedAt: params.startedAt,
    intentAt: params.startedAt,
    intentLabels: params.intents,
    contextBuiltAt: params.startedAt,
    promptBuiltAt: params.startedAt,
    providerCalledAt: params.startedAt,
    provider: params.provider,
    model: params.model,
    responseAt: params.completedAt,
  });
}
