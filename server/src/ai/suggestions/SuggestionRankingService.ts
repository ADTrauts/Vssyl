/**
 * Scores and filters suggestion candidates before insert (Phase 5B–5E).
 */

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { SuggestionCandidate } from './suggestionRuleTypes';
import {
  applyDismissalDecay,
  dismissalDecaySince,
  suppressionBlockSince,
} from './suggestionFeedbackUtils';

/** Minimum confidence to create a user-visible PENDING suggestion. */
export const MIN_CONFIDENCE_SHOWN = 0.65;

/** Max suggestions created per user + dashboard in a rolling 24h window. */
export const MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H = 3;

const FREQUENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SuggestionRankingRejectionReason =
  | 'below_confidence_threshold'
  | 'frequency_cap'
  | 'rule_min_confidence'
  | 'suppressed'
  | 'dismissal_decay';

export interface RankedSuggestionResult {
  accepted: SuggestionCandidate[];
  rejected: Array<{
    candidate: SuggestionCandidate;
    reason: SuggestionRankingRejectionReason;
  }>;
}

export class SuggestionRankingService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async countRecentSuggestions(userId: string, dashboardId: string): Promise<number> {
    const since = new Date(Date.now() - FREQUENCY_WINDOW_MS);
    return this.db.aISuggestion.count({
      where: {
        userId,
        dashboardId,
        createdAt: { gte: since },
      },
    });
  }

  private async isSuppressed(userId: string, suppressionKey: string): Promise<boolean> {
    const blocked = await this.db.aISuggestionFeedback.findFirst({
      where: {
        userId,
        suppressionKey,
        doNotShowAgain: true,
        createdAt: { gte: suppressionBlockSince() },
      },
    });
    return Boolean(blocked);
  }

  private async countRecentDismissalsByType(
    userId: string,
    suggestionType: string
  ): Promise<number> {
    return this.db.aISuggestionFeedback.count({
      where: {
        userId,
        action: 'dismissed',
        createdAt: { gte: dismissalDecaySince() },
        suggestion: {
          OR: [{ suggestionType }, { type: suggestionType }],
        },
      },
    });
  }

  async filterCandidates(
    userId: string,
    dashboardId: string,
    candidates: SuggestionCandidate[]
  ): Promise<RankedSuggestionResult> {
    const accepted: SuggestionCandidate[] = [];
    const rejected: RankedSuggestionResult['rejected'] = [];

    let recentCount = await this.countRecentSuggestions(userId, dashboardId);
    const remainingSlots = Math.max(0, MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H - recentCount);

    const dismissalCache = new Map<string, number>();

    for (const candidate of candidates) {
      if (await this.isSuppressed(userId, candidate.suppressionKey)) {
        rejected.push({ candidate, reason: 'suppressed' });
        continue;
      }

      let dismissalCount = dismissalCache.get(candidate.suggestionType);
      if (dismissalCount === undefined) {
        dismissalCount = await this.countRecentDismissalsByType(
          userId,
          candidate.suggestionType
        );
        dismissalCache.set(candidate.suggestionType, dismissalCount);
      }

      const adjustedConfidence = applyDismissalDecay(candidate.confidence, dismissalCount);
      const adjustedCandidate =
        adjustedConfidence !== candidate.confidence
          ? { ...candidate, confidence: adjustedConfidence }
          : candidate;

      if (adjustedConfidence < MIN_CONFIDENCE_SHOWN) {
        rejected.push({
          candidate: adjustedCandidate,
          reason: dismissalCount > 0 ? 'dismissal_decay' : 'below_confidence_threshold',
        });
        continue;
      }

      if (accepted.length >= remainingSlots) {
        rejected.push({ candidate: adjustedCandidate, reason: 'frequency_cap' });
        continue;
      }

      accepted.push(this.applyPriority(adjustedCandidate));
      recentCount += 1;
    }

    if (rejected.length > 0) {
      void logger.debug('Ambient suggestion candidates ranked', {
        operation: 'ambient_suggestion_ranked',
        userId,
        dashboardId,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        rejectedReasons: rejected.map((r) => ({
          ruleId: r.candidate.correlationRuleId,
          reason: r.reason,
          confidence: r.candidate.confidence,
        })),
      });
    }

    return { accepted, rejected };
  }

  private applyPriority(candidate: SuggestionCandidate): SuggestionCandidate {
    if (candidate.priority) {
      return candidate;
    }
    if (candidate.confidence >= 0.85) {
      return { ...candidate, priority: 'high' };
    }
    return { ...candidate, priority: 'normal' };
  }
}

export const suggestionRankingService = new SuggestionRankingService();
