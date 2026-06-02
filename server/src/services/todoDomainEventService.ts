import {
  emitTodoTaskAssignedEvent,
  emitTodoTaskCompletedEvent,
  emitTodoTaskCreatedEvent,
  emitTodoTaskReopenedEvent,
  emitTodoTaskPermanentlyDeletedEvent,
  emitTodoTaskRestoredEvent,
  emitTodoTaskTrashedEvent,
  emitTodoTaskUnassignedEvent,
  emitTodoTaskUpdatedEvent,
} from '../events/domainEventEmitters';
import type { TodoTaskSnapshot } from './todo/todoSideEffectTypes';

function scopeFromTask(task: TodoTaskSnapshot) {
  return {
    dashboardId: task.dashboardId,
    businessId: task.businessId,
    householdId: task.householdId,
  };
}

export function recordTaskCreatedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskCreatedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
    status: params.task.status,
    priority: params.task.priority,
  });
}

export function recordTaskUpdatedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskUpdatedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
    status: params.task.status,
    priority: params.task.priority,
  });
}

export function recordTaskCompletedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskCompletedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
  });
}

export function recordTaskReopenedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskReopenedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
    status: params.task.status,
  });
}

export function recordTaskAssignedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
  assigneeUserId: string;
}): void {
  emitTodoTaskAssignedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    assigneeUserId: params.assigneeUserId,
    ...scopeFromTask(params.task),
  });
}

export function recordTaskUnassignedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskUnassignedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
  });
}

export function recordTaskTrashedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskTrashedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
  });
}

export function recordTaskRestoredDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskRestoredEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
  });
}

export function recordTaskPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  task: TodoTaskSnapshot;
}): void {
  emitTodoTaskPermanentlyDeletedEvent({
    actorUserId: params.actorUserId,
    taskId: params.task.id,
    ...scopeFromTask(params.task),
  });
}
