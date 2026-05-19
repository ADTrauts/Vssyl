import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';

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

describe('assembleAIContext recall continuity', () => {
  it('includes topics-only cross-session block when threadSummary is missing', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'We last talked about a trip — what were the places?',
        userId: 'u1',
        context: { contextProfile: 'conversation' },
      },
      userContext: baseUserContext,
      explicitStructuredMode: 'conversation',
      recentConversationMemory: [
        {
          id: 'conv-prior',
          title: 'Vacation thread',
          threadSummary: null,
          topics: {
            activeTopic: {
              label: 'Last-minute vacation',
              domain: 'travel',
              entities: ['Charleston', 'Savannah'],
              confidence: 0.9,
              updatedAt: new Date().toISOString(),
            },
            continuityState: {
              narrowingConstraints: ['domestic', 'this weekend'],
              lastAssistantTurnSummary: 'Charleston and Savannah are strong picks.',
              lastUpdatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          },
          lastMessageAt: new Date(),
        },
      ],
    });

    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles.some((t) => t.includes('Recent conversation topics'))).toBe(true);
  });
});
