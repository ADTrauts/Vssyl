import { BusinessRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateSchedulingPolicyDual } from '../auth/schedulingPolicyDual';
import { getChatSocketService } from './chatSocketService';
import {
  recordSchedulePurged,
  recordScheduleRestored,
  recordScheduleTemplatePurged,
  recordScheduleTemplateRestored,
  recordScheduleTemplateTrashed,
  recordScheduleTrashed,
  recordShiftPurged,
  recordShiftRestored,
  recordShiftTrashed,
} from './schedulingActivityService';
import {
  recordSchedulingSchedulePermanentlyDeletedDomainEvent,
  recordSchedulingScheduleRestoredDomainEvent,
  recordSchedulingScheduleTemplateTrashedDomainEvent,
  recordSchedulingScheduleTrashedDomainEvent,
  recordSchedulingShiftPermanentlyDeletedDomainEvent,
  recordSchedulingShiftRestoredDomainEvent,
  recordSchedulingShiftTrashedDomainEvent,
} from './schedulingDomainEventService';
import {
  unlinkScheduleAndShiftsFromAllVLinks,
  unlinkShiftFromAllVLinks,
} from './schedulingVlinkLifecycleService';

export class SchedulingTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'SchedulingTrashError';
  }
}

export type SchedulingTrashItemType = 'schedule' | 'shift' | 'schedule_template';

export interface SchedulingTrashMutationInput {
  userId: string;
  type: SchedulingTrashItemType;
  id: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: SchedulingTrashItemType;
  moduleId: 'scheduling';
  moduleName: 'Scheduling';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

/** Exclude globally trashed scheduling rows from active list/read queries */
export const SCHEDULING_NOT_TRASHED = { trashedAt: null };

async function assertSchedulingBusinessAccess(userId: string, businessId: string): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    throw new SchedulingTrashError('Forbidden', 'forbidden');
  }

  const canManage =
    member.role === BusinessRole.ADMIN ||
    member.canManage;

  if (!canManage) {
    throw new SchedulingTrashError('Forbidden', 'forbidden');
  }
}

async function assertSchedulingPolicyNotBlocked(params: {
  userId: string;
  businessId: string;
  action:
    | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE
    | typeof POLICY_ACTIONS.SCHEDULING_SCHEDULE_WRITE
    | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_DELETE
    | typeof POLICY_ACTIONS.SCHEDULING_SHIFT_WRITE
    | typeof POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE;
  resourceType?: 'schedule' | 'shift' | 'business';
  resourceId?: string;
}): Promise<void> {
  const policy = await evaluateSchedulingPolicyDual({
    userId: params.userId,
    action: params.action,
    businessId: params.businessId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
  });
  if (policy.blocked) {
    throw new SchedulingTrashError('Forbidden', 'forbidden');
  }
}

async function getManagedSchedulingBusinessIds(userId: string): Promise<string[]> {
  const members = await prisma.businessMember.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { role: BusinessRole.ADMIN },
        { canManage: true },
      ],
    },
    select: { businessId: true },
  });
  return members.map((member) => member.businessId);
}

function collectCalendarEventIdsFromShiftMetadata(
  metadata: unknown
): Set<string> {
  const eventIds = new Set<string>();
  if (!metadata || typeof metadata !== 'object') {
    return eventIds;
  }
  const meta = metadata as Record<string, unknown>;
  const calendarEvents = meta.calendarEvents;
  if (!calendarEvents || typeof calendarEvents !== 'object') {
    return eventIds;
  }
  const events = calendarEvents as Record<string, unknown>;
  if (typeof events.scheduleEventId === 'string') {
    eventIds.add(events.scheduleEventId);
  }
  if (typeof events.personalEventId === 'string') {
    eventIds.add(events.personalEventId);
  }
  return eventIds;
}

