import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import { ADMIN_AUDIT_ACTIONS } from '../admin/adminAuditTaxonomy';
import * as adminSecurityService from '../admin/adminSecurityService';
import {
  getDatabaseSchemaCheck,
  getSystemConfig,
  getSystemHealth,
  listMigrations,
  updateSystemConfig,
} from '../admin/adminSystemOpsService';

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => ({
      cpu: 30,
      memory: 45,
      disk: 50,
      network: 10,
      uptime: '2d',
      responseTime: 15,
      activeConnections: 3,
      errorRate: 0.01,
      timestamp: new Date('2026-06-16T12:00:00.000Z'),
    })),
  },
}));

describe('adminSystemOpsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSystemHealth returns available metrics from monitoring service', async () => {
    const health = await getSystemHealth();

    expect(health.status).toBe('available');
    expect(health.cpu).toBe(30);
    expect(health.memory).toBe(45);
    expect(health.uptime).not.toBe('99.9%');
  });

  it('getSystemHealth returns unavailable state when monitoring fails', async () => {
    const { SystemMonitoringService } = await import('../../services/systemMonitoringService');
    vi.mocked(SystemMonitoringService.getSystemHealth).mockRejectedValueOnce(new Error('offline'));

    const health = await getSystemHealth();

    expect(health.status).toBe('unavailable');
    expect(health.cpu).toBeNull();
    expect(health.memory).toBeNull();
  });

  it('getSystemConfig reads system configuration rows', async () => {
    vi.spyOn(prisma.systemConfig, 'findMany').mockResolvedValue([
      { configKey: 'feature_x', configValue: true, description: 'Flag', updatedBy: 'admin-1' },
    ] as never);

    const configs = await getSystemConfig();

    expect(prisma.systemConfig.findMany).toHaveBeenCalledWith({ orderBy: { updatedAt: 'desc' } });
    expect(configs).toHaveLength(1);
  });

  it('updateSystemConfig upserts and emits system ops audit', async () => {
    vi.spyOn(prisma.systemConfig, 'upsert').mockResolvedValue({
      configKey: 'rate_limit',
      configValue: 100,
      description: 'Requests/min',
    } as never);
    vi.spyOn(adminAuditService, 'logSystemOpsAudit').mockResolvedValue(undefined);

    const result = await updateSystemConfig('rate_limit', 100, 'Requests/min', 'admin-1');

    expect(result.configKey).toBe('rate_limit');
    expect(adminAuditService.logSystemOpsAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
        adminId: 'admin-1',
        resourceId: 'rate_limit',
      }),
    );
  });

  it('listMigrations maps migration statuses', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([
      {
        id: 'm-1',
        migration_name: '20260101_init',
        started_at: new Date('2026-01-01'),
        finished_at: new Date('2026-01-01'),
        checksum: 'abc',
        applied_steps_count: 1,
        rolled_back_at: null,
        logs: null,
      },
      {
        id: 'm-2',
        migration_name: '20260102_fail',
        started_at: new Date('2026-01-02'),
        finished_at: null,
        checksum: 'def',
        applied_steps_count: 0,
        rolled_back_at: null,
        logs: 'error',
      },
    ] as never);

    const summary = await listMigrations();

    expect(summary.totalMigrations).toBe(2);
    expect(summary.appliedCount).toBe(1);
    expect(summary.failedCount).toBe(1);
    expect(summary.failedMigrations).toContain('20260102_fail');
  });

  it('getDatabaseSchemaCheck reports critical table presence', async () => {
    vi.spyOn(prisma, '$queryRaw')
      .mockResolvedValueOnce([{ table_name: 'subscriptions' }] as never)
      .mockResolvedValueOnce([{ table_name: 'subscriptions' }] as never)
      .mockResolvedValueOnce([{ table_name: 'users' }, { table_name: 'subscriptions' }] as never);

    const check = await getDatabaseSchemaCheck();

    expect(check.criticalTables.length).toBeGreaterThan(0);
    expect(check).toHaveProperty('migrationStatus');
    expect(check).toHaveProperty('missingTables');
  });
});
