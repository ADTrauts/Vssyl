import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarServiceError } from '../calendar/calendarErrors';
import * as calendarEventService from '../calendarEventService';
import * as calendarVisibility from '../calendarVisibilityService';
import * as calendarRealtime from '../calendarRealtimeService';
import {
  buildIcsExportContent,
  exportIcsEvents,
  importIcsEvents,
  parseIcsVevents,
} from '../calendarIcsService';
import { prisma } from '../../lib/prisma';

describe('calendarIcsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parseIcsVevents rejects empty content', () => {
    expect(() => parseIcsVevents('   ')).toThrow(CalendarServiceError);
  });

  it('importIcsEvents denies when write access fails', async () => {
    vi.spyOn(calendarEventService, 'createImportedEvent').mockRejectedValue(
      new CalendarServiceError('Forbidden', 'forbidden', 403)
    );

    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:Test',
      'DTSTART:20260601',
      'DTEND:20260601',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    await expect(
      importIcsEvents({ userId: 'u1', calendarId: 'cal-1', icsContent: ics })
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('importIcsEvents creates events and broadcasts last import', async () => {
    const created = {
      id: 'evt-1',
      title: 'Test',
      calendarId: 'cal-1',
      startAt: new Date(),
      endAt: new Date(),
    };
    vi.spyOn(calendarEventService, 'createImportedEvent').mockResolvedValue(created as never);
    const broadcastSpy = vi
      .spyOn(calendarRealtime, 'broadcastCalendarEventCreated')
      .mockImplementation(() => undefined);

    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:Test',
      'DTSTART:20260601',
      'DTEND:20260601',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const result = await importIcsEvents({ userId: 'u1', calendarId: 'cal-1', icsContent: ics });

    expect(result.imported).toBe(1);
    expect(calendarEventService.createImportedEvent).toHaveBeenCalled();
    expect(broadcastSpy).toHaveBeenCalledWith(['u1'], expect.objectContaining({ id: 'evt-1' }));
  });

  it('importIcsEvents returns 400 for invalid ICS without valid events', async () => {
    await expect(
      importIcsEvents({ userId: 'u1', calendarId: 'cal-1', icsContent: 'BEGIN:VCALENDAR\nEND:VCALENDAR' })
    ).rejects.toMatchObject({ code: 'invalid', status: 400 });
  });

  it('exportIcsEvents denies when no accessible calendars', async () => {
    vi.spyOn(calendarVisibility, 'resolveAccessibleCalendarIds').mockResolvedValue({
      calendarIdList: [],
      dashboardContexts: [],
    });

    await expect(
      exportIcsEvents({
        userId: 'u1',
        start: '2026-06-01',
        end: '2026-06-30',
      })
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('exportIcsEvents builds ICS for accessible events', async () => {
    vi.spyOn(calendarVisibility, 'resolveAccessibleCalendarIds').mockResolvedValue({
      calendarIdList: ['cal-1'],
      dashboardContexts: [],
    });
    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([
      {
        id: 'evt-1',
        title: 'Standup',
        description: null,
        location: null,
        startAt: new Date('2026-06-01T10:00:00Z'),
        endAt: new Date('2026-06-01T10:30:00Z'),
        allDay: false,
        timezone: 'UTC',
        recurrenceRule: null,
        attendees: [],
        reminders: [],
        calendar: { id: 'cal-1' },
      },
    ] as never);

    const ics = await exportIcsEvents({
      userId: 'u1',
      start: '2026-06-01',
      end: '2026-06-30',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Standup');
    expect(ics).toContain('UID:evt-1');
  });

  it('buildIcsExportContent preserves VALARM blocks', () => {
    const ics = buildIcsExportContent([
      {
        id: 'evt-1',
        title: 'Meet',
        description: null,
        location: null,
        startAt: new Date('2026-06-01T10:00:00Z'),
        endAt: new Date('2026-06-01T11:00:00Z'),
        allDay: false,
        timezone: 'UTC',
        recurrenceRule: null,
        attendees: [],
        reminders: [{ minutesBefore: 10 }],
        calendar: { id: 'cal-1' },
      },
    ] as never);

    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT10M');
  });
});
