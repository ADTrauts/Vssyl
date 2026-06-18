import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuditService from '../admin/adminAuditService';
import { ADMIN_AUDIT_ACTIONS } from '../admin/adminAuditTaxonomy';
import * as adminSystemOpsService from '../admin/adminSystemOpsService';
import {
  configurePerformanceAlert,
  getPerformanceMetrics,
  getScalabilityMetrics,
  updateOptimizationRecommendation,
} from '../admin/adminPerformanceService';

vi.mock('../admin/adminSystemOpsService', () => ({
  getSystemHealth: vi.fn(),
}));

describe('adminPerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPerformanceMetrics returns unavailable when system health is unavailable', async () => {
    vi.mocked(adminSystemOpsService.getSystemHealth).mockResolvedValue({
      status: 'unavailable',
      cpu: null,
      memory: null,
      disk: null,
      network: null,
      uptime: null,
      responseTime: null,
      activeConnections: null,
      errorRate: null,
      timestamp: new Date(),
    });

    const metrics = await getPerformanceMetrics();

    expect(metrics.status).toBe('unavailable');
    expect(metrics.message).toBe('Performance metrics are not available');
    expect(JSON.stringify(metrics)).not.toContain('Math.random');
    expect(JSON.stringify(metrics)).not.toContain('99.9');
  });

  it('getPerformanceMetrics derives values from real system health', async () => {
    vi.mocked(adminSystemOpsService.getSystemHealth).mockResolvedValue({
      status: 'available',
      cpu: 42,
      memory: 55,
      disk: 60,
      network: 8,
      uptime: '1d',
      responseTime: 20,
      activeConnections: 5,
      errorRate: 0.02,
      timestamp: new Date('2026-06-16T12:00:00.000Z'),
    });

    const metrics = await getPerformanceMetrics();

    expect(metrics.status).toBe('available');
    const payload = metrics as Record<string, unknown>;
    const cpu = payload.cpu as Record<string, unknown> | undefined;
    const application = payload.application as Record<string, unknown> | undefined;
    const database = payload.database as Record<string, unknown> | undefined;
    expect(cpu?.usage).toBe(42);
    expect(application?.responseTime).toBe(20);
    expect(database?.status).toBe('unavailable');
  });

  it('getScalabilityMetrics returns explicit unavailable state', async () => {
    const scalability = await getScalabilityMetrics();

    expect(scalability.status).toBe('unavailable');
    expect(scalability.message).toContain('not configured');
  });

  it('updateOptimizationRecommendation emits performance audit', async () => {
    vi.spyOn(adminAuditService, 'logPerformanceAudit').mockResolvedValue(undefined);

    const result = await updateOptimizationRecommendation('rec-1', 'approve', 'admin-1');

    expect(result.id).toBe('rec-1');
    expect(adminAuditService.logPerformanceAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.OPTIMIZATION_RECOMMENDATION_UPDATE,
        adminId: 'admin-1',
      }),
    );
  });

  it('configurePerformanceAlert emits performance audit', async () => {
    vi.spyOn(adminAuditService, 'logPerformanceAudit').mockResolvedValue(undefined);

    const result = await configurePerformanceAlert({ type: 'cpu', thresholds: { max: 80 } }, 'admin-1');

    expect(result.type).toBe('cpu');
    expect(adminAuditService.logPerformanceAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.PERFORMANCE_ALERT_CONFIGURE,
        adminId: 'admin-1',
      }),
    );
  });
});
