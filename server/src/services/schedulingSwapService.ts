import { Prisma, SwapStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { syncSingleShiftToCalendar } from './hrScheduleService';
import { recordShiftSwapCompleted, recordShiftSwapRequested } from './schedulingActivityService';
import {
  recordSchedulingSwapRequestedDomainEvent,
  recordSchedulingSwapResolvedDomainEvent,
} from './schedulingDomainEventService';
import { notifySwapRequested, notifySwapResolved } from './schedulingNotificationService';
import {
  ManagerScope,
  SWAP_LIST_INCLUDE,
  SchedulingWorkflowError,
  resolveManagerScope,
} from './schedulingServiceShared';

const swapDetailInclude = {
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

async function applySwapApprovalShiftAssignment(params: {
  businessId: string;
  swapRequest: {
    requestedToId: string | null;
    originalShiftId: string;
    originalShift: { employeePositionId: string | null; scheduleId: string };
  };
}): Promise<void> {
  if (
    !params.swapRequest.requestedToId ||
    !params.swapRequest.originalShift.employeePositionId
  ) {
    return;
  }

  const requestedEmployeePosition = await prisma.employeePosition.findFirst({
    where: {
      userId: params.swapRequest.requestedToId,
      businessId: params.businessId,
      active: true,
    },
  });

  if (!requestedEmployeePosition) return;

  const schedule = await prisma.schedule.findUnique({
    where: { id: params.swapRequest.originalShift.scheduleId },
    select: { status: true },
  });

  await prisma.scheduleShift.update({
    where: { id: params.swapRequest.originalShiftId },
    data: {
      employeePositionId: requestedEmployeePosition.id,
      status: 'FILLED',
    },
  });

  if (schedule?.status === 'PUBLISHED') {
    try {
      await syncSingleShiftToCalendar(
        params.swapRequest.originalShiftId,
        params.businessId
      );
    } catch (calendarError: unknown) {
      const err =
        calendarError instanceof Error ? calendarError : new Error('Unknown error');
      logger.warn('Failed to sync shift swap to calendar', {
        operation: 'approve_shift_swap_calendar_sync',
        shiftId: params.swapRequest.originalShiftId,
        error: { message: err.message, stack: err.stack },
      });
    }
  }
}

export async function listBusinessShiftSwapRequests(params: {
  businessId: string;
  status?: string;
}) {
  const where: Prisma.ShiftSwapRequestWhereInput = {
    businessId: params.businessId,
  };

  if (
    params.status &&
    ['PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED'].includes(
      params.status.toUpperCase()
    )
  ) {
    where.status = params.status.toUpperCase() as SwapStatus;
  }

  const swaps = await prisma.shiftSwapRequest.findMany({
    where,
    include: SWAP_LIST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  logger.info('Shift swap requests listed', {
    operation: 'list_shift_swap_requests',
    businessId: params.businessId,
    count: swaps.length,
  });

  return swaps;
}

export async function listPendingSwapRequestsForTeam(params: {
  businessId: string;
  scope: ManagerScope;
}) {
  const where: Prisma.ShiftSwapRequestWhereInput = {
    businessId: params.businessId,
    status: 'PENDING',
  };

  if (!params.scope.isAdmin && params.scope.directReportIds.length > 0) {
    where.OR = [
      {
        originalShift: {
          employeePositionId: { in: params.scope.directReportIds },
        },
      },
      { requestedToId: { in: params.scope.directReportIds } },
    ];
  }

  return prisma.shiftSwapRequest.findMany({
    where,
    include: swapDetailInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listOwnShiftSwapRequests(params: {
  businessId: string;
  userId: string;
  employeePositionId?: string;
}) {
  const orConditions: Prisma.ShiftSwapRequestWhereInput[] = [
    { requestedById: params.userId },
    { requestedToId: params.userId },
  ];

  if (params.employeePositionId) {
    orConditions.push({
      originalShift: { employeePositionId: params.employeePositionId },
    });
  }

  return prisma.shiftSwapRequest.findMany({
    where: { businessId: params.businessId, OR: orConditions },
    include: swapDetailInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function requestShiftSwap(params: {
  businessId: string;
  userId: string;
  userName?: string | null;
  shiftId: string;
  requestedToId?: string | null;
  coveredShiftId?: string;
  requestNotes?: string;
}) {
  const shift = await prisma.scheduleShift.findUnique({
    where: { id: params.shiftId },
    include: { employeePosition: { include: { user: true } } },
  });

  if (!shift || shift.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }
  if (!shift.employeePosition || shift.employeePosition.userId !== params.userId) {
    throw new SchedulingWorkflowError(
      403,
      'You can only request swaps for your own shifts'
    );
  }
  if (new Date(shift.startTime) < new Date()) {
    throw new SchedulingWorkflowError(
      400,
      'Cannot swap shifts that have already started'
    );
  }

  const swapReason =
    params.requestNotes ||
    (params.coveredShiftId
      ? `Willing to cover shift ${params.coveredShiftId}`
      : null);

  const swapRequest = await prisma.shiftSwapRequest.create({
    data: {
      businessId: params.businessId,
      originalShiftId: params.shiftId,
      requestedById: params.userId,
      requestedToId: params.requestedToId ?? null,
      reason: swapReason,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    include: swapDetailInclude,
  });

  await recordShiftSwapRequested({
    actorUserId: params.userId,
    businessId: params.businessId,
    swapId: swapRequest.id,
    shiftId: params.shiftId,
    requestedToId: swapRequest.requestedToId,
  });

  recordSchedulingSwapRequestedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    swapId: swapRequest.id,
    shiftId: params.shiftId,
    requestedToId: swapRequest.requestedToId,
  });

  if (shift.employeePositionId) {
    await notifySwapRequested({
      actorUserId: params.userId,
      businessId: params.businessId,
      swapId: swapRequest.id,
      shiftId: params.shiftId,
      employeePositionId: shift.employeePositionId,
      actorName: params.userName,
    });
  }

  return swapRequest;
}

export async function cancelShiftSwapRequest(params: {
  businessId: string;
  userId: string;
  swapId: string;
}) {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.swapId },
    include: {
      originalShift: {
        include: { employeePosition: { include: { user: true } } },
      },
    },
  });

  if (!swapRequest || swapRequest.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Swap request not found');
  }
  if (swapRequest.requestedById !== params.userId) {
    throw new SchedulingWorkflowError(
      403,
      'You can only cancel your own swap requests'
    );
  }
  if (swapRequest.status !== 'PENDING') {
    throw new SchedulingWorkflowError(400, 'Can only cancel pending swap requests');
  }

  return prisma.shiftSwapRequest.update({
    where: { id: params.swapId },
    data: { status: 'CANCELLED' },
    include: swapDetailInclude,
  });
}

export async function approveShiftSwap(params: {
  businessId: string;
  swapId: string;
  actorUserId: string;
  notes?: string;
  notesLabel: 'Manager notes' | 'Admin notes';
}) {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.swapId },
    include: {
      originalShift: { include: { employeePosition: true } },
    },
  });

  if (!swapRequest || swapRequest.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Swap request not found');
  }
  if (swapRequest.status !== 'PENDING') {
    throw new SchedulingWorkflowError(400, 'Swap request is not pending');
  }

  const updatedSwap = await prisma.shiftSwapRequest.update({
    where: { id: params.swapId },
    data: {
      status: 'APPROVED',
      approvedById: params.actorUserId,
      approvedAt: new Date(),
      reason: params.notes
        ? `${swapRequest.reason || ''}\n\n${params.notesLabel}: ${params.notes}`
        : swapRequest.reason,
    },
    include: swapDetailInclude,
  });

  await applySwapApprovalShiftAssignment({
    businessId: params.businessId,
    swapRequest,
  });

  await recordShiftSwapCompleted({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'approved',
  });

  recordSchedulingSwapResolvedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'approved',
  });

  await notifySwapResolved({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'approved',
    recipientUserIds: [
      swapRequest.requestedById,
      swapRequest.requestedToId ?? '',
    ].filter(Boolean),
  });

  return updatedSwap;
}

export async function denyShiftSwap(params: {
  businessId: string;
  swapId: string;
  actorUserId: string;
  notes?: string;
  notesLabel: 'Manager notes' | 'Admin notes';
}) {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.swapId },
  });

  if (!swapRequest || swapRequest.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Swap request not found');
  }
  if (swapRequest.status !== 'PENDING') {
    throw new SchedulingWorkflowError(400, 'Swap request is not pending');
  }

  const updatedSwap = await prisma.shiftSwapRequest.update({
    where: { id: params.swapId },
    data: {
      status: 'DENIED',
      approvedById: params.actorUserId,
      approvedAt: new Date(),
      reason: params.notes
        ? `${swapRequest.reason || ''}\n\n${params.notesLabel}: ${params.notes}`
        : swapRequest.reason,
    },
    include: swapDetailInclude,
  });

  await recordShiftSwapCompleted({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'denied',
  });

  recordSchedulingSwapResolvedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'denied',
  });

  await notifySwapResolved({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    swapId: params.swapId,
    shiftId: swapRequest.originalShiftId,
    outcome: 'denied',
    recipientUserIds: [
      swapRequest.requestedById,
      swapRequest.requestedToId ?? '',
    ].filter(Boolean),
  });

  return updatedSwap;
}

export { resolveManagerScope as resolveManagerScopeFromRequest };
