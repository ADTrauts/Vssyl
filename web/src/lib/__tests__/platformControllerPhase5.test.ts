import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPlatformControllerNavigationSections,
  resolvePlatformControllerActiveNavId,
} from '../../config/platformControllerNavigation';

const WEB_ROOT = join(__dirname, '../..');

describe('platformControllerPhase5 — operator visibility', () => {
  it('platform-adoption route exists', () => {
    expect(existsSync(join(WEB_ROOT, 'app/admin-portal/platform-adoption/page.tsx'))).toBe(true);
    expect(
      existsSync(join(WEB_ROOT, 'app/admin-portal/platform-adoption/[moduleId]/page.tsx')),
    ).toBe(true);
  });

  it('sidebar includes Platform Adoption under Platform Programs', () => {
    const sections = buildPlatformControllerNavigationSections();
    const platformSection = sections.find((s) => s.id === 'platform-programs');
    const labels = platformSection?.items.map((i) => i.label) ?? [];
    expect(labels).toContain('Platform Adoption');
  });

  it('resolves active nav for platform adoption', () => {
    expect(resolvePlatformControllerActiveNavId('/admin-portal/platform-adoption')).toBe(
      'platform-adoption',
    );
    expect(
      resolvePlatformControllerActiveNavId('/admin-portal/platform-adoption/drive'),
    ).toBe('platform-adoption');
  });

  it('hub uses adoption card component and API hook', () => {
    const hub = readFileSync(join(WEB_ROOT, 'app/admin-portal/platform-adoption/page.tsx'), 'utf8');
    expect(hub).toContain('PlatformAdoptionCard');
    expect(hub).toContain('usePlatformAdoptionDashboard');
  });

  it('admin API client exposes platform adoption endpoints', () => {
    const api = readFileSync(join(WEB_ROOT, 'lib/adminApiService.ts'), 'utf8');
    expect(api).toContain('getPlatformAdoptionDashboard');
    expect(api).toContain('/platform-adoption');
  });
});
