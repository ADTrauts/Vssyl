/**
 * Model catalog for chat/twin models only.
 * Excludes image-generation (e.g. dall-e-3) and image-edit (e.g. gpt-image-1) models.
 *
 * Used by: GET /api/ai/models (frontend picker), Core model resolution (validation + vision
 * support), and ai-preferences (validate saved model id per provider).
 */

import type { ProviderId } from './capabilities';

export interface ChatModelDefinition {
  id: string;
  provider: ProviderId;
  label: string;
  description: string;
  supportsVision: boolean;
  /** Optional: 'standard' | 'premium' for display/cost tier. */
  costTier?: 'standard' | 'premium';
  /** Queries consumed per request (Phase 6 optional). Default 1. */
  queryCost?: number;
}

const OPENAI_MODELS: ChatModelDefinition[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    label: 'GPT-4o',
    description: 'Best for complex tasks and vision (images)',
    supportsVision: true,
    costTier: 'premium',
    queryCost: 2, // Premium: consumes 2 queries per request
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    label: 'GPT-4o mini',
    description: 'Faster, cost-effective for most queries',
    supportsVision: true,
    costTier: 'standard',
    queryCost: 1,
  },
];

const ANTHROPIC_MODELS: ChatModelDefinition[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    label: 'Claude 3.5 Sonnet',
    description: 'Strong analysis and reasoning, supports vision',
    supportsVision: true,
    costTier: 'premium',
    queryCost: 1,
  },
  {
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    label: 'Claude 3 Haiku',
    description: 'Fast and efficient for straightforward tasks',
    supportsVision: true,
    costTier: 'standard',
    queryCost: 1,
  },
];

const LOCAL_MODELS: ChatModelDefinition[] = [
  {
    id: 'local',
    provider: 'local',
    label: 'Local',
    description: 'On-device processing (no vision)',
    supportsVision: false,
    costTier: 'standard',
    queryCost: 1,
  },
];

const ALL_MODELS: ChatModelDefinition[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...LOCAL_MODELS,
];

const MODELS_BY_PROVIDER: Record<ProviderId, ChatModelDefinition[]> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  local: LOCAL_MODELS,
};

/**
 * Returns chat models for a given provider.
 */
export function getModelsForProvider(provider: ProviderId): ChatModelDefinition[] {
  return MODELS_BY_PROVIDER[provider] ?? [];
}

/**
 * Returns a single model by id, or undefined if not found.
 */
export function getModel(modelId: string): ChatModelDefinition | undefined {
  return ALL_MODELS.find((m) => m.id === modelId);
}

/**
 * Returns true if the model exists and belongs to the given provider.
 */
export function isModelAvailable(modelId: string, provider: ProviderId): boolean {
  const model = getModel(modelId);
  return model !== undefined && model.provider === provider;
}

/**
 * Returns all models grouped by provider for API response.
 */
export function getModelsGroupedByProvider(): Record<ProviderId, ChatModelDefinition[]> {
  return { ...MODELS_BY_PROVIDER };
}

/**
 * Returns the number of queries to consume for a given model id (for quota differentiation).
 * Default 1 if model not in catalog.
 */
export function getQueryCostForModel(modelId: string): number {
  const model = getModel(modelId);
  return model?.queryCost ?? 1;
}
