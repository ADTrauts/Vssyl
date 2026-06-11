/**
 * Provider capability declaration for vision and multimodal support.
 * Wave 1E: vision fields sourced from providerCapabilityMatrix.
 */

import {
  getProviderCapabilityDefinition,
  type ProviderId,
} from './providerCapabilityMatrix';

export type { ProviderId };

export interface ProviderVisionCapability {
  supportsVisionInput: boolean;
  supportsImageGeneration?: boolean;
  supportsImageEdit?: boolean;
  visionModel?: string;
  maxImageCount: number;
  maxImageBytes?: number;
  supportedImageTypes?: Set<string>;
}

function toVisionCapability(providerId: ProviderId): ProviderVisionCapability {
  const vision = getProviderCapabilityDefinition(providerId).vision;
  return {
    supportsVisionInput: vision.supportsVisionInput,
    supportsImageGeneration: vision.supportsImageGeneration,
    supportsImageEdit: vision.supportsImageEdit,
    visionModel: vision.visionModel,
    maxImageCount: vision.maxImageCount,
    maxImageBytes: vision.maxImageBytes,
    supportedImageTypes: vision.supportedImageTypes
      ? new Set(vision.supportedImageTypes)
      : undefined,
  };
}

/**
 * Returns vision (and related) capabilities for the given provider.
 */
export function getProviderCapabilities(provider: ProviderId): ProviderVisionCapability {
  if (provider === 'openai' || provider === 'anthropic' || provider === 'local') {
    return toVisionCapability(provider);
  }
  return toVisionCapability('local');
}
