import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarNotification from '../calendarNotificationService';
import * as calendarActivity from '../calendarActivityService';
import * as calendarDomain from '../calendarDomainEventService';
import { dispatchDueReminders } from '../calendarReminderService';

describe('calendarReminderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarNotification, 'notifyReminderDue').mockResolvedValue(undefined);
    vi.spyOn(calendarActivity, 'recordReminderDispatched').mockResolvedValue(undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventReminderDispatchedDomainEvent').mockImplementation(() => undefined);
  });

  it('dispatches due reminders within lookahead window', async () => {
    const now = new Date('2026-06-01T09:54:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const startAt = new Date('2026-06-01T10:00:00Z');
    vi.spyOn(prisma.reminder, 'findMany').mockResolvedValue([
      {
        id: 'rem-1',
        minutesBefore: 5,
        event: {
          id: 'evt-1',
          title: 'Standup',
          startAt,
          allDay: false,
          timezone: 'UTC',
          calendarId: 'cal-1',
          createdById: 'u1',
          calendar: { contextType: 'PERSONAL', contextId: 'u1' },
          attendees: [],
        },
      },
    ] as never);
    vi.spyOn(prisma.reminder, 'update').mockResolvedValue({} as never);

    await dispatchDueReminders(5);

    expect(calendarNotification.notifyReminderDue).toHaveBeenCalled();
    expect(prisma.reminder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rem-1' },
        data: expect.objectContaining({ dispatchedAt: expect.any(Date) }),
      })
    );

    vi.useRealTimers();
  });

  it('skips reminders outside lookahead window', async () => {
    vi.spyOn(prisma.reminder, 'findMany').mockResolvedValue([
      {
        id: 'rem-1',
        minutesBefore: 60,
        event: {
          id: 'evt-1',
          title: 'Later',
          startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          allDay: false,
          timezone: 'UTC',
          calendarId: 'cal-1',
          createdById: 'u1',
          calendar: { contextType: 'PERSONAL', contextId: 'u1' },
          attendees: [],
        },
      },
    ] as never);

    await dispatchDueReminders(5);
    expect(calendarNotification.notifyReminderDue).not.toHaveBeenCalled();
  });
});
