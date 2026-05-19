import { describe, expect, it } from 'vitest';
import { buildInfluenceItems } from '../buildInfluenceItems';
import type { ResolvedEffectivePreferences } from '../preferenceTypes';
import type { EffectivePreferencesPreview } from '../effectivePreferencesPreview';

const basePreview: EffectivePreferencesPreview = {
  preferenceScope: 'personal',
  communication: {
    tone: 'warm',
    verbosity: 'balanced',
    styleSummary: 'You prefer warm, balanced replies.',
  },
  response: { structure: 'conversational', recommendationStyle: 'balanced' },
  actionBoundaries: ['Scheduling: suggest only'],
  provider: { provider: 'Automatic', modelLabel: null },
  setup: {
    hasPersonalityProfile: true,
    hasAutonomySettings: true,
    inferredHintCount: 1,
  },
};

const baseResolved: ResolvedEffectivePreferences = {
  hard: {
    preferredProvider: 'auto',
    preferredModelOpenai: null,
    preferredModelAnthropic: null,
    autonomyModules: {
      scheduling: 20,
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
    tone: 'warm',
    verbosity: 'balanced',
    recommendationRichness: 'balanced',
    structurePreference: 'conversational',
    communicationStyle: 'warm',
  },
  inferred: [
    {
      id: 'ctx-1',
      kind: 'context',
      label: 'Brief updates',
      value: 'Prefer short status updates in the morning',
      confidence: 0.8,
    },
  ],
  provenance: { hard: {}, soft: {} },
  contextBlock: {
    communication: { tone: 'warm', verbosity: 'balanced', styleNotes: '' },
    response: { structure: 'conversational', recommendationRichness: 'balanced' },
    boundaries: [],
  },
  providerPayload: {
    personality: {},
    autonomyBoundaries: {},
    softPromptInstructions: '',
  },
};

describe('buildInfluenceItems', () => {
  it('includes inferred items with human labels', () => {
    const items = buildInfluenceItems({
      preview: basePreview,
      resolved: baseResolved,
      memoryFactCount: 0,
      learnedContextCount: 0,
      userContextCount: 0,
      pendingLearningCount: 0,
    });
    expect(items.some((i) => i.label.includes('Brief updates'))).toBe(true);
    expect(items.every((i) => !i.label.includes('provenance'))).toBe(true);
  });

  it('includes workspace policy when business lines provided', () => {
    const items = buildInfluenceItems({
      preview: basePreview,
      resolved: baseResolved,
      memoryFactCount: 0,
      learnedContextCount: 0,
      userContextCount: 0,
      pendingLearningCount: 0,
      businessPolicyLines: ['Employee data: limited access only'],
    });
    expect(items[0]?.permanence).toBe('workspace');
  });

  it('includes pending learning notice', () => {
    const items = buildInfluenceItems({
      preview: basePreview,
      resolved: baseResolved,
      memoryFactCount: 0,
      learnedContextCount: 0,
      userContextCount: 0,
      pendingLearningCount: 2,
    });
    expect(items.some((i) => i.id === 'pending-learning')).toBe(true);
  });
});
