/**
 * Phase 4 — Operator workflows (proposals only; no runtime mutation).
 */
import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AICorrectionDestination,
  AIEvaluationInput,
  AIEvaluationWorkflowStatus,
  AIRegressionCaseInput,
  AIRootCauseCode,
} from 'vssyl-shared';
import { persistAIEvaluation } from '../intelligence/evaluationService';
import { createAIRegressionCase } from '../intelligence/regressionCaseService';
import { routeCorrectionForRootCause } from '../intelligence/correctionRouting';

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function appendHistory(
  existing: unknown,
  entry: { at: string; actorUserId: string; action: string; detail?: Record<string, unknown> }
): Prisma.InputJsonValue {
  const arr = Array.isArray(existing) ? [...existing] : [];
  arr.push(entry);
  return asJson(arr);
}

export async function updateEvaluationWorkflow(
  prisma: PrismaClient,
  evaluationId: string,
  actorUserId: string,
  patch: {
    workflowStatus?: AIEvaluationWorkflowStatus;
    assignedToUserId?: string | null;
    priority?: string | null;
    severity?: string | null;
    confidence?: number | null;
    comment?: string;
  }
) {
  const existing = await prisma.aIEvaluation.findUnique({ where: { id: evaluationId } });
  if (!existing) return null;

  const comments = Array.isArray(existing.commentsJson) ? [...existing.commentsJson] : [];
  if (patch.comment) {
    comments.push({
      id: randomUUID(),
      authorUserId: actorUserId,
      body: patch.comment,
      createdAt: new Date().toISOString(),
    });
  }

  return prisma.aIEvaluation.update({
    where: { id: evaluationId },
    data: {
      workflowStatus: patch.workflowStatus ?? existing.workflowStatus,
      assignedToUserId: patch.assignedToUserId !== undefined ? patch.assignedToUserId : existing.assignedToUserId,
      priority: patch.priority !== undefined ? patch.priority : existing.priority,
      severity: patch.severity !== undefined ? patch.severity : existing.severity,
      confidence: patch.confidence !== undefined ? patch.confidence : existing.confidence,
      commentsJson: asJson(comments),
    },
  });
}

export async function bulkUpdateEvaluations(
  prisma: PrismaClient,
  actorUserId: string,
  ids: string[],
  patch: Parameters<typeof updateEvaluationWorkflow>[3]
) {
  const results = [];
  for (const id of ids) {
    const row = await updateEvaluationWorkflow(prisma, id, actorUserId, patch);
    if (row) results.push(row.id);
  }
  return results;
}

export async function reviewRootCause(
  prisma: PrismaClient,
  rootCauseId: string,
  actorUserId: string,
  reviewStatus: 'APPROVED' | 'REJECTED',
  notes?: string
) {
  const existing = await prisma.aIRootCauseFinding.findUnique({ where: { id: rootCauseId } });
  if (!existing) return null;

  return prisma.aIRootCauseFinding.update({
    where: { id: rootCauseId },
    data: {
      reviewStatus,
      reviewedByUserId: actorUserId,
      reviewedAt: new Date(),
      notes: notes ?? existing.notes,
      historyJson: appendHistory(existing.historyJson, {
        at: new Date().toISOString(),
        actorUserId,
        action: `ROOT_CAUSE_${reviewStatus}`,
        detail: { notes },
      }),
    },
  });
}

export async function addRootCauses(
  prisma: PrismaClient,
  evaluationId: string,
  actorUserId: string,
  codes: AIRootCauseCode[],
  notes?: string
) {
  const created = [];
  for (const code of codes) {
    const row = await prisma.aIRootCauseFinding.create({
      data: {
        id: randomUUID(),
        evaluationId,
        code,
        notes: notes ?? null,
        reviewStatus: 'SUGGESTED',
        historyJson: asJson([
          {
            at: new Date().toISOString(),
            actorUserId,
            action: 'ROOT_CAUSE_ADDED',
            detail: { code },
          },
        ]),
      },
    });
    created.push(row);
  }
  return created;
}

export async function updateCorrectionRoute(
  prisma: PrismaClient,
  correctionId: string,
  actorUserId: string,
  patch: {
    status?: string;
    routingApprovalStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    assignedOwnerId?: string | null;
    overrideDestinations?: AICorrectionDestination[];
    comment?: string;
  }
) {
  const existing = await prisma.aICorrectionRoute.findUnique({ where: { id: correctionId } });
  if (!existing) return null;

  const comments = Array.isArray(existing.commentsJson) ? [...existing.commentsJson] : [];
  if (patch.comment) {
    comments.push({
      id: randomUUID(),
      authorUserId: actorUserId,
      body: patch.comment,
      createdAt: new Date().toISOString(),
    });
  }

  const destinations =
    patch.overrideDestinations ??
    (Array.isArray(existing.overrideDestinationsJson)
      ? (existing.overrideDestinationsJson as AICorrectionDestination[])
      : undefined);

  return prisma.aICorrectionRoute.update({
    where: { id: correctionId },
    data: {
      status: patch.status ?? existing.status,
      routingApprovalStatus: patch.routingApprovalStatus ?? existing.routingApprovalStatus,
      assignedOwnerId:
        patch.assignedOwnerId !== undefined ? patch.assignedOwnerId : existing.assignedOwnerId,
      overrideDestinationsJson: destinations
        ? asJson(destinations)
        : existing.overrideDestinationsJson === null
          ? undefined
          : (existing.overrideDestinationsJson as Prisma.InputJsonValue),
      commentsJson: asJson(comments),
      resolvedAt:
        patch.status === 'RESOLVED' || patch.routingApprovalStatus === 'APPROVED'
          ? new Date()
          : existing.resolvedAt,
    },
  });
}

export async function createOperatorEvaluation(
  prisma: PrismaClient,
  input: AIEvaluationInput & {
    priority?: string;
    severity?: string;
    confidence?: number;
  }
) {
  const persisted = await persistAIEvaluation(prisma, {
    ...input,
    evaluatorRole: input.evaluatorRole ?? 'VSSYL_OPERATOR',
  });
  await prisma.aIEvaluation.update({
    where: { id: persisted.id },
    data: {
      workflowStatus: 'PENDING',
      priority: input.priority ?? null,
      severity: input.severity ?? null,
      confidence: input.confidence ?? null,
    },
  });
  return persisted;
}

export async function createOperatorRegression(
  prisma: PrismaClient,
  input: AIRegressionCaseInput & { ownerUserId?: string; priority?: string }
) {
  const row = await createAIRegressionCase(prisma, input);
  if (input.ownerUserId || input.priority) {
    await prisma.aIRegressionCase.update({
      where: { id: row.id },
      data: {
        ownerUserId: input.ownerUserId ?? null,
        priority: input.priority ?? null,
        historyJson: asJson([
          {
            at: new Date().toISOString(),
            actorUserId: input.ownerUserId ?? 'system',
            action: 'REGRESSION_CREATED',
          },
        ]),
      },
    });
  }
  return row;
}

export function previewCorrectionDestinations(rootCause: AIRootCauseCode) {
  return routeCorrectionForRootCause(rootCause);
}
