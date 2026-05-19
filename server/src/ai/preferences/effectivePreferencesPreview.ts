import type { ResolvedEffectivePreferences, SoftTone, SoftVerbosity } from './preferenceTypes';

/** User-facing preview of what the AI will use on the next chat (no internal provenance mechanics). */
export interface EffectivePreferencesPreview {
  /** personal = user Control Center; business workspace chat still applies separate business policies. */
  preferenceScope: 'personal';
  scopeNote?: string;
  /** How the AI will communicate in chat. */
  communication: {
    tone: SoftTone;
    verbosity: SoftVerbosity;
    styleSummary: string;
  };
  /** How answers will be structured. */
  response: {
    structure: string;
    recommendationStyle: string;
  };
  /** Limits on autonomous actions (not conversational tone). */
  actionBoundaries: string[];
  /** Provider routing for the next request. */
  provider: {
    provider: string;
    modelLabel: string | null;
  };
  /** High-level source hints for the Control Center UI. */
  setup: {
    hasPersonalityProfile: boolean;
    hasAutonomySettings: boolean;
    inferredHintCount: number;
  };
}

const TONE_LABELS: Record<SoftTone, string> = {
  casual: 'Casual',
  professional: 'Professional',
  warm: 'Warm',
  adaptive: 'Adaptive to context',
};

const VERBOSITY_LABELS: Record<SoftVerbosity, string> = {
  brief: 'Brief answers',
  balanced: 'Balanced detail',
  detailed: 'More detailed answers',
};

export function toEffectivePreferencesPreview(
  resolved: ResolvedEffectivePreferences,
  setup: {
    hasPersonalityProfile: boolean;
    hasAutonomySettings: boolean;
    businessId?: string;
    hasBusinessWorkspacePolicies?: boolean;
  }
): EffectivePreferencesPreview {
  const provider = resolved.hard.preferredProvider;
  const model =
    provider === 'openai'
      ? resolved.hard.preferredModelOpenai
      : provider === 'anthropic'
        ? resolved.hard.preferredModelAnthropic
        : resolved.hard.preferredModelOpenai || resolved.hard.preferredModelAnthropic;

  const scopeNote =
    setup.businessId && setup.hasBusinessWorkspacePolicies
      ? 'These are your personal AI Control Center settings. In this business workspace, additional policies from the Business AI Control Center also apply.'
      : setup.businessId
        ? 'These are your personal AI Control Center settings. Business workspace policies may apply when configured.'
        : undefined;

  return {
    preferenceScope: 'personal',
    ...(scopeNote && { scopeNote }),
    communication: {
      tone: resolved.soft.tone,
      verbosity: resolved.soft.verbosity,
      styleSummary: resolved.soft.communicationStyle || 'Adapt to context',
    },
    response: {
      structure: resolved.soft.structurePreference,
      recommendationStyle: resolved.soft.recommendationRichness,
    },
    actionBoundaries: resolved.contextBlock.boundaries.slice(0, 8),
    provider: {
      provider: provider === 'auto' ? 'Automatic' : provider,
      modelLabel: model,
    },
    setup: {
      hasPersonalityProfile: setup.hasPersonalityProfile,
      hasAutonomySettings: setup.hasAutonomySettings,
      inferredHintCount: resolved.inferred.length,
    },
  };
}

export function formatPreviewTone(tone: SoftTone): string {
  return TONE_LABELS[tone] ?? tone;
}

export function formatPreviewVerbosity(v: SoftVerbosity): string {
  return VERBOSITY_LABELS[v] ?? v;
}
