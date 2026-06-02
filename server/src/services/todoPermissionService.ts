import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { assertUserOwnedTaskDashboardContext } from './taskDashboardBinding';
import { TodoServiceError } from './todo/todoErrors';

/** Legacy task access: creator or assignee, not trashed. */
export function buildTaskLegacyAccessWhere(
  userId: string,
  taskId?: string
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    trashedAt: null,
    OR: [{ createdById: userId }, { assignedToId: userId }],
  };
  if (taskId) {
    where.id = taskId;
  }
  return where;
}

export function userOwnsTask(task: { createdById: string }, userId: string): boolean {
  return task.createdById === userId;
}

export function userIsAssignee(
  task: { assignedToId: string | null },
  userId: string
): boolean {
  return task.assignedToId === userId;
}

export function userCanAccessTaskLegacy(
  task: { createdById: string; assignedToId: string | null; trashedAt?: Date | null },
  userId: string
): boolean {
  if (task.trashedAt) {
    return false;
  }
  return userOwnsTask(task, userId) || userIsAssignee(task, userId);
}

export async function findReadableTask(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: buildTaskLegacyAccessWhere(userId, taskId),
  });
}

export async function findWritableTask(taskId: string, userId: string) {
  return findReadableTask(taskId, userId);
}

export async function assertCanReadTask(taskId: string, userId: string) {
  const task = await findReadableTask(taskId, userId);
  if (!task) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }
  return task;
}

export async function assertCanWriteTask(taskId: string, userId: string) {
  return assertCanReadTask(taskId, userId);
}

export async function assertCanCompleteTask(taskId: string, userId: string) {
  return assertCanWriteTask(taskId, userId);
}

export async function assertCanReopenTask(taskId: string, userId: string) {
  return assertCanWriteTask(taskId, userId);
}

export async function assertCanTrashTask(taskId: string, userId: string) {
  return assertCanWriteTask(taskId, userId);
}

/**
 * Dashboard ownership + business/household alignment for task creates.
 * Fail closed on mismatch (matches legacy controller semantics).
 */
export async function assertDashboardContextForTaskCreate(
  userId: string,
  dashboardId: string,
  businessId: string | null | undefined,
  householdId: string | null | undefined
): Promise<void> {
  try {
    await assertUserOwnedTaskDashboardContext(
      prisma,
      userId,
      dashboardId,
      businessId,
      householdId
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Task dashboard not found') {
      throw new TodoServiceError('Dashboard not found', 'not_found', 404);
    }
    if (msg === 'Task dashboard context mismatch') {
      throw new TodoServiceError(
        'Dashboard does not match business or household context',
        'invalid',
        400
      );
    }
    throw error;
  }
}

/**
 * When a task belongs to a project, verify the project exists on the same dashboard
 * the user already passed create/update context for (conservative; does not broaden read ACL).
 */
export async function assertProjectOnDashboard(
  projectId: string,
  dashboardId: string,
  businessId: string | null | undefined
): Promise<void> {
  const project = await prisma.taskProject.findFirst({
    where: {
      id: projectId,
      dashboardId,
      businessId: businessId ?? null,
    },
    select: { id: true },
  });
  if (!project) {
    throw new TodoServiceError('Project not found', 'not_found', 404);
  }
}
