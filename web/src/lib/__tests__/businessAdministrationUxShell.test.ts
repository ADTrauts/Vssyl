import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

const BA_ROOTS = [
  join(WEB_ROOT, 'components/business'),
  join(WEB_ROOT, 'components/org-chart'),
  join(WEB_ROOT, 'app/business/[id]/org-chart'),
  join(WEB_ROOT, 'app/business/[id]/branding'),
  join(WEB_ROOT, 'app/business/[id]/modules'),
  join(WEB_ROOT, 'app/business/[id]/profile'),
  join(WEB_ROOT, 'app/business/[id]/workspace/settings'),
  join(WEB_ROOT, 'app/business/[id]/workspace/modules'),
  join(WEB_ROOT, 'app/business/create'),
];

function listBaSources(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
    }
  };
  for (const root of BA_ROOTS) walk(root);
  return files;
}

const REQUIRED_CONFIRM_MIGRATIONS = [
  'components/org-chart/EmployeeManager.tsx',
  'components/org-chart/PermissionManager.tsx',
  'components/business/GlobalBrandingEditor.tsx',
  'components/business/FrontPageThemeCustomizer.tsx',
  'components/business/StationsAndPositionsEditor.tsx',
  'app/business/[id]/branding/page.tsx',
  'app/business/[id]/modules/page.tsx',
];

const REQUIRED_EMPTY_STATE_SURFACES = [
  'components/org-chart/EmployeeManager.tsx',
  'components/org-chart/PermissionManager.tsx',
  'components/org-chart/OrgChartBuilder.tsx',
  'components/business/WebhookSubscriptionsShell.tsx',
  'app/business/[id]/modules/page.tsx',
  'components/business/ai/BusinessAIControlCenter.tsx',
];

describe('businessAdministrationUxShell (BA-1E)', () => {
  const sources = listBaSources();

  it('no native window.confirm or browser confirm() in BA surfaces', () => {
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/window\.confirm/);
      expect(source, file).not.toMatch(/if\s*\(\s*!confirm\(/);
      expect(source, file).not.toMatch(/if\s*\(\s*confirm\(/);
      expect(source, file).not.toMatch(/window\.prompt/);
      expect(source, file).not.toMatch(/\bprompt\(/);
    }
  });

  it('destructive flows use useConfirm or ConfirmModal', () => {
    for (const rel of REQUIRED_CONFIRM_MIGRATIONS) {
      const source = readFileSync(join(WEB_ROOT, rel), 'utf8');
      const hasConfirm = source.includes('useConfirm') || source.includes('ConfirmModal');
      expect(hasConfirm, rel).toBe(true);
    }
  });

  it('PermissionManager uses Modal for copy flow (no prompt)', () => {
    const source = readFileSync(join(WEB_ROOT, 'components/org-chart/PermissionManager.tsx'), 'utf8');
    expect(source).toContain('copyTemplateTarget');
    expect(source).toContain('<Modal');
    expect(source).not.toMatch(/\bprompt\(/);
  });

  it('BusinessAdminEmptyState adopted on key surfaces', () => {
    for (const rel of REQUIRED_EMPTY_STATE_SURFACES) {
      const source = readFileSync(join(WEB_ROOT, rel), 'utf8');
      expect(source.includes('BusinessAdminEmptyState') || source.includes("EmptyState"), rel).toBe(true);
    }
    expect(sources.filter((f) => readFileSync(f, 'utf8').includes('BusinessAdminEmptyState')).length).toBeGreaterThanOrEqual(6);
  });

  it('BusinessAdminEmptyState wrapper exists', () => {
    expect(existsSync(join(WEB_ROOT, 'components/business/BusinessAdminEmptyState.tsx'))).toBe(true);
  });

  it('v-* design tokens dominate legacy gray-* in BA tree', () => {
    let vTokenHits = 0;
    let grayHits = 0;
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      vTokenHits += (source.match(/text-v-text-|bg-v-|border-v-/g) ?? []).length;
      grayHits += (source.match(/gray-/g) ?? []).length;
    }
    expect(vTokenHits).toBeGreaterThan(grayHits * 3);
  });

  it('BA-1E audit artifacts exist', () => {
    const docs = [
      'docs/business-administration/BA_1E_UX_SHELL_AUDIT.md',
      'docs/business-administration/BA_1E_UX_STANDARDIZATION_MATRIX.md',
      'docs/business-administration/BA_1E_IMPLEMENTATION_REPORT.md',
    ];
    for (const rel of docs) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });
});
