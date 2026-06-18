import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ANALYTICS_OPS_PATH = join(
  process.cwd(),
  'src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts',
);

describe('admin portal security events route (AP-F-015)', () => {
  it('defines GET /security/events exactly once', () => {
    const source = readFileSync(ANALYTICS_OPS_PATH, 'utf8');
    const matches = source.match(/router\.get\('\/security\/events'/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('keeps canonical service-backed events handler contract', () => {
    const source = readFileSync(ANALYTICS_OPS_PATH, 'utf8');
    expect(source).toContain('adminSecurityService.listSecurityEventsPaginated');
    expect(source).toContain('res.json(result)');
    expect(source).toContain('totalPages');
    expect(source).not.toContain('prisma.securityEvent.findMany');
  });

  it('retains related security routes after deduplication', () => {
    const source = readFileSync(ANALYTICS_OPS_PATH, 'utf8');
    expect(source).toContain("router.get('/security/metrics'");
    expect(source).toContain("router.get('/security/compliance'");
    expect(source).toContain("router.post('/security/events/:eventId/resolve'");
  });
});
