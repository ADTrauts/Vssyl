import { CalendarContextType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateCalendarPolicyDual } from '../auth/calendarPolicyDual';
import { CalendarServiceError } from './calendar/calendarErrors';
import {
  buildExceptionKeySet,
  expandEventsForConflictCheck,
  expandEventsToBusySlots,
  expandRecurringEventsInRange,
  mergeBusyTimeSlots,
} from './calendarRecurrenceService';

export type DashboardContextFilter = {
  contextType: CalendarContextType;
  contextId: string;
};

function accessibleCalendarOrClause(userId: string): Prisma.CalendarWhereInput[] {
  return [
    { members: { some: { userId } } },
    { contextType: 'PERSONAL', contextId: userId },
  ];
}

export async function resolveDashboardContexts(
  userId: string,
  contextFilters: string[]
): Promise<DashboardContextFilter[]> {
  const dashboardContexts: DashboardContextFilter[] = [];

  for (const contextId of contextFilters) {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: contextId },
      select: {
        businessId: true,
        institutionId: true,
        householdId: true,
      },
    });

    if (dashboard) {
      if (dashboard.businessId) {
        dashboardContexts.push({
          contextType: CalendarContextType.BUSINESS,
          contextId: dashboard.businessId,
        });
      } else if (dashboard.institutionId) {
        dashboardContexts.push({
          contextType: CalendarContextType.BUSINESS,
          contextId: dashboard.institutionId,
        });
      } else if (dashboard.householdId) {
        dashboardContexts.push({
          contextType: CalendarContextType.HOUSEHOLD,
          contextId: dashboard.householdId,
        });
      } else {
        dashboardContexts.push({
          contextType: CalendarContextType.PERSONAL,
          contextId: userId,
        });
      }
    } else {
      dashboardContexts.push({
        contextType: CalendarContextType.PERSONAL,
        contextId: userId,
      });
    }
  }

  return dashboardContexts;
}

export async function calendarPassesReadPolicy(
  userId: string,
  calendarId: string
): Promise<boolean> {
  const readPolicyDual = await evaluateCalendarPolicyDual({
    userId,
    action: POLICY_ACTIONS.CALENDAR_READ,
    resourceType: 'calendar',
    resourceId: calendarId,
  });
  return !readPolicyDual.blocked;
}

export async function filterCalendarsByReadPolicy<T extends { id: string }>(
  userId: string,
  calendars: T[]
): Promise<T[]> {
  const filtered: T[] = [];
  for (const calendar of calendars) {
    if (await calendarPassesReadPolicy(userId, calendar.id)) {
      filtered.push(calendar);
    }
  }
  return filtered;
}

export async function resolveAccessibleCalendarIds(input: {
  userId: string;
  contextFilters?: string[];
  requestedCalendarIds?: string[];
}): Promise<{ calendarIdList: string[]; dashboardContexts: DashboardContextFilter[] }> {
  const { userId, contextFilters = [], requestedCalendarIds = [] } = input;

  let dashboardContexts: DashboardContextFilter[] = [];

  if (requestedCalendarIds.length > 0) {
    const allowed = await prisma.calendar.findMany({
      where: {
        id: { in: requestedCalendarIds },
        OR: accessibleCalendarOrClause(userId),
      },
      select: { id: true },
    });
    const calendarIdList = (
      await filterCalendarsByReadPolicy(
        userId,
        allowed.map((c) => ({ id: c.id }))
      )
    ).map((c) => c.id);
    return { calendarIdList, dashboardContexts };
  }

  const whereCalendar: Prisma.CalendarWhereInput = {
    OR: accessibleCalendarOrClause(userId),
  };

  if (contextFilters.length > 0) {
    dashboardContexts = await resolveDashboardContexts(userId, contextFilters);
    if (dashboardContexts.length > 0) {
      whereCalendar.AND = [{ OR: dashboardContexts }];
    }
  }

  const calendars = await prisma.calendar.findMany({
    where: whereCalendar,
    select: { id: true },
  });

  const calendarIdList = (
    await filterCalendarsByReadPolicy(
      userId,
      calendars.map((c) => ({ id: c.id }))
    )
  ).map((c) => c.id);

  return { calendarIdList, dashboardContexts };
}

export async function listAccessibleCalendars(
  userId: string,
  options?: { contextType?: string; contextId?: string }
) {
  const where: Prisma.CalendarWhereInput = {
    OR: accessibleCalendarOrClause(userId),
  };

  if (options?.contextType) {
    where.contextType = options.contextType as never;
  }
  if (options?.contextId) {
    where.contextId = options.contextId;
  }

  const calendars = await prisma.calendar.findMany({
    where,
    include: { members: { where: { userId } } },
  });

  return filterCalendarsByReadPolicy(userId, calendars);
}

