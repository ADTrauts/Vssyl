import { JobFunction, SchedulingStrategy } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { SchedulingPhilosophyService } from './schedulingPhilosophyService';

export type SchedulingAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

export async function aiGenerateSchedule(params: {
  userId: string;
  businessId: string;
  scheduleId: string;
  strategy?: string;
  constraints?: Record<string, unknown>;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { userId, businessId, scheduleId, strategy, constraints } = params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { schedulingMode: true, schedulingStrategy: true },
    });
    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
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
    if (!schedule) {
      return { success: false, error: 'Schedule not found' };
    }

    const employeePositions = await prisma.employeePosition.findMany({
      where: { businessId, active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        position: {
          select: { title: true, jobFunction: true, stationName: true, stationType: true },
        },
        availability: {
          where: {
            effectiveFrom: { lte: new Date(schedule.endDate) },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date(schedule.startDate) } }],
          },
        },
      },
    });

    const selectedStrategy = strategy || business.schedulingStrategy || 'AVAILABILITY_FIRST';
    const selectedMode = business.schedulingMode || 'OTHER';

    const employees = employeePositions.map((ep) => {
      const availability = ep.availability.map((av) => {
        const startMinutes = av.startTime
          ? parseInt(av.startTime.split(':')[0], 10) * 60 + parseInt(av.startTime.split(':')[1], 10)
          : undefined;
        const endMinutes = av.endTime
          ? parseInt(av.endTime.split(':')[0], 10) * 60 + parseInt(av.endTime.split(':')[1], 10)
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
      businessId,
      mode: selectedMode,
      strategy: selectedStrategy as SchedulingStrategy,
      employees,
      requirements,
      constraints: constraints || {},
    });

    const createdShifts = [];
    for (const rec of recommendations) {
      const scheduleStart = new Date(schedule.startDate);
      const scheduleEnd = new Date(schedule.endDate);
      const targetDate = new Date(scheduleStart);
      const targetDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(
        rec.day
      );
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
        const shift = await prisma.scheduleShift.create({
          data: {
            businessId,
            scheduleId: schedule.id,
            employeePositionId: rec.employeePositionId,
            startTime,
            endTime,
            breakMinutes: 0,
            title: 'AI Generated Shift',
            status: 'SCHEDULED',
            priority: Math.round(rec.confidence * 10),
          },
          include: {
            employeePosition: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                position: { select: { title: true } },
              },
            },
          },
        });
        createdShifts.push(shift);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        await logger.error('Failed to create shift from AI recommendation', {
          operation: 'scheduling_ai_generate_shift',
          error: { message: error.message, stack: error.stack },
          recommendation: rec,
        });
      }
    }

    await logger.info('AI schedule generated via action service', {
      operation: 'scheduling_ai_generate_schedule',
      userId,
      businessId,
      scheduleId,
      strategy: selectedStrategy,
      shiftsCreated: createdShifts.length,
    });

    return {
      success: true,
      data: {
        message: `Generated ${createdShifts.length} shifts using ${selectedStrategy} strategy`,
        shifts: createdShifts,
        recommendations: recommendations.length,
        created: createdShifts.length,
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to generate schedule' };
  }
}

export async function aiSuggestShiftAssignments(params: {
  userId: string;
  businessId: string;
  shiftId: string;
  scheduleId?: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { userId, businessId, shiftId, scheduleId } = params;

    const shift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        schedule: true,
        employeePosition: {
          include: { user: true, position: true },
        },
      },
    });
    if (!shift) {
      return { success: false, error: 'Shift not found' };
    }
    if (scheduleId && shift.scheduleId !== scheduleId) {
      return { success: false, error: 'Shift does not belong to the specified schedule' };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { schedulingStrategy: true },
    });
    const strategy = business?.schedulingStrategy || 'AVAILABILITY_FIRST';

    const startDate = new Date(shift.startTime);
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = new Date(shift.endTime).getHours() * 60 + new Date(shift.endTime).getMinutes();

    const employeePositions = await prisma.employeePosition.findMany({
      where: { businessId, active: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        position: { select: { title: true, jobFunction: true, stationName: true } },
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
          parseInt(dayAvail.endTime.split(':')[0], 10) * 60 + parseInt(dayAvail.endTime.split(':')[1], 10);
        if (startMinutes < availStartMinutes || endMinutes > availEndMinutes) {
          return false;
        }
      }
      if (shift.jobFunction && ep.position.jobFunction !== shift.jobFunction) return false;
      if (shift.stationName && ep.position.stationName !== shift.stationName) return false;
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

    await logger.info('Shift assignment suggestions via action service', {
      operation: 'scheduling_ai_suggest_assignments',
      userId,
      businessId,
      shiftId,
      scheduleId: shift.scheduleId,
      strategy,
    });

    return {
      success: true,
      data: { suggestions, count: suggestions.length, strategy },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to get suggestions' };
  }
}

function mapSchedulingServiceError(error: unknown): SchedulingAIActionOutcome {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'Scheduling action failed' };
}

