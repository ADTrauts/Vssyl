import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPermission from '../calendarPermissionService';
import { rsvpEvent } from '../calendarAttendeeService';

describe('calendarAttendeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPermission, 'assertCalendarMember').mockResolvedValue(undefined);
  });

  it('updates existing attendee response', async () => {
    vi.spyOn(prisma.event, 'findUnique')
      .mockResolvedValueOnce({
        id: 'evt-1',
        calendarId: 'cal-1',
        attendees: [{ id: 'att-1', userId: 'user-1', response: 'NEEDS_ACTION' }],
      } as never)
      .mockResolvedValueOnce({
        id: 'evt-1',
        calendarId: 'cal-1',
        attendees: [{ id: 'att-1', userId: 'user-1', response: 'ACCEPTED' }],
      } as never);

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
  });
});