async function cleanupPublishedScheduleCalendarEvents(params: {
  scheduleId: string;
  status: string;
  shifts: Array<{ id: string; metadata: unknown }>;
}): Promise<void> {
  if (params.status !== 'PUBLISHED' || params.shifts.length === 0) {
    return;
  }

  try {
    const eventIdsToDelete = new Set<string>();
    for (const shift of params.shifts) {
      for (const eventId of collectCalendarEventIdsFromShiftMetadata(shift.metadata)) {
        eventIdsToDelete.add(eventId);
      }
    }

    if (eventIdsToDelete.size > 0) {
      await prisma.event.deleteMany({
        where: { id: { in: Array.from(eventIdsToDelete) } },
      });

      logger.info('Calendar events cleaned up for schedule trash', {
        operation: 'trash_schedule_calendar_cleanup',
        scheduleId: params.scheduleId,
        eventCount: eventIdsToDelete.size,
      });
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.warn('Failed to clean up calendar events during schedule trash', {
      operation: 'trash_schedule_calendar_cleanup',
      scheduleId: params.scheduleId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function softTrashSchedule(params: {
  userId: string;
  businessId: string;
  scheduleId: string;
}): Promise<{ id: string; name: string }> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE,
    resourceType: 'schedule',
    resourceId: params.scheduleId,
  });

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: params.scheduleId,
      businessId: params.businessId,
      trashedAt: null,
    },
    include: {
      shifts: {
        where: { trashedAt: null },
        select: { id: true, metadata: true },
      },
    },
  });

  if (!schedule) {
    throw new SchedulingTrashError('Schedule not found', 'not_found');
  }

  const trashedAt = new Date();

  await prisma.schedule.updateMany({
    where: { id: params.scheduleId, trashedAt: null },
    data: { trashedAt },
  });

  if (schedule.shifts.length > 0) {
    await prisma.scheduleShift.updateMany({
      where: { scheduleId: params.scheduleId, trashedAt: null },
      data: { trashedAt },
    });
  }

  await cleanupPublishedScheduleCalendarEvents({
    scheduleId: schedule.id,
    status: schedule.status,
    shifts: schedule.shifts,
  });

  await recordScheduleTrashed({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: schedule.id,
  });

  recordSchedulingScheduleTrashedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: schedule.id,
  });

  return { id: schedule.id, name: schedule.name };
}

export async function restoreSchedule(params: {
  userId: string;
  businessId: string;
  scheduleId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_WRITE,
    resourceType: 'schedule',
    resourceId: params.scheduleId,
  });

  const updated = await prisma.schedule.updateMany({
    where: {
      id: params.scheduleId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordScheduleRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
  });

  recordSchedulingScheduleRestoredDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
  });

  return true;
}

export async function permanentlyDeleteSchedule(params: {
  userId: string;
  businessId: string;
  scheduleId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SCHEDULE_DELETE,
    resourceType: 'schedule',
    resourceId: params.scheduleId,
  });

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: params.scheduleId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: {
      id: true,
      shifts: { select: { id: true } },
    },
  });

  if (!schedule) {
    return false;
  }

  await unlinkScheduleAndShiftsFromAllVLinks({
    actorUserId: params.userId,
    scheduleId: params.scheduleId,
    shiftIds: schedule.shifts.map((shift) => shift.id),
  });

  await prisma.schedule.delete({ where: { id: params.scheduleId } });

  await recordSchedulePurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
  });

  recordSchedulingSchedulePermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
  });

  return true;
}

