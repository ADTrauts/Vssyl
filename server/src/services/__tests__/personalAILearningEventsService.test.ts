import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PersonalAILearningEventsService } from '../personalAILearningEventsService';

function mockDb() {
  return {
    aILearningEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('personalAILearningEventsService', () => {
  let db: PrismaClient;
  let service: PersonalAILearningEventsService;

  beforeEach(() => {
    db = mockDb();
    service = new PersonalAILearningEventsService(db);
  });

  it('listForUser filters pending events by validated=false', async () => {
    vi.mocked(db.aILearningEvent.findMany).mockResolvedValue([]);

    await service.listForUser('user-1', 'pending', 25);

    expect(db.aILearningEvent.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', validated: false },
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
        where: { userId: 'user-1', validated: true },
      })
    );
  });

  it('reviewEvent approves and marks validated', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'evt-1',
      userId: 'user-1',
      validated: false,
      userFeedback: null,
    } as never);
    vi.mocked(db.aILearningEvent.update).mockResolvedValue({
      id: 'evt-1',
      eventType: 'preference',
      context: 'chat',
      sourceModule: 'chat',
      oldBehavior: null,
      newBehavior: 'Prefer concise replies',
      userFeedback: null,
      confidence: 0.9,
      frequency: 1,
      applied: true,
      validated: true,
      createdAt: new Date(),
    } as never);

    const result = await service.reviewEvent('user-1', 'evt-1', true);

    expect(result.applied).toBe(true);
    expect(db.aILearningEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt-1' },
      data: {
        validated: true,
        applied: true,
        userFeedback: null,
      },
      select: expect.any(Object),
    });
  });

  it('reviewEvent dismisses with feedback note', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'evt-2',
      userId: 'user-1',
      validated: false,
      userFeedback: null,
    } as never);
    vi.mocked(db.aILearningEvent.update).mockResolvedValue({} as never);

    await service.reviewEvent('user-1', 'evt-2', false, 'not relevant');

    expect(db.aILearningEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt-2' },
      data: {
        validated: true,
        applied: false,
        userFeedback: '[dismissed] not relevant',
      },
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
