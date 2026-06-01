import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import { eventWithRelationsInclude } from './calendar/calendarIncludes';
import { getCalendarForWrite } from './calendarPermissionService';
import {
  recordEventPermanentlyDeleted,
  recordEventRestored,
  recordEventTrashed,
} from './calendarActivityService';
import {
  recordCalendarEventPermanentlyDeletedDomainEvent,
  recordCalendarEventRestoredDomainEvent,
  recordCalendarEventTrashedDomainEvent,
} from './calendarDomainEventService';
import {
  resolveCalendarMemberUserIds,
  sendEventCanceledEmails,
} from './calendarNotificationService';
import {
  broadcastCalendarEventDeleted,
  broadcastCalendarEventUpdated,
} from './calendarRealtimeService';

export class CalendarTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'CalendarTrashError';
  }
}

export type CalendarTrashItemType = 'event';

export interface CalendarTrashMutationInput {
  userId: string;
  type: CalendarTrashItemType;
  id: string;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: 'event';
  moduleId: 'calendar';
  moduleName: 'Calendar';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface SoftTrashCalendarEventResult {
  id: string;
  calendarId: string;
  title: string;
}

function mapCalendarServiceError(error: unknown): never {
  if (error instanceof CalendarServiceError) {
    if (error.code === 'forbidden') {
      throw new CalendarTrashError('Forbidden', 'forbidden');
    }
    if (error.code === 'not_found') {
      throw new CalendarTrashError('Not found', 'not_found');
    }
  }
  throw error;
}

export async function softTrashCalendarEvent(params: {
  userId: string;
  eventId: string;
}): Promise<SoftTrashCalendarEventResult> {
  const ev = await prisma.event.findFirst({
    where: { id: params.eventId, trashedAt: null },
  });
  if (!ev) {
    throw new CalendarTrashError('Event not found', 'not_found');
  }

  let cal: { contextType: string; contextId: string };
  try {
    cal = await getCalendarForWrite(ev.calendarId, params.userId);
  } catch (error: unknown) {
    mapCalendarServiceError(error);
  }

  const updated = await prisma.event.updateMany({
    where: { id: params.eventId, trashedAt: null },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new CalendarTrashError('Event not found or already trashed', 'not_found');
  }

  const memberIds = await resolveCalendarMemberUserIds(ev.calendarId);
  broadcastCalendarEventDeleted(memberIds, ev.id);

  await recordEventTrashed({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
  });

  recordCalendarEventTrashedDomainEvent({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
    calendar: cal,
  });

  await sendEventCanceledEmails({ eventId: ev.id });

  return { id: ev.id, calendarId: ev.calendarId, title: ev.title };
}

export async function restoreCalendarEvent(params: {
  userId: string;
  eventId: string;
}): Promise<boolean> {
  const ev = await prisma.event.findFirst({
    where: { id: params.eventId, trashedAt: { not: null } },
  });
  if (!ev) {
    return false;
  }

  let cal: { contextType: string; contextId: string };
  try {
    cal = await getCalendarForWrite(ev.calendarId, params.userId);
  } catch (error: unknown) {
    mapCalendarServiceError(error);
  }

  const updated = await prisma.event.updateMany({
    where: { id: params.eventId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  const refreshed = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: eventWithRelationsInclude,
  });

  if (refreshed) {
    const memberIds = await resolveCalendarMemberUserIds(ev.calendarId);
    broadcastCalendarEventUpdated(memberIds, refreshed as Record<string, unknown>);
  }

  await recordEventRestored({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
  });

  recordCalendarEventRestoredDomainEvent({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
    calendar: cal,
  });

  return true;
}

export async function permanentlyDeleteCalendarEvent(params: {
  userId: string;
  eventId: string;
}): Promise<boolean> {
  const ev = await prisma.event.findFirst({
    where: { id: params.eventId, trashedAt: { not: null } },
  });
  if (!ev) {
    return false;
  }

  let cal: { contextType: string; contextId: string };
  try {
    cal = await getCalendarForWrite(ev.calendarId, params.userId);
  } catch (error: unknown) {
    mapCalendarServiceError(error);
  }

  const deleted = await prisma.event.deleteMany({
    where: { id: params.eventId, trashedAt: { not: null } },
  });

  if (deleted.count === 0) {
    return false;
  }

  const memberIds = await resolveCalendarMemberUserIds(ev.calendarId);
  broadcastCalendarEventDeleted(memberIds, ev.id);

  await recordEventPermanentlyDeleted({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
  });

  recordCalendarEventPermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    eventId: ev.id,
    calendarId: ev.calendarId,
    calendar: cal,
  });

  return true;
}

export async function softTrashCalendarItem(input: CalendarTrashMutationInput): Promise<void> {
  if (input.type !== 'event') {
    throw new CalendarTrashError(`Unsupported calendar trash type: ${input.type}`, 'invalid');
  }
  await softTrashCalendarEvent({ userId: input.userId, eventId: input.id });
}

export async function restoreCalendarItem(input: CalendarTrashMutationInput): Promise<boolean> {
  if (input.type !== 'event') {
    return false;
  }
  return restoreCalendarEvent({ userId: input.userId, eventId: input.id });
}

export async function permanentlyDeleteCalendarItem(
  input: CalendarTrashMutationInput
): Promise<boolean> {
  if (input.type !== 'event') {
    return false;
  }
  return permanentlyDeleteCalendarEvent({ userId: input.userId, eventId: input.id });
}

export async function listTrashedCalendarEventsForGlobalTrash(
  userId: string
): Promise<GlobalTrashListItem[]> {
  const events = await prisma.event.findMany({
    where: {
      trashedAt: { not: null },
      calendar: {
        members: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      calendar: {
        select: { name: true },
      },
    },
    orderBy: { trashedAt: 'desc' },
  });

  return events.map((event) => ({
    id: event.id,
    name: event.title,
    type: 'event' as const,
    moduleId: 'calendar' as const,
    moduleName: 'Calendar' as const,
    trashedAt: event.trashedAt,
    metadata: {
      calendarName: event.calendar.name,
    },
  }));
}

export async function emptyCalendarTrash(input: { userId: string }): Promise<number> {
  const trashedEvents = await prisma.event.findMany({
    where: {
      trashedAt: { not: null },
      calendar: {
        members: {
          some: {
            userId: input.userId,
            role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
          },
        },
      },
    },
    select: { id: true },
  });

  let deletedCount = 0;
  for (const event of trashedEvents) {
    const deleted = await permanentlyDeleteCalendarEvent({
      userId: input.userId,
      eventId: event.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }
  return deletedCount;
}
