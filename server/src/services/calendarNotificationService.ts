import { prisma } from '../lib/prisma';
import {
  sendCalendarCancelEmail,
  sendCalendarInviteEmail,
  sendCalendarUpdateEmail,
} from './emailService';
import { NotificationService } from './notificationService';
import { logger } from '../lib/logger';
import type { CalendarAttendeeInput } from './calendar/calendarTypes';

export async function resolveCalendarMemberUserIds(calendarId: string): Promise<string[]> {
  const members = await prisma.calendarMember.findMany({
    where: { calendarId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

type EventEmailShape = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  recurrenceRule?: string | null;
};

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function loadOrganizer(userId: string): Promise<{ name: string | null; email: string | null } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
}

export function buildInviteIcsContent(params: {
  event: EventEmailShape;
  organizer?: { name: string | null; email: string | null } | null;
  attendeeEmails: string[];
  method: 'REQUEST' | 'UPDATE' | 'CANCEL';
}): string {
  const { event, organizer, attendeeEmails, method } = params;
  const dtStart = formatIcsDate(new Date(event.startAt));
  const dtEnd = formatIcsDate(new Date(event.endAt));
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push(`METHOD:${method}`);
  lines.push('PRODID:-//Vssyl//Calendar//EN');
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${event.id}`);
  if (method !== 'CANCEL') {
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${event.title}`);
    if (event.location) lines.push(`LOCATION:${event.location}`);
  }
  if (method === 'CANCEL') {
    lines.push('STATUS:CANCELLED');
  }
  if (event.recurrenceRule && method !== 'CANCEL') {
    lines.push(`RRULE:${event.recurrenceRule}`);
  }
  if (organizer?.email && method !== 'CANCEL') {
    const cn = organizer.name ? `;CN=${organizer.name}` : '';
    lines.push(`ORGANIZER${cn}:MAILTO:${organizer.email}`);
  }
  if (method !== 'CANCEL') {
    for (const email of attendeeEmails) {
      lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT:MAILTO:${email}`);
    }
  }
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function sendEventCreatedInviteEmails(params: {
  actorUserId: string;
  event: EventEmailShape;
  attendees?: CalendarAttendeeInput[];
}): Promise<void> {
  const attendeeEmails = (params.attendees ?? [])
    .map((a) => a.email)
    .filter((email): email is string => Boolean(email));
  if (attendeeEmails.length === 0) return;

  try {
    const organizer = await loadOrganizer(params.actorUserId);
    const ics = buildInviteIcsContent({
      event: params.event,
      organizer,
      attendeeEmails,
      method: 'REQUEST',
    });

    for (const email of attendeeEmails) {
      await sendCalendarInviteEmail({
        toEmail: email,
        subject: `Invitation: ${params.event.title}`,
        bodyHtml: `<p>You are invited to: <strong>${params.event.title}</strong></p>`,
        icsContent: ics,
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to send calendar invites', {
      operation: 'calendar_send_invites',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function sendEventUpdatedEmails(params: {
  actorUserId: string;
  event: EventEmailShape;
}): Promise<void> {
  try {
    const attendeeEmails = (
      await prisma.eventAttendee.findMany({
        where: { eventId: params.event.id, email: { not: null } },
        select: { email: true },
      })
    )
      .map((a) => a.email)
      .filter((email): email is string => Boolean(email));

    if (attendeeEmails.length === 0) return;

    const organizer = await loadOrganizer(params.actorUserId);
    const ics = buildInviteIcsContent({
      event: params.event,
      organizer,
      attendeeEmails,
      method: 'UPDATE',
    });

    for (const attendeeEmail of attendeeEmails) {
      await sendCalendarUpdateEmail({
        toEmail: attendeeEmail,
        subject: `Updated: ${params.event.title}`,
        bodyHtml: `<p>Event updated: <strong>${params.event.title}</strong></p>`,
        icsContent: ics,
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to send calendar update emails', {
      operation: 'calendar_send_update_emails',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function sendEventCanceledEmails(params: {
  eventId: string;
}): Promise<void> {
  try {
    const attendeeEmails = (
      await prisma.eventAttendee.findMany({
        where: { eventId: params.eventId, email: { not: null } },
        select: { email: true },
      })
    )
      .map((a) => a.email)
      .filter((email): email is string => Boolean(email));

    if (attendeeEmails.length === 0) return;

    const ics = buildInviteIcsContent({
      event: { id: params.eventId, title: '', startAt: new Date(), endAt: new Date() },
      attendeeEmails: [],
      method: 'CANCEL',
    });

    for (const attendeeEmail of attendeeEmails) {
      await sendCalendarCancelEmail({
        toEmail: attendeeEmail,
        subject: 'Cancelled: Event',
        bodyHtml: '<p>An event has been cancelled.</p>',
        icsContent: ics,
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to send calendar cancellation emails', {
      operation: 'calendar_send_cancel_emails',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function sendPublicRsvpOrganizerEmail(params: {
  organizerUserId: string;
  attendeeEmail: string;
  eventTitle: string;
  eventStartAt: Date;
  response: string;
}): Promise<void> {
  try {
    const organizer = await loadOrganizer(params.organizerUserId);
    if (!organizer?.email) return;

    const responseText =
      params.response === 'ACCEPTED'
        ? 'accepted'
        : params.response === 'DECLINED'
          ? 'declined'
          : 'tentatively accepted';

    await sendCalendarInviteEmail({
      toEmail: organizer.email,
      subject: `${params.attendeeEmail} ${responseText} your event invitation`,
      bodyHtml: `
            <h2>RSVP Response</h2>
            <p>${params.attendeeEmail} has ${responseText} your event invitation for "${params.eventTitle}".</p>
            <p>Event: ${params.eventTitle}</p>
            <p>Date: ${params.eventStartAt.toLocaleString()}</p>
            <p>Response: ${responseText}</p>
          `,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to send public RSVP organizer email', {
      operation: 'calendar_public_rsvp_email',
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyReminderDue(params: {
  recipientUserId: string;
  eventId: string;
  calendarId: string;
  reminderId: string;
  title: string;
  startAt: Date;
}): Promise<void> {
  try {
    await NotificationService.createNotification({
      userId: params.recipientUserId,
      type: 'calendar_reminder',
      title: `Reminder: ${params.title}`,
      body: `Starts at ${params.startAt.toLocaleString()}`,
      data: {
        eventId: params.eventId,
        calendarId: params.calendarId,
        reminderId: params.reminderId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to send reminder notification', {
      operation: 'calendar_reminder_notification',
      error: { message: err.message, stack: err.stack },
    });
  }
}
