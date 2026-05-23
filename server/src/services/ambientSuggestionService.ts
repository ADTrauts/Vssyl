/**
 * Ambient contextual assistance — suggestion lifecycle (Phase 5A–5B).
 * Explainable, user-initiated suggestions only — no auto-execution.
 */

import { Prisma, type AISuggestion, type PrismaClient } from '@prisma/client';
import type { DomainEvent } from '../events/types';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';
import { userLearningSignalService } from './userLearningSignalService';
import { shouldDeferOutboundNotification } from './quietHoursService';
import {
  DEFAULT_SUGGESTION_TTL_MS,
  DEDUPE_WINDOW_MS,
  SUPPRESSION_BLOCK_MS,
  type DocumentUploadActionData,
  type SuggestionExplainability,
} from '../ai/suggestions/suggestionTypes';
import type { SuggestionCandidate } from '../ai/suggestions/suggestionRuleTypes';
import { suggestionCorrelationService } from '../ai/suggestions/SuggestionCorrelationService';
import { suggestionRankingService } from '../ai/suggestions/SuggestionRankingService';
import { resolveDashboardIdFromEvent } from '../ai/suggestions/suggestionEventUtils';

export class AmbientSuggestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmbientSuggestionValidationError';
  }
}

export type AmbientSuggestionListScope = 'pending' | 'history' | 'all';

export interface ListAmbientSuggestionsFilter {
  dashboardId?: string;
  businessId?: string;
  scope?: AmbientSuggestionListScope;
}

export interface AcceptSuggestionResult {
  suggestionId: string;
  fileId?: string;
  suggestedPrompt?: string;
  actionUrl: string;
}

export interface DismissSuggestionInput {
  reason?: string;
  doNotShowAgain?: boolean;
  dashboardId?: string;
  businessId?: string;
}

export interface CreateAmbientSuggestionInput {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  suggestionType: string;
  title: string;
  body: string;
  actionData: Prisma.InputJsonValue;
  confidence: number;
  explainability: SuggestionExplainability;
  correlationRuleId: string;
  suppressionKey: string;
  priority?: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  sourceEventIds?: string[];
  notify?: boolean;
}