export async function softTrashShift(params: {
  userId: string;
  businessId: string;
  shiftId: string;
}): Promise<{ id: string; scheduleId: string }> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SHIFT_DELETE,
    resourceType: 'shift',
    resourceId: params.shiftId,
  });

  const shift = await prisma.scheduleShift.findFirst({
    where: {
      id: params.shiftId,
      businessId: params.businessId,
      trashedAt: null,
      schedule: { trashedAt: null },
    },
    select: { id: true, scheduleId: true },
  });

  if (!shift) {
    throw new SchedulingTrashError('Shift not found', 'not_found');
  }

  const updated = await prisma.scheduleShift.updateMany({
    where: { id: params.shiftId, trashedAt: null },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new SchedulingTrashError('Shift not found or already trashed', 'not_found');
  }

  await recordShiftTrashed({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  recordSchedulingShiftTrashedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  try {
    const socketService = getChatSocketService();
    socketService.broadcastShiftDeleted(params.businessId, shift.scheduleId, shift.id);
  } catch (socketError: unknown) {
    const err = socketError instanceof Error ? socketError : new Error('Unknown error');
    logger.warn('Failed to broadcast shift trashed event', {
      operation: 'trash_shift_broadcast',
      shiftId: shift.id,
      error: { message: err.message },
    });
  }

  return { id: shift.id, scheduleId: shift.scheduleId };
}

export async function restoreShift(params: {
  userId: string;
  businessId: string;
  shiftId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SHIFT_WRITE,
    resourceType: 'shift',
    resourceId: params.shiftId,
  });

  const shift = await prisma.scheduleShift.findFirst({
    where: {
      id: params.shiftId,
      businessId: params.businessId,
      trashedAt: { not: null },
      schedule: { trashedAt: null },
    },
    select: { id: true, scheduleId: true },
  });

  if (!shift) {
    return false;
  }

  const updated = await prisma.scheduleShift.updateMany({
    where: { id: params.shiftId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordShiftRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  recordSchedulingShiftRestoredDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  return true;
}

export async function permanentlyDeleteShift(params: {
  userId: string;
  businessId: string;
  shiftId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_SHIFT_DELETE,
    resourceType: 'shift',
    resourceId: params.shiftId,
  });

  const shift = await prisma.scheduleShift.findFirst({
    where: {
      id: params.shiftId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true, scheduleId: true },
  });

  if (!shift) {
    return false;
  }

  await unlinkShiftFromAllVLinks({
    actorUserId: params.userId,
    shiftId: params.shiftId,
  });

  await prisma.scheduleShift.delete({ where: { id: params.shiftId } });

  await recordShiftPurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  recordSchedulingShiftPermanentlyDeletedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: shift.id,
    scheduleId: shift.scheduleId,
  });

  return true;
}

export async function softTrashScheduleTemplate(params: {
  userId: string;
  businessId: string;
  templateId: string;
}): Promise<{ id: string; name: string }> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE,
    resourceType: 'business',
    resourceId: params.businessId,
  });

  const template = await prisma.scheduleTemplate.findFirst({
    where: {
      id: params.templateId,
      businessId: params.businessId,
      trashedAt: null,
    },
    select: { id: true, name: true },
  });

  if (!template) {
    throw new SchedulingTrashError('Template not found', 'not_found');
  }

  const updated = await prisma.scheduleTemplate.updateMany({
    where: { id: params.templateId, trashedAt: null },
    data: { trashedAt: new Date() },
  });

  if (updated.count === 0) {
    throw new SchedulingTrashError('Template not found or already trashed', 'not_found');
  }

  await recordScheduleTemplateTrashed({
    actorUserId: params.userId,
    businessId: params.businessId,
    templateId: template.id,
  });

  recordSchedulingScheduleTemplateTrashedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    templateId: template.id,
  });

  return { id: template.id, name: template.name };
}

export async function restoreScheduleTemplate(params: {
  userId: string;
  businessId: string;
  templateId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE,
    resourceType: 'business',
    resourceId: params.businessId,
  });

  const updated = await prisma.scheduleTemplate.updateMany({
    where: {
      id: params.templateId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordScheduleTemplateRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    templateId: params.templateId,
  });

  return true;
}

