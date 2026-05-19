import { describe, expect, it } from 'vitest';
import {
  formatPreviewTone,
  formatPreviewVerbosity,
  toEffectivePreferencesPreview,
} from '../effectivePreferencesPreview';
import type { ResolvedEffectivePreferences } from '../preferenceTypes';

const baseResolved: ResolvedEffectivePreferences = {
  hard: {
    preferredProvider: 'openai',
    preferredModelOpenai: 'gpt-4o-mini',
    preferredModelAnthropic: null,
    autonomyModules: {
      scheduling: 15,
      communication: 20,
      fileManagement: 40,
      taskCreation: 30,
      dataAnalysis: 60,
      crossModuleActions: 20,
    },
    financialThreshold: 100,
    timeCommitmentThreshold: 60,
    peopleAffectedThreshold: 2,
  },
  soft: {
    tone: 'casual',
    verbosity: 'brief',
    recommendationRichness: 'concise',
    structurePreference: 'conversational',
    communicationStyle: 'formality: casual',
  },
  inferred: [],
  provenance: { hard: {}, soft: {} },
  contextBlock: {
    communication: { tone: 'casual', verbosity: 'brief', styleNotes: 'casual' },
    response: { structure: 'conversational', recommendationRichness: 'concise' },
    boundaries: ['Scheduling: suggest only', 'Financial actions: require approval above $100'],
  },
  providerPayload: {
    personality: { tone: 'casual' },
    autonomyBoundaries: { actionRules: [] },
    softPromptInstructions: 'Use a casual tone.',
  },
};

describe('effectivePreferencesPreview', () => {
  it('maps resolved preferences to user-facing preview', () => {
    const preview = toEffectivePreferencesPreview(baseResolved, {
      hasPersonalityProfile: true,
      hasAutonomySettings: true,
    });

    expect(preview.preferenceScope).toBe('personal');
    expect(preview.communication.tone).toBe('casual');
    expect(preview.communication.verbosity).toBe('brief');
    expect(preview.provider.provider).toBe('openai');
    expect(preview.provider.modelLabel).toBe('gpt-4o-mini');
    expect(preview.actionBoundaries.length).toBeGreaterThan(0);
    expect(preview.setup.hasPersonalityProfile).toBe(true);
  });

  it('formats tone and verbosity labels for UI', () => {
    expect(formatPreviewTone('warm')).toBe('Warm');
    expect(formatPreviewVerbosity('detailed')).toBe('More detailed answers');
  });
});
