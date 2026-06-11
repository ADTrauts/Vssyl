/**
 * Canonical LLM provider capability matrix (Wave 1E).
 * Single source of truth for routing, fallback, GET /api/ai/models, and diagnostics.
 */

export type ProviderId = 'openai' | 'anthropic' | 'local';

export const PROVIDER_CAPABILITY_MATRIX_VERSION = '1e-2026-06-03';

export type LlmCapability =
  | 'chat'
  | 'streaming'
  | 'structured_output'
  | 'tool_calls'
  | 'vision'
  | 'embeddings'
  | 'reasoning_metadata';

export interface ProviderVisionCapabilitySpec {
  supportsVisionInput: boolean;
  supportsImageGeneration?: boolean;
  supportsImageEdit?: boolean;
  visionModel?: string;
  maxImageCount: number;
  maxImageBytes?: number;
  supportedImageTypes?: string[];
}

export interface ProviderCapabilityDefinition {
  providerId: ProviderId;
  displayName: string;
  capabilities: Record<LlmCapability, boolean>;
  fallbackEligible: boolean;
  maxTokensDefault: number;
  contextLimitTokens?: number;
  defaultCostTier: 'free' | 'standard' | 'premium';
  vision: ProviderVisionCapabilitySpec;
}

const OPENAI_MATRIX: ProviderCapabilityDefinition = {
  providerId: 'openai',
  displayName: 'OpenAI',
  capabilities: {
    chat: true,
    streaming: true,
    structured_output: true,
    tool_calls: true,
    vision: true,
    embeddings: true,
    reasoning_metadata: false,
  },
  fallbackEligible: true,
  maxTokensDefault: 1000,
  contextLimitTokens: 128_000,
  defaultCostTier: 'premium',
  vision: {
    supportsVisionInput: true,
    supportsImageGeneration: true,
    supportsImageEdit: true,
    visionModel: 'gpt-4o',
    maxImageCount: 5,
    maxImageBytes: 5 * 1024 * 1024,
  },
};

const ANTHROPIC_MATRIX: ProviderCapabilityDefinition = {
  providerId: 'anthropic',
  displayName: 'Anthropic',
  capabilities: {
    chat: true,
    streaming: true,
    structured_output: true,
    tool_calls: false,
    vision: true,
    embeddings: false,
    reasoning_metadata: false,
  },
  fallbackEligible: true,
  maxTokensDefault: 1000,
  contextLimitTokens: 200_000,
  defaultCostTier: 'premium',
  vision: {
    supportsVisionInput: true,
    visionModel: 'claude-3-5-sonnet-20241022',
    maxImageCount: 5,
    maxImageBytes: 5 * 1024 * 1024,
    supportedImageTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  },
};

const LOCAL_MATRIX: ProviderCapabilityDefinition = {
  providerId: 'local',
  displayName: 'Local',
  capabilities: {
    chat: true,
    streaming: false,
    structured_output: false,
    tool_calls: false,
    vision: false,
    embeddings: false,
    reasoning_metadata: false,
  },
  fallbackEligible: false,
  maxTokensDefault: 2000,
  defaultCostTier: 'free',
  vision: {
    supportsVisionInput: false,
    maxImageCount: 0,
  },
};

export const PROVIDER_CAPABILITY_MATRIX: Record<ProviderId, ProviderCapabilityDefinition> = {
  openai: OPENAI_MATRIX,
  anthropic: ANTHROPIC_MATRIX,
  local: LOCAL_MATRIX,
};

export const REGISTERED_LLM_PROVIDER_IDS: ProviderId[] = ['openai', 'anthropic', 'local'];

export function getProviderCapabilityDefinition(
  providerId: ProviderId
): ProviderCapabilityDefinition {
  return PROVIDER_CAPABILITY_MATRIX[providerId];
}

export function providerSupportsCapability(
  providerId: ProviderId,
  capability: LlmCapability
): boolean {
  return PROVIDER_CAPABILITY_MATRIX[providerId]?.capabilities[capability] ?? false;
}

export function isFallbackEligibleProvider(providerId: ProviderId): boolean {
  return PROVIDER_CAPABILITY_MATRIX[providerId]?.fallbackEligible ?? false;
}

export interface ProviderCapabilityRequirements {
  vision?: boolean;
  toolCalls?: boolean;
  streaming?: boolean;
  structuredOutput?: boolean;
}

export function providerMeetsRequirements(
  providerId: ProviderId,
  requirements: ProviderCapabilityRequirements
): { ok: boolean; missing: LlmCapability[] } {
  const missing: LlmCapability[] = [];
  if (requirements.vision && !providerSupportsCapability(providerId, 'vision')) {
    missing.push('vision');
  }
  if (requirements.toolCalls && !providerSupportsCapability(providerId, 'tool_calls')) {
    missing.push('tool_calls');
  }
  if (requirements.streaming && !providerSupportsCapability(providerId, 'streaming')) {
    missing.push('streaming');
  }
  if (requirements.structuredOutput && !providerSupportsCapability(providerId, 'structured_output')) {
    missing.push('structured_output');
  }
  return { ok: missing.length === 0, missing };
}

/** Public summary for GET /api/ai/models and admin diagnostics (no secrets). */
export interface PublicProviderCapabilitySummary {
  providerId: ProviderId;
  displayName: string;
  capabilities: Record<LlmCapability, boolean>;
  fallbackEligible: boolean;
  maxTokensDefault: number;
  contextLimitTokens?: number;
  defaultCostTier: 'free' | 'standard' | 'premium';
  vision: ProviderVisionCapabilitySpec;
}

export function getPublicProviderCapabilitySummaries(): PublicProviderCapabilitySummary[] {
  return REGISTERED_LLM_PROVIDER_IDS.map((id) => {
    const def = PROVIDER_CAPABILITY_MATRIX[id];
    return {
      providerId: def.providerId,
      displayName: def.displayName,
      capabilities: { ...def.capabilities },
      fallbackEligible: def.fallbackEligible,
      maxTokensDefault: def.maxTokensDefault,
      contextLimitTokens: def.contextLimitTokens,
      defaultCostTier: def.defaultCostTier,
      vision: { ...def.vision },
    };
  });
}
