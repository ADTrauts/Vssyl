import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPermission from '../calendarPermissionService';
import * as calendarActivity from '../calendarActivityService';
import * as calendarDomain from '../calendarDomainEventService';
import * as calendarNotification from '../calendarNotificationService';
import * as calendarRealtime from '../calendarRealtimeService';
import { rsvpEvent } from '../calendarAttendeeService';

describe('calendarAttendeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPermission, 'assertCalendarMember').mockResolvedValue(undefined);
    vi.spyOn(calendarNotification, 'resolveCalendarMemberUserIds').mockResolvedValue(['user-1']);
    vi.spyOn(calendarRealtime, 'broadcastCalendarEventUpdated').mockImplementation(() => undefined);
    vi.spyOn(calendarActivity, 'recordAttendeeRsvp').mockResolvedValue(undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventRsvpUpdatedDomainEvent').mockImplementation(() => undefined);
  });

  it('updates existing attendee response', async () => {
    const refreshedEvent = {
      id: 'evt-1',
      calendarId: 'cal-1',
      attendees: [{ id: 'att-1', userId: 'user-1', response: 'ACCEPTED' }],
      calendar: { contextType: 'PERSONAL', contextId: 'user-1' },
    };

    vi.spyOn(prisma.event, 'findUnique')
      .mockResolvedValueOnce({
        id: 'evt-1',
        calendarId: 'cal-1',
        attendees: [{ id: 'att-1', userId: 'user-1', response: 'NEEDS_ACTION' }],
      } as never)
      .mockResolvedValueOnce(refreshedEvent as never);

    const updateSpy = vi.spyOn(prisma.eventAttendee, 'update').mockResolvedValue({} as never);

    const result = await rsvpEvent({
      userId: 'user-1',
      eventId: 'evt-1',
      response: 'ACCEPTED',
    });

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'att-1' },
      data: { response: 'ACCEPTED' },
    });
    expect(result?.id).toBe('evt-1');
    expect(calendarRealtime.broadcastCalendarEventUpdated).toHaveBeenCalled();
    expect(calendarActivity.recordAttendeeRsvp).toHaveBeenCalled();
  });
});
