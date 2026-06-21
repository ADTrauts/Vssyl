import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { syncSingleShiftToCalendar } from './hrScheduleService';
import {
  recordOpenShiftClaimed,
  recordShiftAssigned,
  recordShiftCreated,
  recordShiftMutationActivities,
} from './schedulingActivityService';
import {
  recordSchedulingOpenShiftClaimedDomainEvent,
  recordSchedulingShiftAssignedDomainEvent,
  recordSchedulingShiftCreatedDomainEvent,
  recordSchedulingShiftMutationDomainEvents,
} from './schedulingDomainEventService';
import {
  notifyOpenShiftAvailable,
  notifyShiftAssigned,
} from './schedulingNotificationService';
import { softTrashShift } from './schedulingTrashService';
import { SCHEDULING_NOT_TRASHED } from './schedulingTrashService';
import {
  ManagerScope,
  SHIFT_DETAIL_INCLUDE,
  SHIFT_LIST_INCLUDE,
  SchedulingWorkflowError,
  TimeOffConflictError,
  assertActiveEmployeePosition,
  assertEmployeeInManagerScope,
  assertNoOverlappingShift,
  assertNoTimeOffConflict,
} from './schedulingServiceShared';

export class PositionRequirementError extends SchedulingWorkflowError {
  constructor(public readonly requiredPositionId: string) {
    super(403, 'You do not have the required position to claim this shift');
    this.name = 'PositionRequirementError';
  }
}

export class ShiftOverlapConflictError extends SchedulingWorkflowError {
  constructor(
    message: string,
    public readonly conflictingShiftId?: string
  ) {
    super(409, message);
    this.name = 'ShiftOverlapConflictError';
  }
}

export interface CreateShiftInput {
  scheduleId: string;
  businessId: string;
  actorUserId: string;
  title: string;
  startTime: string;
  endTime: string;
  employeePositionId?: string | null;
  positionId?: string | null;
  breakMinutes?: number | null;
  notes?: string | null;
  color?: string | null;
  isOpenShift?: boolean;
  stationName?: string | null;
  locationId?: string | null;
  priority?: number | null;
}

export interface UpdateShiftInput {
  shiftId: string;
  businessId: string;
  actorUserId: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number | null;
  notes?: string | null;
  color?: string | null;
  positionId?: string | null;
  employeePositionId?: string | null | '';
  stationName?: string | null;
  locationId?: string | null;
}

async function syncShiftCalendarIfPublished(
  shiftId: string,
  businessId: string,
  scheduleStatus: string | undefined
): Promise<void> {
  if (scheduleStatus !== 'PUBLISHED') return;
  try {
    await syncSingleShiftToCalendar(shiftId, businessId);
  } catch (calendarError: unknown) {
    const err = calendarError instanceof Error ? calendarError : new Error('Unknown error');
    logger.warn('Failed to sync shift to calendar', {
      operation: 'shift_calendar_sync',
      shiftId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function createShiftForBusiness(input: CreateShiftInput) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: input.scheduleId, businessId: input.businessId },
    select: { id: true },
  });
  if (!schedule) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  const shiftStart = new Date(input.startTime);
  const shiftEnd = new Date(input.endTime);

  if (input.employeePositionId) {
    await assertNoTimeOffConflict({
      businessId: input.businessId,
      employeePositionId: input.employeePositionId,
      startTime: shiftStart,
      endTime: shiftEnd,
    });
  }

  const shift = await prisma.scheduleShift.create({
    data: {
      scheduleId: input.scheduleId,
      businessId: input.businessId,
      employeePositionId: input.employeePositionId ?? null,
      positionId: input.positionId ?? null,
      title: input.title,
      startTime: shiftStart,
      endTime: shiftEnd,
      breakMinutes: input.breakMinutes,
      notes: input.notes,
      color: input.color,
      isOpenShift:
        input.isOpenShift !== undefined
          ? input.isOpenShift
          : !input.employeePositionId,
      status: input.employeePositionId ? 'SCHEDULED' : 'OPEN',
      stationName: input.stationName || undefined,
      locationId: input.locationId || undefined,
      priority: input.priority ?? undefined,
    },
    include: SHIFT_DETAIL_INCLUDE,
  });

  await recordShiftCreated({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    shiftId: shift.id,
    scheduleId: input.scheduleId,
    employeePositionId: shift.employeePositionId,
  });

  recordSchedulingShiftCreatedDomainEvent({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    shiftId: shift.id,
    scheduleId: input.scheduleId,
    status: shift.status,
  });

  if (shift.employeePositionId) {
    await recordShiftAssigned({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      shiftId: shift.id,
      scheduleId: input.scheduleId,
      employeePositionId: shift.employeePositionId,
    });
    recordSchedulingShiftAssignedDomainEvent({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      shiftId: shift.id,
      scheduleId: input.scheduleId,
      employeePositionId: shift.employeePositionId,
    });
    await notifyShiftAssigned({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      scheduleId: input.scheduleId,
      shiftId: shift.id,
      shiftTitle: shift.title,
      employeePositionId: shift.employeePositionId,
    });
  } else if (shift.isOpenShift) {
    await notifyOpenShiftAvailable({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      scheduleId: input.scheduleId,
      shiftId: shift.id,
      shiftTitle: shift.title,
    });
    try {
      const { onOpenShiftCampaign } = await import('./workforceBridgeService.js');
      await onOpenShiftCampaign({
        businessId: input.businessId,
        actorUserId: input.actorUserId,
        scheduleId: input.scheduleId,
        shiftId: shift.id,
        shiftTitle: shift.title,
      });
    } catch {
      // Optional bridge
    }
  }

  return shift;
}

