/**
 * Phase 7 — Provider-neutral model routing contracts.
 * Runtime callers request capabilities/tiers; only the Model Router resolves provider+model.
 */

export const AI_MODEL_ROUTING_POLICY_VERSION = 'phase7-2026-07-13';

/** Canonical capability taxonomy (provider-agnostic). */
export type AIModelCapability =
  | 'FAST_CHAT'
  | 'BALANCED_CHAT'
  | 'DEEP_REASONING'
  | 'LONG_CONTEXT'
  | 'STRUCTURED_EXTRACTION'
  | 'STRUCTURED_SUMMARY'
  | 'VISION'
  | 'IMAGE_GENERATION'
  | 'IMAGE_EDIT'
  | 'AUDIO_TRANSCRIPTION'
  | 'TEXT_TO_SPEECH'
  | 'EMBEDDINGS'
  | 'LOCAL_PRIVATE';

/** Logical routing tiers — not providers. */
export type AIRoutingTier = 'FAST' | 'BALANCED' | 'DEEP' | 'SPECIALIZED' | 'LOCAL_OR_PRIVATE';

export type AIModelProviderId = 'openai' | 'anthropic' | 'local';

export type AIModelCatalogStatus = 'ACTIVE' | 'DEPRECATED' | 'EXPERIMENTAL' | 'UNAVAILABLE';

export type AIBusinessRoutingPolicyMode =
  | 'INACTIVE'
  | 'FORCE_LOCAL'
  | 'NO_EXTERNAL_AI'
  | 'CHEAPEST'
  | 'HIGHEST_QUALITY'
  | 'PREFERRED_PROVIDER';

export type AIUserRoutingPreference =
  | 'NONE'
  | 'PREFER_FAST'
  | 'PREFER_DEEP'
  | 'PREFER_LOCAL'
  | 'PREFER_CHEAPEST';

export interface AICapabilityDefinition {
  id: AIModelCapability;
  purpose: string;
  requiredFeatures: string[];
  optionalFeatures: string[];
  streaming: boolean;
  vision: boolean;
  structuredOutput: boolean;
  toolCalling: boolean;
  contextWindowHint: string;
  privacyExpectation: 'standard' | 'elevated' | 'local_required';
  defaultTier: AIRoutingTier;
  fallbackPolicy: string;
}

export interface AIRoutingTierDefinition {
  id: AIRoutingTier;
  selectionIntent: string;
  latencyExpectation: string;
  qualityExpectation: string;
  costExpectation: string;
  privacyExpectation: string;
}

export interface AICanonicalModelDefinition {
  /** Internal catalog key (stable). Not for Twin/Business to hardcode. */
  catalogKey: string;
  provider: AIModelProviderId;
  /** Provider-native model identifier — Adapter-only. */
  providerModelId: string;
  label: string;
  capabilities: AIModelCapability[];
  tier: AIRoutingTier;
  costTier: 'free' | 'standard' | 'premium';
  contextLimitTokens?: number;
  maxOutputTokens?: number;
  streaming: boolean;
  vision: boolean;
  structuredOutput: boolean;
  toolSupport: boolean;
  embeddings: boolean;
  audio: boolean;
  image: boolean;
  availability: boolean;
  status: AIModelCatalogStatus;
  version?: string;
  deprecationNote?: string;
  futureReplacementKey?: string;
  queryCost?: number;
}

export interface AIModelRouteRequest {
  capability: AIModelCapability;
  tier?: AIRoutingTier;
  privacySensitive?: boolean;
  requiresVision?: boolean;
  requiresTools?: boolean;
  requiresStructuredOutput?: boolean;
  longContext?: boolean;
  complexity?: 'low' | 'medium' | 'high';
  businessPolicy?: AIBusinessRoutingPolicyMode;
  preferredProvider?: AIModelProviderId | 'auto';
  userPreference?: AIUserRoutingPreference;
  /** Historical prod preference model — used only for shadow comparison context. */
  legacyPreferredModelId?: string | null;
  surface?: string;
}

export interface AIModelRouteCandidate {
  catalogKey: string;
  provider: AIModelProviderId;
  providerModelId: string;
  tier: AIRoutingTier;
  score: number;
  reason: string;
}

export interface AIModelRouteDecision {
  policyVersion: string;
  capability: AIModelCapability;
  selectedTier: AIRoutingTier;
  selectedProvider: AIModelProviderId;
  selectedCatalogKey: string;
  selectedProviderModelId: string;
  fallbackChain: AIModelRouteCandidate[];
  candidateModels: AIModelRouteCandidate[];
  routingReason: string;
  confidence: number;
  businessPolicyApplied: AIBusinessRoutingPolicyMode;
  userPreferenceApplied: AIUserRoutingPreference;
  /** Shadow mode: decision is proposed only; not executed. */
  shadowMode: boolean;
}

export interface AIModelRoutingShadowComparison {
  policyVersion: string;
  requestedCapability: AIModelCapability;
  selectedTier: AIRoutingTier;
  currentProvider: string;
  currentModel?: string;
  proposedProvider: AIModelProviderId;
  proposedCatalogKey: string;
  proposedProviderModelId: string;
  routingReason: string;
  confidence: number;
  match: boolean;
  providerMatch: boolean;
  modelMatch: boolean;
  candidateModels: AIModelRouteCandidate[];
  fallbackChain: AIModelRouteCandidate[];
  surface?: string;
  recordedAt: string;
}

export interface AIModelRoutingOpsOverview {
  policyVersion: string;
  shadowModeEnabled: boolean;
  productionRoutingUnchanged: boolean;
  recentComparisons: number;
  providerMatchRate: number | null;
  modelMatchRate: number | null;
  proposedProviderDistribution: Record<string, number>;
  currentProviderDistribution: Record<string, number>;
  capabilityDistribution: Record<string, number>;
  tierDistribution: Record<string, number>;
}
