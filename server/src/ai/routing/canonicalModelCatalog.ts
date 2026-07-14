/**
 * Phase 7 — Canonical model catalog (provider+model are adapters' concern).
 * Supersedes ad-hoc hardcodes for *routing decisions*; legacy chat catalog remains for UI validation.
 */
import type { AICanonicalModelDefinition, AIModelCapability, AIRoutingTier } from 'vssyl-shared';

const CATALOG: AICanonicalModelDefinition[] = [
  {
    catalogKey: 'openai.gpt-4o-mini',
    provider: 'openai',
    providerModelId: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    capabilities: ['FAST_CHAT', 'BALANCED_CHAT', 'STRUCTURED_SUMMARY', 'VISION', 'STRUCTURED_EXTRACTION'],
    tier: 'FAST',
    costTier: 'standard',
    contextLimitTokens: 128_000,
    streaming: true,
    vision: true,
    structuredOutput: true,
    toolSupport: true,
    embeddings: false,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
    queryCost: 1,
  },
  {
    catalogKey: 'openai.gpt-4o',
    provider: 'openai',
    providerModelId: 'gpt-4o',
    label: 'GPT-4o',
    capabilities: [
      'BALANCED_CHAT',
      'DEEP_REASONING',
      'LONG_CONTEXT',
      'VISION',
      'STRUCTURED_EXTRACTION',
      'STRUCTURED_SUMMARY',
    ],
    tier: 'BALANCED',
    costTier: 'premium',
    contextLimitTokens: 128_000,
    streaming: true,
    vision: true,
    structuredOutput: true,
    toolSupport: true,
    embeddings: false,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
    queryCost: 2,
  },
  {
    catalogKey: 'anthropic.claude-3-5-sonnet',
    provider: 'anthropic',
    providerModelId: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    capabilities: ['BALANCED_CHAT', 'DEEP_REASONING', 'LONG_CONTEXT', 'VISION', 'STRUCTURED_SUMMARY'],
    tier: 'DEEP',
    costTier: 'premium',
    contextLimitTokens: 200_000,
    streaming: true,
    vision: true,
    structuredOutput: true,
    toolSupport: false,
    embeddings: false,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
    queryCost: 1,
  },
  {
    catalogKey: 'anthropic.claude-3-haiku',
    provider: 'anthropic',
    providerModelId: 'claude-3-haiku-20240307',
    label: 'Claude 3 Haiku',
    capabilities: ['FAST_CHAT', 'BALANCED_CHAT', 'STRUCTURED_SUMMARY', 'VISION'],
    tier: 'FAST',
    costTier: 'standard',
    contextLimitTokens: 200_000,
    streaming: true,
    vision: true,
    structuredOutput: true,
    toolSupport: false,
    embeddings: false,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
    queryCost: 1,
  },
  {
    catalogKey: 'local.default',
    provider: 'local',
    providerModelId: 'local',
    label: 'Local',
    capabilities: ['LOCAL_PRIVATE', 'FAST_CHAT'],
    tier: 'LOCAL_OR_PRIVATE',
    costTier: 'free',
    streaming: false,
    vision: false,
    structuredOutput: false,
    toolSupport: false,
    embeddings: false,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
    queryCost: 1,
  },
  {
    catalogKey: 'openai.whisper-1',
    provider: 'openai',
    providerModelId: 'whisper-1',
    label: 'Whisper',
    capabilities: ['AUDIO_TRANSCRIPTION'],
    tier: 'SPECIALIZED',
    costTier: 'standard',
    streaming: false,
    vision: false,
    structuredOutput: false,
    toolSupport: false,
    embeddings: false,
    audio: true,
    image: false,
    availability: true,
    status: 'ACTIVE',
  },
  {
    catalogKey: 'openai.dall-e-3',
    provider: 'openai',
    providerModelId: 'dall-e-3',
    label: 'DALL·E 3',
    capabilities: ['IMAGE_GENERATION'],
    tier: 'SPECIALIZED',
    costTier: 'premium',
    streaming: false,
    vision: false,
    structuredOutput: false,
    toolSupport: false,
    embeddings: false,
    audio: false,
    image: true,
    availability: true,
    status: 'ACTIVE',
  },
  {
    catalogKey: 'openai.gpt-image-1',
    provider: 'openai',
    providerModelId: 'gpt-image-1',
    label: 'GPT Image',
    capabilities: ['IMAGE_EDIT', 'IMAGE_GENERATION'],
    tier: 'SPECIALIZED',
    costTier: 'premium',
    streaming: false,
    vision: true,
    structuredOutput: false,
    toolSupport: false,
    embeddings: false,
    audio: false,
    image: true,
    availability: true,
    status: 'ACTIVE',
  },
  {
    catalogKey: 'openai.text-embedding-3-small',
    provider: 'openai',
    providerModelId: 'text-embedding-3-small',
    label: 'Embeddings 3 Small',
    capabilities: ['EMBEDDINGS'],
    tier: 'SPECIALIZED',
    costTier: 'standard',
    streaming: false,
    vision: false,
    structuredOutput: false,
    toolSupport: false,
    embeddings: true,
    audio: false,
    image: false,
    availability: true,
    status: 'ACTIVE',
  },
];

export function listCanonicalModels(): AICanonicalModelDefinition[] {
  return [...CATALOG];
}

export function getCanonicalModelByKey(catalogKey: string): AICanonicalModelDefinition | undefined {
  return CATALOG.find((m) => m.catalogKey === catalogKey);
}

export function getCanonicalModelByProviderModelId(
  providerModelId: string
): AICanonicalModelDefinition | undefined {
  return CATALOG.find((m) => m.providerModelId === providerModelId);
}

export function findModelsForCapability(
  capability: AIModelCapability,
  opts?: { tier?: AIRoutingTier; availableOnly?: boolean }
): AICanonicalModelDefinition[] {
  return CATALOG.filter((m) => {
    if (opts?.availableOnly !== false && (!m.availability || m.status === 'UNAVAILABLE')) {
      return false;
    }
    if (!m.capabilities.includes(capability)) return false;
    if (opts?.tier && m.tier !== opts.tier && opts.tier !== 'SPECIALIZED') {
      // Allow higher-tier models to satisfy lower tier when needed
      const order: AIRoutingTier[] = ['FAST', 'BALANCED', 'DEEP', 'SPECIALIZED', 'LOCAL_OR_PRIVATE'];
      const want = order.indexOf(opts.tier);
      const have = order.indexOf(m.tier);
      if (opts.tier === 'LOCAL_OR_PRIVATE') return m.tier === 'LOCAL_OR_PRIVATE';
      if (have < 0 || want < 0) return m.tier === opts.tier;
      // accept same or "adjacent" for FAST/BALANCED/DEEP
      if (opts.tier === 'FAST') return m.tier === 'FAST' || m.tier === 'BALANCED';
      if (opts.tier === 'BALANCED') return m.tier === 'BALANCED' || m.tier === 'DEEP' || m.tier === 'FAST';
      if (opts.tier === 'DEEP') return m.tier === 'DEEP' || m.tier === 'BALANCED';
    }
    return true;
  });
}
