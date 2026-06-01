import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import type { RsvpEventInput } from './calendar/calendarTypes';
import { eventWithRelationsInclude } from './calendar/calendarIncludes';
import { assertCalendarMember } from './calendarPermissionService';
import { validateRsvpToken } from '../utils/tokenUtils';
import { recordAttendeeRsvp } from './calendarActivityService';
import { recordCalendarEventRsvpUpdatedDomainEvent } from './calendarDomainEventService';
import { resolveCalendarMemberUserIds } from './calendarNotificationService';
import { sendPublicRsvpOrganizerEmail } from './calendarNotificationService';
import { broadcastCalendarEventToUsers, broadcastCalendarEventUpdated } from './calendarRealtimeService';

export async function rsvpEvent(input: RsvpEventInput) {
  const { userId, eventId, response } = input;

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: { attendees: true },
  });
  if (!ev) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }

  await assertCalendarMember(userId, ev.calendarId);

  const existing = ev.attendees.find((a) => a.userId === userId);
  if (existing) {
    await prisma.eventAttendee.update({
      where: { id: existing.id },
      data: { response },
    });
  } else {
    await prisma.eventAttendee.create({
      data: { eventId, userId, response },
    });
  }

  const refreshed = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ...eventWithRelationsInclude,
      calendar: { select: { contextType: true, contextId: true } },
    },
  });

  if (refreshed) {
    const memberIds = await resolveCalendarMemberUserIds(refreshed.calendarId);
    broadcastCalendarEventUpdated(memberIds, refreshed as Record<string, unknown>);

    await recordAttendeeRsvp({
      actorUserId: userId,
      eventId: refreshed.id,
      calendarId: refreshed.calendarId,
      response,
    });

    recordCalendarEventRsvpUpdatedDomainEvent({
      actorUserId: userId,
      eventId: refreshed.id,
      calendarId: refreshed.calendarId,
      response,
      calendar: refreshed.calendar,
    });
  }

  return refreshed;
}

export async function rsvpEventPublic(input: {
  token: string;
  response: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}) {
  const rsvpToken = await validateRsvpToken(input.token);
  if (!rsvpToken) {
    throw new CalendarServiceError('Invalid or expired token', 'invalid', 400);
  }

  const updatedAttendee = await prisma.eventAttendee.update({
    where: { id: rsvpToken.id },
    data: { response: input.response },
    include: {
      event: {
        include: {
          calendar: { select: { contextType: true, contextId: true } },
        },
      },
    },
  });

  await prisma.rsvpToken.delete({
    where: { token: input.token },
  });

  const organizerId = updatedAttendee.event.createdById;
  if (organizerId) {
    broadcastCalendarEventToUsers([organizerId], {
      type: 'event',
      action: 'updated',
      event: updatedAttendee.event as Record<string, unknown>,
    });
  }

  if (organizerId && rsvpToken.attendeeEmail) {
    await sendPublicRsvpOrganizerEmail({
      organizerUserId: organizerId,
      attendeeEmail: rsvpToken.attendeeEmail,
      eventTitle: updatedAttendee.event.title,
      eventStartAt: updatedAttendee.event.startAt,
      response: input.response,
    });
  }

  return updatedAttendee;
}
