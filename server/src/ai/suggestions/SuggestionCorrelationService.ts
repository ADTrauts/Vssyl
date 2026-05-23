/**
 * Correlates domain events with recent signals → suggestion candidates (Phase 5B).
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { DomainEvent } from '../../events/types';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  resolveDashboardIdFromEvent,
  resolveSourceModuleFromEvent,
} from './suggestionEventUtils';
import {
  rulesForEventType,
  type SuggestionCandidate,
  type SuggestionRuleContext,
} from './suggestionRules';

/** Default lookback for cross-event correlation context. */
export const SIGNAL_LOOKBACK_MS = 48 * 60 * 60 * 1000;

export interface CorrelationResult {
  signalId: string;
  candidates: SuggestionCandidate[];
  evaluatedRuleIds: string[];
}

export class SuggestionCorrelationService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async recordSignalFromDomainEvent(event: DomainEvent): Promise<{ id: string }> {
    const dashboardId = resolveDashboardIdFromEvent(event);
    const signal = await this.db.aISuggestionSignal.create({
      data: {
        userId: event.actorUserId,
        dashboardId,
        businessId: event.businessId ?? null,
        domainEventId: event.id,
        domainEventType: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        sourceModule: resolveSourceModuleFromEvent(event),
        occurredAt: new Date(event.createdAt),
        metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    void logger.debug('Ambient suggestion signal recorded', {
      operation: 'ambient_suggestion_signal_recorded',
      signalId: signal.id,
      domainEventId: event.id,
      domainEventType: event.type,
      userId: event.actorUserId,
    });

    return { id: signal.id };
  }

  async loadRecentSignals(
    userId: string,
    dashboardId: string | null,
    lookbackMs: number = SIGNAL_LOOKBACK_MS
  ) {
    const since = new Date(Date.now() - lookbackMs);
    return this.db.aISuggestionSignal.findMany({
      where: {
        userId,
        ...(dashboardId ? { dashboardId } : {}),
        occurredAt: { gte: since },
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }

  async correlateFromDomainEvent(event: DomainEvent): Promise<CorrelationResult> {
    const { id: signalId } = await this.recordSignalFromDomainEvent(event);
    const dashboardId = resolveDashboardIdFromEvent(event);
    const recentSignals = await this.loadRecentSignals(event.actorUserId, dashboardId);

    const applicableRules = rulesForEventType(event.type);
    const candidates: SuggestionCandidate[] = [];
    const evaluatedRuleIds: string[] = [];

    const ctx: SuggestionRuleContext = {
      event,
      signalId,
      db: this.db,
      recentSignals,
    };

    for (const rule of applicableRules) {
      evaluatedRuleIds.push(rule.id);
      try {
        const candidate = await rule.evaluate(ctx);
        if (candidate && candidate.confidence >= rule.minConfidence) {
          candidates.push(candidate);
        }
      } catch (ruleErr: unknown) {
        const error = ruleErr instanceof Error ? ruleErr : new Error(String(ruleErr));
        void logger.warn('Suggestion rule evaluation failed', {
          operation: 'ambient_suggestion_rule_error',
          ruleId: rule.id,
          domainEventId: event.id,
          error: { message: error.message, stack: error.stack },
        });
      }
    }

    await this.db.aISuggestionSignal.update({
      where: { id: signalId },
      data: {
        processedAt: new Date(),
        ruleIds: evaluatedRuleIds,
      },
    });

    if (candidates.length > 0) {
      void logger.debug('Ambient suggestion correlation complete', {
        operation: 'ambient_suggestion_correlated',
        domainEventId: event.id,
        signalId,
        candidateCount: candidates.length,
        ruleIds: evaluatedRuleIds,
      });
    }

    return { signalId, candidates, evaluatedRuleIds };
  }
}

export const suggestionCorrelationService = new SuggestionCorrelationService();
