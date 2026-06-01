import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import { createImportedEvent } from './calendarEventService';
import { resolveAccessibleCalendarIds } from './calendarVisibilityService';
import { broadcastCalendarEventCreated } from './calendarRealtimeService';
import { logger } from '../lib/logger';

export type ParsedIcsEvent = {
  summary?: string;
  dtstart?: string;
  dtend?: string;
  description?: string;
  location?: string;
  rrule?: string;
  uid?: string;
};

export function parseIcsVevents(icsContent: string): ParsedIcsEvent[] {
  if (!icsContent?.trim()) {
    throw new CalendarServiceError('Missing ICS content', 'invalid', 400);
  }

  const lines = icsContent.split('\n');
  const events: ParsedIcsEvent[] = [];
  let currentEvent: ParsedIcsEvent = {};
  let inEvent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (trimmedLine.startsWith('END:VEVENT')) {
      inEvent = false;
      if (currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent);
      }
    } else if (inEvent && trimmedLine.includes(':')) {
      const [key, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':');

      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
          currentEvent.dtend = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'RRULE':
          currentEvent.rrule = value;
          break;
        case 'UID':
          currentEvent.uid = value;
          break;
      }
    }
  }

  return events;
}

function parseIcsEventDates(parsed: ParsedIcsEvent): { startAt: Date; endAt: Date; allDay: boolean } {
  if (!parsed.dtstart) {
    throw new CalendarServiceError('Invalid ICS event: missing start time', 'invalid', 400);
  }

  let startAt: Date;
  let allDay = false;

  if (parsed.dtstart.length === 8) {
    allDay = true;
    startAt = new Date(
      parseInt(parsed.dtstart.slice(0, 4)),
      parseInt(parsed.dtstart.slice(4, 6)) - 1,
      parseInt(parsed.dtstart.slice(6, 8))
    );
  } else {
    startAt = new Date(parsed.dtstart);
    if (Number.isNaN(startAt.getTime())) {
      throw new CalendarServiceError('Invalid ICS event: malformed start time', 'invalid', 400);
    }
  }

  let endAt: Date;
  if (parsed.dtend) {
    if (parsed.dtend.length === 8) {
      endAt = new Date(
        parseInt(parsed.dtend.slice(0, 4)),
        parseInt(parsed.dtend.slice(4, 6)) - 1,
        parseInt(parsed.dtend.slice(6, 8))
      );
    } else {
      endAt = new Date(parsed.dtend);
      if (Number.isNaN(endAt.getTime())) {
        throw new CalendarServiceError('Invalid ICS event: malformed end time', 'invalid', 400);
      }
    }
  } else {
    endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  }

  return { startAt, endAt, allDay };
}

