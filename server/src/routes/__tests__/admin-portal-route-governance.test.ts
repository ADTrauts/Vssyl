import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ADMIN_PORTAL_ROUTES_DIR = join(process.cwd(), 'src/routes/admin-portal');

const ROUTE_FILES = [
  'adminPortalRoutes.core.ts',
  'adminPortalRoutes.analyticsOps.ts',
  'adminPortalRoutes.platform.ts',
  'adminPortalRoutes.aiPipeline.ts',
  'adminPortalShared.ts',
];

function readRouteSource(filename: string): string {
  return readFileSync(join(ADMIN_PORTAL_ROUTES_DIR, filename), 'utf8');
}

function countHandlers(source: string): number {
  const matches = source.match(/router\.(get|post|put|patch|delete)\(/g);
  return matches?.length ?? 0;
}

function countPrismaCalls(source: string): number {
  const matches = source.match(/prisma\./g);
  return matches?.length ?? 0;
}

describe('admin portal route governance (1B-C)', () => {
  it('remediated route modules have zero direct prisma persistence calls', () => {
    for (const file of [
      'adminPortalRoutes.core.ts',
      'adminPortalRoutes.analyticsOps.ts',
      'adminPortalRoutes.platform.ts',
      'adminPortalShared.ts',
    ]) {
      const source = readRouteSource(file);
      expect(countPrismaCalls(source), `${file} must not call prisma.`).toBe(0);
    }
  });

  it('platform migration mutation routes delegate to adminSystemOpsService', () => {
    const source = readRouteSource('adminPortalRoutes.platform.ts');

    expect(source).toContain('adminSystemOpsService.fixFailedMigrations');
    expect(source).toContain('adminSystemOpsService.deleteMigrationRecords');
    expect(source).toContain('adminSystemOpsService.resetMigrationBaseline');
    expect(source).toContain('adminSystemOpsService.runMigrationsManually');
    expect(source).not.toContain('prisma.$executeRaw');
    expect(source).not.toContain('prisma.$queryRaw');
  });

  it('ai pipeline diagnostics routes delegate to adminAiPipelineDiagnosticsService', () => {
    const source = readRouteSource('adminPortalRoutes.aiPipeline.ts');

    expect(source).toContain('adminAiPipelineDiagnosticsService.listAdminPipelineDiagnostics');
    expect(source).toContain('adminAiPipelineDiagnosticsService.getAdminPipelineDiagnosticByTraceId');
    expect(source).not.toContain('prisma.aIConversationHistory.findMany');
    expect(source).not.toContain('prisma.aIPipelineDiagnostic.findUnique');
  });

  it('impersonation target validation lives in adminImpersonationService not adminPortalShared', () => {
    const shared = readRouteSource('adminPortalShared.ts');
    const impersonationService = readFileSync(
      join(process.cwd(), 'src/services/admin/adminImpersonationService.ts'),
      'utf8',
    );

    expect(shared).not.toContain('validateImpersonationTarget');
    expect(shared).not.toContain('prisma.user.findUnique');
    expect(impersonationService).toContain('export async function validateImpersonationTarget');
  });

  it('admin-portal route tree has no AdminService imports', () => {
    const files = readdirSync(ADMIN_PORTAL_ROUTES_DIR).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const source = readRouteSource(file);
      expect(source).not.toMatch(/from ['"].*adminService['"]/);
      expect(source).not.toContain('AdminService.');
    }
  });
});

describe('admin portal controller governance metrics (1B-C assessment inputs)', () => {
  it('records handler and prisma counts for assessment appendix', () => {
    const metrics = ROUTE_FILES.map((file) => {
      const source = readRouteSource(file);
      const handlers = countHandlers(source);
      const prismaCalls = countPrismaCalls(source);
      const lines = source.split('\n').length;
      const delegatesToService =
        (source.match(/admin\w+Service\./g)?.length ?? 0) +
        (source.match(/adminAiPipelineDiagnosticsService\./g)?.length ?? 0);
      const delegationPct =
        handlers > 0 ? Math.round((delegatesToService / handlers) * 100) : 100;
      return { file, lines, handlers, prismaCalls, delegatesToService, delegationPct };
    });

    expect(metrics.find((m) => m.file === 'adminPortalRoutes.platform.ts')?.prismaCalls).toBe(0);
    expect(metrics.find((m) => m.file === 'adminPortalShared.ts')?.prismaCalls).toBe(0);
    expect(metrics.length).toBe(ROUTE_FILES.length);
  });
});
