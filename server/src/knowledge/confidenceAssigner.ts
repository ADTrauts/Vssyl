import type { KnowledgeConfidence, KnowledgeOrigin, KnowledgeTier } from './knowledgeTypes.js';

/**
 * Assign constitutional confidence tier per KNOWLEDGE_CONFIDENCE_MODEL.md.
 * Confidence is epistemic weight only — never permission.
 */
export function assignConfidence(params: {
  tier: KnowledgeTier;
  origin: KnowledgeOrigin;
  normalizedScore?: number;
}): KnowledgeConfidence {
  const { tier, origin, normalizedScore } = params;

  if (tier === 'L0' || tier === 'L3') {
    return 'C1';
  }

  if (tier === 'L1') {
    return normalizedScore !== undefined && normalizedScore < 0.5 ? 'C4' : 'C2';
  }

  if (tier === 'L2') {
    return 'C2';
  }

  if (tier === 'L4') {
    return normalizedScore !== undefined && normalizedScore >= 0.6 ? 'C3' : 'C4';
  }

  if (tier === 'L6') {
    if (origin === 'search_discovery') {
      return 'C4';
    }
    if (normalizedScore !== undefined && normalizedScore >= 0.5) {
      return 'C3';
    }
    return 'C4';
  }

  if (tier === 'L5') {
    return 'C4';
  }

  return 'C3';
}
