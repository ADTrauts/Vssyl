import type { AIRetrievalConsumerIntent } from '../ai/retrieval/aiRetrievalTypes.js';

/** Minimum normalized confidence for evidence to become inference bundle nodes. */
export const RETRIEVAL_INFERENCE_MIN_CONFIDENCE = 0.2;

/** Default confidence when search score is absent but permissions are verified. */
export const RETRIEVAL_INFERENCE_DEFAULT_CONFIDENCE = 0.5;

/** Phase 1A pilot consumer — highest cross-module relationship density. */
export const RETRIEVAL_BUNDLE_BRIDGE_PILOT_INTENT: AIRetrievalConsumerIntent = 'project_assistant';

/**
 * Feature flag: CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED=true
 * Pilot scope: project_assistant only (Phase 1A).
 */
export function isRetrievalBundleBridgeEnabled(
  consumerIntent?: AIRetrievalConsumerIntent
): boolean {
  if (process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED !== 'true') {
    return false;
  }
  return consumerIntent === RETRIEVAL_BUNDLE_BRIDGE_PILOT_INTENT;
}
