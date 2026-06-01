import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import type { RsvpEventInput } from './calendar/calendarTypes';
import { eventWithRelationsInclude } from './calendar/calendarIncludes';
import { assertCalendarMember } from './calendarPermissionService';

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

  return prisma.event.findUnique({
    where: { id: eventId },
    include: eventWithRelationsInclude,
  });
}
