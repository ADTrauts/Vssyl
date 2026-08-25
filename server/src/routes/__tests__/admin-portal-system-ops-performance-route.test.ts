import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ANALYTICS_OPS_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts',
);
const PLATFORM_ROUTE_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.platform.ts',
);
const PLATFORM_OPS_SERVICE_PATH = join(
  process.cwd(),
  'src/services/admin/adminPlatformOperationsService.ts',
);

describe('admin portal system ops / performance route extraction (1B-A.4)', () => {
  it('analyticsOps system routes delegate to adminSystemOpsService without inline prisma', () => {
    const source = readFileSync(ANALYTICS_OPS_PATH, 'utf8');

    expect(source).toContain('adminSystemOpsService.getSystemHealth');
    expect(source).toContain('adminSystemOpsService.getSystemConfig');
    expect(source).toContain('adminSystemOpsService.updateSystemConfig');
    expect(source).toContain('adminSystemOpsService.getBackupStatus');
    expect(source).toContain('adminSystemOpsService.createBackup');
    expect(source).toContain('adminSystemOpsService.getMaintenanceMode');
    expect(source).toContain('adminSystemOpsService.setMaintenanceMode');
    expect(source).not.toContain('prisma.systemConfig');
    expect(source).not.toContain('auditLog.create');
  });

  it('platform performance routes delegate to adminPerformanceService', () => {
    const source = readFileSync(PLATFORM_ROUTE_PATH, 'utf8');

    expect(source).toContain('adminPerformanceService.getPerformanceMetrics');
    expect(source).toContain('adminPerformanceService.getScalabilityMetrics');
    expect(source).toContain('adminPerformanceService.getOptimizationRecommendations');
    expect(source).toContain('adminPerformanceService.exportPerformanceData');
    expect(source).not.toContain('AdminService.getPerformance');
    expect(source).not.toContain('auditLog.create');
  });

  it('platform migration read routes delegate schema/migration reads to adminSystemOpsService', () => {
    const source = readFileSync(PLATFORM_ROUTE_PATH, 'utf8');

    expect(source).toContain('adminSystemOpsService.getDatabaseSchemaCheck');
    expect(source).toContain('adminSystemOpsService.listMigrations');
    expect(source).toContain('adminSystemOpsService.fixFailedMigrations');
    expect(source).toContain('adminSystemOpsService.deleteMigrationRecords');
    expect(source).toContain('adminSystemOpsService.resetMigrationBaseline');
    expect(source).toContain('adminSystemOpsService.runMigrationsManually');
    expect(source).toContain("router.post('/database/migrations/delete'");
    expect(source).toContain('enforceDangerousMigrationOpGate');
    expect(source).not.toContain('prisma.$queryRaw');
    expect(source).not.toContain('prisma.$executeRaw');
  });

  it('platform operations service probes DB via adminSystemOpsService.probeDatabaseConnection', () => {
    const source = readFileSync(PLATFORM_OPS_SERVICE_PATH, 'utf8');
    expect(source).toContain('adminSystemOpsService.probeDatabaseConnection');
  });
});
