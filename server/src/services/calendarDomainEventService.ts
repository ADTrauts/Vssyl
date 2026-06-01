import {
  emitCalendarCreatedEvent,
  emitCalendarDeletedEvent,
  emitCalendarEventCreatedEvent,
  emitCalendarEventDeletedEvent,
  emitCalendarEventPermanentlyDeletedEvent,
  emitCalendarEventReminderDispatchedEvent,
  emitCalendarEventRestoredEvent,
  emitCalendarEventRsvpUpdatedEvent,
  emitCalendarEventTrashedEvent,
  emitCalendarEventUpdatedEvent,
  emitCalendarUpdatedEvent,
} from '../events/domainEventEmitters';

type CalendarContext = {
  contextType: string;
  contextId: string;
};

function scopeFromCalendar(calendar: CalendarContext) {
  return {
    businessId: calendar.contextType === 'BUSINESS' ? calendar.contextId : null,
    householdId: calendar.contextType === 'HOUSEHOLD' ? calendar.contextId : null,
  };
}

export function recordCalendarCreatedDomainEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): void {
  emitCalendarCreatedEvent(params);
}

export function recordCalendarUpdatedDomainEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): void {
  emitCalendarUpdatedEvent(params);
}

export function recordCalendarDeletedDomainEvent(params: {
  actorUserId: string;
  calendarId: string;
  contextType: string;
  contextId: string;
}): void {
  emitCalendarDeletedEvent(params);
}

export function recordCalendarEventCreatedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  allDay?: boolean;
  startAt: Date;
  endAt: Date;
  calendar: CalendarContext;
}): void {
  const scope = scopeFromCalendar(params.calendar);
  emitCalendarEventCreatedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    allDay: params.allDay,
    startAt: params.startAt.toISOString(),
    endAt: params.endAt.toISOString(),
    ...scope,
  });
}

export function recordCalendarEventUpdatedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  allDay?: boolean;
  startAt: Date;
  endAt: Date;
  calendar: CalendarContext;
}): void {
  const scope = scopeFromCalendar(params.calendar);
  emitCalendarEventUpdatedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    allDay: params.allDay,
    startAt: params.startAt.toISOString(),
    endAt: params.endAt.toISOString(),
    ...scope,
  });
}

export function recordCalendarEventDeletedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  calendar: CalendarContext;
  softDelete?: boolean;
}): void {
  emitCalendarEventDeletedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    softDelete: params.softDelete,
    ...scopeFromCalendar(params.calendar),
  });
}

export function recordCalendarEventTrashedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  calendar: CalendarContext;
}): void {
  emitCalendarEventTrashedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    ...scopeFromCalendar(params.calendar),
  });
}

export function recordCalendarEventRestoredDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  calendar: CalendarContext;
}): void {
  emitCalendarEventRestoredEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    ...scopeFromCalendar(params.calendar),
  });
}

export function recordCalendarEventPermanentlyDeletedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  calendar: CalendarContext;
}): void {
  emitCalendarEventPermanentlyDeletedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    ...scopeFromCalendar(params.calendar),
  });
}

export function recordCalendarEventRsvpUpdatedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  response: string;
  calendar: CalendarContext;
}): void {
  emitCalendarEventRsvpUpdatedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    response: params.response,
    ...scopeFromCalendar(params.calendar),
  });
}

export function recordCalendarEventReminderDispatchedDomainEvent(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  reminderId: string;
  calendar: CalendarContext;
}): void {
  emitCalendarEventReminderDispatchedEvent({
    actorUserId: params.actorUserId,
    eventId: params.eventId,
    calendarId: params.calendarId,
    reminderId: params.reminderId,
    ...scopeFromCalendar(params.calendar),
  });
}
