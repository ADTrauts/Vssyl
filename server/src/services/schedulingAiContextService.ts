/**
 * Scheduling AI context — canonical read path (BO-1A).
 * AI consumes context; scheduling services own persistence.
 */

import { prisma } from '../lib/prisma';

export class SchedulingAiContextError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'SchedulingAiContextError';
  }
}

export async function verifySchedulingAiContextAccess(
  userId: string,
  businessId: string
): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true },
  });
  if (!member?.isActive) {
    throw new SchedulingAiContextError(403, 'Access denied');
  }
}

export async function buildSchedulingOverviewContext(businessId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const [
    totalSchedules,
    publishedSchedules,
    draftSchedules,
    upcomingSchedules,
    totalShifts,
    openShifts,
    pendingSwaps,
  ] = await Promise.all([
    prisma.schedule.count({ where: { businessId } }),
    prisma.schedule.count({ where: { businessId, status: 'PUBLISHED' } }),
    prisma.schedule.count({ where: { businessId, status: 'DRAFT' } }),
    prisma.schedule.findMany({
      where: {
        businessId,
        status: 'PUBLISHED',
        startDate: { lte: sevenDaysFromNow },
        endDate: { gte: today },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        _count: { select: { shifts: true } },
      },
      take: 5,
    }),
    prisma.scheduleShift.count({ where: { businessId, startTime: { gte: today } } }),
    prisma.scheduleShift.count({
      where: { businessId, status: 'OPEN', startTime: { gte: today } },
    }),
    prisma.shiftSwapRequest.count({ where: { businessId, status: 'PENDING' } }),
  ]);

  return {
    context: {
      schedules: {
        total: totalSchedules,
        published: publishedSchedules,
        draft: draftSchedules,
        upcoming: upcomingSchedules.map((s) => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate.toISOString().split('T')[0],
          endDate: s.endDate.toISOString().split('T')[0],
          shiftCount: s._count.shifts,
        })),
      },
      shifts: {
        totalUpcoming: totalShifts,
        open: openShifts,
        assigned: totalShifts - openShifts,
        fillRate:
          totalShifts > 0 ? Math.round(((totalShifts - openShifts) / totalShifts) * 100) : 100,
      },
      swaps: { pending: pendingSwaps },
      summary: {
        activeSchedules: publishedSchedules,
        needsAttention: draftSchedules > 0 || openShifts > 0 || pendingSwaps > 0,
        status:
          openShifts === 0 && pendingSwaps === 0
            ? 'good'
            : openShifts > 10 || pendingSwaps > 5
              ? 'needs-attention'
              : 'normal',
      },
    },
    metadata: {
      provider: 'scheduling',
      endpoint: 'overview',
      businessId,
      timestamp: now.toISOString(),
    },
  };
}

