/**
 * Phase 3 — Evaluation + root-cause persistence (observational).
 * Evaluations never mutate runtime (mutatesRuntime forced false).
 */
import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AIEvaluationInput,
  AIEvaluationLabel,
  AIRootCauseCode,
} from 'vssyl-shared';
import {
  routeCorrectionsForRootCauses,
  suggestRootCausesFromLabels,
} from './correctionRouting';

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface PersistedEvaluation {
  id: string;
  executionRecordId: string;
  evaluatorRole: string;
  labels: AIEvaluationLabel[];
  score?: number;
  notes?: string;
  mutatesRuntime: false;
  rootCauses: AIRootCauseCode[];
}

export async function persistAIEvaluation(
  prisma: PrismaClient,
  input: AIEvaluationInput,
  options?: { createCorrectionRoutes?: boolean; moduleHints?: Parameters<typeof routeCorrectionsForRootCauses>[1] }
): Promise<PersistedEvaluation> {
  const rootCauses =
    input.rootCauses && input.rootCauses.length > 0
      ? input.rootCauses
      : suggestRootCausesFromLabels(input.labels);

  const id = randomUUID();
  await prisma.aIEvaluation.create({
    data: {
      id,
      executionRecordId: input.executionRecordId,
      evaluatorRole: input.evaluatorRole,
      evaluatorUserId: input.evaluatorUserId ?? null,
      labelsJson: asJson(input.labels),
      score: input.score ?? null,
      notes: input.notes ?? null,
      mutatesRuntime: false,
      rootCauses: {
        create: rootCauses.map((code) => ({
          id: randomUUID(),
          code,
        })),
      },
    },
  });

  if (options?.createCorrectionRoutes !== false && rootCauses.length > 0) {
    const plans = routeCorrectionsForRootCauses(rootCauses, options?.moduleHints);
    for (const plan of plans) {
      await prisma.aICorrectionRoute.create({
        data: {
          id: randomUUID(),
          executionRecordId: input.executionRecordId,
          evaluationId: id,
          rootCauseCode: plan.rootCause,
          destinationsJson: asJson(plan.destinations),
          status: 'ROUTED',
          rationale: plan.rationale,
        },
      });
    }
  }

  return {
    id,
    executionRecordId: input.executionRecordId,
    evaluatorRole: input.evaluatorRole,
    labels: input.labels,
    score: input.score,
    notes: input.notes,
    mutatesRuntime: false,
    rootCauses,
  };
}

/** Classify root causes without persistence (for tests / operator assist). */
export function classifyRootCauses(input: {
  labels: AIEvaluationLabel[];
  explicit?: AIRootCauseCode[];
}): AIRootCauseCode[] {
  if (input.explicit && input.explicit.length > 0) {
    return Array.from(new Set(input.explicit));
  }
  return suggestRootCausesFromLabels(input.labels);
}
