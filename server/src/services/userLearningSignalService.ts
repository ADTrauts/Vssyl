import type { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { buildLearningEventArtifactEnvelope } from '../ai/learning/learningEventContract';
import { upsertDerivedLearningEvent } from '../ai/learning/learningEventPersistence';
import { LEARNING_EVENT_TYPES } from '../ai/learning/learningProposalTypes';
import {
  defaultSummaryForSignalType,
  LEARNING_SIGNAL_TYPES,
  type LearningSignalPayload,
  type LearningSignalType,
  type RecordLearningSignalInput,
} from '../ai/learning/learningSignalTypes';

export class LearningSignalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LearningSignalValidationError';
  }
}

const REPEATED_CORRECTION_WINDOW_MS = 48 * 60 * 60 * 1000;
const REPEATED_CORRECTION_THRESHOLD = 2;

export class UserLearningSignalService {
  constructor(private readonly db: PrismaClient = prisma) {}

  private async assertTenancy(
    userId: string,
    input: Pick<RecordLearningSignalInput, 'businessId' | 'dashboardId'>
  ): Promise<void> {
    if (!userId.trim()) {
      throw new LearningSignalValidationError('userId is required');
    }

    if (input.businessId) {
      const member = await this.db.businessMember.findFirst({
        where: { userId, businessId: input.businessId },
      });
      if (!member) {
        throw new LearningSignalValidationError('You are not a member of this business workspace');
      }
    }

    if (input.dashboardId) {
      const dashboard = await this.db.dashboard.findFirst({
        where: { id: input.dashboardId, userId },
      });
      if (!dashboard) {
        throw new LearningSignalValidationError('Dashboard not found or not accessible');
      }
    }
  }

  private buildPayload(input: RecordLearningSignalInput): LearningSignalPayload {
    return {
      signalType: input.signalType,
      userId: input.userId,
      dashboardId: input.dashboardId ?? null,
      businessId: input.businessId ?? null,
      sourceModule: input.sourceModule ?? null,
      summary: input.summary?.trim() || defaultSummaryForSignalType(input.signalType, input.metadata),
      metadata: input.metadata,
      confidence: input.confidence ?? 0.7,
      recordedAt: new Date().toISOString(),
    };
  }

