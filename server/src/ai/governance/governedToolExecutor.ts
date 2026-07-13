/**
 * Governed wrapper around executeTool — risk, approval, idempotency (Phase 1).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { resolveApprovalRequired } from 'vssyl-shared';
import { logger } from '../../lib/logger';
import { executeTool, type ToolExecutionContext } from '../tools/toolExecutor';
import type { AIToolName } from '../tools/toolDefinitions';
import { getToolRiskDeclaration, toolRequiresApproval } from './aiToolRiskRegistry';
import {
  beginOrReplayActionExecution,
  completeActionExecution,
  markAwaitingApproval,
} from './aiActionExecutionService';
import { hashToolArguments } from './aiActionIdempotency';

export interface GovernedToolContext extends ToolExecutionContext {
  prisma: PrismaClient;
  requestId?: string | null;
  conversationId?: string | null;
  businessId?: string | null;
  /** When true, skip approval gate (explicit user approval already granted). */
  approvalGranted?: boolean;
  approvalId?: string | null;
  idempotencyKey?: string | null;
}

function parseToolJson(raw: string): { success: boolean; message: string; data?: Record<string, unknown> } {
  try {
    const parsed = JSON.parse(raw) as { success?: boolean; message?: string; data?: Record<string, unknown> };
    return {
      success: Boolean(parsed.success),
      message: typeof parsed.message === 'string' ? parsed.message : raw,
      data: parsed.data,
    };
  } catch {
    return { success: false, message: raw };
  }
}

function logFields(context: GovernedToolContext, name: string, riskCategory: string, approvalRequired: boolean) {
  return {
    operation: 'ai_governed_tool',
    requestId: context.requestId ?? undefined,
    conversationId: context.conversationId ?? undefined,
    userId: context.userId,
    businessId: context.businessId ?? undefined,
    actionName: name,
    riskCategory,
    approvalRequired,
    approvalId: context.approvalId ?? undefined,
  };
}

/**
 * Execute a Twin tool with Phase 1 governance.
 * Returns a JSON string suitable for the model tool-result channel.
 */
