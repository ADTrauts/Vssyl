import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { validateAccessibleFileIds } from './driveVisibilityService';
import { assertCanWriteTask } from './todoPermissionService';

/** Legacy link routes: task creator only (preserves pre-1G behavior). */
async function assertTaskCreator(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, trashedAt: null, createdById: userId },
  });
  if (!task) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }
  return task;
}

async function userCanAccessCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      calendar: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });
  if (!event) return false;
  return event.calendar.members.some(
    (m) =>
      m.role === 'OWNER' ||
      m.role === 'ADMIN' ||
      m.role === 'EDITOR' ||
      m.role === 'READER'
  );
}

export async function createEventFromTask(params: {
  userId: string;
  taskId: string;
  calendarId?: string;
}) {
  const task = await assertTaskCreator(params.taskId, params.userId);

  if (!task.dueDate) {
    throw new TodoServiceError(
      'Task must have a due date to create calendar event',
      'invalid',
      400
    );
  }

  let targetCalendarId = params.calendarId;
  if (!targetCalendarId) {
    let primaryCalendar = await prisma.calendar.findFirst({
      where: {
        contextType: 'PERSONAL',
        contextId: params.userId,
        isPrimary: true,
      },
    });

    if (!primaryCalendar) {
      const personalCalendars = await prisma.calendar.findMany({
        where: { contextType: 'PERSONAL', contextId: params.userId },
      });
      primaryCalendar = personalCalendars[0];
    }

    if (!primaryCalendar) {
      const personalDash = await prisma.dashboard.findFirst({
        where: { userId: params.userId, businessId: null, householdId: null },
        orderBy: { createdAt: 'asc' },
      });
      const calendarName = personalDash?.name || 'My Dashboard';

      primaryCalendar = await prisma.calendar.create({
        data: {
          name: calendarName,
          contextType: 'PERSONAL',
          contextId: params.userId,
          isPrimary: true,
          isSystem: true,
          isDeletable: false,
          defaultReminderMinutes: 10,
          members: { create: { userId: params.userId, role: 'OWNER' } },
        },
      });
    }

    targetCalendarId = primaryCalendar.id;
  }

  const calendarMember = await prisma.calendarMember.findFirst({
    where: {
      calendarId: targetCalendarId,
      userId: params.userId,
      role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
    },
  });

  if (!calendarMember) {
    throw new TodoServiceError('Access denied to calendar', 'forbidden', 403);
  }

  const startAt = new Date(task.dueDate);
  const endAt = new Date(startAt);
  if (task.timeEstimate) {
    endAt.setMinutes(endAt.getMinutes() + task.timeEstimate);
  } else {
    endAt.setHours(endAt.getHours() + 1);
  }

  const event = await prisma.event.create({
    data: {
      calendarId: targetCalendarId,
      title: task.title,
      description: task.description || undefined,
      location: task.category || undefined,
      startAt,
      endAt,
      allDay: false,
      timezone: 'UTC',
      createdById: params.userId,
      reminders: {
        create: [{ method: 'APP', minutesBefore: 10 }],
      },
    },
  });

  await prisma.taskEventLink.create({
    data: { taskId: task.id, eventId: event.id },
  });

  return {
    task,
    event: {
      id: event.id,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
    },
  };
}

export async function linkTaskToEvent(params: {
  userId: string;
  taskId: string;
  eventId: string;
}) {
  if (!params.eventId) {
    throw new TodoServiceError('eventId is required', 'invalid', 400);
  }

  await assertTaskCreator(params.taskId, params.userId);

  const canAccess = await userCanAccessCalendarEvent(params.userId, params.eventId);
  if (!canAccess) {
    throw new TodoServiceError('Event not found', 'not_found', 404);
  }

  const existingLink = await prisma.taskEventLink.findUnique({
    where: {
      taskId_eventId: { taskId: params.taskId, eventId: params.eventId },
    },
  });

  if (existingLink) {
    throw new TodoServiceError('Task is already linked to this event', 'conflict', 409);
  }

  await prisma.taskEventLink.create({
    data: { taskId: params.taskId, eventId: params.eventId },
  });

  return { success: true as const };
}

export async function unlinkTaskFromEvent(params: {
  userId: string;
  taskId: string;
  eventId: string;
}) {
  await assertTaskCreator(params.taskId, params.userId);

  await prisma.taskEventLink.delete({
    where: {
      taskId_eventId: { taskId: params.taskId, eventId: params.eventId },
    },
  });

  return { success: true as const };
}

export async function linkTaskToFile(params: {
  userId: string;
  taskId: string;
  fileId: string;
}) {
  if (!params.fileId) {
    throw new TodoServiceError('fileId is required', 'invalid', 400);
  }

  await assertTaskCreator(params.taskId, params.userId);

  const { deniedIds } = await validateAccessibleFileIds(params.userId, [params.fileId]);
  if (deniedIds.length > 0) {
    throw new TodoServiceError('File not found or access denied', 'forbidden', 403);
  }

  const existingLink = await prisma.taskFileLink.findUnique({
    where: {
      taskId_fileId: { taskId: params.taskId, fileId: params.fileId },
    },
  });

  if (existingLink) {
    throw new TodoServiceError('File is already linked to this task', 'conflict', 409);
  }

  const link = await prisma.taskFileLink.create({
    data: { taskId: params.taskId, fileId: params.fileId },
  });

  await logger.info('File linked to task', {
    operation: 'todo_link_file',
    taskId: params.taskId,
    fileId: params.fileId,
    userId: params.userId,
  });

  return { success: true as const, link };
}

export async function unlinkTaskFromFile(params: {
  userId: string;
  taskId: string;
  fileId: string;
}) {
  await assertTaskCreator(params.taskId, params.userId);

  await prisma.taskFileLink.delete({
    where: {
      taskId_fileId: { taskId: params.taskId, fileId: params.fileId },
    },
  });

  await logger.info('File unlinked from task', {
    operation: 'todo_unlink_file',
    taskId: params.taskId,
    fileId: params.fileId,
    userId: params.userId,
  });

  return { success: true as const };
}

export async function getTaskLinkedFiles(params: { userId: string; taskId: string }) {
  await assertTaskCreator(params.taskId, params.userId);

  const links = await prisma.taskFileLink.findMany({
    where: { taskId: params.taskId },
  });

  const fileIds = links.map((link) => link.fileId);
  const { accessibleIds } = await validateAccessibleFileIds(params.userId, fileIds);

  const visibleLinks = links.filter((link) => accessibleIds.includes(link.fileId));

  return {
    success: true as const,
    files: visibleLinks.map((link) => ({
      id: link.id,
      fileId: link.fileId,
      taskId: link.taskId,
    })),
    fileIds: accessibleIds,
  };
}

export async function getTaskLinkedEvents(params: { userId: string; taskId: string }) {
  await assertTaskCreator(params.taskId, params.userId);

  const links = await prisma.taskEventLink.findMany({
    where: { taskId: params.taskId },
  });

  const eventIds = links.map((link) => link.eventId);
  if (eventIds.length === 0) {
    return [];
  }

  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      calendarId: true,
      description: true,
      location: true,
    },
  });

  const visible: typeof events = [];
  for (const event of events) {
    if (await userCanAccessCalendarEvent(params.userId, event.id)) {
      visible.push(event);
    }
  }

  return visible.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    calendarId: event.calendarId,
    description: event.description,
    location: event.location,
  }));
}
