import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { Prisma } from '@prisma/client';
import { getChatSocketService } from './chatSocketService';

export type ActivityScope = 'personal' | 'business' | 'household' | 'direct-share';

export interface ModuleActivityEventInput {
  actorUserId: string;
  actorRole?: string;
  moduleId: string;
  action: string;
  targetType: string;
  targetId: string;
  parentType?: string;
  parentId?: string;
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
  visibilityScope?: ActivityScope;
  metadata?: Record<string, unknown>;
}

function buildScope(input: ModuleActivityEventInput): ActivityScope {
  if (input.visibilityScope) return input.visibilityScope;
  if (input.businessId) return 'business';
  if (input.householdId) return 'household';
  return 'personal';
}

export async function emitModuleActivityEvent(input: ModuleActivityEventInput): Promise<void> {
  const safeMetadata = JSON.parse(JSON.stringify(input.metadata ?? {})) as Prisma.InputJsonValue;
  const event = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    actor: {
      userId: input.actorUserId,
      role: input.actorRole,
    },
    action: input.action,
    target: {
      type: input.targetType,
      id: input.targetId,
    },
    parent: input.parentType && input.parentId
      ? { type: input.parentType, id: input.parentId }
      : undefined,
    context: {
      dashboardId: input.dashboardId ?? undefined,
      businessId: input.businessId ?? undefined,
      householdId: input.householdId ?? undefined,
      moduleId: input.moduleId,
    },
    visibility: {
      scope: buildScope(input),
    },
    metadata: safeMetadata,
  };

  try {
    await prisma.log.create({
      data: {
        level: 'info',
        service: 'vssyl_server',
        operation: 'module_activity_event',
        message: `${input.moduleId}:${input.action}:${input.targetType}`,
        userId: input.actorUserId,
        businessId: input.businessId ?? null,
        module: input.moduleId,
        metadata: event as Prisma.InputJsonValue,
      },
    });

    try {
      getChatSocketService().broadcastToUser(input.actorUserId, 'activity:feed:refresh', {
        moduleId: input.moduleId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        dashboardId: input.dashboardId ?? undefined,
        businessId: input.businessId ?? undefined,
      });
    } catch (socketError: unknown) {
      const err = socketError as Error;
      await logger.warn('activity:feed:refresh broadcast failed', {
        operation: 'emit_module_activity_event_socket',
        error: { message: err.message, stack: err.stack },
        context: { userId: input.actorUserId, moduleId: input.moduleId },
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to persist module activity event', {
      operation: 'emit_module_activity_event',
      error: { message: err.message, stack: err.stack },
      context: {
        moduleId: input.moduleId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });
  }
}

