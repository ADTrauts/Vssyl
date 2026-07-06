import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MemoryRetrievalService } from '../../memory/MemoryRetrievalService';
import { assembleAIContext } from '../../context/AIContextAssembler';
import type { UserContext } from '../../context/CrossModuleContextEngine';

const { mockFindFirst, mockCreate } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    userMemoryFact: {
      findFirst: mockFindFirst,
      create: mockCreate,
    },
    businessMember: { findFirst: vi.fn().mockResolvedValue(null) },
    dashboard: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

import { createUserMemoryFact } from '../../../services/userMemoryFactService';

const NOW = new Date('2026-07-05T12:00:00.000Z');

const baseUserContext: UserContext = {
  userId: 'user-teach-1',
  timestamp: NOW,
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

describe('Teach Vssyl Phase 1A — G1 fact retrieval', () => {
  it('retrieves taught favorite dashboard fact on related query', async () => {
    const facts = [
      {
        id: 'fact-dashboard',
        subject: 'Favorite dashboard',
        predicate: 'Operations',
        confidence: 0.9,
        sourceType: 'explicit_user',
        category: 'other',
        isExplicit: true,
        sourceConversationId: null,
        scope: 'personal',
        businessId: null,
        updatedAt: new Date(NOW.getTime() - 3600_000),
      },
    ];

    const db = {
      userMemoryFact: {
        findMany: vi.fn().mockResolvedValue(facts),
      },
    } as unknown as PrismaClient;

    const service = new MemoryRetrievalService(db);
    const result = await service.retrieve({
      userId: 'user-teach-1',
      query: 'What is my favorite dashboard?',
      limit: 8,
    });

    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.facts.some((f) => f.predicate.includes('Operations'))).toBe(true);
    expect(result.report.influencedFactIds).toContain('fact-dashboard');
  });
});

describe('Teach Vssyl Phase 1A — G2 preference in assembly', () => {
  it('includes taught preference in assembled user-defined context', () => {
    const assembled = assembleAIContext({
      query: {
        query: 'How should you respond to me?',
        userId: 'user-teach-1',
        context: { contextProfile: 'conversation' },
      },
      userContext: baseUserContext,
      userDefinedContext: [
        {
          title: 'Concise responses',
          contextType: 'preference',
          content: 'I prefer concise responses.',
          priority: 85,
        },
      ],
      userMemoryFacts: [],
    });

    const userDefinedBlock = assembled.contextBlocks.find((b) =>
      b.title.toLowerCase().includes('user-defined')
    );
    expect(userDefinedBlock).toBeDefined();
    const serialized = JSON.stringify(userDefinedBlock?.content ?? '');
    expect(serialized.toLowerCase()).toContain('concise');
  });
});

describe('Teach Vssyl Phase 1A — G3 vocabulary retrieval', () => {
  it('retrieves vocabulary mapping on term query', async () => {
    const facts = [
      {
        id: 'fact-vocab',
        subject: 'Board Meeting',
        predicate: 'Executive Meeting',
        confidence: 0.9,
        sourceType: 'explicit_user',
        category: 'other',
        isExplicit: true,
        sourceConversationId: null,
        scope: 'personal',
        businessId: null,
        updatedAt: NOW,
      },
    ];

    const db = {
      userMemoryFact: {
        findMany: vi.fn().mockResolvedValue(facts),
      },
    } as unknown as PrismaClient;

    const service = new MemoryRetrievalService(db);
    const result = await service.retrieve({
      userId: 'user-teach-1',
      query: 'When I say Board Meeting what do I mean?',
      limit: 8,
    });

    expect(result.facts.some((f) => f.subject.includes('Board Meeting'))).toBe(true);
    expect(result.facts.some((f) => f.predicate.includes('Executive Meeting'))).toBe(true);
  });
});

describe('Teach Vssyl Phase 1A — G4 no duplicate memory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing row when subject and predicate match', async () => {
    const existing = {
      id: 'existing-fact',
      userId: 'user-1',
      subject: 'Favorite dashboard',
      predicate: 'Operations',
      scope: 'personal',
    };

    mockFindFirst.mockResolvedValueOnce(existing);

    const result = await createUserMemoryFact({
      userId: 'user-1',
      subject: 'Favorite dashboard',
      predicate: 'Operations',
      scope: 'personal',
    });

    expect(result.id).toBe('existing-fact');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
