import { JobFunction, SchedulingStrategy } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getRecommendedSchedulingConfig } from './schedulingRecommendationService';
import { SchedulingPhilosophyService } from './schedulingPhilosophyService';
import { createShiftForBusiness } from './schedulingShiftService';
import { SchedulingWorkflowError } from './schedulingServiceShared';

export async function getSchedulingRecommendationsForBusiness(params: {
  businessId: string;
  industryOverride?: string | null;
}) {
  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: { industry: true, schedulingMode: true, schedulingStrategy: true },
  });

  if (!business) {
    throw new SchedulingWorkflowError(404, 'Business not found');
  }

  const industryToUse =
    params.industryOverride && params.industryOverride.length > 0
      ? params.industryOverride
      : business.industry || null;

  const recommendation = getRecommendedSchedulingConfig(industryToUse);
  const currentConfig = business.schedulingMode
    ? { mode: business.schedulingMode, strategy: business.schedulingStrategy }
    : null;

  return {
    recommendation,
    currentConfig,
    businessIndustry: business.industry,
    industryUsed: industryToUse,
  };
}

export async function generateAIScheduleForBusiness(params: {
  businessId: string;
  scheduleId: string;
  actorUserId: string;
  strategy?: string;
  constraints?: Record<string, unknown>;
}) {
  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: { schedulingMode: true, schedulingStrategy: true },
  });

  if (!business) {
    throw new SchedulingWorkflowError(404, 'Business not found');
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: params.scheduleId },
    include: {
      shifts: {
        include: {
          employeePosition: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              position: {
                select: {
                  title: true,
                  jobFunction: true,
                  stationName: true,
                  stationType: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!schedule || schedule.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Schedule not found');
  }

  const employeePositions = await prisma.employeePosition.findMany({
    where: { businessId: params.businessId, active: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: {
        select: {
          title: true,
          jobFunction: true,
          stationName: true,
          stationType: true,
        },
      },
      availability: {
        where: {
          effectiveFrom: { lte: new Date(schedule.endDate) },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date(schedule.startDate) } },
          ],
        },
      },
    },
  });

  const selectedStrategy =
    params.strategy || business.schedulingStrategy || 'AVAILABILITY_FIRST';
  const selectedMode = business.schedulingMode || 'OTHER';

  const employees = employeePositions.map((ep) => {
    const availability = ep.availability.map((av) => {
      const startMinutes = av.startTime
        ? parseInt(av.startTime.split(':')[0], 10) * 60 +
          parseInt(av.startTime.split(':')[1], 10)
        : undefined;
      const endMinutes = av.endTime
        ? parseInt(av.endTime.split(':')[0], 10) * 60 +
          parseInt(av.endTime.split(':')[1], 10)
        : undefined;

      return {
        day: av.dayOfWeek,
        startTime: startMinutes,
        endTime: endMinutes,
        isAvailable: av.availabilityType === 'AVAILABLE',
      };
    });

    const weekShifts = schedule.shifts.filter((s) => s.employeePositionId === ep.id);
    const currentHours = weekShifts.reduce((total, shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      employeePositionId: ep.id,
      userId: ep.user.id,
      userName: ep.user.name || 'Unknown',
      positionTitle: ep.position.title,
      jobFunction: ep.position.jobFunction || undefined,
      stationName: ep.position.stationName || undefined,
      availability,
      currentHoursThisWeek: currentHours,
    };
  });

  const requirements = schedule.shifts.map((shift) => {
    const startDate = new Date(shift.startTime);
    const endDate = new Date(shift.endTime);
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

    return {
      day: dayOfWeek,
      startTime: startMinutes,
      endTime: endMinutes,
      requiredRole: undefined,
      requiredJobFunction: shift.jobFunction as JobFunction | undefined,
      requiredStation: shift.stationName || undefined,
      minStaffing: shift.minStaffing || 1,
      maxStaffing: shift.maxStaffing || 1,
      priority: shift.priority || 5,
    };
  });

  const recommendations = await SchedulingPhilosophyService.generateRecommendations({
    businessId: params.businessId,
    mode: selectedMode,
    strategy: selectedStrategy as SchedulingStrategy,
    employees,
    requirements,
    constraints: params.constraints || {},
  });

  const createdShifts = [];
  const scheduleStart = new Date(schedule.startDate);
  const scheduleEnd = new Date(schedule.endDate);

  for (const rec of recommendations) {
    const targetDate = new Date(scheduleStart);
    const targetDayIndex = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ].indexOf(rec.day);
    const startDayIndex = scheduleStart.getDay();
    const daysOffset = (targetDayIndex - startDayIndex + 7) % 7;
    targetDate.setDate(scheduleStart.getDate() + daysOffset);

    if (targetDate < scheduleStart || targetDate > scheduleEnd) {
      continue;
    }

    const startTime = new Date(targetDate);
    startTime.setHours(Math.floor(rec.startTime / 60), rec.startTime % 60, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(Math.floor(rec.endTime / 60), rec.endTime % 60, 0, 0);

    try {
      const shift = await createShiftForBusiness({
        scheduleId: schedule.id,
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        title: 'AI Generated Shift',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        employeePositionId: rec.employeePositionId,
        breakMinutes: 0,
        priority: Math.round(rec.confidence * 10),
      });
      createdShifts.push(shift);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Failed to create shift from recommendation', {
        operation: 'generate_ai_schedule',
        error: { message: error.message, stack: error.stack },
        recommendation: rec,
      });
    }
  }

  logger.info('AI schedule generated', {
    operation: 'generate_ai_schedule',
    userId: params.actorUserId,
    businessId: params.businessId,
    scheduleId: params.scheduleId,
    strategy: selectedStrategy,
    shiftsCreated: createdShifts.length,
  });

  return {
    shifts: createdShifts,
    recommendationsCount: recommendations.length,
    createdCount: createdShifts.length,
    strategy: selectedStrategy,
  };
}

