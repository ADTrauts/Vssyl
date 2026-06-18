import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES_DIR = join(process.cwd(), 'src/routes');

function readRouteSource(relativePath: string): string {
  return readFileSync(join(ROUTES_DIR, relativePath), 'utf8');
}

describe('admin portal auth consolidation (AP-F-011)', () => {
  it('defines canonical requireAdmin only in adminPortalShared', () => {
    const shared = readRouteSource('admin-portal/adminPortalShared.ts');
    expect(shared).toMatch(/export const requireAdmin/);

    const admin = readRouteSource('admin.ts');
    const testing = readRouteSource('admin-portal-testing.ts');
    expect(admin).not.toMatch(/const requireAdmin\s*=/);
    expect(testing).not.toMatch(/const requireAdmin\s*=/);
  });

  it('imports requireAdmin from adminPortalAuth in consolidated satellites', () => {
    expect(readRouteSource('admin.ts')).toMatch(
      /from ['"]\.\/admin-portal\/adminPortalAuth['"]/
    );
    expect(readRouteSource('admin-portal-testing.ts')).toMatch(
      /from ['"]\.\/admin-portal\/adminPortalAuth['"]/
    );
    expect(readRouteSource('admin-portal.ts')).toMatch(
      /from ['"]\.\/admin-portal\/adminPortalAuth['"]/
    );
  });

  it('re-exports requireAdmin from adminPortalAuth without redefining it', () => {
    const auth = readRouteSource('admin-portal/adminPortalAuth.ts');
    expect(auth).toMatch(/export \{ requireAdmin \} from '\.\/adminPortalShared'/);
    expect(auth).not.toMatch(/export const requireAdmin/);
  });

  it('documents intentional exceptions still using local requireAdmin', () => {
    const override = readRouteSource('admin-override.ts');
    const aiProviders = readRouteSource('ai-provider-usage.ts');
    expect(override).toMatch(/const requireAdmin/);
    expect(aiProviders).toMatch(/const requireAdmin/);
    expect(override).toMatch(/success:\s*false/);
  });

  it('mounts centralized-ai with requireAdmin in server index', () => {
    const indexSource = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).toMatch(
      /from '\.\/routes\/admin-portal\/adminPortalAuth'/
    );
    expect(indexSource).toMatch(/\/api\/centralized-ai[\s\S]*requireAdmin/);
  });
});
