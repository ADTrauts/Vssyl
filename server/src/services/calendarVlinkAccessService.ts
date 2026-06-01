import { prisma } from '../lib/prisma';
import { evaluateCalendarPolicyDual } from '../auth/calendarPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';

export type CalendarVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface CalendarVlinkAccessResult {
  allowed: boolean;
  state: CalendarVlinkEntityState;
  title?: string;
  url?: string;
}

async function userHasLegacyCalendarEventReadAccess(
  userId: string,
  event: {
    calendarId: string;
    calendar: { contextType: string; contextId: string };
    attendees: Array<{ userId: string | null; email: string | null }>;
  }
): Promise<boolean> {
  const member = await prisma.calendarMember.findFirst({
    where: { calendarId: event.calendarId, userId },
    select: { id: true },
  });
  if (member) {
    return true;
  }

  if (event.calendar.contextType === 'PERSONAL' && event.calendar.contextId === userId) {
    return true;
  }

  if (event.attendees.some((attendee) => attendee.userId === userId)) {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const userEmail = user?.email;
  if (userEmail && event.attendees.some((attendee) => attendee.email === userEmail)) {
    return true;
  }

  return false;
}

async function passesCalendarEventReadPolicy(userId: string, eventId: string): Promise<boolean> {
  const policy = await evaluateCalendarPolicyDual({
    userId,
    action: POLICY_ACTIONS.CALENDAR_EVENT_READ,
    resourceType: 'calendar_event',
    resourceId: eventId,
  });
  return !policy.blocked;
}

/**
 * Canonical V_Link access for calendar events (Wave 2 Phase 2B).
 * V_Link membership alone does not grant event content — calendar membership, personal
 * calendar ownership, attendee relationship, and Policy Engine read must pass.
 */
export async function resolveCalendarEventForVLink(
  userId: string,
  eventId: string
): Promise<CalendarVlinkAccessResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      calendarId: true,
      calendar: {
        select: { contextType: true, contextId: true },
      },
      attendees: {
        select: { userId: true, email: true },
      },
    },
  });

  if (!event) {
    return { allowed: false, state: 'deleted' };
  }

  if (event.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: event.title,
    };
  }

  if (!(await userHasLegacyCalendarEventReadAccess(userId, event))) {
    return {
      allowed: false,
      state: 'active',
      title: event.title,
    };
  }

  if (!(await passesCalendarEventReadPolicy(userId, eventId))) {
    return {
      allowed: false,
      state: 'active',
      title: event.title,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: event.title,
    url: `/calendar?event=${event.id}`,
  };
}

export async function userCanLinkCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const result = await resolveCalendarEventForVLink(userId, eventId);
  return result.allowed;
}

export const CALENDAR_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → calendarVlinkAccessService → calendar member/attendee + Policy Engine CALENDAR_EVENT_READ';
