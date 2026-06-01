import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import type {
  CalendarAttendeeInput,
  CalendarReminderInput,
  CreateEventInput,
  DeleteEventInput,
  UpdateEventInput,
} from './calendar/calendarTypes';
import { eventWithRelationsInclude } from './calendar/calendarIncludes';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateCalendarPolicyDual } from '../auth/calendarPolicyDual';
import { getCalendarForWrite } from './calendarPermissionService';
import {
  createCanceledOccurrenceException,
  createOccurrenceExceptionForUpdate,
  shouldApplyThisOccurrenceDelete,
  shouldApplyThisOccurrenceEdit,
} from './calendarRecurrenceService';

function buildRemindersCreateInput(params: {
  reminders: CalendarReminderInput[] | undefined;
  allDay: boolean;
  startAt: Date;
  defaultReminderMinutes: number;
}): { create: Array<{ method: string; minutesBefore: number }> } | undefined {
  const { reminders, allDay, startAt, defaultReminderMinutes } = params;

  if (Array.isArray(reminders) && reminders.length > 0) {
    return {
      create: reminders.map((r) => ({
        method: r.method || 'APP',
        minutesBefore: r.minutesBefore ?? 10,
      })),
    };
  }

  if (allDay) {
    const reminderAt = new Date(startAt);
    reminderAt.setHours(9, 0, 0, 0);
    const minutesBefore = Math.floor((startAt.getTime() - reminderAt.getTime()) / 60000);
    return { create: [{ method: 'APP', minutesBefore }] };
  }

  return { create: [{ method: 'APP', minutesBefore: defaultReminderMinutes }] };
}

function mapAttendeesCreate(attendees: CalendarAttendeeInput[] | undefined) {
  if (attendees && Array.isArray(attendees)) {
    return {
      create: attendees.map((a) => ({
        userId: a.userId ?? null,
        email: a.email ?? null,
        response: a.response || 'NEEDS_ACTION',
      })),
    };
  }
  return { create: [] as Array<{ userId: string | null; email: string | null; response: string }> };
}

export async function createEvent(input: CreateEventInput) {
  const {
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
  } = input;

  await getCalendarForWrite(calendarId, userId);

  const createPolicyDual = await evaluateCalendarPolicyDual({
    userId,
    action: POLICY_ACTIONS.CALENDAR_EVENT_CREATE,
    resourceType: 'calendar',
    resourceId: calendarId,
  });
  if (createPolicyDual.blocked) {
    throw new CalendarServiceError('Forbidden', 'forbidden', 403);
  }

  const cal = await prisma.calendar.findUniqueOrThrow({
    where: { id: calendarId },
    select: {
      id: true,
      contextType: true,
      contextId: true,
      defaultReminderMinutes: true,
    },
  });

  const start = new Date(startAt);
  const end = new Date(endAt);
  const remindersData = buildRemindersCreateInput({
    reminders,
    allDay: Boolean(allDay),
    startAt: start,
    defaultReminderMinutes: cal.defaultReminderMinutes,
  });

  const event = await prisma.event.create({
    data: {
      calendarId,
      title,
      description,
      location,
      onlineMeetingLink,
      startAt: start,
      endAt: end,
      allDay: Boolean(allDay),
      timezone: timezone || 'UTC',
      recurrenceRule: recurrenceRule || null,
      recurrenceEndAt: recurrenceEndAt ? new Date(recurrenceEndAt) : null,
      createdById: userId,
      attendees: mapAttendeesCreate(attendees),
      reminders: remindersData,
    },
    include: eventWithRelationsInclude,
  });

  return { event, calendar: cal };
}

export type UpdateEventResult =
  | { type: 'occurrence_exception'; event: Awaited<ReturnType<typeof createOccurrenceExceptionForUpdate>> }
  | { type: 'updated'; event: Awaited<ReturnType<typeof prisma.event.findUnique>> };

export async function updateEvent(input: UpdateEventInput): Promise<UpdateEventResult> {
  const { userId, eventId, editMode = 'SERIES' } = input;
  const occurrenceStartAt = input.occurrenceStartAt ? new Date(input.occurrenceStartAt) : null;

  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }

  await getCalendarForWrite(ev.calendarId, userId);

  if (
    shouldApplyThisOccurrenceEdit(ev.recurrenceRule, editMode, occurrenceStartAt) &&
    occurrenceStartAt
  ) {
    const child = await createOccurrenceExceptionForUpdate({
      userId,
      parent: ev,
      editMode,
      occurrenceStartAt,
      patch: {
        title: input.title,
        description: input.description,
        location: input.location,
        onlineMeetingLink: input.onlineMeetingLink,
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
        allDay: input.allDay,
        timezone: input.timezone,
      },
    });
    return { type: 'occurrence_exception', event: child };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: input.title,
      description: input.description,
      location: input.location,
      onlineMeetingLink: input.onlineMeetingLink,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
      allDay: input.allDay,
      timezone: input.timezone,
      recurrenceRule: input.recurrenceRule,
      recurrenceEndAt: input.recurrenceEndAt ? new Date(input.recurrenceEndAt) : undefined,
    },
  });

  if (Array.isArray(input.attendees)) {
    await prisma.eventAttendee.deleteMany({ where: { eventId } });
    if (input.attendees.length > 0) {
      await prisma.eventAttendee.createMany({
        data: input.attendees.map((a) => ({
          eventId,
          userId: a.userId || null,
          email: a.email || null,
          response: a.response || 'NEEDS_ACTION',
        })),
      });
    }
  }

  const refreshed = await prisma.event.findUnique({
    where: { id: eventId },
    include: eventWithRelationsInclude,
  });

  return { type: 'updated', event: refreshed };
}

export type DeleteEventResult =
  | { type: 'canceled_occurrence' }
  | { type: 'trashed'; event: { id: string; calendarId: string; title: string } };

export async function deleteEvent(input: DeleteEventInput): Promise<DeleteEventResult> {
  const { userId, eventId, editMode, occurrenceStartAt } = input;

  const ev = await prisma.event.findFirst({
    where: { id: eventId, trashedAt: null },
  });
  if (!ev) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }

  await getCalendarForWrite(ev.calendarId, userId);

  if (shouldApplyThisOccurrenceDelete(ev.recurrenceRule, editMode, occurrenceStartAt ?? undefined)) {
    await createCanceledOccurrenceException({
      userId,
      parent: ev,
      occurrenceStartAt: new Date(occurrenceStartAt as string),
    });
    return { type: 'canceled_occurrence' };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { trashedAt: new Date() },
  });

  return {
    type: 'trashed',
    event: { id: ev.id, calendarId: ev.calendarId, title: ev.title },
  };
}
