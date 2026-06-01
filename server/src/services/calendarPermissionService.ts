import { prisma } from '../lib/prisma';
import { CalendarServiceError } from './calendar/calendarErrors';

const WRITE_ROLES = ['OWNER', 'ADMIN', 'EDITOR'] as const;

export async function enforceCalendarContextMembership(
  userId: string,
  contextType: unknown,
  contextId: unknown
): Promise<void> {
  if (typeof contextType !== 'string' || typeof contextId !== 'string') {
    throw new CalendarServiceError('Invalid context', 'invalid', 400);
  }
  if (contextType === 'PERSONAL') {
    if (contextId !== userId) {
      throw new CalendarServiceError('Forbidden', 'forbidden', 403);
    }
    return;
  }
  if (contextType === 'BUSINESS') {
    const member = await prisma.businessMember.findFirst({
      where: { businessId: contextId, userId, isActive: true },
    });
    if (!member) {
      throw new CalendarServiceError('Forbidden', 'forbidden', 403);
    }
    return;
  }
  if (contextType === 'HOUSEHOLD') {
    const member = await prisma.householdMember.findFirst({
      where: { householdId: contextId, userId, isActive: true },
    });
    if (!member) {
      throw new CalendarServiceError('Forbidden', 'forbidden', 403);
    }
    return;
  }
  throw new CalendarServiceError('Invalid contextType', 'invalid', 400);
}

export async function assertCalendarMember(
  userId: string,
  calendarId: string
): Promise<void> {
  const member = await prisma.calendarMember.findFirst({
    where: { calendarId, userId },
    select: { id: true },
  });
  if (!member) {
    throw new CalendarServiceError('Forbidden', 'forbidden', 403);
  }
}

export async function assertCalendarWriteAccess(
  userId: string,
  calendarId: string
): Promise<void> {
  const cal = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: { contextType: true, contextId: true },
  });
  if (!cal) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }

  const member = await prisma.calendarMember.findFirst({
    where: { calendarId, userId, role: { in: [...WRITE_ROLES] } },
    select: { id: true },
  });
  if (!member) {
    throw new CalendarServiceError('Forbidden', 'forbidden', 403);
  }

  if (cal.contextType === 'HOUSEHOLD') {
    const hhMember = await prisma.householdMember.findFirst({
      where: { householdId: cal.contextId, userId },
      select: { role: true },
    });
    if (hhMember && (hhMember.role === 'TEEN' || hhMember.role === 'CHILD')) {
      throw new CalendarServiceError('Read-only role in household', 'forbidden', 403);
    }
  }
}

export async function assertCalendarOwner(
  userId: string,
  calendarId: string
): Promise<void> {
  const isOwner = await prisma.calendarMember.findFirst({
    where: { calendarId, userId, role: 'OWNER' },
    select: { id: true },
  });
  if (!isOwner) {
    throw new CalendarServiceError('Forbidden', 'forbidden', 403);
  }
}

export async function getCalendarForWrite(
  calendarId: string,
  userId: string
): Promise<{ id: string; contextType: string; contextId: string; defaultReminderMinutes: number }> {
  await assertCalendarWriteAccess(userId, calendarId);
  const cal = await prisma.calendar.findUnique({
    where: { id: calendarId },
    select: {
      id: true,
      contextType: true,
      contextId: true,
      defaultReminderMinutes: true,
    },
  });
  if (!cal) {
    throw new CalendarServiceError('Not found', 'not_found', 404);
  }
  return cal;
}
