import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * Calendar bridge for tasks with due dates (Phase 1E deferral — not Global Trash / not calendar module extraction).
 * Keeps `todoController` core handlers free of Prisma for create/update post-write hooks.
 */
export async function ensureTaskCalendarEvent(taskId: string, userId: string): Promise<void> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        linkedEvents: true,
      },
    });

    if (!task || !task.dueDate) {
      return;
    }

    const existingLink = task.linkedEvents?.[0];
    let existingEvent = null;

    if (existingLink) {
      existingEvent = await prisma.event.findUnique({
        where: { id: existingLink.eventId },
      });
    }

    let primaryCalendar = await prisma.calendar.findFirst({
      where: {
        contextType: 'PERSONAL',
        contextId: userId,
        isPrimary: true,
      },
    });

    if (!primaryCalendar) {
      const personalCalendars = await prisma.calendar.findMany({
        where: {
          contextType: 'PERSONAL',
          contextId: userId,
        },
      });
      primaryCalendar = personalCalendars[0];
    }

    if (!primaryCalendar) {
      const personalDash = await prisma.dashboard.findFirst({
        where: {
          userId,
          businessId: null,
          householdId: null,
        },
        orderBy: { createdAt: 'asc' },
      });
      const calendarName = personalDash?.name || 'My Dashboard';

      primaryCalendar = await prisma.calendar.create({
        data: {
          name: calendarName,
          contextType: 'PERSONAL',
          contextId: userId,
          isPrimary: true,
          isSystem: true,
          isDeletable: false,
          defaultReminderMinutes: 10,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });
    }

    const targetCalendarId = primaryCalendar.id;
    const startAt = new Date(task.dueDate);
    let endAt = new Date(startAt);
    if (task.timeEstimate) {
      endAt.setMinutes(endAt.getMinutes() + task.timeEstimate);
    } else {
      endAt.setHours(endAt.getHours() + 1);
    }

    if (existingEvent) {
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          title: task.title,
          description: task.description || undefined,
          location: task.category || undefined,
          startAt,
          endAt,
        },
      });
    } else {
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
          createdById: userId,
          reminders: {
            create: [
              {
                method: 'APP',
                minutesBefore: 10,
              },
            ],
          },
        },
      });

      await prisma.taskEventLink.create({
        data: {
          taskId: task.id,
          eventId: event.id,
        },
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to ensure task calendar event', {
      operation: 'ensure_task_calendar_event',
      error: { message: err.message, stack: err.stack },
      context: { taskId, userId },
    });
  }
}
