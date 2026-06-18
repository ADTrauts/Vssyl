import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES_DIR = join(process.cwd(), 'src/routes/admin-portal');
const ADMIN_SERVICES_DIR = join(process.cwd(), 'src/services/admin');
const ADMIN_SERVICE_PATH = join(process.cwd(), 'src/services/adminService.ts');

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function countPattern(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

describe('admin portal route architecture (1B-D / AP-F-014)', () => {
  it('admin-portal route modules have zero prisma. persistence calls', () => {
    const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(join(ROUTES_DIR, file), 'utf8');
      const prismaCalls = countPattern(source, /prisma\./g);
      expect(prismaCalls, `${file} must not call prisma.`).toBe(0);
    }
  });

  it('admin-portal routes do not import AdminService facade', () => {
    const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(join(ROUTES_DIR, file), 'utf8');
      expect(source).not.toMatch(/from ['"].*\/adminService['"]/);
      expect(source).not.toContain('AdminService.');
    }
  });

  it('adminService.ts remains facade-only (no prisma, no audit writes)', () => {
    const source = readSource('src/services/adminService.ts');
    expect(source).not.toContain('prisma.');
    expect(source).not.toContain('auditLog.create');
    expect(source).not.toContain("import { prisma }");
  });

  it('adminAuditService is the only auditLog.create path in admin services', () => {
    const files = readdirSync(ADMIN_SERVICES_DIR).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(join(ADMIN_SERVICES_DIR, file), 'utf8');
      if (file === 'adminAuditService.ts') {
        expect(source).toContain('auditLog.create');
        continue;
      }
      expect(source, `${file} must not write auditLog directly`).not.toContain('auditLog.create');
    }
  });

  it('core and analyticsOps routes delegate to admin domain services', () => {
    const core = readFileSync(join(ROUTES_DIR, 'adminPortalRoutes.core.ts'), 'utf8');
    const analyticsOps = readFileSync(join(ROUTES_DIR, 'adminPortalRoutes.analyticsOps.ts'), 'utf8');

    expect(core).toContain('adminImpersonationService.');
    expect(core).toContain('adminUserService.');
    expect(core).toContain('adminModerationService.');
    expect(analyticsOps).toContain('adminBillingService.');
    expect(analyticsOps).toContain('adminSecurityService.');
    expect(analyticsOps).toContain('adminModuleGovernanceService.');
    expect(analyticsOps).toContain('adminSystemOpsService.');
  });

  it('platform routes delegate migration mutations to adminSystemOpsService', () => {
    const platform = readFileSync(join(ROUTES_DIR, 'adminPortalRoutes.platform.ts'), 'utf8');
    expect(platform).toContain('adminSystemOpsService.fixFailedMigrations');
    expect(platform).toContain('adminSystemOpsService.deleteMigrationRecords');
    expect(platform).toContain('adminSystemOpsService.resetMigrationBaseline');
    expect(platform).toContain('adminSystemOpsService.runMigrationsManually');
    expect(platform).not.toContain('prisma.$queryRaw');
  });

  it('ai pipeline diagnostics delegate to adminAiPipelineDiagnosticsService', () => {
    const aiPipeline = readFileSync(join(ROUTES_DIR, 'adminPortalRoutes.aiPipeline.ts'), 'utf8');
    expect(aiPipeline).toContain('adminAiPipelineDiagnosticsService.listAdminPipelineDiagnostics');
    expect(aiPipeline).toContain('adminAiPipelineDiagnosticsService.getAdminPipelineDiagnosticByTraceId');
  });

  it('route architecture standard is enforceable via shared auth middleware', () => {
    const shared = readFileSync(join(ROUTES_DIR, 'adminPortalShared.ts'), 'utf8');
    const auth = readFileSync(join(ROUTES_DIR, 'adminPortalAuth.ts'), 'utf8');
    expect(shared).toContain('export const requireAdmin');
    expect(auth).toContain('adminPortalAccessMiddleware');
    expect(shared).not.toContain('validateImpersonationTarget');
  });
});
