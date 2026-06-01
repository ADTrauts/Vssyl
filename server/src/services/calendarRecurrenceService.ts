import { rrulestr } from 'rrule';
import { prisma } from '../lib/prisma';
import { getLocalYmd, zonedTimeToUtcFromDate } from '../utils/timezone';
import type { CalendarEditMode } from './calendar/calendarTypes';
import type { Event } from '@prisma/client';

type EventRow = Pick<
  Event,
  | 'id'
  | 'calendarId'
  | 'title'
  | 'description'
  | 'location'
  | 'onlineMeetingLink'
  | 'startAt'
  | 'endAt'
  | 'allDay'
  | 'timezone'
  | 'status'
  | 'recurrenceRule'
  | 'recurrenceEndAt'
  | 'parentEventId'
  | 'createdById'
  | 'trashedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type ExpandedOccurrence = Record<string, unknown> & {
  occurrenceStartAt: Date;
  occurrenceEndAt: Date;
};

/** Build keys `${parentEventId}|${occurrenceStartIso}` for exception children in a range query result. */
export function buildExceptionKeySet(
  events: Array<{ parentEventId: string | null; startAt: Date }>
): Set<string> {
  const exceptionKeySet = new Set<string>();
  for (const child of events) {
    if (child.parentEventId) {
      const key = `${child.parentEventId}|${new Date(child.startAt).toISOString()}`;
      exceptionKeySet.add(key);
    }
  }
  return exceptionKeySet;
}

/**
 * Expands recurring series parents into occurrences within [startAt, endAt].
 * Preserves controller behavior from listEventsInRange.
 */
export function expandRecurringEventsInRange(
  events: EventRow[],
  rangeStart: Date,
  rangeEnd: Date,
  exceptionKeySet: Set<string>
): ExpandedOccurrence[] {
  const expanded: ExpandedOccurrence[] = [];

  for (const ev of events) {
    if (!ev.recurrenceRule) {
      expanded.push({
        ...ev,
        occurrenceStartAt: ev.startAt,
        occurrenceEndAt: ev.endAt,
      } as ExpandedOccurrence);
      continue;
    }

    if (ev.parentEventId) {
      expanded.push({
        ...ev,
        occurrenceStartAt: ev.startAt,
        occurrenceEndAt: ev.endAt,
      } as ExpandedOccurrence);
      continue;
    }

    const rule = rrulestr(ev.recurrenceRule, {
      dtstart: new Date(ev.startAt),
      forceset: /EXDATE/i.test(ev.recurrenceRule),
    });

    const ruleWithBetween = rule as { between?: (a: Date, b: Date, inc: boolean) => Date[]; all?: () => Date[] };
    let occs = ruleWithBetween.between
      ? ruleWithBetween.between(rangeStart, rangeEnd, true)
      : (ruleWithBetween.all?.() ?? []).filter((d: Date) => d >= rangeStart && d <= rangeEnd);

    if (ev.recurrenceEndAt) {
      const until = new Date(ev.recurrenceEndAt);
      occs = occs.filter((d: Date) => d.getTime() <= until.getTime());
    }

    const durationMs = new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime();
    for (const occ of occs) {
      const occIso = new Date(occ).toISOString();
      const key = `${ev.id}|${occIso}`;
      if (exceptionKeySet.has(key)) {
        continue;
      }
      if (ev.allDay && ev.timezone) {
        const ymd = getLocalYmd(new Date(occ), ev.timezone);
        const startUtc = zonedTimeToUtcFromDate(
          new Date(ymd.year, ymd.month - 1, ymd.day, 0, 0, 0),
          ev.timezone
        );
        const endUtc = zonedTimeToUtcFromDate(
          new Date(ymd.year, ymd.month - 1, ymd.day, 23, 59, 59),
          ev.timezone
        );
        expanded.push({
          ...ev,
          occurrenceStartAt: startUtc,
          occurrenceEndAt: endUtc,
        } as ExpandedOccurrence);
      } else {
        expanded.push({
          ...ev,
          occurrenceStartAt: occ,
          occurrenceEndAt: new Date(occ.getTime() + durationMs),
        } as ExpandedOccurrence);
      }
    }
  }

  return expanded;
}

export async function createOccurrenceExceptionForUpdate(params: {
  userId: string;
  parent: Event;
  editMode: CalendarEditMode;
  occurrenceStartAt: Date;
  patch: {
    title?: string;
    description?: string | null;
    location?: string | null;
    onlineMeetingLink?: string | null;
    startAt?: Date;
    endAt?: Date;
    allDay?: boolean;
    timezone?: string;
  };
}) {
  const { userId, parent, occurrenceStartAt, patch } = params;
  const parentDurationMs = new Date(parent.endAt).getTime() - new Date(parent.startAt).getTime();
  const childStart = patch.startAt ?? occurrenceStartAt;
  const childEnd = patch.endAt ?? new Date(childStart.getTime() + parentDurationMs);

  return prisma.event.create({
    data: {
      calendarId: parent.calendarId,
      title: patch.title ?? parent.title,
      description: patch.description ?? parent.description,
      location: patch.location ?? parent.location,
      onlineMeetingLink: patch.onlineMeetingLink ?? parent.onlineMeetingLink,
      startAt: childStart,
      endAt: childEnd,
      allDay: typeof patch.allDay === 'boolean' ? patch.allDay : parent.allDay,
      timezone: patch.timezone || parent.timezone || 'UTC',
      status: parent.status,
      parentEventId: parent.id,
      createdById: userId,
    },
    include: { attendees: true, reminders: true, attachments: true },
  });
}

export async function createCanceledOccurrenceException(params: {
  userId: string;
  parent: Event;
  occurrenceStartAt: Date;
}) {
  const { userId, parent, occurrenceStartAt } = params;
  const durationMs = new Date(parent.endAt).getTime() - new Date(parent.startAt).getTime();
  const occEnd = new Date(occurrenceStartAt.getTime() + durationMs);

  return prisma.event.create({
    data: {
      calendarId: parent.calendarId,
      title: parent.title,
      description: parent.description,
      location: parent.location,
      onlineMeetingLink: parent.onlineMeetingLink,
      startAt: occurrenceStartAt,
      endAt: occEnd,
      allDay: parent.allDay,
      timezone: parent.timezone,
      status: 'CANCELED',
      parentEventId: parent.id,
      createdById: userId,
    },
  });
}

export function shouldApplyThisOccurrenceEdit(
  recurrenceRule: string | null | undefined,
  editMode: CalendarEditMode | undefined,
  occurrenceStartAt: Date | null | undefined
): boolean {
  return Boolean(recurrenceRule && editMode === 'THIS' && occurrenceStartAt);
}

export function shouldApplyThisOccurrenceDelete(
  recurrenceRule: string | null | undefined,
  editMode: CalendarEditMode | undefined,
  occurrenceStartAt: string | null | undefined
): boolean {
  return Boolean(recurrenceRule && editMode === 'THIS' && occurrenceStartAt);
}
