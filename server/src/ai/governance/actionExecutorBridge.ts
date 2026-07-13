/**
 * Phase 2 — ActionExecutor ↔ canonical governed execution bridge.
 * Mapped Twin tools use executeGovernedTool; other HIGH_RISK ops propose via ledger + approval.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type { AIActionRiskCategory, AIActionExecutionResult } from 'vssyl-shared';
import { toCanonicalExecutionResult } from 'vssyl-shared';
import { logger } from '../../lib/logger';
import type { AIAction, UserContext } from '../core/DigitalLifeTwinService';
import type { AIToolName } from '../tools/toolDefinitions';
import { executeGovernedTool } from './governedToolExecutor';
import {
  beginOrReplayActionExecution,
  completeActionExecution,
  markAwaitingApproval,
} from './aiActionExecutionService';
import { getLegacyActionRisk, isHighRiskActionExecutorOperation } from './legacyActionRiskRegistry';

/** Local result shape matching ActionExecutor.ActionExecutionResult (avoid circular import). */
export interface GovernedBridgeActionResult {
  actionId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  metadata: {
    executionTime: number;
    module: string;
    operation: string;
    affectedUsers: string[];
    rollbackAvailable: boolean;
  };
}

export const ACTION_EXECUTOR_GOVERNED_SOURCE = 'action_executor' as const;

export type LegacyActionData = {
  source: typeof ACTION_EXECUTOR_GOVERNED_SOURCE;
  module: string;
  operation: string;
  parameters: Record<string, unknown>;
  executionId: string;
  requestId?: string | null;
  businessId?: string | null;
  riskCategory: AIActionRiskCategory;
};

/** Twin tool mappings for ActionExecutor operations that already have tool definitions. */
export function mapActionExecutorToTwinTool(
  action: AIAction
): { tool: AIToolName; args: Record<string, unknown> } | null {
  const params = (action.parameters ?? {}) as Record<string, unknown>;

  if (action.operation === 'share_file') {
    // Twin tool uses email; ActionExecutor historically used target userId.
    // Bridge accepts either targetUserEmail or userId (resolved later).
    return {
      tool: 'share_file',
      args: {
        fileId: params.fileId,
        targetUserEmail: params.targetUserEmail,
        targetUserId: params.userId ?? params.targetUserId,
        canWrite: params.canWrite,
        canRead: params.canRead,
      },
    };
  }

  if (action.operation === 'create_task' || action.operation === 'create_todo') {
    return {
      tool: 'create_todo',
      args: {
        title: params.title ?? params.name,
        description: params.description,
        priority: params.priority,
        dueDate: params.dueDate,
        dashboardId: params.dashboardId,
      },
    };
  }

  return null;
}

function parseGovernedJson(raw: string): {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  governance?: Record<string, unknown>;
} {
  try {
    return JSON.parse(raw) as {
      success: boolean;
      message: string;
      data?: Record<string, unknown>;
      governance?: Record<string, unknown>;
    };
  } catch {
    return { success: false, message: raw };
  }
}

function toActionResult(
  action: AIAction,
  startTime: number,
  parsed: ReturnType<typeof parseGovernedJson>,
  canonical?: AIActionExecutionResult
): GovernedBridgeActionResult {
  const awaiting = parsed.governance?.status === 'AWAITING_APPROVAL';
  return {
    actionId: action.id,
    success: Boolean(parsed.success) || awaiting,
    result: {
      ...parsed,
      canonical,
    },
    error: parsed.success || awaiting ? undefined : parsed.message,
    metadata: {
      executionTime: Date.now() - startTime,
      module: action.module,
      operation: action.operation,
      affectedUsers: action.affectedUsers || [],
      rollbackAvailable: false,
    },
  };
}

/**
 * Try to run an ActionExecutor action through the canonical governed platform.
 * Returns null when the operation should fall through to legacy executeByModule.
 */
