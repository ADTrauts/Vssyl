/**
 * HR AI context — canonical read path (BO-1A).
 * AI consumes context; HR services own persistence.
 */

import { prisma } from '../lib/prisma';
import { getOwnHrData } from './hrEmployeeService';
import { resolveManagerOccupancyForEmployeePosition } from './hrServiceShared';

export class HrAiContextError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HrAiContextError';
  }
}

export async function verifyHrAiContextAccess(userId: string, businessId: string): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true },
  });
  if (!member?.isActive) {
    throw new HrAiContextError(403, 'Access denied to this business');
  }
}

export type HrSelfManagerStatus =
  | 'assigned'
  | 'no_reports_to'
  | 'no_active_occupant'
  | 'no_position';

/**
 * Compact self employment/org facts for the authenticated member in one business.
 * Does not return directory dumps or full HR profiles.
 */
export async function buildHrSelfEmploymentContext(businessId: string, userId: string) {
  const own = await getOwnHrData(businessId, userId);
  const employee = own.employee;

  const empty = (managerStatus: HrSelfManagerStatus) => ({
    context: {
      employmentAvailable: false as const,
      positionTitle: null as string | null,
      department: null as string | null,
      managerName: null as string | null,
      managerEmail: null as string | null,
      managerStatus,
    },
    metadata: {
      provider: 'hr',
      endpoint: 'selfEmployment',
      businessId,
      timestamp: new Date().toISOString(),
      source: 'Position reporting relationship → active manager occupant',
    },
  });

  if (!employee || (employee as { stub?: boolean }).stub || !('position' in employee)) {
    return empty('no_position');
  }

  const position = employee.position as
    | {
        title?: string | null;
        department?: { name?: string | null } | null;
      }
    | null
    | undefined;

  if (!position?.title) {
    return empty('no_position');
  }

  const positionTitle = position.title;
  const department = position.department?.name ?? null;
  const employeePositionId = (employee as { id: string }).id;

  const occupancy = await resolveManagerOccupancyForEmployeePosition(
    employeePositionId,
    businessId
  );

  let managerStatus: HrSelfManagerStatus;
  let managerName: string | null = null;
  let managerEmail: string | null = null;

  if (occupancy.status === 'assigned') {
    managerStatus = 'assigned';
    managerName = occupancy.user.name;
    managerEmail = occupancy.user.email;
  } else if (occupancy.status === 'no_active_occupant') {
    managerStatus = 'no_active_occupant';
  } else {
    managerStatus = 'no_reports_to';
  }

  return {
    context: {
      employmentAvailable: true as const,
      positionTitle,
      department,
      managerName,
      managerEmail,
      managerStatus,
    },
    metadata: {
      provider: 'hr',
      endpoint: 'selfEmployment',
      businessId,
      timestamp: new Date().toISOString(),
      source: 'Position reporting relationship → active manager occupant',
    },
  };
}

