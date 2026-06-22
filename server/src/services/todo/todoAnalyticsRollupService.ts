import { TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/**
 * Todo module — dashboard-scoped rollup for Analytics Capability federation.
 */
export async function countPendingTasksForDashboardRollup(dashboardId: string): Promise<number> {
  return prisma.task.count({
    where: {
      dashboardId,
      trashedAt: null,
      status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
    },
  });
}
