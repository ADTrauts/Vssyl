import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  AVAILABILITY_INCLUDE,
  ManagerScope,
  SchedulingWorkflowError,
  assertBusinessMemberActive,
} from './schedulingServiceShared';

const VALID_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
const VALID_TYPES = ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED'] as const;

export class AvailabilityOverlapError extends SchedulingWorkflowError {
  constructor(public readonly conflictId: string) {
    super(409, 'Overlapping availability already exists for this day and time period');
    this.name = 'AvailabilityOverlapError';
  }
}

async function resolveEmployeePositionForUser(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
  requireOwnership?: boolean;
}): Promise<string> {
  if (!params.employeePositionId) {
    const position = await prisma.employeePosition.findFirst({
      where: { businessId: params.businessId, userId: params.userId, active: true },
      select: { id: true },
    });
    if (!position) {
      throw new SchedulingWorkflowError(
        404,
        'No active employee position found for this user'
      );
    }
    return position.id;
  }

  const position = await prisma.employeePosition.findFirst({
    where: {
      id: params.employeePositionId,
      businessId: params.businessId,
      userId: params.userId,
      active: true,
    },
  });

  if (!position) {
    throw new SchedulingWorkflowError(
      403,
      params.requireOwnership !== false
        ? 'You can only set availability for your own position'
        : 'Employee position not found'
    );
  }

  return params.employeePositionId;
}

export async function listAllAvailabilityForBusiness(businessId: string) {
  return prisma.employeeAvailability.findMany({
    where: { businessId },
    orderBy: [
      { employeePositionId: 'asc' },
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
    include: AVAILABILITY_INCLUDE,
  });
}

export async function listTeamAvailability(params: {
  businessId: string;
  scope: ManagerScope;
}) {
  const where: Prisma.EmployeeAvailabilityWhereInput = {
    businessId: params.businessId,
  };

  if (!params.scope.isAdmin && params.scope.directReportIds.length > 0) {
    where.employeePositionId = { in: params.scope.directReportIds };
  } else if (!params.scope.isAdmin) {
    return [];
  }

  const availability = await prisma.employeeAvailability.findMany({
    where,
    include: AVAILABILITY_INCLUDE,
    orderBy: [
      { employeePositionId: 'asc' },
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  logger.info('Team availability listed', {
    operation: 'get_team_availability',
    businessId: params.businessId,
    count: availability.length,
    isAdmin: params.scope.isAdmin,
  });

  return availability;
}

export async function listOwnAvailability(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
}) {
  let finalEmployeePositionId = params.employeePositionId;
  if (!finalEmployeePositionId) {
    const position = await prisma.employeePosition.findFirst({
      where: {
        businessId: params.businessId,
        userId: params.userId,
        active: true,
      },
      select: { id: true },
    });
    if (!position) return [];
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
      throw new SchedulingWorkflowError(
        403,
        'You can only view availability for your own position'
      );
    }
  }

  return prisma.employeeAvailability.findMany({
    where: {
      businessId: params.businessId,
      employeePositionId: finalEmployeePositionId,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: AVAILABILITY_INCLUDE,
  });
}

export async function createOwnAvailability(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  availabilityType: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  recurring?: boolean;
  notes?: string | null;
}) {
  const day = params.dayOfWeek.toUpperCase();
  if (!VALID_DAYS.includes(day as (typeof VALID_DAYS)[number])) {
    throw new SchedulingWorkflowError(400, 'Invalid day of week');
  }
  if (!TIME_REGEX.test(params.startTime) || !TIME_REGEX.test(params.endTime)) {
    throw new SchedulingWorkflowError(
      400,
      'Invalid time format. Use HH:MM (24-hour format)'
    );
  }

  const [sh, sm] = params.startTime.split(':').map(Number);
  const [eh, em] = params.endTime.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    throw new SchedulingWorkflowError(400, 'End time must be after start time');
  }

  const type = params.availabilityType.toUpperCase();
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    throw new SchedulingWorkflowError(400, 'Invalid availability type');
  }

  const finalEmployeePositionId = await resolveEmployeePositionForUser({
    businessId: params.businessId,
    userId: params.userId,
    employeePositionId: params.employeePositionId,
  });

  const overlapping = await prisma.employeeAvailability.findFirst({
    where: {
      businessId: params.businessId,
      employeePositionId: finalEmployeePositionId,
      dayOfWeek: day,
      OR: [
        {
          AND: [
            {
              effectiveFrom: {
                lte: params.effectiveTo
                  ? new Date(params.effectiveTo)
                  : new Date('2099-12-31'),
              },
            },
            {
              effectiveTo: {
                gte: params.effectiveFrom
                  ? new Date(params.effectiveFrom)
                  : new Date('1970-01-01'),
              },
            },
          ],
        },
        { AND: [{ recurring: true }, { effectiveTo: null }] },
      ],
    },
  });

  if (overlapping) {
    throw new AvailabilityOverlapError(overlapping.id);
  }

  return prisma.employeeAvailability.create({
    data: {
      businessId: params.businessId,
      employeePositionId: finalEmployeePositionId,
      dayOfWeek: day,
      startTime: params.startTime,
      endTime: params.endTime,
      availabilityType: type as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED',
      effectiveFrom: params.effectiveFrom ? new Date(params.effectiveFrom) : new Date(),
      effectiveTo: params.effectiveTo ? new Date(params.effectiveTo) : null,
      recurring: params.recurring !== undefined ? params.recurring : true,
      notes: params.notes ?? null,
    },
    include: AVAILABILITY_INCLUDE,
  });
}

