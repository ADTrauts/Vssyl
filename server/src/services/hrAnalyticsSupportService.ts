import { OnboardingTaskStatus, TimeOffStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function getDashboardSummary(businessId: string): Promise<{
  employeeCount: number;
  pendingTimeOffCount: number;
  pendingOnboardingCount: number;
}> {
  const [employeeCount, pendingTimeOffCount, pendingOnboardingCount] = await Promise.all([
    prisma.employeePosition.count({
      where: { businessId, active: true },
    }),
    prisma.timeOffRequest.count({
      where: { businessId, status: TimeOffStatus.PENDING },
    }),
    prisma.employeeOnboardingTask.count({
      where: {
        businessId,
        status: { notIn: [OnboardingTaskStatus.COMPLETED, OnboardingTaskStatus.CANCELLED] },
      },
    }),
  ]);

  return {
    employeeCount,
    pendingTimeOffCount,
    pendingOnboardingCount,
  };
}

export interface GenerateTimeOffReportsParams {
  businessId: string;
  startDate?: string;
  endDate?: string;
}

export async function generateTimeOffReports(params: GenerateTimeOffReportsParams) {
  const { businessId, startDate, endDate } = params;

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31);

  const requests = await prisma.timeOffRequest.findMany({
    where: {
      businessId,
      startDate: { gte: start, lte: end },
      status: { in: [TimeOffStatus.APPROVED, TimeOffStatus.PENDING] },
    },
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
  });

  const departmentUsage: Record<
    string,
    { name: string; totalDays: number; requestCount: number; employees: Set<string> }
  > = {};
  const typeUsage: Record<string, number> = {};
  let totalDays = 0;
  const totalRequests = requests.length;

  requests.forEach((request) => {
    const employeePosition = request.employeePosition;
    const deptName = employeePosition.position?.department?.name ?? 'Unassigned';
    const deptId = employeePosition.position?.department?.id ?? 'unassigned';

    if (!departmentUsage[deptId]) {
      departmentUsage[deptId] = {
        name: deptName,
        totalDays: 0,
        requestCount: 0,
        employees: new Set(),
      };
    }

    const one = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.round((request.endDate.getTime() - request.startDate.getTime()) / one) + 1
    );

    departmentUsage[deptId].totalDays += days;
    departmentUsage[deptId].requestCount += 1;
    departmentUsage[deptId].employees.add(employeePosition.userId);

    typeUsage[request.type] = (typeUsage[request.type] || 0) + days;
    totalDays += days;
  });

  const departmentStats = Object.entries(departmentUsage).map(([id, data]) => ({
    departmentId: id,
    departmentName: data.name,
    totalDays: data.totalDays,
    requestCount: data.requestCount,
    employeeCount: data.employees.size,
    averageDaysPerEmployee:
      data.employees.size > 0 ? (data.totalDays / data.employees.size).toFixed(1) : '0',
  }));

  return {
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    summary: {
      totalRequests,
      totalDays,
      averageDaysPerRequest: totalRequests > 0 ? (totalDays / totalRequests).toFixed(1) : '0',
    },
    byDepartment: departmentStats.sort((a, b) => b.totalDays - a.totalDays),
    byType: Object.entries(typeUsage).map(([type, days]) => ({
      type,
      days,
      percentage: totalDays > 0 ? ((days / totalDays) * 100).toFixed(1) : '0',
    })),
  };
}
