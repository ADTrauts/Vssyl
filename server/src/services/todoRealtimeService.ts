import { getChatSocketService } from './chatSocketService';
import { logger } from '../lib/logger';
import type { TodoTaskSnapshot } from './todo/todoSideEffectTypes';

export type TodoRealtimeAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'reopened'
  | 'assigned'
  | 'unassigned'
  | 'trashed';

export type TodoRealtimePayload = {
  type: 'task';
  action: TodoRealtimeAction;
  task: Record<string, unknown>;
};

/** Users who should receive task board refresh events (creator + assignee). */
export function resolveTaskRealtimeUserIds(task: {
  createdById: string;
  assignedToId?: string | null;
}): string[] {
  const ids = [task.createdById];
  if (task.assignedToId) {
    ids.push(task.assignedToId);
  }
  return [...new Set(ids.filter(Boolean))];
}

/** Transport-only fan-out on `todo_task` socket channel (reuses chat socket infra). */
export function broadcastTodoTaskToUsers(
  userIds: string[],
  payload: TodoRealtimePayload
): void {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) return;

  try {
    const socket = getChatSocketService();
    for (const userId of uniqueUserIds) {
      socket.broadcastToUser(userId, 'todo_task', payload);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast todo realtime event', {
      operation: 'todo_realtime_broadcast',
      action: payload.action,
      error: { message: err.message, stack: err.stack },
    });
  }
}

function broadcast(
  action: TodoRealtimeAction,
  task: TodoTaskSnapshot,
  extra?: Record<string, unknown>
): void {
  const userIds = resolveTaskRealtimeUserIds(task);
  broadcastTodoTaskToUsers(userIds, {
    type: 'task',
    action,
    task: {
      id: task.id,
      dashboardId: task.dashboardId,
      title: task.title,
      status: task.status,
      assignedToId: task.assignedToId ?? null,
      ...extra,
    },
  });
}

export function broadcastTaskCreated(task: TodoTaskSnapshot): void {
  broadcast('created', task);
}

export function broadcastTaskUpdated(task: TodoTaskSnapshot): void {
  broadcast('updated', task);
}

export function broadcastTaskCompleted(task: TodoTaskSnapshot): void {
  broadcast('completed', task);
}

export function broadcastTaskReopened(task: TodoTaskSnapshot): void {
  broadcast('reopened', task);
}

export function broadcastTaskAssigned(
  task: TodoTaskSnapshot,
  assigneeUserId: string
): void {
  broadcast('assigned', task, { assigneeUserId });
}

export function broadcastTaskUnassigned(task: TodoTaskSnapshot): void {
  broadcast('unassigned', task);
}

export function broadcastTaskTrashed(task: TodoTaskSnapshot): void {
  broadcast('trashed', task);
}
