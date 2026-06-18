import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('adminPortalDiagnosticsOwnership (0D-E)', () => {
  it('pipeline diagnostics page uses adminApiService pipeline helpers', () => {
    const page = readFileSync(
      join(WEB_ROOT, 'app/admin-portal/ai-pipeline/diagnostics/page.tsx'),
      'utf8',
    );
    expect(page).toContain('getAiPipelineDiagnostics');
    expect(page).toContain('getAiPipelineEvidence');
    expect(page).not.toContain('aiContextDebug');
  });

  it('pipeline hub links to canonical diagnostics not ai-context', () => {
    const hub = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/ai-pipeline/PipelineOperationsHub.tsx'),
      'utf8',
    );
    expect(hub).toContain('/admin-portal/ai-pipeline/diagnostics');
    expect(hub).not.toContain('/admin-portal/ai-context');
  });

  it('PipelineHubToolSections lists Response Diagnostics as Observe entry', () => {
    const sections = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/ai-pipeline/PipelineHubToolSections.tsx'),
      'utf8',
    );
    expect(sections).toContain('Response Diagnostics');
    expect(sections).toContain('/admin-portal/ai-pipeline/diagnostics');
  });

  it('ai-context page redirects to pipeline diagnostics (0D-F)', () => {
    const page = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-context/page.tsx'), 'utf8');
    expect(page).toMatch(/redirect\(/);
    expect(page).toContain('/admin-portal/ai-pipeline/diagnostics');
    expect(page).not.toContain('UserContextInspector');
  });

  it('diagnostics ownership and disposition docs exist', () => {
    const ownership = readFileSync(
      join(REPO_ROOT, 'docs/architecture/audits/ADMIN_PORTAL_DIAGNOSTICS_OWNERSHIP_MODEL.md'),
      'utf8',
    );
    const disposition = readFileSync(
      join(REPO_ROOT, 'docs/architecture/audits/ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md'),
      'utf8',
    );
    expect(ownership).toContain('AI Pipeline');
    expect(disposition).toContain('MERGE');
  });

  it('integration test file exists for pipeline routes', () => {
    const testSource = readFileSync(
      join(REPO_ROOT, 'server/src/routes/__tests__/admin-portal-ai-pipeline.test.ts'),
      'utf8',
    );
    expect(testSource).toContain('/ai-pipeline/catalog');
    expect(testSource).toContain('/ai-pipeline/diagnostics');
  });
});
