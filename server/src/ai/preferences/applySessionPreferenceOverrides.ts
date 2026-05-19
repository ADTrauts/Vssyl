import type {
  EffectivePreferencesProvenance,
  ResolvedEffectivePreferences,
  SessionSoftPreferenceOverrides,
} from './preferenceTypes';
import { buildQuestionnaireSoftPromptInstructions } from './questionnaireSoftPromptTemplates';

function rebuildContextAndProvider(resolved: ResolvedEffectivePreferences): void {
  const boundaries = resolved.contextBlock.boundaries;
  resolved.contextBlock = {
    communication: {
      tone: resolved.soft.tone,
      verbosity: resolved.soft.verbosity,
      styleNotes: resolved.soft.communicationStyle.slice(0, 200),
    },
    response: {
      structure: resolved.soft.structurePreference,
      recommendationRichness: resolved.soft.recommendationRichness,
    },
    boundaries,
    inferredHints: resolved.contextBlock.inferredHints,
  };

  const detail = resolved.providerPayload.personality.questionnaireDetail as
    | Record<string, unknown>
    | undefined;

  resolved.providerPayload.personality = {
    tone: resolved.soft.tone,
    verbosity: resolved.soft.verbosity,
    recommendationRichness: resolved.soft.recommendationRichness,
    structurePreference: resolved.soft.structurePreference,
    communicationStyle: resolved.soft.communicationStyle.slice(0, 240),
    ...(detail ? { questionnaireDetail: detail } : {}),
  };

  resolved.providerPayload.softPromptInstructions = buildQuestionnaireSoftPromptInstructions(
    resolved.soft,
    detail as Parameters<typeof buildQuestionnaireSoftPromptInstructions>[1]
  );
}

/**
 * Merge session-only overrides onto resolved preferences (does not persist).
 */
export function applySessionPreferenceOverrides(
  resolved: ResolvedEffectivePreferences,
  session: SessionSoftPreferenceOverrides
): ResolvedEffectivePreferences {
  const provenance: EffectivePreferencesProvenance = {
    hard: { ...resolved.provenance.hard },
    soft: { ...resolved.provenance.soft },
  };

  if (session.tone) {
    resolved.soft.tone = session.tone;
    provenance.soft.tone = 'session';
  }
  if (session.verbosity) {
    resolved.soft.verbosity = session.verbosity;
    provenance.soft.verbosity = 'session';
  }
  if (session.recommendationRichness) {
    resolved.soft.recommendationRichness = session.recommendationRichness;
    provenance.soft.recommendationRichness = 'session';
  }
  if (session.structurePreference) {
    resolved.soft.structurePreference = session.structurePreference;
    provenance.soft.structurePreference = 'session';
  }

  if (session.summary) {
    const note = `session request: ${session.summary}`;
    resolved.soft.communicationStyle = resolved.soft.communicationStyle.includes(note)
      ? resolved.soft.communicationStyle
      : `${resolved.soft.communicationStyle}; ${note}`.slice(0, 240);
    provenance.soft.communicationStyle = 'session';
  }

  resolved.provenance = provenance;
  rebuildContextAndProvider(resolved);
  return resolved;
}
