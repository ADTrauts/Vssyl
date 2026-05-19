import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';
import { PREFERENCE_CONTEXT_BLOCK_TITLE } from '../../preferences/PreferenceResolver';

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: [],
  crossModuleInsights: [],
  currentFocus: { module: 'ai', activity: 'chat', priority: 'medium', timeSpent: 0 },
  patterns: [],
  relationships: [],
  preferences: {
    communication: {
      preferredChannels: [],
      responseTimeExpectations: {},
      formalityLevel: 0.5,
      timezone: 'UTC',
    },
    work: {
      productiveHours: [],
      focusBlockPreference: 60,
      interruptionTolerance: 0.5,
      collaborationStyle: 'balanced',
      prioritizationMethod: 'priority',
    },
    personal: {
      socialEngagement: 0.5,
      privacyLevel: 0.5,
      sharingComfort: 0.5,
      planningHorizon: 7,
    },
  },
  lifeState: {
    workLifeBalance: { score: 50, trend: 'stable', concerns: [], opportunities: [] },
    productivity: { score: 50, peakHours: [], efficiency: 0.5, bottlenecks: [] },
    relationships: { score: 50, socialConnections: 0, communicationHealth: 0.5, networkGrowth: 0 },
    goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
  },
};

const preferenceBlock = {
  communication: { tone: 'professional' as const, verbosity: 'brief' as const, styleNotes: 'direct' },
  response: { structure: 'structured' as const, recommendationRichness: 'concise' as const },
  boundaries: ['Scheduling: suggest only'],
};

describe('assembleAIContext preference block', () => {
  it('includes compact preference settings block when provided', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Help me plan my week',
        userId: 'u1',
        context: {},
      },
      userContext: baseUserContext,
      effectivePreferencesContextBlock: preferenceBlock,
    });

    const block = assembled.contextBlocks.find((b) => b.title === PREFERENCE_CONTEXT_BLOCK_TITLE);
    expect(block).toBeDefined();
    expect(block?.content).toEqual(preferenceBlock);
    expect(block?.tier).toBe('tier3_profile');
  });

  it('includes preference block in conversation mode after profile filtering', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Where should I go for a quick vacation?',
        userId: 'u1',
        context: {},
      },
      userContext: baseUserContext,
      explicitStructuredMode: 'conversation',
      effectivePreferencesContextBlock: preferenceBlock,
    });

    expect(assembled.structuredResponseMode).toBe('conversation');
    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles).toContain(PREFERENCE_CONTEXT_BLOCK_TITLE);
  });

  it('includes preference block in enterprise mode', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Analyze Q1 churn metrics for the leadership dashboard',
        userId: 'u1',
        context: {},
      },
      userContext: baseUserContext,
      effectivePreferencesContextBlock: preferenceBlock,
    });

    expect(assembled.structuredResponseMode).not.toBe('conversation');
    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles).toContain(PREFERENCE_CONTEXT_BLOCK_TITLE);
  });
});
