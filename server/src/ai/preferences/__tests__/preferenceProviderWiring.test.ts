import { describe, expect, it } from 'vitest';
import { buildProviderData } from '../../utils/buildProviderData';
import {
  applyResolvedPreferencesToProviderOptions,
  buildProviderUserContextFromPreferences,
} from '../preferenceProviderWiring';
import type { ResolvedEffectivePreferences } from '../preferenceTypes';

const sampleEffective: ResolvedEffectivePreferences = {
  hard: {
    preferredProvider: 'openai',
    preferredModelOpenai: 'gpt-4o-mini',
    preferredModelAnthropic: null,
    autonomyModules: {
      scheduling: 30,
      communication: 20,
      fileManagement: 40,
      taskCreation: 30,
      dataAnalysis: 60,
      crossModuleActions: 20,
    },
    financialThreshold: 50,
    timeCommitmentThreshold: 30,
    peopleAffectedThreshold: 1,
  },
  soft: {
    tone: 'warm',
    verbosity: 'balanced',
    recommendationRichness: 'balanced',
    structurePreference: 'structured',
    communicationStyle: 'formality: professional',
  },
  inferred: [],
  provenance: { hard: {}, soft: {} },
  contextBlock: {
    communication: { tone: 'warm', verbosity: 'balanced', styleNotes: 'professional' },
    response: { structure: 'structured', recommendationRichness: 'balanced' },
    boundaries: ['Scheduling: prefer suggestions'],
  },
  providerPayload: {
    personality: { tone: 'warm', verbosity: 'balanced' },
    autonomyBoundaries: { actionRules: ['Scheduling: prefer suggestions'] },
    softPromptInstructions: 'Be warm and balanced in length.',
  },
};

describe('preferenceProviderWiring', () => {
  it('applyResolvedPreferencesToProviderOptions sets non-empty provider fields', () => {
    const options: Record<string, unknown> = {};
    applyResolvedPreferencesToProviderOptions(options, sampleEffective);

    expect(options.personalityForProvider).toEqual({ tone: 'warm', verbosity: 'balanced' });
    expect(options.autonomyBoundariesForProvider).toEqual({
      actionRules: ['Scheduling: prefer suggestions'],
    });
    expect(options.resolvedEffectivePreferences).toBe(sampleEffective);
    expect(options.effectivePreferencesContextBlock).toBe(sampleEffective.contextBlock);
  });

  it('buildProviderUserContextFromPreferences returns non-empty personality and autonomy', () => {
    const ctx = buildProviderUserContextFromPreferences(sampleEffective);
    expect(Object.keys(ctx.personality).length).toBeGreaterThan(0);
    expect(Object.keys(ctx.autonomySettings).length).toBeGreaterThan(0);
  });

  it('mirrors DigitalLifeTwinCore callAIProvider providerData wiring', () => {
    const options: Record<string, unknown> = { userId: 'u1' };
    applyResolvedPreferencesToProviderOptions(options, sampleEffective);

    const resolved = options.resolvedEffectivePreferences as ResolvedEffectivePreferences;
    const prefFields = buildProviderUserContextFromPreferences(resolved);
    expect(prefFields.personality).not.toEqual({});
    expect(prefFields.autonomySettings).not.toEqual({});

    const providerData = buildProviderData({ options });
    expect(providerData.resolvedEffectivePreferences).toBe(resolved);
    expect(providerData.personalityForProvider).toEqual(sampleEffective.providerPayload.personality);
  });
});
