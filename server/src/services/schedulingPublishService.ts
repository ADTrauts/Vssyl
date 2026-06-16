import {
  AttendanceRecordStatus,
  Prisma,
  ScheduleStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getChatSocketService } from './chatSocketService';
import { recordSchedulePublished } from './schedulingActivityService';
import { recordSchedulingSchedulePublishedDomainEvent } from './schedulingDomainEventService';
import { notifySchedulePublished } from './schedulingNotificationService';
import { SCHEDULING_NOT_TRASHED } from './schedulingTrashService';

export class SchedulingWorkflowError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'SchedulingWorkflowError';
  }
}

export interface PublishScheduleParams {
  scheduleId: string;
  businessId: string;
  actorUserId: string;
  /** When set, non-admin managers may only publish schedules with team-assigned shifts. */
  managerScope?: {
    isAdmin: boolean;
    directReportIds: string[];
  };
}

const scheduleWithShiftsInclude = {
  shifts: {
    where: SCHEDULING_NOT_TRASHED,
    include: {
      employeePosition: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          position: { select: { id: true, title: true } },
        },
      },
      position: { select: { id: true, title: true } },
      location: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ScheduleInclude;

/**
 * Publish a schedule: HR attendance stubs, calendar sync, activity, notifications, realtime.
 * Shared by admin and manager publish routes (G09).
 */
export async function publishBusinessSchedule(params: PublishScheduleParams) {
  const { scheduleId, businessId, actorUserId, managerScope } = params;

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, businessId, ...SCHEDULING_NOT_TRASHED },
    include: scheduleWithShiftsInclude,
  });

  if (!schedule) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  if (schedule.shifts.length === 0) {
    throw new SchedulingWorkflowError(400, 'Cannot publish empty schedule');
  }

  if (managerScope && !managerScope.isAdmin) {
    if (managerScope.directReportIds.length === 0) {
      throw new SchedulingWorkflowError(403, 'No team members under your management scope');
    }
    const hasTeamShift = schedule.shifts.some(
      (shift) =>
        shift.employeePositionId &&
        managerScope.directReportIds.includes(shift.employeePositionId)
    );
    if (!hasTeamShift) {
      throw new SchedulingWorkflowError(
        403,
        'You can only publish schedules that include shifts assigned to your team'
      );
    }
  }

  const updatedSchedule = await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: ScheduleStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedById: actorUserId,
    },
  });

  await syncExpectedAttendanceOnPublish(schedule);
  await syncCalendarOnPublish(scheduleId, businessId, schedule.shifts.length);

  try {
    const socketService = getChatSocketService();
    socketService.broadcastSchedulePublished(
      businessId,
      scheduleId,
      updatedSchedule as unknown as Record<string, unknown>
    );
  } catch (socketError: unknown) {
    const err = socketError instanceof Error ? socketError : new Error('Unknown error');
    logger.warn('Failed to broadcast schedule published event', {
      operation: 'publish_schedule_broadcast',
      scheduleId,
      error: { message: err.message, stack: err.stack },
    });
  }

  await recordSchedulePublished({
    actorUserId,
    businessId,
    scheduleId,
    shiftCount: schedule.shifts.length,
  });

  recordSchedulingSchedulePublishedDomainEvent({
    actorUserId,
    businessId,
    scheduleId,
    shiftCount: schedule.shifts.length,
  });

  await notifySchedulePublished({
    actorUserId,
    businessId,
    scheduleId,
    scheduleName: schedule.name,
    employeePositionIds: schedule.shifts.map((shift) => shift.employeePositionId),
  });

  try {
    const { onSchedulePublished } = await import('./workforceBridgeService.js');
    await onSchedulePublished({
      businessId,
      actorUserId,
      scheduleId,
      scheduleName: schedule.name,
    });
  } catch (bridgeError: unknown) {
    const err = bridgeError instanceof Error ? bridgeError : new Error('Unknown error');
    logger.warn('Workforce schedule publish bridge hook failed', {
      operation: 'publish_schedule_workforce_bridge',
      scheduleId,
      error: { message: err.message, stack: err.stack },
    });
  }

  logger.info('Schedule published', {
    operation: 'publish_schedule',
    userId: actorUserId,
    scheduleId,
    shiftCount: schedule.shifts.length,
  });

  return { schedule: updatedSchedule, shiftCount: schedule.shifts.length };
}

async function syncExpectedAttendanceOnPublish(
  schedule: Prisma.ScheduleGetPayload<{ include: typeof scheduleWithShiftsInclude }>
): Promise<void> {
  try {
    const hrInstallation = await prisma.businessModuleInstallation.findFirst({
      where: {
        businessId: schedule.businessId,
        moduleId: 'hr',
        enabled: true,
      },
    });

    if (!hrInstallation) return;

    const assignedShifts = schedule.shifts.filter((s) => s.employeePositionId);

    for (const shift of assignedShifts) {
      if (!shift.employeePositionId) continue;

      const shiftStart = new Date(shift.startTime);
      const shiftEnd = new Date(shift.endTime);
      const workDate = new Date(shiftStart);
      workDate.setHours(0, 0, 0, 0);

      const existingRecords = await prisma.attendanceRecord.findMany({
        where: {
          businessId: schedule.businessId,
          employeePositionId: shift.employeePositionId,
          workDate,
        },
      });

      const existingRecord = existingRecords.find((record) => {
        if (!record.metadata || typeof record.metadata !== 'object') return false;
        const meta = record.metadata as Record<string, unknown>;
        return meta.scheduleShiftId === shift.id;
      });

      if (!existingRecord) {
        await prisma.attendanceRecord.create({
          data: {
            businessId: schedule.businessId,
            employeePositionId: shift.employeePositionId,
            workDate,
            status: AttendanceRecordStatus.MISSED,
            metadata: {
              scheduleShiftId: shift.id,
              scheduleId: schedule.id,
              expectedStartTime: shiftStart.toISOString(),
              expectedEndTime: shiftEnd.toISOString(),
              source: 'scheduling_module',
            },
          },
        });
      }
    }

    logger.info('Expected attendance records created', {
      operation: 'publish_schedule',
      scheduleId: schedule.id,
      recordsCreated: assignedShifts.length,
    });
  } catch (hrError: unknown) {
    const err = hrError instanceof Error ? hrError : new Error('Unknown error');
    logger.warn('Failed to sync expected attendance records', {
      operation: 'publish_schedule',
      scheduleId: schedule.id,
      error: { message: err.message, stack: err.stack },
    });
  }
}

async function syncCalendarOnPublish(
  scheduleId: string,
  businessId: string,
  shiftCount: number
): Promise<void> {
  try {
    const { syncScheduleShiftsToCalendar } = await import('./hrScheduleService');
    await syncScheduleShiftsToCalendar(scheduleId, businessId);
    logger.info('Schedule shifts synced to calendar', {
      operation: 'publish_schedule',
      scheduleId,
      shiftCount,
    });
  } catch (calendarError: unknown) {
    const err = calendarError instanceof Error ? calendarError : new Error('Unknown error');
    logger.warn('Failed to sync schedule to calendar', {
      operation: 'publish_schedule',
      scheduleId,
      error: { message: err.message, stack: err.stack },
    });
  }
}
