import { TimeOffStatus, TimeOffType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';
import { syncTimeOffRequestCalendar } from './hrScheduleService';

export type HRAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

async function calculateTimeOffBalance(
  userId: string,
  businessId: string,
  employeePositionId: string,
  type?: TimeOffType
): Promise<{ available: number; used: number; allotment: number; accrued: number; pending: number }> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  const hrProfile = await prisma.employeeHRProfile.findUnique({
    where: { employeePositionId },
    select: { hireDate: true },
  });

  const defaultAllotments: Record<string, number> = {
    PTO: 15,
    SICK: 10,
    PERSONAL: 5,
    UNPAID: 0,
  };

  let allotment = type ? defaultAllotments[type] || 0 : 15;

  if (hrProfile?.hireDate && type === TimeOffType.PTO) {
    const hireDate = new Date(hrProfile.hireDate);
    const startOfYearDate = new Date(now.getFullYear(), 0, 1);
    if (hireDate > startOfYearDate) {
      const daysInYear = 365;
      const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (24 * 60 * 60 * 1000));
      allotment = Math.max(0, Math.floor((allotment * daysSinceHire) / daysInYear));
    }
  }

  const approved = await prisma.timeOffRequest.findMany({
    where: {
      businessId,
      employeePositionId,
      status: TimeOffStatus.APPROVED,
      ...(type ? { type } : {}),
      startDate: { gte: startOfYear, lte: endOfYear },
    },
  });

  const pending = await prisma.timeOffRequest.findMany({
    where: {
      businessId,
      employeePositionId,
      status: TimeOffStatus.PENDING,
      ...(type ? { type } : {}),
      startDate: { gte: startOfYear, lte: endOfYear },
    },
  });

  const dayMs = 24 * 60 * 60 * 1000;
  const usedDays = approved.reduce((acc, request) => {
    const days = Math.max(1, Math.round((request.endDate.getTime() - request.startDate.getTime()) / dayMs) + 1);
    return acc + days;
  }, 0);

  const pendingDays = pending.reduce((acc, request) => {
    const days = Math.max(1, Math.round((request.endDate.getTime() - request.startDate.getTime()) / dayMs) + 1);
    return acc + days;
  }, 0);

  const monthsIntoYear = now.getMonth() + 1;
  const accrued = Math.floor((allotment * monthsIntoYear) / 12);
  const available = Math.max(0, allotment - usedDays);

  return { available, used: usedDays, allotment, accrued, pending: pendingDays };
}

export async function aiRequestTimeOff(params: {
  userId: string;
  businessId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}): Promise<HRAIActionOutcome> {
  try {
    const { userId, businessId, type, startDate, endDate, reason } = params;
    if (!type || !startDate || !endDate) {
      return { success: false, error: 'Type, start date, and end date are required' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, error: 'Invalid date format' };
    }
    if (start > end) {
      return { success: false, error: 'Start date must be before or equal to end date' };
    }
    if (start < new Date()) {
      return { success: false, error: 'Cannot request time off in the past' };
    }

    const employeePosition = await prisma.employeePosition.findFirst({
      where: { userId, businessId, active: true },
    });
    if (!employeePosition) {
      return { success: false, error: 'No active employee position found for user' };
    }

    const normalizedType = type.toUpperCase() as TimeOffType;
    if (!Object.values(TimeOffType).includes(normalizedType)) {
      return { success: false, error: 'Invalid time-off type requested' };
    }

    const overlapping = await prisma.timeOffRequest.findFirst({
      where: {
        businessId,
        employeePositionId: employeePosition.id,
        status: { not: TimeOffStatus.CANCELED },
        AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
      },
    });
    if (overlapping) {
      return {
        success: false,
        error: 'You already have a time-off request for this period',
      };
    }

    if (normalizedType === TimeOffType.PTO) {
      const balance = await calculateTimeOffBalance(
        userId,
        businessId,
        employeePosition.id,
        TimeOffType.PTO
      );
      const dayMs = 24 * 60 * 60 * 1000;
      const requestedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
      if (requestedDays > balance.available) {
        return {
          success: false,
          error: `Insufficient PTO balance. Requested: ${requestedDays} days, Available: ${balance.available} days`,
        };
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        businessId,
        employeePositionId: employeePosition.id,
        type: normalizedType,
        startDate: start,
        endDate: end,
        reason: reason || null,
        status: TimeOffStatus.PENDING,
        requestedById: userId,
      },
      include: {
        employeePosition: {
          include: {
            position: {
              include: {
                reportsTo: {
                  include: {
                    employeePositions: {
                      where: { businessId, active: true },
                      include: { user: { select: { id: true, name: true, email: true } } },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    try {
      await syncTimeOffRequestCalendar(request.id);
    } catch (syncError: unknown) {
      const err = syncError instanceof Error ? syncError : new Error(String(syncError));
      await logger.warn('HR AI time-off calendar sync failed', {
        operation: 'hr_ai_timeoff_calendar_sync',
        error: { message: err.message },
      });
    }

    return { success: true, data: { message: 'Time-off request submitted', request } };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to submit time-off request' };
  }
}

export async function aiApproveTimeOff(params: {
  managerUserId: string;
  businessId: string;
  requestId: string;
  decision: 'APPROVE' | 'DENY';
  note?: string | null;
}): Promise<HRAIActionOutcome> {
  try {
    const { managerUserId, businessId, requestId, decision, note } = params;
    if (!decision || (decision !== 'APPROVE' && decision !== 'DENY')) {
      return { success: false, error: 'decision must be either APPROVE or DENY' };
    }

    const tor = await prisma.timeOffRequest.findFirst({ where: { id: requestId, businessId } });
    if (!tor) {
      return { success: false, error: 'Request not found' };
    }

    const managerPosition = await prisma.employeePosition.findFirst({
      where: { userId: managerUserId, businessId, active: true },
    });
    if (!managerPosition) {
      return { success: false, error: 'Not a manager in this business' };
    }

    const directReportPositions = await prisma.position.findMany({
      where: { businessId, reportsToId: managerPosition.positionId },
    });
    const reportPositionIds = directReportPositions.map((p) => p.id);
    const targetEP = await prisma.employeePosition.findFirst({
      where: { id: tor.employeePositionId, businessId },
      select: { positionId: true },
    });
    if (!targetEP || !reportPositionIds.includes(targetEP.positionId)) {
      return { success: false, error: 'Not authorized to approve this request' };
    }

    const status = decision === 'APPROVE' ? TimeOffStatus.APPROVED : TimeOffStatus.DENIED;
    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedById: managerUserId,
        approvedAt: new Date(),
        managerNote: note || null,
      },
      include: {
        employeePosition: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    try {
      await syncTimeOffRequestCalendar(requestId);
    } catch (syncError: unknown) {
      const err = syncError instanceof Error ? syncError : new Error(String(syncError));
      await logger.warn('HR AI time-off calendar sync failed', {
        operation: 'hr_ai_timeoff_calendar_sync',
        error: { message: err.message },
      });
    }

    return { success: true, data: { request: updatedRequest } };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to approve time-off request' };
  }
}
