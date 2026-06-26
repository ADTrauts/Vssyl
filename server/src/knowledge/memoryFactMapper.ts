import { assignConfidence } from './confidenceAssigner.js';
import { resolveConsumerEligibilityForElement } from './consumerEligibility.js';
import { resolveTrust } from './trustResolver.js';
import type {
  KnowledgeConsumerId,
  KnowledgeFact,
  KnowledgeOrigin,
  KnowledgeProvenance,
  KnowledgeTier,
  ProvenanceActor,
} from './knowledgeTypes.js';

export interface MemoryFactComposeInput {
  id: string;
  subject: string;
  predicate: string;
  sourceType?: string;
  isExplicit?: boolean;
  confidence?: number;
  createdAt: Date | string;
  userId: string;
}

function mapMemoryTier(input: MemoryFactComposeInput): KnowledgeTier {
  if (input.isExplicit === true) return 'L3';
  if (input.sourceType === 'user_explicit' || input.sourceType === 'manual') return 'L3';
  return 'L4';
}

function mapMemoryOrigin(input: MemoryFactComposeInput): KnowledgeOrigin {
  const tier = mapMemoryTier(input);
  return tier === 'L3' ? 'user_memory_explicit' : 'user_memory_learned';
}

/**
 * Map UserMemoryFact rows to KnowledgeFact for bundle composition.
 * Facts are adjacent knowledge — not graph edges per constitution.
 */
export function mapMemoryFactToKnowledgeFact(
  input: MemoryFactComposeInput,
  consumer: KnowledgeConsumerId,
  composedAt: string
): KnowledgeFact {
  const tier = mapMemoryTier(input);
  const origin = mapMemoryOrigin(input);
  const assertedAt =
    input.createdAt instanceof Date ? input.createdAt.toISOString() : input.createdAt;

  const actor: ProvenanceActor = {
    type: 'user',
    id: input.userId,
  };

  const provenance: KnowledgeProvenance = {
    tier,
    origin,
    assertedAt,
    verifiedAt: composedAt,
    actor,
    sourceSystem: 'user_memory',
    relationshipSource: {
      relationshipClass: 'ai_context',
      sorRef: { store: 'memory', recordId: input.id },
    },
  };

  return {
    factId: input.id,
    content: `${input.subject} ${input.predicate}`.trim(),
    provenance,
    confidence: assignConfidence({ tier, origin, normalizedScore: input.confidence }),
    trust: resolveTrust(tier, true),
    consumerEligibility: resolveConsumerEligibilityForElement(tier, consumer),
  };
}

export function mapMemoryFactsToKnowledgeFacts(
  inputs: MemoryFactComposeInput[],
  consumer: KnowledgeConsumerId,
  composedAt: string
): KnowledgeFact[] {
  return inputs.map((f) => mapMemoryFactToKnowledgeFact(f, consumer, composedAt));
}
