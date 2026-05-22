import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import { buildContextUsedFromAssembly, buildResponseInfluence } from '../../preferences/buildResponseInfluence';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u1',
  timestamp: new Date(),
  activeModules: ['drive', 'calendar'],
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

describe('context used vs available (Phase 3D)', () => {
  it('buildContextUsedFromAssembly lists module names with used flag', () => {
    const items = buildContextUsedFromAssembly({
      usedModules: ['drive', 'calendar'],
      contextAvailability: [
        {
          title: 'Module live context: Drive',
          sourceType: 'module',
          available: true,
          usedInPrompt: true,
        },
        {
          title: 'Module live context: Calendar',
          sourceType: 'module',
          available: true,
          usedInPrompt: false,
          dropReason: 'tier_budget_exhausted',
        },
      ],
    });

    expect(items).toEqual([
      { moduleName: 'Drive', usedInPrompt: true },
      { moduleName: 'Calendar', usedInPrompt: false },
    ]);
  });

  it('assembleAIContext exposes contextAvailability after budgeting', () => {
    const assembled = assembleAIContext({
      query: { query: 'show my files and calendar', userId: 'u1', context: {} },
      userContext: baseUserContext,
      moduleContexts: {
        drive: {
          moduleName: 'Drive',
          relevance: 'high',
          data: { recentFiles: [{ id: '1', name: 'a.pdf' }] },
        },
        calendar: {
          moduleName: 'Calendar',
          relevance: 'medium',
          data: { upcomingEvents: [{ id: 'e1', title: 'Sync' }] },
        },
      },
    });

    expect(assembled.contextAvailability?.length).toBeGreaterThan(0);
    expect(assembled.contextBlocks.every((b) => b.available === true)).toBe(true);
    expect(assembled.contextBlocks.every((b) => b.usedInPrompt === true)).toBe(true);
    expect(typeof assembled.assemblyMetrics?.blocksDropped).toBe('number');
  });

  it('buildResponseInfluence includes contextUsed for explain drawer', () => {
    const influence = buildResponseInfluence({
      assembledContext: {
        usedModules: ['drive', 'calendar'],
        contextAvailability: [
          {
            title: 'Module live context: Drive',
            sourceType: 'module',
            available: true,
            usedInPrompt: true,
          },
          {
            title: 'Module live context: Calendar',
            sourceType: 'module',
            available: true,
            usedInPrompt: false,
          },
        ],
      },
    });

    expect(influence.contextUsed).toEqual([
      { moduleName: 'Drive', usedInPrompt: true },
      { moduleName: 'Calendar', usedInPrompt: false },
    ]);
    expect(influence.shapedBy.some((line) => line.includes('Drive'))).toBe(true);
  });
});
