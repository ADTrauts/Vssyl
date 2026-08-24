import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u-identity',
  timestamp: new Date(),
  activeModules: ['ai'],
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

describe('authenticated identity context assembly', () => {
  it('includes compact User name/email as personal identity, not HR module data', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'What is my email?',
        userId: 'u-identity',
        context: {},
      },
      userContext: baseUserContext,
      authenticatedIdentity: {
        name: 'AI Truth Employee',
        email: 'ai.truth.employee@vssyl.local',
      },
    });

    const block = assembled.contextBlocks.find((b) => b.title === 'Authenticated identity');
    expect(block?.sourceType).toBe('personal');
    expect(block?.content).toEqual({
      name: 'AI Truth Employee',
      email: 'ai.truth.employee@vssyl.local',
    });
    expect(assembled.evidence.some((e) => e.sourceType === 'personal' && e.detail?.includes('ai.truth.employee@vssyl.local'))).toBe(
      true
    );
    expect(JSON.stringify(block?.content)).not.toMatch(/password|secret|session/i);
  });

  it('omits identity block when authenticatedIdentity is absent', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'What is my email?',
        userId: 'u-identity',
        context: {},
      },
      userContext: baseUserContext,
    });

    expect(assembled.contextBlocks.some((b) => b.title === 'Authenticated identity')).toBe(false);
  });
});
