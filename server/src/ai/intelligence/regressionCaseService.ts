/**
 * Phase 3 — Regression case builders (canonical model; no CI).
 */
import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AIRegressionCaseExpectation,
  AIRegressionCaseInput,
  AIRegressionCaseStatus,
} from 'vssyl-shared';

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export interface PersistedRegressionCase {
  id: string;
  executionRecordId: string;
  title: string;
  originalRequest: string;
  expectations: AIRegressionCaseExpectation;
  status: AIRegressionCaseStatus;
  tags: string[];
}

export function buildRegressionCaseDraft(input: AIRegressionCaseInput): PersistedRegressionCase {
  return {
    id: randomUUID(),
    executionRecordId: input.executionRecordId,
    title: input.title,
    originalRequest: input.originalRequest,
    expectations: input.expectations,
    status: 'DRAFT',
    tags: input.tags ?? [],
  };
}

export async function createAIRegressionCase(
  prisma: PrismaClient,
  input: AIRegressionCaseInput
): Promise<PersistedRegressionCase> {
  const draft = buildRegressionCaseDraft(input);
  await prisma.aIRegressionCase.create({
    data: {
      id: draft.id,
      executionRecordId: draft.executionRecordId,
      evaluationId: input.evaluationId ?? null,
      correctionRouteId: input.correctionRouteId ?? null,
      title: draft.title,
      originalRequest: draft.originalRequest,
      expectationsJson: asJson(draft.expectations),
      tagsJson: asJson(draft.tags),
      status: draft.status,
    },
  });
  return draft;
}