export async function listEventsInRange(input: {
  userId: string;
  start: string;
  end: string;
  contexts?: string | string[];
  calendarIds?: string | string[];
}) {
  const startAt = new Date(input.start);
  const endAt = new Date(input.end);

  const contextFilters = Array.isArray(input.contexts)
    ? input.contexts
    : input.contexts
      ? [input.contexts]
      : [];
  const requestedCalendarIds = Array.isArray(input.calendarIds)
    ? input.calendarIds
    : input.calendarIds
      ? [input.calendarIds]
      : [];

  const { calendarIdList, dashboardContexts } = await resolveAccessibleCalendarIds({
    userId: input.userId,
    contextFilters,
    requestedCalendarIds,
  });

  const hasBusinessContext = dashboardContexts.some(
    (ctx) => ctx.contextType === CalendarContextType.BUSINESS
  );

  const calendarsWithContext = await prisma.calendar.findMany({
    where: { id: { in: calendarIdList } },
    select: { id: true, contextType: true, contextId: true, name: true },
  });

  const scheduleCalendarIds = calendarsWithContext
    .filter((c) => c.contextType === CalendarContextType.BUSINESS && c.name === 'Schedule')
    .map((c) => c.id);

  const eventWhere: Prisma.EventWhereInput = {
    calendarId: { in: calendarIdList },
    trashedAt: null,
    OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
  };

  if (!hasBusinessContext && scheduleCalendarIds.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    const userEmail = user?.email;

    if (userEmail) {
      const nonScheduleCalendarIds = calendarIdList.filter(
        (id) => !scheduleCalendarIds.includes(id)
      );

      eventWhere.AND = [
        {
          OR: [
            { calendarId: { in: nonScheduleCalendarIds } },
            {
              AND: [
                { calendarId: { in: scheduleCalendarIds } },
                { attendees: { some: { email: userEmail } } },
              ],
            },
          ],
        },
      ];
    }
  }

  const events = await prisma.event.findMany({
    where: eventWhere,
    include: { attendees: true, reminders: true, attachments: true },
  });

  const exceptionKeySet = buildExceptionKeySet(events);
  return expandRecurringEventsInRange(events, startAt, endAt, exceptionKeySet);
}

export async function searchEvents(input: {
  userId: string;
  text: string;
  start?: string;
  end?: string;
  contexts?: string | string[];
  calendarIds?: string | string[];
}) {
  const where: Prisma.EventWhereInput = {
    trashedAt: null,
    OR: [
      { title: { contains: input.text, mode: 'insensitive' } },
      { description: { contains: input.text, mode: 'insensitive' } },
      { location: { contains: input.text, mode: 'insensitive' } },
    ],
  };

  if (input.start && input.end) {
    const orClause = where.OR;
    if (Array.isArray(orClause)) {
      orClause.push({
        startAt: { gte: new Date(input.start) },
        endAt: { lte: new Date(input.end) },
      });
    }
  }

  const contextArray = Array.isArray(input.contexts)
    ? input.contexts
    : input.contexts
      ? [input.contexts]
      : [];

  const calendarAccessFilter: Prisma.CalendarWhereInput = {
    OR: accessibleCalendarOrClause(input.userId),
  };

  if (contextArray.length > 0) {
    const dashboardContexts = await resolveDashboardContexts(input.userId, contextArray);
    if (dashboardContexts.length > 0) {
      where.calendar = {
        AND: [{ OR: dashboardContexts }, calendarAccessFilter],
      };
    } else {
      where.calendar = calendarAccessFilter;
    }
  } else {
    where.calendar = calendarAccessFilter;
  }

  if (input.calendarIds) {
    const calendarIdArray = Array.isArray(input.calendarIds)
      ? input.calendarIds
      : [input.calendarIds];
    const allowed = await resolveAccessibleCalendarIds({
      userId: input.userId,
      requestedCalendarIds: calendarIdArray,
    });
    where.calendarId = { in: allowed.calendarIdList };
  }

  const events = await prisma.event.findMany({
    where,
    include: { calendar: true, attendees: true },
    orderBy: { startAt: 'asc' },
    take: 100,
  });

  const filtered: typeof events = [];
  for (const event of events) {
    const readPolicyDual = await evaluateCalendarPolicyDual({
      userId: input.userId,
      action: POLICY_ACTIONS.CALENDAR_EVENT_READ,
      resourceType: 'calendar_event',
      resourceId: event.id,
    });
    if (!readPolicyDual.blocked) {
      filtered.push(event);
    }
  }

  return filtered;
}