export async function updateOwnAvailability(params: {
  businessId: string;
  userId: string;
  availabilityId: string;
  body: Record<string, unknown>;
}) {
  const existing = await prisma.employeeAvailability.findUnique({
    where: { id: params.availabilityId },
    include: { employeePosition: { include: { user: true } } },
  });

  if (!existing || existing.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Availability record not found');
  }
  if (existing.employeePosition.userId !== params.userId) {
    throw new SchedulingWorkflowError(403, 'You can only update your own availability');
  }

  const updateData: Prisma.EmployeeAvailabilityUpdateInput = {};

  if (typeof params.body.dayOfWeek === 'string') {
    const day = params.body.dayOfWeek.toUpperCase();
    if (!VALID_DAYS.includes(day as (typeof VALID_DAYS)[number])) {
      throw new SchedulingWorkflowError(400, 'Invalid day of week');
    }
    updateData.dayOfWeek = day;
  }

  if (params.body.startTime !== undefined) {
    if (
      typeof params.body.startTime !== 'string' ||
      !TIME_REGEX.test(params.body.startTime)
    ) {
      throw new SchedulingWorkflowError(400, 'Invalid start time format. Use HH:MM');
    }
    updateData.startTime = params.body.startTime;
  }

  if (params.body.endTime !== undefined) {
    if (
      typeof params.body.endTime !== 'string' ||
      !TIME_REGEX.test(params.body.endTime)
    ) {
      throw new SchedulingWorkflowError(400, 'Invalid end time format. Use HH:MM');
    }
    updateData.endTime = params.body.endTime;
  }

  const finalStart =
    (updateData.startTime as string | undefined) ?? existing.startTime;
  const finalEnd = (updateData.endTime as string | undefined) ?? existing.endTime;
  const [sh, sm] = finalStart.split(':').map(Number);
  const [eh, em] = finalEnd.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    throw new SchedulingWorkflowError(400, 'End time must be after start time');
  }

  if (params.body.availabilityType !== undefined) {
    const type =
      typeof params.body.availabilityType === 'string'
        ? params.body.availabilityType.toUpperCase()
        : '';
    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      throw new SchedulingWorkflowError(400, 'Invalid availability type');
    }
    updateData.availabilityType = type as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';
  }

  if (params.body.effectiveFrom !== undefined) {
    updateData.effectiveFrom = new Date(String(params.body.effectiveFrom));
  }
  if (params.body.effectiveTo !== undefined) {
    updateData.effectiveTo =
      params.body.effectiveTo === null
        ? null
        : new Date(String(params.body.effectiveTo));
  }
  if (params.body.recurring !== undefined) {
    updateData.recurring = Boolean(params.body.recurring);
  }
  if (params.body.notes !== undefined) {
    updateData.notes =
      typeof params.body.notes === 'string' ? params.body.notes : null;
  }

  return prisma.employeeAvailability.update({
    where: { id: params.availabilityId },
    data: updateData,
    include: AVAILABILITY_INCLUDE,
  });
}

