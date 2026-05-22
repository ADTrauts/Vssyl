import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PreferenceResolver } from '../PreferenceResolver';

function mockPrisma(data: {
  prefs?: Array<{ key: string; value: string }>;
  profile?: { personalityData: Record<string, unknown> } | null;
  autonomy?: Record<string, unknown> | null;
  contexts?: Array<{ id: string; title: string; content: string; priority: number }>;
  facts?: Array<{ id: string; subject: string; predicate: string; confidence: number }>;
  appliedLearningEvents?: Array<{
    id: string;
    eventType: string;
    context: string;
    newBehavior: string;
    confidence: number;
    patternData?: unknown;
  }>;
}): PrismaClient {
  return {
    userPreference: {
      findMany: vi.fn().mockResolvedValue(data.prefs ?? []),
    },
    aIPersonalityProfile: {
      findUnique: vi.fn().mockResolvedValue(
        data.profile
          ? { userId: 'u1', personalityData: data.profile.personalityData }
          : null
      ),
    },
    aIAutonomySettings: {
      findUnique: vi.fn().mockResolvedValue(data.autonomy ?? null),
    },
    userAIContext: {
      findMany: vi.fn().mockResolvedValue(data.contexts ?? []),
    },
    aILearningEvent: {
      findMany: vi.fn().mockResolvedValue(data.appliedLearningEvents ?? []),
    },
    userMemoryFact: {
      findMany: vi.fn().mockResolvedValue(data.facts ?? []),
    },
  } as unknown as PrismaClient;
}

describe('PreferenceResolver', () => {
  it('resolves provider and model preferences from UserPreference', async () => {
    const resolver = new PreferenceResolver(
      mockPrisma({
        prefs: [
          { key: 'ai_preferred_provider', value: 'anthropic' },
          { key: 'ai_preferred_model_anthropic', value: 'claude-3-5-sonnet-20241022' },
        ],
      })
    );

    const result = await resolver.resolve({ userId: 'u1' });
    expect(result.hard.preferredProvider).toBe('anthropic');
    expect(result.hard.preferredModelAnthropic).toBe('claude-3-5-sonnet-20241022');
    expect(result.provenance.hard.preferredProvider).toBe('user');
  });

  it('maps questionnaire personalityData to soft prompt preferences', async () => {
    const resolver = new PreferenceResolver(
      mockPrisma({
        profile: {
          personalityData: {
            traits: {
              openness: 70,
              conscientiousness: 80,
              extraversion: 75,
              riskTolerance: 70,
            },
            preferences: {
              communication: {
                formality: 'casual and friendly',
                responseSpeed: 'immediate',
                conflictStyle: 'direct',
              },
              decision: {
                informationNeeds: 'comprehensive',
              },
            },
          },
        },
      })
    );

    const result = await resolver.resolve({ userId: 'u1' });
    expect(result.soft.tone).toBe('casual');
    expect(result.soft.verbosity).toBe('detailed');
    expect(result.soft.structurePreference).toBe('analytical');
    expect(result.soft.recommendationRichness).toBe('rich');
    expect(result.provenance.soft.tone).toBe('questionnaire');
    expect(result.providerPayload.personality.tone).toBe('casual');
  });

  it('maps autonomy thresholds to hard boundaries in context block', async () => {
    const resolver = new PreferenceResolver(
      mockPrisma({
        autonomy: {
          scheduling: 10,
          communication: 15,
          fileManagement: 20,
          taskCreation: 25,
          dataAnalysis: 90,
          crossModuleActions: 5,
          financialThreshold: 100,
          timeCommitmentThreshold: 60,
          peopleAffectedThreshold: 2,
        },
      })
    );

    const result = await resolver.resolve({ userId: 'u1' });
    expect(result.hard.autonomyModules.scheduling).toBe(10);
    expect(result.hard.financialThreshold).toBe(100);
    expect(result.contextBlock.boundaries.some((b) => b.includes('Financial actions'))).toBe(true);
    expect(result.contextBlock.boundaries.some((b) => b.includes('Scheduling'))).toBe(true);
    const rules = result.providerPayload.autonomyBoundaries.actionRules as string[];
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.some((r) => r.includes('approval'))).toBe(true);
  });

  it('applies inferred soft overrides without changing hard provider', async () => {
    const resolver = new PreferenceResolver(
      mockPrisma({
        prefs: [{ key: 'ai_preferred_provider', value: 'openai' }],
        contexts: [
          {
            id: 'ctx1',
            title: 'Style',
            content: 'Keep answers brief and concise please',
            priority: 90,
          },
        ],
      })
    );

    const result = await resolver.resolve({ userId: 'u1' });
    expect(result.hard.preferredProvider).toBe('openai');
    expect(result.soft.verbosity).toBe('brief');
    expect(result.provenance.soft.verbosity).toBe('inferred');
    expect(result.provenance.hard.preferredProvider).toBe('user');
  });

  it('includes applied learning events as inferred preferences', async () => {
    const resolver = new PreferenceResolver(
      mockPrisma({
        appliedLearningEvents: [
          {
            id: 'evt-1',
            eventType: 'preference_update',
            context: 'Response style',
            newBehavior: 'Keep answers brief and concise',
            confidence: 0.8,
            patternData: { artifact: { summary: 'Keep answers brief and concise' } },
          },
        ],
      })
    );

    const result = await resolver.resolve({ userId: 'u1' });
    expect(result.inferred.some((i) => i.kind === 'learning_applied' && i.id === 'evt-1')).toBe(
      true
    );
    expect(result.soft.verbosity).toBe('brief');
  });
});
