import type { KnowledgeTier, KnowledgeTrust } from './knowledgeTypes.js';

const TRUST_LABELS: Record<
  KnowledgeTier,
  KnowledgeTrust['label']
> = {
  L0: 'invariant',
  L1: 'delegated_authoritative',
  L2: 'authoritative',
  L3: 'governed',
  L4: 'contextual',
  L5: 'contextual',
  L6: 'hypothesis',
};

/**
 * Resolve trust from tier per KNOWLEDGE_TRUST_MODEL.md.
 * Authorization is resolved separately at compose time via PE gates.
 */
export function resolveTrust(tier: KnowledgeTier, authorized: boolean): KnowledgeTrust {
  return {
    authorized,
    label: TRUST_LABELS[tier],
    fresh: tier !== 'L5',
  };
}

export function tierPrecedence(tier: KnowledgeTier): number {
  const order: Record<KnowledgeTier, number> = {
    L0: 0,
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
    L5: 5,
    L6: 6,
  };
  return order[tier];
}

export function resolveBundleTrustTier(tiers: KnowledgeTier[]): KnowledgeTier {
  if (tiers.length === 0) return 'L6';
  return tiers.reduce((best, current) =>
    tierPrecedence(current) < tierPrecedence(best) ? current : best
  );
}
