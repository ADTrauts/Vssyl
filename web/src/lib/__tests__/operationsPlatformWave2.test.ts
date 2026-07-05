import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OPERATIONS_PLATFORM_NAME,
  OPERATIONS_PLATFORM_TAGLINE,
} from '../operationsPlatformBranding';
import { buildPlatformControllerNavigationSections } from '../../config/platformControllerNavigation';

const WEB_ROOT = join(__dirname, '../..');

describe('operationsPlatformWave2', () => {
  it('exports Operations Platform branding constants', () => {
    expect(OPERATIONS_PLATFORM_NAME).toBe('Operations Platform');
    expect(OPERATIONS_PLATFORM_TAGLINE).toContain('intelligence');
  });

  it('layout uses Operations Platform terminology', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    expect(layout).toContain('OPERATIONS_PLATFORM_NAME');
    expect(layout).toContain('OPERATIONS_PLATFORM_TAGLINE');
    expect(layout).not.toContain('Platform Controller');
    expect(layout).not.toContain('>Admin Portal<');
  });

  it('dashboard includes operational intelligence panel', () => {
    const dashboard = readFileSync(join(WEB_ROOT, 'app/admin-portal/dashboard/page.tsx'), 'utf8');
    expect(dashboard).toContain('OperatorIntelligencePanel');
    expect(dashboard).toContain('Operations Overview');
  });

  it('feature flags page exists and is in nav', () => {
    expect(existsSync(join(WEB_ROOT, 'app/admin-portal/feature-flags/page.tsx'))).toBe(true);
    const ids = buildPlatformControllerNavigationSections().flatMap((s) => s.items.map((i) => i.id));
    expect(ids).toContain('feature-flags');
  });

  it('system page includes infrastructure intelligence', () => {
    const system = readFileSync(join(WEB_ROOT, 'app/admin-portal/system/page.tsx'), 'utf8');
    expect(system).toContain('InfrastructureIntelligencePanel');
  });

  it('timeline supports grouped categories', () => {
    const timeline = readFileSync(join(WEB_ROOT, 'components/admin-portal/OperatorTimeline.tsx'), 'utf8');
    expect(timeline).toContain('grouped');
    expect(timeline).toContain('Operations Timeline');
  });

  it('adminApiService exposes Wave 2 intelligence endpoints', () => {
    const api = readFileSync(join(WEB_ROOT, 'lib/adminApiService.ts'), 'utf8');
    expect(api).toContain('getOperatorIntelligence');
    expect(api).toContain('getInfrastructureIntelligence');
    expect(api).toContain('getFeatureFlags');
  });

  it('AccountSwitcher shows Operations Platform', () => {
    const sw = readFileSync(join(WEB_ROOT, 'components/AccountSwitcher.tsx'), 'utf8');
    expect(sw).toContain('Operations Platform');
    expect(sw).not.toContain('>Admin Portal<');
  });
});