export async function checkConflicts(input: {
  userId: string;
  start: string;
  end: string;
  calendarIds?: string | string[];
}) {
  const startDate = new Date(input.start);
  const endDate = new Date(input.end);
  const calendarIdArray = Array.isArray(input.calendarIds)
    ? input.calendarIds
    : input.calendarIds
      ? [input.calendarIds]
      : [];

  let allowedCalendarIds: string[] | undefined;
  if (calendarIdArray.length > 0) {
    const resolved = await resolveAccessibleCalendarIds({
      userId: input.userId,
      requestedCalendarIds: calendarIdArray as string[],
    });
    allowedCalendarIds = resolved.calendarIdList;
  }

  const where: Prisma.EventWhereInput = {
    trashedAt: null,
    startAt: { lt: endDate },
    endAt: { gt: startDate },
    calendar: {
      OR: accessibleCalendarOrClause(input.userId),
    },
  };

  if (allowedCalendarIds && allowedCalendarIds.length > 0) {
    where.calendarId = { in: allowedCalendarIds };
  }

  const conflicts = await prisma.event.findMany({
    where,
    select: {
      id: true,
      calendarId: true,
      title: true,
      startAt: true,
      endAt: true,
      allDay: true,
      timezone: true,
      recurrenceRule: true,
    },
    orderBy: { startAt: 'asc' },
  });

  const policyFiltered = [];
  for (const event of conflicts) {
    const readPolicyDual = await evaluateCalendarPolicyDual({
      userId: input.userId,
      action: POLICY_ACTIONS.CALENDAR_EVENT_READ,
      resourceType: 'calendar_event',
      resourceId: event.id,
    });
    if (!readPolicyDual.blocked) {
      policyFiltered.push(event);
    }
  }

  return expandEventsForConflictCheck(policyFiltered, startDate, endDate);
}

export async function getFreeBusy(input: {
  userId: string;
  start: string;
  end: string;
  calendarIds?: string | string[];
  attendeeEmails?: string | string[];
}) {
  const availabilityDual = await evaluateCalendarPolicyDual({
    userId: input.userId,
    action: POLICY_ACTIONS.CALENDAR_AVAILABILITY_READ,
    resourceType: 'calendar',
    resourceId: input.userId,
  });
  if (availabilityDual.blocked) {
    throw new CalendarServiceError('Forbidden', 'forbidden', 403);
  }

  const startDate = new Date(input.start);
  const endDate = new Date(input.end);
  const calendarIdArray = Array.isArray(input.calendarIds)
    ? input.calendarIds
    : input.calendarIds
      ? [input.calendarIds]
      : [];
  const attendeeEmailArray = Array.isArray(input.attendeeEmails)
    ? input.attendeeEmails
    : input.attendeeEmails
      ? [input.attendeeEmails]
      : [];

  const busyTimes: Array<{ startAt: string; endAt: string }> = [];

  if (calendarIdArray.length > 0) {
    const resolved = await resolveAccessibleCalendarIds({
      userId: input.userId,
      requestedCalendarIds: calendarIdArray as string[],
    });

    const events = await prisma.event.findMany({
      where: {
        calendarId: { in: resolved.calendarIdList },
        trashedAt: null,
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
      select: {
        startAt: true,
        endAt: true,
        timezone: true,
        recurrenceRule: true,
      },
    });

    busyTimes.push(...expandEventsToBusySlots(events, startDate, endDate));
  }

  if (attendeeEmailArray.length > 0) {
    const attendeeUsers = await prisma.user.findMany({
      where: { email: { in: attendeeEmailArray as string[] } },
      select: { id: true, email: true },
    });

    for (const user of attendeeUsers) {
      const userEvents = await prisma.event.findMany({
        where: {
          trashedAt: null,
          calendar: {
            OR: accessibleCalendarOrClause(user.id),
          },
          startAt: { lt: endDate },
          endAt: { gt: startDate },
        },
        select: {
          startAt: true,
          endAt: true,
          timezone: true,
          recurrenceRule: true,
        },
      });

      busyTimes.push(...expandEventsToBusySlots(userEvents, startDate, endDate));
    }
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    busy: mergeBusyTimeSlots(busyTimes),
  };
}

type AiEventRow = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  status?: string;
  trashedAt?: Date | null;
  occurrenceStartAt?: Date;
  occurrenceEndAt?: Date;
};

function eventStartAt(row: AiEventRow): Date {
  return row.occurrenceStartAt ?? row.startAt;
}

function eventEndAt(row: AiEventRow): Date {
  return row.occurrenceEndAt ?? row.endAt;
}

function isActiveAiEvent(row: AiEventRow): boolean {
  if (row.trashedAt) return false;
  if (row.status === 'CANCELED') return false;
  return true;
}

