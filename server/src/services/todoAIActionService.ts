import type { TaskPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TodoServiceError } from './todo/todoErrors';
import * as todoTaskService from './todoTaskService';
import { assertTaskReadable } from './todoVisibilityService';

export type TodoAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

function toOutcome(error: unknown, fallback: string): TodoAIActionOutcome {
  if (error instanceof TodoServiceError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message || fallback };
  }
  return { success: false, error: fallback };
}

function parsePriority(value: string): TaskPriority | null {
  const upper = value.toUpperCase();
  if (['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(upper)) {
    return upper as TaskPriority;
  }
  return null;
}

export async function resolveDashboardIdForAI(
  userId: string,
  dashboardId?: string | null
): Promise<string> {
  if (dashboardId) {
    return dashboardId;
  }
  const dash = await prisma.dashboard.findFirst({
    where: { userId, businessId: null, householdId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!dash) {
    throw new TodoServiceError(
      'No dashboard found for this user. Create a dashboard first.',
      'not_found',
      404
    );
  }
  return dash.id;
}

export async function aiCreateTask(params: {
  userId: string;
  title: string;
  dashboardId?: string | null;
  description?: string | null;
  priority?: string;
  dueDate?: string | Date | null;
  businessId?: string | null;
  householdId?: string | null;
}): Promise<TodoAIActionOutcome> {
  try {
    const title = params.title?.trim();
    if (!title) {
      return { success: false, error: 'title is required' };
    }

    const dashboardId = await resolveDashboardIdForAI(params.userId, params.dashboardId);
    const priority = params.priority ? parsePriority(params.priority) : undefined;

    const task = await todoTaskService.createTask({
      userId: params.userId,
      title,
      description: params.description,
      priority: priority ?? 'MEDIUM',
      dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      dueDate: params.dueDate,
    });

    return { success: true, data: task };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to create task');
  }
}

export async function aiUpdateTask(params: {
  userId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  priority?: string;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  assignedToId?: string | null;
  status?: Parameters<typeof todoTaskService.updateTask>[0]['status'];
}): Promise<TodoAIActionOutcome> {
  try {
    const priority =
      params.priority !== undefined ? parsePriority(params.priority) : undefined;
    if (params.priority !== undefined && priority === null) {
      return { success: false, error: 'Invalid priority value' };
    }

    const result = await todoTaskService.updateTask({
      userId: params.userId,
      taskId: params.taskId,
      title: params.title,
      description: params.description,
      priority: priority ?? undefined,
      dueDate: params.dueDate,
      startDate: params.startDate,
      assignedToId: params.assignedToId,
      status: params.status,
    });

    return { success: true, data: result.task };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to update task');
  }
}

export async function aiCompleteTask(params: {
  userId: string;
  taskId: string;
}): Promise<TodoAIActionOutcome> {
  try {
    const task = await todoTaskService.completeTask(params.userId, params.taskId);
    return { success: true, data: task };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to complete task');
  }
}

export async function aiReopenTask(params: {
  userId: string;
  taskId: string;
}): Promise<TodoAIActionOutcome> {
  try {
    const task = await todoTaskService.reopenTask(params.userId, params.taskId);
    return { success: true, data: task };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to reopen task');
  }
}

export async function aiTrashTask(params: {
  userId: string;
  taskId: string;
}): Promise<TodoAIActionOutcome> {
  try {
    const result = await todoTaskService.softTrashTask(params.userId, params.taskId);
    return { success: true, data: result };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to delete task');
  }
}

export async function aiBulkUpdatePriority(params: {
  userId: string;
  taskIds: string[];
  newPriority: string;
}): Promise<TodoAIActionOutcome> {
  const priority = parsePriority(params.newPriority);
  if (!priority) {
    return { success: false, error: 'newPriority is required and must be valid' };
  }

  const results: Array<{ taskId: string; success: boolean; error?: string }> = [];
  for (const taskId of params.taskIds) {
    const outcome = await aiUpdateTask({
      userId: params.userId,
      taskId,
      priority,
    });
    results.push({
      taskId,
      success: outcome.success,
      error: outcome.success ? undefined : outcome.error,
    });
  }

  const successful = results.filter((r) => r.success).length;
  if (successful === 0) {
    return { success: false, error: 'No tasks updated' };
  }
  return {
    success: true,
    data: { updated: successful, total: params.taskIds.length, results },
  };
}

export async function aiExecutePriorityChanges(params: {
  userId: string;
  suggestions: Array<{ taskId: string; newPriority: string }>;
}): Promise<TodoAIActionOutcome> {
  if (!Array.isArray(params.suggestions) || params.suggestions.length === 0) {
    return { success: false, error: 'suggestions array is required' };
  }

  for (const suggestion of params.suggestions) {
    if (!suggestion.taskId || !suggestion.newPriority) {
      return { success: false, error: 'Each suggestion must have taskId and newPriority' };
    }
    if (!parsePriority(suggestion.newPriority)) {
      return { success: false, error: `Invalid priority: ${suggestion.newPriority}` };
    }
  }

  const settled = await Promise.allSettled(
    params.suggestions.map((suggestion) =>
      todoTaskService.updateTask({
        userId: params.userId,
        taskId: suggestion.taskId,
        priority: parsePriority(suggestion.newPriority) as TaskPriority,
      })
    )
  );

  const successful = settled.filter((r) => r.status === 'fulfilled').length;
  const failed = settled.filter((r) => r.status === 'rejected').length;

  return {
    success: true,
    data: {
      updated: successful,
      failed,
      total: params.suggestions.length,
    },
  };
}

export async function aiExecuteSchedulingChanges(params: {
  userId: string;
  suggestions: Array<{
    taskId: string;
    suggestedDueDate: string;
    suggestedStartDate?: string;
  }>;
}): Promise<TodoAIActionOutcome> {
  if (!Array.isArray(params.suggestions) || params.suggestions.length === 0) {
    return { success: false, error: 'suggestions array is required' };
  }

  for (const suggestion of params.suggestions) {
    if (!suggestion.taskId || !suggestion.suggestedDueDate) {
      return {
        success: false,
        error: 'Each suggestion must have taskId and suggestedDueDate',
      };
    }
  }

  const settled = await Promise.allSettled(
    params.suggestions.map((suggestion) =>
      todoTaskService.updateTask({
        userId: params.userId,
        taskId: suggestion.taskId,
        dueDate: suggestion.suggestedDueDate,
        startDate: suggestion.suggestedStartDate,
      })
    )
  );

  const successful = settled.filter((r) => r.status === 'fulfilled').length;
  const failed = settled.filter((r) => r.status === 'rejected').length;

  return {
    success: true,
    data: {
      updated: successful,
      failed,
      total: params.suggestions.length,
    },
  };
}

/** Assign task via canonical update path (AI-supported when assignee is provided). */
export async function aiAssignTask(params: {
  userId: string;
  taskId: string;
  assignedToId: string | null;
}): Promise<TodoAIActionOutcome> {
  try {
    await assertTaskReadable(params.userId, params.taskId);
    return aiUpdateTask({
      userId: params.userId,
      taskId: params.taskId,
      assignedToId: params.assignedToId,
    });
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to assign task');
  }
}
