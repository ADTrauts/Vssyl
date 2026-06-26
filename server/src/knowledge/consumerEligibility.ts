import type { ConsumerEligibility, KnowledgeConsumerId, KnowledgeTier } from './knowledgeTypes.js';

const AI_CONSUMERS: KnowledgeConsumerId[] = [
  'project_assistant',
  'planning',
  'business_operations',
  'local_discovery',
  'ai_pipeline',
];

const UI_CONSUMERS: KnowledgeConsumerId[] = ['hub_ui', 'api_client'];

const DISCLOSURE_TIERS: KnowledgeTier[] = ['L4', 'L6'];

function tiersForConsumer(consumer: KnowledgeConsumerId): KnowledgeTier[] {
  switch (consumer) {
    case 'admin_diagnostic':
      return ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
    case 'search':
      return ['L0', 'L1', 'L2', 'L3', 'L6'];
    case 'hub_ui':
      return ['L0', 'L1', 'L2', 'L3', 'L5'];
    default:
      if (AI_CONSUMERS.includes(consumer)) {
        return ['L0', 'L1', 'L2', 'L3', 'L4', 'L6'];
      }
      if (UI_CONSUMERS.includes(consumer)) {
        return ['L0', 'L1', 'L2', 'L3'];
      }
      return ['L0', 'L1', 'L2', 'L3', 'L4', 'L6'];
  }
}

export function isTierEligibleForConsumer(tier: KnowledgeTier, consumer: KnowledgeConsumerId): boolean {
  if (tier === 'L5' && consumer !== 'hub_ui' && consumer !== 'admin_diagnostic') {
    return false;
  }
  return tiersForConsumer(consumer).includes(tier);
}

export function resolveConsumerEligibilityForElement(
  tier: KnowledgeTier,
  consumer: KnowledgeConsumerId
): ConsumerEligibility[] {
  const eligible = isTierEligibleForConsumer(tier, consumer);
  const entry: ConsumerEligibility = {
    consumer,
    allowedTiers: eligible ? [tier] : [],
    requiresDisclosure: DISCLOSURE_TIERS.includes(tier),
  };

  if (consumer === 'admin_diagnostic') {
    return [entry];
  }

  return eligible ? [entry] : [];
}

export function filterElementsForConsumer<T extends { provenance: { tier: KnowledgeTier } }>(
  elements: T[],
  consumer: KnowledgeConsumerId
): T[] {
  return elements.filter((el) => isTierEligibleForConsumer(el.provenance.tier, consumer));
}
