import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../adminService';

const systemHealthFixture = {
  cpu: 30,
  memory: 40,
  disk: 50,
  network: 5,
  uptime: '1d 2h 3m',
  responseTime: 25,
  activeConnections: 3,
  errorRate: 0.01,
  timestamp: new Date('2026-06-16T12:00:00.000Z'),
};

vi.mock('../systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => systemHealthFixture),
  },
}));

describe('AdminService AP-F-005 mock fallback removal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardStats does not return hardcoded 99.9 system health', async () => {
    const stats = await AdminService.getDashboardStats();

    expect(stats.systemHealth).not.toBe(99.9);
    expect(stats).toHaveProperty('systemHealthStatus');
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalBusinesses).toBe('number');
  });

  it('getPerformanceMetrics returns deterministic host-backed metrics', async () => {
    const first = await AdminService.getPerformanceMetrics();
    const second = await AdminService.getPerformanceMetrics();

    expect(first.status).toBe('available');
    expect(second.status).toBe('available');
    expect(first.cpu).toMatchObject({ usage: 30 });
    expect(second.cpu).toMatchObject({ usage: 30 });
    expect(first.database).toMatchObject({ status: 'unavailable' });
    expect(JSON.stringify(first)).not.toContain('Math.random');
  });

  it('getScalabilityMetrics returns explicit unavailable status', async () => {
    const scalability = await AdminService.getScalabilityMetrics();

    expect(scalability).toMatchObject({
      status: 'unavailable',
      message: 'Scalability metrics are not configured for this environment',
    });
    expect(scalability).not.toHaveProperty('autoScaling');
  });

  it('getSystemHealth exposes unavailable state without fake percentages', async () => {
    const { SystemMonitoringService } = await import('../systemMonitoringService');
    vi.mocked(SystemMonitoringService.getSystemHealth).mockRejectedValueOnce(new Error('monitoring offline'));

    const health = await AdminService.getSystemHealth();

    expect(health).toMatchObject({
      status: 'unavailable',
      cpu: null,
      memory: null,
      disk: null,
      network: null,
      uptime: null,
      responseTime: null,
      activeConnections: null,
      errorRate: null,
    });
  });
});
