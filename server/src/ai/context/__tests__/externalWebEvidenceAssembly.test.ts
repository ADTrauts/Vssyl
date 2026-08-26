import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'user-1',
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

describe('assembleAIContext — external web evidence', () => {
  it('injects untrusted web evidence with URL for citations', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'What are mortgage rates today?',
        userId: 'user-1',
        context: {},
      },
      userContext: baseUserContext,
      moduleContexts: {
        _pipeline_grounding: {
          externalReadEvidence: [
            {
              capabilityId: 'web_search',
              provider: 'tavily',
              sourceKind: 'web',
              title: 'Mortgage rates update',
              url: 'https://example.com/rates',
              domain: 'example.com',
              detail: 'Average 30-year fixed is 6.42%.',
              retrievedAt: '2026-08-26T12:00:00.000Z',
              rank: 1,
            },
            {
              capabilityId: 'google_places_search',
              provider: 'google_maps_platform',
              sourceKind: 'place',
              title: 'Some Place',
              address: 'Buffalo',
              retrievedAt: '2026-08-26T12:00:00.000Z',
            },
          ],
        },
      },
    });

    expect(
      assembled.contextBlocks.some((b) => b.title.includes('External web evidence'))
    ).toBe(true);
    expect(
      assembled.evidence.some((e) => e.label.startsWith('Google Place:')) ||
        assembled.contextBlocks.some((b) => b.title.includes('External place discovery'))
    ).toBe(true);
    const webEvidence = assembled.evidence.find((e) => e.label === 'Mortgage rates update');
    expect(webEvidence?.url).toBe('https://example.com/rates');
    expect(webEvidence?.sourceType).toBe('external');
    const webBlock = assembled.contextBlocks.find((b) =>
      b.title.includes('External web evidence')
    );
    expect(JSON.stringify(webBlock)).toMatch(/UNTRUSTED/i);
  });

  it('adds honest-failure risk when webSearchUnavailable', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'What are mortgage rates today?',
        userId: 'user-1',
        context: {},
      },
      userContext: baseUserContext,
      moduleContexts: {
        _pipeline_grounding: {
          webSearchUnavailable: true,
        },
      },
    });

    expect(
      assembled.risks.some((r) => r.includes('Live public web search was unavailable'))
    ).toBe(true);
  });
});
