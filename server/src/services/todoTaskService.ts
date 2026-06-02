import type { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { TodoServiceError } from './todo/todoErrors';
import { taskWithUsersInclude } from './todo/todoIncludes';
import type { CreateTaskInput, UpdateTaskInput, UpdateTaskResult } from './todo/todoTypes';
import { toTodoTaskSnapshot, type TodoTaskSnapshot } from './todo/todoSideEffectTypes';
import {
  assertCanCompleteTask,
  assertCanReopenTask,
  assertCanWriteTask,
  assertDashboardContextForTaskCreate,
  assertProjectOnDashboard,
} from './todoPermissionService';
import { evaluateTodoPolicyDual } from './todoPolicyDual';
import * as todoActivity from './todoActivityService';
import * as todoDomain from './todoDomainEventService';
import * as todoNotification from './todoNotificationService';
import * as todoRealtime from './todoRealtimeService';
import { softTrashTask as softTrashTaskViaTrashService } from './todoTrashService';

function parseOptionalDate(value: string | Date | null | undefined): Date | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

async function assertTodoPolicyNotBlocked(params: {
  userId: string;
  action: Parameters<typeof evaluateTodoPolicyDual>[0]['action'];
  resourceId: string;
  scope?: { dashboardId?: string; businessId?: string; householdId?: string };
}): Promise<void> {
  const policyBlock = await evaluateTodoPolicyDual({
    userId: params.userId,
    action: params.action,
    resourceType: 'task',
    resourceId: params.resourceId,
    scope: params.scope,
  });
  if (policyBlock.blocked) {
    const message =
      params.action === POLICY_ACTIONS.TODO_TASK_CREATE
        ? 'Not authorized to create task'
        : params.action === POLICY_ACTIONS.TODO_TASK_DELETE
          ? 'Not authorized to delete task'
          : 'Not authorized';
    throw new TodoServiceError(message, 'forbidden', 403);
  }
}

async function emitAssignmentSideEffects(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
  previousAssigneeId: string | null;
  newAssigneeId: string | null;
}): Promise<void> {
  const { actorUserId, task, previousAssigneeId, newAssigneeId } = params;
  if (previousAssigneeId === newAssigneeId) return;

  if (newAssigneeId) {
    await todoActivity.recordTaskAssigned({
      actorUserId,
      task,
      assigneeUserId: newAssigneeId,
    });
    todoDomain.recordTaskAssignedDomainEvent({
      actorUserId,
      task,
      assigneeUserId: newAssigneeId,
    });
    await todoNotification.notifyTaskAssigned({
      actorUserId,
      taskId: task.id,
      taskTitle: task.title,
      dashboardId: task.dashboardId,
      assigneeUserId: newAssigneeId,
    });
    todoRealtime.broadcastTaskAssigned(task, newAssigneeId);
  } else if (previousAssigneeId) {
    await todoActivity.recordTaskUnassigned({ actorUserId, task });
    todoDomain.recordTaskUnassignedDomainEvent({ actorUserId, task });
    todoRealtime.broadcastTaskUnassigned(task);
  }
}

async function afterTaskCreated(actorUserId: string, task: TodoTaskSnapshot): Promise<void> {
  await todoActivity.recordTaskCreated({ actorUserId, task });
  todoDomain.recordTaskCreatedDomainEvent({ actorUserId, task });
  todoRealtime.broadcastTaskCreated(task);
  if (task.assignedToId) {
    await emitAssignmentSideEffects({
      actorUserId,
      task,
      previousAssigneeId: null,
      newAssigneeId: task.assignedToId,
    });
  }
}

async function afterTaskUpdated(
  actorUserId: string,
  task: TodoTaskSnapshot,
  previousAssigneeId: string | null
): Promise<void> {
  await todoActivity.recordTaskUpdated({ actorUserId, task });
  todoDomain.recordTaskUpdatedDomainEvent({ actorUserId, task });
  todoRealtime.broadcastTaskUpdated(task);
  await emitAssignmentSideEffects({
    actorUserId,
    task,
    previousAssigneeId,
    newAssigneeId: task.assignedToId ?? null,
  });
}

async function afterTaskCompleted(actorUserId: string, task: TodoTaskSnapshot): Promise<void> {
  await todoActivity.recordTaskCompleted({ actorUserId, task });
  todoDomain.recordTaskCompletedDomainEvent({ actorUserId, task });
  todoRealtime.broadcastTaskCompleted(task);
}

async function afterTaskReopened(actorUserId: string, task: TodoTaskSnapshot): Promise<void> {
  await todoActivity.recordTaskReopened({ actorUserId, task });
  todoDomain.recordTaskReopenedDomainEvent({ actorUserId, task });
  todoRealtime.broadcastTaskReopened(task);
}