export async function deleteOwnAvailability(params: {
  businessId: string;
  userId: string;
  availabilityId: string;
}) {
  const existing = await prisma.employeeAvailability.findUnique({
    where: { id: params.availabilityId },
    include: { employeePosition: { include: { user: true } } },
  });

  if (!existing || existing.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Availability record not found');
  }
  if (existing.employeePosition.userId !== params.userId) {
    throw new SchedulingWorkflowError(403, 'You can only delete your own availability');
  }

  await prisma.employeeAvailability.delete({ where: { id: params.availabilityId } });
}

export async function updateEmployeeAvailabilityByAdmin(params: {
  businessId: string;
  availabilityId: string;
  body: Record<string, unknown>;
}) {
  const existing = await prisma.employeeAvailability.findFirst({
    where: { id: params.availabilityId, businessId: params.businessId },
  });

  if (!existing) {
    throw new SchedulingWorkflowError(404, 'Availability record not found');
  }

  const updateData: Prisma.EmployeeAvailabilityUpdateInput = {};

  if (typeof params.body.dayOfWeek === 'string') {
    const day = params.body.dayOfWeek.toUpperCase();
    if (!VALID_DAYS.includes(day as (typeof VALID_DAYS)[number])) {
      throw new SchedulingWorkflowError(400, 'Invalid day of week');
    }
    updateData.dayOfWeek = day;
  }

  if (params.body.startTime !== undefined) {
    if (
      typeof params.body.startTime !== 'string' ||
      !TIME_REGEX.test(params.body.startTime)
    ) {
      throw new SchedulingWorkflowError(400, 'Invalid start time format. Use HH:MM');
    }
    updateData.startTime = params.body.startTime;
  }

  if (params.body.endTime !== undefined) {
    if (
      typeof params.body.endTime !== 'string' ||
      !TIME_REGEX.test(params.body.endTime)
    ) {
      throw new SchedulingWorkflowError(400, 'Invalid end time format. Use HH:MM');
    }
    updateData.endTime = params.body.endTime;
  }

  const finalStart =
    (updateData.startTime as string | undefined) ?? existing.startTime;
  const finalEnd = (updateData.endTime as string | undefined) ?? existing.endTime;
  const [sh, sm] = finalStart.split(':').map(Number);
  const [eh, em] = finalEnd.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    throw new SchedulingWorkflowError(400, 'End time must be after start time');
  }

  if (params.body.availabilityType !== undefined) {
    const type =
      typeof params.body.availabilityType === 'string'
        ? params.body.availabilityType.toUpperCase()
        : '';
    if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      throw new SchedulingWorkflowError(400, 'Invalid availability type');
    }
    updateData.availabilityType = type as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';
  }

  if (params.body.recurring !== undefined) {
    updateData.recurring = Boolean(params.body.recurring);
  }
  if (params.body.notes !== undefined) {
    updateData.notes =
      typeof params.body.notes === 'string' ? params.body.notes : null;
  }
  if (params.body.effectiveFrom !== undefined) {
    updateData.effectiveFrom = new Date(String(params.body.effectiveFrom));
  }
  if (params.body.effectiveTo !== undefined) {
    updateData.effectiveTo =
      params.body.effectiveTo === null
        ? null
        : new Date(String(params.body.effectiveTo));
  }

  return prisma.employeeAvailability.update({
    where: { id: params.availabilityId },
    data: updateData,
    include: AVAILABILITY_INCLUDE,
  });
}

export async function assertAdminAvailabilityAccess(
  businessId: string,
  userId: string
): Promise<void> {
  await assertBusinessMemberActive(businessId, userId);
}