  async recordSignal(input: RecordLearningSignalInput): Promise<{ id: string }> {
    await this.assertTenancy(input.userId, input);
    const payload = this.buildPayload(input);

    if (input.signalType === LEARNING_SIGNAL_TYPES.MODULE_USAGE) {
      const modules = Array.isArray(input.metadata?.modulesReferenced)
        ? (input.metadata.modulesReferenced as string[]).filter(Boolean)
        : [];
      const dedupeKey = `signal:module_usage:${[...modules].sort().join('|') || 'none'}`;
      await upsertDerivedLearningEvent(this.db, {
        userId: input.userId,
        eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
        contextKey: `derived:${dedupeKey}`,
        dedupeKey,
        artifact: payload,
        summary: payload.summary,
        confidence: payload.confidence,
      });
      const row = await this.db.aILearningEvent.findFirst({
        where: { userId: input.userId, context: `derived:${dedupeKey}` },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      return { id: row?.id ?? dedupeKey };
    }

    const row = await this.db.aILearningEvent.create({
      data: {
        userId: input.userId,
        eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
        context: input.sourceModule?.trim() || 'ai',
        sourceModule: input.sourceModule ?? undefined,
        moduleSpecificData: {
          behavioralSignal: true,
          signalType: input.signalType,
          dashboardId: input.dashboardId ?? null,
          businessId: input.businessId ?? null,
        },
        newBehavior: payload.summary,
        patternData: buildLearningEventArtifactEnvelope(payload),
        confidence: payload.confidence,
        frequency: 1,
        applied: true,
        validated: true,
      },
      select: { id: true },
    });

    void logger.info('Behavioral learning signal recorded', {
      operation: 'user_learning_signal_record',
      userId: input.userId,
      signalType: input.signalType,
      eventId: row.id,
      businessId: input.businessId ?? undefined,
      dashboardId: input.dashboardId ?? undefined,
    });

    if (input.signalType === LEARNING_SIGNAL_TYPES.FEEDBACK_NEGATIVE) {
      await this.maybeRecordRepeatedCorrection(input);
    }

    return { id: row.id };
  }

  private async maybeRecordRepeatedCorrection(input: RecordLearningSignalInput): Promise<void> {
    const since = new Date(Date.now() - REPEATED_CORRECTION_WINDOW_MS);
    const sourceModule = input.sourceModule?.trim() || 'ai';

    const recentNegative = await this.db.aILearningEvent.count({
      where: {
        userId: input.userId,
        eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
        context: sourceModule,
        createdAt: { gte: since },
        moduleSpecificData: {
          path: ['signalType'],
          equals: LEARNING_SIGNAL_TYPES.FEEDBACK_NEGATIVE,
        },
      },
    });

    if (recentNegative < REPEATED_CORRECTION_THRESHOLD) return;

    const existing = await this.db.aILearningEvent.findFirst({
      where: {
        userId: input.userId,
        eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
        context: sourceModule,
        createdAt: { gte: since },
        moduleSpecificData: {
          path: ['signalType'],
          equals: LEARNING_SIGNAL_TYPES.REPEATED_CORRECTION,
        },
      },
    });
    if (existing) return;

    await this.recordSignal({
      userId: input.userId,
      signalType: LEARNING_SIGNAL_TYPES.REPEATED_CORRECTION,
      sourceModule,
      dashboardId: input.dashboardId,
      businessId: input.businessId,
      confidence: 0.75,
      metadata: {
        ...input.metadata,
        negativeFeedbackCount: recentNegative,
        windowHours: REPEATED_CORRECTION_WINDOW_MS / (60 * 60 * 1000),
      },
    });
  }

  async recordSuggestionAccepted(input: {
    userId: string;
    suggestionId: string;
    suggestionType: string;
    suggestionTitle: string;
    dashboardId?: string | null;
    businessId?: string | null;
  }): Promise<void> {
    await this.recordSignal({
      userId: input.userId,
      signalType: LEARNING_SIGNAL_TYPES.SUGGESTION_ACCEPTED,
      sourceModule: 'ai',
      dashboardId: input.dashboardId,
      businessId: input.businessId,
      confidence: 0.85,
      metadata: {
        suggestionId: input.suggestionId,
        suggestionType: input.suggestionType,
        suggestionTitle: input.suggestionTitle,
      },
    });
  }

  async recordSuggestionDismissed(input: {
    userId: string;
    suggestionId: string;
    suggestionType: string;
    suggestionTitle: string;
    reason?: string;
    dashboardId?: string | null;
    businessId?: string | null;
  }): Promise<void> {
    await this.recordSignal({
      userId: input.userId,
      signalType: LEARNING_SIGNAL_TYPES.SUGGESTION_DISMISSED,
      sourceModule: 'ai',
      dashboardId: input.dashboardId,
      businessId: input.businessId,
      confidence: 0.7,
      metadata: {
        suggestionId: input.suggestionId,
        suggestionType: input.suggestionType,
        suggestionTitle: input.suggestionTitle,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }

  async recordFeedbackOutcome(input: {
    userId: string;
    interactionId: string;
    rating: number;
    feedback?: string;
    dashboardId?: string | null;
    businessId?: string | null;
    sourceModule?: string | null;
  }): Promise<void> {
    const signalType: LearningSignalType =
      input.rating >= 4
        ? LEARNING_SIGNAL_TYPES.FEEDBACK_POSITIVE
        : input.rating <= 2
          ? LEARNING_SIGNAL_TYPES.FEEDBACK_NEGATIVE
          : LEARNING_SIGNAL_TYPES.FEEDBACK_NEGATIVE;

    if (input.rating === 3) {
      await this.recordSignal({
        userId: input.userId,
        signalType: LEARNING_SIGNAL_TYPES.FEEDBACK_POSITIVE,
        sourceModule: input.sourceModule ?? 'ai',
        dashboardId: input.dashboardId,
        businessId: input.businessId,
        confidence: 0.55,
        metadata: {
          interactionId: input.interactionId,
          rating: input.rating,
          feedback: input.feedback,
          neutral: true,
        },
      });
      return;
    }

    await this.recordSignal({
      userId: input.userId,
      signalType,
      sourceModule: input.sourceModule ?? 'ai',
      dashboardId: input.dashboardId,
      businessId: input.businessId,
      confidence: input.rating >= 4 ? 0.8 : 0.75,
      metadata: {
        interactionId: input.interactionId,
        rating: input.rating,
        feedback: input.feedback,
      },
    });
  }

  async recordModuleUsageFromTwin(input: {
    userId: string;
    modulesReferenced: string[];
    dashboardId?: string | null;
    businessId?: string | null;
    conversationId?: string;
    traceId?: string;
  }): Promise<void> {
    const modules = [...new Set(input.modulesReferenced.map((m) => m.trim()).filter(Boolean))];
    if (modules.length === 0) return;

    await this.recordSignal({
      userId: input.userId,
      signalType: LEARNING_SIGNAL_TYPES.MODULE_USAGE,
      sourceModule: modules[0],
      dashboardId: input.dashboardId,
      businessId: input.businessId,
      confidence: 0.65,
      metadata: {
        modulesReferenced: modules,
        conversationId: input.conversationId,
        traceId: input.traceId,
      },
    });
  }

  /**
   * Phase 4A: idempotent learning stub from post-mutation domain events (no auto-exec).
   */
  async recordDomainEventLearningStub(input: {
    userId: string;
    domainEventId: string;
    domainEventType: string;
    entityType: string;
    entityId: string;
    sourceModule: string;
    dashboardId?: string | null;
    businessId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.assertTenancy(input.userId, {
      businessId: input.businessId ?? undefined,
      dashboardId: input.dashboardId ?? undefined,
    });

    const payload: LearningSignalPayload = {
      signalType: LEARNING_SIGNAL_TYPES.DOMAIN_EVENT,
      userId: input.userId,
      dashboardId: input.dashboardId ?? null,
      businessId: input.businessId ?? null,
      sourceModule: input.sourceModule,
      summary: defaultSummaryForSignalType(LEARNING_SIGNAL_TYPES.DOMAIN_EVENT, {
        domainEventType: input.domainEventType,
      }),
      metadata: {
        domainEventId: input.domainEventId,
        domainEventType: input.domainEventType,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.metadata ?? {}),
      },
      confidence: 0.55,
      recordedAt: new Date().toISOString(),
    };

    const dedupeKey = `signal:domain_event:${input.domainEventId}`;
    await upsertDerivedLearningEvent(this.db, {
      userId: input.userId,
      eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
      contextKey: `derived:${dedupeKey}`,
      dedupeKey,
      artifact: payload,
      summary: payload.summary,
      confidence: payload.confidence,
    });

    void logger.info('Domain event learning stub recorded', {
      operation: 'ai_domain_event_learning_stub',
      userId: input.userId,
      domainEventId: input.domainEventId,
      domainEventType: input.domainEventType,
      sourceModule: input.sourceModule,
    });
  }
}

export const userLearningSignalService = new UserLearningSignalService();