export async function createTask(input: CreateTaskInput) {
  const {
    userId,
    title,
    description,
    status,
    priority,
    dashboardId,
    businessId,
    householdId,
    dueDate,
    startDate,
    category,
    tags,
    timeEstimate,
    assignedToId,
    parentTaskId,
    projectId,
    recurrenceRule,
    recurrenceEndAt,
  } = input;

  await assertDashboardContextForTaskCreate(
    userId,
    dashboardId,
    businessId,
    householdId
  );

  if (projectId) {
    await assertProjectOnDashboard(projectId, dashboardId, businessId);
  }

  await assertTodoPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_CREATE,
    resourceId: 'new',
    scope: {
      dashboardId,
      businessId: businessId || undefined,
      householdId: householdId || undefined,
    },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dashboardId,
      businessId: businessId || null,
      householdId: householdId || null,
      createdById: userId,
      assignedToId: assignedToId || null,
      dueDate: parseOptionalDate(dueDate),
      startDate: parseOptionalDate(startDate),
      category: category || null,
      tags: tags || [],
      timeEstimate: timeEstimate || null,
      parentTaskId: parentTaskId || null,
      projectId: projectId || null,
      recurrenceRule: recurrenceRule || null,
      recurrenceEndAt: parseOptionalDate(recurrenceEndAt),
    },
    include: taskWithUsersInclude,
  });

  await logger.info('Task created', {
    operation: 'todo_create_task',
    taskId: task.id,
    userId,
  });

  await afterTaskCreated(userId, toTodoTaskSnapshot(task));

  return task;
}

export async function updateTask(input: UpdateTaskInput): Promise<UpdateTaskResult> {
  const { userId, taskId } = input;

  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      trashedAt: null,
      OR: [{ createdById: userId }, { assignedToId: userId }],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      startDate: true,
      recurrenceRule: true,
      recurrenceEndAt: true,
      parentRecurringTaskId: true,
      category: true,
      tags: true,
      timeEstimate: true,
      assignedToId: true,
      snoozedUntil: true,
      completedAt: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
      createdById: true,
    },
  });

  if (!existingTask) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }

  const previousAssigneeId = existingTask.assignedToId;
  const assignChanging =
    input.assignedToId !== undefined && input.assignedToId !== existingTask.assignedToId;

  await assertTodoPolicyNotBlocked({
    userId,
    action: assignChanging
      ? POLICY_ACTIONS.TODO_TASK_ASSIGN
      : POLICY_ACTIONS.TODO_TASK_UPDATE,
    resourceId: taskId,
    scope: {
      dashboardId: existingTask.dashboardId,
      businessId: existingTask.businessId ?? undefined,
      householdId: existingTask.householdId ?? undefined,
    },
  });

  const isParentRecurringTask =
    !!existingTask.recurrenceRule && !existingTask.parentRecurringTaskId;
  const isInstance = !!existingTask.parentRecurringTaskId;

  const updateData: Prisma.TaskUpdateInput = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.category !== undefined) updateData.category = input.category || null;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.timeEstimate !== undefined) updateData.timeEstimate = input.timeEstimate || null;
  if (input.assignedToId !== undefined) {
    updateData.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }
  if (input.dueDate !== undefined) {
    updateData.dueDate = parseOptionalDate(input.dueDate);
  }
  if (input.startDate !== undefined) {
    updateData.startDate = parseOptionalDate(input.startDate);
  }
  if (input.snoozedUntil !== undefined) {
    updateData.snoozedUntil = parseOptionalDate(input.snoozedUntil);
  }
  if (input.recurrenceRule !== undefined) {
    updateData.recurrenceRule = input.recurrenceRule || null;
  }
  if (input.recurrenceEndAt !== undefined) {
    updateData.recurrenceEndAt = parseOptionalDate(input.recurrenceEndAt);
  }

  if (input.status === 'DONE' && existingTask.status !== 'DONE') {
    updateData.completedAt = new Date();
  } else if (input.status !== undefined && input.status !== 'DONE' && existingTask.status === 'DONE') {
    updateData.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: taskWithUsersInclude,
  });

  await logger.info('Task updated', {
    operation: 'todo_update_task',
    taskId: task.id,
    userId,
  });

  await afterTaskUpdated(userId, toTodoTaskSnapshot(task), previousAssigneeId);

  return {
    task,
    existingTask,
    isParentRecurringTask,
    isInstance,
  };
}

export async function completeTask(userId: string, taskId: string) {
  await assertCanCompleteTask(taskId, userId);
  const existing = await prisma.task.findFirst({
    where: { id: taskId, trashedAt: null },
    select: {
      dashboardId: true,
      businessId: true,
      householdId: true,
      title: true,
      createdById: true,
      assignedToId: true,
    },
  });
  if (!existing) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }

  await assertTodoPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_COMPLETE,
    resourceId: taskId,
    scope: {
      dashboardId: existing.dashboardId,
      businessId: existing.businessId ?? undefined,
      householdId: existing.householdId ?? undefined,
    },
  });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'DONE',
      completedAt: new Date(),
    },
    include: taskWithUsersInclude,
  });

  await afterTaskCompleted(userId, toTodoTaskSnapshot(task));

  return task;
}

export async function reopenTask(userId: string, taskId: string, status?: TaskStatus) {
  await assertCanReopenTask(taskId, userId);
  const existing = await prisma.task.findFirst({
    where: { id: taskId, trashedAt: null },
    select: {
      dashboardId: true,
      businessId: true,
      householdId: true,
    },
  });
  if (!existing) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }

  await assertTodoPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_REOPEN,
    resourceId: taskId,
    scope: {
      dashboardId: existing.dashboardId,
      businessId: existing.businessId ?? undefined,
      householdId: existing.householdId ?? undefined,
    },
  });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: status || 'TODO',
      completedAt: null,
    },
    include: taskWithUsersInclude,
  });

  await afterTaskReopened(userId, toTodoTaskSnapshot(task));

  return task;
}

export async function softTrashTask(userId: string, taskId: string) {
  return softTrashTaskViaTrashService(userId, taskId);
}
