import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: ['drive'],
  crossModuleInsights: [],
  currentFocus: { module: 'drive', activity: 'files', priority: 'medium', timeSpent: 0 },
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

describe('assembleAIContext moduleContexts', () => {
  it('includes live module context blocks', () => {
    const assembled = assembleAIContext({
      query: { query: 'show my recent files', userId: 'u1', context: {} },
      userContext: baseUserContext,
      moduleContexts: {
        drive: {
          moduleName: 'File Hub',
          providerName: 'recentFiles',
          relevance: 'high',
          data: { files: [{ name: 'report.pdf' }] },
        },
      },
    });
    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles.some((t) => t.includes('Module live context'))).toBe(true);
    expect(assembled.evidence.some((e) => e.label.includes('Live module data'))).toBe(true);
  });
});
