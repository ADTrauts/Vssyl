/**
 * Persist and resolve AI action idempotency (Phase 1).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { AIActionExecutionResult, AIActionExecutionStatus, AIActionRiskCategory } from 'vssyl-shared';
import { logger } from '../../lib/logger';
import { buildDefaultIdempotencyKey, hashToolArguments } from './aiActionIdempotency';

export interface BeginExecutionInput {
  prisma: PrismaClient;
  userId: string;
  businessId?: string | null;
  actionName: string;
  args: Record<string, unknown>;
  riskCategory: AIActionRiskCategory;
  approvalId?: string | null;
  requestId?: string | null;
  conversationId?: string | null;
  /** Caller-supplied key; otherwise derived. */
  idempotencyKey?: string | null;
}

export type BeginExecutionOutcome =
  | { kind: 'new'; executionId: string; idempotencyKey: string; argsHash: string }
  | {
      kind: 'replay';
      executionId: string;
      idempotencyKey: string;
      status: string;
      resultJson: unknown;
      errorMessage: string | null;
      executed: boolean;
    }
  | { kind: 'conflict'; message: string };

function toResultShape(row: {
  id: string;
  actionName: string;
  status: string;
  riskCategory: string;
  authorized: boolean;
  executed: boolean;
  idempotentReplay: boolean;
  resultJson: unknown;
  errorMessage: string | null;
  activityId: string | null;
  approvalId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): AIActionExecutionResult {
  return {
    executionId: row.id,
    actionName: row.actionName,
    status: row.status as AIActionExecutionStatus,
    riskCategory: row.riskCategory as AIActionRiskCategory,
    approvalRequired: Boolean(row.approvalId),
    approvalId: row.approvalId ?? undefined,
    authorized: row.authorized,
    executed: row.executed,
    idempotentReplay: row.idempotentReplay,
    result: (row.resultJson as Record<string, unknown> | null) ?? undefined,
    error: row.errorMessage ?? undefined,
    activityId: row.activityId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  };
}

export async function beginOrReplayActionExecution(
  input: BeginExecutionInput
): Promise<BeginExecutionOutcome> {
  const argsHash = hashToolArguments(input.args);
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    buildDefaultIdempotencyKey({
      userId: input.userId,
      businessId: input.businessId,
      actionName: input.actionName,
      argsHash,
      approvalId: input.approvalId,
    });

  const existing = await input.prisma.aIActionExecution.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    if (existing.userId !== input.userId) {
      return { kind: 'conflict', message: 'Idempotency key belongs to another user.' };
    }
    if ((existing.businessId ?? null) !== (input.businessId ?? null)) {
      return { kind: 'conflict', message: 'Idempotency key belongs to another business scope.' };
    }
    if (existing.argsHash !== argsHash) {
      return { kind: 'conflict', message: 'Idempotency key reused with different arguments.' };
    }
    if (existing.status === 'COMPLETED' || existing.status === 'AWAITING_APPROVAL') {
      return {
        kind: 'replay',
        executionId: existing.id,
        idempotencyKey,
        status: existing.status,
        resultJson: existing.resultJson,
        errorMessage: existing.errorMessage,
        executed: existing.executed,
      };
    }
    if (existing.status === 'FAILED') {
      await input.prisma.aIActionExecution.update({
        where: { id: existing.id },
        data: {
          status: 'EXECUTING',
          retryCount: { increment: 1 },
          errorMessage: null,
        },
      });
      return { kind: 'new', executionId: existing.id, idempotencyKey, argsHash };
    }
    // EXECUTING / APPROVED / etc. — treat as in-flight replay of current row
    return {
      kind: 'replay',
      executionId: existing.id,
      idempotencyKey,
      status: existing.status,
      resultJson: existing.resultJson,
      errorMessage: existing.errorMessage,
      executed: existing.executed,
    };
  }

  const created = await input.prisma.aIActionExecution.create({
    data: {
      idempotencyKey,
      userId: input.userId,
      businessId: input.businessId ?? null,
      actionName: input.actionName,
      argsHash,
      approvalId: input.approvalId ?? null,
      requestId: input.requestId ?? null,
      conversationId: input.conversationId ?? null,
      riskCategory: input.riskCategory,
      status: 'EXECUTING',
      authorized: true,
    },
  });

  return { kind: 'new', executionId: created.id, idempotencyKey, argsHash };
}

export async function completeActionExecution(input: {
  prisma: PrismaClient;
  executionId: string;
  status: AIActionExecutionStatus;
  executed: boolean;
  result?: Record<string, unknown>;
  errorMessage?: string;
  activityId?: string;
  idempotentReplay?: boolean;
}): Promise<AIActionExecutionResult> {
  const row = await input.prisma.aIActionExecution.update({
    where: { id: input.executionId },
    data: {
      status: input.status,
      executed: input.executed,
      resultJson: (input.result ?? null) as Prisma.InputJsonValue,
      errorMessage: input.errorMessage ?? null,
      activityId: input.activityId ?? null,
      idempotentReplay: input.idempotentReplay ?? false,
      completedAt: new Date(),
    },
  });
  return toResultShape(row);
}

export async function markAwaitingApproval(input: {
  prisma: PrismaClient;
  executionId: string;
  approvalId: string;
  result: Record<string, unknown>;
}): Promise<AIActionExecutionResult> {
  const row = await input.prisma.aIActionExecution.update({
    where: { id: input.executionId },
    data: {
      status: 'AWAITING_APPROVAL',
      approvalId: input.approvalId,
      executed: false,
      authorized: true,
      resultJson: input.result as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });
  void logger.info('AI action awaiting approval', {
    operation: 'ai_action_awaiting_approval',
    executionId: row.id,
    approvalId: input.approvalId,
    actionName: row.actionName,
    userId: row.userId,
    businessId: row.businessId ?? undefined,
    riskCategory: row.riskCategory,
    requestId: row.requestId ?? undefined,
    conversationId: row.conversationId ?? undefined,
  });
  return toResultShape(row);
}

export { toResultShape };
