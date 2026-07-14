/**
 * Phase 7 — In-process ring buffer of shadow comparisons for Pipeline Ops (observe-only).
 */
import type { AIModelRoutingOpsOverview, AIModelRoutingShadowComparison } from 'vssyl-shared';
import { AI_MODEL_ROUTING_POLICY_VERSION } from 'vssyl-shared';

const MAX = 200;
const buffer: AIModelRoutingShadowComparison[] = [];

export function recordShadowComparison(comparison: AIModelRoutingShadowComparison): void {
  buffer.unshift(comparison);
  if (buffer.length > MAX) buffer.length = MAX;
}

export function listRecentShadowComparisons(limit = 50): AIModelRoutingShadowComparison[] {
  return buffer.slice(0, Math.max(1, Math.min(limit, MAX)));
}

export function getShadowRoutingOverview(): AIModelRoutingOpsOverview {
  const recent = buffer;
  const proposedProviderDistribution: Record<string, number> = {};
  const currentProviderDistribution: Record<string, number> = {};
  const capabilityDistribution: Record<string, number> = {};
  const tierDistribution: Record<string, number> = {};
  let providerMatches = 0;
  let modelMatches = 0;

  for (const c of recent) {
    proposedProviderDistribution[c.proposedProvider] =
      (proposedProviderDistribution[c.proposedProvider] ?? 0) + 1;
    currentProviderDistribution[c.currentProvider] =
      (currentProviderDistribution[c.currentProvider] ?? 0) + 1;
    capabilityDistribution[c.requestedCapability] =
      (capabilityDistribution[c.requestedCapability] ?? 0) + 1;
    tierDistribution[c.selectedTier] = (tierDistribution[c.selectedTier] ?? 0) + 1;
    if (c.providerMatch) providerMatches += 1;
    if (c.modelMatch) modelMatches += 1;
  }

  const n = recent.length;
  return {
    policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
    shadowModeEnabled: true,
    productionRoutingUnchanged: true,
    recentComparisons: n,
    providerMatchRate: n === 0 ? null : Math.round((providerMatches / n) * 1000) / 1000,
    modelMatchRate: n === 0 ? null : Math.round((modelMatches / n) * 1000) / 1000,
    proposedProviderDistribution,
    currentProviderDistribution,
    capabilityDistribution,
    tierDistribution,
  };
}

/** Test helper */
export function clearShadowComparisonsForTests(): void {
  buffer.length = 0;
}
