import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';
import { AuditService } from '../services/auditService';
import { sendCalendarInviteEmail, sendCalendarUpdateEmail, sendCalendarCancelEmail } from '../services/emailService';
import { createRsvpToken, validateRsvpToken } from '../utils/tokenUtils';
import { logger } from '../lib/logger';
import { emitCalendarEventCreatedEvent } from '../events/domainEventEmitters';
import { CalendarServiceError } from '../services/calendar/calendarErrors';
import * as calendarAttendeeService from '../services/calendarAttendeeService';
import * as calendarEventService from '../services/calendarEventService';
import * as calendarService from '../services/calendarService';
import * as calendarVisibilityService from '../services/calendarVisibilityService';

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

  let event;
  let cal;
  try {
    const result = await calendarEventService.createEvent({
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
    event = result.event;
    cal = result.calendar;
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }

  emitCalendarEventCreatedEvent({
    actorUserId: userId,
    eventId: event.id,
    calendarId: event.calendarId,
    allDay: event.allDay,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    businessId: cal.contextType === 'BUSINESS' ? cal.contextId : null,
    householdId: cal.contextType === 'HOUSEHOLD' ? cal.contextId : null,
  });

  res.status(201).json({ success: true, data: event });
  // Audit: event created
  try {
    await AuditService.logBlockIdAction(userId, 'CALENDAR_EVENT_CREATED', `Event created: ${event.title}`, {
      eventId: event.id,
      calendarId: event.calendarId,
      startAt: event.startAt,
      endAt: event.endAt,
    });
  } catch {}
  // Realtime: broadcast create to calendar members
  try {
    const members = await prisma.calendarMember.findMany({ where: { calendarId }, select: { userId: true } });
    const socket = getChatSocketService();
    const payload = { type: 'event', action: 'created', event };
    for (const m of members) {
      socket.broadcastToUser(m.userId, 'calendar_event', payload);
    }
  } catch (e) {
    await logger.error('Failed to broadcast calendar event creation', {
      operation: 'calendar_broadcast_create',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
  // Send email invites (MVP): email-only attendees
  try {
    const attendeeEmails = (attendees || []).map((a: Record<string, any>) => a.email).filter(Boolean);
    if (attendeeEmails.length > 0) {
      // Build richer ICS with organizer/attendees/rrule
      const dtStart = new Date(event.startAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const dtEnd = new Date(event.endAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const organizer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      const icsLines: string[] = [];
      icsLines.push('BEGIN:VCALENDAR');
      icsLines.push('VERSION:2.0');
      icsLines.push('METHOD:REQUEST');
      icsLines.push('PRODID:-//Vssyl//Calendar//EN');
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${event.id}`);
      icsLines.push(`DTSTART:${dtStart}`);
      icsLines.push(`DTEND:${dtEnd}`);
      icsLines.push(`SUMMARY:${event.title}`);
      if (event.location) icsLines.push(`LOCATION:${event.location}`);
      if (organizer?.email) {
        const cn = organizer.name ? `;CN=${organizer.name}` : '';
        icsLines.push(`ORGANIZER${cn}:MAILTO:${organizer.email}`);
      }
      if ((event as any).recurrenceRule) icsLines.push(`RRULE:${(event as any).recurrenceRule}`);
      for (const email of attendeeEmails) {
        icsLines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT:MAILTO:${email}`);
      }
      icsLines.push('END:VEVENT');
      icsLines.push('END:VCALENDAR');
      const ics = icsLines.join('\r\n');
      // Create RSVP tokens for attendees
      const { createRsvpToken } = await import('../utils/tokenUtils');
      for (const attendee of attendees) {
        if (attendee.email) {
          const token = createRsvpToken(event.id, attendee.email, 'NEEDS_ACTION');
          // TODO: Send email with RSVP link
        }
      }
      for (const email of attendeeEmails) {
        await sendCalendarInviteEmail({
          toEmail: email,
          subject: `Invitation: ${event.title}`,
          bodyHtml: `<p>You are invited to: <strong>${event.title}</strong></p>`,
          icsContent: ics,
        });
      }
    }
  } catch (e) {
    await logger.error('Failed to send calendar invites', {
      operation: 'calendar_send_invites',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
}

export async function updateEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const data = req.body || {};

  let updateResult;
  try {
    updateResult = await calendarEventService.updateEvent({
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
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }

  if (updateResult.type === 'occurrence_exception') {
    return res.json({ success: true, data: updateResult.event });
  }

  const refreshed = updateResult.event;
  if (!refreshed) return res.status(404).json({ error: 'Not found' });

  res.json({ success: true, data: refreshed });
  // Audit: event updated
  try {
    await AuditService.logBlockIdAction(userId, 'CALENDAR_EVENT_UPDATED', `Event updated: ${refreshed?.title}`, {
      eventId: id,
    });
  } catch {}
  // Realtime: broadcast update
  try {
    const members = await prisma.calendarMember.findMany({
      where: { calendarId: refreshed.calendarId },
      select: { userId: true },
    });
    const socket = getChatSocketService();
    const payload = { type: 'event', action: 'updated', event: refreshed };
    for (const m of members) {
      socket.broadcastToUser(m.userId, 'calendar_event', payload);
    }
  } catch (e) {
    await logger.error('Failed to broadcast calendar event update', {
      operation: 'calendar_broadcast_update',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
  // Email updates to email-only attendees (simple MVP)
  try {
    if (refreshed) {
      const attendeeEmails = (await prisma.eventAttendee.findMany({ where: { eventId: refreshed.id, email: { not: null } }, select: { email: true } }))
        .map(a => a.email).filter(Boolean) as string[];
      if (attendeeEmails.length > 0) {
        const dtStart = new Date(refreshed.startAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
        const dtEnd = new Date(refreshed.endAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
        const organizer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
        const icsLines: string[] = [];
        icsLines.push('BEGIN:VCALENDAR');
        icsLines.push('VERSION:2.0');
        icsLines.push('METHOD:UPDATE');
        icsLines.push('PRODID:-//Vssyl//Calendar//EN');
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:${refreshed.id}`);
        icsLines.push(`DTSTART:${dtStart}`);
        icsLines.push(`DTEND:${dtEnd}`);
        icsLines.push(`SUMMARY:${refreshed.title}`);
        if (refreshed.location) icsLines.push(`LOCATION:${refreshed.location}`);
        if ((refreshed as any).recurrenceRule) icsLines.push(`RRULE:${(refreshed as any).recurrenceRule}`);
        if (organizer?.email) {
          const cn = organizer.name ? `;CN=${organizer.name}` : '';
          icsLines.push(`ORGANIZER${cn}:MAILTO:${organizer.email}`);
        }
        icsLines.push('END:VEVENT');
        icsLines.push('END:VCALENDAR');
        const ics = icsLines.join('\r\n');
        // Send update email to each attendee
        for (const attendeeEmail of attendeeEmails) {
          await sendCalendarUpdateEmail({
            toEmail: attendeeEmail,
            subject: `Updated: ${refreshed.title}`,
            bodyHtml: `<p>Event updated: <strong>${refreshed.title}</strong></p>`,
            icsContent: ics,
          });
        }
      }
    }
  } catch (e) {
    await logger.error('Failed to send calendar update emails', {
      operation: 'calendar_send_update_emails',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const editMode = req.query.editMode as 'THIS' | 'SERIES' | undefined;
  const occurrenceStartAt = typeof req.query.occurrenceStartAt === 'string' ? req.query.occurrenceStartAt : undefined;

  let deleteResult;
  try {
    deleteResult = await calendarEventService.deleteEvent({
      userId,
      eventId: id,
      editMode,
      occurrenceStartAt,
    });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }

  if (deleteResult.type === 'canceled_occurrence') {
    return res.json({ success: true });
  }

  const ev = deleteResult.event;
  res.json({ success: true });
  // Audit: event deleted
  try {
    await AuditService.logBlockIdAction(userId, 'CALENDAR_EVENT_DELETED', `Event deleted: ${id}`, { eventId: id });
  } catch {}
  // Realtime: broadcast delete
  try {
    const members = await prisma.calendarMember.findMany({ where: { calendarId: ev.calendarId }, select: { userId: true } });
    const socket = getChatSocketService();
    const payload = { type: 'event', action: 'deleted', event: { id } };
    for (const m of members) {
      socket.broadcastToUser(m.userId, 'calendar_event', payload);
    }
  } catch (e) {
    await logger.error('Failed to broadcast calendar event delete', {
      operation: 'calendar_broadcast_delete',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
  // Email cancellation to email-only attendees
  try {
    const attendeeEmails = (await prisma.eventAttendee.findMany({ where: { eventId: id, email: { not: null } }, select: { email: true } }))
      .map(a => a.email).filter(Boolean) as string[];
    if (attendeeEmails.length > 0) {
      const icsLines: string[] = [];
      icsLines.push('BEGIN:VCALENDAR');
      icsLines.push('VERSION:2.0');
      icsLines.push('METHOD:CANCEL');
      icsLines.push('PRODID:-//Vssyl//Calendar//EN');
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${id}`);
      icsLines.push('STATUS:CANCELLED');
      icsLines.push('END:VEVENT');
      icsLines.push('END:VCALENDAR');
      const ics = icsLines.join('\r\n');
      // Send cancellation email to each attendee
      for (const attendeeEmail of attendeeEmails) {
        await sendCalendarCancelEmail({
          toEmail: attendeeEmail,
          subject: `Cancelled: Event`,
          bodyHtml: `<p>An event has been cancelled.</p>`,
          icsContent: ics,
        });
      }
    }
  } catch (e) {
    await logger.error('Failed to send calendar cancellation emails', {
      operation: 'calendar_send_cancel_emails',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
}

export async function rsvpEvent(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { response } = req.body as { response: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' };

  let refreshed;
  try {
    refreshed = await calendarAttendeeService.rsvpEvent({ userId, eventId: id, response });
  } catch (e: unknown) {
    const handled = respondCalendarServiceError(res, e);
    if (handled) return handled;
    throw e;
  }

  if (!refreshed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: refreshed });
  // Realtime: broadcast RSVP change
  try {
    if (refreshed) {
      const members = await prisma.calendarMember.findMany({ where: { calendarId: refreshed.calendarId }, select: { userId: true } });
      const socket = getChatSocketService();
      const payload = { type: 'event', action: 'updated', event: refreshed };
      for (const m of members) {
        socket.broadcastToUser(m.userId, 'calendar_event', payload);
      }
    }
  } catch (e) {
    await logger.error('Failed to broadcast RSVP update', {
      operation: 'calendar_broadcast_rsvp',
      error: {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    });
  }
}

export async function rsvpEventPublic(req: Request, res: Response) {
  try {
    const { token, response } = req.query;
    
    if (!token || !response) {
      return res.status(400).json({ success: false, message: 'Missing token or response' });
    }
    
    // Validate token
    const rsvpToken = await validateRsvpToken(token as string);
    if (!rsvpToken) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Update attendee response
    const updatedAttendee = await prisma.eventAttendee.update({
      where: {
        id: rsvpToken.id, // Use the RsvpToken id instead of a non-existent unique constraint
      },
      data: {
        response: response as 'ACCEPTED' | 'DECLINED' | 'TENTATIVE',
      },
      include: {
        event: {
          include: {
            calendar: true,
          },
        },
      },
    });
    
    // Delete used token
    await prisma.rsvpToken.delete({
      where: { token: token as string },
    });
    
    // Send realtime update
    const chatSocket = getChatSocketService();
    if (chatSocket) {
      chatSocket.broadcastToUser(rsvpToken.event.createdById || '', 'calendar_event', {
        type: 'event',
        action: 'updated',
        event: updatedAttendee.event,
      });
    }
    
    // Send confirmation email to organizer
    if (updatedAttendee.event.createdById) {
      const organizer = await prisma.user.findUnique({
        where: { id: updatedAttendee.event.createdById },
      });
      
      if (organizer?.email) {
        const responseText = response === 'ACCEPTED' ? 'accepted' : response === 'DECLINED' ? 'declined' : 'tentatively accepted';
        await sendCalendarInviteEmail({
          toEmail: organizer.email,
          subject: `${rsvpToken.attendeeEmail} ${responseText} your event invitation`,
          bodyHtml: `
            <h2>RSVP Response</h2>
            <p>${rsvpToken.attendeeEmail} has ${responseText} your event invitation for "${updatedAttendee.event.title}".</p>
            <p>Event: ${updatedAttendee.event.title}</p>
            <p>Date: ${new Date(updatedAttendee.event.startAt).toLocaleString()}</p>
            <p>Response: ${responseText}</p>
          `,
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        message: `Successfully ${response} the event invitation`,
        event: updatedAttendee.event,
      },
    });
    
  } catch (error) {
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

export async function importIcsEvents(req: Request, res: Response) {
  try {
    const { calendarId, icsContent } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId || !calendarId || !icsContent) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Verify user has access to calendar
    const calendar = await prisma.calendar.findFirst({
      where: { id: calendarId }
    });
    
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Calendar not found' });
    }
    
    // Check permissions (simplified - user must own the calendar or have access via context)
    const hasAccess = calendar.contextType === 'PERSONAL' && calendar.contextId === userId ||
                     calendar.contextType === 'BUSINESS' && calendar.contextId === userId ||
                     calendar.contextType === 'HOUSEHOLD' && calendar.contextId === userId;
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Parse ICS content
    const lines = icsContent.split('\n');
    const events = [];
    let currentEvent: Record<string, any> = {};
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
    
    // Create events
    const createdEvents = [];
    for (const event of events) {
      try {
        // Parse dates
        let startAt: Date, endAt: Date;
        let allDay = false;
        
        if (event.dtstart.length === 8) {
          // All-day event (YYYYMMDD format)
          allDay = true;
          startAt = new Date(
            parseInt(event.dtstart.slice(0, 4)),
            parseInt(event.dtstart.slice(4, 6)) - 1,
            parseInt(event.dtstart.slice(6, 8))
          );
        } else {
          // Timed event
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
          // Default to 1 hour duration
          endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
        }
        
        // Create event
        const newEvent = await prisma.event.create({
          data: {
            calendarId,
            title: event.summary,
            description: event.description || '',
            location: event.location || '',
            startAt,
            endAt,
            allDay,
            timezone: 'UTC', // Default timezone
            recurrenceRule: event.rrule || undefined,
            createdById: userId
          }
        });
        
        createdEvents.push(newEvent);
        
        // Audit log
        await AuditService.logBlockIdAction(userId, 'calendar_event_imported', `Event imported: ${newEvent.title}`, {
          eventId: newEvent.id,
          calendarId,
          source: 'ics_import'
        });
        
      } catch (error) {
        await logger.error('Failed to create event from ICS', {
          operation: 'calendar_create_from_ics',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        // Continue with other events
      }
    }
    
    // Send realtime update
    const chatSocket = getChatSocketService();
    if (chatSocket) {
      chatSocket.broadcastToUser(userId, 'calendar_event', {
        type: 'event',
        action: 'created',
        event: createdEvents[createdEvents.length - 1] // Send last created event
      });
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
    
    // Build query
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
      
      // Handle dashboard IDs - look up the dashboard to determine context type
      const dashboardContexts = [];
      
      for (const contextId of contextArray) {
        // Check if this is a dashboard ID by looking up the dashboard
        const dashboard = await prisma.dashboard.findUnique({
          where: { id: contextId as string },
          select: { 
            businessId: true, 
            institutionId: true, 
            householdId: true 
          }
        });
        
        if (dashboard) {
          // Determine context type based on dashboard relationships
          if (dashboard.businessId) {
            dashboardContexts.push({ contextType: 'BUSINESS', contextId: dashboard.businessId });
          } else if (dashboard.institutionId) {
            // Educational institutions don't have a specific context type, 
            // so we'll use BUSINESS context type as a fallback
            dashboardContexts.push({ contextType: 'BUSINESS', contextId: dashboard.institutionId });
          } else if (dashboard.householdId) {
            dashboardContexts.push({ contextType: 'HOUSEHOLD', contextId: dashboard.householdId });
          } else {
            // Personal dashboard - use user ID as context
            dashboardContexts.push({ contextType: 'PERSONAL', contextId: userId });
          }
        } else {
          // Fallback: treat as personal context if dashboard not found
          dashboardContexts.push({ contextType: 'PERSONAL', contextId: userId });
        }
      }
      
      if (dashboardContexts.length > 0) {
        where.calendar = {
          OR: dashboardContexts
        };
      }
    }
    
    // Get events
    const events = await prisma.event.findMany({
      where,
      include: {
        calendar: true,
        attendees: true,
        reminders: true
      }
    });
    
    // Build ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Vssyl//Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    
    // Add VTIMEZONE definitions for events
    const timezones = new Set<string>();
    events.forEach(event => {
      if (event.timezone && event.timezone !== 'UTC') {
        timezones.add(event.timezone);
      }
    });
    
    timezones.forEach(timezone => {
      icsContent += 'BEGIN:VTIMEZONE\r\n';
      icsContent += `TZID:${timezone}\r\n`;
      // Add basic DST rules (simplified)
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
    
    // Add events
    events.forEach(event => {
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${event.id}\r\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      
      // Start time
      if (event.allDay) {
        icsContent += `DTSTART;VALUE=DATE:${new Date(event.startAt).toISOString().slice(0, 10).replace(/-/g, '')}\r\n`;
      } else {
        icsContent += `DTSTART;TZID=${event.timezone}:${new Date(event.startAt).toISOString().replace(/[-:]/g, '').split('.')[0]}\r\n`;
      }
      
      // End time
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
      
      // Add attendees
      event.attendees.forEach(attendee => {
        icsContent += `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=${attendee.response || 'NEEDS-ACTION'}:mailto:${attendee.email}\r\n`;
      });
      
      // Add reminders
      event.reminders.forEach(reminder => {
        icsContent += `BEGIN:VALARM\r\n`;
        icsContent += `TRIGGER:-PT${reminder.minutesBefore}M\r\n`;
        icsContent += `ACTION:DISPLAY\r\n`;
        icsContent += `DESCRIPTION:${event.title}\r\n`;
        icsContent += `END:VALARM\r\n`;
      });
      
      icsContent += 'END:VEVENT\r\n';
    });
    
    icsContent += 'END:VCALENDAR\r\n';
    
    // Set response headers for download
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

