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

describe('assembleAIContext — external Google Places evidence', () => {
  it('injects external place block and risk when Google unavailable', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'Find me a good Italian restaurant near me.',
        userId: 'user-1',
        context: {},
      },
      userContext: baseUserContext,
      moduleContexts: {
        _pipeline_grounding: {
          locationSummary: 'Buffalo, New York, United States',
          googlePlacesUnavailable: true,
          externalReadEvidence: [
            {
              title: 'Example Trattoria',
              address: '10 Main St',
              externalId: 'places/ChIJ123',
              detail: 'rating 4.5',
              url: 'https://maps.google.com/?cid=1',
              retrievedAt: '2026-08-25T12:00:00.000Z',
            },
          ],
        },
      },
    });

    expect(
      assembled.contextBlocks.some((b) => b.title.includes('External place discovery'))
    ).toBe(true);
    expect(assembled.evidence.some((e) => e.sourceType === 'external')).toBe(true);
    expect(assembled.risks.some((r) => r.includes('Google Places discovery was unavailable'))).toBe(
      true
    );
  });
});
