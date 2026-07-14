/**
 * Phase 8B — Durable Skill quality summaries from existing intelligence stores.
 * Does not create a second metrics warehouse.
 */
import type { PrismaClient } from '@prisma/client';

export interface SkillDurableQualitySummary {
  skillKey: string;
  skillVersion?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number | null;
  observationEventCount: number;
  evaluationCount: number;
  correctionCount: number;
  regressionCount: number;
  routerShadowAgreementRate: number | null;
  recentExecutionIds: string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function skillKeyFromDiagnostics(diagnostics: unknown): string | undefined {
  const d = asRecord(diagnostics);
  return typeof d?.skillKey === 'string' ? d.skillKey : undefined;
}

function skillVersionFromDiagnostics(diagnostics: unknown): string | undefined {
  const d = asRecord(diagnostics);
  return typeof d?.skillVersion === 'string' ? d.skillVersion : undefined;
}

export async function getDurableSkillQualitySummary(
  prisma: PrismaClient,
  skillKey: string,
  opts?: { limit?: number }
): Promise<SkillDurableQualitySummary> {
  const empty: SkillDurableQualitySummary = {
    skillKey,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    averageLatencyMs: null,
    observationEventCount: 0,
    evaluationCount: 0,
    correctionCount: 0,
    regressionCount: 0,
    routerShadowAgreementRate: null,
    recentExecutionIds: [],
  };

  try {
    const limit = opts?.limit ?? 200;

    const records = await prisma.aIExecutionRecord.findMany({
      where: { surface: 'SKILL' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit * 3, 600),
      select: {
        id: true,
        errorSummary: true,
        usageJson: true,
        diagnosticsSummaryJson: true,
        routingSummaryJson: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const matched = records.filter(
      (r) => skillKeyFromDiagnostics(r.diagnosticsSummaryJson) === skillKey
    );
    const sliced = matched.slice(0, limit);

    const successCount = sliced.filter((r) => !r.errorSummary).length;
    const failureCount = sliced.length - successCount;

    const latencies: number[] = [];
    for (const r of sliced) {
      const usage = asRecord(r.usageJson);
      if (typeof usage?.latencyMs === 'number') {
        latencies.push(usage.latencyMs);
        continue;
      }
      if (r.completedAt && r.createdAt) {
        latencies.push(r.completedAt.getTime() - r.createdAt.getTime());
      }
    }

    let agree = 0;
    let agreeSamples = 0;
    for (const r of sliced) {
      const routing = asRecord(r.routingSummaryJson);
      const shadow = asRecord(routing?.shadow);
      if (typeof shadow?.match === 'boolean') {
        agreeSamples += 1;
        if (shadow.match) agree += 1;
      }
    }

    const versions = new Set(
      sliced
        .map((r) => skillVersionFromDiagnostics(r.diagnosticsSummaryJson))
        .filter((v): v is string => Boolean(v))
    );

    const executionIds = sliced.map((r) => r.id);

    let observationEventCount = 0;
    let evaluationCount = 0;
    let correctionCount = 0;
    let regressionCount = 0;

    if (executionIds.length > 0) {
      const [obs, evals, corrections, regressions] = await Promise.all([
        prisma.aIObservationEvent.count({
          where: { executionRecordId: { in: executionIds } },
        }),
        prisma.aIEvaluation.count({
          where: { executionRecordId: { in: executionIds } },
        }),
        prisma.aICorrectionRoute.count({
          where: { executionRecordId: { in: executionIds } },
        }),
        prisma.aIRegressionCase.count({
          where: { executionRecordId: { in: executionIds } },
        }),
      ]);
      observationEventCount = obs;
      evaluationCount = evals;
      correctionCount = corrections;
      regressionCount = regressions;
    }

    return {
      skillKey,
      skillVersion: versions.size === 1 ? [...versions][0] : undefined,
      executionCount: sliced.length,
      successCount,
      failureCount,
      averageLatencyMs:
        latencies.length === 0
          ? null
          : Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      observationEventCount,
      evaluationCount,
      correctionCount,
      regressionCount,
      routerShadowAgreementRate: agreeSamples === 0 ? null : agree / agreeSamples,
      recentExecutionIds: executionIds.slice(0, 20),
    };
  } catch {
    // Fail soft when intelligence tables are unavailable in local/test DBs
    return empty;
  }
}

export async function listDurableSkillQuality(
  prisma: PrismaClient,
  skillKeys: string[]
): Promise<Record<string, SkillDurableQualitySummary>> {
  const out: Record<string, SkillDurableQualitySummary> = {};
  for (const key of skillKeys) {
    out[key] = await getDurableSkillQualitySummary(prisma, key);
  }
  return out;
}
