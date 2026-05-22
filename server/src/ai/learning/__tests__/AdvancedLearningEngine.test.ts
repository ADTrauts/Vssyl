import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdvancedLearningEngine } from '../AdvancedLearningEngine';

function mockPrisma() {
  return {
    aILearningEvent: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    aIPersonalityProfile: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('AdvancedLearningEngine Phase 2A', () => {
  let db: PrismaClient;
  let engine: AdvancedLearningEngine;

  beforeEach(() => {
    db = mockPrisma();
    engine = new AdvancedLearningEngine(db);
    vi.mocked(db.aILearningEvent.create).mockResolvedValue({
      id: 'primary-1',
      userId: 'user-1',
      eventType: 'interaction',
      context: 'chat',
      newBehavior: 'Chat interaction recorded for learning',
      patternData: {},
      confidence: 0.5,
      frequency: 1,
      applied: false,
      validated: false,
      createdAt: new Date(),
      oldBehavior: null,
      sourceModule: null,
      sourceModuleVersion: null,
      moduleActive: true,
      moduleSpecificData: null,
      userFeedback: null,
    } as never);
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([]);
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue(null);
  });

  it('processLearningEvent creates exactly one synchronous row', async () => {
    const result = await engine.processLearningEvent({
      userId: 'user-1',
      eventType: 'interaction',
      module: 'chat',
      data: { request: { query: 'hello there' } },
      confidence: 0.5,
      impact: 'medium',
    });

    expect(db.aILearningEvent.create).toHaveBeenCalledTimes(1);
    expect(result.newPredictions).toEqual([]);
    expect(result.insights).toEqual([]);
  });

  it('getUserPatterns returns empty array without parse errors when no rows', async () => {
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([]);

    const patterns = await engine.getUserPatterns('user-1');

    expect(patterns).toEqual([]);
  });

  it('getUserPatterns parses pattern_discovery artifact rows', async () => {
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([
      {
        id: 'row-1',
        userId: 'user-1',
        eventType: 'pattern_discovery',
        context: 'derived:pattern:behavioral:modules',
        newBehavior: 'behavioral pattern (90% confidence)',
        patternData: {
          schemaVersion: 1,
          artifact: {
            id: 'behavioral_1',
            userId: 'user-1',
            patternType: 'behavioral',
            confidence: 0.9,
            strength: 0.7,
            frequency: 4,
            lastObserved: '2026-05-21T12:00:00.000Z',
            data: { activeModules: [['chat', 4]] },
            predictions: [],
          },
        },
        confidence: 0.9,
        frequency: 4,
        applied: true,
        validated: true,
        createdAt: new Date('2026-05-21T12:00:00.000Z'),
      },
    ] as never);

    const patterns = await engine.getUserPatterns('user-1');

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.patternType).toBe('behavioral');
    expect(patterns[0]?.confidence).toBe(0.9);
  });
});
