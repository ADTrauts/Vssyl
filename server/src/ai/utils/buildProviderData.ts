/**
 * Maps Digital Life Twin provider options into the payload passed to AI providers.
 */

export interface BuildProviderDataInput {
  options: Record<string, unknown>;
}

/**
 * Build providerData for OpenAI/Anthropic/Local providers from twin call options.
 */
export function buildProviderData(input: BuildProviderDataInput): Record<string, unknown> {
  const { options } = input;
  const providerData: Record<string, unknown> = {};

  if (options.visionImageParts && Array.isArray(options.visionImageParts) && (options.visionImageParts as unknown[]).length > 0) {
    providerData.visionImageParts = options.visionImageParts;
  }
  if (options.traceContext && typeof options.traceContext === 'object') {
    providerData.traceContext = options.traceContext;
  }
  if (options.visionModelOverride && typeof options.visionModelOverride === 'string') {
    providerData.visionModelOverride = options.visionModelOverride;
  }
  if (options.modelOverride && typeof options.modelOverride === 'string') {
    providerData.modelOverride = options.modelOverride;
  }
  if (options.stream === true && typeof options.onChunk === 'function') {
    providerData.stream = true;
    providerData.onChunk = options.onChunk;
  }
  if (options.assembledContext && typeof options.assembledContext === 'object') {
    providerData.assembledContext = options.assembledContext;
  }

  const assembled =
    providerData.assembledContext && typeof providerData.assembledContext === 'object'
      ? (providerData.assembledContext as Record<string, unknown>)
      : undefined;

  const structuredFromOptions =
    typeof options.structuredResponseMode === 'string' ? options.structuredResponseMode : undefined;
  const structuredFromAssembled =
    assembled && typeof assembled.structuredResponseMode === 'string'
      ? assembled.structuredResponseMode
      : undefined;
  providerData.structuredResponseMode = structuredFromOptions ?? structuredFromAssembled;

  const densityFromOptions =
    typeof options.responseDensity === 'string' ? options.responseDensity : undefined;
  const densityFromAssembled =
    assembled && typeof assembled.responseDensity === 'string' ? assembled.responseDensity : undefined;
  providerData.responseDensity = densityFromOptions ?? densityFromAssembled;

  if (typeof options.responseMode === 'string' && options.responseMode.trim()) {
    providerData.responseMode = options.responseMode;
  }

  if (typeof options.userQuery === 'string' && options.userQuery.trim()) {
    providerData.userQuery = options.userQuery.trim();
  }

  if (typeof options.promptProfile === 'string' && options.promptProfile.trim()) {
    providerData.promptProfile = options.promptProfile;
  }

  if (Array.isArray(options.conversationHistory) && options.conversationHistory.length > 0) {
    providerData.conversationHistory = options.conversationHistory;
  }

  if (options.conversationThread && typeof options.conversationThread === 'object') {
    providerData.conversationThread = options.conversationThread;
  }

  return providerData;
}
