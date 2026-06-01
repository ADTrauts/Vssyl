import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { CalendarServiceError } from '../services/calendar/calendarErrors';
import * as calendarAttendeeService from '../services/calendarAttendeeService';
import * as calendarEventService from '../services/calendarEventService';
import * as calendarIcsService from '../services/calendarIcsService';
import * as calendarService from '../services/calendarService';
import * as calendarVisibilityService from '../services/calendarVisibilityService';

function getUserId(req: Request): string | null {
  const user = (req as AuthenticatedRequest).user;
  return user?.id || null;
}

function respondCalendarServiceError(
  res: Response,
  error: unknown,
  shape: 'error' | 'success' = 'error'
): Response | void {
  if (error instanceof CalendarServiceError) {
    const body =
      shape === 'success'
        ? { success: false, message: error.message }
        : { error: error.message };
    return res.status(error.status).json(body);
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

    return res.json({
      success: true,
      data: {
        message: `Successfully ${response} the event invitation`,
        event: updatedAttendee.event,
      },
    });
  } catch (error: unknown) {
    const handled = respondCalendarServiceError(res, error, 'success');
    if (handled) return handled;
    await logger.error('Failed to process public RSVP', {
      operation: 'calendar_process_public_rsvp',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function importIcsEvents(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { calendarId, icsContent } = req.body;
  if (!calendarId || !icsContent) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const data = await calendarIcsService.importIcsEvents({ userId, calendarId, icsContent });
    return res.json({ success: true, data });
  } catch (error: unknown) {
    const handled = respondCalendarServiceError(res, error, 'success');
    if (handled) return handled;
    await logger.error('Failed to import ICS events', {
      operation: 'calendar_import_ics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function exportIcsEvents(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { start, end, calendarIds, contexts } = req.query;
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    const icsContent = await calendarIcsService.exportIcsEvents({
      userId,
      start: String(start),
      end: String(end),
      calendarIds: queryStringOrStringArray(calendarIds),
      contexts: queryStringOrStringArray(contexts),
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="calendar-export-${new Date().toISOString().slice(0, 10)}.ics"`);
    return res.send(icsContent);
  } catch (error: unknown) {
    const handled = respondCalendarServiceError(res, error, 'success');
    if (handled) return handled;
    await logger.error('Failed to export ICS events', {
      operation: 'calendar_export_ics',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
