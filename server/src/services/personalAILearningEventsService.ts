import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface PersonalLearningEventSummary {
  id: string;
  eventType: string;
  context: string;
  sourceModule: string | null;
  oldBehavior: string | null;
  newBehavior: string;
  userFeedback: string | null;
  confidence: number;
  frequency: number;
  applied: boolean;
  validated: boolean;
  createdAt: Date;
}

export type PersonalLearningEventListStatus = 'pending' | 'validated' | 'all';

export class PersonalAILearningEventsService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listForUser(
    userId: string,
    status: PersonalLearningEventListStatus = 'pending',
    limit = 50
  ): Promise<PersonalLearningEventSummary[]> {
    const where: { userId: string; validated?: boolean } = { userId };
    if (status === 'pending') {
      where.validated = false;
    } else if (status === 'validated') {
      where.validated = true;
    }

    const rows = await this.db.aILearningEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: {
        id: true,
        eventType: true,
        context: true,
        sourceModule: true,
        oldBehavior: true,
        newBehavior: true,
        userFeedback: true,
        confidence: true,
        frequency: true,
        applied: true,
        validated: true,
        createdAt: true,
      },
    });

    return rows;
  }

  async reviewEvent(
    userId: string,
    eventId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<PersonalLearningEventSummary> {
    const existing = await this.db.aILearningEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) {
      throw new Error('Learning event not found');
    }

    if (existing.validated) {
      throw new Error('Learning event already reviewed');
    }

    const feedbackNote =
      !approved && rejectionReason?.trim()
        ? `[dismissed] ${rejectionReason.trim()}`
        : !approved
          ? '[dismissed by user]'
          : existing.userFeedback;

    const updated = await this.db.aILearningEvent.update({
      where: { id: eventId },
      data: {
        validated: true,
        applied: approved,
        userFeedback: feedbackNote,
      },
      select: {
        id: true,
        eventType: true,
        context: true,
        sourceModule: true,
        oldBehavior: true,
        newBehavior: true,
        userFeedback: true,
        confidence: true,
        frequency: true,
        applied: true,
        validated: true,
        createdAt: true,
      },
    });

    void logger.info('Personal AI learning event reviewed', {
      operation: 'personal_ai_learning_event_review',
      userId,
      eventId,
      approved,
    });

    return updated;
  }
}

export const personalAILearningEventsService = new PersonalAILearningEventsService();
