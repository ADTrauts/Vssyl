import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { TodoServiceError } from './todo/todoErrors';
import { toTodoTaskSnapshot } from './todo/todoSideEffectTypes';
import { assertCanTrashTask } from './todoPermissionService';
import { evaluateTodoPolicyDual } from './todoPolicyDual';
import { filterTasksByReadPolicy } from './todoVisibilityService';
import * as todoActivity from './todoActivityService';
import * as todoDomain from './todoDomainEventService';
import * as todoRealtime from './todoRealtimeService';
import { unlinkTodoTaskFromAllVLinks } from './todoVlinkLifecycleService';

export class TodoTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'TodoTrashError';
  }
}

export type TodoTrashItemType = 'task';

export interface TodoTrashMutationInput {
  userId: string;
  type: TodoTrashItemType;
  id: string;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: 'task';
  moduleId: 'todo';
  moduleName: 'Todo';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

function mapTodoServiceError(error: unknown): never {
  if (error instanceof TodoServiceError) {
    if (error.code === 'forbidden') {
      throw new TodoTrashError('Forbidden', 'forbidden');
    }
    if (error.code === 'not_found') {
      throw new TodoTrashError('Not found', 'not_found');
    }
  }
  throw error;
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
    throw new TodoTrashError('Forbidden', 'forbidden');
  }
}

async function findTrashedTaskForMutation(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      trashedAt: { not: null },
      OR: [{ createdById: userId }, { assignedToId: userId }],
    },
  });
}

export async function softTrashTask(userId: string, taskId: string) {
  let task;
  try {
    task = await assertCanTrashTask(taskId, userId);
  } catch (error: unknown) {
    mapTodoServiceError(error);
  }

  await assertTodoPolicyNotBlocked({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_DELETE,
    resourceId: taskId,
    scope: {
      dashboardId: task.dashboardId,
      businessId: task.businessId ?? undefined,
      householdId: task.householdId ?? undefined,
    },
  });

  const updated = await prisma.task.updateMany({
    where: { id: taskId, trashedAt: null },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new TodoTrashError('Task not found or already trashed', 'not_found');
  }

  await logger.info('Task deleted', {
    operation: 'todo_delete_task',
    taskId,
    userId,
  });

  const snapshot = toTodoTaskSnapshot(task);

  await todoActivity.recordTaskTrashed({ actorUserId: userId, task: snapshot });
  todoDomain.recordTaskTrashedDomainEvent({ actorUserId: userId, task: snapshot });
  todoRealtime.broadcastTaskTrashed(snapshot);

  return { success: true as const };
}

export async function restoreTask(params: { userId: string; taskId: string }): Promise<boolean> {
  const task = await findTrashedTaskForMutation(params.taskId, params.userId);
  if (!task) {
    return false;
  }

  await assertTodoPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.TODO_TASK_UPDATE,
    resourceId: params.taskId,
    scope: {
      dashboardId: task.dashboardId,
      businessId: task.businessId ?? undefined,
      householdId: task.householdId ?? undefined,
    },
  });

  const updated = await prisma.task.updateMany({
    where: { id: params.taskId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  const snapshot = toTodoTaskSnapshot(task);

  await todoActivity.recordTaskRestored({ actorUserId: params.userId, task: snapshot });
  todoDomain.recordTaskRestoredDomainEvent({ actorUserId: params.userId, task: snapshot });
  todoRealtime.broadcastTaskUpdated(snapshot);

  return true;
}

export async function permanentlyDeleteTask(params: {
  userId: string;
  taskId: string;
}): Promise<boolean> {
  const task = await findTrashedTaskForMutation(params.taskId, params.userId);
  if (!task) {
    return false;
  }

  await assertTodoPolicyNotBlocked({
    userId: params.userId,
    action: POLICY_ACTIONS.TODO_TASK_DELETE,
    resourceId: params.taskId,
    scope: {
      dashboardId: task.dashboardId,
      businessId: task.businessId ?? undefined,
      householdId: task.householdId ?? undefined,
    },
  });

  await unlinkTodoTaskFromAllVLinks({
    actorUserId: params.userId,
    taskId: params.taskId,
  });

  const deleted = await prisma.task.deleteMany({
    where: { id: params.taskId, trashedAt: { not: null } },
  });

  if (deleted.count === 0) {
    return false;
  }

  const snapshot = toTodoTaskSnapshot(task);

  await todoActivity.recordTaskPermanentlyDeleted({
    actorUserId: params.userId,
    task: snapshot,
  });
  todoDomain.recordTaskPermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    task: snapshot,
  });
  todoRealtime.broadcastTaskTrashed(snapshot);

  return true;
}

export async function softTrashTodoItem(input: TodoTrashMutationInput): Promise<void> {
  if (input.type !== 'task') {
    throw new TodoTrashError(`Unsupported todo trash type: ${input.type}`, 'invalid');
  }
  await softTrashTask(input.userId, input.id);
}

export async function restoreTodoItem(input: TodoTrashMutationInput): Promise<boolean> {
  if (input.type !== 'task') {
    return false;
  }
  return restoreTask({ userId: input.userId, taskId: input.id });
}

export async function permanentlyDeleteTodoItem(input: TodoTrashMutationInput): Promise<boolean> {
  if (input.type !== 'task') {
    return false;
  }
  return permanentlyDeleteTask({ userId: input.userId, taskId: input.id });
}

export async function listTrashedTasksForGlobalTrash(userId: string): Promise<GlobalTrashListItem[]> {
  const tasks = await prisma.task.findMany({
    where: {
      trashedAt: { not: null },
      OR: [{ createdById: userId }, { assignedToId: userId }],
    },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
    },
    orderBy: { trashedAt: 'desc' },
  });

  const allowed = await filterTasksByReadPolicy(userId, tasks);

  return allowed.map((task) => ({
    id: task.id,
    name: task.title,
    type: 'task' as const,
    moduleId: 'todo' as const,
    moduleName: 'Todo' as const,
    trashedAt: task.trashedAt,
    metadata: {
      taskId: task.id,
      dashboardId: task.dashboardId,
    },
  }));
}

export async function emptyTodoTrash(input: { userId: string }): Promise<number> {
  const trashedTasks = await prisma.task.findMany({
    where: {
      trashedAt: { not: null },
      OR: [{ createdById: input.userId }, { assignedToId: input.userId }],
    },
    select: {
      id: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
    },
  });

  const allowed = await filterTasksByReadPolicy(input.userId, trashedTasks);

  let deletedCount = 0;
  for (const task of allowed) {
    const deleted = await permanentlyDeleteTask({
      userId: input.userId,
      taskId: task.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }
  return deletedCount;
}
