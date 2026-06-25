import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADMIN_PORTAL_DEBUG_ENV_VAR,
  isAdminPortalDebugEnabled,
} from '../adminPortalDebugGate';

const WEB_ROOT = join(__dirname, '../..');

const DEBUG_TEST_PAGES = [
  'app/admin-portal/debug-auth/page.tsx',
  'app/admin-portal/debug-session/page.tsx',
  'app/admin-portal/test-auth/page.tsx',
  'app/admin-portal/test-api/page.tsx',
  'app/admin-portal/seed-modules/page.tsx',
  'app/admin-portal/testing/page.tsx',
];

/** Phase 1B: legacy impersonation debug routes redirect to Impersonation Lab (not gated pages). */
const DEBUG_REDIRECT_PAGES = [
  'app/admin-portal/impersonation-test/page.tsx',
  'app/admin-portal/test-impersonation/page.tsx',
];

describe('adminPortalDebugGate', () => {
  const originalEnv = process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
    } else {
      process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = originalEnv;
    }
  });

  it('returns disabled when env var is unset', () => {
    delete process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
    expect(isAdminPortalDebugEnabled()).toBe(false);
  });

  it('returns disabled when env var is not exactly true', () => {
    process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = 'false';
    expect(isAdminPortalDebugEnabled()).toBe(false);

    process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = '1';
    expect(isAdminPortalDebugEnabled()).toBe(false);
  });

  it('returns enabled only when env var is true', () => {
    process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = 'true';
    expect(isAdminPortalDebugEnabled()).toBe(true);
  });
});

describe('adminPortalDebugSurfaceGating', () => {
  it('layout and navigation config hide testing nav unless debug gate is enabled', () => {
    const layoutSource = readFileSync(
      join(WEB_ROOT, 'app/admin-portal/layout.tsx'),
      'utf8',
    );
    const navSource = readFileSync(
      join(WEB_ROOT, 'config/platformControllerNavigation.ts'),
      'utf8',
    );

    expect(layoutSource).toContain('isAdminPortalDebugEnabled');
    expect(layoutSource).toContain('isAdminPortalDebugEnabled()');
    expect(navSource).toContain("id: 'testing'");
    expect(navSource).toContain('debugGated: true');
  });

  it('debug page gate component renders unavailable state when disabled', () => {
    const gateSource = readFileSync(
      join(WEB_ROOT, 'components/admin-portal/AdminPortalDebugPageGate.tsx'),
      'utf8',
    );

    expect(gateSource).toContain('isAdminPortalDebugEnabled');
    expect(gateSource).toContain('AdminPortalDebugUnavailable');
  });

  for (const relativePath of DEBUG_TEST_PAGES) {
    it(`${relativePath} is wrapped by AdminPortalDebugPageGate`, () => {
      const source = readFileSync(join(WEB_ROOT, relativePath), 'utf8');
      expect(source).toContain('AdminPortalDebugPageGate');
    });
  }

  for (const relativePath of DEBUG_REDIRECT_PAGES) {
    it(`${relativePath} redirects to canonical impersonation lab`, () => {
      const source = readFileSync(join(WEB_ROOT, relativePath), 'utf8');
      expect(source).toContain("redirect('/admin-portal/impersonate')");
      expect(source).not.toContain('AdminPortalDebugPageGate');
    });
  }
});