function notExpiredWhere(now: Date): Prisma.AISuggestionWhereInput {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

/** Tenant-safe list filter for pending, non-expired suggestions. */
export function buildSuggestionListWhere(
  userId: string,
  filter?: ListAmbientSuggestionsFilter
): Prisma.AISuggestionWhereInput {
  const now = new Date();
  const where: Prisma.AISuggestionWhereInput = {
    userId,
    status: 'PENDING',
    AND: [notExpiredWhere(now)],
  };

  if (filter?.dashboardId) {
    where.dashboardId = filter.dashboardId;
  }

  if (filter?.businessId) {
    where.businessId = filter.businessId;
  }

  return where;
}

export class AmbientSuggestionService {
  constructor(private readonly db: PrismaClient = prisma) {}

  private async assertDashboardAccess(userId: string, dashboardId: string): Promise<void> {
    const dashboard = await this.db.dashboard.findFirst({
      where: { id: dashboardId, userId },
    });
    if (!dashboard) {
      throw new AmbientSuggestionValidationError('Dashboard not found or not accessible');
    }
  }

  private async assertBusinessMembership(userId: string, businessId: string): Promise<void> {
    const member = await this.db.businessMember.findFirst({
      where: { userId, businessId },
    });
    if (!member) {
      throw new AmbientSuggestionValidationError('You are not a member of this business workspace');
    }
  }

  async expireStaleSuggestions(userId?: string): Promise<number> {
    const now = new Date();
    const result = await this.db.aISuggestion.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
        ...(userId ? { userId } : {}),
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      void logger.info('Expired stale ambient suggestions', {
        operation: 'ambient_suggestion_expired',
        count: result.count,
        userId: userId ?? 'all',
      });
    }

    return result.count;
  }

  async listPending(
    userId: string,
    filter?: ListAmbientSuggestionsFilter
  ): Promise<AISuggestion[]> {
    return this.listSuggestions(userId, { ...filter, scope: 'pending' });
  }

  async listRecentHistory(
    userId: string,
    filter?: ListAmbientSuggestionsFilter
  ): Promise<AISuggestion[]> {
    return this.listSuggestions(userId, { ...filter, scope: 'history' });
  }

  async listSuggestions(
    userId: string,
    filter?: ListAmbientSuggestionsFilter
  ): Promise<AISuggestion[]> {
    if (filter?.dashboardId) {
      await this.assertDashboardAccess(userId, filter.dashboardId);
    }
    if (filter?.businessId) {
      await this.assertBusinessMembership(userId, filter.businessId);
    }

    await this.expireStaleSuggestions(userId);

    const scope = filter?.scope ?? 'pending';

    if (scope === 'pending') {
      return this.db.aISuggestion.findMany({
        where: buildSuggestionListWhere(userId, filter),
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    if (scope === 'history') {
      const where: Prisma.AISuggestionWhereInput = {
        userId,
        status: { in: ['ACCEPTED', 'DISMISSED', 'EXPIRED'] },
      };
      if (filter?.dashboardId) where.dashboardId = filter.dashboardId;
      if (filter?.businessId) where.businessId = filter.businessId;

      return this.db.aISuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    const [pending, history] = await Promise.all([
      this.listSuggestions(userId, { ...filter, scope: 'pending' }),
      this.listSuggestions(userId, { ...filter, scope: 'history' }),
    ]);
    const seen = new Set<string>();
    return [...pending, ...history].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  async getById(userId: string, suggestionId: string): Promise<AISuggestion | null> {
    await this.expireStaleSuggestions(userId);
    return this.db.aISuggestion.findFirst({
      where: { id: suggestionId, userId },
    });
  }

  getExplainPayload(suggestion: AISuggestion): SuggestionExplainability | null {
    if (!suggestion.explainability || typeof suggestion.explainability !== 'object') {
      return null;
    }
    return suggestion.explainability as unknown as SuggestionExplainability;
  }

  private async isSuppressed(userId: string, suppressionKey: string): Promise<boolean> {
    const since = new Date(Date.now() - SUPPRESSION_BLOCK_MS);
    const blocked = await this.db.aISuggestionFeedback.findFirst({
      where: {
        userId,
        suppressionKey,
        doNotShowAgain: true,
        createdAt: { gte: since },
      },
    });
    return Boolean(blocked);
  }

  private async hasRecentDuplicate(
    userId: string,
    suppressionKey: string
  ): Promise<boolean> {
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const existing = await this.db.aISuggestion.findFirst({
      where: {
        userId,
        suppressionKey,
        createdAt: { gte: since },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    return Boolean(existing);
  }

  async createSuggestion(input: CreateAmbientSuggestionInput): Promise<AISuggestion | null> {
    await this.assertDashboardAccess(input.userId, input.dashboardId);
    if (input.businessId) {
      await this.assertBusinessMembership(input.userId, input.businessId);
    }

    if (await this.isSuppressed(input.userId, input.suppressionKey)) {
      void logger.debug('Skipped suppressed ambient suggestion', {
        operation: 'ambient_suggestion_suppressed',
        userId: input.userId,
        suppressionKey: input.suppressionKey,
      });
      return null;
    }

    if (await this.hasRecentDuplicate(input.userId, input.suppressionKey)) {
      void logger.debug('Skipped duplicate ambient suggestion', {
        operation: 'ambient_suggestion_deduped',
        userId: input.userId,
        suppressionKey: input.suppressionKey,
      });
      return null;
    }

    const expiresAt = input.expiresAt ?? new Date(Date.now() + DEFAULT_SUGGESTION_TTL_MS);
    const now = new Date();

    const suggestion = await this.db.aISuggestion.create({
      data: {
        userId: input.userId,
        dashboardId: input.dashboardId,
        businessId: input.businessId ?? null,
        householdId: input.householdId ?? null,
        type: input.suggestionType,
        suggestionType: input.suggestionType,
        title: input.title,
        body: input.body,
        actionData: input.actionData,
        status: 'PENDING',
        priority: input.priority ?? 'normal',
        confidence: input.confidence,
        explainability: input.explainability as unknown as Prisma.InputJsonValue,
        expiresAt,
        shownAt: now,
        suppressionKey: input.suppressionKey,
        correlationRuleId: input.correlationRuleId,
      },
    });

    if (input.notify !== false) {
      const deferNotification = await shouldDeferOutboundNotification(input.userId);
      if (!deferNotification) {
        const actionData = input.actionData as unknown as DocumentUploadActionData;
        await NotificationService.createNotification({
          userId: input.userId,
          type: 'ai_suggestion',
          title: 'AI suggestion',
          body: suggestion.body,
          data: {
            suggestionId: suggestion.id,
            fileId: actionData.fileId,
            actionUrl: `/ai-chat?suggestion=${suggestion.id}`,
          },
        });
      } else {
        void logger.debug('Deferred ai_suggestion outbound notification (quiet hours / DND)', {
          operation: 'ambient_suggestion_notify_deferred',
          userId: input.userId,
          suggestionId: suggestion.id,
        });
      }
    }

    void logger.info('Ambient suggestion created', {
      operation: 'ambient_suggestion_created',
      suggestionId: suggestion.id,
      userId: input.userId,
      suggestionType: input.suggestionType,
      correlationRuleId: input.correlationRuleId,
      confidence: input.confidence,
    });

    return suggestion;
  }

  private candidateToCreateInput(candidate: SuggestionCandidate): CreateAmbientSuggestionInput {
    return {
      userId: candidate.userId,
      dashboardId: candidate.dashboardId,
      businessId: candidate.businessId,
      householdId: candidate.householdId,
      suggestionType: candidate.suggestionType,
      title: candidate.title,
      body: candidate.body,
      actionData: candidate.actionData,
      confidence: candidate.confidence,
      explainability: candidate.explainability,
      correlationRuleId: candidate.correlationRuleId,
      suppressionKey: candidate.suppressionKey,
      priority: candidate.priority,
      expiresAt: candidate.expiresAt,
      sourceEventIds: candidate.sourceEventIds,
    };
  }

  /**
   * Domain event → signal → correlate → rank → create suggestions (Phase 5B).
   */
  async processDomainEvent(event: DomainEvent): Promise<void> {
    if (!event.actorUserId?.trim()) {
      return;
    }

    const { candidates } = await suggestionCorrelationService.correlateFromDomainEvent(event);
    if (candidates.length === 0) {
      return;
    }

    const dashboardId = resolveDashboardIdFromEvent(event);
    if (!dashboardId) {
      void logger.warn('Ambient suggestions skipped — no dashboardId on event', {
        operation: 'ambient_suggestion_skipped',
        domainEventId: event.id,
        userId: event.actorUserId,
      });
      return;
    }

    const { accepted } = await suggestionRankingService.filterCandidates(
      event.actorUserId,
      dashboardId,
      candidates
    );

    for (const candidate of accepted) {
      await this.createSuggestion(this.candidateToCreateInput(candidate));
    }
  }

  /** Fire-and-forget wrapper for domain event subscribers (non-blocking emit path). */
  scheduleProcessDomainEvent(event: DomainEvent): void {
    void this.processDomainEvent(event).catch((err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      void logger.warn('Ambient suggestion processing failed', {
        operation: 'ambient_suggestion_process_error',
        domainEventId: event.id,
        type: event.type,
        error: { message: error.message, stack: error.stack },
      });
    });
  }

  async acceptSuggestion(
    userId: string,
    suggestionId: string,
    tenantScope?: { dashboardId?: string; businessId?: string }
  ): Promise<AcceptSuggestionResult> {
    const suggestion = await this.db.aISuggestion.findFirst({
      where: { id: suggestionId, userId, status: 'PENDING' },
    });
    if (!suggestion) {
      throw new AmbientSuggestionValidationError('Suggestion not found or already handled');
    }

    if (suggestion.expiresAt && suggestion.expiresAt <= new Date()) {
      await this.db.aISuggestion.update({
        where: { id: suggestionId },
        data: { status: 'EXPIRED' },
      });
      throw new AmbientSuggestionValidationError('Suggestion has expired');
    }

    await this.db.aISuggestion.update({
      where: { id: suggestionId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });

    await this.db.aISuggestionFeedback.create({
      data: {
        suggestionId,
        userId,
        action: 'accepted',
        suppressionKey: suggestion.suppressionKey,
      },
    });

    try {
      await userLearningSignalService.recordSuggestionAccepted({
        userId,
        suggestionId,
        suggestionType: suggestion.suggestionType ?? suggestion.type,
        suggestionTitle: suggestion.title,
        correlationRuleId: suggestion.correlationRuleId,
        suppressionKey: suggestion.suppressionKey,
        dashboardId: tenantScope?.dashboardId ?? suggestion.dashboardId ?? undefined,
        businessId: tenantScope?.businessId ?? suggestion.businessId ?? undefined,
      });
    } catch (signalErr: unknown) {
      const error = signalErr instanceof Error ? signalErr : new Error(String(signalErr));
      void logger.warn('Accept suggestion signal failed', {
        operation: 'ambient_suggestion_accept_signal_error',
        suggestionId,
        error: { message: error.message },
      });
    }

    void logger.info('Ambient suggestion accepted', {
      operation: 'ambient_suggestion_accepted',
      suggestionId,
      userId,
      suggestionType: suggestion.suggestionType ?? suggestion.type,
    });

    const actionData = suggestion.actionData as Record<string, unknown> | null;
    const fileId = typeof actionData?.fileId === 'string' ? actionData.fileId : undefined;
    const suggestedPrompt =
      typeof actionData?.suggestedPrompt === 'string' ? actionData.suggestedPrompt : undefined;

    return {
      suggestionId,
      fileId,
      suggestedPrompt:
        suggestedPrompt ??
        'Extract key information from this document. Identify important details like dates, amounts, names, and any actionable items.',
      actionUrl: fileId
        ? `/ai-chat?fileIds=${encodeURIComponent(fileId)}&suggestion=extract`
        : '/ai-chat',
    };
  }

  async dismissSuggestion(
    userId: string,
    suggestionId: string,
    input?: DismissSuggestionInput
  ): Promise<{ suggestionId: string }> {
    const suggestion = await this.db.aISuggestion.findFirst({
      where: { id: suggestionId, userId, status: 'PENDING' },
    });
    if (!suggestion) {
      throw new AmbientSuggestionValidationError('Suggestion not found or already handled');
    }

    await this.db.aISuggestion.update({
      where: { id: suggestionId },
      data: { status: 'DISMISSED', respondedAt: new Date() },
    });

    await this.db.aISuggestionFeedback.create({
      data: {
        suggestionId,
        userId,
        action: 'dismissed',
        reason: input?.reason,
        doNotShowAgain: input?.doNotShowAgain ?? false,
        suppressionKey: suggestion.suppressionKey,
      },
    });

    try {
      await userLearningSignalService.recordSuggestionDismissed({
        userId,
        suggestionId,
        suggestionType: suggestion.suggestionType ?? suggestion.type,
        suggestionTitle: suggestion.title,
        correlationRuleId: suggestion.correlationRuleId,
        suppressionKey: suggestion.suppressionKey,
        doNotShowAgain: input?.doNotShowAgain,
        reason: input?.reason,
        dashboardId: input?.dashboardId ?? suggestion.dashboardId ?? undefined,
        businessId: input?.businessId ?? suggestion.businessId ?? undefined,
      });
    } catch (signalErr: unknown) {
      const error = signalErr instanceof Error ? signalErr : new Error(String(signalErr));
      void logger.warn('Dismiss suggestion signal failed', {
        operation: 'ambient_suggestion_dismiss_signal_error',
        suggestionId,
        error: { message: error.message },
      });
    }

    void logger.info('Ambient suggestion dismissed', {
      operation: 'ambient_suggestion_dismissed',
      suggestionId,
      userId,
      doNotShowAgain: input?.doNotShowAgain ?? false,
    });

    return { suggestionId };
  }
}

export const ambientSuggestionService = new AmbientSuggestionService();
