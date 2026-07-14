import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlatformControllerNavigationSections } from '../../config/platformControllerNavigation';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('adminPortalAiPipelineConsolidation (0D-D)', () => {
  it('navigation config has single canonical AI Pipeline nav entry', () => {
    const pipelineItems = buildPlatformControllerNavigationSections().flatMap((section) =>
      section.items.filter((item) => item.id === 'ai-pipeline'),
    );
    expect(pipelineItems).toHaveLength(1);
    expect(pipelineItems[0]?.path).toBe('/admin-portal/ai-pipeline');

    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    expect(layout).toContain('buildPlatformControllerNavigationSections');
  });

  it('ai-system redirects to Pipeline hub (0D-F — no duplicate launcher)', () => {
    const aiSystem = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(aiSystem).toMatch(/redirect\(/);
    expect(aiSystem).toContain("redirect('/admin-portal/ai-pipeline')");
    expect(aiSystem).not.toMatch(/id: 'context-debug'/);
    expect(aiSystem).not.toMatch(/\/admin-portal\/ai-context/);
    expect(aiSystem).not.toMatch(/Quick Actions/);
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
