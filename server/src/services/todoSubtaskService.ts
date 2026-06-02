import type { TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { taskWithUsersInclude } from './todo/todoIncludes';
import { assertCanWriteTask } from './todoPermissionService';

async function assertParentTaskAccess(parentTaskId: string, userId: string) {
  const parent = await assertCanWriteTask(parentTaskId, userId);
  return parent;
}

async function getSubtaskForParent(
  parentTaskId: string,
  subtaskId: string,
  userId: string
) {
  const subtask = await prisma.task.findFirst({
    where: {
      id: subtaskId,
      parentTaskId,
      trashedAt: null,
    },
    include: {
      parentTask: {
        select: { id: true, createdById: true, assignedToId: true },
      },
    },
  });

  if (!subtask || !subtask.parentTask) {
    throw new TodoServiceError('Subtask not found', 'not_found', 404);
  }

  const hasAccess =
    subtask.parentTask.createdById === userId ||
    subtask.parentTask.assignedToId === userId;
  if (!hasAccess) {
    throw new TodoServiceError('Access denied', 'forbidden', 403);
  }

  return subtask;
}

export async function createSubtask(params: {
  userId: string;
  parentTaskId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
}) {
  const title = params.title?.trim();
  if (!title) {
    throw new TodoServiceError('Subtask title is required', 'invalid', 400);
  }

  const parentTask = await assertParentTaskAccess(params.parentTaskId, params.userId);

  const subtask = await prisma.task.create({
    data: {
      title,
      description: params.description?.trim() || null,
      priority: params.priority || 'MEDIUM',
      status: 'TODO',
      dashboardId: parentTask.dashboardId,
      businessId: parentTask.businessId,
      householdId: parentTask.householdId,
      createdById: params.userId,
      assignedToId: parentTask.assignedToId,
      parentTaskId: params.parentTaskId,
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
    },
    include: taskWithUsersInclude,
  });

  await logger.info('Subtask created', {
    operation: 'todo_create_subtask',
    parentTaskId: params.parentTaskId,
    subtaskId: subtask.id,
    userId: params.userId,
  });

  return subtask;
}

export async function updateSubtask(params: {
  userId: string;
  parentTaskId: string;
  subtaskId: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | Date | null;
}) {
  const subtask = await getSubtaskForParent(
    params.parentTaskId,
    params.subtaskId,
    params.userId
  );

  const data: Record<string, unknown> = {};
  if (params.title !== undefined) {
    const title = params.title.trim();
    if (!title) {
      throw new TodoServiceError('Subtask title cannot be empty', 'invalid', 400);
    }
    data.title = title;
  }
  if (params.description !== undefined) {
    data.description = params.description?.trim() || null;
  }
  if (params.priority !== undefined) {
    data.priority = params.priority;
  }
  if (params.status !== undefined) {
    data.status = params.status;
    if (params.status === 'DONE') {
      data.completedAt = new Date();
    } else if (subtask.status === 'DONE') {
      data.completedAt = null;
    }
  }
  if (params.dueDate !== undefined) {
    data.dueDate = params.dueDate ? new Date(params.dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: params.subtaskId },
    data,
    include: taskWithUsersInclude,
  });

  await logger.info('Subtask updated', {
    operation: 'todo_update_subtask',
    parentTaskId: params.parentTaskId,
    subtaskId: params.subtaskId,
    userId: params.userId,
  });

  return updated;
}

export async function deleteSubtask(params: {
  userId: string;
  parentTaskId: string;
  subtaskId: string;
}) {
  await getSubtaskForParent(params.parentTaskId, params.subtaskId, params.userId);

  await prisma.task.update({
    where: { id: params.subtaskId },
    data: { trashedAt: new Date() },
  });

  await logger.info('Subtask deleted', {
    operation: 'todo_delete_subtask',
    parentTaskId: params.parentTaskId,
    subtaskId: params.subtaskId,
    userId: params.userId,
  });

  return { success: true as const };
}

export async function completeSubtask(params: {
  userId: string;
  parentTaskId: string;
  subtaskId: string;
}) {
  await getSubtaskForParent(params.parentTaskId, params.subtaskId, params.userId);

  const updated = await prisma.task.update({
    where: { id: params.subtaskId },
    data: {
      status: 'DONE',
      completedAt: new Date(),
    },
    include: taskWithUsersInclude,
  });

  await logger.info('Subtask completed', {
    operation: 'todo_complete_subtask',
    parentTaskId: params.parentTaskId,
    subtaskId: params.subtaskId,
    userId: params.userId,
  });

  return updated;
}
