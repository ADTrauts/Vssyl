/**
 * Admin dry-run for suggestion correlation — no signal/suggestion persistence (Phase 5F).
 */

import type { PrismaClient } from '@prisma/client';
import type { DomainEvent } from '../../events/types';
import { logger } from '../../lib/logger';
import { rulesForEventType } from './suggestionRules';
import type { SuggestionCandidate, SuggestionRuleContext } from './suggestionRuleTypes';
import {
  buildSuggestionFixture,
  isSuggestionFixtureId,
  type SuggestionFixtureId,
} from './suggestionFixtures';
import {
  SuggestionRankingService,
  type SuggestionRankingRejectionReason,
} from './SuggestionRankingService';

export interface SuggestionDryRunInput {
  fixtureId: SuggestionFixtureId;
  userId: string;
  dashboardId: string;
  /** Simulated recent suggestions in 24h window (for frequency cap diagnostics). */
  recentSuggestionCount?: number;
  /** Suppression keys blocked via do-not-show-again. */
  suppressedKeys?: string[];
  /** Dismissals per suggestion type (for decay diagnostics). */
  dismissCountByType?: Record<string, number>;
}

export interface SuggestionDryRunCandidateReport {
  correlationRuleId: string;
  suggestionType: string;
  confidence: number;
  adjustedConfidence: number;
  suppressionKey: string;
  explainSummary: string;
  contextModules: string[];
  sourceEventIds: string[];
  rankingAccepted: boolean;
  rankingRejectionReason?: SuggestionRankingRejectionReason;
}

export interface SuggestionDryRunResult {
  fixtureId: SuggestionFixtureId;
  description: string;
  triggerEvent: Pick<DomainEvent, 'id' | 'type' | 'entityId' | 'createdAt'>;
  evaluatedRuleIds: string[];
  priorSignalCount: number;
  candidates: SuggestionDryRunCandidateReport[];
  wouldCreateCount: number;
  rejectedByRankingCount: number;
}

function mockDbForDryRun(input: SuggestionDryRunInput): PrismaClient {
  const suppressed = new Set(input.suppressedKeys ?? []);
  const dismissByType = input.dismissCountByType ?? {};
  const recentCount = input.recentSuggestionCount ?? 0;

  return {
    file: {
      findUnique: async () => ({ name: 'fixture-file.pdf' }),
    },
    dashboard: {
      findUnique: async () => ({ businessId: null }),
    },
    aISuggestion: {
      count: async () => recentCount,
    },
    aISuggestionFeedback: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        const key = where.suppressionKey as string | undefined;
        if (key && suppressed.has(key) && where.doNotShowAgain === true) {
          return { id: 'fb-suppressed' };
        }
        return null;
      },
      count: async ({ where }: { where: Record<string, unknown> }) => {
        const suggestionFilter = where.suggestion as
          | { OR?: Array<{ suggestionType?: string; type?: string }> }
          | undefined;
        const type =
          suggestionFilter?.OR?.[0]?.suggestionType ?? suggestionFilter?.OR?.[1]?.type ?? '';
        return dismissByType[type] ?? 0;
      },
    },
  } as unknown as PrismaClient;
}

export class SuggestionDryRunService {
  async run(input: SuggestionDryRunInput): Promise<SuggestionDryRunResult> {
    if (!isSuggestionFixtureId(input.fixtureId)) {
      throw new Error(`Unknown fixture: ${input.fixtureId}`);
    }

    const bundle = buildSuggestionFixture(input.fixtureId, input.userId, input.dashboardId);
    const db = mockDbForDryRun(input);
    const applicableRules = rulesForEventType(bundle.triggerEvent.type);
    const evaluatedRuleIds: string[] = [];
    const rawCandidates: SuggestionCandidate[] = [];

    const ctx: SuggestionRuleContext = {
      event: bundle.triggerEvent,
      signalId: 'dry-run-signal',
      db,
      recentSignals: bundle.priorSignals,
    };

    for (const rule of applicableRules) {
      evaluatedRuleIds.push(rule.id);
      try {
        const candidate = await rule.evaluate(ctx);
        if (candidate && candidate.confidence >= rule.minConfidence) {
          rawCandidates.push(candidate);
        }
      } catch (ruleErr: unknown) {
        const error = ruleErr instanceof Error ? ruleErr : new Error(String(ruleErr));
        void logger.warn('Suggestion dry-run rule failed', {
          operation: 'ambient_suggestion_dry_run_rule_error',
          ruleId: rule.id,
          fixtureId: input.fixtureId,
          error: { message: error.message },
        });
      }
    }

    const rankingService = new SuggestionRankingService(db);
    const { accepted, rejected } = await rankingService.filterCandidates(
      input.userId,
      input.dashboardId,
      rawCandidates
    );

    const acceptedKeys = new Set(accepted.map((c) => c.suppressionKey));

    const candidates: SuggestionDryRunCandidateReport[] = rawCandidates.map((c) => {
      const rankingRejected = rejected.find((r) => r.candidate.suppressionKey === c.suppressionKey);
      const rankingAccepted = acceptedKeys.has(c.suppressionKey);
      const adjusted = rankingRejected?.candidate.confidence ?? c.confidence;
      return {
        correlationRuleId: c.correlationRuleId,
        suggestionType: c.suggestionType,
        confidence: c.confidence,
        adjustedConfidence: adjusted,
        suppressionKey: c.suppressionKey,
        explainSummary: c.explainability.summary,
        contextModules: c.explainability.contextUsed.map((x) => x.moduleId),
        sourceEventIds: c.explainability.sourceEventIds,
        rankingAccepted,
        rankingRejectionReason: rankingRejected?.reason,
      };
    });

    void logger.info('Suggestion correlation dry-run completed', {
      operation: 'ambient_suggestion_dry_run',
      fixtureId: input.fixtureId,
      userId: input.userId,
      dashboardId: input.dashboardId,
      candidateCount: candidates.length,
      wouldCreateCount: accepted.length,
    });

    return {
      fixtureId: input.fixtureId,
      description: bundle.description,
      triggerEvent: {
        id: bundle.triggerEvent.id,
        type: bundle.triggerEvent.type,
        entityId: bundle.triggerEvent.entityId,
        createdAt: bundle.triggerEvent.createdAt,
      },
      evaluatedRuleIds,
      priorSignalCount: bundle.priorSignals.length,
      candidates,
      wouldCreateCount: accepted.length,
      rejectedByRankingCount: rejected.length,
    };
  }
}

export const suggestionDryRunService = new SuggestionDryRunService();
