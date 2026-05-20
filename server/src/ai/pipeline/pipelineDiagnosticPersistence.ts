/**
 * Persist AI pipeline diagnostics to the database (Phase 2).
 */

import { Prisma, type AIPipelineDiagnosticSource } from '@prisma/client';
import { prisma as defaultPrisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AIPipelineTrace } from '../types/pipelineDiagnostics';

export type PipelineDiagnosticPersistSource = 'twin' | 'test_lab';

function mapSource(source: PipelineDiagnosticPersistSource): AIPipelineDiagnosticSource {
  return source === 'test_lab' ? 'TEST_LAB' : 'TWIN';
}

function parseSampleRate(): number {
  const raw = process.env.AI_PIPELINE_DIAGNOSTIC_SAMPLE_RATE;
  if (raw == null || raw.trim() === '') return 1;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

export function shouldPersistPipelineDiagnostic(options?: {
  adminDryRun?: boolean;
  force?: boolean;
}): boolean {
  if (options?.force) return true;
  if (options?.adminDryRun) return false;
  if (process.env.AI_PIPELINE_DIAGNOSTICS_ENABLED === 'false') return false;
  const rate = parseSampleRate();
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

export function traceToPersistedFields(trace: AIPipelineTrace): {
  id: string;
  userId: string;
  conversationId: string | null;
  genericResponseRisk: boolean;
  groundingRequired: boolean;
  retrievalPerformed: boolean;
  confidenceLevel: string;
  intentDetected: string[];
  issues: Prisma.InputJsonValue;
  traceJson: Prisma.InputJsonValue;
  createdAt: Date;
} {
  return {
    id: trace.traceId,
    userId: trace.userId,
    conversationId: trace.conversationId ?? null,
    genericResponseRisk: trace.genericResponseRisk,
    groundingRequired: trace.groundingRequired,
    retrievalPerformed: trace.retrievalPerformed,
    confidenceLevel: trace.confidenceLevel,
    intentDetected: [...trace.intentDetected],
    issues: trace.issues as Prisma.InputJsonValue,
    traceJson: JSON.parse(JSON.stringify(trace)) as Prisma.InputJsonValue,
    createdAt: new Date(trace.createdAt),
  };
}

export function rowToPipelineTrace(row: {
  id: string;
  userId: string;
  conversationHistoryId: string | null;
  conversationId: string | null;
  traceJson: unknown;
  createdAt: Date;
}): AIPipelineTrace | null {
  if (row.traceJson && typeof row.traceJson === 'object' && !Array.isArray(row.traceJson)) {
    const t = row.traceJson as AIPipelineTrace;
    if (typeof t.traceId === 'string' && Array.isArray(t.intentDetected)) {
      return {
        ...t,
        traceId: row.id,
        ...(row.conversationHistoryId
          ? { conversationHistoryId: row.conversationHistoryId }
          : {}),
      } as AIPipelineTrace & { conversationHistoryId?: string };
    }
  }
  return null;
}

export interface PersistPipelineDiagnosticOptions {
  conversationHistoryId?: string;
  source?: PipelineDiagnosticPersistSource;
  adminDryRun?: boolean;
  force?: boolean;
}

export async function persistPipelineDiagnostic(
  trace: AIPipelineTrace,
  options?: PersistPipelineDiagnosticOptions,
  prismaClient: typeof defaultPrisma = defaultPrisma
): Promise<string | null> {
  if (!shouldPersistPipelineDiagnostic(options)) {
    return null;
  }

  const source = mapSource(options?.source ?? 'twin');
  const fields = traceToPersistedFields(trace);

  try {
    await prismaClient.aIPipelineDiagnostic.upsert({
      where: { id: fields.id },
      create: {
        ...fields,
        source,
        conversationHistoryId: options?.conversationHistoryId ?? null,
      },
      update: {
        ...fields,
        source,
        conversationHistoryId: options?.conversationHistoryId ?? null,
      },
    });
    return fields.id;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to persist pipeline diagnostic', {
      operation: 'ai_pipeline_diagnostic_persist_error',
      traceId: trace.traceId,
      error: { message: err.message, stack: err.stack },
    });
    return null;
  }
}

