import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/schedulingPermissions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma, BusinessRole, SchedulingStrategy, JobFunction, StationType, ScheduleStatus, AttendanceRecordStatus } from '@prisma/client';
import { getRecommendedSchedulingConfig } from '../../services/schedulingRecommendationService';
import { SchedulingPhilosophyService } from '../../services/schedulingPhilosophyService';
import { getChatSocketService } from '../../services/chatSocketService';
import { requireAuthorizedBusinessId, TIME_FIELD_REGEX } from './schedulingShared';

export async function getDashboardSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [publishedSchedulesCount, openShiftsCount, upcomingShiftsCount] = await Promise.all([
      prisma.schedule.count({
        where: {
          businessId,
          status: ScheduleStatus.PUBLISHED,
          endDate: { gte: now },
        },
      }),
      prisma.scheduleShift.count({
        where: {
          businessId,
          startTime: { gte: now },
          OR: [{ employeePositionId: null }, { isOpenShift: true }],
        },
      }),
      prisma.scheduleShift.count({
        where: {
          businessId,
          startTime: { gte: now, lte: inSevenDays },
        },
      }),
    ]);

    res.json({
      publishedSchedulesCount,
      openShiftsCount,
      upcomingShiftsCount,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Failed to get scheduling dashboard summary', {
      operation: 'scheduling_dashboard_summary',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to load scheduling summary' });
  }
}

