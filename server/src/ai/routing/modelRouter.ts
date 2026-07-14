/**
 * Phase 7 — Canonical Model Router.
 * Decides provider+model from capability/tier/privacy/policy. Does not execute providers.
 */
import {
  AI_MODEL_ROUTING_POLICY_VERSION,
  type AIModelCapability,
  type AIModelRouteCandidate,
  type AIModelRouteDecision,
  type AIModelRouteRequest,
  type AIRoutingTier,
} from 'vssyl-shared';
import { getCapabilityDefinition } from './capabilityModel';
import { findModelsForCapability, getCanonicalModelByKey } from './canonicalModelCatalog';
import {
  resolveActiveBusinessPolicy,
  resolveActiveUserPreference,
} from './routingPolicy';

function inferCapability(request: Partial<AIModelRouteRequest> & { capability?: AIModelCapability }): AIModelCapability {
  if (request.capability) return request.capability;
  if (request.privacySensitive) return 'LOCAL_PRIVATE';
  if (request.requiresVision) return 'VISION';
  if (request.complexity === 'high') return 'DEEP_REASONING';
  if (request.longContext) return 'LONG_CONTEXT';
  return 'BALANCED_CHAT';
}

function inferTier(
  capability: AIModelCapability,
  request: AIModelRouteRequest
): AIRoutingTier {
  if (request.tier) return request.tier;
  if (request.privacySensitive || request.businessPolicy === 'FORCE_LOCAL' || request.businessPolicy === 'NO_EXTERNAL_AI') {
    return 'LOCAL_OR_PRIVATE';
  }
  if (request.userPreference === 'PREFER_LOCAL') return 'LOCAL_OR_PRIVATE';
  if (request.userPreference === 'PREFER_FAST') return 'FAST';
  if (request.userPreference === 'PREFER_DEEP' || request.complexity === 'high') return 'DEEP';
  return getCapabilityDefinition(capability).defaultTier;
}

function scoreCandidate(
  catalogKey: string,
  request: AIModelRouteRequest,
  tier: AIRoutingTier
): { score: number; reason: string } {
  const model = getCanonicalModelByKey(catalogKey);
  if (!model) return { score: -1, reason: 'missing' };

  let score = 50;
  const reasons: string[] = [];

  if (model.tier === tier) {
    score += 20;
    reasons.push('tier_match');
  }
  if (request.requiresVision && model.vision) {
    score += 15;
    reasons.push('vision');
  }
  if (request.requiresTools && model.toolSupport) {
    score += 15;
    reasons.push('tools');
  } else if (request.requiresTools && !model.toolSupport) {
    score -= 25;
    reasons.push('missing_tools');
  }
  if (request.requiresStructuredOutput && model.structuredOutput) {
    score += 8;
    reasons.push('structured');
  }
  if (request.longContext && (model.contextLimitTokens ?? 0) >= 180_000) {
    score += 10;
    reasons.push('long_context');
  }

  const business = resolveActiveBusinessPolicy(request.businessPolicy);
  if (business === 'FORCE_LOCAL' || business === 'NO_EXTERNAL_AI') {
    if (model.provider === 'local') {
      score += 40;
      reasons.push('business_force_local');
    } else {
      score -= 100;
      reasons.push('business_blocks_external');
    }
  }
  if (business === 'CHEAPEST' || request.userPreference === 'PREFER_CHEAPEST') {
    if (model.costTier === 'standard' || model.costTier === 'free') {
      score += 12;
      reasons.push('cheap');
    } else score -= 5;
  }
  if (business === 'HIGHEST_QUALITY' || request.userPreference === 'PREFER_DEEP') {
    if (model.costTier === 'premium' || model.tier === 'DEEP') {
      score += 12;
      reasons.push('quality');
    }
  }
  if (business === 'PREFERRED_PROVIDER' && request.preferredProvider && request.preferredProvider !== 'auto') {
    if (model.provider === request.preferredProvider) {
      score += 25;
      reasons.push('preferred_provider');
    }
  } else if (request.preferredProvider && request.preferredProvider !== 'auto') {
    if (model.provider === request.preferredProvider) {
      score += 18;
      reasons.push('user_provider_pref');
    }
  }

  if (request.privacySensitive && model.provider !== 'local') {
    score -= 80;
    reasons.push('privacy_penalty');
  }

  return { score, reason: reasons.join(',') || 'baseline' };
}

