import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('adminPortalAiPipelineConsolidation (0D-D)', () => {
  it('layout has single canonical AI Pipeline nav entry', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    const pipelineNav = (layout.match(/id: 'ai-pipeline'/g) ?? []).length;
    expect(pipelineNav).toBe(1);
    expect(layout).toContain("path: '/admin-portal/ai-pipeline'");
  });

  it('ai-system launcher has canonical destinations only (0D-F)', () => {
    const aiSystem = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    const pipelineCards = (aiSystem.match(/id: 'ai-pipeline'/g) ?? []).length;
    expect(pipelineCards).toBe(1);
    expect(aiSystem).toMatch(/id: 'provider-governance'/);
    expect(aiSystem).toMatch(/id: 'test-lab'/);
    expect(aiSystem).not.toMatch(/id: 'context-debug'/);
    expect(aiSystem).not.toMatch(/\/admin-portal\/ai-context/);
    const quickActions = aiSystem.slice(aiSystem.indexOf('Quick Actions'));
    expect(quickActions).toMatch(/href="\/admin-portal\/ai-pipeline"/);
    expect(quickActions).toMatch(/href="\/admin-portal\/ai-pipeline\/test-lab"/);
    expect(quickActions).toMatch(/href="\/admin-portal\/ai-pipeline#provider-governance"/);
  });

  it('pipeline hub owns sub-capability navigation via PipelineHubToolSections', () => {
    const sections = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/ai-pipeline/PipelineHubToolSections.tsx'),
      'utf8',
    );
    expect(sections).toContain('/admin-portal/ai-pipeline/diagnostics');
    expect(sections).toContain('/admin-portal/ai-pipeline/intents');
    expect(sections).toContain('/admin-portal/ai-pipeline#provider-governance');
  });

  it('surface map inventory matches route handler count', () => {
    const routeSource = readFileSync(
      join(REPO_ROOT, 'server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts'),
      'utf8',
    );
    const matches = Array.from(
      routeSource.matchAll(
        /router\.(get|post|put|patch|delete)\(\s*['"](\/ai-pipeline[^'"]*)['"]/g,
      ),
    );
    expect(matches).toHaveLength(45);
  });

  it('ownership model doc exists and references canonical prefix', () => {
    const doc = readFileSync(
      join(
        REPO_ROOT,
        'docs/architecture/audits/ADMIN_PORTAL_AI_PIPELINE_OWNERSHIP_MODEL.md',
      ),
      'utf8',
    );
    expect(doc).toContain('/api/admin-portal/ai-pipeline');
    expect(doc).toContain('Provider Governance');
    expect(doc).toContain('Diagnostics');
  });
});