export async function aiCreateSchedule(params: {
  userId: string;
  businessId: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  timezone?: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { createScheduleForBusiness } = await import('./schedulingScheduleService.js');
    const schedule = await createScheduleForBusiness({
      businessId: params.businessId,
      actorUserId: params.userId,
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      description: params.description,
      timezone: params.timezone,
    });
    return { success: true, data: schedule };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}

export async function aiPublishSchedule(params: {
  userId: string;
  businessId: string;
  scheduleId: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { publishBusinessSchedule } = await import('./schedulingPublishService.js');
    const { resolveManagerScope } = await import('./schedulingServiceShared.js');
    const scope = await resolveManagerScope(params.businessId, params.userId, undefined);
    const result = await publishBusinessSchedule({
      scheduleId: params.scheduleId,
      businessId: params.businessId,
      actorUserId: params.userId,
      managerScope: scope,
    });
    return { success: true, data: result };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}

export async function aiAssignShift(params: {
  userId: string;
  businessId: string;
  shiftId: string;
  employeePositionId: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { assignShiftToEmployeeByManager } = await import('./schedulingShiftService.js');
    const { resolveManagerScope } = await import('./schedulingServiceShared.js');
    const scope = await resolveManagerScope(params.businessId, params.userId, undefined);
    const shift = await assignShiftToEmployeeByManager({
      businessId: params.businessId,
      shiftId: params.shiftId,
      employeePositionId: params.employeePositionId,
      actorUserId: params.userId,
      scope,
    });
    return { success: true, data: shift };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}

export async function aiClaimOpenShift(params: {
  userId: string;
  businessId: string;
  shiftId: string;
  employeePositionId?: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { claimOpenShiftForEmployee } = await import('./schedulingShiftService.js');
    const shift = await claimOpenShiftForEmployee({
      businessId: params.businessId,
      shiftId: params.shiftId,
      userId: params.userId,
      employeePositionId: params.employeePositionId,
    });
    return { success: true, data: shift };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}

export async function aiRequestShiftSwap(params: {
  userId: string;
  businessId: string;
  shiftId: string;
  requestedToId?: string;
  reason?: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { requestShiftSwap } = await import('./schedulingSwapService.js');
    const swap = await requestShiftSwap({
      businessId: params.businessId,
      userId: params.userId,
      shiftId: params.shiftId,
      requestedToId: params.requestedToId,
      requestNotes: params.reason,
    });
    return { success: true, data: swap };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}

export async function aiSetAvailability(params: {
  userId: string;
  businessId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  availabilityType?: string;
  employeePositionId?: string;
}): Promise<SchedulingAIActionOutcome> {
  try {
    const { createOwnAvailability } = await import('./schedulingAvailabilityService.js');
    const row = await createOwnAvailability({
      businessId: params.businessId,
      userId: params.userId,
      dayOfWeek: params.dayOfWeek,
      startTime: params.startTime,
      endTime: params.endTime,
      availabilityType: params.availabilityType ?? 'AVAILABLE',
      employeePositionId: params.employeePositionId,
    });
    return { success: true, data: row };
  } catch (error: unknown) {
    return mapSchedulingServiceError(error);
  }
}
