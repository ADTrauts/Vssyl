import { Prisma, ScheduleStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { recordScheduleCreated, recordScheduleUpdated } from './schedulingActivityService';
import {
  recordSchedulingScheduleCreatedDomainEvent,
  recordSchedulingScheduleUpdatedDomainEvent,
} from './schedulingDomainEventService';
import { softTrashSchedule } from './schedulingTrashService';
import { SCHEDULING_NOT_TRASHED } from './schedulingTrashService';
import { ManagerScope, SchedulingWorkflowError } from './schedulingServiceShared';
import { SHIFT_DETAIL_INCLUDE } from './schedulingServiceShared';

const scheduleWithShiftsInclude = {
  shifts: {
    where: SCHEDULING_NOT_TRASHED,
    include: {
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          position: { select: { title: true } },
        },
      },
      position: { select: { id: true, title: true } },
    },
    orderBy: { startTime: 'asc' as const },
  },
} satisfies Prisma.ScheduleInclude;

function mapScheduleListItem(
  schedule: Prisma.ScheduleGetPayload<{ include: typeof scheduleWithShiftsInclude }>
) {
  return {
    id: schedule.id,
    businessId: schedule.businessId,
    name: schedule.name,
    description: schedule.description,
    locationId: schedule.locationId,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    timezone: schedule.timezone,
    status: schedule.status,
    publishedAt: schedule.publishedAt,
    publishedById: schedule.publishedById,
    templateId: schedule.templateId,
    metadata: schedule.metadata,
    createdById: schedule.createdById,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    shifts: schedule.shifts ?? [],
  };
}

export async function listSchedulesForBusiness(params: {
  businessId: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  actorUserId: string;
}) {
  const where: Prisma.ScheduleWhereInput = {
    businessId: params.businessId,
    ...SCHEDULING_NOT_TRASHED,
  };

  if (
    params.status &&
    ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(params.status.toUpperCase())
  ) {
    where.status = params.status.toUpperCase() as ScheduleStatus;
  }

  if (params.startDate || params.endDate) {
    const dateFilters: Prisma.ScheduleWhereInput[] = [];
    if (params.startDate) {
      dateFilters.push({ startDate: { gte: new Date(params.startDate) } });
    }
    if (params.endDate) {
      dateFilters.push({ endDate: { lte: new Date(params.endDate) } });
    }
    if (dateFilters.length > 0) {
      where.AND = dateFilters;
    }
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: scheduleWithShiftsInclude,
    orderBy: { startDate: 'desc' },
  });

  const mapped = schedules.map(mapScheduleListItem);
  logger.info('Schedules retrieved', {
    operation: 'list_schedules',
    userId: params.actorUserId,
    businessId: params.businessId,
    scheduleCount: mapped.length,
  });

  return mapped;
}

export async function getScheduleByIdForBusiness(businessId: string, scheduleId: string) {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, businessId, ...SCHEDULING_NOT_TRASHED },
    include: {
      shifts: {
        where: SCHEDULING_NOT_TRASHED,
        include: {
          employeePosition: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              position: { select: { title: true } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      },
      createdBy: { select: { id: true, name: true, email: true } },
      publishedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!schedule) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  return schedule;
}

export async function createScheduleForBusiness(params: {
  businessId: string;
  actorUserId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  templateId?: string;
}) {
  const schedule = await prisma.schedule.create({
    data: {
      businessId: params.businessId,
      name: params.name,
      description: params.description,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      timezone: params.timezone || 'America/New_York',
      templateId: params.templateId,
      createdById: params.actorUserId,
      status: 'DRAFT',
    },
  });

  await recordScheduleCreated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    scheduleId: schedule.id,
    name: schedule.name,
  });

  recordSchedulingScheduleCreatedDomainEvent({
    actorUserId: params.actorUserId,
    scheduleId: schedule.id,
    businessId: params.businessId,
    status: schedule.status,
  });

  return schedule;
}

export async function updateScheduleForBusiness(params: {
  businessId: string;
  scheduleId: string;
  actorUserId: string;
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}) {
  const existing = await prisma.schedule.findFirst({
    where: { id: params.scheduleId, businessId: params.businessId },
  });
  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  const data: Prisma.ScheduleUpdateInput = {};
  if (params.name) data.name = params.name;
  if (params.description !== undefined) data.description = params.description;
  if (params.startDate) data.startDate = new Date(params.startDate);
  if (params.endDate) data.endDate = new Date(params.endDate);
  if (params.timezone) data.timezone = params.timezone;

  const schedule = await prisma.schedule.update({
    where: { id: params.scheduleId },
    data,
  });

  await recordScheduleUpdated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    scheduleId: schedule.id,
  });

  recordSchedulingScheduleUpdatedDomainEvent({
    actorUserId: params.actorUserId,
    scheduleId: schedule.id,
    businessId: params.businessId,
    status: schedule.status,
  });

  try {
    const { onScheduleChanged } = await import('./workforceBridgeService.js');
    await onScheduleChanged({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      scheduleStatus: schedule.status,
    });
  } catch (bridgeError: unknown) {
    // Bridge is optional; scheduling remains authoritative
    void bridgeError;
  }

  return schedule;
}

