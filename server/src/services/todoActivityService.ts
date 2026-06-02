import { emitModuleActivityEvent } from './moduleActivityService';
import type { TodoTaskSnapshot } from './todo/todoSideEffectTypes';

function taskScope(task: TodoTaskSnapshot) {
  return {
    dashboardId: task.dashboardId,
    businessId: task.businessId,
    householdId: task.householdId,
  };
}

export async function recordTaskCreated(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'create',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
    metadata: {
      title: params.task.title,
      status: params.task.status,
    },
  });
}

export async function recordTaskUpdated(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'update',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
    metadata: {
      status: params.task.status,
      priority: params.task.priority,
    },
  });
}

export async function recordTaskCompleted(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'complete',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
  });
}

export async function recordTaskReopened(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'reopen',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
    metadata: { status: params.task.status },
  });
}

export async function recordTaskAssigned(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
  assigneeUserId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'assign',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
    metadata: { assigneeUserId: params.assigneeUserId },
  });
}

export async function recordTaskUnassigned(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'unassign',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
  });
}

export async function recordTaskTrashed(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'delete',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
    metadata: { softDelete: true },
  });
}

export async function recordTaskRestored(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'restore',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
  });
}

export async function recordTaskPermanentlyDeleted(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'todo',
    action: 'permanently_delete',
    targetType: 'task',
    targetId: params.task.id,
    ...taskScope(params.task),
  });
}
