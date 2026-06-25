import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPlatformControllerNavigationSections } from '../../config/platformControllerNavigation';

const WEB_ROOT = join(__dirname, '../..');

describe('adminPortalProviderGovernance (0D-C)', () => {
  it('canonical provider governance lives on AI Pipeline hub', () => {
    const hub = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/ai-pipeline/PipelineOperationsHub.tsx'),
      'utf8',
    );
    expect(hub).toContain('id="provider-governance"');
    expect(hub).toContain('ProviderGovernancePanel');
  });

  it('PipelineHubToolSections has single Provider Governance card', () => {
    const sections = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/ai-pipeline/PipelineHubToolSections.tsx'),
      'utf8',
    );
    const matches = sections.match(/Provider Governance/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(sections).toContain('/admin-portal/ai-pipeline#provider-governance');
  });

  it('ai-system links to pipeline hub without embedding provider charts', () => {
    const aiSystem = readFileSync(
      join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'),
      'utf8',
    );
    expect(aiSystem).not.toContain('ProviderUsageView');
    expect(aiSystem).not.toContain('Provider Usage Section');
    expect(aiSystem).toContain("path: '/admin-portal/ai-pipeline'");
  });

  it('adminApiService has no orphaned per-provider expense helpers', () => {
    const api = readFileSync(join(WEB_ROOT, 'lib/adminApiService.ts'), 'utf8');
    expect(api).not.toMatch(/getAIProviderExpensesOpenAI/);
    expect(api).not.toMatch(/getAIProviderExpensesAnthropic/);
    expect(api).toContain('getAIProviderUsageCombined');
    expect(api).toContain('getAIProviderExpensesCombined');
  });

  it('navigation config has single AI Pipeline entry and hash-based provider governance', () => {
    const sections = buildPlatformControllerNavigationSections();
    const pipelineItems = sections.flatMap((section) =>
      section.items.filter((item) => item.id === 'ai-pipeline'),
    );
    expect(pipelineItems).toHaveLength(1);

    const providerItems = sections.flatMap((section) =>
      section.items.filter((item) => item.path.includes('provider-governance')),
    );
    expect(providerItems).toHaveLength(1);
    expect(providerItems[0]?.path).toBe('/admin-portal/ai-pipeline#provider-governance');

    const navSource = readFileSync(
      join(WEB_ROOT, 'config/platformControllerNavigation.ts'),
      'utf8',
    );
    expect(navSource).not.toMatch(/\/admin-portal\/ai-providers/);
    expect(navSource).not.toMatch(/\/api\/admin\/ai-providers/);
  });
});
