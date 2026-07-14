/**
 * Phase 4/6 — Operator workflows (proposals only; no runtime mutation).
 * Phase 6 extends lifecycle transitions, history, work items, regression link, notifications.
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
import { assertEvaluationTransition } from './evaluationWorkflowStateMachine';
import {
  generateWorkItemsForCorrection,
  listWorkItemsForCorrection,
  updateWorkItemStatus,
} from './correctionWorkItemService';
import {
  notifyCorrectionApproved,
  notifyEvaluationAssigned,
  notifyRegressionCreated,
  notifyReviewRequested,
  notifyVerificationRequested,
} from './workflowNotifications';

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
    resolutionCode?: string | null;
    comment?: string;
    requestReviewFromUserId?: string;
    requestVerificationFromUserId?: string;
  }
): Promise<
  | { ok: true; row: Awaited<ReturnType<PrismaClient['aIEvaluation']['update']>> }
  | { ok: false; error: string; status: number }
> {
  const existing = await prisma.aIEvaluation.findUnique({ where: { id: evaluationId } });
  if (!existing) return { ok: false, error: 'Evaluation not found', status: 404 };

  if (patch.workflowStatus && patch.workflowStatus !== existing.workflowStatus) {
    const gate = assertEvaluationTransition(existing.workflowStatus, patch.workflowStatus);
    if (!gate.ok) return { ok: false, error: gate.error, status: 409 };
  }

  const comments = Array.isArray(existing.commentsJson) ? [...existing.commentsJson] : [];
  if (patch.comment) {
    comments.push({
      id: randomUUID(),
      authorUserId: actorUserId,
      body: patch.comment,
      createdAt: new Date().toISOString(),
    });
  }

  const history = appendHistory(existing.historyJson, {
    at: new Date().toISOString(),
    actorUserId,
    action: 'EVALUATION_UPDATED',
    detail: {
      workflowStatus: patch.workflowStatus,
      assignedToUserId: patch.assignedToUserId,
      priority: patch.priority,
      severity: patch.severity,
      resolutionCode: patch.resolutionCode,
      comment: patch.comment ? true : undefined,
    },
  });

  const row = await prisma.aIEvaluation.update({
    where: { id: evaluationId },
    data: {
      workflowStatus: patch.workflowStatus ?? existing.workflowStatus,
      assignedToUserId:
        patch.assignedToUserId !== undefined ? patch.assignedToUserId : existing.assignedToUserId,
      priority: patch.priority !== undefined ? patch.priority : existing.priority,
      severity: patch.severity !== undefined ? patch.severity : existing.severity,
      confidence: patch.confidence !== undefined ? patch.confidence : existing.confidence,
      resolutionCode:
        patch.resolutionCode !== undefined ? patch.resolutionCode : existing.resolutionCode,
      commentsJson: asJson(comments),
      historyJson: history,
    },
  });

  if (
    patch.assignedToUserId &&
    patch.assignedToUserId !== existing.assignedToUserId
  ) {
    await notifyEvaluationAssigned(prisma, {
      assigneeUserId: patch.assignedToUserId,
      evaluationId: row.id,
      executionRecordId: row.executionRecordId,
      actorUserId,
    });
  }
  if (patch.requestReviewFromUserId) {
    await notifyReviewRequested(prisma, {
      reviewerUserId: patch.requestReviewFromUserId,
      evaluationId: row.id,
      executionRecordId: row.executionRecordId,
      actorUserId,
    });
  }
  if (patch.requestVerificationFromUserId) {
    await notifyVerificationRequested(prisma, {
      verifierUserId: patch.requestVerificationFromUserId,
      evaluationId: row.id,
      executionRecordId: row.executionRecordId,
      actorUserId,
    });
  }

  return { ok: true, row };
}

export async function bulkUpdateEvaluations(
  prisma: PrismaClient,
  actorUserId: string,
  ids: string[],
  patch: Parameters<typeof updateEvaluationWorkflow>[3]
) {
  const results: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];
  for (const id of ids) {
    const result = await updateEvaluationWorkflow(prisma, id, actorUserId, patch);
    if (result.ok) results.push(result.row.id);
    else errors.push({ id, error: result.error });
  }
  return { updated: results, errors };
}

export async function reviewRootCause(
  prisma: PrismaClient,
  rootCauseId: string,
  actorUserId: string,
  reviewStatus: 'APPROVED' | 'REJECTED',
  notes?: string,
  confidence?: number,
  ownerUserId?: string | null
) {
  const existing = await prisma.aIRootCauseFinding.findUnique({ where: { id: rootCauseId } });
  if (!existing) return null;

  const updated = await prisma.aIRootCauseFinding.update({
    where: { id: rootCauseId },
    data: {
      reviewStatus,
      reviewedByUserId: actorUserId,
      reviewedAt: new Date(),
      notes: notes ?? existing.notes,
      confidence: confidence !== undefined ? confidence : existing.confidence,
      ownerUserId: ownerUserId !== undefined ? ownerUserId : existing.ownerUserId,
      historyJson: appendHistory(existing.historyJson, {
        at: new Date().toISOString(),
        actorUserId,
        action: `ROOT_CAUSE_${reviewStatus}`,
        detail: { notes, confidence, ownerUserId },
      }),
    },
  });

  // When all root causes approved → advance evaluation
  if (reviewStatus === 'APPROVED') {
    const siblings = await prisma.aIRootCauseFinding.findMany({
      where: { evaluationId: existing.evaluationId },
    });
    const allApproved =
      siblings.length > 0 &&
      siblings.every((s) =>
        s.id === rootCauseId ? true : s.reviewStatus === 'APPROVED'
      );
    if (allApproved) {
      await updateEvaluationWorkflow(prisma, existing.evaluationId, actorUserId, {
        workflowStatus: 'ROOT_CAUSE_CONFIRMED',
        comment: 'All root causes confirmed',
      });
    }
  }

  return updated;
}

export async function addRootCauses(
  prisma: PrismaClient,
  evaluationId: string,
  actorUserId: string,
  codes: AIRootCauseCode[],
  notes?: string,
  confidence?: number
) {
  const created = [];
  for (const code of codes) {
    const row = await prisma.aIRootCauseFinding.create({
      data: {
        id: randomUUID(),
        evaluationId,
        code,
        notes: notes ?? null,
        confidence: confidence ?? null,
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

  await updateEvaluationWorkflow(prisma, evaluationId, actorUserId, {
    workflowStatus: 'UNDER_REVIEW',
    comment: `Added root causes: ${codes.join(', ')}`,
  });

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
    createRegression?: boolean;
    regressionTitle?: string;
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
      : Array.isArray(existing.destinationsJson)
        ? (existing.destinationsJson as AICorrectionDestination[])
        : []);

  const approving =
    patch.routingApprovalStatus === 'APPROVED' &&
    existing.routingApprovalStatus !== 'APPROVED';

  const nextStatus =
    patch.status ??
    (approving ? 'IN_PROGRESS' : existing.status);

  const row = await prisma.aICorrectionRoute.update({
    where: { id: correctionId },
    data: {
      status: nextStatus,
      routingApprovalStatus: patch.routingApprovalStatus ?? existing.routingApprovalStatus,
      assignedOwnerId:
        patch.assignedOwnerId !== undefined ? patch.assignedOwnerId : existing.assignedOwnerId,
      overrideDestinationsJson: patch.overrideDestinations
        ? asJson(patch.overrideDestinations)
        : existing.overrideDestinationsJson === null
          ? undefined
          : (existing.overrideDestinationsJson as Prisma.InputJsonValue),
      commentsJson: asJson(comments),
      historyJson: appendHistory(existing.historyJson, {
        at: new Date().toISOString(),
        actorUserId,
        action: approving ? 'CORRECTION_APPROVED' : 'CORRECTION_UPDATED',
        detail: {
          status: nextStatus,
          routingApprovalStatus: patch.routingApprovalStatus,
          assignedOwnerId: patch.assignedOwnerId,
        },
      }),
      resolvedAt:
        nextStatus === 'RESOLVED' ||
        nextStatus === 'VERIFIED' ||
        nextStatus === 'IMPLEMENTED' ||
        nextStatus === 'WONT_FIX' ||
        nextStatus === 'DUPLICATE' ||
        nextStatus === 'ARCHIVED' ||
        approving
          ? existing.resolvedAt ?? new Date()
          : existing.resolvedAt,
    },
  });

  let workItems = await listWorkItemsForCorrection(prisma, correctionId);
  let regressionId: string | undefined;

  if (approving) {
    if (workItems.length === 0) {
      workItems = await generateWorkItemsForCorrection(
        prisma,
        correctionId,
        actorUserId,
        destinations,
        patch.assignedOwnerId ?? existing.assignedOwnerId
      );
    }

    if (existing.evaluationId) {
      await updateEvaluationWorkflow(prisma, existing.evaluationId, actorUserId, {
        workflowStatus: 'CORRECTION_APPROVED',
        comment: 'Correction proposal approved (governed — runtime not modified)',
      });
    }

    const ownerId = patch.assignedOwnerId ?? existing.assignedOwnerId;
    if (ownerId) {
      await notifyCorrectionApproved(prisma, {
        ownerUserId: ownerId,
        correctionId,
        executionRecordId: existing.executionRecordId,
        actorUserId,
      });
    }

    const shouldCreateRegression = patch.createRegression !== false;
    if (shouldCreateRegression) {
      const exec = await prisma.aIExecutionRecord.findUnique({
        where: { id: existing.executionRecordId },
        select: { userQuery: true },
      });
      const regression = await createAIRegressionCase(prisma, {
        executionRecordId: existing.executionRecordId,
        evaluationId: existing.evaluationId ?? undefined,
        correctionRouteId: correctionId,
        title:
          patch.regressionTitle ??
          `Regression for ${existing.rootCauseCode} (${correctionId.slice(0, 8)})`,
        originalRequest: exec?.userQuery ?? 'Original request unavailable',
        expectations: {
          expectedBehavior: existing.rationale ?? 'Corrected behavior after proposal implementation',
        },
        tags: ['phase6', 'auto-linked', existing.rootCauseCode],
      });
      await prisma.aIRegressionCase.update({
        where: { id: regression.id },
        data: {
          ownerUserId: ownerId ?? actorUserId,
          status: 'DRAFT',
          historyJson: asJson([
            {
              at: new Date().toISOString(),
              actorUserId,
              action: 'REGRESSION_AUTO_LINKED',
              detail: { correctionRouteId: correctionId },
            },
          ]),
        },
      });
      regressionId = regression.id;
      if (existing.evaluationId) {
        await updateEvaluationWorkflow(prisma, existing.evaluationId, actorUserId, {
          workflowStatus: 'REGRESSION_CREATED',
          comment: `Regression ${regression.id.slice(0, 8)} linked`,
        });
      }
      if (ownerId) {
        await notifyRegressionCreated(prisma, {
          ownerUserId: ownerId,
          regressionId: regression.id,
          executionRecordId: existing.executionRecordId,
          actorUserId,
        });
      }
    }
  }

  // Advance evaluation when correction reaches implemented/verified
  if (
    existing.evaluationId &&
    (nextStatus === 'IMPLEMENTED' || nextStatus === 'VERIFIED' || nextStatus === 'RESOLVED')
  ) {
    await updateEvaluationWorkflow(prisma, existing.evaluationId, actorUserId, {
      workflowStatus: nextStatus === 'VERIFIED' ? 'VERIFIED' : nextStatus === 'RESOLVED' ? 'CLOSED' : 'IMPLEMENTED',
    });
  }

  return { row, workItems, regressionId };
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
      workflowStatus: 'NEW',
      priority: input.priority ?? null,
      severity: input.severity ?? null,
      confidence: input.confidence ?? null,
      historyJson: asJson([
        {
          at: new Date().toISOString(),
          actorUserId: input.evaluatorUserId ?? 'system',
          action: 'EVALUATION_CREATED',
          detail: { labels: input.labels },
        },
      ]),
    },
  });

  // If persistAIEvaluation already created correction routes, advance lifecycle
  const corrections = await prisma.aICorrectionRoute.count({
    where: { evaluationId: persisted.id },
  });
  if (corrections > 0) {
    await updateEvaluationWorkflow(prisma, persisted.id, input.evaluatorUserId ?? 'system', {
      workflowStatus: 'CORRECTION_CREATED',
    });
  }

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
  if (input.ownerUserId) {
    await notifyRegressionCreated(prisma, {
      ownerUserId: input.ownerUserId,
      regressionId: row.id,
      executionRecordId: input.executionRecordId,
      actorUserId: input.ownerUserId,
    });
  }
  return row;
}

export async function updateRegressionCase(
  prisma: PrismaClient,
  regressionId: string,
  actorUserId: string,
  patch: {
    status?: string;
    ownerUserId?: string | null;
    priority?: string | null;
    lastResultNotes?: string | null;
    comment?: string;
  }
) {
  const existing = await prisma.aIRegressionCase.findUnique({ where: { id: regressionId } });
  if (!existing) return null;
  return prisma.aIRegressionCase.update({
    where: { id: regressionId },
    data: {
      status: patch.status ?? existing.status,
      ownerUserId: patch.ownerUserId !== undefined ? patch.ownerUserId : existing.ownerUserId,
      priority: patch.priority !== undefined ? patch.priority : existing.priority,
      lastResultNotes:
        patch.lastResultNotes !== undefined ? patch.lastResultNotes : existing.lastResultNotes,
      historyJson: appendHistory(existing.historyJson, {
        at: new Date().toISOString(),
        actorUserId,
        action: 'REGRESSION_UPDATED',
        detail: { ...patch },
      }),
    },
  });
}

export function previewCorrectionDestinations(rootCause: AIRootCauseCode) {
  return routeCorrectionForRootCause(rootCause);
}

export { listWorkItemsForCorrection, updateWorkItemStatus };
