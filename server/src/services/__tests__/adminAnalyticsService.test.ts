import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import { ADMIN_AUDIT_ACTIONS } from '../admin/adminAuditTaxonomy';
import {
  createABTest,
  getDashboardStatsWithTrends,
  getDashboardSystemHealthSummary,
  getRecentDashboardActivity,
  getSystemMetricsForTimeRange,
} from '../admin/adminAnalyticsService';

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => ({
      cpu: 20,
      memory: 40,
      disk: 10,
      network: 5,
      uptime: '1d',
      responseTime: 8,
      activeConnections: 2,
      errorRate: 0,
      timestamp: new Date(),
    })),
  },
}));

describe('adminAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardSystemHealthSummary derives score from monitoring service', async () => {
    const summary = await getDashboardSystemHealthSummary();

    expect(summary.status).toBe('available');
    expect(summary.score).toBe(70);
  });

  it('getDashboardStatsWithTrends aggregates counts and growth trends', async () => {
    vi.spyOn(prisma.user, 'count').mockResolvedValue(100);
    vi.spyOn(prisma.business, 'count').mockResolvedValue(10);
    vi.spyOn(prisma.moduleSubscription, 'aggregate').mockResolvedValue({
      _sum: { amount: 500 },
    } as never);

    const stats = await getDashboardStatsWithTrends();

    expect(stats.totalUsers).toBe(100);
    expect(stats.totalBusinesses).toBe(10);
    expect(stats.monthlyRevenue).toBe(500);
    expect(stats).toHaveProperty('userGrowthTrend');
    expect(stats).toHaveProperty('systemHealthStatus', 'available');
  });

  it('getRecentDashboardActivity reads latest audit log entries', async () => {
    vi.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([
      { id: 'a-1', action: 'USER_LOGIN', user: { email: 'admin@test.com', name: 'Admin' } },
    ] as never);

    const activity = await getRecentDashboardActivity();

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { timestamp: 'desc' } }),
    );
    expect(activity).toHaveLength(1);
  });

  it('getSystemMetricsForTimeRange scopes metrics by time range', async () => {
    vi.spyOn(prisma.systemMetrics, 'findMany').mockResolvedValue([] as never);

    await getSystemMetricsForTimeRange('7d');

    expect(prisma.systemMetrics.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { timestamp: 'desc' },
      }),
    );
  });

  it('createABTest emits analytics audit', async () => {
    vi.spyOn(adminAuditService, 'logAnalyticsAudit').mockResolvedValue(undefined);

    const result = await createABTest(
      {
        name: 'Checkout CTA',
        description: 'Button color',
        variantA: { color: 'blue' },
        variantB: { color: 'green' },
        trafficSplit: 50,
        metrics: ['clicks'],
      },
      'admin-1',
    );

    expect(result.name).toBe('Checkout CTA');
    expect(result.id).toMatch(/^test_/);
    expect(adminAuditService.logAnalyticsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.AB_TEST_CREATE,
        adminId: 'admin-1',
      }),
    );
  });
});
