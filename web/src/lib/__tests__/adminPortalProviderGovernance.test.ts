import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

  it('layout nav has single AI Pipeline entry (no duplicate provider nav)', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    const pipelineMatches = layout.match(/ai-pipeline/g) ?? [];
    expect(pipelineMatches.length).toBeGreaterThanOrEqual(1);
    expect(layout).not.toMatch(/ai-providers/);
    expect(layout).not.toMatch(/Provider Governance/);
  });
});