export async function tryExecuteViaGovernedPlatform(
  action: AIAction,
  userContext: UserContext,
  prisma: PrismaClient,
  opts?: { requestId?: string; businessId?: string | null; conversationId?: string | null }
): Promise<GovernedBridgeActionResult | null> {
  const startTime = Date.now();
  const mapped = mapActionExecutorToTwinTool(action);

  if (mapped) {
    // Resolve targetUserId → email for share_file when needed
    if (mapped.tool === 'share_file') {
      const email =
        typeof mapped.args.targetUserEmail === 'string' ? mapped.args.targetUserEmail.trim() : '';
      const targetUserId =
        typeof mapped.args.targetUserId === 'string' ? mapped.args.targetUserId.trim() : '';
      if (!email && targetUserId) {
        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { email: true },
        });
        if (!user?.email) {
          return {
            actionId: action.id,
            success: false,
            error: 'Share target user email could not be resolved',
            metadata: {
              executionTime: Date.now() - startTime,
              module: action.module,
              operation: action.operation,
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false,
            },
          };
        }
        mapped.args.targetUserEmail = user.email;
      }
      delete mapped.args.targetUserId;
    }

    const raw = await executeGovernedTool(mapped.tool, mapped.args, {
      userId: userContext.userId,
      prisma,
      requestId: opts?.requestId,
      conversationId: opts?.conversationId,
      businessId: opts?.businessId,
    });
    const parsed = parseGovernedJson(raw);
    const gov = parsed.governance ?? {};
    const canonical = toCanonicalExecutionResult({
      executionId: typeof gov.executionId === 'string' ? gov.executionId : `ae-${action.id}`,
      actionName: mapped.tool,
      success: Boolean(parsed.success) || gov.status === 'AWAITING_APPROVAL',
      riskCategory: (typeof gov.riskCategory === 'string'
        ? gov.riskCategory
        : 'CONSEQUENTIAL_REVERSIBLE') as AIActionRiskCategory,
      approvalRequired: Boolean(gov.approvalRequired),
      approvalId: typeof gov.approvalId === 'string' ? gov.approvalId : undefined,
      authorized: Boolean(gov.authorized ?? true),
      executed: Boolean(gov.executed),
      idempotentReplay: Boolean(gov.idempotentReplay),
      result: parsed as unknown as Record<string, unknown>,
      error: parsed.success ? undefined : parsed.message,
      status: typeof gov.status === 'string' ? (gov.status as AIActionExecutionResult['status']) : undefined,
      activityId:
        typeof parsed.data?.activityId === 'string' ? parsed.data.activityId : undefined,
    });

    // Best-effort: attach activityId on ledger when domain returned one
    if (canonical.executionId && canonical.activityId && canonical.status === 'COMPLETED') {
      try {
        await prisma.aIActionExecution.update({
          where: { id: canonical.executionId },
          data: { activityId: canonical.activityId },
        });
      } catch {
        // ignore — execution may be synthetic id
      }
    }

    void logger.info('ActionExecutor routed via governed Twin tool', {
      operation: 'ai_action_executor_governed_bridge',
      actionName: mapped.tool,
      userId: userContext.userId,
      executionId: canonical.executionId,
      approvalId: canonical.approvalId,
      status: canonical.status,
    });

    return toActionResult(action, startTime, parsed, canonical);
  }

  if (!isHighRiskActionExecutorOperation(action.operation)) {
    return null;
  }

  // HIGH_RISK without Twin tool: propose on canonical ledger (do not silent-execute)
  return proposeLegacyHighRiskAction(action, userContext, prisma, opts, startTime);
}

