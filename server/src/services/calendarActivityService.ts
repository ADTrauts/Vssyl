import { emitModuleActivityEvent } from './moduleActivityService';
import { AuditService } from './auditService';

async function recordAudit(
  userId: string,
  action: string,
  message: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await AuditService.logBlockIdAction(userId, action, message, metadata);
  } catch {
    // non-blocking audit trail
  }
}

export async function recordCalendarCreated(params: {
  actorUserId: string;
  calendarId: string;
  contextType?: string;
  contextId?: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'calendar_created',
    targetType: 'calendar',
    targetId: params.calendarId,
    metadata: {
      contextType: params.contextType,
      contextId: params.contextId,
    },
  });
}

export async function recordCalendarUpdated(params: {
  actorUserId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'calendar_updated',
    targetType: 'calendar',
    targetId: params.calendarId,
  });
}

export async function recordCalendarDeleted(params: {
  actorUserId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'calendar_deleted',
    targetType: 'calendar',
    targetId: params.calendarId,
  });
}

export async function recordEventCreated(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  startAt: Date;
  endAt: Date;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_created',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
    metadata: {
      startAt: params.startAt.toISOString(),
      endAt: params.endAt.toISOString(),
    },
  });

  await recordAudit(params.actorUserId, 'CALENDAR_EVENT_CREATED', `Event created`, {
    eventId: params.eventId,
    calendarId: params.calendarId,
    startAt: params.startAt,
    endAt: params.endAt,
  });
}

export async function recordEventUpdated(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  title?: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_updated',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
  });

  await recordAudit(params.actorUserId, 'CALENDAR_EVENT_UPDATED', `Event updated: ${params.title ?? params.eventId}`, {
    eventId: params.eventId,
  });
}

export async function recordEventDeleted(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_deleted',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
  });

  await recordAudit(params.actorUserId, 'CALENDAR_EVENT_DELETED', `Event deleted: ${params.eventId}`, {
    eventId: params.eventId,
  });
}

export async function recordEventTrashed(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_trashed',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
  });

  await recordAudit(params.actorUserId, 'CALENDAR_EVENT_TRASHED', `Event trashed: ${params.eventId}`, {
    eventId: params.eventId,
    calendarId: params.calendarId,
  });
}

export async function recordEventRestored(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_restored',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
  });

  await recordAudit(params.actorUserId, 'CALENDAR_EVENT_RESTORED', `Event restored: ${params.eventId}`, {
    eventId: params.eventId,
  });
}

export async function recordEventPermanentlyDeleted(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_permanently_deleted',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
  });

  await recordAudit(
    params.actorUserId,
    'CALENDAR_EVENT_PERMANENTLY_DELETED',
    `Event permanently deleted: ${params.eventId}`,
    { eventId: params.eventId }
  );
}

export async function recordEventImported(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  title: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_imported',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
    metadata: { source: 'ics_import' },
  });

  await recordAudit(params.actorUserId, 'calendar_event_imported', `Event imported: ${params.title}`, {
    eventId: params.eventId,
    calendarId: params.calendarId,
    source: 'ics_import',
  });
}

export async function recordAttendeeRsvp(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  response: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'event_rsvp',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
    metadata: { response: params.response },
  });
}

export async function recordReminderDispatched(params: {
  actorUserId: string;
  eventId: string;
  calendarId: string;
  reminderId: string;
}): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: 'calendar',
    action: 'reminder_dispatched',
    targetType: 'event',
    targetId: params.eventId,
    parentType: 'calendar',
    parentId: params.calendarId,
    metadata: { reminderId: params.reminderId },
  });
}
