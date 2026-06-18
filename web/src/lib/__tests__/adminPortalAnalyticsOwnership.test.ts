import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_ANALYTICS_SURFACES,
  ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH,
  ADMIN_CANONICAL_ANALYTICS_PATH,
  ADMIN_RETIRED_BI_PATH,
  isCanonicalAnalyticsPath,
  resolveAnalyticsTab,
} from '../adminAnalyticsOwnership';

const WEB_ROOT = join(__dirname, '../..');
const REPO_ROOT = join(__dirname, '../../../..');

describe('adminPortalAnalyticsOwnership (0C)', () => {
  it('registry declares single canonical analytics surface', () => {
    const canonical = ADMIN_ANALYTICS_SURFACES.filter((s) => s.role === 'canonical');
    expect(canonical).toHaveLength(1);
    expect(canonical[0].path).toBe(ADMIN_CANONICAL_ANALYTICS_PATH);
  });

  it('business-intelligence is retired and redirects to insights tab', () => {
    const bi = readFileSync(
      join(WEB_ROOT, 'app/admin-portal/business-intelligence/page.tsx'),
      'utf8',
    );
    expect(bi).toMatch(/redirect\(/);
    expect(bi).toContain('ADMIN_CANONICAL_ANALYTICS_INSIGHTS_PATH');
    expect(bi).not.toContain('getBusinessIntelligence');
  });

  it('sidebar has one platform analytics entry and no BI nav item', () => {
    const layout = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
    const platformSection = layout.slice(layout.indexOf("id: 'platform'"));
    expect(platformSection).toContain("path: '/admin-portal/analytics'");
    expect(layout).not.toMatch(/business-intelligence/);
  });

  it('ai-system does not fetch platform analytics or BI APIs', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/ai-system/page.tsx'), 'utf8');
    expect(source).not.toMatch(/getBusinessIntelligence/);
    expect(source).not.toMatch(/getAnalytics/);
    expect(source).not.toMatch(/combinedAnalytics/);
    expect(source).toContain(ADMIN_CANONICAL_ANALYTICS_PATH);
  });

  it('canonical analytics page supports overview and insights tabs', () => {
    const source = readFileSync(join(WEB_ROOT, 'app/admin-portal/analytics/page.tsx'), 'utf8');
    expect(source).toContain('AdminPlatformAnalyticsInsightsPanel');
    expect(source).toContain("resolveAnalyticsTab");
    expect(source).toContain('Strategic Insights');
    expect(source).not.toContain('/admin-portal/business-intelligence');
  });

  it('ownership helpers resolve tab and canonical path', () => {
    expect(resolveAnalyticsTab(null)).toBe('overview');
    expect(resolveAnalyticsTab('insights')).toBe('insights');
    expect(isCanonicalAnalyticsPath(ADMIN_CANONICAL_ANALYTICS_PATH)).toBe(true);
    expect(isCanonicalAnalyticsPath(ADMIN_RETIRED_BI_PATH)).toBe(false);
  });

  it('0C audit artifacts exist', () => {
    const docs = [
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_OWNERSHIP_MODEL.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_CONVERGENCE_PLAN.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_FILE_TARGET_MATRIX.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_IMPLEMENTATION_PLAN.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_CERTIFICATION_IMPACT.md',
      'docs/architecture/audits/ADMIN_PORTAL_ANALYTICS_EXECUTIVE_SUMMARY.md',
    ];
    for (const rel of docs) {
      expect(existsSync(join(REPO_ROOT, rel))).toBe(true);
    }
  });
});
