import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('adminPortalAiControlPlaneUx (0D-F)', () => {
  it('ai-context page redirects to pipeline diagnostics', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-context/page.tsx'), 'utf8');
    expect(source).toMatch(/redirect\(/);
    expect(source).toContain('/admin-portal/ai-pipeline/diagnostics');
    expect(source).not.toContain('UserContextInspector');
    expect(source).not.toContain('Transitional surface');
  });

  it('middleware redirects /admin-portal/ai-context to pipeline diagnostics', () => {
    const source = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');
    expect(source).toMatch(/\/admin-portal\/ai-context/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline\/diagnostics/);
  });

  it('legacy ai-context components and client are removed', () => {
    const retired = [
      'components/admin-portal/UserContextInspector.tsx',
      'components/admin-portal/AIReasoningViewer.tsx',
      'components/admin-portal/ContextValidationTools.tsx',
      'components/admin-portal/CrossModuleContextMap.tsx',
      'components/admin-portal/RealTimeContextMonitor.tsx',
      'api/aiContextDebug.ts',
    ];
    for (const rel of retired) {
      expect(existsSync(join(WEB_ROOT, rel))).toBe(false);
    }
  });

  it('ai-system is a legacy redirect to the canonical AI Pipeline hub', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).toMatch(/redirect\(/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline/);
    expect(source).not.toMatch(/\/admin-portal\/ai-context/);
    expect(source).not.toMatch(/context-debug/);
    expect(source).not.toMatch(/ProviderUsageView/);
    expect(source).not.toMatch(/Quick Actions/);
  });

  it('ai-system does not embed a duplicate launcher card set', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).not.toMatch(/id: 'ai-pipeline'/);
    expect(source).not.toMatch(/id: 'provider-governance'/);
    expect(source).not.toMatch(/id: 'test-lab'/);
    expect(source).not.toMatch(/id: 'context-debug'/);
    // Sub-destinations live on the Pipeline hub / subnav, not this redirect page
    expect(source).toContain("redirect('/admin-portal/ai-pipeline')");
  });

  it('diagnostics page preserves userId deep-link query param', () => {
    const source = readFileSync(
      join(WEB_ROOT, 'app/admin-portal/ai-pipeline/diagnostics/page.tsx'),
      'utf8',
    );
    expect(source).toContain("searchParams?.get('userId')");
  });

  it('0D-F audit artifacts exist', () => {
    const docs = [
      'docs/architecture/audits/ADMIN_PORTAL_AI_CONTEXT_RETIREMENT_REPORT.md',
      'docs/architecture/audits/ADMIN_PORTAL_AI_NAVIGATION_MATRIX.md',
      'docs/architecture/audits/ADMIN_PORTAL_AI_UX_OWNERSHIP_MODEL.md',
      'docs/architecture/audits/ADMIN_PORTAL_AI_ADMIN_POST_0D_F_READINESS.md',
    ];
    for (const rel of docs) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });
});
