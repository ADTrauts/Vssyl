/**
 * Dashboard Activity Feed API
 * GET /api/activity-feed
 * Aggregates recent activity from Drive, Chat, Calendar, and Todo for the authenticated user.
 */

import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

function getUserId(req: Request): string | null {
  const user = req.user as { id?: string; sub?: string } | undefined;
  return user?.id ?? user?.sub ?? null;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  action: string;
  description: string;
  module: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  metadata?: Record<string, unknown>;
}

const ACTION_MAP: Record<string, string> = {
  create: 'create',
  edit: 'edit',
  delete: 'delete',
  share: 'share',
  download: 'download',
};

export async function getActivityFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10) || 20, 50);
    const dashboardId = typeof req.query.dashboardId === 'string' ? req.query.dashboardId : null;

    let scopedDashboard: {
      id: string;
      businessId: string | null;
      householdId: string | null;
      institutionId: string | null;
    } | null = null;
    if (dashboardId) {
      const d = await prisma.dashboard.findFirst({
        where: { id: dashboardId, userId },
        select: {
          id: true,
          businessId: true,
          householdId: true,
          institutionId: true,
        },
      });
      if (!d) {
        res.status(404).json({ error: 'Dashboard not found' });
        return;
      }
      scopedDashboard = d;
    }

    const perSource = Math.ceil(limit / 5);

    const activityWhere: Prisma.ActivityWhereInput = scopedDashboard
      ? { userId, file: { dashboardId: scopedDashboard.id } }
      : { userId };

    const messageWhere: Prisma.MessageWhereInput = scopedDashboard
      ? { senderId: userId, deletedAt: null, conversation: { dashboardId: scopedDashboard.id } }
      : { senderId: userId, deletedAt: null };

    const taskWhere: Prisma.TaskWhereInput = scopedDashboard
      ? {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          trashedAt: null,
          dashboardId: scopedDashboard.id,
        }
      : {
          OR: [{ createdById: userId }, { assignedToId: userId }],
          trashedAt: null,
        };

    const eventWhere: Prisma.EventWhereInput = scopedDashboard
      ? {
          trashedAt: null,
          calendar: {
            is: {
              ...(scopedDashboard.businessId != null
                ? { contextType: 'BUSINESS' as const, contextId: scopedDashboard.businessId }
                : scopedDashboard.householdId != null
                  ? { contextType: 'HOUSEHOLD' as const, contextId: scopedDashboard.householdId }
                  : scopedDashboard.institutionId != null
                    ? { contextType: 'BUSINESS' as const, contextId: scopedDashboard.institutionId }
                    : { contextType: 'PERSONAL' as const, contextId: userId }),
              members: { some: { userId } },
            },
          },
        }
      : {
          calendar: {
            members: {
              some: { userId },
            },
          },
          trashedAt: null,
        };

    const [driveActivities, chatMessages, calendarEvents, todoTasks, normalizedEvents] = await Promise.all([
      prisma.activity.findMany({
        where: activityWhere,
        include: {
          file: { select: { name: true, id: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: perSource,
      }),

      prisma.message.findMany({
        where: messageWhere,
        include: {
          conversation: { select: { name: true, id: true } },
          sender: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: perSource,
      }),

      prisma.event.findMany({
        where: eventWhere,
        include: {
          calendar: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: perSource,
      }),

      prisma.task.findMany({
        where: taskWhere,
        include: {
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
      }),
      prisma.log.findMany({
        where: {
          userId,
          operation: 'module_activity_event',
          module: { in: ['drive', 'chat'] },
        },
        orderBy: { timestamp: 'desc' },
        take: perSource,
        select: {
          id: true,
          timestamp: true,
          module: true,
          metadata: true,
        },
      }),
    ]);

    const items: ActivityFeedItem[] = [];

    for (const a of driveActivities) {
      const action = ACTION_MAP[a.type] || a.type;
      items.push({
        id: a.id,
        type: 'file',
        action,
        description: `${action === 'create' ? 'Created' : action === 'edit' ? 'Edited' : action === 'delete' ? 'Deleted' : action} ${a.file?.name ?? 'file'}`,
        module: 'drive',
        createdAt: a.timestamp.toISOString(),
        user: a.user ? { name: a.user.name ?? undefined, email: a.user.email ?? undefined } : undefined,
        metadata: { fileId: a.fileId, fileName: a.file?.name },
      });
    }

    for (const m of chatMessages) {
      const convName = m.conversation?.name || 'Conversation';
      const preview = m.content.slice(0, 60) + (m.content.length > 60 ? '…' : '');
      items.push({
        id: m.id,
        type: 'message',
        action: 'message',
        description: `Message in ${convName}: ${preview}`,
        module: 'chat',
        createdAt: m.createdAt.toISOString(),
        user: m.sender ? { name: m.sender.name ?? undefined, email: m.sender.email ?? undefined } : undefined,
        metadata: { conversationId: m.conversationId },
      });
    }

    for (const e of calendarEvents) {
      items.push({
        id: e.id,
        type: 'event',
        action: 'create',
        description: `Event: ${e.title}${e.calendar?.name ? ` (${e.calendar.name})` : ''}`,
        module: 'calendar',
        createdAt: e.createdAt.toISOString(),
        metadata: { eventId: e.id, startAt: e.startAt.toISOString() },
      });
    }

    for (const t of todoTasks) {
      const verb = t.status === 'DONE' ? 'Completed' : t.updatedAt > t.createdAt ? 'Updated' : 'Created';
      items.push({
        id: t.id,
        type: 'task',
        action: t.status === 'DONE' ? 'complete' : 'create',
        description: `${verb}: ${t.title}`,
        module: 'todo',
        createdAt: (t.completedAt ?? t.updatedAt).toISOString(),
        user: t.createdBy ? { name: t.createdBy.name ?? undefined, email: t.createdBy.email ?? undefined } : undefined,
        metadata: { taskId: t.id, status: t.status },
      });
    }

    for (const e of normalizedEvents) {
      const event = (e.metadata ?? {}) as Record<string, unknown>;
      const target = ((event.target as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
      const context = ((event.context as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
      const action = typeof event.action === 'string' ? event.action : 'update';
      const moduleId = typeof context.moduleId === 'string' ? context.moduleId : (e.module || 'system');
      const targetType = typeof target.type === 'string' ? target.type : 'item';
      const targetId = typeof target.id === 'string' ? target.id : undefined;

      items.push({
        id: `evt-${e.id}`,
        type: targetType,
        action,
        description: `${action} ${targetType}`,
        module: moduleId,
        createdAt: e.timestamp.toISOString(),
        metadata: {
          source: 'normalized_event',
          targetId,
        },
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const activities = items.slice(0, limit);

    res.json({ activities });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error('Activity feed failed', {
      operation: 'activity_feed',
      error: { message: error.message, stack: error.stack },
    });
    res.status(500).json({ error: 'Failed to load activity feed' });
  }
}
