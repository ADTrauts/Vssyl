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

  it('lists memory subjects', () => {
    const out = buildResponseInfluence({
      effectivePreferences: minimalResolved,
      userMemoryFacts: [{ subject: 'Travel', predicate: 'Prefers window seats' }],
    });
    expect(out.memoriesUsed?.some((m) => m.title === 'Travel')).toBe(true);
  });
});
