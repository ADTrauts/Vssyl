/**
 * Resume a governed action after explicit user approval (Phase 1–2).
 * Supports Twin tool payloads and ActionExecutor legacy HIGH_RISK payloads.
 */

import type { PrismaClient } from '@prisma/client';
import { hashToolArguments } from './aiActionIdempotency';
import { executeGovernedTool, type GovernedToolContext } from './governedToolExecutor';
import type { AIToolName } from '../tools/toolDefinitions';
import { getToolRiskDeclaration } from './aiToolRiskRegistry';
import { completeActionExecution } from './aiActionExecutionService';
import { logger } from '../../lib/logger';
import {
  ACTION_EXECUTOR_GOVERNED_SOURCE,
  completeLegacyApprovedExecution,
  type LegacyActionData,
} from './actionExecutorBridge';

export type ApprovedActionData = {
  tool?: string;
  args?: Record<string, unknown>;
  executionId?: string;
  requestId?: string | null;
  conversationId?: string | null;
  businessId?: string | null;
  riskCategory?: string;
  source?: string;
  module?: string;
  operation?: string;
  parameters?: Record<string, unknown>;
};

export type ExecuteApprovedResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLegacyActionData(value: unknown): value is LegacyActionData {
  if (!isRecord(value)) return false;
  return (
    value.source === ACTION_EXECUTOR_GOVERNED_SOURCE &&
    typeof value.operation === 'string' &&
    typeof value.module === 'string' &&
    isRecord(value.parameters) &&
    typeof value.executionId === 'string'
  );
}

/**
 * Execute (or replay) a governed tool or legacy ActionExecutor action bound to an AIApprovalRequest.
 */
export async function executeApprovedGovernedAction(input: {
  prisma: PrismaClient;
  userId: string;
  approvalId: string;
  /** Optional: reject if client tries to mutate args after proposal */
  overrideArgs?: Record<string, unknown> | null;
}): Promise<ExecuteApprovedResult> {
  const approval = await input.prisma.aIApprovalRequest.findUnique({
    where: { id: input.approvalId },
  });

  if (!approval) {
    return { ok: false, status: 404, body: { error: 'Approval request not found' } };
  }

  if (approval.userId !== input.userId) {
    return { ok: false, status: 403, body: { error: 'Not authorized to execute this approval' } };
  }

  if (approval.expiresAt && approval.expiresAt.getTime() < Date.now()) {
    if (approval.status === 'PENDING') {
      await input.prisma.aIApprovalRequest.update({
        where: { id: approval.id },
        data: { status: 'EXPIRED' },
      });
    }
    const execution = await input.prisma.aIActionExecution.findFirst({
      where: { approvalId: approval.id },
    });
    if (execution && execution.status === 'AWAITING_APPROVAL') {
      await completeActionExecution({
        prisma: input.prisma,
        executionId: execution.id,
        status: 'FAILED',
        executed: false,
        errorMessage: 'Approval expired before execution',
      });
    }
    return { ok: false, status: 410, body: { error: 'Approval request has expired' } };
  }

  const existingExec = await input.prisma.aIActionExecution.findFirst({
    where: { approvalId: approval.id },
    orderBy: { createdAt: 'desc' },
  });
  if (existingExec?.status === 'COMPLETED' && existingExec.resultJson) {
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        idempotentReplay: true,
        data: existingExec.resultJson,
        executionId: existingExec.id,
        approvalId: approval.id,
      },
    };
  }

  const actionDataRaw = approval.actionData;

  if (isLegacyActionData(actionDataRaw)) {
    if (existingExec && existingExec.status === 'AWAITING_APPROVAL') {
      await input.prisma.aIActionExecution.update({
        where: { id: existingExec.id },
        data: { status: 'EXECUTING' },
      });
    }
    const legacy = await completeLegacyApprovedExecution({
      prisma: input.prisma,
      executionId: existingExec?.id ?? actionDataRaw.executionId,
      approvalId: approval.id,
      userId: input.userId,
      actionData: actionDataRaw,
    });
    void logger.info('Legacy ActionExecutor op executed after approval', {
      operation: 'ai_approval_execute_legacy',
      approvalId: approval.id,
      userId: input.userId,
      actionName: `ae:${actionDataRaw.module}:${actionDataRaw.operation}`,
      success: legacy.success,
    });
    return {
      ok: true,
      status: 200,
      body: {
        success: legacy.success,
        data: legacy.body,
        approvalId: approval.id,
        executionId: existingExec?.id ?? actionDataRaw.executionId,
      },
    };
  }

  const actionData = isRecord(actionDataRaw) ? (actionDataRaw as ApprovedActionData) : null;
  const tool = typeof actionData?.tool === 'string' ? actionData.tool : null;
  const storedArgs = isRecord(actionData?.args) ? actionData.args : null;

  if (!tool || !storedArgs) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Approval is not bound to a governed tool payload',
        message: 'This approval cannot be executed via the canonical governed path.',
      },
    };
  }

  if (input.overrideArgs) {
    const storedHash = hashToolArguments(storedArgs);
    const overrideHash = hashToolArguments(input.overrideArgs);
    if (storedHash !== overrideHash) {
      return {
        ok: false,
        status: 409,
        body: { error: 'Approved arguments do not match the original proposal' },
      };
    }
  }

  const decl = getToolRiskDeclaration(tool);
  if (!decl) {
    return { ok: false, status: 400, body: { error: `Unknown governed tool: ${tool}` } };
  }

  const businessId =
    typeof actionData?.businessId === 'string' && actionData.businessId.trim() !== ''
      ? actionData.businessId.trim()
      : null;

  const context: GovernedToolContext = {
    userId: input.userId,
    prisma: input.prisma,
    approvalGranted: true,
    approvalId: approval.id,
    requestId: typeof actionData?.requestId === 'string' ? actionData.requestId : null,
    conversationId: typeof actionData?.conversationId === 'string' ? actionData.conversationId : null,
    businessId,
    idempotencyKey: existingExec?.idempotencyKey,
  };

  const raw = await executeGovernedTool(tool as AIToolName, storedArgs, context);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    parsed = { success: false, message: raw };
  }

  void logger.info('Governed tool executed after approval', {
    operation: 'ai_approval_execute_governed',
    approvalId: approval.id,
    userId: input.userId,
    businessId: businessId ?? undefined,
    actionName: tool,
    executionId: existingExec?.id,
    success: Boolean(parsed.success),
  });

  return {
    ok: true,
    status: 200,
    body: {
      success: Boolean(parsed.success),
      data: parsed,
      approvalId: approval.id,
      executionId:
        typeof (parsed.governance as { executionId?: string } | undefined)?.executionId === 'string'
          ? (parsed.governance as { executionId: string }).executionId
          : existingExec?.id,
    },
  };
}
