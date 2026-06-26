import type { RetrievedMemoryFact } from '../services/userMemoryFactService.js';
import { mapMemoryFactsToKnowledgeFacts } from './memoryFactMapper.js';
import type { KnowledgeConsumerId, KnowledgeFact } from './knowledgeTypes.js';

/**
 * Map pipeline-retrieved UserMemoryFact rows into KnowledgeFact for composition.
 * Explicit memory → L3; learned → L4 per constitution.
 */
export function mapRetrievedMemoryFactsForCompose(
  facts: RetrievedMemoryFact[],
  userId: string,
  consumer: KnowledgeConsumerId,
  composedAt: string
): KnowledgeFact[] {
  return mapMemoryFactsToKnowledgeFacts(
    facts.map((f) => ({
      id: f.id,
      subject: f.subject,
      predicate: f.predicate,
      isExplicit: f.isExplicit,
      sourceType: f.sourceType,
      confidence: f.confidence,
      userId,
      createdAt: composedAt,
    })),
    consumer,
    composedAt
  );
}
