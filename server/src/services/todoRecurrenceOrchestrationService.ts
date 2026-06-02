import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertTaskReadable } from './todoVisibilityService';
import type { UpdateTaskResult } from './todo/todoTypes';

export type RecurrenceValidationError = {
  status: number;
  message: string;
};

export async function validateRecurrenceForCreate(params: {
  recurrenceRule?: string | null;
  dueDate?: string | Date | null;
}): Promise<RecurrenceValidationError | null> {
  const { recurrenceRule, dueDate } = params;
  if (!recurrenceRule) return null;

  if (!dueDate) {
    return { status: 400, message: 'Due date is required for recurring tasks' };
  }

  const { validateRRULE } = await import('./todoRecurrenceService');
  if (!validateRRULE(recurrenceRule, dueDate ? new Date(dueDate) : undefined)) {
    return { status: 400, message: 'Invalid recurrence rule (RRULE)' };
  }

  return null;
}

export async function validateRecurrenceForUpdate(params: {
  userId: string;
  taskId: string;
  recurrenceRule?: string | null;
  dueDate?: string | Date | null;
}): Promise<RecurrenceValidationError | null> {
  if (params.recurrenceRule === undefined || params.recurrenceRule === null) {
    return null;
  }

  let existingDueDate: Date | null = null;
  try {
    const task = await assertTaskReadable(params.userId, params.taskId);
    existingDueDate = task.dueDate;
  } catch (error: unknown) {
    if (error instanceof TodoServiceError && error.code === 'not_found') {
      return { status: 404, message: 'Task not found' };
    }
    throw error;
  }

  const taskDueDate =
    params.dueDate !== undefined
      ? params.dueDate
        ? new Date(params.dueDate)
        : null
      : existingDueDate;

  if (!taskDueDate) {
    return { status: 400, message: 'Due date is required for recurring tasks' };
  }

  const { validateRRULE } = await import('./todoRecurrenceService');
  if (!validateRRULE(params.recurrenceRule, taskDueDate)) {
    return { status: 400, message: 'Invalid recurrence rule (RRULE)' };
  }

  return null;
}

export async function afterTaskCreatedWithRecurrence(task: {
  id: string;
  recurrenceRule: string | null;
}): Promise<void> {
  if (!task.recurrenceRule) return;

  try {
    const { createRecurringInstances } = await import('./todoRecurrenceService');
    await createRecurringInstances(task.id, 10);
  } catch (error: unknown) {
    await logger.error('Failed to generate initial recurring instances', {
      operation: 'todo_create_task_instances',
      taskId: task.id,
      error: { message: (error as Error).message },
    });
  }
}

export async function afterTaskUpdatedWithRecurrence(
  userId: string,
  taskId: string,
  result: UpdateTaskResult,
  input: {
    recurrenceRule?: string | null;
    recurrenceEndAt?: string | Date | null;
  }
): Promise<void> {
  const { task, existingTask, isParentRecurringTask, isInstance } = result;
  const { recurrenceRule, recurrenceEndAt } = input;

  if (isParentRecurringTask) {
    const recurrenceRuleChanged =
      recurrenceRule !== undefined &&
      recurrenceRule !== existingTask.recurrenceRule &&
      (recurrenceRule || '') !== (existingTask.recurrenceRule || '');

    const oldEndAt = existingTask.recurrenceEndAt
      ? new Date(existingTask.recurrenceEndAt).toISOString()
      : null;
    const newEndAt =
      recurrenceEndAt !== undefined
        ? recurrenceEndAt
          ? new Date(recurrenceEndAt).toISOString()
          : null
        : oldEndAt;
    const recurrenceEndAtChanged = recurrenceEndAt !== undefined && newEndAt !== oldEndAt;

    if (recurrenceRuleChanged || recurrenceEndAtChanged) {
      try {
        await prisma.task.deleteMany({
          where: {
            parentRecurringTaskId: taskId,
            status: { not: 'DONE' },
            trashedAt: null,
          },
        });

        if (task.recurrenceRule) {
          const { createRecurringInstances } = await import('./todoRecurrenceService');
          await createRecurringInstances(task.id, 10);
        }
      } catch (error: unknown) {
        await logger.error('Failed to regenerate recurring instances', {
          operation: 'todo_update_task_regenerate',
          taskId: task.id,
          error: { message: (error as Error).message },
        });
      }
    }
  } else if (
    !isInstance &&
    recurrenceRule !== undefined &&
    recurrenceRule &&
    !existingTask.recurrenceRule
  ) {
    try {
      const { createRecurringInstances } = await import('./todoRecurrenceService');
      await createRecurringInstances(task.id, 10);
    } catch (error: unknown) {
      await logger.error('Failed to create initial recurring instances', {
        operation: 'todo_update_task_create_instances',
        taskId: task.id,
        error: { message: (error as Error).message },
      });
    }
  }

  void userId;
  void taskId;
}

export async function generateRecurringInstancesForTask(params: {
  userId: string;
  taskId: string;
  maxInstances?: number;
}) {
  const task = await assertTaskReadable(params.userId, params.taskId);

  if (!task.recurrenceRule) {
    throw new TodoServiceError('Task is not a recurring task', 'invalid', 400);
  }

  const { createRecurringInstances } = await import('./todoRecurrenceService');
  const count = await createRecurringInstances(
    params.taskId,
    params.maxInstances || 100
  );

  await logger.info('Recurring instances generated', {
    operation: 'todo_generate_instances',
    taskId: params.taskId,
    count,
    userId: params.userId,
  });

  return { success: true as const, count };
}

export async function getRecurrenceDescriptionForTask(params: {
  userId: string;
  taskId: string;
}) {
  const task = await assertTaskReadable(params.userId, params.taskId);

  if (!task.recurrenceRule) {
    return { description: 'No recurrence' };
  }

  const { describeRRULE } = await import('./todoRecurrenceService');
  const description = describeRRULE(
    task.recurrenceRule,
    task.dueDate ? new Date(task.dueDate) : undefined
  );

  return { description };
}

export async function syncTaskCalendarAfterUpdate(
  userId: string,
  result: UpdateTaskResult
): Promise<void> {
  const { task, existingTask } = result;
  const hadDueDate = existingTask.dueDate !== null;
  const hasDueDate = task.dueDate !== null;
  const dueDateChanged =
    hadDueDate !== hasDueDate ||
    (existingTask.dueDate &&
      task.dueDate &&
      new Date(existingTask.dueDate).getTime() !== new Date(task.dueDate).getTime());

  if (hasDueDate && (dueDateChanged || !hadDueDate)) {
    const { ensureTaskCalendarEvent } = await import('./todoCalendarBridgeService');
    await ensureTaskCalendarEvent(task.id, userId);
  } else if (hasDueDate) {
    const { ensureTaskCalendarEvent } = await import('./todoCalendarBridgeService');
    await ensureTaskCalendarEvent(task.id, userId);
  }
}
