import { describe, expect, it } from 'vitest';
import { buildResponseInfluence } from '../buildResponseInfluence';
import type { ResolvedEffectivePreferences } from '../preferenceTypes';

const minimalResolved: ResolvedEffectivePreferences = {
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
    verbosity: 'brief',
    recommendationRichness: 'concise',
    structurePreference: 'conversational',
    communicationStyle: 'warm and direct',
  },
  inferred: [
    {
      id: '1',
      kind: 'context',
      label: 'morning updates',
      value: 'prefers short morning updates',
      confidence: 0.8,
    },
  ],
  provenance: { hard: {}, soft: {} },
  contextBlock: {
    communication: { tone: 'warm', verbosity: 'brief', styleNotes: '' },
    response: { structure: 'conversational', recommendationRichness: 'concise' },
    boundaries: ['Scheduling: suggest only'],
  },
  providerPayload: {
    personality: {},
    autonomyBoundaries: {},
    softPromptInstructions: '',
  },
};

describe('buildResponseInfluence', () => {
  it('includes session-only lines separately', () => {
    const out = buildResponseInfluence({
      effectivePreferences: minimalResolved,
      sessionAdjustments: { summary: 'shorter answers', verbosity: 'brief' },
    });
    expect(out.sessionOnly?.length).toBeGreaterThan(0);
    expect(out.shapedBy.some((s) => s.includes('shorter'))).toBe(true);
    expect(JSON.stringify(out)).not.toContain('provenance');
  });

  it('includes workspace policies without internal keys', () => {
    const out = buildResponseInfluence({
      effectivePreferences: minimalResolved,
      businessBoundaries: {
        businessId: 'biz-1',
        businessName: 'Acme',
        securityLevel: 'high',
        complianceMode: true,
        policyLines: ['Employee data: limited access only'],
        businessVoiceHints: ['Preferred business tone: professional'],
      },
    });
    expect(out.workspacePolicies?.length).toBeGreaterThan(0);
    expect(out.summary).toMatch(/workspace|organization/i);
  });

  it('emits structured memoryItems with ids for explain drawer', () => {
    const out = buildResponseInfluence({
      effectivePreferences: minimalResolved,
      userMemoryFacts: [
        {
          id: 'fact-travel-1',
          subject: 'Travel',
          predicate: 'Prefers window seats',
          sourceType: 'remember_that',
          confidence: 0.9,
          isExplicit: true,
        },
        {
          id: 'fact-inferred-1',
          subject: 'Meetings',
          predicate: 'Often schedules morning meetings',
          sourceType: 'inferred_chat',
          confidence: 0.6,
          isExplicit: false,
        },
      ],
    });
    expect(out.memoryItems).toHaveLength(2);
    expect(out.memoryItems?.[0]).toMatchObject({
      kind: 'memory_fact',
      id: 'fact-travel-1',
      subject: 'Travel',
      sourceType: 'remember_that',
      isExplicit: true,
    });
    expect(JSON.stringify(out)).not.toContain('Prefers window seats');
  });

  it('includes learning items with confidence for saved learnings', () => {
    const out = buildResponseInfluence({
      effectivePreferences: {
        ...minimalResolved,
        inferred: [
          {
            id: 'evt-1',
            kind: 'learning_applied',
            label: 'Response style',
            value: 'Keep answers brief',
            confidence: 0.85,
            eventType: 'preference_update',
          },
        ],
      },
    });
    expect(out.learningItems).toHaveLength(1);
    expect(out.learningItems?.[0]).toMatchObject({
      kind: 'learning_applied',
      label: 'Response style',
      confidence: 0.85,
    });
  });

  it('lists memory subjects', () => {
    const out = buildResponseInfluence({
      effectivePreferences: minimalResolved,
      userMemoryFacts: [{ subject: 'Travel', predicate: 'Prefers window seats' }],
    });
    expect(out.memoriesUsed?.some((m) => m.title === 'Travel')).toBe(true);
  });

  it('includes contextUsed module rows for explain drawer', () => {
    const out = buildResponseInfluence({
      assembledContext: {
        usedModules: ['drive'],
        contextAvailability: [
          {
            title: 'Module live context: Drive',
            sourceType: 'module',
            available: true,
            usedInPrompt: true,
          },
        ],
      },
    });
    expect(out.contextUsed).toEqual([{ moduleName: 'Drive', usedInPrompt: true }]);
  });
});