async function proposeLegacyHighRiskAction(
  action: AIAction,
  userContext: UserContext,
  prisma: PrismaClient,
  opts: { requestId?: string; businessId?: string | null; conversationId?: string | null } | undefined,
  startTime: number
): Promise<GovernedBridgeActionResult> {
  const risk = getLegacyActionRisk(action.operation);
  const actionName = `ae:${action.module}:${action.operation}`;
  const args = (action.parameters ?? {}) as Record<string, unknown>;

  const begin = await beginOrReplayActionExecution({
    prisma,
    userId: userContext.userId,
    businessId: opts?.businessId,
    actionName,
    args,
    riskCategory: risk.riskCategory,
    requestId: opts?.requestId,
    conversationId: opts?.conversationId,
  });

  if (begin.kind === 'conflict') {
    return {
      actionId: action.id,
      success: false,
      error: begin.message,
      metadata: {
        executionTime: Date.now() - startTime,
        module: action.module,
        operation: action.operation,
        affectedUsers: action.affectedUsers || [],
        rollbackAvailable: false,
      },
    };
  }

  if (begin.kind === 'replay') {
    const payload =
      begin.resultJson && typeof begin.resultJson === 'object'
        ? (begin.resultJson as Record<string, unknown>)
        : { success: false, message: `Prior status: ${begin.status}` };
    return {
      actionId: action.id,
      success: begin.status === 'AWAITING_APPROVAL' || begin.status === 'COMPLETED',
      result: payload,
      error: begin.status === 'FAILED' ? begin.errorMessage ?? undefined : undefined,
      metadata: {
        executionTime: Date.now() - startTime,
        module: action.module,
        operation: action.operation,
        affectedUsers: action.affectedUsers || [],
        rollbackAvailable: false,
      },
    };
  }

  const executionId = begin.executionId;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const actionData: LegacyActionData = {
    source: ACTION_EXECUTOR_GOVERNED_SOURCE,
    module: action.module,
    operation: action.operation,
    parameters: args,
    executionId,
    requestId: opts?.requestId ?? null,
    businessId: opts?.businessId ?? null,
    riskCategory: risk.riskCategory,
  };

  const approval = await prisma.aIApprovalRequest.create({
    data: {
      userId: userContext.userId,
      requestType: actionName,
      actionData: actionData as unknown as Prisma.InputJsonValue,
      affectedUsers: action.affectedUsers || [],
      reasoning:
        action.reasoning ||
        `Phase 2: ActionExecutor ${action.operation} (${risk.riskCategory}) requires approval.`,
      status: 'PENDING',
      expiresAt,
    },
  });

  const payload = {
    success: false,
    message: `This action requires your approval before it can run (${action.operation}).`,
    governance: {
      status: 'AWAITING_APPROVAL',
      executionId,
      approvalId: approval.id,
      approvalRequired: true,
      riskCategory: risk.riskCategory,
      authorized: true,
      executed: false,
    },
    data: { approvalId: approval.id, source: ACTION_EXECUTOR_GOVERNED_SOURCE, operation: action.operation },
  };

  await markAwaitingApproval({
    prisma,
    executionId,
    approvalId: approval.id,
    result: payload,
  });

  const canonical = toCanonicalExecutionResult({
    executionId,
    actionName,
    success: false,
    riskCategory: risk.riskCategory,
    approvalRequired: true,
    approvalId: approval.id,
    authorized: true,
    executed: false,
    status: 'AWAITING_APPROVAL',
    result: payload,
  });

  void logger.info('ActionExecutor HIGH_RISK proposed on governed ledger', {
    operation: 'ai_action_executor_legacy_propose',
    actionName,
    userId: userContext.userId,
    executionId,
    approvalId: approval.id,
    riskCategory: risk.riskCategory,
  });

  return {
    actionId: action.id,
    success: true,
    result: { ...payload, canonical },
    metadata: {
      executionTime: Date.now() - startTime,
      module: action.module,
      operation: action.operation,
      affectedUsers: action.affectedUsers || [],
      rollbackAvailable: false,
    },
  };
}

/**
 * Execute a legacy ActionExecutor HIGH_RISK mutation after approval (domain services only).
 */
