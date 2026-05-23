/**
 * Ambient suggestion funnel metrics for admin diagnostics (Phase 5F).
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface SuggestionFunnelMetrics {
  windowDays: number;
  totals: {
    created: number;
    pending: number;
    accepted: number;
    dismissed: number;
    expired: number;
  };
  feedback: {
    doNotShowAgainCount: number;
    acceptedSignals: number;
    dismissedSignals: number;
  };
  quality: {
    explainabilityCompleteRate: number;
    avgConfidence: number | null;
  };
  noise: {
    avgCreatedPerUserDashboardDay: number | null;
  };
}

export async function getSuggestionFunnelMetrics(
  windowDays = 7,
  db: PrismaClient = prisma
): Promise<SuggestionFunnelMetrics> {
  const days = Math.min(Math.max(windowDays, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    created,
    pending,
    accepted,
    dismissed,
    expired,
    doNotShowAgainCount,
    acceptedFeedback,
    dismissedFeedback,
    withExplain,
    confidenceAgg,
    dailyGroups,
  ] = await Promise.all([
    db.aISuggestion.count({ where: { createdAt: { gte: since } } }),
    db.aISuggestion.count({ where: { status: 'PENDING', createdAt: { gte: since } } }),
    db.aISuggestion.count({ where: { status: 'ACCEPTED', createdAt: { gte: since } } }),
    db.aISuggestion.count({ where: { status: 'DISMISSED', createdAt: { gte: since } } }),
    db.aISuggestion.count({ where: { status: 'EXPIRED', createdAt: { gte: since } } }),
    db.aISuggestionFeedback.count({
      where: { doNotShowAgain: true, createdAt: { gte: since } },
    }),
    db.aISuggestionFeedback.count({
      where: { action: 'accepted', createdAt: { gte: since } },
    }),
    db.aISuggestionFeedback.count({
      where: { action: 'dismissed', createdAt: { gte: since } },
    }),
    db.aISuggestion.count({
      where: {
        createdAt: { gte: since },
        explainability: { not: Prisma.DbNull },
      },
    }),
    db.aISuggestion.aggregate({
      where: { createdAt: { gte: since }, confidence: { not: null } },
      _avg: { confidence: true },
    }),
    db.aISuggestion.groupBy({
      by: ['userId', 'dashboardId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
  ]);

  const explainabilityCompleteRate = created > 0 ? withExplain / created : 1;
  const avgCreatedPerUserDashboardDay =
    dailyGroups.length > 0
      ? dailyGroups.reduce((sum, g) => sum + g._count.id, 0) / dailyGroups.length / days
      : null;

  return {
    windowDays: days,
    totals: { created, pending, accepted, dismissed, expired },
    feedback: {
      doNotShowAgainCount,
      acceptedSignals: acceptedFeedback,
      dismissedSignals: dismissedFeedback,
    },
    quality: {
      explainabilityCompleteRate,
      avgConfidence: confidenceAgg._avg.confidence,
    },
    noise: {
      avgCreatedPerUserDashboardDay,
    },
  };
}
