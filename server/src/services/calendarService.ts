import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';
import type {
  AutoProvisionCalendarInput,
  CreateCalendarInput,
  DeleteCalendarInput,
  UpdateCalendarInput,
} from './calendar/calendarTypes';
import {
  assertCalendarOwner,
  assertCalendarMember,
  enforceCalendarContextMembership,
} from './calendarPermissionService';
import {
  recordCalendarCreated,
  recordCalendarDeleted,
  recordCalendarUpdated,
} from './calendarActivityService';
import {
  recordCalendarCreatedDomainEvent,
  recordCalendarDeletedDomainEvent,
  recordCalendarUpdatedDomainEvent,
} from './calendarDomainEventService';

export async function createCalendar(input: CreateCalendarInput) {
  const {
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
  } = input;

  await enforceCalendarContextMembership(userId, contextType, contextId);

  const calendar = await prisma.calendar.create({
    data: {
      name,
      color,
      type: type as never,
      contextType: contextType as never,
      contextId,
      isPrimary: Boolean(isPrimary),
      isSystem: Boolean(isSystem),
      isDeletable: isDeletable === false ? false : true,
      defaultReminderMinutes: defaultReminderMinutes ?? 10,
      members: { create: { userId, role: 'OWNER' } },
    },
  });

  await recordCalendarCreated({
    actorUserId: userId,
    calendarId: calendar.id,
    contextType: calendar.contextType,
    contextId: calendar.contextId,
  });

  recordCalendarCreatedDomainEvent({
    actorUserId: userId,
    calendarId: calendar.id,
    contextType: calendar.contextType,
    contextId: calendar.contextId,
  });

  return calendar;
}

export async function updateCalendar(input: UpdateCalendarInput) {
  const { userId, calendarId, name, color, defaultReminderMinutes } = input;
  await assertCalendarMember(userId, calendarId);

  const calendar = await prisma.calendar.update({
    where: { id: calendarId },
    data: { name, color, defaultReminderMinutes },
  });

  await recordCalendarUpdated({
    actorUserId: userId,
    calendarId: calendar.id,
  });

  recordCalendarUpdatedDomainEvent({
    actorUserId: userId,
    calendarId: calendar.id,
    contextType: calendar.contextType,
    contextId: calendar.contextId,
  });

  return calendar;
}

export async function deleteCalendar(input: DeleteCalendarInput) {
  const { userId, calendarId } = input;

  const cal = await prisma.calendar.findUnique({ where: { id: calendarId } });
  if (!cal) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }
  if (cal.isSystem === true || cal.isDeletable === false) {
    throw new CalendarServiceError('Calendar cannot be deleted', 'invalid', 400);
  }

  await assertCalendarOwner(userId, calendarId);
  await prisma.calendar.delete({ where: { id: calendarId } });

  await recordCalendarDeleted({
    actorUserId: userId,
    calendarId,
  });

  recordCalendarDeletedDomainEvent({
    actorUserId: userId,
    calendarId,
    contextType: cal.contextType,
    contextId: cal.contextId,
  });
}

export async function autoProvisionCalendar(input: AutoProvisionCalendarInput) {
  const { userId, contextType, contextId, name, isPrimary } = input;

  if (!contextType || !contextId) {
    throw new CalendarServiceError('Missing context', 'invalid', 400);
  }

  await enforceCalendarContextMembership(userId, contextType, contextId);

  const dashboards = await prisma.dashboard.findMany({
    where: {
      OR: [
        contextType === 'PERSONAL' ? { userId: contextId } : undefined,
        contextType === 'BUSINESS' ? { businessId: contextId } : undefined,
        contextType === 'HOUSEHOLD' ? { householdId: contextId } : undefined,
      ].filter((item): item is NonNullable<typeof item> => item !== undefined),
    },
    include: { widgets: true },
  });

  const calendarEnabled = dashboards.some((d) => d.widgets?.some((w) => w.type === 'calendar'));
  if (!calendarEnabled) {
    throw new CalendarServiceError(
      'Calendar module is not installed for this tab/context',
      'conflict',
      409
    );
  }

  const existing = await prisma.calendar.findFirst({
    where: { contextType, contextId, isPrimary: true },
  });
  if (existing) {
    return { calendar: existing, created: false as const };
  }

  const calendar = await prisma.calendar.create({
    data: {
      name: name || 'Calendar',
      contextType,
      contextId,
      isPrimary: isPrimary ?? true,
      isSystem: contextType === 'PERSONAL',
      isDeletable: contextType !== 'PERSONAL',
      defaultReminderMinutes: 10,
      members: { create: { userId, role: 'OWNER' } },
    },
  });

  await recordCalendarCreated({
    actorUserId: userId,
    calendarId: calendar.id,
    contextType: calendar.contextType,
    contextId: calendar.contextId,
  });

  recordCalendarCreatedDomainEvent({
    actorUserId: userId,
    calendarId: calendar.id,
    contextType: calendar.contextType,
    contextId: calendar.contextId,
  });

  return { calendar, created: true as const };
}
