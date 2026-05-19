import { describe, expect, it } from 'vitest';
import {
  buildConversationRichnessOverride,
  buildPreferenceSystemPromptSection,
} from '../../preferences/preferencePromptBlocks';
import type { ResolvedEffectivePreferences } from '../../preferences/preferenceTypes';

const effective: ResolvedEffectivePreferences = {
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
    financialThreshold: 100,
    timeCommitmentThreshold: 0,
    peopleAffectedThreshold: 0,
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
    boundaries: ['Scheduling: suggest only'],
  },
  providerPayload: {
    personality: {
      tone: 'casual',
      verbosity: 'brief',
      recommendationRichness: 'concise',
      structurePreference: 'conversational',
      communicationStyle: 'formality: casual',
    },
    autonomyBoundaries: {
      actionRules: ['Scheduling: suggest only'],
      moduleLevels: { scheduling: 20 },
    },
    softPromptInstructions:
      'Use a relaxed, conversational tone.\nKeep answers concise: lead with the answer.',
  },
};

describe('preferencePromptBlocks', () => {
  it('conversation mode includes soft preferences and action boundaries without exposing internals phrasing', () => {
    const section = buildPreferenceSystemPromptSection({
      effective,
      structuredResponseMode: 'conversation',
    });

    expect(section).toContain('COMMUNICATION PREFERENCES');
    expect(section).toContain('relaxed, conversational');
    expect(section).toContain('ACTION BOUNDARIES');
    expect(section).toContain('Scheduling: suggest only');
    expect(section).toContain('never cite settings');
    expect(section).toContain('do not say "your settings say"');
    expect(section).not.toMatch(/\bquestionnaire\b/i);
  });

  it('enterprise mode includes preferences and boundaries', () => {
    const section = buildPreferenceSystemPromptSection({
      effective,
      structuredResponseMode: 'analysis',
    });

    expect(section).toContain('USER COMMUNICATION PREFERENCES');
    expect(section).toContain('ACTION BOUNDARIES');
  });

  it('buildConversationRichnessOverride applies for concise richness in conversation mode', () => {
    const override = buildConversationRichnessOverride('conversation', 'concise');
    expect(override).toContain('one strong option');
    expect(buildConversationRichnessOverride('analysis', 'concise')).toBeNull();
  });
});
