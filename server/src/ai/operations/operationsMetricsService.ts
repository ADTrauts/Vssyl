/**
 * Phase 4 — Metrics + overview for Operations Center.
 */
import type { PrismaClient } from '@prisma/client';
import type { AIOperationsMetricsResponse, AIOperationsOverview } from 'vssyl-shared';
import type { AIRootCauseCode } from 'vssyl-shared';
import {
  aggregatePlatformMetrics,
  getMetricDefinitions,
  type MetricAggregationInput,
} from '../intelligence/platformMetrics';
import { mapEvaluationRow } from './operationsQueryService';

export async function getOperationsMetrics(
  prisma: PrismaClient,
  window?: { from?: string; to?: string },
  businessScope?: string
): Promise<AIOperationsMetricsResponse> {
  const from = window?.from ? new Date(window.from) : new Date(Date.now() - 7 * 86400000);
  const to = window?.to ? new Date(window.to) : new Date();

  const execWhere = {
    createdAt: { gte: from, lte: to },
    ...(businessScope ? { businessId: businessScope } : {}),
  };

  const [executions, evaluations, corrections, regressions] = await Promise.all([
    prisma.aIExecutionRecord.findMany({
      where: execWhere,
      select: {
        id: true,
        provider: true,
        usageJson: true,
        linkedArtifactsJson: true,
        timelineJson: true,
      },
    }),
    prisma.aIEvaluation.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
      },
      include: { rootCauses: true },
    }),
    prisma.aICorrectionRoute.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
      },
    }),
    prisma.aIRegressionCase.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
      },
    }),
  ]);

  const metricInput = {
    executions: executions.map((e) => {
      const usage =
        e.usageJson && typeof e.usageJson === 'object'
          ? (e.usageJson as { latencyMs?: number })
          : {};
      const linked =
        e.linkedArtifactsJson && typeof e.linkedArtifactsJson === 'object'
          ? (e.linkedArtifactsJson as { approvalIds?: string[] })
          : {};
      const timeline = Array.isArray(e.timelineJson) ? e.timelineJson : [];
      return {
        id: e.id,
        provider: e.provider ?? undefined,
        latencyMs: usage.latencyMs,
        corrected: false,
        toolProposed: timeline.some(
          (t) => typeof t === 'object' && t && (t as { stage?: string }).stage === 'TOOL_PROPOSED'
        ),
        hadApproval: Array.isArray(linked.approvalIds) && linked.approvalIds.length > 0,
        toolSuccessCount: 0,
        toolFailureCount: 0,
      };
    }),
    evaluations: evaluations.map((ev) => {
      const mapped = mapEvaluationRow(ev);
      return {
        executionRecordId: ev.executionRecordId,
        evaluatorRole: ev.evaluatorRole,
        score: ev.score ?? undefined,
        labels: mapped.labels,
        rootCauses: ev.rootCauses.map((rc) => rc.code as AIRootCauseCode),
      };
    }),
    corrections: corrections.map((c) => ({
      destinations: Array.isArray(c.destinationsJson) ? (c.destinationsJson as string[]) : [],
      status: c.status,
    })),
    regressions: regressions.map((r) => ({ status: r.status })),
  } satisfies MetricAggregationInput;

  const values = aggregatePlatformMetrics(metricInput);
  const defs = getMetricDefinitions();
  const defById = Object.fromEntries(defs.map((d) => [d.id, d]));

  return {
    window: { from: from.toISOString(), to: to.toISOString() },
    executionVolume: executions.length,
    metrics: values.map((v) => ({
      id: v.id,
      name: defById[v.id]?.name ?? v.id,
      value: v.value,
      unit: defById[v.id]?.unit ?? 'ratio',
      numerator: v.numerator,
      denominator: v.denominator,
    })),
  };
}

export async function getOperationsOverview(
  prisma: PrismaClient,
  businessScope?: string
): Promise<AIOperationsOverview> {
  const where = businessScope ? { businessId: businessScope } : {};
  const [executionCount, pendingEvaluations, openCorrections, activeRegressions, metrics] =
    await Promise.all([
      prisma.aIExecutionRecord.count({ where }),
      prisma.aIEvaluation.count({
        where: {
          workflowStatus: { in: ['PENDING', 'ASSIGNED'] },
          ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
        },
      }),
      prisma.aICorrectionRoute.count({
        where: {
          status: { in: ['OPEN', 'ROUTED', 'IN_PROGRESS'] },
          ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
        },
      }),
      prisma.aIRegressionCase.count({
        where: {
          status: { in: ['ACTIVE', 'DRAFT', 'FAILING'] },
          ...(businessScope ? { executionRecord: { businessId: businessScope } } : {}),
        },
      }),
      getOperationsMetrics(prisma, undefined, businessScope),
    ]);

  return {
    executionCount,
    pendingEvaluations,
    openCorrections,
    activeRegressions,
    recentMetrics: metrics.metrics.slice(0, 6),
  };
}
