/**
 * Phase 6 — Workflow notifications via existing notification table.
 * Fail-open: never block workflow updates.
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '../../lib/logger';

export type WorkflowNotificationType =
  | 'ai_evaluation_assigned'
  | 'ai_evaluation_review_requested'
  | 'ai_correction_approved'
  | 'ai_regression_created'
  | 'ai_verification_requested';

async function notifySafe(
  prisma: PrismaClient,
  input: {
    userId: string;
    type: WorkflowNotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.userId?.trim()) return;
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as object,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Workflow notification failed (non-fatal)', {
      operation: 'ai_workflow_notification_error',
      error: { message: err.message },
      type: input.type,
      userId: input.userId,
    });
  }
}

export async function notifyEvaluationAssigned(
  prisma: PrismaClient,
  params: {
    assigneeUserId: string;
    evaluationId: string;
    executionRecordId: string;
    actorUserId: string;
  }
): Promise<void> {
  await notifySafe(prisma, {
    userId: params.assigneeUserId,
    type: 'ai_evaluation_assigned',
    title: 'AI evaluation assigned to you',
    body: `You were assigned evaluation ${params.evaluationId.slice(0, 8)} for review.`,
    data: {
      evaluationId: params.evaluationId,
      executionRecordId: params.executionRecordId,
      actorUserId: params.actorUserId,
      href: `/admin-portal/ai-pipeline/executions/${params.executionRecordId}`,
    },
  });
}

export async function notifyReviewRequested(
  prisma: PrismaClient,
  params: {
    reviewerUserId: string;
    evaluationId: string;
    executionRecordId: string;
    actorUserId: string;
  }
): Promise<void> {
  await notifySafe(prisma, {
    userId: params.reviewerUserId,
    type: 'ai_evaluation_review_requested',
    title: 'AI evaluation review requested',
    body: `Additional review requested on evaluation ${params.evaluationId.slice(0, 8)}.`,
    data: {
      evaluationId: params.evaluationId,
      executionRecordId: params.executionRecordId,
      actorUserId: params.actorUserId,
      href: `/admin-portal/ai-pipeline/executions/${params.executionRecordId}`,
    },
  });
}

export async function notifyCorrectionApproved(
  prisma: PrismaClient,
  params: {
    ownerUserId: string;
    correctionId: string;
    executionRecordId: string;
    actorUserId: string;
  }
): Promise<void> {
  await notifySafe(prisma, {
    userId: params.ownerUserId,
    type: 'ai_correction_approved',
    title: 'AI correction proposal approved',
    body: `Correction ${params.correctionId.slice(0, 8)} was approved. Implement as a governed proposal — runtime is not auto-modified.`,
    data: {
      correctionId: params.correctionId,
      executionRecordId: params.executionRecordId,
      actorUserId: params.actorUserId,
      href: `/admin-portal/ai-pipeline/corrections`,
    },
  });
}

export async function notifyRegressionCreated(
  prisma: PrismaClient,
  params: {
    ownerUserId: string;
    regressionId: string;
    executionRecordId: string;
    actorUserId: string;
  }
): Promise<void> {
  await notifySafe(prisma, {
    userId: params.ownerUserId,
    type: 'ai_regression_created',
    title: 'AI regression case created',
    body: `Regression ${params.regressionId.slice(0, 8)} was linked for future verification (no CI yet).`,
    data: {
      regressionId: params.regressionId,
      executionRecordId: params.executionRecordId,
      actorUserId: params.actorUserId,
      href: `/admin-portal/ai-pipeline/regressions`,
    },
  });
}

export async function notifyVerificationRequested(
  prisma: PrismaClient,
  params: {
    verifierUserId: string;
    evaluationId: string;
    executionRecordId: string;
    actorUserId: string;
  }
): Promise<void> {
  await notifySafe(prisma, {
    userId: params.verifierUserId,
    type: 'ai_verification_requested',
    title: 'AI correction verification requested',
    body: `Please verify implementation for evaluation ${params.evaluationId.slice(0, 8)}.`,
    data: {
      evaluationId: params.evaluationId,
      executionRecordId: params.executionRecordId,
      actorUserId: params.actorUserId,
      href: `/admin-portal/ai-pipeline/executions/${params.executionRecordId}`,
    },
  });
}
