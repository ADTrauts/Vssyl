import type { PipelineIntentId } from '../types/pipelineDiagnostics';
import type { AIRetrievalConsumerIntent, AIRetrievalPathway } from './aiRetrievalTypes';
import { detectQueryDiscoverySignals } from './queryDiscoverySignals';

/** Canonical retrieval pathway (Phase 1B). */
export const AI_RETRIEVAL_PATHWAY: AIRetrievalPathway = 'unified_search';

/**
 * Intents that consume the Retrieval Adapter in pipeline grounding (priority order).
 * First match wins when multiple consumer intents are detected.
 * `general_discovery` is query-native fallback (Wave 3).
 */
export const RETRIEVAL_ADAPTER_CONSUMER_INTENTS: readonly AIRetrievalConsumerIntent[] = [
  'workflow_action',
  'business_operations',
  'project_assistant',
  'local_discovery',
  'planning',
  'general_discovery',
] as const;

/** Documented future consumers — not yet first-class pipeline intents. */
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
  general_discovery: 12,
};

export function resolveRetrievalConsumerIntent(
  inferredIntents: PipelineIntentId[],
  userMessage?: string
): AIRetrievalConsumerIntent | undefined {
  for (const consumerIntent of RETRIEVAL_ADAPTER_CONSUMER_INTENTS) {
    if (consumerIntent === 'general_discovery') {
      continue;
    }
    if (inferredIntents.includes(consumerIntent)) {
      return consumerIntent;
    }
  }

  if (inferredIntents.includes('research')) {
    return 'general_discovery';
  }

  const querySignals = detectQueryDiscoverySignals(userMessage ?? '');
  if (querySignals.eligible) {
    return 'general_discovery';
  }

  return undefined;
}

export function isQueryNativeDiscoveryIntent(intent: AIRetrievalConsumerIntent): boolean {
  return intent === 'general_discovery';
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
  if (intent === 'project_assistant' && process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED === 'false') {
    return false;
  }
  if (intent === 'local_discovery' && process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED === 'false') {
    return false;
  }
  if (intent === 'general_discovery' && process.env.AI_RETRIEVAL_GENERAL_DISCOVERY_ENABLED === 'false') {
    return false;
  }
  return true;
}

/** @deprecated Use isRetrievalConsumerEnabled for intent-specific checks. */
export function isAiRetrievalDiscoveryPilotEnabled(): boolean {
  return process.env.AI_RETRIEVAL_DISCOVERY_ENABLED !== 'false';
}
