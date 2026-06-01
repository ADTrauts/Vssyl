import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPolicyDual from '../../auth/calendarPolicyDual';
import {
  listAccessibleCalendars,
  listEventsInRange,
  checkConflicts,
} from '../calendarVisibilityService';
import * as calendarRecurrence from '../calendarRecurrenceService';

describe('calendarVisibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual').mockResolvedValue({
      blocked: false,
    });
  });

  it('listAccessibleCalendars filters calendars failing read policy', async () => {
    vi.spyOn(prisma.calendar, 'findMany').mockResolvedValue([
      { id: 'cal-1', name: 'A' },
      { id: 'cal-2', name: 'B' },
    ] as never);

    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual')
      .mockResolvedValueOnce({ blocked: false })
      .mockResolvedValueOnce({ blocked: true, reason: 'NOT_MEMBER' });

    const result = await listAccessibleCalendars('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cal-1');
  });

  it('listEventsInRange excludes trashed events via query and expands recurrence', async () => {
    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual').mockResolvedValue({
      blocked: false,
    });

    vi.spyOn(prisma.calendar, 'findMany')
      .mockResolvedValueOnce([{ id: 'cal-1' }] as never)
      .mockResolvedValueOnce([
        { id: 'cal-1', contextType: 'PERSONAL', contextId: 'user-1', name: 'Main' },
      ] as never);

    const events = [
      {
        id: 'evt-1',
        calendarId: 'cal-1',
        title: 'One-off',
        recurrenceRule: null,
        parentEventId: null,
        startAt: new Date('2026-06-01T10:00:00Z'),
        endAt: new Date('2026-06-01T11:00:00Z'),
      },
    ];

    vi.spyOn(prisma.event, 'findMany').mockResolvedValue(events as never);

    const expandSpy = vi
      .spyOn(calendarRecurrence, 'expandRecurringEventsInRange')
      .mockReturnValue([
        {
          id: 'evt-1',
          occurrenceStartAt: new Date('2026-06-01T10:00:00Z'),
          occurrenceEndAt: new Date('2026-06-01T11:00:00Z'),
        },
      ] as never);

    const result = await listEventsInRange({
      userId: 'user-1',
      start: '2026-06-01T00:00:00Z',
      end: '2026-06-02T00:00:00Z',
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trashedAt: null }),
      })
    );
    expect(expandSpy).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('checkConflicts uses recurrence expansion helper', async () => {
    vi.spyOn(prisma.calendar, 'findMany').mockResolvedValue([{ id: 'cal-1' }] as never);

    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([
      {
        id: 'evt-1',
        calendarId: 'cal-1',
        title: 'Busy',
        startAt: new Date('2026-06-01T10:00:00Z'),
        endAt: new Date('2026-06-01T11:00:00Z'),
        allDay: false,
        timezone: 'UTC',
        recurrenceRule: 'FREQ=DAILY;COUNT=1',
      },
    ] as never);

    const expandSpy = vi
      .spyOn(calendarRecurrence, 'expandEventsForConflictCheck')
      .mockReturnValue([
        {
          id: 'evt-1',
          calendarId: 'cal-1',
          title: 'Busy',
          startAt: '2026-06-01T10:00:00.000Z',
          endAt: '2026-06-01T11:00:00.000Z',
          allDay: false,
          timezone: 'UTC',
        },
      ]);

    const result = await checkConflicts({
      userId: 'user-1',
      start: '2026-06-01T00:00:00Z',
      end: '2026-06-02T00:00:00Z',
      calendarIds: ['cal-1'],
    });

    expect(expandSpy).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
