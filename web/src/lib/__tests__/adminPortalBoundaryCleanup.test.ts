import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = join(__dirname, '../..');

describe('adminPortalBoundaryCleanup (0B-E)', () => {
  describe('AP-F-017 unused admin nav components', () => {
    it('removes unused AdminNavigation and AdminHeader components', () => {
      expect(existsSync(join(WEB_ROOT, 'components/admin-portal/AdminNavigation.tsx'))).toBe(
        false,
      );
      expect(existsSync(join(WEB_ROOT, 'components/admin-portal/AdminHeader.tsx'))).toBe(false);
    });

    it('layout remains the single nav source', () => {
      const layoutSource = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
      expect(layoutSource).toContain('adminNavigationSections');
      expect(layoutSource).not.toContain('AdminNavigation');
      expect(layoutSource).not.toContain('AdminHeader');
    });
  });

  describe('AP-F-018 governance and retention canonical routes', () => {
    it('serves governance and retention under admin-portal', () => {
      const governance = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/governance/page.tsx'),
        'utf8',
      );
      const retention = readFileSync(join(WEB_ROOT, 'app/admin-portal/retention/page.tsx'), 'utf8');

      expect(governance).toContain('GovernanceManagementDashboard');
      expect(retention).toContain('RetentionManagementDashboard');
    });

    it('redirects legacy /admin paths to canonical admin-portal routes', () => {
      const legacyGovernance = readFileSync(join(WEB_ROOT, 'app/admin/governance/page.tsx'), 'utf8');
      const legacyRetention = readFileSync(join(WEB_ROOT, 'app/admin/retention/page.tsx'), 'utf8');
      const middleware = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');

      expect(legacyGovernance).toContain("redirect('/admin-portal/governance')");
      expect(legacyRetention).toContain("redirect('/admin-portal/retention')");
      expect(middleware).toContain("pathname === '/admin/governance'");
      expect(middleware).toContain("pathname === '/admin/retention'");
    });

    it('links governance and retention in admin-portal nav', () => {
      const layoutSource = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
      expect(layoutSource).toContain("path: '/admin-portal/governance'");
      expect(layoutSource).toContain("path: '/admin-portal/retention'");
    });
  });

  describe('AP-F-019 impersonation debug surface', () => {
    it('redirects duplicate test-impersonation page to canonical impersonation-test', () => {
      const redirectPage = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/test-impersonation/page.tsx'),
        'utf8',
      );
      const middleware = readFileSync(join(WEB_ROOT, 'middleware.ts'), 'utf8');

      expect(redirectPage).toContain("redirect('/admin-portal/impersonation-test')");
      expect(middleware).toContain("pathname === '/admin-portal/test-impersonation'");
    });

    it('keeps canonical impersonation-test debug gated', () => {
      const canonical = readFileSync(
        join(WEB_ROOT, 'app/admin-portal/impersonation-test/page.tsx'),
        'utf8',
      );
      expect(canonical).toContain('AdminPortalDebugPageGate');
    });

    it('does not list test-impersonation in layout nav', () => {
      const layoutSource = readFileSync(join(WEB_ROOT, 'app/admin-portal/layout.tsx'), 'utf8');
      expect(layoutSource).not.toContain('test-impersonation');
    });
  });
});
