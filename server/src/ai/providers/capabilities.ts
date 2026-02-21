/**
 * Provider capability declaration for vision and multimodal support.
 * Used to select vision-capable models and to decide when to send image parts.
 */

export interface ProviderVisionCapability {
  supportsVisionInput: boolean;
  /** Optional: true when provider supports image generation (e.g. DALL·E). */
  supportsImageGeneration?: boolean;
  /** Optional: true when provider supports image edit (e.g. remove background). Phase 8. */
  supportsImageEdit?: boolean;
  /** Model id to use when vision is used. Must exist in modelCatalog with supportsVision: true. */
  visionModel?: string;
  maxImageCount: number;
  maxImageBytes?: number;
  /** MIME types accepted for images (e.g. Anthropic: png, jpeg, gif, webp only). */
  supportedImageTypes?: Set<string>;
}

export type ProviderId = 'openai' | 'anthropic' | 'local';

const OPENAI_VISION: ProviderVisionCapability = {
  supportsVisionInput: true,
  supportsImageGeneration: true,
  supportsImageEdit: true,
  visionModel: 'gpt-4o',
  maxImageCount: 5,
  maxImageBytes: 5 * 1024 * 1024,
};

const ANTHROPIC_VISION: ProviderVisionCapability = {
  supportsVisionInput: true,
  visionModel: 'claude-3-5-sonnet-20241022',
  maxImageCount: 5,
  maxImageBytes: 5 * 1024 * 1024,
  supportedImageTypes: new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
};

const LOCAL_VISION: ProviderVisionCapability = {
  supportsVisionInput: false,
  maxImageCount: 0,
};

/**
 * Returns vision (and related) capabilities for the given provider.
 * Used by Core for model selection and logging when vision parts are present.
 */
export function getProviderCapabilities(provider: ProviderId): ProviderVisionCapability {
  switch (provider) {
    case 'openai':
      return OPENAI_VISION;
    case 'anthropic':
      return ANTHROPIC_VISION;
    case 'local':
      return LOCAL_VISION;
    default:
      return LOCAL_VISION;
  }
}
