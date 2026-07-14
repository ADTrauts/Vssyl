/**
 * Phase 5B — Observation retention purge (operator-triggered / optional cron).
 * Disabled by default. No orphan-breaking cascade: events SetNull on hub delete;
 * purge deletes old events and optionally old hubs without evaluations.
 */
import type { PrismaClient } from '@prisma/client';
import { AI_OBSERVATION_RETENTION_POLICY } from 'vssyl-shared';
import { logger } from '../../lib/logger';
import { setRetentionBacklog } from './observationHealth';

export interface ObservationRetentionPurgeOptions {
  dryRun?: boolean;
  purgeAfterDays?: number;
  batchLimit?: number;
  /** When true, also delete hubs with no evaluations/corrections/regressions past cutoff */
  includeHubs?: boolean;
}

export interface ObservationRetentionPurgeResult {
  dryRun: boolean;
  cutoffIso: string;
  eventsMatched: number;
  eventsDeleted: number;
  hubsMatched: number;
  hubsDeleted: number;
  batchLimit: number;
}

export async function estimateObservationRetentionBacklog(
  prisma: PrismaClient,
  purgeAfterDays = AI_OBSERVATION_RETENTION_POLICY.purgeAfterDays
): Promise<number> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - purgeAfterDays);
  const count = await prisma.aIObservationEvent.count({
    where: { createdAt: { lt: cutoff } },
  });
  setRetentionBacklog(count);
  return count;
}

export async function purgeObservationRetention(
  prisma: PrismaClient,
  options: ObservationRetentionPurgeOptions = {}
): Promise<ObservationRetentionPurgeResult> {
  const dryRun = options.dryRun !== false; // default dry-run for safety
  const purgeAfterDays =
    options.purgeAfterDays ?? AI_OBSERVATION_RETENTION_POLICY.purgeAfterDays;
  const batchLimit = Math.min(Math.max(options.batchLimit ?? 500, 1), 5000);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - purgeAfterDays);

  const events = await prisma.aIObservationEvent.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
    take: batchLimit,
    orderBy: { createdAt: 'asc' },
  });

  let hubsMatched = 0;
  let hubsDeleted = 0;
  let eventsDeleted = 0;

  if (!dryRun && events.length > 0) {
    const del = await prisma.aIObservationEvent.deleteMany({
      where: { id: { in: events.map((e) => e.id) } },
    });
    eventsDeleted = del.count;
  }

  if (options.includeHubs) {
    const hubs = await prisma.aIExecutionRecord.findMany({
      where: {
        createdAt: { lt: cutoff },
        evaluations: { none: {} },
        corrections: { none: {} },
        regressions: { none: {} },
      },
      select: { id: true },
      take: batchLimit,
      orderBy: { createdAt: 'asc' },
    });
    hubsMatched = hubs.length;
    if (!dryRun && hubs.length > 0) {
      const del = await prisma.aIExecutionRecord.deleteMany({
        where: { id: { in: hubs.map((h) => h.id) } },
      });
      hubsDeleted = del.count;
    }
  }

  const result: ObservationRetentionPurgeResult = {
    dryRun,
    cutoffIso: cutoff.toISOString(),
    eventsMatched: events.length,
    eventsDeleted,
    hubsMatched,
    hubsDeleted,
    batchLimit,
  };

  void logger.info('Observation retention purge', {
    operation: 'ai_observation_retention_purge',
    context: result as unknown as Record<string, unknown>,
  });

  await estimateObservationRetentionBacklog(prisma, purgeAfterDays);
  return result;
}

export function isObservationRetentionCronEnabled(): boolean {
  return process.env.AI_OBSERVATION_RETENTION_CRON_ENABLED === 'true';
}
