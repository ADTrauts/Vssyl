import { describe, expect, it } from 'vitest';
import { buildProviderData } from '../../utils/buildProviderData';
import { applyResolvedPreferencesToProviderOptions } from '../../preferences/preferenceProviderWiring';
import type { ResolvedEffectivePreferences } from '../../preferences/preferenceTypes';

const minimalEffective: ResolvedEffectivePreferences = {
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
  provenance: { hard: {}, soft: {} },
  contextBlock: {
    communication: { tone: 'adaptive', verbosity: 'balanced', styleNotes: '' },
    response: { structure: 'structured', recommendationRichness: 'balanced' },
    boundaries: [],
  },
  providerPayload: {
    personality: { tone: 'adaptive' },
    autonomyBoundaries: { actionRules: [] },
    softPromptInstructions: 'Adapt tone to context.',
  },
};

describe('Digital Life Twin prompt pipeline (Phase 0B)', () => {
  it('provider options use userQuery as the live user message', () => {
    const options: Record<string, unknown> = {
      userQuery: 'What should I cook tonight?',
      structuredResponseMode: 'conversation',
    };
    applyResolvedPreferencesToProviderOptions(options, minimalEffective);

    const providerData = buildProviderData({ options });
    expect(providerData.userQuery).toBe('What should I cook tonight?');
    expect(providerData.personalityForProvider).toEqual({ tone: 'adaptive' });
    expect(providerData.resolvedEffectivePreferences).toBe(minimalEffective);
  });

  it('does not rely on empty personality stubs when preferences are wired', () => {
    const options: Record<string, unknown> = { userId: 'u1', userQuery: 'Hi' };
    applyResolvedPreferencesToProviderOptions(options, minimalEffective);

    const personality = options.personalityForProvider as Record<string, unknown>;
    const autonomy = options.autonomyBoundariesForProvider as Record<string, unknown>;
    expect(Object.keys(personality).length).toBeGreaterThan(0);
    expect(autonomy).toBeDefined();
  });
});