export async function permanentlyDeleteScheduleTemplate(params: {
  userId: string;
  businessId: string;
  templateId: string;
}): Promise<boolean> {
  await assertSchedulingBusinessAccess(params.userId, params.businessId);
  await assertSchedulingPolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.SCHEDULING_TEMPLATE_WRITE,
    resourceType: 'business',
    resourceId: params.businessId,
  });

  const template = await prisma.scheduleTemplate.findFirst({
    where: {
      id: params.templateId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true },
  });

  if (!template) {
    return false;
  }

  await prisma.scheduleTemplate.delete({ where: { id: params.templateId } });

  await recordScheduleTemplatePurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    templateId: params.templateId,
  });

  return true;
}

function resolveBusinessIdFromMetadata(metadata?: Record<string, unknown>): string | undefined {
  const businessId = metadata?.businessId;
  return typeof businessId === 'string' ? businessId : undefined;
}

async function resolveScheduleBusinessId(
  scheduleId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const fromMetadata = resolveBusinessIdFromMetadata(metadata);
  if (fromMetadata) {
    return fromMetadata;
  }
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId },
    select: { businessId: true },
  });
  if (!schedule) {
    throw new SchedulingTrashError('Schedule not found', 'not_found');
  }
  return schedule.businessId;
}

async function resolveShiftBusinessId(
  shiftId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const fromMetadata = resolveBusinessIdFromMetadata(metadata);
  if (fromMetadata) {
    return fromMetadata;
  }
  const shift = await prisma.scheduleShift.findFirst({
    where: { id: shiftId },
    select: { businessId: true },
  });
  if (!shift) {
    throw new SchedulingTrashError('Shift not found', 'not_found');
  }
  return shift.businessId;
}

async function resolveTemplateBusinessId(
  templateId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const fromMetadata = resolveBusinessIdFromMetadata(metadata);
  if (fromMetadata) {
    return fromMetadata;
  }
  const template = await prisma.scheduleTemplate.findFirst({
    where: { id: templateId },
    select: { businessId: true },
  });
  if (!template) {
    throw new SchedulingTrashError('Template not found', 'not_found');
  }
  return template.businessId;
}

export async function softTrashSchedulingItem(input: SchedulingTrashMutationInput): Promise<void> {
  switch (input.type) {
    case 'schedule': {
      const businessId = await resolveScheduleBusinessId(input.id, input.metadata);
      await softTrashSchedule({ userId: input.userId, businessId, scheduleId: input.id });
      return;
    }
    case 'shift': {
      const businessId = await resolveShiftBusinessId(input.id, input.metadata);
      await softTrashShift({ userId: input.userId, businessId, shiftId: input.id });
      return;
    }
    case 'schedule_template': {
      const businessId = await resolveTemplateBusinessId(input.id, input.metadata);
      await softTrashScheduleTemplate({
        userId: input.userId,
        businessId,
        templateId: input.id,
      });
      return;
    }
    default:
      throw new SchedulingTrashError(`Unsupported scheduling trash type: ${input.type}`, 'invalid');
  }
}

export async function restoreSchedulingItem(input: SchedulingTrashMutationInput): Promise<boolean> {
  switch (input.type) {
    case 'schedule': {
      const businessId = await resolveScheduleBusinessId(input.id, input.metadata);
      return restoreSchedule({ userId: input.userId, businessId, scheduleId: input.id });
    }
    case 'shift': {
      const businessId = await resolveShiftBusinessId(input.id, input.metadata);
      return restoreShift({ userId: input.userId, businessId, shiftId: input.id });
    }
    case 'schedule_template': {
      const businessId = await resolveTemplateBusinessId(input.id, input.metadata);
      return restoreScheduleTemplate({
        userId: input.userId,
        businessId,
        templateId: input.id,
      });
    }
    default:
      return false;
  }
}