export async function executeLegacyDomainAction(input: {
  prisma: PrismaClient;
  userId: string;
  operation: string;
  module: string;
  parameters: Record<string, unknown>;
}): Promise<{ success: boolean; message: string; data?: Record<string, unknown>; activityId?: string }> {
  const params = input.parameters;

  switch (input.operation) {
    case 'delete_file': {
      const { aiDeleteFile } = await import('../../services/driveAIActionService');
      const fileId = params.fileId != null ? String(params.fileId) : '';
      if (!fileId) return { success: false, message: 'fileId is required' };
      const outcome = await aiDeleteFile({ userId: input.userId, fileId });
      return {
        success: outcome.success,
        message: outcome.success ? 'File deleted' : outcome.error,
        data: outcome.success ? (outcome.data as Record<string, unknown> | undefined) : undefined,
        activityId:
          outcome.success &&
          outcome.data &&
          typeof outcome.data === 'object' &&
          'activityId' in outcome.data
            ? String((outcome.data as { activityId?: string }).activityId)
            : undefined,
      };
    }
    case 'send_message': {
      const { aiSendMessage } = await import('../../services/chatAIActionService');
      const conversationId = params.conversationId != null ? String(params.conversationId) : '';
      const content = params.content != null ? String(params.content) : '';
      if (!conversationId || !content) {
        return { success: false, message: 'conversationId and content are required' };
      }
      const outcome = await aiSendMessage({
        userId: input.userId,
        conversationId,
        content,
      });
      return {
        success: outcome.success,
        message: outcome.success ? 'Message sent' : outcome.error,
        data: outcome.success ? (outcome.data as Record<string, unknown> | undefined) : undefined,
      };
    }
    case 'delete_event': {
      const { aiDeleteEvent } = await import('../../services/calendarAIActionService');
      const eventId = params.eventId != null ? String(params.eventId) : '';
      if (!eventId) return { success: false, message: 'eventId is required' };
      const outcome = await aiDeleteEvent({ userId: input.userId, eventId });
      return {
        success: outcome.success,
        message: outcome.success ? 'Event deleted' : outcome.error,
        data: outcome.success ? (outcome.data as Record<string, unknown> | undefined) : undefined,
      };
    }
    case 'share_file': {
      // Prefer Twin tool path; keep for completeness if legacy payload arrives
      const { aiShareFile } = await import('../../services/driveAIActionService');
      const fileId = params.fileId != null ? String(params.fileId) : '';
      const targetUserId = params.userId != null ? String(params.userId) : '';
      if (!fileId || !targetUserId) {
        return { success: false, message: 'fileId and userId are required' };
      }
      const outcome = await aiShareFile({
        ownerUserId: input.userId,
        fileId,
        targetUserId,
        canRead: params.canRead !== undefined ? Boolean(params.canRead) : true,
        canWrite: params.canWrite !== undefined ? Boolean(params.canWrite) : false,
      });
      return {
        success: outcome.success,
        message: outcome.success ? 'File shared' : outcome.error,
        data: outcome.success ? (outcome.data as Record<string, unknown> | undefined) : undefined,
      };
    }
    default:
      return {
        success: false,
        message: `Legacy approved execution not yet implemented for operation: ${input.operation}`,
      };
  }
}

export async function completeLegacyApprovedExecution(input: {
  prisma: PrismaClient;
  executionId: string;
  approvalId: string;
  userId: string;
  actionData: LegacyActionData;
}): Promise<{ success: boolean; body: Record<string, unknown> }> {
  const domain = await executeLegacyDomainAction({
    prisma: input.prisma,
    userId: input.userId,
    operation: input.actionData.operation,
    module: input.actionData.module,
    parameters: input.actionData.parameters,
  });

  const result = {
    success: domain.success,
    message: domain.message,
    data: domain.data,
    governance: {
      status: domain.success ? 'COMPLETED' : 'FAILED',
      executionId: input.executionId,
      approvalId: input.approvalId,
      executed: domain.success,
      riskCategory: input.actionData.riskCategory,
    },
  };

  await completeActionExecution({
    prisma: input.prisma,
    executionId: input.executionId,
    status: domain.success ? 'COMPLETED' : 'FAILED',
    executed: domain.success,
    result,
    errorMessage: domain.success ? undefined : domain.message,
    activityId: domain.activityId,
  });

  return { success: domain.success, body: result };
}
