import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAnalyticsService from '../admin/adminAnalyticsService';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESOURCE_TYPES,
  logSystemOpsAudit,
} from '../admin/adminAuditService';
import * as adminModuleGovernanceService from '../admin/adminModuleGovernanceService';
import { AdminService } from '../adminService';

const ADMIN_SERVICE_PATH = join(process.cwd(), 'src/services/adminService.ts');
const ADMIN_SERVICES_DIR = join(process.cwd(), 'src/services/admin');

describe('admin portal service boundary contract (1B-D / AP-F-014)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('AdminService has no direct prisma or auditLog writes', () => {
    const source = readFileSync(ADMIN_SERVICE_PATH, 'utf8');
    expect(source).not.toContain('prisma.');
    expect(source).not.toContain('auditLog.create');
  });

  it('extracted admin domain services exist for each control-plane owner', () => {
    const expected = [
      'adminImpersonationService.ts',
      'adminUserService.ts',
      'adminModerationService.ts',
      'adminModuleGovernanceService.ts',
      'adminSecurityService.ts',
      'adminBillingService.ts',
      'adminSupportService.ts',
      'adminAnalyticsService.ts',
      'adminSystemOpsService.ts',
      'adminPerformanceService.ts',
      'adminAuditService.ts',
      'adminAuditTaxonomy.ts',
      'adminAiPipelineDiagnosticsService.ts',
    ];
    const files = readdirSync(ADMIN_SERVICES_DIR);
    for (const name of expected) {
      expect(files, `missing ${name}`).toContain(name);
    }
  });

  it('non-audit admin services do not call auditLog.create directly', () => {
    const files = readdirSync(ADMIN_SERVICES_DIR).filter(
      (f) => f.endsWith('.ts') && f !== 'adminAuditService.ts',
    );
    for (const file of files) {
      const source = readFileSync(join(ADMIN_SERVICES_DIR, file), 'utf8');
      expect(source, file).not.toContain('auditLog.create');
    }
  });

  it('AdminService analytics facade delegates to adminAnalyticsService', async () => {
    vi.spyOn(adminAnalyticsService, 'getDashboardStats').mockResolvedValue({ users: 1 } as never);
    const result = await AdminService.getDashboardStats();
    expect(result).toEqual({ users: 1 });
    expect(adminAnalyticsService.getDashboardStats).toHaveBeenCalled();
  });

  it('AdminService module governance facade delegates without local persistence', async () => {
    vi.spyOn(adminModuleGovernanceService, 'getModuleStats').mockResolvedValue({
      totalSubmissions: 3,
    } as never);
    const result = await AdminService.getModuleStats();
    expect(result.totalSubmissions).toBe(3);
  });

  it('admin audit helpers remain the mutation audit entrypoint', async () => {
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({ id: 'audit-contract' } as never);
    await logSystemOpsAudit({
      adminId: 'admin-1',
      action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
      resourceId: 'rate_limit',
      details: { configKey: 'rate_limit' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
      }),
    });
  });

  it('adminAuditService is the only admin service with auditLog.create', () => {
    const files = readdirSync(ADMIN_SERVICES_DIR).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(join(ADMIN_SERVICES_DIR, file), 'utf8');
      if (file === 'adminAuditService.ts') {
        expect(source).toContain('auditLog.create');
      } else {
        expect(source, file).not.toContain('auditLog.create');
      }
    }
  });
});
