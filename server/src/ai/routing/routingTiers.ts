/**
 * Phase 7 — Logical routing tiers (not providers).
 */
import type { AIRoutingTier, AIRoutingTierDefinition } from 'vssyl-shared';

export const AI_ROUTING_TIER_DEFINITIONS: Record<AIRoutingTier, AIRoutingTierDefinition> = {
  FAST: {
    id: 'FAST',
    selectionIntent: 'Minimize latency and cost for simple tasks',
    latencyExpectation: 'Low (sub-second to few seconds)',
    qualityExpectation: 'Good enough for tags, titles, short answers',
    costExpectation: 'Lowest unit cost',
    privacyExpectation: 'Standard cloud OK unless flagged sensitive',
  },
  BALANCED: {
    id: 'BALANCED',
    selectionIntent: 'Default Twin conversational quality',
    latencyExpectation: 'Moderate',
    qualityExpectation: 'Strong general assistance + tools',
    costExpectation: 'Standard',
    privacyExpectation: 'Standard cloud OK',
  },
  DEEP: {
    id: 'DEEP',
    selectionIntent: 'Hard reasoning / high consequence analysis',
    latencyExpectation: 'Higher acceptable',
    qualityExpectation: 'Best available reasoning',
    costExpectation: 'Premium',
    privacyExpectation: 'Standard unless elevated',
  },
  SPECIALIZED: {
    id: 'SPECIALIZED',
    selectionIntent: 'Modality or domain-specific models',
    latencyExpectation: 'Varies by modality',
    qualityExpectation: 'Best-in-class for modality',
    costExpectation: 'Modality-priced',
    privacyExpectation: 'Often elevated (media/docs)',
  },
  LOCAL_OR_PRIVATE: {
    id: 'LOCAL_OR_PRIVATE',
    selectionIntent: 'Keep data off external providers',
    latencyExpectation: 'Hardware-bound',
    qualityExpectation: 'Best effort local',
    costExpectation: 'Infra only',
    privacyExpectation: 'Local required',
  },
};

export function getRoutingTierDefinition(id: AIRoutingTier): AIRoutingTierDefinition {
  return AI_ROUTING_TIER_DEFINITIONS[id];
}
