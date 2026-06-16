import { Prisma, TimeOffStatus, TimeOffType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { syncTimeOffRequestCalendar } from './hrScheduleService';
import { NotificationService } from './notificationService';
import {
  recordPtoApproved,
  recordPtoDenied,
  recordPtoRequested,
} from './hrActivityService';
import { HRWorkflowError } from './hrServiceShared';

export async function calculateTimeOffBalance(
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
    if (hireDate > startOfYear) {
      const daysInYear = 365;
      const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / (24 * 60 * 60 * 1000));
      const prorated = Math.floor((allotment * daysSinceHire) / daysInYear);
      allotment = Math.max(0, prorated);
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

  const usedDays = approved.reduce((acc: number, request) => {
    const one = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.round((request.endDate.getTime() - request.startDate.getTime()) / one) + 1
    );
    return acc + days;
  }, 0);

  const pendingDays = pending.reduce((acc: number, request) => {
    const one = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.round((request.endDate.getTime() - request.startDate.getTime()) / one) + 1
    );
    return acc + days;
  }, 0);

  const monthsIntoYear = now.getMonth() + 1;
  const accrued = Math.floor((allotment * monthsIntoYear) / 12);
  const available = Math.max(0, allotment - usedDays);

  return {
    available,
    used: usedDays,
    allotment,
    accrued,
    pending: pendingDays,
  };
}

export interface RequestTimeOffParams {
  businessId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export class TimeOffConflictError extends Error {
  constructor(
    message: string,
    public readonly conflictingRequest: {
      id: string;
      startDate: Date;
      endDate: Date;
      status: TimeOffStatus;
    }
  ) {
    super(message);
    this.name = 'TimeOffConflictError';
  }
}

export class InsufficientPtoBalanceError extends Error {
  constructor(
    message: string,
    public readonly balance: {
      available: number;
      requested: number;
      used: number;
      allotment: number;
    }
  ) {
    super(message);
    this.name = 'InsufficientPtoBalanceError';
  }
}

export async function requestTimeOff(params: RequestTimeOffParams) {
  const { businessId, userId, userName, userEmail, type, startDate, endDate, reason } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HRWorkflowError(400, 'Invalid date format');
  }

  if (start > end) {
    throw new HRWorkflowError(400, 'Start date must be before or equal to end date');
  }

  if (start < new Date()) {
    throw new HRWorkflowError(400, 'Cannot request time off in the past');
  }

  const employeePosition = await prisma.employeePosition.findFirst({
    where: { userId, businessId, active: true },
  });
  if (!employeePosition) {
    throw new HRWorkflowError(400, 'No active employee position found for user');
  }

  const normalizedType = type.toUpperCase() as TimeOffType;
  if (!Object.values(TimeOffType).includes(normalizedType)) {
    throw new HRWorkflowError(400, 'Invalid time-off type requested');
  }

  const overlapping = await prisma.timeOffRequest.findFirst({
    where: {
      businessId,
      employeePositionId: employeePosition.id,
      status: { not: TimeOffStatus.CANCELED },
      OR: [
        {
          AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
        },
      ],
    },
  });

  if (overlapping) {
    throw new TimeOffConflictError('You already have a time-off request for this period', {
      id: overlapping.id,
      startDate: overlapping.startDate,
      endDate: overlapping.endDate,
      status: overlapping.status,
    });
  }

  if (normalizedType === TimeOffType.PTO) {
    const balance = await calculateTimeOffBalance(businessId, employeePosition.id, TimeOffType.PTO);

    const one = 24 * 60 * 60 * 1000;
    const requestedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / one) + 1);

    if (requestedDays > balance.available) {
      throw new InsufficientPtoBalanceError(
        `Insufficient PTO balance. Requested: ${requestedDays} days, Available: ${balance.available} days`,
        {
          available: balance.available,
          requested: requestedDays,
          used: balance.used,
          allotment: balance.allotment,
        }
      );
    }

    if (balance.available <= 3 && balance.available > 0) {
      try {
        await NotificationService.createNotification({
          userId,
          type: 'hr_time_off_balance_low',
          title: 'Low PTO Balance Warning',
          body: `You have ${balance.available} day${balance.available !== 1 ? 's' : ''} of PTO remaining. Consider planning your time off accordingly.`,
          data: {
            businessId,
            employeePositionId: employeePosition.id,
            balance: balance.available,
            allotment: balance.allotment,
            used: balance.used,
            actionUrl: `/business/${businessId}/workspace/hr/me`,
          },
        });
      } catch (notificationError: unknown) {
        const e = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
        void logger.error('Error sending balance low notification', {
          operation: 'hr_timeoff_balance_notification',
          error: { message: e.message, stack: e.stack },
        });
      }
    }
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
                    include: {
                      user: { select: { id: true, name: true, email: true } },
                    },
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
    const e = syncError instanceof Error ? syncError : new Error(String(syncError));
    void logger.error('Error syncing time-off calendar', {
      operation: 'hr_timeoff_calendar_sync',
      error: { message: e.message, stack: e.stack },
    });
  }

  try {
    const managerPosition = request.employeePosition?.position?.reportsTo?.employeePositions?.[0];
    const managerUserId = managerPosition?.user?.id;

    if (managerUserId) {
      const employeeName = userName || userEmail || 'An employee';
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);

      await NotificationService.createNotification({
        userId: managerUserId,
        type: 'hr_time_off_request_submitted',
        title: 'Time-Off Request Submitted',
        body: `${employeeName} has submitted a ${normalizedType} request for ${days} day${days !== 1 ? 's' : ''} (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`,
        data: {
          requestId: request.id,
          businessId,
          employeePositionId: employeePosition.id,
          employeeUserId: userId,
          type: normalizedType,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          actionUrl: `/business/${businessId}/workspace/hr/team`,
        },
      });
    }
  } catch (notificationError: unknown) {
    const e = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    void logger.error('Error sending time-off request notification', {
      operation: 'hr_timeoff_request_notification',
      error: { message: e.message, stack: e.stack },
    });
  }

  await recordPtoRequested({
    actorUserId: userId,
    businessId,
    timeOffRequestId: request.id,
    employeePositionId: employeePosition.id,
    type: normalizedType,
  });

  return { request };
}