export async function trashScheduleForBusiness(params: {
  businessId: string;
  scheduleId: string;
  actorUserId: string;
}) {
  await softTrashSchedule({
    userId: params.actorUserId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
  });
}

export async function cloneScheduleForBusiness(params: {
  businessId: string;
  sourceScheduleId: string;
  actorUserId: string;
  name: string;
  startDate: string;
  endDate: string;
}) {
  const original = await prisma.schedule.findFirst({
    where: { id: params.sourceScheduleId, businessId: params.businessId },
    include: { shifts: { where: SCHEDULING_NOT_TRASHED } },
  });

  if (!original) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  const newSchedule = await prisma.schedule.create({
    data: {
      businessId: original.businessId,
      name: params.name,
      description: original.description,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      timezone: original.timezone,
      createdById: params.actorUserId,
      status: 'DRAFT',
    },
  });

  const dateDiff =
    new Date(params.startDate).getTime() - original.startDate.getTime();

  await Promise.all(
    original.shifts.map((shift) =>
      prisma.scheduleShift.create({
        data: {
          scheduleId: newSchedule.id,
          businessId: original.businessId,
          employeePositionId: shift.employeePositionId,
          title: shift.title,
          startTime: new Date(shift.startTime.getTime() + dateDiff),
          endTime: new Date(shift.endTime.getTime() + dateDiff),
          breakMinutes: shift.breakMinutes,
          notes: shift.notes,
          color: shift.color,
          isOpenShift: shift.isOpenShift,
          requiresApproval: shift.requiresApproval,
          status: 'SCHEDULED',
        },
      })
    )
  );

  return newSchedule;
}

export async function listShiftsForSchedule(businessId: string, scheduleId: string) {
  return prisma.scheduleShift.findMany({
    where: { scheduleId, businessId, ...SCHEDULING_NOT_TRASHED },
    include: SHIFT_DETAIL_INCLUDE,
    orderBy: { startTime: 'asc' },
  });
}

export async function listTeamSchedulesForManager(params: {
  businessId: string;
  scope: ManagerScope;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const where: Prisma.ScheduleWhereInput = {
    businessId: params.businessId,
    ...SCHEDULING_NOT_TRASHED,
  };

  if (
    params.status &&
    ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(params.status.toUpperCase())
  ) {
    where.status = params.status.toUpperCase() as ScheduleStatus;
  }

  if (params.startDate || params.endDate) {
    const dateFilters: Prisma.ScheduleWhereInput[] = [];
    if (params.startDate) {
      dateFilters.push({ startDate: { gte: new Date(params.startDate) } });
    }
    if (params.endDate) {
      dateFilters.push({ endDate: { lte: new Date(params.endDate) } });
    }
    if (dateFilters.length > 0) {
      where.AND = dateFilters;
    }
  }

  if (!params.scope.isAdmin && params.scope.directReportIds.length > 0) {
    where.shifts = {
      some: { employeePositionId: { in: params.scope.directReportIds } },
    };
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: scheduleWithShiftsInclude,
    orderBy: { startDate: 'desc' },
  });

  return schedules.map(mapScheduleListItem);
}

export async function getOwnScheduleForEmployee(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
}) {
  const where: Prisma.ScheduleShiftWhereInput = {
    businessId: params.businessId,
    schedule: { status: 'PUBLISHED' },
    OR: params.employeePositionId
      ? [{ employeePositionId: params.employeePositionId }]
      : [
          {
            employeePosition: {
              userId: params.userId,
              active: true,
            },
          },
        ],
  };

  const shifts = await prisma.scheduleShift.findMany({
    where,
    include: {
      schedule: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          timezone: true,
        },
      },
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          position: { select: { title: true } },
        },
      },
      position: { select: { id: true, title: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const scheduleMap = new Map<
    string,
    {
      id: string;
      businessId: string;
      name: string;
      startDate: Date;
      endDate: Date;
      timezone: string;
      status: string;
      shifts: typeof shifts;
    }
  >();

  for (const shift of shifts) {
    if (!shift.schedule) continue;
    const scheduleId = shift.schedule.id;
    if (!scheduleMap.has(scheduleId)) {
      scheduleMap.set(scheduleId, {
        id: scheduleId,
        businessId: params.businessId,
        name: shift.schedule.name,
        startDate: shift.schedule.startDate,
        endDate: shift.schedule.endDate,
        timezone: shift.schedule.timezone,
        status: shift.schedule.status,
        shifts: [],
      });
    }
    scheduleMap.get(scheduleId)!.shifts.push(shift);
  }

  return Array.from(scheduleMap.values());
}
