import { describe, expect, it, vi } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { countPendingTasksForDashboardRollup } from '../todoAnalyticsRollupService';

describe('todoAnalyticsRollupService', () => {
  it('counts pending tasks scoped to dashboard', async () => {
    const countSpy = vi.spyOn(prisma.task, 'count').mockResolvedValue(7 as never);

    const count = await countPendingTasksForDashboardRollup('d1');

    expect(count).toBe(7);
    expect(countSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dashboardId: 'd1', trashedAt: null }),
      })
    );
  });
});
