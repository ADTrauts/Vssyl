import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');

describe('adminPortalWave0Redirects', () => {
  it('ai-system redirects to ai-pipeline', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).toContain("redirect('/admin-portal/ai-pipeline')");
    expect(source).not.toContain('AISystemPage');
  });

  it('ai-context redirects to ai-pipeline diagnostics', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-context/page.tsx'), 'utf8');
    expect(source).toContain('/admin-portal/ai-pipeline/diagnostics');
  });

  it('ai-learning redirects to ai-pipeline', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-learning/page.tsx'), 'utf8');
    expect(source).toContain("redirect('/admin-portal/ai-pipeline')");
  });

  it('business-intelligence redirects to analytics insights', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/business-intelligence/page.tsx'), 'utf8');
    expect(source).toContain('ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH');
    expect(source).toContain('redirect');
  });

  it('layout uses live PlatformHealthIndicator not static System Online', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    expect(layout).toContain('PlatformHealthIndicator');
    expect(layout).not.toContain('System Online');
  });
});