export async function permanentlyDeleteSchedulingItem(
  input: SchedulingTrashMutationInput
): Promise<boolean> {
  switch (input.type) {
    case 'schedule': {
      const businessId = await resolveScheduleBusinessId(input.id, input.metadata);
      return permanentlyDeleteSchedule({
        userId: input.userId,
        businessId,
        scheduleId: input.id,
      });
    }
    case 'shift': {
      const businessId = await resolveShiftBusinessId(input.id, input.metadata);
      return permanentlyDeleteShift({ userId: input.userId, businessId, shiftId: input.id });
    }
    case 'schedule_template': {
      const businessId = await resolveTemplateBusinessId(input.id, input.metadata);
      return permanentlyDeleteScheduleTemplate({
        userId: input.userId,
        businessId,
        templateId: input.id,
      });
    }
    default:
      return false;
  }
}

export async function listTrashedSchedulingItemsForGlobalTrash(
  userId: string
): Promise<GlobalTrashListItem[]> {
  const businessIds = await getManagedSchedulingBusinessIds(userId);
  if (businessIds.length === 0) {
    return [];
  }

  const [schedules, shifts, templates] = await Promise.all([
    prisma.schedule.findMany({
      where: { businessId: { in: businessIds }, trashedAt: { not: null } },
      select: {
        id: true,
        name: true,
        businessId: true,
        status: true,
        trashedAt: true,
      },
      orderBy: { trashedAt: 'desc' },
    }),
    prisma.scheduleShift.findMany({
      where: {
        businessId: { in: businessIds },
        trashedAt: { not: null },
        schedule: { trashedAt: null },
      },
      select: {
        id: true,
        title: true,
        businessId: true,
        scheduleId: true,
        trashedAt: true,
      },
      orderBy: { trashedAt: 'desc' },
    }),
    prisma.scheduleTemplate.findMany({
      where: { businessId: { in: businessIds }, trashedAt: { not: null } },
      select: {
        id: true,
        name: true,
        businessId: true,
        trashedAt: true,
      },
      orderBy: { trashedAt: 'desc' },
    }),
  ]);

  return [
    ...schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      type: 'schedule' as const,
      moduleId: 'scheduling' as const,
      moduleName: 'Scheduling' as const,
      trashedAt: schedule.trashedAt,
      metadata: {
        businessId: schedule.businessId,
        scheduleId: schedule.id,
        status: schedule.status,
      },
    })),
    ...shifts.map((shift) => ({
      id: shift.id,
      name: shift.title,
      type: 'shift' as const,
      moduleId: 'scheduling' as const,
      moduleName: 'Scheduling' as const,
      trashedAt: shift.trashedAt,
      metadata: {
        businessId: shift.businessId,
        scheduleId: shift.scheduleId,
        shiftId: shift.id,
      },
    })),
    ...templates.map((template) => ({
      id: template.id,
      name: template.name,
      type: 'schedule_template' as const,
      moduleId: 'scheduling' as const,
      moduleName: 'Scheduling' as const,
      trashedAt: template.trashedAt,
      metadata: {
        businessId: template.businessId,
        templateId: template.id,
      },
    })),
  ];
}

export async function emptySchedulingTrash(input: { userId: string }): Promise<number> {
  const businessIds = await getManagedSchedulingBusinessIds(input.userId);
  if (businessIds.length === 0) {
    return 0;
  }

  let deletedCount = 0;

  const trashedSchedules = await prisma.schedule.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  for (const schedule of trashedSchedules) {
    const deleted = await permanentlyDeleteSchedule({
      userId: input.userId,
      businessId: schedule.businessId,
      scheduleId: schedule.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  const trashedShifts = await prisma.scheduleShift.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  for (const shift of trashedShifts) {
    const deleted = await permanentlyDeleteShift({
      userId: input.userId,
      businessId: shift.businessId,
      shiftId: shift.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  const trashedTemplates = await prisma.scheduleTemplate.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  for (const template of trashedTemplates) {
    const deleted = await permanentlyDeleteScheduleTemplate({
      userId: input.userId,
      businessId: template.businessId,
      templateId: template.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}