export async function updateShiftForBusiness(input: UpdateShiftInput) {
  const currentShift = await prisma.scheduleShift.findFirst({
    where: { id: input.shiftId, businessId: input.businessId },
    select: {
      employeePositionId: true,
      startTime: true,
      endTime: true,
      scheduleId: true,
    },
  });

  if (!currentShift) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }

  const data: Prisma.ScheduleShiftUpdateInput = {};
  if (input.title) data.title = input.title;
  if (input.startTime) data.startTime = new Date(input.startTime);
  if (input.endTime) data.endTime = new Date(input.endTime);
  if (input.breakMinutes !== undefined) data.breakMinutes = input.breakMinutes;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.color) data.color = input.color;

  if (input.positionId !== undefined) {
    if (input.positionId === '' || input.positionId === null) {
      data.position = { disconnect: true };
    } else {
      data.position = { connect: { id: input.positionId } };
    }
  }

  if (input.employeePositionId !== undefined) {
    if (
      input.employeePositionId === null ||
      input.employeePositionId === '' ||
      (typeof input.employeePositionId === 'string' &&
        input.employeePositionId.startsWith('member-'))
    ) {
      data.employeePosition = { disconnect: true };
      data.isOpenShift = true;
      data.status = 'OPEN';
    } else {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(input.employeePositionId)) {
        throw new SchedulingWorkflowError(400, 'Invalid employee position ID format');
      }
      data.employeePosition = { connect: { id: input.employeePositionId } };
      data.isOpenShift = false;
      data.status = 'SCHEDULED';
    }
  }

  if (input.stationName !== undefined) {
    data.stationName = input.stationName === '' ? null : input.stationName;
  }

  if (input.locationId !== undefined) {
    data.location =
      input.locationId === null || input.locationId === ''
        ? { disconnect: true }
        : { connect: { id: input.locationId } };
  }

  const finalEmployeePositionId =
    input.employeePositionId !== undefined
      ? input.employeePositionId === null ||
        input.employeePositionId === '' ||
        (typeof input.employeePositionId === 'string' &&
          input.employeePositionId.startsWith('member-'))
        ? null
        : input.employeePositionId
      : currentShift.employeePositionId;

  const finalStartTime = input.startTime
    ? new Date(input.startTime)
    : currentShift.startTime;
  const finalEndTime = input.endTime
    ? new Date(input.endTime)
    : currentShift.endTime;

  if (finalEmployeePositionId) {
    await assertNoTimeOffConflict({
      businessId: input.businessId,
      employeePositionId: finalEmployeePositionId,
      startTime: finalStartTime,
      endTime: finalEndTime,
    });
  }

  const shift = await prisma.scheduleShift.update({
    where: { id: input.shiftId },
    data,
    include: {
      ...SHIFT_DETAIL_INCLUDE,
      schedule: { select: { id: true, status: true, businessId: true } },
    },
  });

  await recordShiftMutationActivities({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    shiftId: input.shiftId,
    scheduleId: shift.scheduleId,
    previousEmployeePositionId: currentShift.employeePositionId,
    nextEmployeePositionId: shift.employeePositionId ?? null,
  });

  recordSchedulingShiftMutationDomainEvents({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    shiftId: input.shiftId,
    scheduleId: shift.scheduleId,
    previousEmployeePositionId: currentShift.employeePositionId,
    nextEmployeePositionId: shift.employeePositionId ?? null,
    status: shift.status,
  });

  if (
    shift.employeePositionId &&
    shift.employeePositionId !== currentShift.employeePositionId
  ) {
    await notifyShiftAssigned({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      scheduleId: shift.scheduleId,
      shiftId: shift.id,
      shiftTitle: shift.title,
      employeePositionId: shift.employeePositionId,
    });
  } else if (
    shift.isOpenShift &&
    !shift.employeePositionId &&
    currentShift.employeePositionId
  ) {
    await notifyOpenShiftAvailable({
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      shiftId: shift.id,
      scheduleId: shift.scheduleId,
      shiftTitle: shift.title,
    });
    try {
      const { onOpenShiftCampaign } = await import('./workforceBridgeService.js');
      await onOpenShiftCampaign({
        businessId: input.businessId,
        actorUserId: input.actorUserId,
        scheduleId: shift.scheduleId,
        shiftId: shift.id,
        shiftTitle: shift.title,
      });
    } catch {
      // Optional bridge
    }
  }

  return shift;
}