export async function suggestShiftAssignmentsForBusiness(params: {
  businessId: string;
  shiftId: string;
  scheduleId?: string;
}) {
  const shift = await prisma.scheduleShift.findUnique({
    where: { id: params.shiftId },
    include: {
      schedule: true,
      employeePosition: {
        include: { user: true, position: true },
      },
    },
  });

  if (!shift || shift.businessId !== params.businessId) {
    throw new SchedulingWorkflowError(404, 'Shift not found');
  }

  if (params.scheduleId && shift.scheduleId !== params.scheduleId) {
    throw new SchedulingWorkflowError(
      400,
      'Shift does not belong to the specified schedule'
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: { schedulingStrategy: true },
  });

  const strategy = business?.schedulingStrategy || 'AVAILABILITY_FIRST';
  const startDate = new Date(shift.startTime);
  const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes =
    new Date(shift.endTime).getHours() * 60 + new Date(shift.endTime).getMinutes();

  const employeePositions = await prisma.employeePosition.findMany({
    where: { businessId: params.businessId, active: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
      position: {
        select: { title: true, jobFunction: true, stationName: true },
      },
      availability: {
        where: {
          dayOfWeek,
          availabilityType: 'AVAILABLE',
          effectiveFrom: { lte: startDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
        },
      },
    },
  });

  const availableEmployees = employeePositions.filter((ep) => {
    const dayAvail = ep.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!dayAvail || dayAvail.availabilityType !== 'AVAILABLE') return false;

    if (dayAvail.startTime && dayAvail.endTime) {
      const availStartMinutes =
        parseInt(dayAvail.startTime.split(':')[0], 10) * 60 +
        parseInt(dayAvail.startTime.split(':')[1], 10);
      const availEndMinutes =
        parseInt(dayAvail.endTime.split(':')[0], 10) * 60 +
        parseInt(dayAvail.endTime.split(':')[1], 10);
      if (startMinutes < availStartMinutes || endMinutes > availEndMinutes) {
        return false;
      }
    }

    if (shift.jobFunction && ep.position.jobFunction !== shift.jobFunction) {
      return false;
    }
    if (shift.stationName && ep.position.stationName !== shift.stationName) {
      return false;
    }

    return true;
  });

  const suggestions = availableEmployees.map((ep) => ({
    employeePositionId: ep.id,
    employee: {
      id: ep.user.id,
      name: ep.user.name,
      position: ep.position.title,
    },
    confidence: 0.8,
    reason: 'Available for this shift',
  }));

  return { suggestions, count: suggestions.length, strategy, scheduleId: shift.scheduleId };
}
