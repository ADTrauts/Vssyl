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

  it('ai-system launcher has only canonical destinations', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).not.toMatch(/\/admin-portal\/ai-context/);
    expect(source).not.toMatch(/context-debug/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline/);
    expect(source).toMatch(/\/admin-portal\/ai-pipeline\/test-lab/);
    expect(source).toMatch(/#provider-governance/);
    expect(source).toMatch(/\/admin-portal\/business-ai/);
  });

  it('ai-system quick actions mirror canonical launcher set', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    const quickSection = source.slice(source.indexOf('Quick Actions'));
    expect(quickSection).not.toMatch(/\/admin-portal\/ai-context/);
    expect(quickSection).not.toMatch(/business-intelligence/);
    const destinations = [
      '/admin-portal/ai-pipeline',
      '/admin-portal/ai-pipeline/test-lab',
      '/admin-portal/ai-pipeline#provider-governance',
      '/admin-portal/business-ai',
    ];
    for (const dest of destinations) {
      expect(quickSection).toContain(dest);
    }
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
