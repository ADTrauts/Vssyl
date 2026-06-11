/**
 * LLM provider selection and fallback (Wave 1E).
 * Uses providerCapabilityMatrix as the single source of truth.
 */

import { getModel } from './modelCatalog';
import type { ProviderId } from './capabilities';
import {
  getProviderCapabilityDefinition,
  getPublicProviderCapabilitySummaries,
  isFallbackEligibleProvider,
  providerMeetsRequirements,
  providerSupportsCapability,
  type ProviderCapabilityRequirements,
  PROVIDER_CAPABILITY_MATRIX_VERSION,
} from './providerCapabilityMatrix';

export type PreferredLlmProvider = 'auto' | 'openai' | 'anthropic';

export type LlmProviderRoutingPhase =
  | 'requested'
  | 'selected'
  | 'vision_adjusted'
  | 'fallback'
  | 'fallback_blocked'
  | 'capability_warning';

export interface LlmProviderRoutingDiagnostic {
  phase: LlmProviderRoutingPhase;
  requestedProvider?: string;
  requestedModel?: string;
  selectedProvider: string;
  selectedModel?: string;
  fallbackReason?: string;
  capabilityConstraints?: string[];
  unsupportedCapabilities?: string[];
  warnings?: string[];
}

export interface LlmProviderRoutingRecord {
  matrixVersion: string;
  requestedProvider?: string;
  requestedModel?: string;
  selectedProvider: ProviderId;
  selectedModel?: string;
  effectiveProvider?: ProviderId;
  fallbackApplied: boolean;
  fallbackReason?: string;
  capabilityWarnings: string[];
  diagnostics: LlmProviderRoutingDiagnostic[];
}

export interface ProviderSelectionInput {
  query: string;
  complexity: string;
  preferredProvider?: PreferredLlmProvider;
  preferredModel?: string | null;
}

export interface ProviderSelectionResult {
  provider: ProviderId;
  routing: LlmProviderRoutingRecord;
}

export interface VisionModelResolution {
  modelOverride: string | null;
  stripVisionParts: boolean;
  warnings: string[];
  diagnostic?: LlmProviderRoutingDiagnostic;
}

export interface FallbackResolution {
  fallbackProvider: ProviderId;
  stripTools: boolean;
  stripVisionParts: boolean;
  warnings: string[];
  diagnostic: LlmProviderRoutingDiagnostic;
}

const SENSITIVE_KEYWORDS = ['password', 'ssn', 'credit card', 'bank', 'medical', 'health'];

