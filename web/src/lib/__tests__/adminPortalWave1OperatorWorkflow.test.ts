import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPlatformControllerNavigationSections,
  resolvePlatformControllerActiveNavId,
} from '../../config/platformControllerNavigation';
import { resolveAnalyticsTab } from '../adminAnalyticsOwnership';

const WEB_ROOT = join(__dirname, '../..');

describe('adminPortalWave1OperatorWorkflow', () => {
  it('includes Businesses and Email Operations in sidebar', () => {
    const sections = buildPlatformControllerNavigationSections();
    const ids = sections.flatMap((s) => s.items.map((i) => i.id));
    expect(ids).toContain('businesses');
    expect(ids).toContain('email-operations');
  });

  it('resolves active nav for new operator routes', () => {
    expect(resolvePlatformControllerActiveNavId('/admin-portal/businesses')).toBe('businesses');
    expect(resolvePlatformControllerActiveNavId('/admin-portal/email-operations')).toBe('email-operations');
  });

  it('businesses and email-operations pages exist', () => {
    expect(existsSync(join(WEB_ROOT, 'app/admin-portal/businesses/page.tsx'))).toBe(true);
    expect(existsSync(join(WEB_ROOT, 'app/admin-portal/email-operations/page.tsx'))).toBe(true);
  });

  it('layout includes global operator search', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    expect(layout).toContain('OperatorGlobalSearch');
  });

  it('dashboard includes operator timeline', () => {
    const dashboard = readFileSync(join(WEB_ROOT, 'app/admin-portal/dashboard/page.tsx'), 'utf8');
    expect(dashboard).toContain('OperatorTimeline');
  });

  it('analytics supports federation tab consolidation', () => {
    expect(resolveAnalyticsTab('federation')).toBe('federation');
    const analytics = readFileSync(join(WEB_ROOT, 'app/admin-portal/analytics/page.tsx'), 'utf8');
    expect(analytics).toContain('AdminAnalyticsFederatedPanel');
    expect(analytics).toContain('Federated Metrics');
  });

  it('system page links to email operations instead of inline test', () => {
    const system = readFileSync(join(WEB_ROOT, 'app/admin-portal/system/page.tsx'), 'utf8');
    expect(system).toContain('/admin-portal/email-operations');
    expect(system).not.toContain('Send test email');
  });

  it('adminApiService exposes Wave 1 operator endpoints', () => {
    const api = readFileSync(join(WEB_ROOT, 'lib/adminApiService.ts'), 'utf8');
    expect(api).toContain('listOperatorBusinesses');
    expect(api).toContain('getEmailOperationsStatus');
    expect(api).toContain('searchOperatorConsole');
    expect(api).toContain('getOperatorTimeline');
  });
});