/**
 * Pure routing decision — never invokes adapters.
 */
export function routeModelRequest(request: AIModelRouteRequest): AIModelRouteDecision {
  const capability = inferCapability(request);
  const businessPolicyApplied = resolveActiveBusinessPolicy(request.businessPolicy);
  const userPreferenceApplied = resolveActiveUserPreference(request.userPreference);
  const selectedTier = inferTier(capability, {
    ...request,
    capability,
    businessPolicy: businessPolicyApplied,
    userPreference: userPreferenceApplied,
  });

  let models = findModelsForCapability(capability, { tier: selectedTier });
  if (models.length === 0) {
    models = findModelsForCapability(capability);
  }
  if (
    (businessPolicyApplied === 'FORCE_LOCAL' ||
      businessPolicyApplied === 'NO_EXTERNAL_AI' ||
      selectedTier === 'LOCAL_OR_PRIVATE' ||
      request.privacySensitive) &&
    models.every((m) => m.provider !== 'local')
  ) {
    models = findModelsForCapability('LOCAL_PRIVATE');
  }

  const scored: AIModelRouteCandidate[] = models
    .map((m) => {
      const { score, reason } = scoreCandidate(m.catalogKey, request, selectedTier);
      return {
        catalogKey: m.catalogKey,
        provider: m.provider,
        providerModelId: m.providerModelId,
        tier: m.tier,
        score,
        reason,
      };
    })
    .filter((c) => c.score >= 0)
    .sort((a, b) => b.score - a.score);

  const selected = scored[0] ?? {
    catalogKey: 'local.default',
    provider: 'local' as const,
    providerModelId: 'local',
    tier: 'LOCAL_OR_PRIVATE' as const,
    score: 0,
    reason: 'empty_catalog_fallback',
  };

  const fallbackChain = scored.slice(1, 4);
  const confidence =
    scored.length === 0
      ? 0.3
      : Math.min(0.99, 0.55 + Math.min(0.4, (selected.score - (scored[1]?.score ?? 0)) / 100));

  return {
    policyVersion: AI_MODEL_ROUTING_POLICY_VERSION,
    capability,
    selectedTier,
    selectedProvider: selected.provider,
    selectedCatalogKey: selected.catalogKey,
    selectedProviderModelId: selected.providerModelId,
    fallbackChain,
    candidateModels: scored.slice(0, 8),
    routingReason: `capability=${capability};tier=${selectedTier};pick=${selected.catalogKey};${selected.reason}`,
    confidence,
    businessPolicyApplied,
    userPreferenceApplied,
    shadowMode: true,
  };
}

/** Map Twin-style selection inputs into a capability request (shadow). */
export function twinLikeRouteRequest(input: {
  query: string;
  complexity?: string;
  preferredProvider?: 'auto' | 'openai' | 'anthropic';
  preferredModel?: string | null;
  hasVision?: boolean;
  privacySensitive?: boolean;
}): AIModelRouteRequest {
  const lower = input.query.toLowerCase();
  const sensitive =
    input.privacySensitive ??
    ['password', 'ssn', 'credit card', 'bank', 'medical', 'health'].some((k) => lower.includes(k));
  const complexity =
    input.complexity === 'high' ? 'high' : input.complexity === 'low' ? 'low' : 'medium';

  let capability: AIModelCapability = 'BALANCED_CHAT';
  if (sensitive) capability = 'LOCAL_PRIVATE';
  else if (input.hasVision) capability = 'VISION';
  else if (complexity === 'high') capability = 'DEEP_REASONING';
  else if (complexity === 'low') capability = 'FAST_CHAT';

  return {
    capability,
    complexity,
    privacySensitive: sensitive,
    requiresVision: Boolean(input.hasVision),
    requiresTools: capability === 'BALANCED_CHAT' || capability === 'DEEP_REASONING',
    preferredProvider: input.preferredProvider,
    legacyPreferredModelId: input.preferredModel,
    surface: 'TWIN',
  };
}