export async function importIcsEvents(input: {
  userId: string;
  calendarId: string;
  icsContent: string;
}) {
  const parsedEvents = parseIcsVevents(input.icsContent);
  if (parsedEvents.length === 0) {
    throw new CalendarServiceError('No valid events found in ICS content', 'invalid', 400);
  }

  const createdEvents = [];

  for (const parsed of parsedEvents) {
    try {
      const { startAt, endAt, allDay } = parseIcsEventDates(parsed);
      const newEvent = await createImportedEvent({
        userId: input.userId,
        calendarId: input.calendarId,
        title: parsed.summary as string,
        description: parsed.description,
        location: parsed.location,
        startAt,
        endAt,
        allDay,
        recurrenceRule: parsed.rrule,
      });
      createdEvents.push(newEvent);
    } catch (error: unknown) {
      if (error instanceof CalendarServiceError) {
        throw error;
      }
      await logger.error('Failed to create event from ICS', {
        operation: 'calendar_create_from_ics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  if (createdEvents.length === 0) {
    throw new CalendarServiceError('No events could be imported from ICS content', 'invalid', 400);
  }

  const last = createdEvents[createdEvents.length - 1];
  broadcastCalendarEventCreated([input.userId], last as Record<string, unknown>);

  return {
    imported: createdEvents.length,
    events: createdEvents,
  };
}

type ExportEventRow = Awaited<ReturnType<typeof fetchEventsForIcsExport>>[number];

async function fetchEventsForIcsExport(input: {
  userId: string;
  start: string;
  end: string;
  calendarIds?: string | string[];
  contexts?: string | string[];
}) {
  const contextFilters = Array.isArray(input.contexts)
    ? input.contexts
    : input.contexts
      ? [input.contexts]
      : [];
  const requestedCalendarIds = Array.isArray(input.calendarIds)
    ? input.calendarIds
    : input.calendarIds
      ? [input.calendarIds]
      : [];

  const { calendarIdList } = await resolveAccessibleCalendarIds({
    userId: input.userId,
    contextFilters,
    requestedCalendarIds,
  });

  if (calendarIdList.length === 0) {
    throw new CalendarServiceError('Access denied', 'forbidden', 403);
  }

  return prisma.event.findMany({
    where: {
      calendarId: { in: calendarIdList },
      trashedAt: null,
      startAt: { gte: new Date(input.start) },
      endAt: { lte: new Date(input.end) },
    },
    include: {
      calendar: true,
      attendees: true,
      reminders: true,
    },
  });
}

export function buildIcsExportContent(events: ExportEventRow[]): string {
  let icsContent = 'BEGIN:VCALENDAR\r\n';
  icsContent += 'VERSION:2.0\r\n';
  icsContent += 'PRODID:-//Vssyl//Calendar//EN\r\n';
  icsContent += 'CALSCALE:GREGORIAN\r\n';
  icsContent += 'METHOD:PUBLISH\r\n';

  const timezones = new Set<string>();
  events.forEach((event) => {
    if (event.timezone && event.timezone !== 'UTC') {
      timezones.add(event.timezone);
    }
  });

  timezones.forEach((timezone) => {
    icsContent += 'BEGIN:VTIMEZONE\r\n';
    icsContent += `TZID:${timezone}\r\n`;
    if (timezone === 'America/New_York') {
      icsContent += 'BEGIN:DAYLIGHT\r\n';
      icsContent += 'TZOFFSETFROM:-0500\r\n';
      icsContent += 'TZOFFSETTO:-0400\r\n';
      icsContent += 'DTSTART:19700308T020000\r\n';
      icsContent += 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\n';
      icsContent += 'TZNAME:EDT\r\n';
      icsContent += 'END:DAYLIGHT\r\n';
      icsContent += 'BEGIN:STANDARD\r\n';
      icsContent += 'TZOFFSETFROM:-0400\r\n';
      icsContent += 'TZOFFSETTO:-0500\r\n';
      icsContent += 'DTSTART:19701101T020000\r\n';
      icsContent += 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\n';
      icsContent += 'TZNAME:EST\r\n';
      icsContent += 'END:STANDARD\r\n';
    }
    icsContent += 'END:VTIMEZONE\r\n';
  });

  events.forEach((event) => {
    icsContent += 'BEGIN:VEVENT\r\n';
    icsContent += `UID:${event.id}\r\n`;
    icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;

    if (event.allDay) {
      icsContent += `DTSTART;VALUE=DATE:${new Date(event.startAt).toISOString().slice(0, 10).replace(/-/g, '')}\r\n`;
    } else {
      icsContent += `DTSTART;TZID=${event.timezone}:${new Date(event.startAt).toISOString().replace(/[-:]/g, '').split('.')[0]}\r\n`;
    }

    if (event.allDay) {
      icsContent += `DTEND;VALUE=DATE:${new Date(event.endAt).toISOString().slice(0, 10).replace(/-/g, '')}\r\n`;
    } else {
      icsContent += `DTEND;TZID=${event.timezone}:${new Date(event.endAt).toISOString().replace(/[-:]/g, '').split('.')[0]}\r\n`;
    }

    icsContent += `SUMMARY:${event.title.replace(/\r?\n/g, '\\n')}\r\n`;

    if (event.description) {
      icsContent += `DESCRIPTION:${event.description.replace(/\r?\n/g, '\\n')}\r\n`;
    }

    if (event.location) {
      icsContent += `LOCATION:${event.location.replace(/\r?\n/g, '\\n')}\r\n`;
    }

    if (event.recurrenceRule) {
      icsContent += `RRULE:${event.recurrenceRule}\r\n`;
    }

    event.attendees.forEach((attendee) => {
      icsContent += `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=${attendee.response || 'NEEDS-ACTION'}:mailto:${attendee.email}\r\n`;
    });

    event.reminders.forEach((reminder) => {
      icsContent += 'BEGIN:VALARM\r\n';
      icsContent += `TRIGGER:-PT${reminder.minutesBefore}M\r\n`;
      icsContent += 'ACTION:DISPLAY\r\n';
      icsContent += `DESCRIPTION:${event.title}\r\n`;
      icsContent += 'END:VALARM\r\n';
    });

    icsContent += 'END:VEVENT\r\n';
  });

  icsContent += 'END:VCALENDAR\r\n';
  return icsContent;
}

export async function exportIcsEvents(input: {
  userId: string;
  start: string;
  end: string;
  calendarIds?: string | string[];
  contexts?: string | string[];
}) {
  if (!input.start || !input.end) {
    throw new CalendarServiceError('Missing start/end', 'invalid', 400);
  }

  const events = await fetchEventsForIcsExport(input);
  return buildIcsExportContent(events);
}
