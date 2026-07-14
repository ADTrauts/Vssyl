/**
 * Phase 8 — In-process skill metrics ring (operator summaries; not a second warehouse).
 */
export interface SkillMetricSample {
  skillKey: string;
  skillVersion: string;
  success: boolean;
  schemaValidationFailed: boolean;
  groundingFailed: boolean;
  durationMs: number;
  timestamp: string;
  routerShadowAgreement?: boolean | null;
}

const RING_MAX = 500;
const samples: SkillMetricSample[] = [];

export function recordSkillMetric(sample: SkillMetricSample): void {
  samples.push(sample);
  if (samples.length > RING_MAX) {
    samples.splice(0, samples.length - RING_MAX);
  }
}

export function summarizeSkillMetrics(skillKey?: string): {
  executionCount: number;
  successCount: number;
  failureCount: number;
  schemaValidationFailures: number;
  groundingFailures: number;
  averageLatencyMs: number;
  routerShadowAgreementRate: number | null;
} {
  const filtered = skillKey ? samples.filter((s) => s.skillKey === skillKey) : samples;
  const executionCount = filtered.length;
  const successCount = filtered.filter((s) => s.success).length;
  const failureCount = executionCount - successCount;
  const schemaValidationFailures = filtered.filter((s) => s.schemaValidationFailed).length;
  const groundingFailures = filtered.filter((s) => s.groundingFailed).length;
  const averageLatencyMs =
    executionCount === 0
      ? 0
      : Math.round(filtered.reduce((a, s) => a + s.durationMs, 0) / executionCount);
  const withAgreement = filtered.filter((s) => s.routerShadowAgreement != null);
  const routerShadowAgreementRate =
    withAgreement.length === 0
      ? null
      : withAgreement.filter((s) => s.routerShadowAgreement).length / withAgreement.length;

  return {
    executionCount,
    successCount,
    failureCount,
    schemaValidationFailures,
    groundingFailures,
    averageLatencyMs,
    routerShadowAgreementRate,
  };
}

export function clearSkillMetricsForTests(): void {
  samples.length = 0;
}