export async function trashShiftForBusiness(params: {
  businessId: string;
  shiftId: string;
  actorUserId: string;
}) {
  await softTrashShift({
    userId: params.actorUserId,
    businessId: params.businessId,
    shiftId: params.shiftId,
  });
}

export async function getShiftByIdForBusiness(businessId: string, shiftId: string) {
  const shift = await prisma.scheduleShift.findFirst({
    where: { id: shiftId, businessId, ...SCHEDULING_NOT_TRASHED },
    include: {
      ...SHIFT_DETAIL_INCLUDE,
      schedule: { select: { id: true, name: true, status: true } },
    },
  });
  if (!shift) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }
  return shift;
}

export async function listShiftsForBusiness(params: {
  businessId: string;
  scheduleId?: string;
}) {
  const where: Prisma.ScheduleShiftWhereInput = {
    businessId: params.businessId,
    ...SCHEDULING_NOT_TRASHED,
    schedule: SCHEDULING_NOT_TRASHED,
  };
  if (params.scheduleId) {
    where.scheduleId = params.scheduleId;
  }

  return prisma.scheduleShift.findMany({
    where,
    include: SHIFT_DETAIL_INCLUDE,
    orderBy: { startTime: 'asc' },
  });
}

export async function assignShiftForAdmin(params: {
  businessId: string;
  shiftId: string;
  employeePositionId: string;
  actorUserId: string;
}) {
  const existing = await prisma.scheduleShift.findFirst({
    where: { id: params.shiftId, businessId: params.businessId },
    select: { id: true, scheduleId: true, employeePositionId: true },
  });
  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }

  const shift = await prisma.scheduleShift.update({
    where: { id: params.shiftId },
    data: {
      employeePositionId: params.employeePositionId,
      status: 'SCHEDULED',
      isOpenShift: false,
    },
    include: {
      schedule: { select: { businessId: true, status: true } },
      employeePosition: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  await syncShiftCalendarIfPublished(
    params.shiftId,
    params.businessId,
    shift.schedule?.status
  );

  await recordShiftMutationActivities({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: existing.scheduleId,
    previousEmployeePositionId: existing.employeePositionId,
    nextEmployeePositionId: params.employeePositionId,
  });

  recordSchedulingShiftMutationDomainEvents({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: existing.scheduleId,
    previousEmployeePositionId: existing.employeePositionId,
    nextEmployeePositionId: params.employeePositionId,
    status: shift.status,
  });

  return shift;
}

export async function listOpenShiftsForManager(params: {
  businessId: string;
  scope: ManagerScope;
  startDate?: string;
  endDate?: string;
}) {
  const startGte = params.startDate ? new Date(params.startDate) : new Date();
  const where: Prisma.ScheduleShiftWhereInput = {
    businessId: params.businessId,
    isOpenShift: true,
    status: 'OPEN',
    ...SCHEDULING_NOT_TRASHED,
    startTime: { gte: startGte },
  };
  if (params.endDate) {
    where.endTime = { lte: new Date(params.endDate) };
  }

  return prisma.scheduleShift.findMany({
    where,
    include: SHIFT_LIST_INCLUDE,
    orderBy: { startTime: 'asc' },
  });
}

export async function assignShiftToEmployeeByManager(params: {
  businessId: string;
  shiftId: string;
  employeePositionId: string;
  actorUserId: string;
  scope: ManagerScope;
}) {
  const shift = await prisma.scheduleShift.findFirst({
    where: { id: params.shiftId, businessId: params.businessId, ...SCHEDULING_NOT_TRASHED },
    include: { schedule: { select: { id: true, status: true, businessId: true } } },
  });

  if (!shift) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }
  if (shift.status === 'CANCELLED') {
    throw new SchedulingWorkflowError(400, 'Cannot assign a cancelled shift');
  }

  assertEmployeeInManagerScope(params.employeePositionId, params.scope);
  await assertActiveEmployeePosition(params.businessId, params.employeePositionId);
  await assertNoTimeOffConflict({
    businessId: params.businessId,
    employeePositionId: params.employeePositionId,
    startTime: shift.startTime,
    endTime: shift.endTime,
  });
  await assertNoOverlappingShift({
    businessId: params.businessId,
    employeePositionId: params.employeePositionId,
    shiftId: params.shiftId,
    startTime: shift.startTime,
    endTime: shift.endTime,
  });

  const previousEmployeePositionId = shift.employeePositionId;

  const updatedShift = await prisma.scheduleShift.update({
    where: { id: params.shiftId },
    data: {
      employeePositionId: params.employeePositionId,
      status: 'SCHEDULED',
      isOpenShift: false,
    },
    include: SHIFT_LIST_INCLUDE,
  });

  await syncShiftCalendarIfPublished(
    params.shiftId,
    params.businessId,
    updatedShift.schedule?.status
  );

  await recordShiftMutationActivities({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: shift.scheduleId,
    previousEmployeePositionId,
    nextEmployeePositionId: params.employeePositionId,
  });

  recordSchedulingShiftMutationDomainEvents({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: shift.scheduleId,
    previousEmployeePositionId,
    nextEmployeePositionId: params.employeePositionId,
    status: updatedShift.status,
  });

  await notifyShiftAssigned({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    scheduleId: shift.scheduleId,
    shiftId: params.shiftId,
    shiftTitle: updatedShift.title ?? 'Shift',
    employeePositionId: params.employeePositionId,
  });

  return updatedShift;
}

export async function claimOpenShiftForEmployee(params: {
  businessId: string;
  shiftId: string;
  userId: string;
  employeePositionId?: string;
}) {
  const shift = await prisma.scheduleShift.findUnique({
    where: { id: params.shiftId },
    include: {
      schedule: { select: { id: true, name: true, status: true } },
      employeePosition: { include: { user: true } },
      position: { select: { id: true, title: true } },
    },
  });

  if (!shift || shift.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }
  if (!shift.isOpenShift || shift.status !== 'OPEN') {
    throw new SchedulingWorkflowError(
      400,
      'Shift is not available for claiming. It may already be assigned or not marked as open.'
    );
  }
  if (new Date(shift.startTime) < new Date()) {
    throw new SchedulingWorkflowError(400, 'Cannot claim shifts that have already started');
  }

  let finalEmployeePositionId = params.employeePositionId;
  if (!finalEmployeePositionId) {
    const position = await prisma.employeePosition.findFirst({
      where: { businessId: params.businessId, userId: params.userId, active: true },
      select: { id: true },
    });
    if (!position) {
      throw new SchedulingWorkflowError(404, 'No active employee position found for this user');
    }
    finalEmployeePositionId = position.id;
  } else {
    const position = await prisma.employeePosition.findFirst({
      where: {
        id: finalEmployeePositionId,
        businessId: params.businessId,
        userId: params.userId,
        active: true,
      },
    });
    if (!position) {
      throw new SchedulingWorkflowError(403, 'You can only claim shifts for your own position');
    }
  }

  if (shift.positionId) {
    const employeePosition = await prisma.employeePosition.findUnique({
      where: { id: finalEmployeePositionId },
      select: { positionId: true },
    });
    if (employeePosition?.positionId !== shift.positionId) {
      throw new PositionRequirementError(shift.positionId);
    }
  }

  const overlap = await prisma.scheduleShift.findFirst({
    where: {
      businessId: params.businessId,
      employeePositionId: finalEmployeePositionId,
      id: { not: params.shiftId },
      status: { not: 'CANCELLED' },
      OR: [
        {
          AND: [
            { startTime: { lte: shift.startTime } },
            { endTime: { gt: shift.startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: shift.endTime } },
            { endTime: { gte: shift.endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: shift.startTime } },
            { endTime: { lte: shift.endTime } },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (overlap) {
    throw new ShiftOverlapConflictError(
      'You are already scheduled for a shift during this time period',
      overlap.id
    );
  }

  const updatedShift = await prisma.scheduleShift.update({
    where: { id: params.shiftId },
    data: {
      employeePosition: { connect: { id: finalEmployeePositionId } },
      isOpenShift: false,
      status: 'SCHEDULED',
    },
    include: SHIFT_LIST_INCLUDE,
  });

  await syncShiftCalendarIfPublished(
    params.shiftId,
    params.businessId,
    updatedShift.schedule?.status
  );

  await recordOpenShiftClaimed({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: shift.scheduleId,
    employeePositionId: finalEmployeePositionId,
  });

  recordSchedulingOpenShiftClaimedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    shiftId: params.shiftId,
    scheduleId: shift.scheduleId,
    employeePositionId: finalEmployeePositionId,
  });

  await notifyShiftAssigned({
    actorUserId: params.userId,
    businessId: params.businessId,
    scheduleId: shift.scheduleId,
    shiftId: params.shiftId,
    shiftTitle: updatedShift.title ?? 'Shift',
    employeePositionId: finalEmployeePositionId,
  });

  return updatedShift;
}

export async function listOwnOpenShifts(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
  startDate?: string;
  endDate?: string;
  positionId?: string;
}) {
  let finalEmployeePositionId = params.employeePositionId;
  let userPositionId: string | null = null;

  if (!finalEmployeePositionId) {
    const position = await prisma.employeePosition.findFirst({
      where: { businessId: params.businessId, userId: params.userId, active: true },
      include: { position: { select: { id: true } } },
    });
    if (position) {
      finalEmployeePositionId = position.id;
      userPositionId = position.positionId;
    }
  } else {
    const position = await prisma.employeePosition.findUnique({
      where: { id: finalEmployeePositionId },
      include: { position: { select: { id: true } } },
    });
    if (
      position &&
      position.businessId === params.businessId &&
      position.userId === params.userId
    ) {
      userPositionId = position.positionId;
    }
  }

  const where: Prisma.ScheduleShiftWhereInput = {
    businessId: params.businessId,
    isOpenShift: true,
    status: 'OPEN',
    startTime: { gte: new Date() },
    schedule: { status: 'PUBLISHED' },
  };

  if (params.startDate) {
    where.startTime = { ...where.startTime as Prisma.DateTimeFilter, gte: new Date(params.startDate) };
  }
  if (params.endDate) {
    where.endTime = { lte: new Date(params.endDate) };
  }

  if (params.positionId) {
    where.positionId = params.positionId;
  } else if (userPositionId) {
    where.OR = [{ positionId: userPositionId }, { positionId: null }];
  } else {
    where.positionId = null;
  }

  if (finalEmployeePositionId) {
    const conflictingShifts = await prisma.scheduleShift.findMany({
      where: {
        businessId: params.businessId,
        employeePositionId: finalEmployeePositionId,
        status: { not: 'CANCELLED' },
        startTime: { gte: new Date() },
      },
      select: { startTime: true, endTime: true },
    });

    if (conflictingShifts.length > 0) {
      where.NOT = conflictingShifts.map((conflict) => ({
        OR: [
          {
            AND: [
              { startTime: { lte: conflict.startTime } },
              { endTime: { gt: conflict.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: conflict.endTime } },
              { endTime: { gte: conflict.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: conflict.startTime } },
              { endTime: { lte: conflict.endTime } },
            ],
          },
        ],
      }));
    }
  }

  return prisma.scheduleShift.findMany({
    where,
    include: SHIFT_LIST_INCLUDE,
    orderBy: { startTime: 'asc' },
  });
}

export { TimeOffConflictError };
