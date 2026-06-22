import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDashboardOverviewContext } from '../dashboardAIContextService';
import { prisma } from '../../lib/prisma';

describe('dashboardAIContextService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getDashboardOverviewContext returns bounded dashboard metadata', async () => {
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([
      {
        id: 'd1',
        name: 'My Dashboard',
        userId: 'u1',
        businessId: null,
        institutionId: null,
        householdId: null,
        preferences: {},
        createdAt: new Date('2026-01-01'),
        widgets: [{ id: 'w1', type: 'chat', config: null, position: null }],
        business: null,
        institution: null,
        household: null,
      },
    ] as never);

    const context = await getDashboardOverviewContext('u1');

    expect(context.summary.totalDashboards).toBe(1);
    expect(context.summary.widgetTypeBreakdown.chat).toBe(1);
    expect(context.dashboards[0].type).toBe('personal');
  });
});
