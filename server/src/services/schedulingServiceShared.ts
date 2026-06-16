import { BusinessRole, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { SchedulingWorkflowError } from './schedulingPublishService';

export { SchedulingWorkflowError } from './schedulingPublishService';

export interface ManagerScope {
  isAdmin: boolean;
  directReportIds: string[];
}

export interface TimeOffConflictPayload {
  type: string;
  startDate: string;
  endDate: string;
  employeeName: string;
}

export class TimeOffConflictError extends SchedulingWorkflowError {
  constructor(
    message: string,
    public readonly conflict: TimeOffConflictPayload
  ) {
    super(409, message);
    this.name = 'TimeOffConflictError';
  }
}

export const SHIFT_DETAIL_INCLUDE = {
  employeePosition: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: { select: { id: true, title: true } },
    },
  },
  position: { select: { id: true, title: true } },
  location: {
    select: { id: true, name: true, address: true, description: true },
  },
} satisfies Prisma.ScheduleShiftInclude;

export const SHIFT_LIST_INCLUDE = {
  schedule: {
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  },
  ...SHIFT_DETAIL_INCLUDE,
} satisfies Prisma.ScheduleShiftInclude;

export const AVAILABILITY_INCLUDE = {
  employeePosition: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.EmployeeAvailabilityInclude;

export const SWAP_LIST_INCLUDE = {
  originalShift: {
    include: {
      schedule: { select: { id: true, name: true } },
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
  requestedBy: { select: { id: true, name: true, email: true } },
  requestedTo: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ShiftSwapRequestInclude;

export const SHIFT_TEMPLATE_INCLUDE = {
  position: { select: { id: true, title: true } },
} satisfies Prisma.ShiftTemplateInclude;

export async function resolveManagerScope(
  businessId: string,
  userId: string,
  directReportIds: string[] | undefined
): Promise<ManagerScope> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { role: true, canManage: true },
  });

  return {
    isAdmin: member?.role === BusinessRole.ADMIN || member?.canManage === true,
    directReportIds: directReportIds ?? [],
  };
}

export function assertEmployeeInManagerScope(
  employeePositionId: string,
  scope: ManagerScope
): void {
  if (scope.isAdmin) return;
  if (!scope.directReportIds.includes(employeePositionId)) {
    throw new SchedulingWorkflowError(
      403,
      'You can only manage shifts for employees on your team'
    );
  }
}

export async function assertActiveEmployeePosition(
  businessId: string,
  employeePositionId: string
): Promise<void> {
  const position = await prisma.employeePosition.findFirst({
    where: { id: employeePositionId, businessId, active: true },
    select: { id: true },
  });
  if (!position) {
    throw new SchedulingWorkflowError(404, 'Employee position not found or inactive');
  }
}

export async function assertNoTimeOffConflict(params: {
  businessId: string;
  employeePositionId: string;
  startTime: Date;
  endTime: Date;
}): Promise<void> {
  const conflict = await prisma.timeOffRequest.findFirst({
    where: {
      businessId: params.businessId,
      employeePositionId: params.employeePositionId,
      status: { in: ['APPROVED', 'PENDING'] },
      AND: [
        { startDate: { lte: params.endTime } },
        { endDate: { gte: params.startTime } },
      ],
    },
    include: {
      employeePosition: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!conflict) return;

  const employeeName = conflict.employeePosition?.user?.name ?? 'Employee';
  const conflictType = conflict.status === 'APPROVED' ? 'approved' : 'pending';
  const startDate = conflict.startDate.toISOString().split('T')[0];
  const endDate = conflict.endDate.toISOString().split('T')[0];

  throw new TimeOffConflictError(
    `${employeeName} has ${conflictType} time-off during this shift`,
    {
      type: conflict.type,
      startDate,
      endDate,
      employeeName,
    }
  );
}

export async function assertNoOverlappingShift(params: {
  businessId: string;
  employeePositionId: string;
  shiftId: string;
  startTime: Date;
  endTime: Date;
}): Promise<void> {
  const overlap = await prisma.scheduleShift.findFirst({
    where: {
      businessId: params.businessId,
      employeePositionId: params.employeePositionId,
      id: { not: params.shiftId },
      trashedAt: null,
      status: { not: 'CANCELLED' },
      OR: [
        {
          AND: [
            { startTime: { lte: params.startTime } },
            { endTime: { gt: params.startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: params.endTime } },
            { endTime: { gte: params.endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: params.startTime } },
            { endTime: { lte: params.endTime } },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (overlap) {
    throw new SchedulingWorkflowError(
      409,
      'Employee is already scheduled for a shift during this time period'
    );
  }
}

export async function assertBusinessMemberActive(
  businessId: string,
  userId: string
): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true },
  });
  if (!member?.isActive) {
    throw new SchedulingWorkflowError(403, 'Access denied');
  }
}