export interface PipelineQualityStats {
  timeRangeDays: number;
  totalTraces: number;
  atRiskCount: number;
  atRiskPercent: number;
  groundingRequiredCount: number;
  retrievalMissCount: number;
  byDay: Array<{ date: string; total: number; atRisk: number }>;
  topIssues: Array<{ issue: string; count: number }>;
  intentsAtRisk: Array<{ intent: string; count: number }>;
}

export async function getPipelineQualityStats(
  options?: { days?: number; userId?: string },
  prismaClient: typeof defaultPrisma = defaultPrisma
): Promise<PipelineQualityStats> {
  const days = Math.min(Math.max(options?.days ?? 7, 1), 90);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const where: Prisma.AIPipelineDiagnosticWhereInput = {
    createdAt: { gte: since },
    ...(options?.userId ? { userId: options.userId } : {}),
  };

  const [totalTraces, atRiskCount, groundingRequiredCount, retrievalMissCount, rows] =
    await Promise.all([
      prismaClient.aIPipelineDiagnostic.count({ where }),
      prismaClient.aIPipelineDiagnostic.count({
        where: { ...where, genericResponseRisk: true },
      }),
      prismaClient.aIPipelineDiagnostic.count({
        where: { ...where, groundingRequired: true },
      }),
      prismaClient.aIPipelineDiagnostic.count({
        where: { ...where, groundingRequired: true, retrievalPerformed: false },
      }),
      prismaClient.aIPipelineDiagnostic.findMany({
        where,
        select: {
          createdAt: true,
          genericResponseRisk: true,
          intentDetected: true,
          issues: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
    ]);

  const byDayMap = new Map<string, { total: number; atRisk: number }>();
  const issueCounts = new Map<string, number>();
  const intentRiskCounts = new Map<string, number>();

  for (const row of rows) {
    const day = row.createdAt.toISOString().slice(0, 10);
    const bucket = byDayMap.get(day) ?? { total: 0, atRisk: 0 };
    bucket.total += 1;
    if (row.genericResponseRisk) bucket.atRisk += 1;
    byDayMap.set(day, bucket);

    if (row.genericResponseRisk) {
      for (const intent of row.intentDetected) {
        intentRiskCounts.set(intent, (intentRiskCounts.get(intent) ?? 0) + 1);
      }
    }

    const issues = Array.isArray(row.issues) ? (row.issues as string[]) : [];
    for (const issue of issues) {
      if (typeof issue === 'string' && issue.trim()) {
        issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
      }
    }
  }

  const byDay = [...byDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, total: v.total, atRisk: v.atRisk }));

  const topIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, count }));

  const intentsAtRisk = [...intentRiskCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([intent, count]) => ({ intent, count }));

  return {
    timeRangeDays: days,
    totalTraces,
    atRiskCount,
    atRiskPercent: totalTraces > 0 ? Math.round((atRiskCount / totalTraces) * 1000) / 10 : 0,
    groundingRequiredCount,
    retrievalMissCount,
    byDay,
    topIssues,
    intentsAtRisk,
  };
}

export async function findPipelineDiagnosticById(
  traceId: string,
  prismaClient: typeof defaultPrisma = defaultPrisma
): Promise<(AIPipelineTrace & { conversationHistoryId?: string }) | null> {
  const row = await prismaClient.aIPipelineDiagnostic.findUnique({
    where: { id: traceId },
  });
  if (!row) return null;
  const trace = rowToPipelineTrace(row);
  if (!trace) return null;
  return {
    ...trace,
    ...(row.conversationHistoryId ? { conversationHistoryId: row.conversationHistoryId } : {}),
  };
}

export async function listPipelineDiagnosticsFromDb(
  options: { limit?: number; userId?: string },
  prismaClient: typeof defaultPrisma = defaultPrisma
): Promise<(AIPipelineTrace & { conversationHistoryId?: string })[]> {
  const limit = Math.min(options.limit ?? 50, 100);
  const rows = await prismaClient.aIPipelineDiagnostic.findMany({
    where: options.userId ? { userId: options.userId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const traces: (AIPipelineTrace & { conversationHistoryId?: string })[] = [];
  for (const row of rows) {
    const trace = rowToPipelineTrace(row);
    if (trace) {
      traces.push({
        ...trace,
        ...(row.conversationHistoryId ? { conversationHistoryId: row.conversationHistoryId } : {}),
      });
    }
  }
  return traces;
}
