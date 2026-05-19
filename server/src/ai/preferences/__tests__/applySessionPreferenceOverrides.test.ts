import { describe, expect, it } from 'vitest';
import { applySessionPreferenceOverrides } from '../applySessionPreferenceOverrides';
import type { ResolvedEffectivePreferences } from '../preferenceTypes';

function baseResolved(): ResolvedEffectivePreferences {
  return {
    hard: {
      preferredProvider: 'auto',
      preferredModelOpenai: null,
      preferredModelAnthropic: null,
      autonomyModules: {
        scheduling: 30,
        communication: 20,
        fileManagement: 40,
        taskCreation: 30,
        dataAnalysis: 60,
        crossModuleActions: 20,
      },
      financialThreshold: 0,
      timeCommitmentThreshold: 0,
      peopleAffectedThreshold: 0,
    },
    soft: {
      tone: 'adaptive',
      verbosity: 'balanced',
      recommendationRichness: 'balanced',
      structurePreference: 'structured',
      communicationStyle: 'adapt to context',
    },
    inferred: [],
    provenance: { hard: {}, soft: { tone: 'questionnaire', verbosity: 'questionnaire' } },
    contextBlock: {
      communication: { tone: 'adaptive', verbosity: 'balanced', styleNotes: 'adapt' },
      response: { structure: 'structured', recommendationRichness: 'balanced' },
      boundaries: [],
    },
    providerPayload: {
      personality: { tone: 'adaptive' },
      autonomyBoundaries: { actionRules: [] },
      softPromptInstructions: 'Adapt tone and length.',
    },
  };
}

describe('applySessionPreferenceOverrides', () => {
  it('overrides soft prefs and marks session provenance', () => {
    const result = applySessionPreferenceOverrides(baseResolved(), {
      verbosity: 'brief',
      summary: 'brief answers',
    });
    expect(result.soft.verbosity).toBe('brief');
    expect(result.provenance.soft.verbosity).toBe('session');
    expect(result.providerPayload.softPromptInstructions).toContain('concise');
  });
});
