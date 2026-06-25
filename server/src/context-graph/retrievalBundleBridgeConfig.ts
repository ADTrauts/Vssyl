import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';

/** Minimum normalized confidence for evidence to become inference bundle nodes. */
export const RETRIEVAL_INFERENCE_MIN_CONFIDENCE = 0.2;

/** Default confidence when search score is absent but permissions are verified. */
export const RETRIEVAL_INFERENCE_DEFAULT_CONFIDENCE = 0.5;

/** Wave 3 — all wired retrieval consumers may use the bridge when enabled. */
export const RETRIEVAL_BUNDLE_BRIDGE_CONSUMER_INTENTS: readonly AIRetrievalConsumerIntent[] = [
  'workflow_action',
  'business_operations',
  'project_assistant',
  'local_discovery',
  'planning',
  'general_discovery',
] as const;

/**
 * Feature flag: CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
 * Wave 3: all wired consumer intents (not project_assistant pilot only).
 */
export function isRetrievalBundleBridgeEnabled(
  consumerIntent?: AIRetrievalConsumerIntent
): boolean {
  if (process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED !== 'true') {
    return false;
  }
  if (!consumerIntent) {
    return false;
  }
  return RETRIEVAL_BUNDLE_BRIDGE_CONSUMER_INTENTS.includes(consumerIntent);
}