export async function executeGovernedTool(
  name: AIToolName,
  args: Record<string, unknown>,
  context: GovernedToolContext
): Promise<string> {
  const decl = getToolRiskDeclaration(name);
  const riskCategory = decl?.riskCategory ?? 'CONSEQUENTIAL_REVERSIBLE';
  const mutating = decl?.mutating ?? true;
  const approvalRequired =
    Boolean(decl) && resolveApprovalRequired(decl!)
      ? true
      : !decl
        ? toolRequiresApproval(name)
        : false;

  const logBase = logFields(context, name, riskCategory, approvalRequired);

  // Read-only / non-mutating: execute without idempotency ledger
  if (!mutating) {
    void logger.info('AI tool execute (read-only)', { ...logBase, authorized: true, executed: true });
    return executeTool(name, args, context);
  }

  if (!decl?.idempotencyRequired && !approvalRequired) {
    void logger.info('AI tool execute (mutating, no ledger)', { ...logBase, authorized: true });
    return executeTool(name, args, context);
  }

  // Resume after explicit approval: prefer existing AWAITING_APPROVAL row bound to approvalId
  if (context.approvalGranted && context.approvalId) {
    const pending = await context.prisma.aIActionExecution.findFirst({
      where: { approvalId: context.approvalId },
      orderBy: { createdAt: 'desc' },
    });
    if (pending) {
      if (pending.userId !== context.userId) {
        return JSON.stringify({
          success: false,
          message: 'Approval execution belongs to another user.',
          governance: { status: 'FAILED', approvalRequired: true, approvalId: context.approvalId },
        });
      }
      if ((pending.businessId ?? null) !== (context.businessId ?? null)) {
        return JSON.stringify({
          success: false,
          message: 'Approval execution belongs to another business scope.',
          governance: { status: 'FAILED', approvalRequired: true, approvalId: context.approvalId },
        });
      }
      const argsHash = hashToolArguments(args);
      if (pending.argsHash !== argsHash) {
        return JSON.stringify({
          success: false,
          message: 'Approved arguments do not match the original proposal.',
          governance: { status: 'FAILED', approvalRequired: true, approvalId: context.approvalId },
        });
      }
      if (pending.status === 'COMPLETED' && pending.resultJson) {
        return JSON.stringify({
          ...(typeof pending.resultJson === 'object' && pending.resultJson !== null
            ? (pending.resultJson as Record<string, unknown>)
            : { success: pending.executed, message: 'Prior execution result' }),
          governance: {
            status: 'COMPLETED',
            executionId: pending.id,
            approvalId: context.approvalId,
            idempotentReplay: true,
          },
        });
      }
      if (pending.status === 'AWAITING_APPROVAL' || pending.status === 'APPROVED' || pending.status === 'FAILED') {
        await context.prisma.aIActionExecution.update({
          where: { id: pending.id },
          data: {
            status: 'EXECUTING',
            approvalId: context.approvalId,
            ...(pending.status === 'FAILED' ? { retryCount: { increment: 1 }, errorMessage: null } : {}),
          },
        });
        const raw = await executeTool(name, args, context);
        const parsed = parseToolJson(raw);
        await completeActionExecution({
          prisma: context.prisma,
          executionId: pending.id,
          status: parsed.success ? 'COMPLETED' : 'FAILED',
          executed: parsed.success,
          result: parsed as unknown as Record<string, unknown>,
          errorMessage: parsed.success ? undefined : parsed.message,
        });
        void logger.info('AI tool execute after approval', {
          ...logBase,
          executionId: pending.id,
          authorized: true,
          executed: parsed.success,
          success: parsed.success,
        });
        return JSON.stringify({
          ...parsed,
          governance: {
            status: parsed.success ? 'COMPLETED' : 'FAILED',
            executionId: pending.id,
            approvalRequired: true,
            approvalId: context.approvalId,
            riskCategory,
            authorized: true,
            executed: parsed.success,
            idempotentReplay: false,
          },
        });
      }
      return JSON.stringify({
        success: false,
        message: `Cannot resume execution in status ${pending.status}`,
        governance: { status: pending.status, executionId: pending.id, approvalId: context.approvalId },
      });
    }
  }

  const begin = await beginOrReplayActionExecution({
    prisma: context.prisma,
    userId: context.userId,
    businessId: context.businessId,
    actionName: name,
    args,
    riskCategory,
    approvalId: context.approvalId,
    requestId: context.requestId,
    conversationId: context.conversationId,
    idempotencyKey: context.idempotencyKey,
  });

  if (begin.kind === 'conflict') {
    void logger.warn('AI tool idempotency conflict', {
      ...logBase,
      error: { message: begin.message },
    });
    return JSON.stringify({
      success: false,
      message: begin.message,
      governance: { status: 'FAILED', approvalRequired },
    });
  }

  if (begin.kind === 'replay') {
    void logger.info('AI tool idempotent replay', {
      ...logBase,
      executionId: begin.executionId,
      status: begin.status,
      idempotentReplay: true,
    });
    // Still awaiting approval and caller has not been granted — return prior proposal payload
    if (begin.status === 'AWAITING_APPROVAL' && begin.resultJson && !context.approvalGranted) {
      return JSON.stringify(begin.resultJson);
    }
    if (begin.status === 'COMPLETED' && begin.resultJson) {
      return JSON.stringify({
        ...(typeof begin.resultJson === 'object' && begin.resultJson !== null
          ? (begin.resultJson as Record<string, unknown>)
          : { success: begin.executed, message: 'Prior execution result' }),
        governance: {
          status: 'COMPLETED',
          executionId: begin.executionId,
          idempotentReplay: true,
        },
      });
    }
    return JSON.stringify({
      success: false,
      message: begin.errorMessage || `Prior execution status: ${begin.status}`,
      governance: { status: begin.status, executionId: begin.executionId, idempotentReplay: true },
    });
  }

  const executionId = begin.executionId;

  // High-risk: require approval before domain mutation
  if (approvalRequired && !context.approvalGranted) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const actionData = {
      tool: name,
      args,
      executionId,
      requestId: context.requestId ?? null,
      conversationId: context.conversationId ?? null,
      businessId: context.businessId ?? null,
      riskCategory,
    };
    const approval = await context.prisma.aIApprovalRequest.create({
      data: {
        userId: context.userId,
        requestType: name,
        actionData: actionData as Prisma.InputJsonValue,
        affectedUsers: [],
        reasoning: `AI proposed ${name} (${riskCategory}); Phase 1 policy requires approval before execution.`,
        status: 'PENDING',
        expiresAt,
      },
    });

    const payload = {
      success: false,
      message: `This action requires your approval before it can run (${name}).`,
      governance: {
        status: 'AWAITING_APPROVAL',
        executionId,
        approvalId: approval.id,
        approvalRequired: true,
        riskCategory,
        authorized: true,
        executed: false,
      },
      data: { approvalId: approval.id, tool: name, args },
    };

    await markAwaitingApproval({
      prisma: context.prisma,
      executionId,
      approvalId: approval.id,
      result: payload,
    });

    return JSON.stringify(payload);
  }

  const raw = await executeTool(name, args, context);
  const parsed = parseToolJson(raw);

  await completeActionExecution({
    prisma: context.prisma,
    executionId,
    status: parsed.success ? 'COMPLETED' : 'FAILED',
    executed: parsed.success,
    result: parsed as unknown as Record<string, unknown>,
    errorMessage: parsed.success ? undefined : parsed.message,
  });

  void logger.info('AI tool execute (mutating)', {
    ...logBase,
    executionId,
    authorized: true,
    executed: parsed.success,
    success: parsed.success,
  });

  return JSON.stringify({
    ...parsed,
    governance: {
      status: parsed.success ? 'COMPLETED' : 'FAILED',
      executionId,
      approvalRequired,
      approvalId: context.approvalId ?? undefined,
      riskCategory,
      authorized: true,
      executed: parsed.success,
      idempotentReplay: false,
    },
  });
}
