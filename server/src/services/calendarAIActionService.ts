import { CalendarServiceError } from './calendar/calendarErrors';
import type { CalendarAttendeeInput, CalendarEditMode } from './calendar/calendarTypes';
import * as calendarAttendeeService from './calendarAttendeeService';
import * as calendarEventService from './calendarEventService';
import * as calendarVisibilityService from './calendarVisibilityService';

export type CalendarAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

function toOutcome(error: unknown, fallback: string): CalendarAIActionOutcome {
  if (error instanceof CalendarServiceError) {
    return { success: false, error: error.message };
  }
  if (error instanceof Error) {
    return { success: false, error: error.message || fallback };
  }
  return { success: false, error: fallback };
}

function mapAttendeeParams(attendees: unknown): CalendarAttendeeInput[] | undefined {
  if (!Array.isArray(attendees)) return undefined;
  return attendees.map((entry) => {
    if (typeof entry === 'string') {
      return { email: entry };
    }
    if (entry && typeof entry === 'object') {
      const row = entry as Record<string, unknown>;
      return {
        userId: typeof row.userId === 'string' ? row.userId : null,
        email: typeof row.email === 'string' ? row.email : null,
        response: typeof row.response === 'string' ? row.response : undefined,
      };
    }
    return { email: null, userId: null };
  });
}

export async function aiCreateEvent(params: {
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string | Date;
  endAt: string | Date;
  allDay?: boolean;
  timezone?: string;
  attendees?: unknown;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | Date | null;
}): Promise<CalendarAIActionOutcome> {
  try {
    const { event, calendar } = await calendarEventService.createEvent({
      userId: params.userId,
      calendarId: params.calendarId,
      title: params.title,
      description: params.description,
      location: params.location,
      startAt: params.startAt,
      endAt: params.endAt,
      allDay: params.allDay,
      timezone: params.timezone,
      attendees: mapAttendeeParams(params.attendees),
      recurrenceRule: params.recurrenceRule,
      recurrenceEndAt: params.recurrenceEndAt,
    });
    return { success: true, data: { success: true, data: event, calendar } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to create calendar event');
  }
}

export async function aiUpdateEvent(params: {
  userId: string;
  eventId: string;
  title?: string;
  description?: string;
  location?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  allDay?: boolean;
  timezone?: string;
  attendees?: unknown;
  editMode?: CalendarEditMode;
  occurrenceStartAt?: string | Date | null;
}): Promise<CalendarAIActionOutcome> {
  try {
    const result = await calendarEventService.updateEvent({
      userId: params.userId,
      eventId: params.eventId,
      title: params.title,
      description: params.description,
      location: params.location,
      startAt: params.startAt,
      endAt: params.endAt,
      allDay: params.allDay,
      timezone: params.timezone,
      attendees: mapAttendeeParams(params.attendees),
      editMode: params.editMode,
      occurrenceStartAt: params.occurrenceStartAt,
    });
    return { success: true, data: { success: true, data: result } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to update calendar event');
  }
}

export async function aiDeleteEvent(params: {
  userId: string;
  eventId: string;
  editMode?: CalendarEditMode;
  occurrenceStartAt?: string;
}): Promise<CalendarAIActionOutcome> {
  try {
    const result = await calendarEventService.deleteEvent({
      userId: params.userId,
      eventId: params.eventId,
      editMode: params.editMode,
      occurrenceStartAt: params.occurrenceStartAt,
    });
    return { success: true, data: { success: true, data: result } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to delete calendar event');
  }
}

export async function aiRsvpEvent(params: {
  userId: string;
  eventId: string;
  response: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}): Promise<CalendarAIActionOutcome> {
  try {
    const refreshed = await calendarAttendeeService.rsvpEvent({
      userId: params.userId,
      eventId: params.eventId,
      response: params.response,
    });
    if (!refreshed) {
      return { success: false, error: 'Not found' };
    }
    return { success: true, data: { success: true, data: refreshed } };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to RSVP to calendar event');
  }
}

export async function aiCheckConflicts(params: {
  userId: string;
  start: string;
  end: string;
  calendarIds?: string | string[];
}): Promise<CalendarAIActionOutcome> {
  try {
    const conflicts = await calendarVisibilityService.checkConflicts({
      userId: params.userId,
      start: params.start,
      end: params.end,
      calendarIds: params.calendarIds,
    });
    return {
      success: true,
      data: {
        success: true,
        data: conflicts,
      },
    };
  } catch (error: unknown) {
    return toOutcome(error, 'Failed to check calendar conflicts');
  }
}
