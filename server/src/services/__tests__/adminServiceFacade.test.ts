import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminModuleGovernanceService from '../admin/adminModuleGovernanceService';
import { AdminService } from '../adminService';

const ADMIN_SERVICE_PATH = join(process.cwd(), 'src/services/adminService.ts');

describe('AdminService facades (1B-A.5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adminService.ts contains no direct prisma or auditLog writes', () => {
    const source = readFileSync(ADMIN_SERVICE_PATH, 'utf8');

    expect(source).not.toContain('prisma.');
    expect(source).not.toContain('auditLog.create');
    expect(source).not.toContain("import { prisma }");
  });

  it('getModuleAnalytics delegates to adminModuleGovernanceService', async () => {
    const payload = { categoryStats: [], revenueStats: [] };
    vi.spyOn(adminModuleGovernanceService, 'getModuleAnalytics').mockResolvedValue(payload as never);

    const result = await AdminService.getModuleAnalytics();

    expect(result).toBe(payload);
    expect(adminModuleGovernanceService.getModuleAnalytics).toHaveBeenCalled();
  });

  it('getDeveloperStats delegates to adminModuleGovernanceService', async () => {
    const payload = { totalDevelopers: 5 };
    vi.spyOn(adminModuleGovernanceService, 'getDeveloperStats').mockResolvedValue(payload as never);

    const result = await AdminService.getDeveloperStats();

    expect(result).toBe(payload);
    expect(adminModuleGovernanceService.getDeveloperStats).toHaveBeenCalled();
  });

  it('updateModuleStatus delegates to adminModuleGovernanceService', async () => {
    const module = { id: 'mod-1', status: 'SUSPENDED' };
    vi.spyOn(adminModuleGovernanceService, 'updateModuleStatus').mockResolvedValue(module as never);

    const result = await AdminService.updateModuleStatus('mod-1', 'SUSPENDED', 'admin-1');

    expect(result).toBe(module);
    expect(adminModuleGovernanceService.updateModuleStatus).toHaveBeenCalledWith(
      'mod-1',
      'SUSPENDED',
      'admin-1',
    );
  });

  it('exportModuleData delegates to adminModuleGovernanceService', async () => {
    vi.spyOn(adminModuleGovernanceService, 'exportModuleData').mockResolvedValue('csv');

    const result = await AdminService.exportModuleData({ status: 'PENDING' });

    expect(result).toBe('csv');
    expect(adminModuleGovernanceService.exportModuleData).toHaveBeenCalledWith({ status: 'PENDING' });
  });
});
