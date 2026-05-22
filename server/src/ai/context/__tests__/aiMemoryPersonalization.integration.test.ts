import { describe, expect, it } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import type { UserContext } from '../CrossModuleContextEngine';
import { MEMORY_PREDICATE_CHAR_BUDGET } from '../../memory/memoryScoring';

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

function memoryPredicateChars(assembled: ReturnType<typeof assembleAIContext>): number {
  let total = 0;
  for (const block of assembled.contextBlocks) {
    if (!block.title.toLowerCase().includes('memory')) continue;
    if (!Array.isArray(block.content)) continue;
    for (const item of block.content) {
      if (item && typeof item === 'object' && 'fact' in item) {
        const fact = (item as { fact?: string }).fact;
        if (typeof fact === 'string') total += fact.length;
      }
    }
  }
  return total;
}

describe('AI memory personalization (Phase 1 exit)', () => {
  it('day-30 user gets measurably richer memory context than day-1 user', () => {
    const day1Facts = [
      {
        id: 'd1',
        subject: 'New user',
        predicate: 'Just getting started with the platform.',
        confidence: 0.7,
        sourceType: 'explicit_user',
        isExplicit: true,
      },
    ];

    const day30Facts = Array.from({ length: 8 }, (_, i) => ({
      id: `d30-${i}`,
      subject: `Preference ${i}`,
      predicate: `Long-term stored preference ${i} with enough detail to influence replies meaningfully.`,
      confidence: 0.88,
      sourceType: 'remember_that',
      isExplicit: true,
    }));

    const day1 = assembleAIContext({
      query: {
        query: 'How should you help me today?',
        userId: 'u1',
        context: { contextProfile: 'conversation' },
      },
      userContext: baseUserContext,
      explicitStructuredMode: 'conversation',
      userMemoryFacts: day1Facts,
    });

    const day30 = assembleAIContext({
      query: {
        query: 'How should you help me today?',
        userId: 'u1',
        context: { contextProfile: 'conversation' },
      },
      userContext: baseUserContext,
      explicitStructuredMode: 'conversation',
      userMemoryFacts: day30Facts,
    });

    const day1Chars = memoryPredicateChars(day1);
    const day30Chars = memoryPredicateChars(day30);

    expect(day30Chars).toBeGreaterThan(day1Chars);
    expect(day30Chars).toBeGreaterThan(MEMORY_PREDICATE_CHAR_BUDGET / 2);
    expect(day30.contextBlocks.filter((b) => b.title.toLowerCase().includes('memory')).length).toBeGreaterThan(0);
  });
});
