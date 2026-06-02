import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';

/**
 * Expected manifest types (finalize in manifest Phase 2+):
 * - `todo_assigned` — assignee notified when task is assigned
 * Deferred (no runtime today): `todo_due`, `todo_completed`, `todo_updated`
 */

/** Notify assignee when a task is assigned (runtime-backed; only type wired in 1D). */
export async function notifyTaskAssigned(params: {
  actorUserId: string;
  taskId: string;
  taskTitle: string;
  dashboardId: string;
  assigneeUserId: string;
}): Promise<void> {
  const { actorUserId, taskId, taskTitle, dashboardId, assigneeUserId } = params;
  if (!assigneeUserId || assigneeUserId === actorUserId) return;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { name: true },
    });
    const actorName = actor?.name ?? 'Someone';

    await NotificationService.createNotification({
      userId: assigneeUserId,
      type: 'todo_assigned',
      title: 'Task assigned to you',
      body: `${actorName} assigned you "${taskTitle}"`,
      data: {
        taskId,
        dashboardId,
        moduleId: 'todo',
        actorUserId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to deliver todo assignment notification', {
      operation: 'todo_notification_assigned',
      taskId,
      error: { message: err.message, stack: err.stack },
    });
  }
}
