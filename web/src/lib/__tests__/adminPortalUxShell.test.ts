import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

function listAdminPortalSources(): string[] {
  const dirs = [
    join(WEB_ROOT, 'app/admin-portal'),
    join(WEB_ROOT, 'components/admin-portal'),
  ];
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
    }
  };
  for (const dir of dirs) walk(dir);
  return files;
}

describe('adminPortalUxShell (1A)', () => {
  const sources = listAdminPortalSources();

  it('no native window.confirm or browser confirm() in admin portal', () => {
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/window\.confirm/);
      expect(source, file).not.toMatch(/if\s*\(\s*!confirm\(/);
    }
  });

  it('destructive flows use useConfirm or ConfirmModal', () => {
    const required = [
      'app/admin-portal/seed-modules/page.tsx',
      'app/admin-portal/overrides/page.tsx',
      'app/admin-portal/system-logs/page.tsx',
      'app/admin-portal/users/page.tsx',
      'app/admin-portal/impersonate/page.tsx',
      'app/admin-portal/modules/page.tsx',
      'components/admin-portal/ai-pipeline/registry/PipelineIntentRegistrySection.tsx',
    ];
    for (const rel of required) {
      const source = readFileSync(join(WEB_ROOT, rel), 'utf8');
      const hasConfirm = source.includes('useConfirm') || source.includes('ConfirmModal');
      expect(hasConfirm, rel).toBe(true);
    }
  });

  it('shared empty state component is adopted in admin portal', () => {
    const withEmpty = sources.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return source.includes('AdminPortalEmptyState') || source.includes("from 'shared/components'") && source.includes('EmptyState');
    });
    expect(withEmpty.length).toBeGreaterThanOrEqual(8);
  });

  it('layout shell uses v-* design tokens', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    expect(layout).toContain('bg-v-background');
    expect(layout).toContain('bg-v-surface');
    expect(layout).toContain('text-v-text-primary');
    expect(layout).not.toContain('bg-gray-900');
  });

  it('shell primitives exist', () => {
    expect(existsSync(join(WEB_ROOT, 'components/admin-portal/AdminPortalEmptyState.tsx'))).toBe(true);
    expect(existsSync(join(WEB_ROOT, 'components/admin-portal/AdminPortalPageShell.tsx'))).toBe(true);
  });

  it('1A audit artifacts exist', () => {
    const docs = [
      'docs/architecture/audits/ADMIN_PORTAL_UX_SHELL_AUDIT.md',
      'docs/architecture/audits/ADMIN_PORTAL_UX_STANDARDIZATION_MATRIX.md',
      'docs/architecture/audits/ADMIN_PORTAL_UX_SHELL_CLOSEOUT.md',
      'docs/architecture/audits/ADMIN_PORTAL_POST_1A_READINESS_UPDATE.md',
      'docs/architecture/audits/ADMIN_PORTAL_G9_EVALUATION.md',
    ];
    for (const rel of docs) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('token drift reduced — v-* tokens dominate legacy gray-* in admin tree', () => {
    let vTokenHits = 0;
    let grayHits = 0;
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      vTokenHits += (source.match(/text-v-text-|bg-v-|border-v-/g) ?? []).length;
      grayHits += (source.match(/gray-/g) ?? []).length;
    }
    expect(vTokenHits).toBeGreaterThan(grayHits * 5);
  });
});
