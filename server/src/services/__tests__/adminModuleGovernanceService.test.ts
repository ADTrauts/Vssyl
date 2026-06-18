import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import { ADMIN_AUDIT_ACTIONS } from '../admin/adminAuditTaxonomy';
import { getModuleStats, getModuleVersions, reviewModuleSubmission, updateModuleStatus, getDeveloperStats } from '../admin/adminModuleGovernanceService';

describe('adminModuleGovernanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getModuleStats aggregates submission and module metrics', async () => {
    vi.spyOn(prisma.moduleSubmission, 'count').mockResolvedValue(10);
    vi.spyOn(prisma.moduleSubscription, 'aggregate').mockResolvedValue({ _sum: { amount: 100 } } as never);
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([{ developerId: 'd1' }] as never);
    vi.spyOn(prisma.module, 'aggregate').mockResolvedValue({ _avg: { rating: 4.5 } } as never);
    vi.spyOn(prisma.module, 'groupBy').mockResolvedValue([{ category: 'productivity', _count: { id: 2 } }] as never);

    const stats = await getModuleStats();

    expect(stats.totalSubmissions).toBe(10);
    expect(stats.topCategory).toBe('productivity');
  });

  it('reviewModuleSubmission rejects missing submission', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue(null);

    await expect(
      reviewModuleSubmission('missing', 'approve', undefined, 'admin-1'),
    ).rejects.toThrow('Submission not found');
  });

  it('reviewModuleSubmission audits approve action', async () => {
    vi.spyOn(prisma.moduleSubmission, 'findUnique').mockResolvedValue({
      id: 'sub-1',
      status: 'PENDING',
      moduleId: 'mod-1',
      module: { id: 'mod-1', name: 'Test Module', permissions: [], version: '1.0.0' },
    } as never);
    vi.spyOn(prisma.moduleVersion, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.moduleSubmission, 'update').mockResolvedValue({
      id: 'sub-1',
      status: 'APPROVED',
      module: { name: 'Test Module' },
    } as never);
    vi.spyOn(prisma.module, 'update').mockResolvedValue({} as never);
    vi.spyOn(adminAuditService, 'logModuleGovernanceAudit').mockResolvedValue(undefined);

    await reviewModuleSubmission('sub-1', 'approve', 'looks good', 'admin-1');

    expect(adminAuditService.logModuleGovernanceAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: ADMIN_AUDIT_ACTIONS.MODULE_APPROVE, adminId: 'admin-1' }),
    );
  });

  it('getModuleVersions throws when module missing', async () => {
    vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(null);

    await expect(getModuleVersions('missing')).rejects.toThrow('Module not found');
  });

  it('updateModuleStatus updates module and emits module governance audit', async () => {
    vi.spyOn(prisma.module, 'update').mockResolvedValue({
      id: 'mod-1',
      name: 'Test Module',
      status: 'SUSPENDED',
      developer: { id: 'dev-1', name: 'Dev', email: 'dev@test.com' },
    } as never);
    vi.spyOn(adminAuditService, 'logModuleGovernanceAudit').mockResolvedValue(undefined);

    const result = await updateModuleStatus('mod-1', 'SUSPENDED', 'admin-1');

    expect(result.id).toBe('mod-1');
    expect(adminAuditService.logModuleGovernanceAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.MODULE_STATUS_UPDATE,
        adminId: 'admin-1',
        resourceId: 'mod-1',
      }),
    );
  });

  it('getDeveloperStats aggregates developer metrics', async () => {
    vi.spyOn(prisma.user, 'count').mockResolvedValue(3);
    vi.spyOn(prisma.module, 'groupBy').mockResolvedValue([{ developerId: 'd1' }] as never);
    vi.spyOn(prisma.module, 'count').mockResolvedValue(10);
    vi.spyOn(prisma.moduleSubmission, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.module, 'aggregate').mockResolvedValue({ _avg: { rating: 4.2 } } as never);
    vi.spyOn(prisma.moduleSubscription, 'aggregate').mockResolvedValue({
      _sum: { amount: 500, developerRevenue: 300, platformRevenue: 200 },
    } as never);
    vi.spyOn(prisma.developerRevenue, 'aggregate').mockResolvedValue({
      _sum: { totalRevenue: 500, developerRevenue: 300, platformRevenue: 200 },
    } as never);

    const stats = await getDeveloperStats();

    expect(stats.totalDevelopers).toBe(3);
    expect(stats.totalModules).toBe(10);
    expect(stats.financialValidation).toBeDefined();
  });
});
