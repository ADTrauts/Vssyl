import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPolicyDual from '../../auth/calendarPolicyDual';
import * as calendarPermission from '../calendarPermissionService';
import * as calendarActivity from '../calendarActivityService';
import * as calendarDomain from '../calendarDomainEventService';
import * as calendarNotification from '../calendarNotificationService';
import * as calendarRealtime from '../calendarRealtimeService';
import { createEvent } from '../calendarEventService';
import { CalendarServiceError } from '../calendar/calendarErrors';

describe('calendarEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(calendarNotification, 'resolveCalendarMemberUserIds').mockResolvedValue(['u1']);
    vi.spyOn(calendarRealtime, 'broadcastCalendarEventCreated').mockImplementation(() => undefined);
    vi.spyOn(calendarActivity, 'recordEventCreated').mockResolvedValue(undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventCreatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(calendarNotification, 'sendEventCreatedInviteEmails').mockResolvedValue(undefined);
  });

  it('creates an event when write access is granted', async () => {
    vi.spyOn(calendarPermission, 'getCalendarForWrite').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.calendar, 'findUniqueOrThrow').mockResolvedValue({
      id: 'cal-1',
      contextType: 'PERSONAL',
      contextId: 'user-1',
      defaultReminderMinutes: 10,
    } as never);
    const created = {
      id: 'evt-1',
      calendarId: 'cal-1',
      title: 'Standup',
      startAt: new Date('2026-06-01T10:00:00Z'),
      endAt: new Date('2026-06-01T10:30:00Z'),
      allDay: false,
      attendees: [],
      reminders: [],
      attachments: [],
    };
    vi.spyOn(prisma.event, 'create').mockResolvedValue(created as never);

    const result = await createEvent({
      userId: 'user-1',
      calendarId: 'cal-1',
      title: 'Standup',
      startAt: '2026-06-01T10:00:00Z',
      endAt: '2026-06-01T10:30:00Z',
    });

    expect(result.event.id).toBe('evt-1');
    expect(prisma.event.create).toHaveBeenCalled();
    expect(calendarRealtime.broadcastCalendarEventCreated).toHaveBeenCalled();
    expect(calendarActivity.recordEventCreated).toHaveBeenCalled();
    expect(calendarDomain.recordCalendarEventCreatedDomainEvent).toHaveBeenCalled();
  });

  it('denies create when write access fails', async () => {
    vi.spyOn(calendarPermission, 'getCalendarForWrite').mockRejectedValue(
      new CalendarServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(
      createEvent({
        userId: 'user-1',
        calendarId: 'cal-1',
        title: 'Standup',
        startAt: '2026-06-01T10:00:00Z',
        endAt: '2026-06-01T10:30:00Z',
      })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
