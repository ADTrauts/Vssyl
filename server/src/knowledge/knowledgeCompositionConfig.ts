import type { KnowledgeConsumerId } from './knowledgeTypes.js';

/** Pilot consumers that receive composed Knowledge Bundles (Phase 1A). */
export const KNOWLEDGE_COMPOSITION_PILOT_CONSUMERS: readonly KnowledgeConsumerId[] = [
  'project_assistant',
  'planning',
  'business_operations',
  'local_discovery',
] as const;

/**
 * Feature flag: KNOWLEDGE_COMPOSITION_ENABLED=true
 * When enabled, pilot consumers receive KnowledgeBundle instead of assembling evidence independently.
 */
export function isKnowledgeCompositionEnabled(consumer?: KnowledgeConsumerId): boolean {
  if (process.env.KNOWLEDGE_COMPOSITION_ENABLED !== 'true') {
    return false;
  }
  if (!consumer) {
    return false;
  }
  if (consumer === 'ai_pipeline' || consumer === 'admin_diagnostic') {
    return true;
  }
  return KNOWLEDGE_COMPOSITION_PILOT_CONSUMERS.includes(consumer);
}

export function mapRetrievalConsumerToKnowledgeConsumer(
  retrievalIntent: string | undefined
): KnowledgeConsumerId | undefined {
  if (!retrievalIntent) return undefined;
  const pilot = retrievalIntent as KnowledgeConsumerId;
  if (KNOWLEDGE_COMPOSITION_PILOT_CONSUMERS.includes(pilot)) {
    return pilot;
  }
  return undefined;
}