/** Upcoming events for AI context providers (permission-aware, recurrence-expanded). */
export async function getUpcomingEventsForAI(userId: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expanded = (await listEventsInRange({
    userId,
    start: now.toISOString(),
    end: sevenDaysFromNow.toISOString(),
  })) as AiEventRow[];

  const upcomingEvents = expanded
    .filter(isActiveAiEvent)
    .sort((a, b) => eventStartAt(a).getTime() - eventStartAt(b).getTime())
    .slice(0, 20);

  const eventsByDay = new Map<string, AiEventRow[]>();
  for (const event of upcomingEvents) {
    const dayKey = eventStartAt(event).toISOString().split('T')[0];
    const bucket = eventsByDay.get(dayKey) ?? [];
    bucket.push(event);
    eventsByDay.set(dayKey, bucket);
  }

  return {
    upcomingEvents: upcomingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description || null,
      startTime: eventStartAt(event).toISOString(),
      endTime: eventEndAt(event).toISOString(),
      location: event.location || null,
      isAllDay: event.allDay,
      daysUntil: Math.floor((eventStartAt(event).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    summary: {
      totalUpcomingEvents: upcomingEvents.length,
      nextEventTitle: upcomingEvents[0]?.title,
      nextEventTime: upcomingEvents[0] ? eventStartAt(upcomingEvents[0]).toISOString() : undefined,
      busyDays: eventsByDay.size,
      hasEventsToday: Array.from(eventsByDay.keys()).includes(now.toISOString().split('T')[0]),
      weekSummary: Array.from(eventsByDay.entries()).map(([date, events]) => ({
        date,
        eventCount: events.length,
        summary: `${events.length} event${events.length > 1 ? 's' : ''}`,
      })),
    },
  };
}

/** Today's schedule for AI context providers. */
export async function getTodayScheduleForAI(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const expanded = (await listEventsInRange({
    userId,
    start: today.toISOString(),
    end: tomorrow.toISOString(),
  })) as AiEventRow[];

  const todaysEvents = expanded
    .filter(isActiveAiEvent)
    .sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return eventStartAt(a).getTime() - eventStartAt(b).getTime();
    });

  const now = new Date();
  const timedEvents = todaysEvents
    .filter((e) => !e.allDay)
    .sort((a, b) => eventStartAt(a).getTime() - eventStartAt(b).getTime());

  const currentOrNextEvent = timedEvents.find((e) => eventEndAt(e) > now);

  return {
    todaySchedule: {
      date: today.toISOString().split('T')[0],
      events: todaysEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startTime: eventStartAt(event).toISOString(),
        endTime: eventEndAt(event).toISOString(),
        duration: Math.round((eventEndAt(event).getTime() - eventStartAt(event).getTime()) / (1000 * 60)),
        location: event.location || null,
        isAllDay: event.allDay,
        status:
          eventEndAt(event) < now
            ? 'completed'
            : eventStartAt(event) <= now && eventEndAt(event) > now
              ? 'in-progress'
              : 'upcoming',
      })),
      allDayEvents: todaysEvents.filter((e) => e.allDay).map((e) => e.title),
    },
    summary: {
      totalEvents: todaysEvents.length,
      timedEvents: timedEvents.length,
      allDayEvents: todaysEvents.filter((e) => e.allDay).length,
      currentEvent:
        currentOrNextEvent && eventStartAt(currentOrNextEvent) <= now
          ? {
              title: currentOrNextEvent.title,
              endsAt: eventEndAt(currentOrNextEvent).toISOString(),
            }
          : null,
      nextEvent:
        currentOrNextEvent && eventStartAt(currentOrNextEvent) > now
          ? {
              title: currentOrNextEvent.title,
              startsAt: eventStartAt(currentOrNextEvent).toISOString(),
              minutesUntil: Math.round(
                (eventStartAt(currentOrNextEvent).getTime() - now.getTime()) / (1000 * 60)
              ),
            }
          : null,
      dayStatus:
        todaysEvents.length === 0
          ? 'free'
          : todaysEvents.length > 5
            ? 'very-busy'
            : todaysEvents.length > 2
              ? 'busy'
              : 'light',
    },
  };
}

/** Availability check for AI query endpoint (conflict-aware, visibility-scoped). */
export async function getAvailabilityForAI(userId: string, startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new CalendarServiceError('Invalid date format. Use ISO8601 format', 'invalid', 400);
  }

  const conflicts = await checkConflicts({
    userId,
    start: start.toISOString(),
    end: end.toISOString(),
  });

  return {
    available: conflicts.length === 0,
    conflicts: conflicts.map((event) => ({
      id: event.id,
      title: event.title,
      startTime: event.startAt,
      endTime: event.endAt,
    })),
    requestedTimeSlot: {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
    },
  };
}