function containsSensitiveContent(query: string): boolean {
  const lower = query.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function emptyRoutingRecord(
  requestedProvider?: string,
  requestedModel?: string
): LlmProviderRoutingRecord {
  return {
    matrixVersion: PROVIDER_CAPABILITY_MATRIX_VERSION,
    requestedProvider,
    requestedModel,
    selectedProvider: 'openai',
    fallbackApplied: false,
    capabilityWarnings: [],
    diagnostics: [],
  };
}

function pushDiagnostic(
  record: LlmProviderRoutingRecord,
  diagnostic: LlmProviderRoutingDiagnostic
): void {
  record.diagnostics.push(diagnostic);
}

/**
 * Initial provider selection (replaces inline selectAIProvider logic).
 */
export function selectLlmProvider(input: ProviderSelectionInput): ProviderSelectionResult {
  const requestedProvider =
    input.preferredProvider && input.preferredProvider !== 'auto'
      ? input.preferredProvider
      : undefined;
  const requestedModel = input.preferredModel?.trim() || undefined;
  const record = emptyRoutingRecord(requestedProvider, requestedModel);

  if (requestedProvider || requestedModel) {
    pushDiagnostic(record, {
      phase: 'requested',
      requestedProvider,
      requestedModel,
      selectedProvider: requestedProvider ?? 'auto',
      selectedModel: requestedModel,
    });
  }

  let provider: ProviderId;

  if (containsSensitiveContent(input.query)) {
    provider = 'local';
    pushDiagnostic(record, {
      phase: 'selected',
      requestedProvider,
      selectedProvider: provider,
      fallbackReason: 'sensitive_content',
      capabilityConstraints: ['local_only_for_sensitive_queries'],
    });
  } else if (requestedProvider) {
    provider = requestedProvider;
    pushDiagnostic(record, {
      phase: 'selected',
      requestedProvider,
      requestedModel,
      selectedProvider: provider,
      selectedModel: requestedModel,
      capabilityConstraints: ['user_preference'],
    });
  } else if (input.complexity === 'high') {
    provider = 'anthropic';
    pushDiagnostic(record, {
      phase: 'selected',
      selectedProvider: provider,
      capabilityConstraints: ['complexity_high'],
    });
  } else {
    provider = 'openai';
    pushDiagnostic(record, {
      phase: 'selected',
      selectedProvider: provider,
      capabilityConstraints: ['complexity_default'],
    });
  }

  record.selectedProvider = provider;
  return { provider, routing: record };
}

/**
 * Resolve vision-capable model override; strip vision when provider cannot support it.
 */
export function resolveVisionModelForProvider(
  provider: ProviderId,
  preferredModel: string | null,
  hasVisionParts: boolean,
  routing: LlmProviderRoutingRecord
): VisionModelResolution {
  if (!hasVisionParts) {
    const modelOverride =
      preferredModel && (provider === 'openai' || provider === 'anthropic')
        ? preferredModel
        : null;
    if (modelOverride) {
      routing.selectedModel = modelOverride;
    }
    return { modelOverride, stripVisionParts: false, warnings: [] };
  }

  const def = getProviderCapabilityDefinition(provider);
  if (!def.capabilities.vision || !def.vision.supportsVisionInput) {
    const warnings = [`Provider ${provider} does not support vision; using file summaries only`];
    routing.capabilityWarnings.push(...warnings);
    pushDiagnostic(routing, {
      phase: 'capability_warning',
      selectedProvider: provider,
      unsupportedCapabilities: ['vision'],
      warnings,
    });
    return { modelOverride: null, stripVisionParts: true, warnings };
  }

  const visionModel = def.vision.visionModel;
  const preferredSupportsVision = preferredModel
    ? (getModel(preferredModel)?.supportsVision ?? false)
    : false;
  const modelOverride =
    preferredSupportsVision && preferredModel ? preferredModel : visionModel ?? null;

  if (modelOverride) {
    routing.selectedModel = modelOverride;
    pushDiagnostic(routing, {
      phase: 'vision_adjusted',
      selectedProvider: provider,
      selectedModel: modelOverride,
      capabilityConstraints: preferredSupportsVision
        ? ['preferred_model_supports_vision']
        : ['matrix_vision_model'],
    });
  }

  return { modelOverride, stripVisionParts: false, warnings: [] };
}

const CLOUD_FALLBACK_PAIR: Record<'openai' | 'anthropic', ProviderId> = {
  openai: 'anthropic',
  anthropic: 'openai',
};

/**
 * Resolve cross-cloud fallback when primary returns rate limit / unavailable.
 * Returns null when fallback would violate required capabilities.
 */
export function resolveLlmFallback(
  primary: ProviderId,
  reason: string,
  requirements: ProviderCapabilityRequirements,
  routing: LlmProviderRoutingRecord
): FallbackResolution | null {
  if (primary !== 'openai' && primary !== 'anthropic') {
    pushDiagnostic(routing, {
      phase: 'fallback_blocked',
      selectedProvider: primary,
      fallbackReason: reason,
      warnings: ['Fallback not applicable for non-cloud primary provider'],
    });
    return null;
  }

  const fallbackProvider = CLOUD_FALLBACK_PAIR[primary as 'openai' | 'anthropic'];
  if (!isFallbackEligibleProvider(fallbackProvider)) {
    return null;
  }

  const { ok, missing } = providerMeetsRequirements(fallbackProvider, requirements);
  if (!ok) {
    const warnings = [
      `Fallback to ${fallbackProvider} blocked: missing capabilities ${missing.join(', ')}`,
    ];
    routing.capabilityWarnings.push(...warnings);
    pushDiagnostic(routing, {
      phase: 'fallback_blocked',
      selectedProvider: primary,
      fallbackReason: reason,
      unsupportedCapabilities: missing,
      warnings,
    });
    return null;
  }

  const stripTools = Boolean(requirements.toolCalls) && !providerSupportsCapability(fallbackProvider, 'tool_calls');
  const stripVisionParts =
    Boolean(requirements.vision) && !providerSupportsCapability(fallbackProvider, 'vision');

  const warnings: string[] = [];
  if (stripTools) warnings.push('Tool calls stripped on fallback provider');
  if (stripVisionParts) warnings.push('Vision parts stripped on fallback provider');
  routing.capabilityWarnings.push(...warnings);

  routing.fallbackApplied = true;
  routing.fallbackReason = reason;
  routing.effectiveProvider = fallbackProvider;

  const diagnostic: LlmProviderRoutingDiagnostic = {
    phase: 'fallback',
    selectedProvider: primary,
    requestedProvider: routing.requestedProvider,
    requestedModel: routing.requestedModel,
    selectedModel: routing.selectedModel,
    fallbackReason: reason,
    capabilityConstraints: requirements.toolCalls ? ['tool_calls'] : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
  pushDiagnostic(routing, diagnostic);

  return {
    fallbackProvider,
    stripTools,
    stripVisionParts,
    warnings,
    diagnostic,
  };
}

export function finalizeRoutingEffectiveProvider(
  routing: LlmProviderRoutingRecord,
  effectiveProvider: ProviderId
): void {
  routing.effectiveProvider = effectiveProvider;
}

/** Payload for GET /api/ai/models — models + canonical capabilities. */
export function buildModelsApiPayload(modelsByProvider: Record<ProviderId, unknown[]>) {
  return {
    models: modelsByProvider,
    providers: getPublicProviderCapabilitySummaries(),
    matrixVersion: PROVIDER_CAPABILITY_MATRIX_VERSION,
  };
}
