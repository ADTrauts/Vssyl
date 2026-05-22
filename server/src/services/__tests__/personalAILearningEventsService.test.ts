import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PersonalAILearningEventsService } from '../personalAILearningEventsService';
import type { LearningApplicationService } from '../learningApplicationService';

function mockDb() {
  return {
    aILearningEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

function mockApplication(): LearningApplicationService {
  return {
    applyApprovedEvent: vi.fn().mockResolvedValue({
      targetType: 'preference',
      targetId: 'ctx-1',
      beforeSummary: 'Before',
      afterSummary: 'After',
      appliedAt: '2026-05-21T00:00:00.000Z',
    }),
    buildApprovedUpdate: vi.fn().mockReturnValue({
      confidence: 0.95,
      patternData: { schemaVersion: 1, artifact: {} },
    }),
    buildDismissedUpdate: vi.fn().mockReturnValue({
      confidence: 0.6,
      patternData: { schemaVersion: 1, artifact: { dismissedAt: '2026-05-21' } },
    }),
  } as unknown as LearningApplicationService;
}

describe('personalAILearningEventsService', () => {
  let db: PrismaClient;
  let application: LearningApplicationService;
  let service: PersonalAILearningEventsService;

  beforeEach(() => {
    db = mockDb();
    application = mockApplication();
    service = new PersonalAILearningEventsService(db, application);
  });

  it('listForUser filters pending events by validated=false', async () => {
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([]);

    await service.listForUser('user-1', 'pending', 25);

    expect(db.aILearningEvent.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        validated: false,
        eventType: { in: expect.arrayContaining(['correction', 'feedback', 'preference_update']) },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: expect.any(Object),
    });
  });

  it('listForUser filters validated events', async () => {
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([]);

    await service.listForUser('user-1', 'validated');

    expect(db.aILearningEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          validated: true,
          eventType: { in: expect.any(Array) },
        },
      })
    );
  });

  it('reviewEvent approves, applies learning, and marks validated', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'evt-1',
      userId: 'user-1',
      validated: false,
      userFeedback: null,
      eventType: 'preference_update',
      newBehavior: 'Prefer concise replies',
      confidence: 0.9,
      patternData: null,
    } as never);
    vi.mocked(db.aILearningEvent.update).mockResolvedValue({
      id: 'evt-1',
      eventType: 'preference_update',
      context: 'chat',
      sourceModule: 'chat',
      oldBehavior: null,
      newBehavior: 'Prefer concise replies',
      userFeedback: null,
      confidence: 0.95,
      frequency: 1,
      applied: true,
      validated: true,
      createdAt: new Date(),
    } as never);

    const result = await service.reviewEvent('user-1', 'evt-1', true);

    expect(application.applyApprovedEvent).toHaveBeenCalled();
    expect(application.buildApprovedUpdate).toHaveBeenCalled();
    expect(result.applied).toBe(true);
    expect(db.aILearningEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt-1' },
      data: expect.objectContaining({
        validated: true,
        applied: true,
        confidence: 0.95,
      }),
      select: expect.any(Object),
    });
  });

  it('reviewEvent dismisses with feedback note and confidence decay', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'evt-2',
      userId: 'user-1',
      validated: false,
      userFeedback: null,
      confidence: 0.7,
      newBehavior: 'test',
      patternData: null,
    } as never);
    vi.mocked(db.aILearningEvent.update).mockResolvedValue({} as never);

    await service.reviewEvent('user-1', 'evt-2', false, 'not relevant');

    expect(application.buildDismissedUpdate).toHaveBeenCalled();
    expect(application.applyApprovedEvent).not.toHaveBeenCalled();
    expect(db.aILearningEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt-2' },
      data: expect.objectContaining({
        validated: true,
        applied: false,
        userFeedback: '[dismissed] not relevant',
        confidence: 0.6,
      }),
      select: expect.any(Object),
    });
  });

  it('reviewEvent throws when event missing', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue(null);

    await expect(service.reviewEvent('user-1', 'missing', true)).rejects.toThrow(
      'Learning event not found'
    );
  });

  it('reviewEvent throws when already reviewed', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'evt-3',
      userId: 'user-1',
      validated: true,
    } as never);

    await expect(service.reviewEvent('user-1', 'evt-3', true)).rejects.toThrow(
      'Learning event already reviewed'
    );
  });
});