export async function getPendingTeamTimeOff(businessId: string, managerUserId: string) {
  const managerPosition = await prisma.employeePosition.findFirst({
    where: { userId: managerUserId, businessId, active: true },
  });
  if (!managerPosition) return { requests: [] };

  const directReportPositions = await prisma.position.findMany({
    where: { businessId, reportsToId: managerPosition.positionId },
  });
  const reportPositionIds = directReportPositions.map((p) => p.id);

  const requests = await prisma.timeOffRequest.findMany({
    where: {
      businessId,
      status: TimeOffStatus.PENDING,
      employeePosition: { positionId: { in: reportPositionIds } },
    },
    include: {
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          position: { include: { department: true, tier: true } },
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  });

  return { requests };
}

export interface ApproveTeamTimeOffParams {
  businessId: string;
  managerUserId: string;
  managerName: string | null;
  managerEmail: string | null;
  requestId: string;
  decision: 'APPROVE' | 'DENY';
  note?: string;
}

export async function approveTeamTimeOff(params: ApproveTeamTimeOffParams) {
  const { businessId, managerUserId, managerName, managerEmail, requestId, decision, note } = params;

  const tor = await prisma.timeOffRequest.findFirst({ where: { id: requestId, businessId } });
  if (!tor) {
    throw new HRWorkflowError(404, 'Request not found');
  }

  const managerPosition = await prisma.employeePosition.findFirst({
    where: { userId: managerUserId, businessId, active: true },
  });
  if (!managerPosition) {
    throw new HRWorkflowError(403, 'Not a manager in this business');
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
    throw new HRWorkflowError(403, 'Not authorized to approve this request');
  }

  const status = decision === 'APPROVE' ? TimeOffStatus.APPROVED : TimeOffStatus.DENIED;
  const updatedRequest = await prisma.timeOffRequest.update({
    where: { id: requestId },
    data: { status, approvedById: managerUserId, approvedAt: new Date(), managerNote: note || null },
    include: {
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  try {
    await syncTimeOffRequestCalendar(requestId);
  } catch (syncError: unknown) {
    const e = syncError instanceof Error ? syncError : new Error(String(syncError));
    void logger.error('Error syncing time-off calendar', {
      operation: 'hr_timeoff_calendar_sync',
      error: { message: e.message, stack: e.stack },
    });
  }

  try {
    const employeeUserId = updatedRequest.employeePosition?.user?.id;
    if (employeeUserId) {
      const managerDisplayName = managerName || managerEmail || 'Your manager';
      const days = Math.max(
        1,
        Math.round(
          (new Date(updatedRequest.endDate).getTime() - new Date(updatedRequest.startDate).getTime()) /
            (24 * 60 * 60 * 1000)
        ) + 1
      );

      if (status === TimeOffStatus.APPROVED) {
        await NotificationService.createNotification({
          userId: employeeUserId,
          type: 'hr_time_off_request_approved',
          title: 'Time-Off Request Approved ✅',
          body: `${managerDisplayName} has approved your ${updatedRequest.type} request for ${days} day${days !== 1 ? 's' : ''} (${new Date(updatedRequest.startDate).toLocaleDateString()} - ${new Date(updatedRequest.endDate).toLocaleDateString()})`,
          data: {
            requestId: updatedRequest.id,
            businessId,
            type: updatedRequest.type,
            startDate: updatedRequest.startDate.toISOString(),
            endDate: updatedRequest.endDate.toISOString(),
            actionUrl: `/business/${businessId}/workspace/hr/me`,
          },
        });
      } else {
        await NotificationService.createNotification({
          userId: employeeUserId,
          type: 'hr_time_off_request_denied',
          title: 'Time-Off Request Denied',
          body: `${managerDisplayName} has denied your ${updatedRequest.type} request for ${days} day${days !== 1 ? 's' : ''}.${note ? ` Note: ${note}` : ''}`,
          data: {
            requestId: updatedRequest.id,
            businessId,
            type: updatedRequest.type,
            startDate: updatedRequest.startDate.toISOString(),
            endDate: updatedRequest.endDate.toISOString(),
            actionUrl: `/business/${businessId}/workspace/hr/me`,
          },
        });
      }
    }
  } catch (notificationError: unknown) {
    const e = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    void logger.error('Error sending time-off approval notification', {
      operation: 'hr_timeoff_approval_notification',
      error: { message: e.message, stack: e.stack },
    });
  }

  if (status === TimeOffStatus.APPROVED) {
    await recordPtoApproved({
      actorUserId: managerUserId,
      businessId,
      timeOffRequestId: updatedRequest.id,
      employeePositionId: updatedRequest.employeePositionId,
    });
  } else {
    await recordPtoDenied({
      actorUserId: managerUserId,
      businessId,
      timeOffRequestId: updatedRequest.id,
      employeePositionId: updatedRequest.employeePositionId,
    });
  }

  return { status };
}

export async function getTimeOffBalance(businessId: string, userId: string) {
  const ep = await prisma.employeePosition.findFirst({
    where: { userId, businessId, active: true },
  });
  if (!ep) {
    return {
      balance: { pto: 0, sick: 0, personal: 0 },
      used: { pto: 0, sick: 0, personal: 0 },
    };
  }

  const [ptoBalance, sickBalance, personalBalance] = await Promise.all([
    calculateTimeOffBalance(businessId, ep.id, TimeOffType.PTO),
    calculateTimeOffBalance(businessId, ep.id, TimeOffType.SICK),
    calculateTimeOffBalance(businessId, ep.id, TimeOffType.PERSONAL),
  ]);

  return {
    balance: {
      pto: ptoBalance.available,
      sick: sickBalance.available,
      personal: personalBalance.available,
    },
    used: {
      pto: ptoBalance.used,
      sick: sickBalance.used,
      personal: personalBalance.used,
    },
    allotment: {
      pto: ptoBalance.allotment,
      sick: sickBalance.allotment,
      personal: personalBalance.allotment,
    },
    pending: {
      pto: ptoBalance.pending,
      sick: sickBalance.pending,
      personal: personalBalance.pending,
    },
    accrued: {
      pto: ptoBalance.accrued,
      sick: sickBalance.accrued,
      personal: personalBalance.accrued,
    },
  };
}

export async function getMyTimeOffRequests(
  businessId: string,
  userId: string,
  page: number,
  pageSize: number
) {
  const skip = (page - 1) * pageSize;

  const employeePosition = await prisma.employeePosition.findFirst({
    where: { userId, businessId },
  });
  if (!employeePosition) {
    return { requests: [], count: 0, page, pageSize };
  }

  const [requests, count] = await Promise.all([
    prisma.timeOffRequest.findMany({
      where: { businessId, employeePositionId: employeePosition.id },
      orderBy: { requestedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.timeOffRequest.count({
      where: { businessId, employeePositionId: employeePosition.id },
    }),
  ]);

  return { requests, count, page, pageSize };
}

export async function cancelTimeOffRequest(businessId: string, userId: string, requestId: string) {
  const request = await prisma.timeOffRequest.findFirst({
    where: { id: requestId, businessId },
    include: {
      employeePosition: {
        select: { userId: true },
      },
    },
  });

  if (!request) {
    throw new HRWorkflowError(404, 'Time-off request not found');
  }

  if (request.employeePosition.userId !== userId) {
    throw new HRWorkflowError(403, 'You can only cancel your own time-off requests');
  }

  if (request.status !== TimeOffStatus.PENDING) {
    throw new HRWorkflowError(400, 'Only pending requests can be canceled');
  }

  await prisma.timeOffRequest.update({
    where: { id: requestId },
    data: { status: TimeOffStatus.CANCELED },
  });

  try {
    await syncTimeOffRequestCalendar(requestId);
  } catch (syncError: unknown) {
    const e = syncError instanceof Error ? syncError : new Error(String(syncError));
    void logger.error('Error syncing time-off calendar', {
      operation: 'hr_timeoff_calendar_sync',
      error: { message: e.message, stack: e.stack },
    });
  }

  return { canceled: true };
}

export interface GetTimeOffCalendarParams {
  businessId: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

export async function getTimeOffCalendar(params: GetTimeOffCalendarParams) {
  const { businessId, startDate, endDate, departmentId } = params;

  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    if (startDate && endDate) {
      dateFilter.OR = [
        {
          AND: [{ startDate: { lte: new Date(endDate) } }, { endDate: { gte: new Date(startDate) } }],
        },
      ];
    } else if (startDate) {
      dateFilter.endDate = { gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.startDate = { lte: new Date(endDate) };
    }
  }

  const where: Record<string, unknown> = {
    businessId,
    status: { in: [TimeOffStatus.PENDING, TimeOffStatus.APPROVED] },
    ...dateFilter,
  };

  if (departmentId) {
    where.employeePosition = {
      position: {
        departmentId,
      },
    };
  }

  const requests = await prisma.timeOffRequest.findMany({
    where,
    include: {
      employeePosition: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          position: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  return { requests };
}
