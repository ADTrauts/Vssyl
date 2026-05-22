import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { LearningApplicationService } from '../learningApplicationService';
import { LEARNING_EVENT_TYPES } from '../../ai/learning/learningProposalTypes';
import { LEARNING_LAST_PROMOTION_PREF_KEY } from '../../ai/learning/learningApplicationTypes';

vi.mock('../userMemoryFactService', () => ({
  createUserMemoryFact: vi.fn().mockResolvedValue({
    id: 'fact-1',
    subject: 'Style',
    predicate: 'Prefer concise replies',
  }),
}));

import { createUserMemoryFact } from '../userMemoryFactService';

function mockDb() {
  return {
    userAIContext: {
      create: vi.fn(),
    },
    aIPersonalityProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    userPreference: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    aILearningEvent: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('LearningApplicationService', () => {
  let db: PrismaClient;
  let service: LearningApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = mockDb();
    service = new LearningApplicationService(db);
  });

  it('applyApprovedEvent creates memory fact for correction events', async () => {
    const event = {
      id: 'evt-1',
      userId: 'user-1',
      eventType: LEARNING_EVENT_TYPES.CORRECTION,
      context: 'Chat style',
      oldBehavior: 'Was: verbose',
      newBehavior: 'Prefer concise replies',
      confidence: 0.8,
      moduleSpecificData: null,
      patternData: null,
    } as never;

    vi.mocked(db.userPreference.findFirst).mockResolvedValue(null);
    vi.mocked(db.userPreference.create).mockResolvedValue({} as never);

    const record = await service.applyApprovedEvent(event);

    expect(createUserMemoryFact).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        subject: 'Chat style',
        predicate: 'Prefer concise replies',
        isExplicit: true,
      })
    );
    expect(record.targetType).toBe('memory');
    expect(record.targetId).toBe('fact-1');
  });

  it('applyApprovedEvent creates UserAIContext for preference updates', async () => {
    vi.mocked(db.userAIContext.create).mockResolvedValue({ id: 'ctx-1' } as never);
    vi.mocked(db.userPreference.findFirst).mockResolvedValue(null);
    vi.mocked(db.userPreference.create).mockResolvedValue({} as never);

    const event = {
      id: 'evt-2',
      userId: 'user-1',
      eventType: LEARNING_EVENT_TYPES.PREFERENCE_UPDATE,
      context: 'Tone',
      oldBehavior: null,
      newBehavior: 'Use warm, friendly tone',
      confidence: 0.75,
      moduleSpecificData: null,
      patternData: null,
    } as never;

    const record = await service.applyApprovedEvent(event);

    expect(db.userAIContext.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          contextType: 'preference',
          learningStatus: 'active',
          source: 'user',
        }),
      })
    );
    expect(record.targetType).toBe('preference');
    expect(record.targetId).toBe('ctx-1');
  });

  it('buildApprovedUpdate bumps confidence and embeds application metadata', () => {
    const event = {
      id: 'evt-3',
      userId: 'user-1',
      eventType: LEARNING_EVENT_TYPES.FEEDBACK,
      context: 'Feedback',
      oldBehavior: null,
      newBehavior: 'Keep answers brief',
      confidence: 0.7,
      patternData: null,
    } as never;

    const update = service.buildApprovedUpdate(event, {
      targetType: 'preference',
      targetId: 'ctx-2',
      beforeSummary: 'Default',
      afterSummary: 'Keep answers brief',
      appliedAt: '2026-05-21T00:00:00.000Z',
    });

    expect(update.confidence).toBeCloseTo(0.75);
    expect(update.patternData).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        artifact: expect.objectContaining({
          application: expect.objectContaining({ targetId: 'ctx-2' }),
        }),
      })
    );
  });

  it('buildDismissedUpdate decays confidence with floor', () => {
    const event = {
      newBehavior: 'test',
      confidence: 0.3,
      patternData: null,
    } as never;

    const update = service.buildDismissedUpdate(event);
    expect(update.confidence).toBe(0.25);
  });

  it('getWhatChangedSummary reads from user preference snapshot', async () => {
    const summary = {
      targetType: 'preference',
      targetId: 'ctx-1',
      beforeSummary: 'Before',
      afterSummary: 'After',
      appliedAt: '2026-05-21T00:00:00.000Z',
    };
    vi.mocked(db.userPreference.findFirst).mockResolvedValue({
      value: JSON.stringify(summary),
    } as never);
    vi.mocked(db.aILearningEvent.count).mockResolvedValue(0);

    const result = await service.getWhatChangedSummary('user-1');

    expect(result?.afterSummary).toBe('After');
    expect(db.userPreference.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', key: LEARNING_LAST_PROMOTION_PREF_KEY },
    });
  });
});
