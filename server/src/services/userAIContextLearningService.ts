import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { learningApplicationService } from './learningApplicationService';

export const LEARNING_STATUS_ACTIVE = 'active';
export const LEARNING_STATUS_PENDING = 'pending';
export const LEARNING_STATUS_DISMISSED = 'dismissed';

export type UserAIContextLearningStatus =
  | typeof LEARNING_STATUS_ACTIVE
  | typeof LEARNING_STATUS_PENDING
  | typeof LEARNING_STATUS_DISMISSED;

export interface PendingLearningSummary {
  id: string;
  title: string;
  content: string;
  contextType: string;
  createdAt: Date;
}

/** Rows eligible for prompts and PreferenceResolver inferred preferences */
export function promptEligibleContextWhere(userId: string): {
  userId: string;
  active: boolean;
  learningStatus: string;
} {
  return {
    userId,
    active: true,
    learningStatus: LEARNING_STATUS_ACTIVE,
  };
}

export class UserAIContextLearningService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listPending(userId: string): Promise<PendingLearningSummary[]> {
    const rows = await this.db.userAIContext.findMany({
      where: {
        userId,
        learningStatus: LEARNING_STATUS_PENDING,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        contextType: true,
        createdAt: true,
      },
    });
    return rows;
  }

  async getLatestPendingSummary(userId: string): Promise<PendingLearningSummary | null> {
    const rows = await this.listPending(userId);
    return rows[0] ?? null;
  }

  async countPending(userId: string): Promise<number> {
    return this.db.userAIContext.count({
      where: {
        userId,
        learningStatus: LEARNING_STATUS_PENDING,
      },
    });
  }

  async promote(userId: string, contextId: string): Promise<PendingLearningSummary> {
    const existing = await this.db.userAIContext.findFirst({
      where: { id: contextId, userId },
    });
    if (!existing) {
      throw new Error('Context not found');
    }
    if (existing.learningStatus !== LEARNING_STATUS_PENDING) {
      throw new Error('Only pending learnings can be promoted');
    }

    const updated = await this.db.userAIContext.update({
      where: { id: contextId },
      data: {
        learningStatus: LEARNING_STATUS_ACTIVE,
        active: true,
        source: 'user',
      },
      select: {
        id: true,
        title: true,
        content: true,
        contextType: true,
        createdAt: true,
      },
    });

    await learningApplicationService.recordContextPromotion({
      userId,
      contextId: updated.id,
      title: updated.title,
      content: updated.content,
    });

    void logger.info('User promoted inferred AI context', {
      operation: 'user_ai_context_promote',
      userId,
      contextId,
    });

    return updated;
  }

  async dismiss(userId: string, contextId: string): Promise<void> {
    const existing = await this.db.userAIContext.findFirst({
      where: { id: contextId, userId },
    });
    if (!existing) {
      throw new Error('Context not found');
    }
    if (existing.learningStatus !== LEARNING_STATUS_PENDING) {
      throw new Error('Only pending learnings can be dismissed');
    }

    await this.db.userAIContext.update({
      where: { id: contextId },
      data: {
        learningStatus: LEARNING_STATUS_DISMISSED,
        active: false,
      },
    });

    void logger.info('User dismissed inferred AI context', {
      operation: 'user_ai_context_dismiss',
      userId,
      contextId,
    });
  }
}

export const userAIContextLearningService = new UserAIContextLearningService();
