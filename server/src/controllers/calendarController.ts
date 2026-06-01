import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { CalendarServiceError } from '../services/calendar/calendarErrors';
import * as calendarAttendeeService from '../services/calendarAttendeeService';
import * as calendarEventService from '../services/calendarEventService';
import * as calendarService from '../services/calendarService';
import * as calendarVisibilityService from '../services/calendarVisibilityService';
import { recordEventImported } from '../services/calendarActivityService';
import { broadcastCalendarEventCreated } from '../services/calendarRealtimeService';

function getUserId(req: Request): string | null {
  const user = (req as AuthenticatedRequest).user;
  return user?.id || null;
}

function respondCalendarServiceError(res: Response, error: unknown): Response | void {
  if (error instanceof CalendarServiceError) {
    return res.status(error.status).json({ error: error.message });
  }
}

function queryStringOrStringArray(
  value: unknown
): string | string[] | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value;
  }
  return undefined;
}

export async function listCalendars(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { contextType, contextId } = req.query as { contextType?: string; contextId?: string };

  try {
    const calendars = await calendarVisibilityService.listAccessibleCalendars(userId, {
      contextType,
      contextId,
    });
    return res.json({ success: true, data: calendars });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function createCalendar(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, color, type, contextType, contextId, isPrimary, isSystem, isDeletable, defaultReminderMinutes } = req.body;
  if (!name || !contextType || !contextId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const calendar = await calendarService.createCalendar({
      userId,
      name,
      color,
      type,
      contextType,
      contextId,
      isPrimary,
      isSystem,
      isDeletable,
      defaultReminderMinutes,
    });
    return res.status(201).json({ success: true, data: calendar });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function updateCalendar(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { name, color, defaultReminderMinutes } = req.body;

  try {
    const calendar = await calendarService.updateCalendar({
      userId,
      calendarId: id,
      name,
      color,
      defaultReminderMinutes,
    });
    return res.json({ success: true, data: calendar });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function deleteCalendar(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;

  try {
    await calendarService.deleteCalendar({ userId, calendarId: id });
    return res.json({ success: true });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function autoProvisionCalendar(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { contextType, contextId, name, isPrimary } = req.body as { contextType: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD'; contextId: string; name?: string; isPrimary?: boolean };
  if (!contextType || !contextId) return res.status(400).json({ error: 'Missing context' });

  try {
    const result = await calendarService.autoProvisionCalendar({
      userId,
      contextType,
      contextId,
      name,
      isPrimary,
    });
    const status = result.created ? 201 : 200;
    return res.status(status).json({ success: true, data: result.calendar });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function listEventsInRange(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { start, end, contexts, calendarIds } = req.query as { start?: string; end?: string; contexts?: string | string[]; calendarIds?: string | string[]; };

  if (!start || !end) return res.status(400).json({ error: 'Missing start/end' });

  try {
    const expanded = await calendarVisibilityService.listEventsInRange({
      userId,
      start,
      end,
      contexts,
      calendarIds,
    });
    res.json({ success: true, data: expanded });
  } catch (error: unknown) {
    const err = error as Error;
    const prismaCode = typeof (error as { code?: string }).code === 'string' ? (error as { code: string }).code : undefined;
    await logger.error('Calendar listEventsInRange failed', {
      operation: 'list_events_in_range',
      userId,
      error: { message: err.message, stack: err.stack },
      ...(prismaCode && { prismaCode })
    });
    if (!res.headersSent) res.status(500).json({ error: 'Failed to load events' });
  }
}

export async function searchEvents(req: Request, res: Response) {
  try {
    const { text, start, end, contexts, calendarIds } = req.query;
    const userId = getUserId(req);

    if (!userId || !text) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const events = await calendarVisibilityService.searchEvents({
      userId,
      text: String(text),
      start: typeof start === 'string' ? start : undefined,
      end: typeof end === 'string' ? end : undefined,
      contexts: queryStringOrStringArray(contexts),
      calendarIds: queryStringOrStringArray(calendarIds),
    });

    res.json({ success: true, data: events });
  } catch (error) {
    await logger.error('Failed to search events', {
      operation: 'calendar_search_events',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function checkConflicts(req: Request, res: Response) {
  try {
    const { start, end, calendarIds } = req.query;
    const userId = getUserId(req);

    if (!userId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const expandedConflicts = await calendarVisibilityService.checkConflicts({
      userId,
      start: String(start),
      end: String(end),
      calendarIds: queryStringOrStringArray(calendarIds),
    });

    res.json({ success: true, data: expandedConflicts });
  } catch (error) {
    await logger.error('Failed to check calendar conflicts', {
      operation: 'calendar_check_conflicts',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function createEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { calendarId, title, description, location, onlineMeetingLink, startAt, endAt, allDay, timezone, reminders, attendees, recurrenceRule, recurrenceEndAt } = req.body;
  if (!calendarId || !title || !startAt || !endAt) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const { event } = await calendarEventService.createEvent({
      userId,
      calendarId,
      title,
      description,
      location,
      onlineMeetingLink,
      startAt,
      endAt,
      allDay,
      timezone,
      reminders,
      attendees,
      recurrenceRule,
      recurrenceEndAt,
    });
    return res.status(201).json({ success: true, data: event });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function updateEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const data = req.body || {};

  try {
    const updateResult = await calendarEventService.updateEvent({
      userId,
      eventId: id,
      editMode: data.editMode,
      occurrenceStartAt: data.occurrenceStartAt,
      title: data.title,
      description: data.description,
      location: data.location,
      onlineMeetingLink: data.onlineMeetingLink,
      startAt: data.startAt,
      endAt: data.endAt,
      allDay: data.allDay,
      timezone: data.timezone,
      recurrenceRule: data.recurrenceRule,
      recurrenceEndAt: data.recurrenceEndAt,
      attendees: data.attendees,
    });

    if (updateResult.type === 'occurrence_exception') {
      return res.json({ success: true, data: updateResult.event });
    }

    if (!updateResult.event) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: updateResult.event });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function deleteEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const editMode = req.query.editMode as 'THIS' | 'SERIES' | undefined;
  const occurrenceStartAt = typeof req.query.occurrenceStartAt === 'string' ? req.query.occurrenceStartAt : undefined;

  try {
    const deleteResult = await calendarEventService.deleteEvent({
      userId,
      eventId: id,
      editMode,
      occurrenceStartAt,
    });

    if (deleteResult.type === 'canceled_occurrence') {
      return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function rsvpEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { response } = req.body as { response: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' };

  try {
    const refreshed = await calendarAttendeeService.rsvpEvent({ userId, eventId: id, response });
    if (!refreshed) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, data: refreshed });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }
}

export async function rsvpEventPublic(req: Request, res: Response) {
  try {
    const { token, response } = req.query;

    if (!token || !response) {
      return res.status(400).json({ success: false, message: 'Missing token or response' });
    }

    const updatedAttendee = await calendarAttendeeService.rsvpEventPublic({
      token: String(token),
      response: response as 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
    });

    res.json({
      success: true,
      data: {
        message: `Successfully ${response} the event invitation`,
        event: updatedAttendee.event,
      },
    });
  } catch (error: unknown) {
    if (error instanceof CalendarServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    await logger.error('Failed to process public RSVP', {
      operation: 'calendar_process_public_rsvp',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * ICS import/export remain controller-owned (Phase 1D).
 * Import uses activity + realtime adapters only; full ICS service extraction is Phase 1E+.
 */
export async function importIcsEvents(req: Request, res: Response) {
  try {
    const { calendarId, icsContent } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId || !calendarId || !icsContent) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const calendar = await prisma.calendar.findFirst({
      where: { id: calendarId }
    });

    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Calendar not found' });
    }

    const hasAccess = calendar.contextType === 'PERSONAL' && calendar.contextId === userId ||
                     calendar.contextType === 'BUSINESS' && calendar.contextId === userId ||
                     calendar.contextType === 'HOUSEHOLD' && calendar.contextId === userId;

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const lines = icsContent.split('\n');
    const events: Array<Record<string, string>> = [];
    let currentEvent: Record<string, string> = {};
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

    const createdEvents = [];
    for (const event of events) {
      try {
        let startAt: Date;
        let endAt: Date;
        let allDay = false;

        if (event.dtstart.length === 8) {
          allDay = true;
          startAt = new Date(
            parseInt(event.dtstart.slice(0, 4)),
            parseInt(event.dtstart.slice(4, 6)) - 1,
            parseInt(event.dtstart.slice(6, 8))
          );
        } else {
          startAt = new Date(event.dtstart);
          allDay = false;
        }

        if (event.dtend) {
          if (event.dtend.length === 8) {
            endAt = new Date(
              parseInt(event.dtend.slice(0, 4)),
              parseInt(event.dtend.slice(4, 6)) - 1,
              parseInt(event.dtend.slice(6, 8))
            );
          } else {
            endAt = new Date(event.dtend);
          }
        } else {
          endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
        }

        const newEvent = await prisma.event.create({
          data: {
            calendarId,
            title: event.summary,
            description: event.description || '',
            location: event.location || '',
            startAt,
            endAt,
            allDay,
            timezone: 'UTC',
            recurrenceRule: event.rrule || undefined,
            createdById: userId
          }
        });

        createdEvents.push(newEvent);

        await recordEventImported({
          actorUserId: userId,
          eventId: newEvent.id,
          calendarId,
          title: newEvent.title,
        });

      } catch (error) {
        await logger.error('Failed to create event from ICS', {
          operation: 'calendar_create_from_ics',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
      }
    }

    if (createdEvents.length > 0) {
      const last = createdEvents[createdEvents.length - 1];
      broadcastCalendarEventCreated([userId], last as Record<string, unknown>);
    }

    res.json({
      success: true,
      data: {
        imported: createdEvents.length,
        events: createdEvents
      }
    });

  } catch (error) {
    await logger.error('Failed to import ICS events', {
      operation: 'calendar_import_ics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function exportIcsEvents(req: Request, res: Response) {
  try {
    const { start, end, calendarIds, contexts } = req.query;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      startAt: { gte: new Date(start as string) },
      endAt: { lte: new Date(end as string) }
    };

    if (calendarIds) {
      const calendarIdArray = Array.isArray(calendarIds) ? calendarIds : [calendarIds];
      where.calendarId = { in: calendarIdArray as string[] };
    }

    if (contexts) {
      const contextArray = Array.isArray(contexts) ? contexts : [contexts];
      const dashboardContexts = [];

      for (const contextId of contextArray) {
        const dashboard = await prisma.dashboard.findUnique({
          where: { id: contextId as string },
          select: {
            businessId: true,
            institutionId: true,
            householdId: true
          }
        });

        if (dashboard) {
          if (dashboard.businessId) {
            dashboardContexts.push({ contextType: 'BUSINESS', contextId: dashboard.businessId });
          } else if (dashboard.institutionId) {
            dashboardContexts.push({ contextType: 'BUSINESS', contextId: dashboard.institutionId });
          } else if (dashboard.householdId) {
            dashboardContexts.push({ contextType: 'HOUSEHOLD', contextId: dashboard.householdId });
          } else {
            dashboardContexts.push({ contextType: 'PERSONAL', contextId: userId });
          }
        } else {
          dashboardContexts.push({ contextType: 'PERSONAL', contextId: userId });
        }
      }

      if (dashboardContexts.length > 0) {
        where.calendar = {
          OR: dashboardContexts
        };
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        calendar: true,
        attendees: true,
        reminders: true
      }
    });

    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Vssyl//Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    const timezones = new Set<string>();
    events.forEach(event => {
      if (event.timezone && event.timezone !== 'UTC') {
        timezones.add(event.timezone);
      }
    });

    timezones.forEach(timezone => {
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

    events.forEach(event => {
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

      event.attendees.forEach(attendee => {
        icsContent += `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=${attendee.response || 'NEEDS-ACTION'}:mailto:${attendee.email}\r\n`;
      });

      event.reminders.forEach(reminder => {
        icsContent += 'BEGIN:VALARM\r\n';
        icsContent += `TRIGGER:-PT${reminder.minutesBefore}M\r\n`;
        icsContent += 'ACTION:DISPLAY\r\n';
        icsContent += `DESCRIPTION:${event.title}\r\n`;
        icsContent += 'END:VALARM\r\n';
      });

      icsContent += 'END:VEVENT\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="calendar-export-${new Date().toISOString().slice(0, 10)}.ics"`);

    res.send(icsContent);

  } catch (error) {
    await logger.error('Failed to export ICS events', {
      operation: 'calendar_export_ics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getFreeBusy(req: Request, res: Response) {
  try {
    const { start, end, calendarIds, attendeeEmails } = req.query;
    const userId = getUserId(req);

    if (!userId || !start || !end) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const data = await calendarVisibilityService.getFreeBusy({
      userId,
      start: String(start),
      end: String(end),
      calendarIds: queryStringOrStringArray(calendarIds),
      attendeeEmails: queryStringOrStringArray(attendeeEmails),
    });

    res.json({ success: true, data });
  } catch (error) {
    await logger.error('Failed to get free-busy', {
      operation: 'calendar_get_free_busy',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
