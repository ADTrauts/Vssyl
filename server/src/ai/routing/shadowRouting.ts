/**
 * Phase 7 — Shadow routing: propose without changing production selection.
 */
import type {
  AIModelCapability,
  AIModelRouteDecision,
  AIModelRouteRequest,
  AIModelRoutingShadowComparison,
} from 'vssyl-shared';
import { routeModelRequest, twinLikeRouteRequest } from './modelRouter';
import { recordShadowComparison } from './shadowRingBuffer';

export function compareShadowDecision(params: {
  decision: AIModelRouteDecision;
  currentProvider: string;
  currentModel?: string | null;
  surface?: string;
}): AIModelRoutingShadowComparison {
  const currentModel = params.currentModel?.trim() || undefined;
  const providerMatch =
    params.currentProvider.toLowerCase() === params.decision.selectedProvider.toLowerCase();
  const modelMatch = currentModel
    ? currentModel === params.decision.selectedProviderModelId
    : providerMatch;
  const comparison: AIModelRoutingShadowComparison = {
    policyVersion: params.decision.policyVersion,
    requestedCapability: params.decision.capability,
    selectedTier: params.decision.selectedTier,
    currentProvider: params.currentProvider,
    currentModel,
    proposedProvider: params.decision.selectedProvider,
    proposedCatalogKey: params.decision.selectedCatalogKey,
    proposedProviderModelId: params.decision.selectedProviderModelId,
    routingReason: params.decision.routingReason,
    confidence: params.decision.confidence,
    match: providerMatch && (currentModel ? modelMatch : true),
    providerMatch,
    modelMatch,
    candidateModels: params.decision.candidateModels,
    fallbackChain: params.decision.fallbackChain,
    surface: params.surface ?? params.decision.capability,
    recordedAt: new Date().toISOString(),
  };
  recordShadowComparison(comparison);
  return comparison;
}

/**
 * Propose a route for Twin-like signals and compare to current production selection.
 * Never changes what production should use.
 */
export function shadowRouteForTwinSelection(input: {
  query: string;
  complexity?: string;
  preferredProvider?: 'auto' | 'openai' | 'anthropic';
  preferredModel?: string | null;
  currentProvider: string;
  currentModel?: string | null;
  hasVision?: boolean;
}): AIModelRoutingShadowComparison {
  const request = twinLikeRouteRequest(input);
  const decision = routeModelRequest(request);
  return compareShadowDecision({
    decision,
    currentProvider: input.currentProvider,
    currentModel: input.currentModel ?? input.preferredModel,
    surface: 'TWIN',
  });
}

/**
 * Specialized path: call router for capability while production keeps legacy model.
 */
export function shadowRouteForSpecializedPath(params: {
  capability: AIModelCapability;
  currentProvider: string;
  currentModel: string;
  surface: string;
  extra?: Partial<AIModelRouteRequest>;
}): AIModelRoutingShadowComparison {
  const decision = routeModelRequest({
    capability: params.capability,
    surface: params.surface,
    ...params.extra,
  });
  return compareShadowDecision({
    decision,
    currentProvider: params.currentProvider,
    currentModel: params.currentModel,
    surface: params.surface,
  });
}

export function safeShadowRouteForTwinSelection(
  input: Parameters<typeof shadowRouteForTwinSelection>[0]
): AIModelRoutingShadowComparison | undefined {
  try {
    return shadowRouteForTwinSelection(input);
  } catch {
    return undefined;
  }
}
