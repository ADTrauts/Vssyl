import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const CORE_ROUTE_PATH = join(
  __dirname,
  '../admin-portal/adminPortalRoutes.core.ts',
);

const systemHealthFixture = {
  cpu: 25,
  memory: 35,
  disk: 40,
  network: 8,
  uptime: '2d 1h 0m',
  responseTime: 12,
  activeConnections: 4,
  errorRate: 0.01,
  timestamp: new Date('2026-06-16T12:00:00.000Z'),
};

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => systemHealthFixture),
  },
}));

describe('GET /api/admin-portal/dashboard/stats — AP-F-005 dashboard health follow-up', () => {
  const app = createTestApp();
  let adminUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    userIdsToCleanup.push(adminUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('does not return hardcoded systemHealth 99.9', async () => {
    const response = await request(app)
      .get('/api/admin-portal/dashboard/stats')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data.systemHealth).not.toBe(99.9);
    expect(response.body.data).toHaveProperty('systemHealthStatus', 'available');
    expect(typeof response.body.data.systemHealth).toBe('number');
    expect(response.body.data).toHaveProperty('userGrowthTrend');
    expect(response.body.data).toHaveProperty('businessGrowthTrend');
    expect(response.body.data).toHaveProperty('revenueGrowthTrend');
  });

  it('exposes unavailable health when monitoring is offline', async () => {
    const { SystemMonitoringService } = await import('../../services/systemMonitoringService');
    vi.mocked(SystemMonitoringService.getSystemHealth).mockRejectedValueOnce(new Error('monitoring offline'));

    const response = await request(app)
      .get('/api/admin-portal/dashboard/stats')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(response.body.data.systemHealth).toBeNull();
    expect(response.body.data.systemHealthStatus).toBe('unavailable');
    expect(response.body.data.systemHealth).not.toBe(99.9);
  });

  it('adminPortalRoutes.core.ts contains no mock dashboard health fallback', () => {
    const source = readFileSync(CORE_ROUTE_PATH, 'utf8');

    expect(source.includes('systemHealth: 99.9')).toBe(false);
    expect(source.includes('Math.random')).toBe(false);
    expect(source.includes('adminAnalyticsService.getDashboardStatsWithTrends')).toBe(true);
  });
});
