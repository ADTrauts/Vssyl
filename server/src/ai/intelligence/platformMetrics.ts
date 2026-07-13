/**
 * Phase 3 — Metric aggregation helpers (pure). Definitions live in shared types.
 */
import {
  AI_PLATFORM_METRIC_DEFINITIONS,
  type AIPlatformMetricDefinition,
  type AIPlatformMetricId,
  type AIRootCauseCode,
} from 'vssyl-shared';

export interface MetricSampleExecution {
  id: string;
  provider?: string;
  latencyMs?: number;
  hadApproval?: boolean;
  toolProposed?: boolean;
  toolSuccessCount?: number;
  toolFailureCount?: number;
  corrected?: boolean;
}

export interface MetricSampleEvaluation {
  executionRecordId: string;
  evaluatorRole: string;
  score?: number;
  labels: string[];
  rootCauses: AIRootCauseCode[];
}

export interface MetricSampleCorrection {
  destinations: string[];
  status: string;
}

export interface MetricSampleRegression {
  status: string;
}

export interface MetricAggregationInput {
  executions: MetricSampleExecution[];
  evaluations: MetricSampleEvaluation[];
  corrections: MetricSampleCorrection[];
  regressions: MetricSampleRegression[];
}

export interface MetricValue {
  id: AIPlatformMetricId;
  value: number | null;
  numerator?: number;
  denominator?: number;
}

function ratio(n: number, d: number): number | null {
  if (d <= 0) return null;
  return n / d;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? null;
}

export function getMetricDefinitions(): readonly AIPlatformMetricDefinition[] {
  return AI_PLATFORM_METRIC_DEFINITIONS;
}

export function aggregatePlatformMetrics(input: MetricAggregationInput): MetricValue[] {
  const { executions, evaluations, corrections, regressions } = input;
  const evalCount = evaluations.length;
  const hallucinationN = evaluations.filter((e) => e.rootCauses.includes('HALLUCINATION')).length;
  const correctedN = executions.filter((e) => e.corrected).length;
  const toolProposed = executions.filter((e) => e.toolProposed).length;
  const approvals = executions.filter((e) => e.hadApproval).length;
  const toolSuccess = executions.reduce((s, e) => s + (e.toolSuccessCount ?? 0), 0);
  const toolFailure = executions.reduce((s, e) => s + (e.toolFailureCount ?? 0), 0);
  const toolTotal = toolSuccess + toolFailure;
  const scores = evaluations.map((e) => e.score).filter((s): s is number => typeof s === 'number');
  const businessScores = evaluations
    .filter((e) => e.evaluatorRole === 'BUSINESS_ADMIN')
    .map((e) => e.score)
    .filter((s): s is number => typeof s === 'number');
  const retrievalFail = evaluations.filter(
    (e) => e.labels.includes('WRONG_RETRIEVAL') || e.rootCauses.includes('RETRIEVAL')
  ).length;
  const groundingFail = evaluations.filter((e) => e.rootCauses.includes('GROUNDING')).length;
  const memoryRoutes = corrections.filter((c) =>
    c.destinations.some((d) => d === 'MEMORY_REVIEW' || d === 'PERSONAL_MEMORY')
  ).length;
  const knowledgeRoutes = corrections.filter((c) => c.destinations.includes('KNOWLEDGE_ENGINE'));
  const knowledgeResolved = knowledgeRoutes.filter((c) => c.status === 'RESOLVED').length;
  const activeRegs = regressions.filter((r) =>
    ['ACTIVE', 'PASSING', 'FAILING'].includes(r.status)
  );
  const passingRegs = regressions.filter((r) => r.status === 'PASSING').length;
  const latencies = executions
    .map((e) => e.latencyMs)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);

  const values: MetricValue[] = [
    {
      id: 'hallucination_rate',
      value: ratio(hallucinationN, evalCount),
      numerator: hallucinationN,
      denominator: evalCount,
    },
    {
      id: 'correction_rate',
      value: ratio(correctedN, executions.length),
      numerator: correctedN,
      denominator: executions.length,
    },
    {
      id: 'approval_rate',
      value: ratio(approvals, toolProposed),
      numerator: approvals,
      denominator: toolProposed,
    },
    {
      id: 'tool_success_rate',
      value: ratio(toolSuccess, toolTotal),
      numerator: toolSuccess,
      denominator: toolTotal,
    },
    {
      id: 'tool_failure_rate',
      value: ratio(toolFailure, toolTotal),
      numerator: toolFailure,
      denominator: toolTotal,
    },
    {
      id: 'provider_quality_score',
      value: avg(scores),
    },
    {
      id: 'provider_latency_p50_ms',
      value: percentile(latencies, 50),
    },
    {
      id: 'provider_latency_p95_ms',
      value: percentile(latencies, 95),
    },
    {
      id: 'retrieval_failure_rate',
      value: ratio(retrievalFail, evalCount),
      numerator: retrievalFail,
      denominator: evalCount,
    },
    {
      id: 'grounding_failure_rate',
      value: ratio(groundingFail, evalCount),
      numerator: groundingFail,
      denominator: evalCount,
    },
    {
      id: 'conversation_quality_score',
      value: avg(
        evaluations
          .filter((e) => e.evaluatorRole === 'USER')
          .map((e) => e.score)
          .filter((s): s is number => typeof s === 'number')
      ),
    },
    {
      id: 'evaluation_score_avg',
      value: avg(scores),
    },
    {
      id: 'business_satisfaction_avg',
      value: avg(businessScores),
    },
    {
      id: 'memory_correction_rate',
      value: ratio(memoryRoutes, corrections.length),
      numerator: memoryRoutes,
      denominator: corrections.length,
    },
    {
      id: 'knowledge_promotion_rate',
      value: ratio(knowledgeResolved, knowledgeRoutes.length),
      numerator: knowledgeResolved,
      denominator: knowledgeRoutes.length,
    },
    {
      id: 'regression_pass_rate',
      value: ratio(passingRegs, activeRegs.length),
      numerator: passingRegs,
      denominator: activeRegs.length,
    },
  ];

  return values;
}
