import type { KnowledgeConsumerId } from './knowledgeTypes.js';
import { isKnowledgeCompositionEnabled } from './knowledgeCompositionConfig.js';

/** Phase 1B pilot consumers that receive Knowledge Neighborhoods. */
export const KNOWLEDGE_CONVERGENCE_PILOT_CONSUMERS: readonly KnowledgeConsumerId[] = [
  'project_assistant',
  'planning',
  'business_operations',
] as const;

/**
 * Feature flag: KNOWLEDGE_CONVERGENCE_ENABLED=true
 * Requires KNOWLEDGE_COMPOSITION_ENABLED=true.
 */
export function isKnowledgeConvergenceEnabled(consumer?: KnowledgeConsumerId): boolean {
  if (process.env.KNOWLEDGE_CONVERGENCE_ENABLED !== 'true') {
    return false;
  }
  if (!consumer || !isKnowledgeCompositionEnabled(consumer)) {
    return false;
  }
  return KNOWLEDGE_CONVERGENCE_PILOT_CONSUMERS.includes(consumer);
}
