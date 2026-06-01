import { prisma } from '../lib/prisma';
import { getLocalYmd, zonedTimeToUtc } from '../utils/timezone';
import { logger } from '../lib/logger';
import { notifyReminderDue } from './calendarNotificationService';
import { recordReminderDispatched } from './calendarActivityService';
import { recordCalendarEventReminderDispatchedDomainEvent } from './calendarDomainEventService';

type ReminderWithEvent = {
  id: string;
  minutesBefore: number;
  event: {
    id: string;
    title: string;
    startAt: Date;
    allDay: boolean;
    timezone: string | null;
    calendarId: string;
    createdById: string | null;
    calendar: {
      contextType: string;
      contextId: string;
    };
    attendees: Array<{ userId: string | null }>;
  };
};

function isDatabaseUnreachable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Can't reach database") || message.includes('localhost:5432');
}

function computeReminderTriggerTime(reminder: ReminderWithEvent): Date {
  const ev = reminder.event;
  if (ev.allDay && ev.timezone) {
    const ymd = getLocalYmd(new Date(ev.startAt), ev.timezone);
    return zonedTimeToUtc(ymd.year, ymd.month, ymd.day, 9, 0, ev.timezone);
  }
  return new Date(new Date(ev.startAt).getTime() - reminder.minutesBefore * 60_000);
}

function collectReminderRecipientIds(event: ReminderWithEvent['event']): string[] {
  const recipientIds = new Set<string>();
  if (event.createdById) recipientIds.add(event.createdById);
  for (const att of event.attendees) {
    if (att.userId) recipientIds.add(att.userId);
  }
  return [...recipientIds];
}

/** Mark reminder dispatched and fan out in-app notification + activity/domain event. */
export async function markReminderDispatchedAndNotify(
  reminder: ReminderWithEvent,
  actorUserId: string
): Promise<void> {
  const ev = reminder.event;

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { dispatchedAt: new Date() },
  });

  const recipients = collectReminderRecipientIds(ev);
  for (const userId of recipients) {
    await notifyReminderDue({
      recipientUserId: userId,
      eventId: ev.id,
      calendarId: ev.calendarId,
      reminderId: reminder.id,
      title: ev.title,
      startAt: ev.startAt,
    });
  }

  await recordReminderDispatched({
    actorUserId,
    eventId: ev.id,
    calendarId: ev.calendarId,
    reminderId: reminder.id,
  });

  recordCalendarEventReminderDispatchedDomainEvent({
    actorUserId,
    eventId: ev.id,
    calendarId: ev.calendarId,
    reminderId: reminder.id,
    calendar: ev.calendar,
  });
}

/** Find due reminders in the lookahead window and dispatch notifications. */
export async function dispatchDueReminders(lookaheadMinutes: number = 5): Promise<void> {
  try {
    const now = new Date();
    const lookahead = new Date(now.getTime() + lookaheadMinutes * 60_000);

    let reminders: ReminderWithEvent[];
    try {
      reminders = await prisma.reminder.findMany({
        where: { dispatchedAt: null },
        include: {
          event: {
            include: {
              attendees: true,
              calendar: { select: { contextType: true, contextId: true } },
            },
          },
        },
      });
    } catch (dbError: unknown) {
      if (isDatabaseUnreachable(dbError)) return;
      throw dbError;
    }

    for (const reminder of reminders) {
      const triggerTime = computeReminderTriggerTime(reminder);
      if (triggerTime <= now || triggerTime > lookahead) continue;

      const actorUserId = reminder.event.createdById ?? collectReminderRecipientIds(reminder.event)[0];
      if (!actorUserId) continue;

      try {
        await markReminderDispatchedAndNotify(reminder, actorUserId);
      } catch (dispatchError: unknown) {
        if (isDatabaseUnreachable(dispatchError)) return;
        const err = dispatchError instanceof Error ? dispatchError : new Error(String(dispatchError));
        void logger.error('Failed to dispatch calendar reminder', {
          operation: 'calendar_reminder_dispatch',
          reminderId: reminder.id,
          error: { message: err.message, stack: err.stack },
        });
      }
    }
  } catch (error: unknown) {
    if (isDatabaseUnreachable(error)) return;
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Calendar reminder dispatcher failed', {
      operation: 'calendar_reminder_dispatcher',
      error: { message: err.message, stack: err.stack },
    });
  }
}