export async function buildCoverageStatusContext(businessId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const [todayShifts, tomorrowShifts, weekShifts] = await Promise.all([
    prisma.scheduleShift.findMany({
      where: { businessId, startTime: { gte: today, lt: tomorrow } },
      include: {
        employeePosition: {
          include: {
            user: { select: { name: true, email: true } },
            position: { select: { title: true } },
          },
        },
      },
    }),
    prisma.scheduleShift.findMany({
      where: {
        businessId,
        startTime: { gte: tomorrow, lt: new Date(tomorrow.getTime() + 86400000) },
      },
      include: {
        employeePosition: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.scheduleShift.findMany({
      where: { businessId, startTime: { gte: today, lt: nextWeek } },
      select: { startTime: true, status: true },
    }),
  ]);

  const shiftsByDay = new Map<string, { total: number; open: number }>();
  weekShifts.forEach((shift) => {
    const dateStr = shift.startTime.toISOString().split('T')[0];
    if (!shiftsByDay.has(dateStr)) {
      shiftsByDay.set(dateStr, { total: 0, open: 0 });
    }
    const day = shiftsByDay.get(dateStr)!;
    day.total++;
    if (shift.status === 'OPEN') day.open++;
  });

  return {
    context: {
      today: {
        date: today.toISOString().split('T')[0],
        totalShifts: todayShifts.length,
        openShifts: todayShifts.filter((s) => s.status === 'OPEN').length,
        assignedShifts: todayShifts.filter((s) => s.status !== 'OPEN').length,
        workingEmployees: todayShifts
          .filter((s) => s.employeePosition)
          .map((s) => ({
            name: s.employeePosition?.user?.name || 'Unknown',
            position: s.employeePosition?.position?.title || 'Unknown',
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
          })),
        coverageRate:
          todayShifts.length > 0
            ? Math.round(
                (todayShifts.filter((s) => s.status !== 'OPEN').length / todayShifts.length) * 100
              )
            : 100,
      },
      tomorrow: {
        date: tomorrow.toISOString().split('T')[0],
        totalShifts: tomorrowShifts.length,
        openShifts: tomorrowShifts.filter((s) => s.status === 'OPEN').length,
        assignedShifts: tomorrowShifts.filter((s) => s.status !== 'OPEN').length,
        coverageRate:
          tomorrowShifts.length > 0
            ? Math.round(
                (tomorrowShifts.filter((s) => s.status !== 'OPEN').length / tomorrowShifts.length) *
                  100
              )
            : 100,
      },
      thisWeek: {
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        totalShifts: weekShifts.length,
        openShifts: weekShifts.filter((s) => s.status === 'OPEN').length,
        byDay: Array.from(shiftsByDay.entries()).map(([date, stats]) => ({
          date,
          totalShifts: stats.total,
          openShifts: stats.open,
          coverageRate:
            stats.total > 0 ? Math.round(((stats.total - stats.open) / stats.total) * 100) : 100,
        })),
      },
      summary: {
        currentCoverage:
          todayShifts.length > 0
            ? Math.round(
                (todayShifts.filter((s) => s.status !== 'OPEN').length / todayShifts.length) * 100
              )
            : 100,
        status:
          todayShifts.filter((s) => s.status === 'OPEN').length === 0
            ? 'fully-covered'
            : todayShifts.filter((s) => s.status === 'OPEN').length > 5
              ? 'critical'
              : 'some-gaps',
      },
    },
    metadata: {
      provider: 'scheduling',
      endpoint: 'coverage',
      businessId,
      timestamp: now.toISOString(),
    },
  };
}

export async function buildSchedulingConflictsContext(businessId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);

  const [openShifts, pendingSwaps, upcomingShifts] = await Promise.all([
    prisma.scheduleShift.findMany({
      where: {
        businessId,
        status: 'OPEN',
        startTime: { gte: today, lt: twoWeeksFromNow },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        schedule: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    }),
    prisma.shiftSwapRequest.findMany({
      where: { businessId, status: 'PENDING' },
      include: {
        originalShift: { select: { startTime: true, endTime: true } },
        requestedBy: { select: { name: true } },
      },
      take: 10,
    }),
    prisma.scheduleShift.findMany({
      where: { businessId, startTime: { gte: today, lt: twoWeeksFromNow } },
      select: { employeePositionId: true, startTime: true, endTime: true },
    }),
  ]);

  const shiftsByEmployee = new Map<string, typeof upcomingShifts>();
  upcomingShifts.forEach((shift) => {
    if (!shift.employeePositionId) return;
    const list = shiftsByEmployee.get(shift.employeePositionId) ?? [];
    list.push(shift);
    shiftsByEmployee.set(shift.employeePositionId, list);
  });

  const overlappingShifts: Array<{
    employeePositionId: string;
    shift1: { startTime: string; endTime: string };
    shift2: { startTime: string; endTime: string };
  }> = [];

  shiftsByEmployee.forEach((shifts, employeeId) => {
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const shift1 = shifts[i];
        const shift2 = shifts[j];
        if (shift1.startTime < shift2.endTime && shift2.startTime < shift1.endTime) {
          overlappingShifts.push({
            employeePositionId: employeeId,
            shift1: {
              startTime: shift1.startTime.toISOString(),
              endTime: shift1.endTime.toISOString(),
            },
            shift2: {
              startTime: shift2.startTime.toISOString(),
              endTime: shift2.endTime.toISOString(),
            },
          });
        }
      }
    }
  });

  return {
    context: {
      openShifts: {
        count: openShifts.length,
        shifts: openShifts.map((shift) => ({
          id: shift.id,
          scheduleName: shift.schedule?.name || 'Unknown',
          startTime: shift.startTime.toISOString(),
          endTime: shift.endTime.toISOString(),
          daysUntil: Math.floor((shift.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      },
      pendingSwaps: {
        count: pendingSwaps.length,
        requests: pendingSwaps.map((swap) => ({
          requestedBy: swap.requestedBy?.name || 'Unknown',
          shiftDate: swap.originalShift.startTime.toISOString().split('T')[0],
          shiftTime: `${swap.originalShift.startTime.toISOString().split('T')[1].substring(0, 5)} - ${swap.originalShift.endTime.toISOString().split('T')[1].substring(0, 5)}`,
          status: swap.status,
        })),
      },
      conflicts: {
        overlappingShifts: {
          count: overlappingShifts.length,
          details: overlappingShifts.slice(0, 5),
        },
      },
      summary: {
        totalIssues: openShifts.length + pendingSwaps.length + overlappingShifts.length,
        criticalIssues: overlappingShifts.length,
        requiresAction: openShifts.length > 0 || pendingSwaps.length > 0,
        status:
          overlappingShifts.length > 0
            ? 'has-conflicts'
            : openShifts.length > 10
              ? 'many-gaps'
              : openShifts.length > 0
                ? 'some-gaps'
                : 'all-good',
      },
    },
    metadata: {
      provider: 'scheduling',
      endpoint: 'conflicts',
      businessId,
      timestamp: now.toISOString(),
    },
  };
}
