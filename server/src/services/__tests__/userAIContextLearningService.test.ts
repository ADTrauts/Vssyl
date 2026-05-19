import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  UserAIContextLearningService,
  LEARNING_STATUS_ACTIVE,
  LEARNING_STATUS_PENDING,
  LEARNING_STATUS_DISMISSED,
  promptEligibleContextWhere,
} from '../userAIContextLearningService';

function mockDb() {
  return {
    userAIContext: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('userAIContextLearningService', () => {
  let db: PrismaClient;
  let service: UserAIContextLearningService;

  beforeEach(() => {
    db = mockDb();
    service = new UserAIContextLearningService(db);
  });

  it('promptEligibleContextWhere requires active learning status', () => {
    expect(promptEligibleContextWhere('u1')).toEqual({
      userId: 'u1',
      active: true,
      learningStatus: LEARNING_STATUS_ACTIVE,
    });
  });

  it('promote sets active and user source', async () => {
    vi.mocked(db.userAIContext.findFirst).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      learningStatus: LEARNING_STATUS_PENDING,
    } as never);
    vi.mocked(db.userAIContext.update).mockResolvedValue({
      id: 'c1',
      title: 'Job',
      content: 'Engineer',
      contextType: 'fact',
      createdAt: new Date(),
    } as never);

    const result = await service.promote('u1', 'c1');
    expect(result.title).toBe('Job');
    expect(db.userAIContext.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: {
        learningStatus: LEARNING_STATUS_ACTIVE,
        active: true,
        source: 'user',
      },
      select: expect.any(Object),
    });
  });

  it('dismiss marks dismissed and inactive', async () => {
    vi.mocked(db.userAIContext.findFirst).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      learningStatus: LEARNING_STATUS_PENDING,
    } as never);

    await service.dismiss('u1', 'c1');
    expect(db.userAIContext.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: {
        learningStatus: LEARNING_STATUS_DISMISSED,
        active: false,
      },
    });
  });

  it('rejects promote when not pending', async () => {
    vi.mocked(db.userAIContext.findFirst).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      learningStatus: LEARNING_STATUS_ACTIVE,
    } as never);

    await expect(service.promote('u1', 'c1')).rejects.toThrow(/pending/);
  });
});
