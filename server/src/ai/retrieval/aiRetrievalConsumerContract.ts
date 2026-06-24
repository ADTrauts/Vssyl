import type { PipelineIntentId } from '../types/pipelineDiagnostics';
import type { AIRetrievalConsumerIntent, AIRetrievalPathway } from './aiRetrievalTypes';

/** Canonical retrieval pathway (Phase 1B). */
export const AI_RETRIEVAL_PATHWAY: AIRetrievalPathway = 'unified_search';

/**
 * Intents that consume the Retrieval Adapter in pipeline grounding (priority order).
 * First match wins when multiple consumer intents are detected.
 */
export const RETRIEVAL_ADAPTER_CONSUMER_INTENTS: readonly AIRetrievalConsumerIntent[] = [
  'workflow_action',
  'business_operations',
  'project_assistant',
  'local_discovery',
  'planning',
] as const;

/** Future consumers documented in AI_RETRIEVAL_CONSUMER_STANDARD.md — not yet wired. */
export const RETRIEVAL_ADAPTER_PLANNED_INTENTS: readonly AIRetrievalConsumerIntent[] = [
  'scheduling',
] as const;

const CONSUMER_LIMITS: Record<AIRetrievalConsumerIntent, number> = {
  workflow_action: 10,
  planning: 8,
  business_operations: 10,
  scheduling: 8,
  local_discovery: 12,
  project_assistant: 10,
  general_discovery: 10,
};

export function resolveRetrievalConsumerIntent(
  inferredIntents: PipelineIntentId[]
): AIRetrievalConsumerIntent | undefined {
  for (const consumerIntent of RETRIEVAL_ADAPTER_CONSUMER_INTENTS) {
    if (inferredIntents.includes(consumerIntent)) {
      return consumerIntent;
    }
  }
  return undefined;
}

export function getRetrievalLimitForIntent(intent: AIRetrievalConsumerIntent): number {
  return CONSUMER_LIMITS[intent] ?? 10;
}

export function isRetrievalConsumerEnabled(intent: AIRetrievalConsumerIntent): boolean {
  if (process.env.AI_RETRIEVAL_DISCOVERY_ENABLED === 'false') {
    return false;
  }
  if (intent === 'workflow_action' && process.env.AI_RETRIEVAL_WORKFLOW_ACTION_ENABLED === 'false') {
    return false;
  }
  if (intent === 'planning' && process.env.AI_RETRIEVAL_PLANNING_ENABLED === 'false') {
    return false;
  }
  if (
    intent === 'business_operations' &&
    process.env.AI_RETRIEVAL_BUSINESS_OPERATIONS_ENABLED === 'false'
  ) {
    return false;
  }
  if (intent === 'project_assistant') {
    return process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED === 'true';
  }
  if (intent === 'local_discovery') {
    return process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED === 'true';
  }
  return true;
}

/** @deprecated Use isRetrievalConsumerEnabled for intent-specific checks. */
export function isAiRetrievalDiscoveryPilotEnabled(): boolean {
  return process.env.AI_RETRIEVAL_DISCOVERY_ENABLED !== 'false';
}