export async function buildHrOverviewContext(businessId: string) {
  const [
    totalEmployees,
    activeEmployees,
    fullTimeCount,
    partTimeCount,
    contractCount,
  ] = await Promise.all([
    prisma.employeeHRProfile.count({ where: { businessId } }),
    prisma.employeeHRProfile.count({ where: { businessId, terminationDate: null } }),
    prisma.employeeHRProfile.count({
      where: { businessId, employeeType: 'FULL_TIME', terminationDate: null },
    }),
    prisma.employeeHRProfile.count({
      where: { businessId, employeeType: 'PART_TIME', terminationDate: null },
    }),
    prisma.employeeHRProfile.count({
      where: { businessId, employeeType: 'CONTRACT', terminationDate: null },
    }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHires = await prisma.employeeHRProfile.count({
    where: { businessId, hireDate: { gte: thirtyDaysAgo } },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [employeesOffToday, pendingTimeOffRequests] = await Promise.all([
    prisma.timeOffRequest.count({
      where: {
        businessId,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.timeOffRequest.count({ where: { businessId, status: 'PENDING' } }),
  ]);

  return {
    context: {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        terminated: totalEmployees - activeEmployees,
        byType: {
          fullTime: fullTimeCount,
          partTime: partTimeCount,
          contract: contractCount,
          other: activeEmployees - fullTimeCount - partTimeCount - contractCount,
        },
        recentHires: { count: recentHires, period: 'last 30 days' },
      },
      timeOff: {
        employeesOffToday,
        pendingRequests: pendingTimeOffRequests,
        status:
          employeesOffToday === 0 ? 'full-staff' : employeesOffToday > 5 ? 'low-staff' : 'normal',
      },
      summary: {
        headcount: activeEmployees,
        staffingLevel:
          employeesOffToday === 0
            ? '100%'
            : `${Math.round(((activeEmployees - employeesOffToday) / activeEmployees) * 100)}%`,
        hasPendingActions: pendingTimeOffRequests > 0,
      },
    },
    metadata: {
      provider: 'hr',
      endpoint: 'overview',
      businessId,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function buildHrHeadcountContext(businessId: string) {
  const employees = await prisma.employeePosition.findMany({
    where: { businessId, active: true },
    include: {
      position: {
        select: {
          title: true,
          department: { select: { name: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  const byDepartment = new Map<string, number>();
  const byPosition = new Map<string, number>();
  employees.forEach((emp) => {
    const deptName = emp.position?.department?.name || 'Unassigned';
    const posTitle = emp.position?.title || 'Unassigned';
    byDepartment.set(deptName, (byDepartment.get(deptName) || 0) + 1);
    byPosition.set(posTitle, (byPosition.get(posTitle) || 0) + 1);
  });

  const deptEntries = Array.from(byDepartment.entries()).sort((a, b) => b[1] - a[1]);

  return {
    context: {
      headcount: {
        total: employees.length,
        byDepartment: deptEntries.map(([name, count]) => ({ department: name, count })),
        byPosition: Array.from(byPosition.entries())
          .map(([title, count]) => ({ position: title, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        largestDepartment: {
          name: deptEntries[0]?.[0],
          count: deptEntries[0]?.[1],
        },
      },
      summary: {
        totalEmployees: employees.length,
        departmentCount: byDepartment.size,
        positionCount: byPosition.size,
        averagePerDepartment:
          byDepartment.size > 0 ? Math.round(employees.length / byDepartment.size) : 0,
      },
    },
    metadata: {
      provider: 'hr',
      endpoint: 'headcount',
      businessId,
      timestamp: new Date().toISOString(),
    },
  };
}

type TimeOffRow = {
  startDate: Date;
  endDate: Date;
  employeePositionId: string | null;
  type: string;
  createdAt: Date;
  employeePosition?: {
    user?: { name: string | null } | null;
    position?: { title: string | null } | null;
  } | null;
};

function groupTimeOffByDay(
  requests: TimeOffRow[],
  weekStart: Date,
  weekEnd: Date
): Array<{ date: string; dayOfWeek: string; employeesOff: number }> {
  const byDay: Array<{ date: string; dayOfWeek: string; employeesOff: number }> = [];
  const currentDate = new Date(weekStart);

  while (currentDate < weekEnd) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const count = requests.filter((req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const checkDate = new Date(currentDate);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    }).length;

    byDay.push({
      date: dateStr,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      employeesOff: count,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return byDay;
}

export async function buildHrTimeOffSummaryContext(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [offToday, offThisWeek, pendingRequests] = await Promise.all([
    prisma.timeOffRequest.findMany({
      where: {
        businessId,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        employeePosition: {
          include: {
            user: { select: { name: true, email: true } },
            position: { select: { title: true } },
          },
        },
      },
    }),
    prisma.timeOffRequest.findMany({
      where: {
        businessId,
        status: 'APPROVED',
        startDate: { lt: weekEnd },
        endDate: { gte: weekStart },
      },
      include: {
        employeePosition: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.timeOffRequest.findMany({
      where: { businessId, status: 'PENDING' },
      include: {
        employeePosition: { include: { user: { select: { name: true } } } },
      },
      take: 5,
    }),
  ]);

  return {
    context: {
      today: {
        date: today.toISOString().split('T')[0],
        employeesOff: offToday.map((req) => ({
          employeeName: req.employeePosition?.user?.name || 'Unknown',
          position: req.employeePosition?.position?.title || 'Unknown',
          type: req.type,
          startDate: req.startDate.toISOString().split('T')[0],
          endDate: req.endDate.toISOString().split('T')[0],
        })),
        count: offToday.length,
      },
      thisWeek: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        totalRequests: offThisWeek.length,
        uniqueEmployees: new Set(offThisWeek.map((r) => r.employeePositionId)).size,
        byDay: groupTimeOffByDay(offThisWeek, weekStart, weekEnd),
      },
      pending: {
        count: pendingRequests.length,
        requests: pendingRequests.map((req) => ({
          employeeName: req.employeePosition?.user?.name || 'Unknown',
          type: req.type,
          startDate: req.startDate.toISOString().split('T')[0],
          endDate: req.endDate.toISOString().split('T')[0],
          requestedAt: req.createdAt.toISOString(),
        })),
      },
      summary: {
        offToday: offToday.length,
        offThisWeek: new Set(offThisWeek.map((r) => r.employeePositionId)).size,
        pendingApprovals: pendingRequests.length,
        status:
          offToday.length === 0 ? 'full-staff' : offToday.length > 5 ? 'low-staff' : 'normal',
        requiresAction: pendingRequests.length > 0,
      },
    },
    metadata: {
      provider: 'hr',
      endpoint: 'timeOff',
      businessId,
      timestamp: new Date().toISOString(),
    },
  };
}
