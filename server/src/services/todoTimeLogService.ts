import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertCanWriteTask } from './todoPermissionService';

const timeLogUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function startTimer(params: { userId: string; taskId: string }) {
  await assertCanWriteTask(params.taskId, params.userId);

  const activeTimer = await prisma.taskTimeLog.findFirst({
    where: { userId: params.userId, isActive: true },
  });

  if (activeTimer) {
    const err = new TodoServiceError(
      'You already have an active timer. Please stop it first.',
      'invalid',
      400
    ) as TodoServiceError & { activeTimerId: string; activeTaskId: string };
    err.activeTimerId = activeTimer.id;
    err.activeTaskId = activeTimer.taskId;
    throw err;
  }

  const timeLog = await prisma.taskTimeLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      startedAt: new Date(),
      isActive: true,
    },
    include: timeLogUserInclude,
  });

  await logger.info('Timer started', {
    operation: 'todo_start_timer',
    taskId: params.taskId,
    userId: params.userId,
    timeLogId: timeLog.id,
  });

  return { timeLog };
}

export async function stopTimer(params: {
  userId: string;
  taskId: string;
  description?: string | null;
}) {
  const activeTimer = await prisma.taskTimeLog.findFirst({
    where: {
      taskId: params.taskId,
      userId: params.userId,
      isActive: true,
    },
  });

  if (!activeTimer) {
    throw new TodoServiceError('No active timer found for this task', 'not_found', 404);
  }

  const stoppedAt = new Date();
  const duration = Math.floor(
    (stoppedAt.getTime() - activeTimer.startedAt.getTime()) / (1000 * 60)
  );

  const timeLog = await prisma.taskTimeLog.update({
    where: { id: activeTimer.id },
    data: {
      stoppedAt,
      duration,
      description: params.description || null,
      isActive: false,
    },
    include: timeLogUserInclude,
  });

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { actualTimeSpent: true },
  });
  const newActualTime = (task?.actualTimeSpent || 0) + duration;

  await prisma.task.update({
    where: { id: params.taskId },
    data: { actualTimeSpent: newActualTime },
  });

  await logger.info('Timer stopped', {
    operation: 'todo_stop_timer',
    taskId: params.taskId,
    userId: params.userId,
    timeLogId: timeLog.id,
    duration,
  });

  return { timeLog, totalTimeSpent: newActualTime };
}

export async function getActiveTimer(userId: string) {
  const activeTimer = await prisma.taskTimeLog.findFirst({
    where: { userId, isActive: true },
    include: {
      task: { select: { id: true, title: true } },
      ...timeLogUserInclude,
    },
  });

  return { timeLog: activeTimer };
}

export async function logTime(params: {
  userId: string;
  taskId: string;
  startedAt: string | Date;
  duration: number;
  description?: string | null;
}) {
  if (!params.startedAt || !params.duration || params.duration <= 0) {
    throw new TodoServiceError(
      'startedAt and duration (in minutes) are required',
      'invalid',
      400
    );
  }

  const task = await assertCanWriteTask(params.taskId, params.userId);

  const startedAtDate = new Date(params.startedAt);
  const stoppedAtDate = new Date(
    startedAtDate.getTime() + params.duration * 60 * 1000
  );

  const timeLog = await prisma.taskTimeLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      startedAt: startedAtDate,
      stoppedAt: stoppedAtDate,
      duration: params.duration,
      description: params.description || null,
      isActive: false,
    },
    include: timeLogUserInclude,
  });

  const newActualTime = (task.actualTimeSpent || 0) + params.duration;
  await prisma.task.update({
    where: { id: params.taskId },
    data: { actualTimeSpent: newActualTime },
  });

  await logger.info('Time logged', {
    operation: 'todo_log_time',
    taskId: params.taskId,
    userId: params.userId,
    timeLogId: timeLog.id,
    duration: params.duration,
  });

  return { timeLog, totalTimeSpent: newActualTime };
}

export async function listTimeLogs(params: { userId: string; taskId: string }) {
  const task = await assertCanWriteTask(params.taskId, params.userId);

  const timeLogs = await prisma.taskTimeLog.findMany({
    where: { taskId: params.taskId },
    include: timeLogUserInclude,
    orderBy: { startedAt: 'desc' },
  });

  const totalTime = timeLogs
    .filter((log) => log.duration !== null)
    .reduce((sum, log) => sum + (log.duration || 0), 0);

  return {
    timeLogs,
    totalTime,
    task: {
      timeEstimate: task.timeEstimate,
      actualTimeSpent: task.actualTimeSpent,
    },
  };
}

export async function updateTimeLog(params: {
  userId: string;
  taskId: string;
  logId: string;
  startedAt?: string | Date;
  duration?: number;
  description?: string | null;
}) {
  const existingLog = await prisma.taskTimeLog.findFirst({
    where: {
      id: params.logId,
      taskId: params.taskId,
      userId: params.userId,
      isActive: false,
    },
  });

  if (!existingLog) {
    throw new TodoServiceError('Time log not found', 'not_found', 404);
  }

  const oldDuration = existingLog.duration || 0;
  const newDuration = params.duration ?? oldDuration;
  const startedAtDate = params.startedAt
    ? new Date(params.startedAt)
    : existingLog.startedAt;
  const stoppedAtDate = new Date(
    startedAtDate.getTime() + newDuration * 60 * 1000
  );

  const timeLog = await prisma.taskTimeLog.update({
    where: { id: params.logId },
    data: {
      startedAt: startedAtDate,
      stoppedAt: stoppedAtDate,
      duration: newDuration,
      description:
        params.description !== undefined
          ? params.description
          : existingLog.description,
    },
    include: timeLogUserInclude,
  });

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { actualTimeSpent: true },
  });
  const newActualTime = (task?.actualTimeSpent || 0) - oldDuration + newDuration;

  await prisma.task.update({
    where: { id: params.taskId },
    data: { actualTimeSpent: newActualTime },
  });

  await logger.info('Time log updated', {
    operation: 'todo_update_time_log',
    taskId: params.taskId,
    userId: params.userId,
    timeLogId: params.logId,
  });

  return { timeLog, totalTimeSpent: newActualTime };
}

export async function deleteTimeLog(params: {
  userId: string;
  taskId: string;
  logId: string;
}) {
  const existingLog = await prisma.taskTimeLog.findFirst({
    where: {
      id: params.logId,
      taskId: params.taskId,
      userId: params.userId,
      isActive: false,
    },
  });

  if (!existingLog) {
    throw new TodoServiceError('Time log not found', 'not_found', 404);
  }

  const duration = existingLog.duration || 0;
  await prisma.taskTimeLog.delete({ where: { id: params.logId } });

  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { actualTimeSpent: true },
  });
  const newActualTime = Math.max(0, (task?.actualTimeSpent || 0) - duration);

  await prisma.task.update({
    where: { id: params.taskId },
    data: { actualTimeSpent: newActualTime },
  });

  await logger.info('Time log deleted', {
    operation: 'todo_delete_time_log',
    taskId: params.taskId,
    userId: params.userId,
    timeLogId: params.logId,
  });

  return { success: true as const, totalTimeSpent: newActualTime };
}
